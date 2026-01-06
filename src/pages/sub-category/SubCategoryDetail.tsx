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
    IconButton,
    Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSubCategories } from '../../services/sub-category.service';
import { showErrorToast } from '../../utils/toast';
import type { SubCategory } from '../../types/sub-category';
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
    slug: 'smartphones',
    displayOrder: 1,
    metaTitle: 'Smartphones - Latest Mobile Phones',
    metaDescription: 'Browse the latest smartphones from top brands. Best prices and deals on mobile phones.',
    metaKeywords: 'smartphones, mobile phones, android, ios',
    totalProducts: 45,
    activeProducts: 38,
    inactiveProducts: 7,
    stockSummary: {
        inStock: 32,
        lowStock: 6,
        outOfStock: 7,
    },
    products: [
        { id: 1, name: 'iPhone 15 Pro', sku: 'IPH15P', price: 99999, stock: 45, status: 'ACTIVE', availability: 'INSTOCK' },
        { id: 2, name: 'Samsung Galaxy S24', sku: 'SGS24', price: 89999, stock: 12, status: 'ACTIVE', availability: 'INSTOCK' },
        { id: 3, name: 'OnePlus 12', sku: 'OP12', price: 64999, stock: 8, status: 'ACTIVE', availability: 'INSTOCK' },
        { id: 4, name: 'Google Pixel 8', sku: 'GP8', price: 74999, stock: 0, status: 'INACTIVE', availability: 'OUTOFSTOCK' },
        { id: 5, name: 'Xiaomi 14', sku: 'XM14', price: 54999, stock: 3, status: 'ACTIVE', availability: 'INSTOCK' },
    ],
};

export default function SubCategoryDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [subCategory, setSubCategory] = React.useState<SubCategory | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [tabValue, setTabValue] = React.useState(0);

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

    const getAvailabilityColor = (availability: string) => {
        return availability === 'INSTOCK' ? 'success' : 'error';
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
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
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/sub-category/edit/${id}`)}
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
                        disabled={sampleData.totalProducts > 0}
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
                                    <InventoryIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Total Products
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                        {sampleData.totalProducts}
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
                                    <CategoryIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Active Products
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        {sampleData.activeProducts}
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
                                    <InventoryIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Inactive Products
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                        {sampleData.inactiveProducts}
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
                                        In Stock
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                                        {sampleData.stockSummary.inStock}
                                    </Typography>
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Chip
                                label={subCategory.status}
                                color={getStatusColor(subCategory.status)}
                                size="small"
                            />
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                Display Order
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {sampleData.displayOrder}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column - Tabs */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="SEO Details" />
                            <Tab label="Products" />
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                {subCategory.title}
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

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
                                        Slug
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.slug}
                                    </Typography>
                                </Grid>
                                {subCategory.category && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Parent Category
                                        </Typography>
                                        <Button
                                            variant="text"
                                            onClick={() => navigate(`/category/detail/${subCategory.category?.id}`)}
                                            sx={{ textTransform: 'none', p: 0, justifyContent: 'flex-start' }}
                                        >
                                            {subCategory.category.title}
                                        </Button>
                                    </Grid>
                                )}
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
                                {subCategory.createdAt && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Created At
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {format(new Date(subCategory.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>

                            {subCategory.description && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                        {subCategory.description}
                                    </Typography>
                                </Box>
                            )}

                            {/* Stock Summary */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                    Stock Summary
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    In Stock
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                    {sampleData.stockSummary.inStock}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Low Stock
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                                    {sampleData.stockSummary.lowStock}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Out of Stock
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                                                    {sampleData.stockSummary.outOfStock}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>
                        </TabPanel>

                        {/* SEO Details Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                SEO Information
                            </Typography>
                            <Grid container spacing={2}>
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
                            </Grid>
                        </TabPanel>

                        {/* Products Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    Products in this Sub-Category
                                </Typography>
                                <Button variant="outlined" size="small" sx={{ textTransform: 'none' }}>
                                    Bulk Manage
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product Name</TableCell>
                                            <TableCell>SKU</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Stock</TableCell>
                                            <TableCell align="center">Status</TableCell>
                                            <TableCell align="center">Availability</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sampleData.products.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>{product.name}</TableCell>
                                                <TableCell>{product.sku}</TableCell>
                                                <TableCell align="right">₹{product.price.toLocaleString()}</TableCell>
                                                <TableCell align="right">{product.stock}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={product.status} color={getStatusColor(product.status)} size="small" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip label={product.availability} color={getAvailabilityColor(product.availability)} size="small" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={() => navigate(`/products/detail/${product.id}`)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => navigate(`/products/edit/${product.id}`)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
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
