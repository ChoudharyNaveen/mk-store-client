import React from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import categoryService, { fetchCategories } from '../../services/category.service';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';
import { FormTextField, FormFileUpload, FormSelect } from '../../components/forms';
import type { CategoryStatus, Category } from '../../types/category';

// Base validation schema - shared fields
const baseCategoryFormSchema = {
    title: yup.string().required('Title is required').min(2, 'Title must be at least 2 characters'),
    description: yup.string().optional().default(''),
    status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Status must be ACTIVE or INACTIVE').required('Status is required'),
};

// File validation - shared test functions
const fileTypeTest = (value: File | null, isOptional: boolean) => {
    if (!value) return isOptional;
    return value instanceof File && value.type.startsWith('image/');
};

const fileSizeTest = (value: File | null, isOptional: boolean) => {
    if (!value) return isOptional;
    return value instanceof File && value.size <= 5 * 1024 * 1024;
};

// Create validation schema factory
const createCategoryFormSchema = (isEditMode: boolean) => {
    const fileValidation = isEditMode
        ? yup
              .mixed<File>()
              .nullable()
              .optional()
              .test('fileType', 'File must be an image', (value) => fileTypeTest(value, true))
              .test('fileSize', 'File size must be less than 5MB', (value) => fileSizeTest(value, true))
        : yup
              .mixed<File>()
              .required('Image file is required')
              .test('fileType', 'File must be an image', (value) => fileTypeTest(value, false))
              .test('fileSize', 'File size must be less than 5MB', (value) => fileSizeTest(value, false));

    return yup.object({
        ...baseCategoryFormSchema,
        file: fileValidation,
    });
};

interface CategoryFormData {
    title: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    file: File | null;
}

export default function CategoryForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const { user, branchId } = useAppSelector((state) => state.auth);
    
    // Get user ID for update operations
    const userId = user?.id || 1;
    
    const [loading, setLoading] = React.useState(false);
    const [fetchingCategory, setFetchingCategory] = React.useState(isEditMode);
    const [filePreview, setFilePreview] = React.useState<string | null>(null);
    const [categoryData, setCategoryData] = React.useState<Category | null>(null);
    const hasFetchedRef = React.useRef(false);

    const {
        control,
        handleSubmit,
        formState: { isValid },
        reset,
    } = useForm<CategoryFormData>({
        resolver: yupResolver(createCategoryFormSchema(isEditMode)) as any,
        defaultValues: {
            title: '',
            description: '',
            status: 'ACTIVE' as CategoryStatus,
            file: null,
        },
        mode: 'onChange',
    });

    // Fetch category data on mount if in edit mode
    React.useEffect(() => {
        const loadCategory = async () => {
            if (!isEditMode || !id || hasFetchedRef.current) {
                return;
            }

            // Mark as fetched to prevent duplicate calls
            hasFetchedRef.current = true;

            try {
                setFetchingCategory(true);
                // Fetch category using fetchCategories with id filter
                const response = await fetchCategories({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    const category = response.list[0];
                    // Map API response: convert concurrency_stamp (snake_case) to concurrencyStamp (camelCase)
                    const mappedCategory: Category = {
                        ...category,
                        concurrencyStamp: (category as Category & { concurrency_stamp?: string }).concurrency_stamp || category.concurrencyStamp,
                    };
                    setCategoryData(mappedCategory);
                    
                    // Pre-populate form
                    reset({
                        title: mappedCategory.title,
                        description: mappedCategory.description || '',
                        status: mappedCategory.status,
                        file: null, // File is not set from API
                    });

                    // Set image preview from API
                    if (mappedCategory.image) {
                        setFilePreview(mappedCategory.image);
                    }
                } else {
                    showErrorToast('Category not found');
                    navigate('/category');
                }
            } catch (error) {
                console.error('Error fetching category:', error);
                navigate('/category');
            } finally {
                setFetchingCategory(false);
            }
        };

        loadCategory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // Only depend on id, reset and navigate are stable

    const onSubmit = async (data: CategoryFormData) => {
        // Validation checks
        if (isEditMode) {
            if (!categoryData || !id) return;
            if (!categoryData.concurrencyStamp) {
                console.error('Category concurrencyStamp is missing');
                return;
            }
        } else {
            if (!data.file) return;
        }

        setLoading(true);
        try {
            const commonData = {
                title: data.title,
                description: data.description || '',
            };

            if (isEditMode) {
                await categoryService.updateCategory(id!, {
                    ...commonData,
                    updatedBy: userId,
                    concurrencyStamp: categoryData!.concurrencyStamp,
                    file: data.file || undefined,
                });
                showSuccessToast('Category updated successfully!');
            } else {
                await categoryService.createCategory({
                    ...commonData,
                    branchId: branchId || 1,
                    vendorId: user?.vendorId || 1,
                    status: data.status as CategoryStatus,
                    file: data.file!,
                });
                showSuccessToast('Category created successfully!');
            }

            navigate('/category');
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, error);
            // Error toast is automatically shown by HTTP utilities
        } finally {
            setLoading(false);
        }
    };

    if (fetchingCategory) {
        return (
            <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{
                        color: 'text.secondary',
                        textTransform: 'none',
                        minWidth: 'auto',
                        '&:hover': { bgcolor: 'transparent' }
                    }}
                >
                    Back
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 500, color: '#333', fontSize: '1.75rem' }}>
                    {isEditMode ? 'Edit Category' : 'New Category'}
                </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 4 }}>
                            <FormTextField
                                name="title"
                                control={control}
                                label="Title"
                                required
                                placeholder="Type here"
                                variant="outlined"
                                size="small"
                                disabled={loading}
                            />
                        </Box>
                        <Box>
                            <FormTextField
                                name="description"
                                control={control}
                                label="Description"
                                placeholder="Type here"
                                variant="outlined"
                                multiline
                                rows={6}
                                disabled={loading}
                            />
                        </Box>
                        <Box sx={{ mt: 4 }}>
                            <FormSelect
                                name="status"
                                control={control}
                                label="Status"
                                required
                                disabled={loading}
                                options={[
                                    { value: 'ACTIVE', label: 'Active' },
                                    { value: 'INACTIVE', label: 'Inactive' },
                                ]}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <FormFileUpload
                                name="file"
                                control={control}
                                label="Upload cover image"
                                required={!isEditMode}
                                accept="image/*"
                                disabled={loading}
                                preview={filePreview}
                                onPreviewChange={setFilePreview}
                                minHeight={250}
                            />
                        </Box>
                    </Grid>
                </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 6 }}>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !isValid}
                    sx={{
                        bgcolor: '#204564',
                        color: 'white',
                        px: 6,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#1a3852' },
                        '&:disabled': { bgcolor: '#ccc', color: '#666' }
                    }}
                >
                    {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                            {isEditMode ? 'Updating...' : 'Submitting...'}
                        </Box>
                    ) : (
                        isEditMode ? 'Update' : 'Submit'
                    )}
                </Button>
                <Button
                    type="button"
                    variant="contained"
                    disabled={loading}
                    onClick={() => navigate(-1)}
                    sx={{
                        bgcolor: '#e0e0e0',
                        color: '#333',
                        px: 6,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#d5d5d5' }
                    }}
                >
                    Cancel
                </Button>
            </Box>
            </Box>
        </Paper>
    );
}
