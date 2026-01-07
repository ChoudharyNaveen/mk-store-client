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
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Rating,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProducts } from '../../services/product.service';
import { showErrorToast } from '../../utils/toast';
import type { Product } from '../../types/product';
import { formatExpiryDate, getExpiryDateColor } from '../../utils/productHelpers';
import { format } from 'date-fns';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

// Sample data - will be replaced with API data later
const sampleData = {
    sku: 'IPH15P-256-BLK',
    slug: 'iphone-15-pro-256gb-black',
    metaTitle: 'iPhone 15 Pro 256GB Black - Latest Apple Smartphone',
    metaDescription: 'Buy iPhone 15 Pro 256GB in Black. Latest features, A17 Pro chip, Pro camera system. Best price guaranteed.',
    metaKeywords: 'iphone 15 pro, apple, smartphone, 256gb, black',
    canonicalUrl: 'https://mkstore.com/products/iphone-15-pro-256gb-black',
    ogImage: 'https://mkstore.com/images/iphone-15-pro-og.jpg',
    discount: 5,
    discountType: 'percentage',
    taxClass: 'GST',
    gstPercent: 18,
    finalPrice: 94999,
    lowStockThreshold: 10,
    backorderAllowed: false,
    warehouse: 'Main Warehouse',
    location: 'Aisle 3, Shelf B',
    imageGallery: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
    ],
    videoUrl: 'https://example.com/product-video.mp4',
    documents: [
        { name: 'User Manual.pdf', url: 'https://example.com/manual.pdf' },
        { name: 'Warranty Card.pdf', url: 'https://example.com/warranty.pdf' },
    ],
    variants: [
        { id: 1, type: 'Color', value: 'Black', sku: 'IPH15P-256-BLK', price: 99999, stock: 45, image: 'https://example.com/black.jpg' },
        { id: 2, type: 'Color', value: 'White', sku: 'IPH15P-256-WHT', price: 99999, stock: 32, image: 'https://example.com/white.jpg' },
        { id: 3, type: 'Storage', value: '512GB', sku: 'IPH15P-512-BLK', price: 119999, stock: 18, image: 'https://example.com/512gb.jpg' },
    ],
    attributes: [
        { key: 'Material', value: 'Titanium, Ceramic Shield' },
        { key: 'Dimensions', value: '159.9 x 76.7 x 8.25 mm' },
        { key: 'Weight', value: '187 grams' },
        { key: 'Warranty', value: '1 Year Apple Warranty' },
        { key: 'Country of Origin', value: 'China' },
        { key: 'Screen Size', value: '6.1 inches' },
        { key: 'Processor', value: 'A17 Pro Chip' },
        { key: 'RAM', value: '8GB' },
        { key: 'Storage', value: '256GB' },
        { key: 'Camera', value: '48MP Main, 12MP Ultra Wide, 12MP Telephoto' },
    ],
    linkedOffers: [
        { id: 1, name: 'Festival Sale', discount: '10%', validUntil: '2025-02-15' },
        { id: 2, name: 'New Year Special', discount: '₹5000', validUntil: '2025-01-31' },
    ],
    promoCodes: [
        { code: 'NEWYEAR2025', discount: '5%', validUntil: '2025-01-31' },
    ],
    flashSale: false,
    totalOrders: 156,
    totalUnitsSold: 234,
    revenueGenerated: 23397666,
    lastOrderedDate: '2025-01-20',
    cartAbandonmentCount: 12,
    averageRating: 4.5,
    reviewCount: 89,
    recentReviews: [
        { id: 1, user: 'John Doe', rating: 5, comment: 'Excellent product! Highly recommended.', date: '2025-01-18', status: 'APPROVED' },
        { id: 2, user: 'Jane Smith', rating: 4, comment: 'Good quality but a bit expensive.', date: '2025-01-15', status: 'APPROVED' },
        { id: 3, user: 'Mike Johnson', rating: 5, comment: 'Amazing camera quality!', date: '2025-01-12', status: 'PENDING' },
    ],
    createdBy: 'Admin User',
    lastUpdatedBy: 'Manager User',
    priceHistory: [
        { date: '2025-01-15', price: 104999, changedBy: 'Manager User' },
        { date: '2025-01-01', price: 109999, changedBy: 'Admin User' },
        { date: '2024-12-20', price: 114999, changedBy: 'Admin User' },
    ],
    stockHistory: [
        { date: '2025-01-20', quantity: 45, action: 'Sale', changedBy: 'System' },
        { date: '2025-01-18', quantity: 50, action: 'Restock', changedBy: 'Manager User' },
        { date: '2025-01-15', quantity: 48, action: 'Sale', changedBy: 'System' },
    ],
};

export default function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = React.useState<Product | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [tabValue, setTabValue] = React.useState(0);

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

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const discountAmount = sampleData.discountType === 'percentage'
        ? (product.price * sampleData.discount / 100)
        : sampleData.discount;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
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
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                        Product Details
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        sx={{ textTransform: 'none' }}
                    >
                        Clone
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/products/edit/${id}`)}
                        sx={{ textTransform: 'none' }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        sx={{
                            bgcolor: 'error.main',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'error.dark' }
                        }}
                    >
                        Delete
                    </Button>
                </Stack>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <ShoppingCartIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Total Orders
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                        {sampleData.totalOrders}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'success.main' }}>
                                    <TrendingUpIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Units Sold
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        {sampleData.totalUnitsSold}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'info.main' }}>
                                    <InventoryIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Revenue Generated
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                                        ₹{(sampleData.revenueGenerated / 1000000).toFixed(1)}M
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'warning.main' }}>
                                    <StarIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Average Rating
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                            {sampleData.averageRating}
                                        </Typography>
                                        <Rating value={sampleData.averageRating} readOnly size="small" precision={0.1} />
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

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
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
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
                            {sampleData.flashSale && (
                                <Chip
                                    label="Flash Sale"
                                    color="error"
                                    size="small"
                                />
                            )}
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                SKU
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {sampleData.sku}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column - Tabs */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="Pricing" />
                            <Tab label="Inventory" />
                            <Tab label="Media" />
                            <Tab label="Variants" />
                            <Tab label="Attributes" />
                            <Tab label="SEO" />
                            <Tab label="Offers" />
                            <Tab label="Sales" />
                            <Tab label="Reviews" />
                            <Tab label="Audit" />
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                {product.title}
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Product ID
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        #{product.id}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        SKU
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.sku}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Category
                                    </Typography>
                                    <Button
                                        variant="text"
                                        onClick={() => navigate(`/category/detail/${product.category?.id}`)}
                                        sx={{ textTransform: 'none', p: 0, justifyContent: 'flex-start' }}
                                    >
                                        {product.category?.title || 'N/A'}
                                    </Button>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Sub Category
                                    </Typography>
                                    <Button
                                        variant="text"
                                        onClick={() => navigate(`/sub-category/detail/${product.subCategory?.id}`)}
                                        sx={{ textTransform: 'none', p: 0, justifyContent: 'flex-start' }}
                                    >
                                        {product.subCategory?.title || 'N/A'}
                                    </Button>
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
                                {product.createdAt && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Created At
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {format(new Date(product.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>

                            {product.description && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                        {product.description}
                                    </Typography>
                                </Box>
                            )}

                            {product.nutritional && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                        Nutritional Information
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                        {product.nutritional}
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>

                        {/* Pricing Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Pricing Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Base Price
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                ₹{product.price?.toLocaleString() || '0.00'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Sale Price
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                ₹{product.selling_price?.toLocaleString() || '0.00'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Discount
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                                                {sampleData.discountType === 'percentage' ? `${sampleData.discount}%` : `₹${sampleData.discount}`}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Cost Price (Internal)
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                ₹{(product.price - discountAmount).toLocaleString()}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Tax Class
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.taxClass}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        GST %
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.gstPercent}%
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Card variant="outlined" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.9 }}>
                                                Final Price (After Tax)
                                            </Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 600, color: 'inherit' }}>
                                                ₹{sampleData.finalPrice.toLocaleString()}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/* Inventory Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Inventory Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Stock Quantity
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {product.quantity?.toLocaleString() || 0} {product.units || 'units'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Unit
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {product.units || 'N/A'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                {product.itemsPerUnit && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Items Per Unit
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {product.itemsPerUnit} items
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                </Grid>
                                )}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Low Stock Threshold
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.lowStockThreshold}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Stock Status
                                    </Typography>
                                    <Chip
                                        label={product.product_status}
                                        color={getAvailabilityColor(product.product_status)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Backorder Allowed
                                    </Typography>
                                    <Chip
                                        label={sampleData.backorderAllowed ? 'Yes' : 'No'}
                                        color={sampleData.backorderAllowed ? 'success' : 'default'}
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Warehouse
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.warehouse}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Location
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.location}
                                    </Typography>
                                </Grid>
                                {product.expiryDate && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Expiry Date
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: getExpiryDateColor(product.expiryDate) }}>
                                            {formatExpiryDate(product.expiryDate)}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </TabPanel>

                        {/* Media Tab */}
                        <TabPanel value={tabValue} index={3}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Product Media
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Primary Image
                                    </Typography>
                                    {product.image && (
                                        <Box
                                            component="img"
                                            src={product.image}
                                            alt={product.title}
                                            sx={{
                                                width: '100%',
                                                maxWidth: 400,
                                                height: 'auto',
                                                borderRadius: 2,
                                                border: '1px solid #e0e0e0',
                                            }}
                                        />
                                    )}
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
                                        Image Gallery
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {sampleData.imageGallery.map((img, index) => (
                                            <Grid size={{ xs: 12, sm: 4 }} key={index}>
                                                <Box
                                                    component="img"
                                                    src={img}
                                                    alt={`${product.title} - Image ${index + 1}`}
                                                    sx={{
                                                        width: '100%',
                                                        height: 150,
                                                        objectFit: 'cover',
                                                        borderRadius: 2,
                                                        border: '1px solid #e0e0e0',
                                                    }}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Grid>
                                {sampleData.videoUrl && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
                                            Video URL
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                                            {sampleData.videoUrl}
                                        </Typography>
                                    </Grid>
                                )}
                                {sampleData.documents.length > 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
                                            Documents
                                        </Typography>
                                        <Stack spacing={1}>
                                            {sampleData.documents.map((doc, index) => (
                                                <Button
                                                    key={index}
                                                    variant="outlined"
                                                    size="small"
                                                    href={doc.url}
                                                    target="_blank"
                                                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                                                >
                                                    {doc.name}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Grid>
                                )}
                            </Grid>
                        </TabPanel>

                        {/* Variants Tab */}
                        <TabPanel value={tabValue} index={4}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Product Variants
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Value</TableCell>
                                            <TableCell>SKU</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Stock</TableCell>
                                            <TableCell>Image</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sampleData.variants.map((variant) => (
                                            <TableRow key={variant.id}>
                                                <TableCell>{variant.type}</TableCell>
                                                <TableCell>{variant.value}</TableCell>
                                                <TableCell>{variant.sku}</TableCell>
                                                <TableCell align="right">₹{variant.price.toLocaleString()}</TableCell>
                                                <TableCell align="right">{variant.stock}</TableCell>
                                                <TableCell>
                                                    <Avatar
                                                        src={variant.image}
                                                        alt={variant.value}
                                                        sx={{ width: 40, height: 40 }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* Attributes Tab */}
                        <TabPanel value={tabValue} index={5}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Product Attributes & Specifications
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Attribute</TableCell>
                                            <TableCell>Value</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sampleData.attributes.map((attr, index) => (
                                            <TableRow key={index}>
                                                <TableCell sx={{ fontWeight: 500 }}>{attr.key}</TableCell>
                                                <TableCell>{attr.value}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* SEO Tab */}
                        <TabPanel value={tabValue} index={6}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                SEO Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        URL Slug
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.slug}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Meta Title
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.metaTitle}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Meta Description
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                        {sampleData.metaDescription}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Meta Keywords
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                        {sampleData.metaKeywords}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Canonical URL
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                                        {sampleData.canonicalUrl}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Open Graph Image
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                                        {sampleData.ogImage}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/* Offers Tab */}
                        <TabPanel value={tabValue} index={7}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Offers & Promotions
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Linked Offers
                                </Typography>
                                <Stack spacing={2}>
                                    {sampleData.linkedOffers.map((offer) => (
                                        <Card key={offer.id} variant="outlined">
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {offer.name}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                            Discount: {offer.discount}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={`Valid until ${format(new Date(offer.validUntil), 'MMM dd, yyyy')}`}
                                                        color="success"
                                                        size="small"
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Promo Codes Applied
                                </Typography>
                                <Stack spacing={2}>
                                    {sampleData.promoCodes.map((promo, index) => (
                                        <Card key={index} variant="outlined">
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {promo.code}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                            Discount: {promo.discount}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={`Valid until ${format(new Date(promo.validUntil), 'MMM dd, yyyy')}`}
                                                        color="info"
                                                        size="small"
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            </Box>
                        </TabPanel>

                        {/* Sales Tab */}
                        <TabPanel value={tabValue} index={8}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Order & Sales Insights
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Total Orders
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {sampleData.totalOrders}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Total Units Sold
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                {sampleData.totalUnitsSold}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Revenue Generated
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                                                ₹{sampleData.revenueGenerated.toLocaleString()}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Last Ordered Date
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {format(new Date(sampleData.lastOrderedDate), 'MMM dd, yyyy')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Cart Abandonment Count
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                                {sampleData.cartAbandonmentCount}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                            <Button variant="outlined" sx={{ textTransform: 'none' }}>
                                View Orders Containing This Product
                            </Button>
                        </TabPanel>

                        {/* Reviews Tab */}
                        <TabPanel value={tabValue} index={9}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                        Reviews & Ratings
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Rating value={sampleData.averageRating} readOnly precision={0.1} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            ({sampleData.reviewCount} reviews)
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button variant="outlined" size="small" sx={{ textTransform: 'none' }}>
                                    Moderate Reviews
                                </Button>
                            </Box>
                            <Stack spacing={2}>
                                {sampleData.recentReviews.map((review) => (
                                    <Card key={review.id} variant="outlined">
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                        {review.user}
                                                    </Typography>
                                                    <Rating value={review.rating} readOnly size="small" />
                                                </Box>
                                                <Chip
                                                    label={review.status}
                                                    color={review.status === 'APPROVED' ? 'success' : 'warning'}
                                                    size="small"
                                                />
                                            </Box>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                                {review.comment}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {format(new Date(review.date), 'MMM dd, yyyy')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </TabPanel>

                        {/* Audit Tab */}
                        <TabPanel value={tabValue} index={10}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                Audit & Logs
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Created By
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {sampleData.createdBy}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Last Updated By
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {sampleData.lastUpdatedBy}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Price Change History
                            </Typography>
                            <TableContainer sx={{ mb: 3 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell>Changed By</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sampleData.priceHistory.map((history, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{format(new Date(history.date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell align="right">₹{history.price.toLocaleString()}</TableCell>
                                                <TableCell>{history.changedBy}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Stock Change History
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell align="right">Quantity</TableCell>
                                            <TableCell>Action</TableCell>
                                            <TableCell>Changed By</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sampleData.stockHistory.map((history, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{format(new Date(history.date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell align="right">{history.quantity}</TableCell>
                                                <TableCell>{history.action}</TableCell>
                                                <TableCell>{history.changedBy}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
