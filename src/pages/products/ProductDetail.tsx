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
    Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductDetails, fetchProductStats, fetchInventoryMovements } from '../../services/product.service';
import { showErrorToast } from '../../utils/toast';
import type { Product, ProductVariant } from '../../types/product';
import type { ProductStats, InventoryMovement } from '../../types/product';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';
import type { Column, TableState } from '../../types/table';
import { formatExpiryDate, getExpiryDateColor } from '../../utils/productHelpers';
import { format } from 'date-fns';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CancelIcon from '@mui/icons-material/Cancel';

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

// Sample data for Reports
const sampleReportsData = {
    salesByMonth: [
        { month: 'Jan', sales: 45000, orders: 45 },
        { month: 'Feb', sales: 52000, orders: 52 },
        { month: 'Mar', sales: 48000, orders: 48 },
        { month: 'Apr', sales: 61000, orders: 61 },
        { month: 'May', sales: 55000, orders: 55 },
        { month: 'Jun', sales: 67000, orders: 67 },
    ],
    salesByVariant: [
        { name: '500ml', sales: 35000, percentage: 45 },
        { name: '1L', sales: 28000, percentage: 36 },
        { name: '2L', sales: 15000, percentage: 19 },
    ],
    orderStatusDistribution: {
        completed: 85,
        pending: 10,
        cancelled: 5,
    },
    averageOrderValue: 1250,
    growthRate: 12.5,
    returnRate: 2.3,
};


export default function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = React.useState<Product | null>(null);
    const [productStats, setProductStats] = React.useState<ProductStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [tabValue, setTabValue] = React.useState(0);

    // Inventory movements pagination
    const {
        tableState,
        tableHandlers,
    } = useServerPagination<InventoryMovement>({
        fetchFunction: async (params) => {
            if (!id) return { list: [], totalCount: 0 };
            return await fetchInventoryMovements(id, params.page || 0, params.pageSize || 10);
        },
        initialPageSize: 10,
    });

    React.useEffect(() => {
        const loadProduct = async () => {
            if (!id) {
                navigate('/products');
                return;
            }

            try {
                setLoading(true);
                // Fetch product details and stats in parallel
                const [productData, statsData] = await Promise.all([
                    fetchProductDetails(id),
                    fetchProductStats(id).catch((error) => {
                        console.error('Error fetching product stats:', error);
                        // Don't fail the whole page if stats fail, just log it
                        return null;
                    }),
                ]);
                setProduct(productData);
                setProductStats(statsData);
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

    // Highcharts options for Reports
    const salesByMonthChartOptions: Highcharts.Options = {
        chart: { type: 'line', height: 300 },
        title: { text: 'Sales Trend (Last 6 Months)' },
        xAxis: {
            categories: sampleReportsData.salesByMonth.map((item) => item.month),
            title: { text: 'Month' },
        },
        yAxis: {
            title: { text: 'Sales (₹)' },
        },
        series: [
            {
                name: 'Sales',
                type: 'line',
                data: sampleReportsData.salesByMonth.map((item) => item.sales),
                color: '#1976d2',
            },
        ],
        tooltip: {
            formatter: function () {
                return `<b>${this.x}</b><br/>Sales: ₹${this.y?.toLocaleString()}`;
            },
        },
    };

    const salesByVariantChartOptions: Highcharts.Options = {
        chart: { type: 'pie', height: 300 },
        title: { text: 'Sales by Variant' },
        series: [
            {
                name: 'Sales',
                type: 'pie',
                data: sampleReportsData.salesByVariant.map((item) => ({
                    name: item.name,
                    y: item.sales,
                })),
            },
        ],
        tooltip: {
            pointFormat: '{series.name}: <b>₹{point.y:,.0f}</b><br/>Percentage: <b>{point.percentage:.1f}%</b>',
        },
    };

    const orderStatusChartOptions: Highcharts.Options = {
        chart: { type: 'bar', height: 300 },
        title: { text: 'Order Status Distribution' },
        xAxis: {
            categories: ['Completed', 'Pending', 'Cancelled'],
            title: { text: 'Status' },
        },
        yAxis: {
            title: { text: 'Number of Orders' },
        },
        series: [
            {
                name: 'Orders',
                type: 'bar',
                data: [
                    sampleReportsData.orderStatusDistribution.completed,
                    sampleReportsData.orderStatusDistribution.pending,
                    sampleReportsData.orderStatusDistribution.cancelled,
                ],
                color: '#1976d2',
            },
        ],
        tooltip: {
            formatter: function () {
                return `<b>${this.x}</b><br/>Orders: ${this.y}`;
            },
        },
    };


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
                                        {productStats?.total_orders ?? 0}
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
                                        {productStats?.units_sold ?? 0}
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
                                        ₹{productStats?.revenue_generated ? (productStats.revenue_generated / 1000000).toFixed(1) + 'M' : '0'}
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
                                    <WarehouseIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Current Stock
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                        {productStats?.current_stock?.toLocaleString() ?? product.quantity?.toLocaleString() ?? 0}
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
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                Product ID
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                #{product.id}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column - Tabs */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="Media" />
                            <Tab label="Variants" />
                            <Tab label="Audit" />
                            <Tab label="Reports" />
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
                                {(product.updated_at || product.updatedAt) && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Updated At
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {format(new Date(product.updated_at || product.updatedAt || ''), 'MMM dd, yyyy HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}
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

                        {/* Media Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Product Media
                            </Typography>
                            {product.images && product.images.length > 0 ? (
                                <Grid container spacing={2}>
                                    {product.images
                                        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                                        .map((image) => (
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={image.id}>
                                                <Box sx={{ position: 'relative' }}>
                                                    <Box
                                                        component="img"
                                                        src={image.image_url}
                                                        alt={`${product.title} - Image ${image.display_order || image.id}`}
                                                        sx={{
                                                            width: '100%',
                                                            height: 200,
                                                            objectFit: 'cover',
                                                            borderRadius: 2,
                                                            border: '1px solid #e0e0e0',
                                                        }}
                                                    />
                                                    {image.is_default && (
                                                        <Chip
                                                            label="Default"
                                                            color="primary"
                                                            size="small"
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 8,
                                                                right: 8,
                                                            }}
                                                        />
                                                    )}
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            Display Order: {image.display_order || 'N/A'}
                                                        </Typography>
                                                        {image.variant_id && (
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                                Variant ID: {image.variant_id}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                </Grid>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    No images available
                                </Typography>
                            )}
                        </TabPanel>

                        {/* Variants Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Product Variants
                            </Typography>
                            {product.variants && product.variants.length > 0 ? (
                                (() => {
                                    const variantColumns: Column<ProductVariant>[] = [
                                        {
                                            id: 'variant_name',
                                            label: 'Variant Name',
                                            render: (row: ProductVariant) => (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {row.variant_name || row.variant_value || 'Default'}
                                                </Typography>
                                            ),
                                        },
                                        {
                                            id: 'variant_type',
                                            label: 'Type',
                                            render: (row: ProductVariant) => (
                                                <Chip
                                                    label={row.variant_type || 'N/A'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ),
                                        },
                                        {
                                            id: 'price',
                                            label: 'Base Price',
                                            align: 'right',
                                            format: (value: number) => `₹${value?.toLocaleString() || '0.00'}`,
                                        },
                                        {
                                            id: 'selling_price',
                                            label: 'Selling Price',
                                            align: 'right',
                                            render: (row: ProductVariant) => (
                                                <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                                                    ₹{row.selling_price?.toLocaleString() || '0.00'}
                                                </Typography>
                                            ),
                                        },
                                        {
                                            id: 'quantity',
                                            label: 'Quantity',
                                            align: 'right',
                                            format: (value: number) => value?.toLocaleString() || '0',
                                        },
                                        {
                                            id: 'units',
                                            label: 'Units',
                                            format: (value: string | null) => value || 'N/A',
                                        },
                                        {
                                            id: 'items_per_unit',
                                            label: 'Items/Unit',
                                            align: 'right',
                                            format: (value: number | null) => value?.toString() || '-',
                                        },
                                        {
                                            id: 'status',
                                            label: 'Status',
                                            render: (row: ProductVariant) => (
                                                <Box>
                                                    <Chip
                                                        label={row.status || 'N/A'}
                                                        color={getStatusColor(row.status || 'ACTIVE')}
                                                        size="small"
                                                    />
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Chip
                                                            label={row.product_status || 'N/A'}
                                                            color={getAvailabilityColor(row.product_status || 'INSTOCK')}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                </Box>
                                            ),
                                        },
                                        {
                                            id: 'expiry_date',
                                            label: 'Expiry Date',
                                            render: (row: ProductVariant) => (
                                                row.expiry_date ? (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: getExpiryDateColor(row.expiry_date) }}
                                                    >
                                                        {formatExpiryDate(row.expiry_date)}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        No expiry
                                                    </Typography>
                                                )
                                            ),
                                        },
                                    ];

                                    // Create table state for variants (client-side pagination since data is already loaded)
                                    const variantTableState: TableState<ProductVariant> = {
                                        data: product.variants,
                                        total: product.variants.length,
                                        page: 1,
                                        rowsPerPage: 10,
                                        order: 'asc',
                                        orderBy: 'variant_name',
                                        loading: false,
                                        search: '',
                                    };

                                    // Create handlers for variants table
                                    const variantHandlers = {
                                        handleRequestSort: () => {
                                            // Sorting can be added if needed
                                        },
                                        handleChangePage: () => {
                                            // Pagination handled by DataTable
                                        },
                                        handleChangeRowsPerPage: () => {
                                            // Rows per page handled by DataTable
                                        },
                                    };

                                    return (
                                        <DataTable<ProductVariant>
                                            columns={variantColumns}
                                            state={variantTableState}
                                            handlers={variantHandlers}
                                        />
                                    );
                                })()
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    No variants available
                                </Typography>
                            )}
                        </TabPanel>

                        {/* Audit Tab */}
                        <TabPanel value={tabValue} index={3}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Inventory Movements
                            </Typography>
                            
                            {(() => {
                                const columns: Column<InventoryMovement>[] = [
                                    {
                                        id: 'createdAt',
                                        label: 'Date',
                                        minWidth: 150,
                                        format: (value: string) => format(new Date(value), 'MMM dd, yyyy HH:mm'),
                                    },
                                    {
                                        id: 'movementType',
                                        label: 'Type',
                                        minWidth: 120,
                                        render: (row: InventoryMovement) => (
                                            <Chip
                                                label={row.movementType}
                                                size="small"
                                                color={
                                                    row.movementType === 'REMOVED' ? 'error' :
                                                    row.movementType === 'ADDED' ? 'success' :
                                                    row.movementType === 'REVERTED' ? 'warning' : 'default'
                                                }
                                            />
                                        ),
                                    },
                                    {
                                        id: 'quantityChange',
                                        label: 'Change',
                                        minWidth: 100,
                                        align: 'right',
                                        render: (row: InventoryMovement) => (
                                            <Typography
                                                sx={{
                                                    color: row.quantityChange >= 0 ? 'success.main' : 'error.main',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {row.quantityChange >= 0 ? '+' : ''}{row.quantityChange}
                                            </Typography>
                                        ),
                                    },
                                    {
                                        id: 'quantityBefore',
                                        label: 'Before',
                                        minWidth: 100,
                                        align: 'right',
                                    },
                                    {
                                        id: 'quantityAfter',
                                        label: 'After',
                                        minWidth: 100,
                                        align: 'right',
                                        render: (row: InventoryMovement) => (
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {row.quantityAfter}
                                            </Typography>
                                        ),
                                    },
                                    {
                                        id: 'referenceType',
                                        label: 'Reference',
                                        minWidth: 120,
                                        render: (row: InventoryMovement) => (
                                            <Box>
                                                <Typography variant="body2">{row.referenceType}</Typography>
                                                {row.referenceId && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        ID: {row.referenceId}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ),
                                    },
                                    {
                                        id: 'notes',
                                        label: 'Notes',
                                        minWidth: 200,
                                        format: (value: string | null) => value || '-',
                                    },
                                    {
                                        id: 'user',
                                        label: 'User',
                                        minWidth: 150,
                                        format: (value: InventoryMovement['user']) => {
                                            if (!value) return 'N/A';
                                            return value.name || value.email || `User ${value.id}`;
                                        },
                                    },
                                ];

                                return (
                                    <DataTable<InventoryMovement>
                                        columns={columns}
                                        state={tableState}
                                        handlers={tableHandlers}
                                    />
                                );
                            })()}
                        </TabPanel>

                        {/* Reports Tab */}
                        <TabPanel value={tabValue} index={4}>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <HighchartsReact highcharts={Highcharts} options={salesByMonthChartOptions} />
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <HighchartsReact highcharts={Highcharts} options={salesByVariantChartOptions} />
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <HighchartsReact highcharts={Highcharts} options={orderStatusChartOptions} />
                                    </Paper>
                                </Grid>
                            </Grid>
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
