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
import promocodeService, { fetchPromocodes } from '../../services/promo-code.service';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';
import { FormTextField, FormSelect, FormDatePicker, FormNumberField } from '../../components/forms';
import type { PromocodeType, PromocodeStatus, Promocode } from '../../types/promo-code';

// Base validation schema - shared fields
const basePromocodeFormSchema = {
    type: yup.string().oneOf(['PERCENTAGE', 'FLAT'], 'Type must be PERCENTAGE or FLAT').required('Type is required'),
    code: yup.string().required('Code is required').min(2, 'Code must be at least 2 characters'),
    description: yup.string().optional().default(''),
    percentage: yup.number().required('Percentage is required').min(0, 'Percentage must be positive').max(100, 'Percentage cannot exceed 100'),
    discount: yup.number().optional().min(0, 'Discount must be positive'),
    start_date: yup.mixed<Date | string>().required('Start Date is required'),
    end_date: yup.mixed<Date | string>().required('End Date is required'),
    status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Status must be ACTIVE or INACTIVE').required('Status is required'),
} as const;

// Create validation schema factory
const createPromocodeFormSchema = (isEditMode: boolean) => {
    return yup.object({
        ...basePromocodeFormSchema,
    });
};

interface PromocodeFormData {
    type: 'PERCENTAGE' | 'FLAT';
    code: string;
    description?: string;
    percentage: number;
    discount?: number;
    start_date: Date | string | null;
    end_date: Date | string | null;
    status: 'ACTIVE' | 'INACTIVE';
}

export default function PromocodeForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    
    // Get user ID for update operations
    const userId = user?.id || 1;
    
    const [loading, setLoading] = React.useState(false);
    const [fetchingPromocode, setFetchingPromocode] = React.useState(isEditMode);
    const [promocodeData, setPromocodeData] = React.useState<Promocode | null>(null);
    const hasFetchedRef = React.useRef(false);

    const {
        control,
        handleSubmit,
        formState: { isValid },
        reset,
    } = useForm<PromocodeFormData>({
        resolver: yupResolver(createPromocodeFormSchema(isEditMode)) as any,
        defaultValues: {
            type: 'PERCENTAGE',
            code: '',
            description: '',
            percentage: 0,
            discount: undefined,
            start_date: null,
            end_date: null,
            status: 'ACTIVE' as PromocodeStatus,
        },
        mode: 'onChange',
    });

    // Fetch promocode data on mount if in edit mode
    React.useEffect(() => {
        const loadPromocode = async () => {
            if (!isEditMode || !id || hasFetchedRef.current) {
                return;
            }

            // Mark as fetched to prevent duplicate calls
            hasFetchedRef.current = true;

            try {
                setFetchingPromocode(true);
                // Fetch promocode using fetchPromocodes with id filter
                const response = await fetchPromocodes({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    const promocode = response.list[0];
                    // Map API response
                    const mappedPromocode: Promocode = {
                        ...promocode,
                        concurrency_stamp: promocode.concurrency_stamp || undefined,
                    };
                    setPromocodeData(mappedPromocode);
                    
                    // Pre-populate form
                    reset({
                        type: mappedPromocode.type,
                        code: mappedPromocode.code,
                        description: mappedPromocode.description || '',
                        percentage: mappedPromocode.percentage,
                        discount: mappedPromocode.discount,
                        start_date: new Date(mappedPromocode.start_date), // Convert to Date object
                        end_date: new Date(mappedPromocode.end_date), // Convert to Date object
                        status: mappedPromocode.status,
                    });
                } else {
                    showErrorToast('Promocode not found');
                    navigate('/promo-code');
                }
            } catch (error) {
                console.error('Error fetching promocode:', error);
                navigate('/promo-code');
            } finally {
                setFetchingPromocode(false);
            }
        };

        loadPromocode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // Only depend on id, reset and navigate are stable

    const onSubmit = async (data: PromocodeFormData) => {
        // Validation checks
        if (isEditMode) {
            if (!promocodeData || !id) return;
            if (!promocodeData.concurrency_stamp) {
                console.error('Promocode concurrency_stamp is missing');
                return;
            }
        }

        setLoading(true);
        try {
            // Format dates to date string format (YYYY-MM-DD)
            const startDateStr = data.start_date 
                ? (data.start_date instanceof Date 
                    ? data.start_date.toISOString().split('T')[0]
                    : new Date(data.start_date).toISOString().split('T')[0])
                : '';
            const endDateStr = data.end_date 
                ? (data.end_date instanceof Date 
                    ? data.end_date.toISOString().split('T')[0]
                    : new Date(data.end_date).toISOString().split('T')[0])
                : '';

            const commonData = {
                type: data.type,
                code: data.code,
                description: data.description || '',
                percentage: data.percentage,
                discount: data.discount || data.percentage, // Use percentage as discount if not provided
                startDate: startDateStr,
                endDate: endDateStr,
                status: data.status as PromocodeStatus,
            };

            if (isEditMode) {
                await promocodeService.updatePromocode(id!, {
                    ...commonData,
                    updated_by: userId,
                    concurrency_stamp: promocodeData!.concurrency_stamp,
                });
                showSuccessToast('Promocode updated successfully!');
            } else {
                if (!selectedBranchId) {
                    showErrorToast('No branch selected. Please select a branch.');
                    return;
                }
                await promocodeService.createPromocode({
                    ...commonData,
                    branchId: selectedBranchId,
                    vendorId: user?.vendorId || 1,
                });
                showSuccessToast('Promocode created successfully!');
            }

            navigate('/promo-code');
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} promocode:`, error);
            // Error toast is automatically shown by HTTP utilities
        } finally {
            setLoading(false);
        }
    };

    if (fetchingPromocode) {
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
                    {isEditMode ? 'Edit Promocode' : 'New Promocode'}
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
                                { value: 'PERCENTAGE', label: 'Percentage' },
                                { value: 'FLAT', label: 'Flat' },
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
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormNumberField
                            name="discount"
                            control={control}
                            label="Discount"
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

                    {/* Row 3 - Status */}
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
