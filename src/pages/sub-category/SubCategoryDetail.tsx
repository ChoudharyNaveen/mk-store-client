import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Avatar,
    Chip,
    Divider,
    CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSubCategories } from '../../services/sub-category.service';
import { showErrorToast } from '../../utils/toast';
import type { SubCategory } from '../../types/sub-category';

export default function SubCategoryDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [subCategory, setSubCategory] = React.useState<SubCategory | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadSubCategory = async () => {
            if (!id) {
                navigate('/sub-category');
                return;
            }

            try {
                setLoading(true);
                const response = await fetchSubCategories({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    setSubCategory(response.list[0]);
                } else {
                    showErrorToast('Sub Category not found');
                    navigate('/sub-category');
                }
            } catch (error) {
                console.error('Error fetching sub-category:', error);
                showErrorToast('Failed to load sub-category details');
                navigate('/sub-category');
            } finally {
                setLoading(false);
            }
        };

        loadSubCategory();
    }, [id, navigate]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!subCategory) {
        return null;
    }

    const getStatusColor = (status: string) => {
        return status === 'ACTIVE' ? 'success' : 'default';
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/sub-category')}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'transparent' }
                        }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                        Sub Category Details
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/sub-category/edit/${id}`)}
                    sx={{
                        bgcolor: '#204564',
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#1a3852' }
                    }}
                >
                    Edit Sub Category
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left Column - Image */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            {subCategory.image ? (
                                <Box
                                    component="img"
                                    src={subCategory.image}
                                    alt={subCategory.title}
                                    sx={{
                                        width: '100%',
                                        maxWidth: 400,
                                        height: 'auto',
                                        borderRadius: 2,
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <Avatar
                                    sx={{
                                        width: 200,
                                        height: 200,
                                        bgcolor: '#e0e0e0',
                                        fontSize: '3rem',
                                    }}
                                >
                                    {subCategory.title.charAt(0).toUpperCase()}
                                </Avatar>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Chip
                                label={subCategory.status}
                                color={getStatusColor(subCategory.status)}
                                size="small"
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column - Details */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                            {subCategory.title}
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        {subCategory.description && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                    Description
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                    {subCategory.description}
                                </Typography>
                            </Box>
                        )}

                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Sub Category ID
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        #{subCategory.id}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Status
                                    </Typography>
                                    <Chip
                                        label={subCategory.status}
                                        color={getStatusColor(subCategory.status)}
                                        size="small"
                                    />
                                </Grid>
                                {subCategory.category && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Parent Category
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {subCategory.category.title}
                                        </Typography>
                                    </Grid>
                                )}
                                {subCategory.createdAt && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Created At
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {new Date(subCategory.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
