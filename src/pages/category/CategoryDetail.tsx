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
import { fetchCategories } from '../../services/category.service';
import { fetchSubCategoriesByCategoryId } from '../../services/sub-category.service';
import { showErrorToast } from '../../utils/toast';
import type { Category } from '../../types/category';
import type { SubCategoryByCategoryIdItem } from '../../types/sub-category';
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
import type { Column } from '../../types/table';

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

interface SubCategoriesTableProps {
    categoryId: number;
}

function SubCategoriesTable({ categoryId }: SubCategoriesTableProps) {
    const navigate = useNavigate();

    const columns: Column<SubCategoryByCategoryIdItem>[] = [
        {
            id: 'name',
            label: 'Name',
            minWidth: 200,
            render: (row: SubCategoryByCategoryIdItem) => (
                <Typography
                    component="button"
                    onClick={() => navigate(`/sub-category/detail/${row.id}`)}
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
                    {row.name}
                </Typography>
            ),
        },
        {
            id: 'products_count',
            label: 'Products',
            minWidth: 100,
            align: 'right',
            format: (value: number) => value.toLocaleString(),
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            render: (row: SubCategoryByCategoryIdItem) => (
                <Chip
                    label={row.status}
                    color={row.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
        {
            id: 'id',
            label: 'Actions',
            minWidth: 100,
            align: 'center',
            render: (row: SubCategoryByCategoryIdItem) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/sub-category/detail/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2' }
                        }}
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    // Create a fetch function that wraps the service call
    const fetchSubCategories = React.useCallback(
        async (params: {
            page?: number;
            pageSize?: number;
            searchKeyword?: string;
            filters?: Record<string, string | number | boolean> | Array<{ key: string; [key: string]: unknown }>;
            sorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
            signal?: AbortSignal;
        }) => {
            return fetchSubCategoriesByCategoryId({
                ...params,
                categoryId,
            });
        },
        [categoryId]
    );

    const {
        paginationModel,
        tableState,
        tableHandlers,
    } = useServerPagination<SubCategoryByCategoryIdItem>({
        fetchFunction: fetchSubCategories,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: {},
        initialSorting: [],
        searchDebounceMs: 500,
    });

    return (
            <DataTable
                key={`sub-category-table-${paginationModel.page}-${paginationModel.pageSize}`}
                columns={columns}
                state={tableState}
                handlers={tableHandlers}
            />
    );
}

// Sample data - will be replaced with API data later
const sampleData = {
    slug: 'electronics',
    displayOrder: 1,
    subCategoriesCount: 8,
    totalProducts: 245,
    activeProducts: 198,
    inactiveProducts: 47,
    createdBy: 'Admin User',
    lastModifiedBy: 'Manager User',
    // Reports data
    totalRevenue: 12500000,
    averageProductPrice: 51020,
    lowStockProducts: 12,
    outOfStockProducts: 3,
    totalOrders: 1245,
    growthRate: 15.5,
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
    const dispatch = useAppDispatch();
    const { startDate, endDate } = useAppSelector((state) => state.dateRange);
    const [category, setCategory] = React.useState<Category | null>(null);
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

    // Highcharts options
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

    const subCategoryChartOptions: Highcharts.Options = {
        chart: { type: 'bar', height: 300 },
        title: { text: 'Products by Sub-Category' },
        xAxis: {
            categories: sampleData.subCategories.map((sc) => sc.name),
            title: { text: 'Sub-Category' },
        },
        yAxis: {
            title: { text: 'Number of Products' },
        },
        series: [
            {
                name: 'Products',
                type: 'bar',
                data: sampleData.subCategories.map((sc) => sc.products),
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

            <Grid container spacing={3}>
                {/* Single Column - Tabs */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="Sub-Categories" />
                            <Tab label="Reports" />
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                    {category.title}
                                </Typography>

                                {/* Image Section */}
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
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <Chip
                                label={category.status}
                                color={getStatusColor(category.status)}
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
                                {category.description ? (
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                            Description
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                            {category.description}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        No description available.
                                    </Typography>
                                )}
                            </TabPanel>

                            {/* Metadata Tab */}
                            <TabPanel value={overviewTabValue} index={2}>
                                <Grid container spacing={2}>
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
                                                Last Modified By
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {sampleData.lastModifiedBy}
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
                            </TabPanel>
                        </TabPanel>

                        {/* Sub-Categories Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <SubCategoriesTable categoryId={category.id} />
                        </TabPanel>

                        {/* Reports Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    Category Reports & Statistics
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
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <HighchartsReact highcharts={Highcharts} options={productStatusChartOptions} />
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <HighchartsReact highcharts={Highcharts} options={subCategoryChartOptions} />
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
