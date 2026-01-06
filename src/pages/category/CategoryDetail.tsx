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
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCategories } from '../../services/category.service';
import { showErrorToast } from '../../utils/toast';
import type { Category } from '../../types/category';
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
    slug: 'electronics',
    displayOrder: 1,
    metaTitle: 'Electronics - Best Deals on Electronic Products',
    metaDescription: 'Shop the latest electronics including smartphones, laptops, tablets, and more. Best prices and fast delivery.',
    metaKeywords: 'electronics, smartphones, laptops, tablets, gadgets',
    canonicalUrl: 'https://mkstore.com/category/electronics',
    subCategoriesCount: 8,
    totalProducts: 245,
    activeProducts: 198,
    inactiveProducts: 47,
    createdBy: 'Admin User',
    lastModifiedBy: 'Manager User',
    changeHistory: [
        { date: '2025-01-15', field: 'Status', oldValue: 'INACTIVE', newValue: 'ACTIVE', changedBy: 'Manager User' },
        { date: '2025-01-10', field: 'Image', oldValue: 'old-image.jpg', newValue: 'new-image.jpg', changedBy: 'Admin User' },
        { date: '2025-01-05', field: 'Description', oldValue: 'Old description', newValue: 'Updated description', changedBy: 'Admin User' },
    ],
    subCategories: [
        { id: 1, name: 'Smartphones', products: 45, status: 'ACTIVE' },
        { id: 2, name: 'Laptops', products: 32, status: 'ACTIVE' },
        { id: 3, name: 'Tablets', products: 28, status: 'ACTIVE' },
        { id: 4, name: 'Accessories', products: 67, status: 'ACTIVE' },
    ],
    recentProducts: [
        { id: 1, name: 'iPhone 15 Pro', sku: 'IPH15P', price: 99999, status: 'ACTIVE', stock: 45 },
        { id: 2, name: 'MacBook Pro M3', sku: 'MBP-M3', price: 199999, status: 'ACTIVE', stock: 12 },
        { id: 3, name: 'iPad Air', sku: 'IPAD-AIR', price: 59999, status: 'ACTIVE', stock: 28 },
    ],
};

export default function CategoryDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [category, setCategory] = React.useState<Category | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [tabValue, setTabValue] = React.useState(0);

    React.useEffect(() => {
        const loadCategory = async () => {
            if (!id) {
                navigate('/category');
                return;
            }

            try {
                setLoading(true);
                const response = await fetchCategories({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    setCategory(response.list[0]);
                } else {
                    showErrorToast('Category not found');
                    navigate('/category');
                }
            } catch (error) {
                console.error('Error fetching category:', error);
                showErrorToast('Failed to load category details');
                navigate('/category');
            } finally {
                setLoading(false);
            }
        };

        loadCategory();
    }, [id, navigate]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!category) {
        return null;
    }

    const getStatusColor = (status: string) => {
        return status === 'ACTIVE' ? 'success' : 'default';
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
                        onClick={() => navigate('/category')}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'transparent' }
                        }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                        Category Details
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/category/edit/${id}`)}
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
                        disabled={sampleData.subCategoriesCount > 0 || sampleData.totalProducts > 0}
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
                                    <CategoryIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Sub-Categories
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                        {sampleData.subCategoriesCount}
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
                                <Avatar sx={{ bgcolor: 'info.main' }}>
                                    <ShoppingCartIcon />
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
                                    <InfoIcon />
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
            </Grid>

            <Grid container spacing={3}>
                {/* Left Column - Image and Basic Info */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            {category.image ? (
                                <Box
                                    component="img"
                                    src={category.image}
                                    alt={category.title}
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
                                    {category.title.charAt(0).toUpperCase()}
                                </Avatar>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Chip
                                label={category.status}
                                color={getStatusColor(category.status)}
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
                            <Tab label="Relationships" />
                            <Tab label="Audit Logs" />
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                {category.title}
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Category ID
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        #{category.id}
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
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Status
                                    </Typography>
                                    <Chip
                                        label={category.status}
                                        color={getStatusColor(category.status)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Created By
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {sampleData.createdBy}
                                    </Typography>
                                </Grid>
                                {sampleData.createdBy && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Created At
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {format(new Date(), 'MMM dd, yyyy HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}
                                {sampleData.lastModifiedBy && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Last Updated
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {format(new Date(), 'MMM dd, yyyy HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>

                            {category.description && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                        {category.description}
                                    </Typography>
                                </Box>
                            )}
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
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Canonical URL
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                                        {sampleData.canonicalUrl}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/* Relationships Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Sub-Categories
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell align="right">Products</TableCell>
                                            <TableCell align="center">Status</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sampleData.subCategories.map((subCat) => (
                                            <TableRow key={subCat.id}>
                                                <TableCell>{subCat.name}</TableCell>
                                                <TableCell align="right">{subCat.products}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={subCat.status} color="success" size="small" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={() => navigate(`/sub-category/detail/${subCat.id}`)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 4, color: '#333' }}>
                                Recent Products
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product Name</TableCell>
                                            <TableCell>SKU</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Stock</TableCell>
                                            <TableCell align="center">Status</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sampleData.recentProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>{product.name}</TableCell>
                                                <TableCell>{product.sku}</TableCell>
                                                <TableCell align="right">₹{product.price.toLocaleString()}</TableCell>
                                                <TableCell align="right">{product.stock}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={product.status} color="success" size="small" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={() => navigate(`/products/detail/${product.id}`)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* Audit Logs Tab */}
                        <TabPanel value={tabValue} index={3}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                Change History
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                    Last Modified By
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {sampleData.lastModifiedBy}
                                </Typography>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Field</TableCell>
                                            <TableCell>Old Value</TableCell>
                                            <TableCell>New Value</TableCell>
                                            <TableCell>Changed By</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sampleData.changeHistory.map((change, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{format(new Date(change.date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell>{change.field}</TableCell>
                                                <TableCell>{change.oldValue}</TableCell>
                                                <TableCell>{change.newValue}</TableCell>
                                                <TableCell>{change.changedBy}</TableCell>
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
