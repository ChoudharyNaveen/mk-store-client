import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid as Grid,
    Avatar,
    Chip,
    Divider,
    Card,
    CardContent,
    Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchBannerDetails, deleteBanner } from '../../services/banner.service';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import type { Banner } from '../../types/banner';
import { format } from 'date-fns';
import DetailPageSkeleton from '../../components/DetailPageSkeleton';

export default function BannerDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [banner, setBanner] = React.useState<Banner | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [deleting, setDeleting] = React.useState(false);

    React.useEffect(() => {
        const loadBanner = async () => {
            if (!id) {
                navigate('/banners');
                return;
            }

            try {
                setLoading(true);
                const bannerData = await fetchBannerDetails(id);
                setBanner(bannerData);
            } catch (error) {
                console.error('Error fetching banner:', error);
                showErrorToast('Failed to load banner details');
                navigate('/banners');
            } finally {
                setLoading(false);
            }
        };

        loadBanner();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (!banner || !id) return;

        const confirmed = window.confirm('Are you sure you want to delete this banner? This action cannot be undone.');
        if (!confirmed) return;

        try {
            setDeleting(true);
            const concurrencyStamp = banner.concurrency_stamp || banner.concurrencyStamp;
            if (!concurrencyStamp) {
                showErrorToast('Concurrency stamp not found. Please refresh and try again.');
                return;
            }

            await deleteBanner(id, concurrencyStamp);
            showSuccessToast('Banner deleted successfully');
            navigate('/banners');
        } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'message' in error
                ? (error.message as string)
                : 'Failed to delete banner';
            
            if (error && typeof error === 'object' && 'status' in error && error.status === 409) {
                showErrorToast('Concurrency error: Banner was modified by another user. Please refresh and try again.');
            } else {
                showErrorToast(errorMessage);
            }
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <DetailPageSkeleton />;
    }

    if (!banner) {
        return null;
    }

    const imageUrl = banner.image_url || '';
    const status = banner.status;
    const displayOrder = banner.display_order ?? 0;
    const createdAt = banner.created_at ?? banner.createdAt;
    const updatedAt = banner.updated_at ?? banner.updatedAt;
    const concurrencyStamp = banner.concurrency_stamp || banner.concurrencyStamp;

    return (
        <Box>
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(-1)}
                            sx={{
                                color: 'text.secondary',
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'transparent' }
                            }}
                        >
                            Back
                        </Button>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Banner
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/banners/edit/${id}`)}
                            sx={{ textTransform: 'none' }}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DeleteIcon />}
                            onClick={handleDelete}
                            disabled={deleting}
                            sx={{
                                bgcolor: 'error.main',
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'error.dark' }
                            }}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </Stack>
                </Box>

                <Grid container spacing={3} sx={{ mt: 3 }}>
                {/* Image Preview */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Banner Image
                            </Typography>
                            {imageUrl ? (
                                <Avatar
                                    src={imageUrl}
                                    alt="Banner"
                                    variant="rounded"
                                    sx={{ 
                                        width: '100%', 
                                        maxWidth: 600, 
                                        height: 400, 
                                        objectFit: 'contain',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => window.open(imageUrl, '_blank')}
                                    imgProps={{
                                        onError: () => {
                                            // Handle broken image
                                        },
                                    }}
                                />
                            ) : (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                    <Typography>No image available</Typography>
                                </Box>
                            )}
                            {imageUrl && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Image URL:
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            wordBreak: 'break-all',
                                            color: 'primary.main',
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => window.open(imageUrl, '_blank')}
                                    >
                                        {imageUrl}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Banner Information */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                Banner Information
                            </Typography>

                            <Grid container spacing={2}>
                                {/* ID */}
                                <Grid size={{ xs: 12 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Banner ID
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {banner.id}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: '100%', my: 1 }} />

                                {/* Status */}
                                <Grid size={{ xs: 12 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Status
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip
                                                label={status}
                                                size="small"
                                                color={status === 'ACTIVE' ? 'success' : 'default'}
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </Box>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: '100%', my: 1 }} />

                                {/* Display Order */}
                                <Grid size={{ xs: 12 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Display Order
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {displayOrder}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: '100%', my: 1 }} />

                                {/* Vendor */}
                                <Grid size={{ xs: 12 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Vendor
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {banner.vendor ? `${banner.vendor.name} (${banner.vendor.code})` : 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: '100%', my: 1 }} />

                                {/* Branch */}
                                <Grid size={{ xs: 12 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Branch
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {banner.branch ? `${banner.branch.name} (${banner.branch.code})` : 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: '100%', my: 1 }} />

                                {/* Subcategory */}
                                <Grid size={{ xs: 12 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Subcategory
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {banner.subCategory ? banner.subCategory.title : 'None'}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: '100%', my: 1 }} />

                                {/* Created Date */}
                                {createdAt && (
                                    <>
                                        <Grid size={{ xs: 12 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Created Date
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {format(new Date(createdAt), 'MMM dd, yyyy HH:mm:ss')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Divider sx={{ width: '100%', my: 1 }} />
                                    </>
                                )}

                                {/* Updated Date */}
                                {updatedAt && (
                                    <>
                                        <Grid size={{ xs: 12 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Last Updated
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {format(new Date(updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Divider sx={{ width: '100%', my: 1 }} />
                                    </>
                                )}

                                {/* Concurrency Stamp (for debugging/admin) */}
                                {concurrencyStamp && (
                                    <Grid size={{ xs: 12 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Concurrency Stamp
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    fontWeight: 400,
                                                    fontFamily: 'monospace',
                                                    wordBreak: 'break-all',
                                                    color: 'text.secondary',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {concurrencyStamp}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            </Paper>
        </Box>
    );
}
