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
    Card,
    CardContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProducts } from '../../services/product.service';
import { showErrorToast } from '../../utils/toast';
import type { Product } from '../../types/product';
import { formatItemDetails, formatExpiryDate, getExpiryDateColor } from '../../utils/productHelpers';

export default function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = React.useState<Product | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadProduct = async () => {
            if (!id) {
                navigate('/products');
                return;
            }

            try {
                setLoading(true);
                const response = await fetchProducts({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    setProduct(response.list[0]);
                } else {
                    showErrorToast('Product not found');
                    navigate('/products');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                showErrorToast('Failed to load product details');
                navigate('/products');
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id, navigate]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!product) {
        return null;
    }

    const getStatusColor = (status: string) => {
        return status === 'ACTIVE' ? 'success' : 'default';
    };

    const getAvailabilityColor = (status: string) => {
        return status === 'INSTOCK' ? 'success' : 'error';
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/products')}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'transparent' }
                        }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                        Product Details
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/products/edit/${id}`)}
                    sx={{
                        bgcolor: '#204564',
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#1a3852' }
                    }}
                >
                    Edit Product
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left Column - Image and Basic Info */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            {product.image ? (
                                <Box
                                    component="img"
                                    src={product.image}
                                    alt={product.title}
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
                                    {product.title.charAt(0).toUpperCase()}
                                </Avatar>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Chip
                                label={product.status}
                                color={getStatusColor(product.status)}
                                size="small"
                            />
                            <Chip
                                label={product.product_status}
                                color={getAvailabilityColor(product.product_status)}
                                size="small"
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column - Details */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                            {product.title}
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                                            Cost Price
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#204564' }}>
                                            ₹{product.price?.toLocaleString() || '0.00'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                                            Selling Price
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                            ₹{product.selling_price?.toLocaleString() || '0.00'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                                            Stock Quantity
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {product.quantity?.toLocaleString() || 0} {product.units || 'units'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {product.itemsPerUnit && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                                                Items Per Unit
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {product.itemsPerUnit} items
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>

                    {/* Category & Classification */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                            Category & Classification
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                    Category
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {product.category?.title || 'N/A'}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                    Sub Category
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {product.subCategory?.title || 'N/A'}
                                </Typography>
                            </Grid>
                            {product.brand && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Brand
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {product.brand.logo && (
                                            <Avatar
                                                src={product.brand.logo}
                                                alt={product.brand.name}
                                                sx={{ width: 24, height: 24 }}
                                            />
                                        )}
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {product.brand.name}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>

                    {/* Item Details */}
                    {(product.itemQuantity || product.itemUnit || product.itemsPerUnit || product.expiryDate) && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                Item Measurement Details
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                {product.itemQuantity && product.itemUnit && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Item Quantity
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {formatItemDetails(product.itemQuantity, product.itemUnit, product.itemsPerUnit)}
                                        </Typography>
                                    </Grid>
                                )}
                                {product.expiryDate && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Expiry Date
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: getExpiryDateColor(product.expiryDate) }}>
                                            {formatExpiryDate(product.expiryDate)}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>
                    )}

                    {/* Description */}
                    {product.description && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                Description
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                {product.description}
                            </Typography>
                        </Paper>
                    )}

                    {/* Nutritional Information */}
                    {product.nutritional && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                Nutritional Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                {product.nutritional}
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
