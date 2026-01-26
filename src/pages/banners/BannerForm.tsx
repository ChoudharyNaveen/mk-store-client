import React from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Paper,
    Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import bannerService, { fetchBannerDetails } from '../../services/banner.service';
import { fetchSubCategories } from '../../services/sub-category.service';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';
import { FormSelect, FormAutocomplete, FormNumberField, FormFileUpload, FormProvider } from '../../components/forms';
import { mergeWithDefaultFilters } from '../../utils/filterBuilder';
import type { BannerStatus, Banner } from '../../types/banner';
import type { SubCategory } from '../../types/sub-category';

// File validation - shared test functions
const fileTypeTest = (value: File | null, isOptional: boolean) => {
    if (!value) return isOptional;
    return value instanceof File && value.type.startsWith('image/');
};

const fileSizeTest = (value: File | null, isOptional: boolean) => {
    if (!value) return isOptional;
    return value instanceof File && value.size <= 5 * 1024 * 1024;
};

// Validation schema
const createBannerFormSchema = (isEditMode: boolean) => {
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
        subCategoryId: yup.number().nullable().optional(),
        file: fileValidation,
        displayOrder: yup.number().min(0, 'Display order must be 0 or greater').integer('Display order must be a whole number').optional(),
        status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Status must be ACTIVE or INACTIVE').required('Status is required'),
    });
};

interface BannerFormData {
    subCategoryId: number | null;
    file: File | null;
    displayOrder: number;
    status: 'ACTIVE' | 'INACTIVE';
}

export default function BannerForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;
    
    // Get user ID for update operations
    const userId = user?.id || 1;
    
    const [loading, setLoading] = React.useState(false);
    const [fetchingBanner, setFetchingBanner] = React.useState(isEditMode);
    const [bannerData, setBannerData] = React.useState<Banner | null>(null);
    const [filePreview, setFilePreview] = React.useState<string | null>(null);
    
    // Subcategory state
    const [subCategories, setSubCategories] = React.useState<Array<{ value: number; label: string }>>([]);
    const [loadingSubCategories, setLoadingSubCategories] = React.useState(false);
    
    const hasFetchedRef = React.useRef(false);

    const methods = useForm<BannerFormData>({
        resolver: yupResolver(createBannerFormSchema(isEditMode)) as any,
        defaultValues: {
            subCategoryId: null,
            file: null,
            displayOrder: 0,
            status: 'ACTIVE' as BannerStatus,
        },
        mode: 'onChange',
    });

    const { handleSubmit, reset, formState: { isValid }, control } = methods;

    // Fetch subcategories
    React.useEffect(() => {
        const fetchSubCategoriesList = async () => {
            try {
                setLoadingSubCategories(true);
                const filters = mergeWithDefaultFilters([], vendorId, selectedBranchId);
                const response = await fetchSubCategories({
                    filters,
                    page: 0,
                    pageSize: 100,
                });

                const subCategoryOptions = (response.list || []).map((subCat: SubCategory) => ({
                    value: subCat.id,
                    label: subCat.title,
                }));

                setSubCategories(subCategoryOptions);
            } catch (error) {
                console.error('Error fetching subcategories:', error);
                // Don't show error toast as subcategory is optional
            } finally {
                setLoadingSubCategories(false);
            }
        };

        fetchSubCategoriesList();
    }, [vendorId, selectedBranchId]);

    // Fetch banner data on mount if in edit mode
    React.useEffect(() => {
        const loadBanner = async () => {
            if (!isEditMode || !id || hasFetchedRef.current) {
                return;
            }

            hasFetchedRef.current = true;

            try {
                setFetchingBanner(true);
                const banner = await fetchBannerDetails(id);

                setBannerData(banner);

                // Set image preview from API
                const imageUrl = banner.image_url;
                if (imageUrl) {
                    setFilePreview(imageUrl);
                }

                // Pre-populate form
                reset({
                    subCategoryId: banner.sub_category_id ?? null,
                    file: null, // File is not set from API
                    displayOrder: banner.display_order ?? 0,
                    status: banner.status,
                });

                // Ensure subcategory is in options
                if (banner.subCategory) {
                    setSubCategories(prev => {
                        const exists = prev.some(s => s.value === banner.subCategory!.id);
                        return exists ? prev : [{ value: banner.subCategory!.id, label: banner.subCategory!.title }, ...prev];
                    });
                }
            } catch (error) {
                console.error('Error fetching banner:', error);
                showErrorToast('Banner not found');
                navigate('/banners');
            } finally {
                setFetchingBanner(false);
            }
        };

        loadBanner();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const onSubmit = async (data: BannerFormData) => {
        // Validation checks
        if (isEditMode) {
            if (!bannerData || !id) return;
            if (!bannerData.concurrencyStamp) {
                showErrorToast('Concurrency stamp not found. Please refresh and try again.');
                return;
            }
        } else {
            if (!data.file) {
                showErrorToast('Please upload a banner image');
                return;
            }
        }

        setLoading(true);
        try {
            if (isEditMode) {
                await bannerService.updateBanner(id!, {
                    subCategoryId: data.subCategoryId,
                    file: data.file || undefined,
                    displayOrder: data.displayOrder,
                    status: data.status,
                    updatedBy: userId,
                    concurrencyStamp: bannerData!.concurrencyStamp!,
                });
                showSuccessToast('Banner updated successfully!');
            } else {
                if (!data.file) {
                    showErrorToast('Please upload a banner image');
                    return;
                }
                if (!selectedBranchId) {
                    showErrorToast('No branch selected. Please select a branch.');
                    return;
                }
                await bannerService.createBanner({
                    vendorId: vendorId,
                    branchId: selectedBranchId,
                    subCategoryId: data.subCategoryId,
                    file: data.file,
                    displayOrder: data.displayOrder,
                    status: data.status,
                });
                showSuccessToast('Banner created successfully!');
            }

            navigate('/banners');
        } catch (error: unknown) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} banner:`, error);
            if (error && typeof error === 'object' && 'status' in error && error.status === 409) {
                showErrorToast('Concurrency error: Banner was modified by another user. Please refresh and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetchingBanner) {
        return (
            <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 1 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/banners')}
                    sx={{
                        color: 'text.secondary',
                        textTransform: 'none',
                        minWidth: 'auto',
                        '&:hover': { bgcolor: 'transparent' }
                    }}
                >
                    Back
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#333', fontSize: '1.75rem' }}>
                    {isEditMode ? 'Edit Banner' : 'Create New Banner'}
                </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={4}>
                    {/* Left Column - Form Fields */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Subcategory (Optional) */}
                            <Box>
                                <FormAutocomplete
                                    name="subCategoryId"
                                    label="Subcategory (Optional)"
                                    options={subCategories}
                                    loading={loadingSubCategories}
                                    noOptionsText="No subcategories found"
                                    disabled={loading}
                                />
                            </Box>

                            {/* Display Order and Status Row */}
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormNumberField
                                        name="displayOrder"
                                        control={control}
                                        label="Display Order"
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormSelect
                                        name="status"
                                        control={control}
                                        label="Status"
                                        options={[
                                            { value: 'ACTIVE', label: 'Active' },
                                            { value: 'INACTIVE', label: 'Inactive' },
                                        ]}
                                        required
                                        disabled={loading}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* Right Column - Image Upload */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <FormFileUpload
                                name="file"
                                control={control}
                                label="Upload Banner Image"
                                required={!isEditMode}
                                accept="image/*"
                                disabled={loading}
                                preview={filePreview}
                                onPreviewChange={setFilePreview}
                                minHeight={350}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, textAlign: 'center' }}>
                                Supported formats: JPG, PNG, GIF. Max size: 5MB
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 6 }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/banners')}
                        disabled={loading}
                        sx={{
                            textTransform: 'none',
                            px: 4,
                            borderRadius: 2,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !isValid}
                        sx={{
                            bgcolor: '#204564',
                            textTransform: 'none',
                            px: 4,
                            borderRadius: 2,
                            '&:hover': {
                                bgcolor: '#1a3852',
                            },
                            '&:disabled': {
                                bgcolor: '#ccc',
                            }
                        }}
                    >
                        {loading ? 'Saving...' : isEditMode ? 'Update Banner' : 'Create Banner'}
                    </Button>
                </Box>
            </FormProvider>
        </Paper>
    );
}
