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
import offerService, { fetchOffers } from '../../services/offer.service';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';
import { FormTextField, FormFileUpload, FormSelect, FormDatePicker, FormNumberField } from '../../components/forms';
import type { OfferStatus, Offer } from '../../types/offer';

// Base validation schema - shared fields
const baseOfferFormSchema = {
    type: yup.string().oneOf(['SEASONAL', 'PROMOTIONAL', 'OTHER'], 'Type must be SEASONAL, PROMOTIONAL, or OTHER').required('Type is required'),
    code: yup.string().required('Code is required').min(2, 'Code must be at least 2 characters'),
    description: yup.string().optional().default(''),
    min_order_price: yup.number().required('Min Order Price is required').min(0, 'Min Order Price must be positive'),
    percentage: yup.number().required('Percentage is required').min(0, 'Percentage must be positive').max(100, 'Percentage cannot exceed 100'),
    start_date: yup.mixed<Date | string>().required('Start Date is required'),
    end_date: yup.mixed<Date | string>().required('End Date is required'),
    status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Status must be ACTIVE or INACTIVE').required('Status is required'),
} as const;

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
const createOfferFormSchema = (isEditMode: boolean) => {
    const fileValidation = isEditMode
        ? yup
              .mixed<File>()
              .nullable()
              .optional()
              .test('fileType', 'File must be an image', (value) => fileTypeTest(value, true))
              .test('fileSize', 'File size must be less than 5MB', (value) => fileSizeTest(value, true))
        : yup
              .mixed<File>()
              .nullable()
              .optional()
              .test('fileType', 'File must be an image', (value) => fileTypeTest(value, true))
              .test('fileSize', 'File size must be less than 5MB', (value) => fileSizeTest(value, true));

    return yup.object({
        ...baseOfferFormSchema,
        file: fileValidation,
    });
};

interface OfferFormData {
    type: 'SEASONAL' | 'PROMOTIONAL' | 'OTHER';
    code: string;
    description?: string;
    min_order_price: number;
    percentage: number;
    start_date: Date | string | null;
    end_date: Date | string | null;
    status: 'ACTIVE' | 'INACTIVE';
    file: File | null;
}

export default function OfferForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    
    // Get user ID for update operations
    const userId = user?.id || 1;
    
    const [loading, setLoading] = React.useState(false);
    const [fetchingOffer, setFetchingOffer] = React.useState(isEditMode);
    const [filePreview, setFilePreview] = React.useState<string | null>(null);
    const [offerData, setOfferData] = React.useState<Offer | null>(null);
    const hasFetchedRef = React.useRef(false);

    const {
        control,
        handleSubmit,
        formState: { isValid },
        reset,
    } = useForm<OfferFormData>({
        resolver: yupResolver(createOfferFormSchema(isEditMode)) as any,
        defaultValues: {
            type: 'SEASONAL',
            code: '',
            description: '',
            min_order_price: 0,
            percentage: 0,
            start_date: null,
            end_date: null,
            status: 'ACTIVE' as OfferStatus,
            file: null,
        },
        mode: 'onChange',
    });

    // Fetch offer data on mount if in edit mode
    React.useEffect(() => {
        const loadOffer = async () => {
            if (!isEditMode || !id || hasFetchedRef.current) {
                return;
            }

            // Mark as fetched to prevent duplicate calls
            hasFetchedRef.current = true;

            try {
                setFetchingOffer(true);
                // Fetch offer using fetchOffers with id filter
                const response = await fetchOffers({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    const offer = response.list[0];
                    // Map API response: convert concurrency_stamp (snake_case) to concurrencyStamp (camelCase)
                    const mappedOffer: Offer = {
                        ...offer,
                        concurrency_stamp: offer.concurrency_stamp || undefined,
                    };
                    setOfferData(mappedOffer);
                    
                    // Pre-populate form
                    reset({
                        type: mappedOffer.type,
                        code: mappedOffer.code,
                        description: mappedOffer.description || '',
                        min_order_price: mappedOffer.min_order_price,
                        percentage: mappedOffer.percentage,
                        start_date: new Date(mappedOffer.start_date), // Convert to Date object
                        end_date: new Date(mappedOffer.end_date), // Convert to Date object
                        status: mappedOffer.status,
                        file: null, // File is not set from API
                    });

                    // Set image preview from API
                    if (mappedOffer.image && mappedOffer.image !== 'NA') {
                        setFilePreview(mappedOffer.image);
                    }
                } else {
                    showErrorToast('Offer not found');
                    navigate('/offers');
                }
            } catch (error) {
                console.error('Error fetching offer:', error);
                navigate('/offers');
            } finally {
                setFetchingOffer(false);
            }
        };

        loadOffer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // Only depend on id, reset and navigate are stable

    const onSubmit = async (data: OfferFormData) => {
        // Validation checks
        if (isEditMode) {
            if (!offerData || !id) return;
            if (!offerData.concurrency_stamp) {
                console.error('Offer concurrency_stamp is missing');
                return;
            }
        }

        setLoading(true);
        try {
            // Format dates to ISO string format
            const startDateISO = data.start_date 
                ? (data.start_date instanceof Date 
                    ? data.start_date.toISOString() 
                    : new Date(data.start_date).toISOString())
                : '';
            const endDateISO = data.end_date 
                ? (data.end_date instanceof Date 
                    ? data.end_date.toISOString() 
                    : new Date(data.end_date).toISOString())
                : '';

            const commonData = {
                type: data.type,
                code: data.code,
                description: data.description || '',
                min_order_price: data.min_order_price,
                percentage: data.percentage,
                start_date: startDateISO,
                end_date: endDateISO,
                status: data.status as OfferStatus,
            };

            if (isEditMode) {
                await offerService.updateOffer(id!, {
                    ...commonData,
                    updated_by: userId,
                    concurrency_stamp: offerData!.concurrency_stamp,
                    image: data.file || offerData!.image || undefined,
                });
                showSuccessToast('Offer updated successfully!');
            } else {
                if (!selectedBranchId) {
                    showErrorToast('No branch selected. Please select a branch.');
                    return;
                }
                await offerService.createOffer({
                    ...commonData,
                    branchId: selectedBranchId,
                    vendorId: user?.vendorId || 1,
                    image: data.file || undefined,
                });
                showSuccessToast('Offer created successfully!');
            }

            navigate('/offers');
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} offer:`, error);
            // Error toast is automatically shown by HTTP utilities
        } finally {
            setLoading(false);
        }
    };

    if (fetchingOffer) {
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
                    {isEditMode ? 'Edit Offer' : 'New Offer'}
                </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={4}>
                    {/* Row 1 */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormSelect
                            name="type"
                            control={control}
                            label="Type"
                            required
                            disabled={loading}
                            options={[
                                { value: 'SEASONAL', label: 'Seasonal' },
                                { value: 'PROMOTIONAL', label: 'Promotional' },
                                { value: 'OTHER', label: 'Other' },
                            ]}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormTextField
                            name="code"
                            control={control}
                            label="Code"
                            required
                            placeholder="Type here"
                            variant="outlined"
                            size="small"
                            disabled={loading}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormNumberField
                            name="min_order_price"
                            control={control}
                            label="Min Order Price"
                            required
                            placeholder="Type here"
                            variant="outlined"
                            size="small"
                            disabled={loading}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormNumberField
                            name="percentage"
                            control={control}
                            label="Percentage"
                            required
                            placeholder="Type here"
                            variant="outlined"
                            size="small"
                            disabled={loading}
                        />
                    </Grid>

                    {/* Row 2 */}
                    <Grid size={{ xs: 12, md: 6 }}>
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
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormDatePicker
                            name="start_date"
                            control={control}
                            label="Start Date"
                            required
                            size="small"
                            disabled={loading}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormDatePicker
                            name="end_date"
                            control={control}
                            label="End Date"
                            required
                            size="small"
                            disabled={loading}
                        />
                    </Grid>

                    {/* Row 3 - Status and Image Upload */}
                    <Grid size={{ xs: 12, md: 3 }}>
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
                    </Grid>
                    <Grid size={{ xs: 12, md: 9 }}>
                        <FormFileUpload
                            name="file"
                            control={control}
                            label="Upload cover image"
                            required={false}
                            accept="image/*"
                            disabled={loading}
                            preview={filePreview}
                            onPreviewChange={setFilePreview}
                            minHeight={150}
                        />
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
