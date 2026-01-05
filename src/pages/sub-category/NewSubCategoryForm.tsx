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
import subCategoryService, { fetchSubCategories } from '../../services/sub-category.service';
import { fetchCategories } from '../../services/category.service';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';
import { FormTextField, FormFileUpload, FormSelect, FormAutocomplete } from '../../components/forms';
import { mergeWithDefaultFilters } from '../../utils/filterBuilder';
import type { SubCategoryStatus, SubCategory } from '../../types/sub-category';
import type { Category } from '../../types/category';

// Base validation schema - shared fields
const baseSubCategoryFormSchema = {
    title: yup.string().required('Title is required').min(2, 'Title must be at least 2 characters'),
    description: yup.string().optional().default(''),
    categoryId: yup.number().required('Category is required').min(1, 'Please select a category'),
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
const createSubCategoryFormSchema = (isEditMode: boolean) => {
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
        ...baseSubCategoryFormSchema,
        file: fileValidation,
    });
};

interface SubCategoryFormData {
    title: string;
    description?: string;
    categoryId: number;
    status: 'ACTIVE' | 'INACTIVE';
    file: File | null;
}

export default function SubCategoryForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;
    
    // Get user ID for update operations
    const userId = user?.id || 1;
    
    const [loading, setLoading] = React.useState(false);
    const [fetchingSubCategory, setFetchingSubCategory] = React.useState(isEditMode);
    const [filePreview, setFilePreview] = React.useState<string | null>(null);
    const [subCategoryData, setSubCategoryData] = React.useState<SubCategory | null>(null);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = React.useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = React.useState('');
    const categorySearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const hasFetchedRef = React.useRef(false);

    const {
        control,
        handleSubmit,
        formState: { isValid },
        reset,
    } = useForm<SubCategoryFormData>({
        resolver: yupResolver(createSubCategoryFormSchema(isEditMode)) as any,
        defaultValues: {
            title: '',
            description: '',
            categoryId: 0,
            status: 'ACTIVE' as SubCategoryStatus,
            file: null,
        },
        mode: 'onChange',
    });

    // Fetch categories with debounced search
    React.useEffect(() => {
        // Clear existing timeout
        if (categorySearchTimeoutRef.current) {
            clearTimeout(categorySearchTimeoutRef.current);
        }

        // Set new timeout for debounce (500ms)
        categorySearchTimeoutRef.current = setTimeout(async () => {
            try {
                setLoadingCategories(true);
                
                // Build filters: vendorId, branchId, and title (iLike) if search term exists
                const additionalFilters: Array<{ key: string; iLike: string }> = [];
                if (categorySearchTerm) {
                    additionalFilters.push({
                        key: 'title',
                        iLike: categorySearchTerm,
                    });
                }
                
                const filters = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
                
                const response = await fetchCategories({
                    filters,
                    page: 0,
                    pageSize: 20,
                });
                setCategories(response.list || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
                showErrorToast('Failed to load categories');
            } finally {
                setLoadingCategories(false);
            }
        }, categorySearchTerm ? 500 : 0); // No debounce on initial load, 500ms debounce on search

        // Cleanup timeout on unmount or when dependencies change
        return () => {
            if (categorySearchTimeoutRef.current) {
                clearTimeout(categorySearchTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categorySearchTerm]); // vendorId and selectedBranchId are stable from store

    // Fetch sub-category data on mount if in edit mode
    React.useEffect(() => {
        const loadSubCategory = async () => {
            if (!isEditMode || !id || hasFetchedRef.current) {
                return;
            }

            // Mark as fetched to prevent duplicate calls
            hasFetchedRef.current = true;

            try {
                setFetchingSubCategory(true);
                // Fetch sub-category using fetchSubCategories with id filter
                const response = await fetchSubCategories({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    const subCategory = response.list[0];
                    // Map API response: convert concurrency_stamp (snake_case) to concurrencyStamp (camelCase)
                    const mappedSubCategory: SubCategory = {
                        ...subCategory,
                        categoryId: subCategory.category?.id || 0,
                        concurrencyStamp: (subCategory as SubCategory & { concurrency_stamp?: string }).concurrency_stamp || subCategory.concurrencyStamp,
                    };
                    setSubCategoryData(mappedSubCategory);
                    
                    // Fetch the specific category to ensure it's in the options list
                    if (mappedSubCategory.categoryId) {
                        try {
                            const categoryResponse = await fetchCategories({
                                filters: [{ key: 'id', eq: String(mappedSubCategory.categoryId) }],
                                page: 0,
                                pageSize: 1,
                            });
                            
                            if (categoryResponse.list?.[0]) {
                                const category = categoryResponse.list[0];
                                // Add the category to the list if it's not already there
                                setCategories(prev => {
                                    const exists = prev.some(cat => cat.id === category.id);
                                    return exists ? prev : [category, ...prev];
                                });
                            }
                        } catch (error) {
                            console.error('Error fetching category for edit:', error);
                        }
                    }

                    // Set image preview from API
                    if (mappedSubCategory.image) {
                        setFilePreview(mappedSubCategory.image);
                    }
                } else {
                    showErrorToast('Sub-category not found');
                    navigate('/sub-category');
                }
            } catch (error) {
                console.error('Error fetching sub-category:', error);
                navigate('/sub-category');
            } finally {
                setFetchingSubCategory(false);
            }
        };

        loadSubCategory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // Only depend on id, reset and navigate are stable

    // Helper function to build form reset data
    const buildFormResetData = React.useCallback((data: SubCategory) => ({
        title: data.title,
        description: data.description || '',
        categoryId: data.categoryId || 0,
        status: data.status,
        file: null,
    }), []);

    // Reset form when sub-category data and category are ready
    React.useEffect(() => {
        if (isEditMode && subCategoryData) {
            // If categoryId exists, wait for category to be in the list; otherwise reset immediately
            const shouldReset = !subCategoryData.categoryId || categories.some(cat => cat.id === subCategoryData.categoryId);
            if (shouldReset) {
                reset(buildFormResetData(subCategoryData));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subCategoryData, categories, isEditMode, buildFormResetData]);

    const onSubmit = async (data: SubCategoryFormData) => {
        // Validation checks
        if (isEditMode) {
            if (!subCategoryData || !id) return;
            if (!subCategoryData.concurrencyStamp) {
                console.error('Sub-category concurrencyStamp is missing');
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
                await subCategoryService.updateSubCategory(id!, {
                    ...commonData,
                    updatedBy: userId,
                    concurrencyStamp: subCategoryData!.concurrencyStamp,
                    file: data.file || undefined,
                });
                showSuccessToast('Sub-category updated successfully!');
            } else {
                if (!selectedBranchId) {
                    showErrorToast('No branch selected. Please select a branch.');
                    return;
                }
                await subCategoryService.createSubCategory({
                    ...commonData,
                    categoryId: data.categoryId,
                    branchId: selectedBranchId,
                    vendorId: user?.vendorId || 1,
                    status: data.status as SubCategoryStatus,
                    file: data.file!,
                });
                showSuccessToast('Sub-category created successfully!');
            }

            navigate('/sub-category');
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} sub-category:`, error);
            // Error toast is automatically shown by HTTP utilities
        } finally {
            setLoading(false);
        }
    };

    if (fetchingSubCategory) {
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
                    {isEditMode ? 'Edit Sub Category' : 'New Sub Category'}
                </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 4 }}>
                            <FormAutocomplete
                                name="categoryId"
                                control={control}
                                label="Category"
                                required
                                disabled={loading || isEditMode}
                                loading={loadingCategories}
                                options={categories.map(cat => ({
                                    value: cat.id,
                                    label: cat.title,
                                }))}
                                onInputChange={(_, newInputValue) => {
                                    setCategorySearchTerm(newInputValue);
                                }}
                                size="small"
                            />
                        </Box>
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
                                rows={4}
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
