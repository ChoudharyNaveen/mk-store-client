import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Avatar,
    Chip,
    CircularProgress,
    Card,
    CardContent,
    Tabs,
    Tab,
    IconButton,
    Stack,
    Popover,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSubCategories } from '../../services/sub-category.service';
import { fetchProducts } from '../../services/product.service';
import { showErrorToast } from '../../utils/toast';
import type { SubCategory } from '../../types/sub-category';
import type { Product } from '../../types/product';
import type { Column } from '../../types/table';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setDateRange } from '../../store/dateRangeSlice';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';

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

interface ProductsTableProps {
    subCategoryId: number;
}

function ProductsTable({ subCategoryId }: ProductsTableProps) {
    const navigate = useNavigate();

    const columns: Column<Product>[] = [
        {
            id: 'image' as keyof Product,
            label: 'Image',
            minWidth: 80,
            render: (row: Product) => (
                <Avatar
                    src={row.image}
                    alt={row.title}
                    variant="rounded"
                    sx={{ width: 50, height: 50 }}
                />
            ),
        },
        {
            id: 'title' as keyof Product,
            label: 'Product Name',
            minWidth: 200,
            render: (row: Product) => (
                <Typography
                    component="button"
                    onClick={() => navigate(`/products/detail/${row.id}`)}
                    sx={{
                        background: 'none',
                        border: 'none',
                        color: '#204564',
                        cursor: 'pointer',
                        textAlign: 'left',
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                >
                    {row.title}
                </Typography>
            ),
        },
        {
            id: 'selling_price' as keyof Product,
            label: 'Selling Price',
            minWidth: 120,
            align: 'right',
            render: (row: Product) => `₹${row.selling_price}`,
        },
        {
            id: 'quantity' as keyof Product,
            label: 'Qty',
            minWidth: 80,
            align: 'right',
            render: (row: Product) => (row.quantity ?? 'N/A').toString(),
        },
        {
            id: 'product_status' as keyof Product,
            label: 'Stock Status',
            minWidth: 120,
            align: 'center',
            render: (row: Product) => (
                <Chip
                    label={row.product_status}
                    color={row.product_status === 'INSTOCK' ? 'success' : 'error'}
                    size="small"
                />
            ),
        },
        {
            id: 'status' as keyof Product,
            label: 'Status',
            minWidth: 100,
            align: 'center',
            render: (row: Product) => (
                <Chip
                    label={row.status}
                    color={row.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
        {
            id: 'createdAt' as keyof Product,
            label: 'Created',
            minWidth: 120,
            render: (row: Product) =>
                row.createdAt ? format(new Date(row.createdAt), 'MMM dd, yyyy') : 'N/A',
        },
        {
            id: 'action' as keyof Product,
            label: 'Action',
            minWidth: 120,
            align: 'center',
            render: (row: Product) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/products/detail/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2' },
                        }}
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/products/edit/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.main' },
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    const fetchProductsBySubCategory = React.useCallback(
        async (params: {
            page?: number;
            pageSize?: number;
            searchKeyword?: string;
            sorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
            signal?: AbortSignal;
        }) => {
            return fetchProducts({
                page: params.page,
                pageSize: params.pageSize,
                searchKeyword: params.searchKeyword,
                sorting: params.sorting,
                signal: params.signal,
                filters: [{ key: 'subCategoryId', eq: String(subCategoryId) }],
            });
        },
        [subCategoryId]
    );

    const { paginationModel, tableState, tableHandlers } = useServerPagination<Product>({
        fetchFunction: fetchProductsBySubCategory,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: {},
        initialSorting: [
            {
                key: 'createdAt',
                direction: 'DESC',
            },
        ],
        searchDebounceMs: 500,
    });

    return (
        <DataTable
            key={`sub-category-products-table-${paginationModel.page}-${paginationModel.pageSize}`}
            columns={columns}
            state={tableState}
            handlers={tableHandlers}
        />
    );
}

// Sample data - will be replaced with API data later
const sampleData = {
    slug: 'smartphones',
    displayOrder: 1,
    totalProducts: 45,
    activeProducts: 38,
    inactiveProducts: 7,
    stockSummary: {
        inStock: 32,
        lowStock: 6,
        outOfStock: 7,
    },
    // Reports data
    totalRevenue: 8500000,
    averageProductPrice: 78900,
    lowStockProducts: 6,
    outOfStockProducts: 7,
    totalOrders: 342,
    growthRate: 12.5,
};

export default function SubCategoryDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { startDate, endDate } = useAppSelector((state) => state.dateRange);
    const [subCategory, setSubCategory] = React.useState<SubCategory | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [tabValue, setTabValue] = React.useState(0);
    const [overviewTabValue, setOverviewTabValue] = React.useState(0);
    const [dateRangeAnchor, setDateRangeAnchor] = React.useState<HTMLButtonElement | null>(null);
    const [dateRangeState, setDateRangeState] = React.useState([
        {
            startDate: startDate || subDays(new Date(), 30),
            endDate: endDate || new Date(),
            key: 'selection',
        },
    ]);

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

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleOverviewTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setOverviewTabValue(newValue);
    };

    const handleDateRangeChange = (item: { selection: { startDate: Date; endDate: Date; key: string } }) => {
        setDateRangeState([item.selection]);
        if (item.selection.startDate && item.selection.endDate) {
            dispatch(
                setDateRange({
                    startDate: startOfDay(item.selection.startDate),
                    endDate: endOfDay(item.selection.endDate),
                })
            );
        }
    };

    const handleDateRangeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setDateRangeAnchor(event.currentTarget);
    };

    const handleDateRangeClose = () => {
        setDateRangeAnchor(null);
    };

    // Highcharts options for Reports
    const productStatusChartOptions: Highcharts.Options = {
        chart: { type: 'pie', height: 300 },
        title: { text: 'Product Status Distribution' },
        series: [
            {
                name: 'Products',
                type: 'pie',
                data: [
                    { name: 'Active', y: sampleData.activeProducts, color: '#2e7d32' },
                    { name: 'Inactive', y: sampleData.inactiveProducts, color: '#ed6c02' },
                ],
            },
        ],
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b><br/>Count: {point.y}',
        },
    };

    const stockStatusChartOptions: Highcharts.Options = {
        chart: { type: 'bar', height: 300 },
        title: { text: 'Stock Status Distribution' },
        xAxis: {
            categories: ['In Stock', 'Low Stock', 'Out of Stock'],
            title: { text: 'Stock Status' },
        },
        yAxis: {
            title: { text: 'Number of Products' },
        },
        series: [
            {
                name: 'Products',
                type: 'bar',
                data: [
                    sampleData.stockSummary.inStock,
                    sampleData.stockSummary.lowStock,
                    sampleData.stockSummary.outOfStock,
                ],
                color: '#1976d2',
            },
        ],
        tooltip: {
            formatter: function () {
                return `<b>${this.x}</b><br/>Products: ${this.y}`;
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

            <Grid container spacing={3}>
                {/* Single Column - Tabs */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="Products" />
                            <Tab label="Reports" />
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                    {subCategory.title}
                                </Typography>

                                {/* Image Section */}
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
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                    <Chip
                                        label={subCategory.status}
                                        color={getStatusColor(subCategory.status)}
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            {/* Nested Tabs within Overview */}
                            <Tabs value={overviewTabValue} onChange={handleOverviewTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                <Tab label="Basic Information" />
                                <Tab label="Details" />
                                <Tab label="Metadata" />
                            </Tabs>

                            {/* Basic Information Tab */}
                            <TabPanel value={overviewTabValue} index={0}>
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
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Display Order
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {sampleData.displayOrder}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </TabPanel>

                            {/* Details Tab */}
                            <TabPanel value={overviewTabValue} index={1}>
                                {subCategory.description ? (
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                            Description
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                            {subCategory.description}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        No description available.
                                    </Typography>
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

                            {/* Metadata Tab */}
                            <TabPanel value={overviewTabValue} index={2}>
                                <Grid container spacing={2}>
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
                            </TabPanel>
                        </TabPanel>

                        {/* Products Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <ProductsTable subCategoryId={subCategory.id} />
                        </TabPanel>

                        {/* Reports Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    Sub-Category Reports & Statistics
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<DateRangeIcon />}
                                    onClick={handleDateRangeClick}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {startDate && endDate
                                        ? `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`
                                        : 'Select Date Range'}
                                </Button>
                                <Popover
                                    open={Boolean(dateRangeAnchor)}
                                    anchorEl={dateRangeAnchor}
                                    onClose={handleDateRangeClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                >
                                    <Box sx={{ p: 2 }}>
                                        <DateRange
                                            ranges={dateRangeState}
                                            onChange={handleDateRangeChange}
                                            showDateDisplay={false}
                                            rangeColors={['#1976d2']}
                                        />
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    const today = new Date();
                                                    const last30Days = subDays(today, 30);
                                                    setDateRangeState([
                                                        {
                                                            startDate: last30Days,
                                                            endDate: today,
                                                            key: 'selection',
                                                        },
                                                    ]);
                                                    dispatch(
                                                        setDateRange({
                                                            startDate: startOfDay(last30Days),
                                                            endDate: endOfDay(today),
                                                        })
                                                    );
                                                }}
                                            >
                                                Last 30 Days
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={handleDateRangeClose}
                                            >
                                                Apply
                                            </Button>
                                        </Box>
                                    </Box>
                                </Popover>
                            </Box>

                            {/* Summary Cards */}
                            <Grid container spacing={2} sx={{ mb: 4 }}>
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
                                                <Avatar sx={{ bgcolor: 'success.dark' }}>
                                                    <AttachMoneyIcon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        Total Revenue
                                                    </Typography>
                                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                        ₹{sampleData.totalRevenue.toLocaleString()}
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
                                                <Avatar sx={{ bgcolor: 'error.main' }}>
                                                    <CancelIcon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        Out of Stock
                                                    </Typography>
                                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                                                        {sampleData.outOfStockProducts}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Charts Section */}
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 2, color: '#333' }}>
                                Visual Analytics
                            </Typography>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <HighchartsReact highcharts={Highcharts} options={productStatusChartOptions} />
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <HighchartsReact highcharts={Highcharts} options={stockStatusChartOptions} />
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
