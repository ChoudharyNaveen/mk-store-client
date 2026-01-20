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
import brandService, { fetchBrands } from '../../services/brand.service';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';
import { FormTextField, FormFileUpload, FormSelect } from '../../components/forms';
import { mergeWithDefaultFilters } from '../../utils/filterBuilder';
import type { BrandStatus, Brand } from '../../types/brand';

// Base validation schema - shared fields
const baseBrandFormSchema = {
    name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
    description: yup.string().required('Description is required'),
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
const createBrandFormSchema = (isEditMode: boolean) => {
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
        ...baseBrandFormSchema,
        file: fileValidation,
    });
};

interface BrandFormData {
    name: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    file: File | null;
}

export default function BrandForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;
    
    // Get user ID for update operations
    const userId = user?.id || 1;
    
    const [loading, setLoading] = React.useState(false);
    const [fetchingBrand, setFetchingBrand] = React.useState(isEditMode);
    const [filePreview, setFilePreview] = React.useState<string | null>(null);
    const [brandData, setBrandData] = React.useState<Brand | null>(null);
    const hasFetchedRef = React.useRef(false);

    const {
        control,
        handleSubmit,
        formState: { isValid },
        reset,
    } = useForm<BrandFormData>({
        resolver: yupResolver(createBrandFormSchema(isEditMode)) as any,
        defaultValues: {
            name: '',
            description: '',
            status: 'ACTIVE' as BrandStatus,
            file: null,
        },
        mode: 'onChange',
    });

    // Fetch brand data on mount if in edit mode
    React.useEffect(() => {
        const loadBrand = async () => {
            if (!isEditMode || !id || hasFetchedRef.current) {
                return;
            }

            // Mark as fetched to prevent duplicate calls
            hasFetchedRef.current = true;

            try {
                setFetchingBrand(true);
                // Fetch brand using fetchBrands with id filter
                const response = await fetchBrands({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    const brand = response.list[0];
                    setBrandData(brand);

                    // Set image preview from API (use logo or image)
                    const logoUrl = brand.logo || brand.image;
                    if (logoUrl) {
                        setFilePreview(logoUrl);
                    }
                } else {
                    showErrorToast('Brand not found');
                    navigate('/brands');
                }
            } catch (error) {
                console.error('Error fetching brand:', error);
                navigate('/brands');
            } finally {
                setFetchingBrand(false);
            }
        };

        loadBrand();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // Only depend on id, reset and navigate are stable

    // Helper function to build form reset data
    const buildFormResetData = React.useCallback((data: Brand) => ({
        name: data.name,
        description: data.description || '',
        status: data.status,
        file: null,
    }), []);

    // Reset form when brand data is ready
    React.useEffect(() => {
        if (isEditMode && brandData) {
            reset(buildFormResetData(brandData));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [brandData, isEditMode, buildFormResetData]);

    const onSubmit = async (data: BrandFormData) => {
        // Validation checks
        if (isEditMode) {
            if (!brandData || !id) return;
            if (!brandData.concurrencyStamp) {
                console.error('Brand concurrencyStamp is missing');
                return;
            }
        } else {
            if (!data.file) return;
            if (!selectedBranchId) {
                showErrorToast('No branch selected. Please select a branch.');
                return;
            }
        }

        setLoading(true);
        try {
            const commonData = {
                name: data.name,
                description: data.description || '',
            };

            if (isEditMode) {
                await brandService.updateBrand(id!, {
                    ...commonData,
                    updatedBy: userId,
                    concurrencyStamp: brandData!.concurrencyStamp,
                    file: data.file || undefined,
                });
                showSuccessToast('Brand updated successfully!');
            } else {
                await brandService.createBrand({
                    ...commonData,
                    branchId: selectedBranchId!,
                    vendorId: user?.vendorId || 1,
                    status: data.status as BrandStatus,
                    file: data.file!,
                });
                showSuccessToast('Brand created successfully!');
            }

            navigate('/brands');
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} brand:`, error);
            // Error toast is automatically shown by HTTP utilities
        } finally {
            setLoading(false);
        }
    };

    if (fetchingBrand) {
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
                    {isEditMode ? 'Edit Brand' : 'New Brand'}
                </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 4 }}>
                            <FormTextField
                                name="name"
                                control={control}
                                label="Name"
                                required
                                placeholder="Type here"
                                variant="outlined"
                                size="small"
                                disabled={loading}
                            />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <FormTextField
                                name="description"
                                control={control}
                                label="Description"
                                required
                                placeholder="Type here"
                                variant="outlined"
                                multiline
                                rows={4}
                                disabled={loading}
                            />
                        </Box>
                        <Box>
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

