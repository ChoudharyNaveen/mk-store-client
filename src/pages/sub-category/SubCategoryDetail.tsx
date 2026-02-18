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
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSubCategories, fetchSubCategoryStats } from '../../services/sub-category.service';
import { fetchProducts } from '../../services/product.service';
import { getProductTypes } from '../../services/product-type.service';
import { showErrorToast } from '../../utils/toast';
import type { SubCategory, SubCategoryStats } from '../../types/sub-category';
import type { Product, ProductVariant } from '../../types/product';
import type { ProductType } from '../../types/product-type';
import type { Column, TableState } from '../../types/table';
import NewProductTypeDialog from '../../components/NewProductTypeDialog';
import AddIcon from '@mui/icons-material/Add';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setDateRange } from '../../store/dateRangeSlice';
import DataTable from '../../components/DataTable';
import KPICard from '../../components/KPICard';
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

// Helper function to get default image from images array
const getDefaultImage = (product: Product): string | undefined => {
    if (product.images && product.images.length > 0) {
        const defaultImage = product.images.find(img => img.is_default);
        return defaultImage?.image_url || product.images[0]?.image_url;
    }
    return product.image;
};

// Helper function to get first variant
const getFirstVariant = (product: Product): ProductVariant | null => {
    if (product.variants && product.variants.length > 0) {
        return product.variants[0];
    }
    return null;
};

// Helper function to format variant item details
const formatVariantItemDetails = (variant: ProductVariant): string => {
    const parts: string[] = [];

    // Quantity (units)
    if (variant.quantity !== undefined && variant.quantity !== null) {
        parts.push(`${variant.quantity} unit${variant.quantity !== 1 ? 's' : ''}`);
    }

    // Item quantity + unit
    if (variant.item_quantity !== undefined && variant.item_quantity !== null && variant.item_unit) {
        parts.push(`${variant.item_quantity} ${variant.item_unit}`);
    } else if (variant.item_quantity !== undefined && variant.item_quantity !== null) {
        parts.push(`${variant.item_quantity}`);
    } else if (variant.item_unit) {
        parts.push(variant.item_unit);
    }

    return parts.length > 0 ? parts.join(' × ') : 'N/A';
};

// Helper function to format expiry date with color coding
const formatExpiryDate = (expiryDate: string | Date | undefined | null): { text: string; color: string } => {
    if (!expiryDate) {
        return { text: 'N/A', color: '#666' };
    }

    try {
        const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(date);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const formattedDate = format(date, 'MMM dd, yyyy');

        if (diffDays < 0) {
            return { text: formattedDate, color: '#d32f2f' }; // Red - expired
        } else if (diffDays <= 7) {
            return { text: formattedDate, color: '#ed6c02' }; // Orange - expiring soon
        } else {
            return { text: formattedDate, color: '#2e7d32' }; // Green - valid
        }
    } catch {
        return { text: 'Invalid Date', color: '#666' };
    }
};

// Helper component for Variants Popover
const VariantsPopover: React.FC<{ product: Product }> = ({ product }) => {
    if (!product.variants || product.variants.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">No variants available</Typography>
            </Box>
        );
    }

    // Define columns for variants table
    const variantColumns: Column<ProductVariant>[] = [
        {
            id: 'variant_name',
            label: 'Variant Name',
            minWidth: 120,
        },
        {
            id: 'price',
            label: 'MRP',
            minWidth: 100,
            align: 'right',
            format: (value: number) => `₹${value}`,
        },
        {
            id: 'selling_price',
            label: 'Selling Price',
            minWidth: 120,
            align: 'right',
            format: (value: number) => `₹${value}`,
        },
        {
            id: 'quantity',
            label: 'Quantity',
            minWidth: 100,
            align: 'right',
        },
        {
            id: 'item_quantity' as keyof ProductVariant,
            label: 'Item Details',
            minWidth: 150,
            render: (row: ProductVariant) => formatVariantItemDetails(row),
        },
        {
            id: 'expiry_date' as keyof ProductVariant,
            label: 'Expiry Date',
            minWidth: 120,
            render: (row: ProductVariant) => {
                const { text: expiryText, color: expiryColor } = formatExpiryDate(row.expiry_date);
                return (
                    <Typography variant="body2" sx={{ color: expiryColor, fontWeight: 500 }}>
                        {expiryText}
                    </Typography>
                );
            },
        },
        {
            id: 'product_status' as keyof ProductVariant,
            label: 'Status',
            minWidth: 100,
            render: (row: ProductVariant) => (
                <Chip
                    label={row.product_status}
                    size="small"
                    color={row.product_status === 'INSTOCK' ? 'success' : 'error'}
                    sx={{ fontWeight: 500 }}
                />
            ),
        },
    ];

    // Create static table state (no pagination needed for popover)
    const variantTableState: TableState<ProductVariant> = {
        data: product.variants,
        total: product.variants.length,
        page: 0,
        rowsPerPage: product.variants.length, // Show all variants
        order: 'asc',
        orderBy: 'variant_name',
        loading: false,
        search: '',
    };

    return (
        <Box sx={{ width: 900, maxHeight: '80vh', overflow: 'auto', p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                Variants for {product.title}
            </Typography>
            <DataTable
                columns={variantColumns}
                state={variantTableState}
                hidePagination={true}
            />
        </Box>
    );
};

interface ProductsTableProps {
    subCategoryId: number;
}

function ProductsTable({ subCategoryId }: ProductsTableProps) {
    const navigate = useNavigate();

    // Variants popover state
    const [variantsAnchorEl, setVariantsAnchorEl] = React.useState<{ el: HTMLElement; product: Product } | null>(null);

    const columns: Column<Product>[] = [
        {
            id: 'image' as keyof Product,
            label: 'Image',
            minWidth: 80,
            render: (row: Product) => {
                const imageUrl = getDefaultImage(row);
                return (
                    <Avatar
                        src={imageUrl}
                        alt={row.title}
                        variant="rounded"
                        sx={{ width: 50, height: 50 }}
                    />
                );
            },
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
            render: (row: Product) => {
                const firstVariant = getFirstVariant(row);
                const sellingPrice = firstVariant?.selling_price ?? row.selling_price;
                return sellingPrice !== undefined && sellingPrice !== null ? `₹${sellingPrice}` : 'N/A';
            },
        },
        {
            id: 'quantity' as keyof Product,
            label: 'Qty',
            minWidth: 80,
            align: 'right',
            render: (row: Product) => {
                const firstVariant = getFirstVariant(row);
                const quantity = firstVariant?.quantity ?? row.quantity;
                return quantity !== undefined && quantity !== null ? quantity.toString() : 'N/A';
            },
        },
        {
            id: 'product_status' as keyof Product,
            label: 'Stock Status',
            minWidth: 120,
            align: 'center',
            render: (row: Product) => {
                const firstVariant = getFirstVariant(row);
                const status = firstVariant?.product_status ?? row.product_status;
                if (!status) return 'N/A';
                return (
                    <Chip
                        label={status}
                        color={status === 'INSTOCK' ? 'success' : 'error'}
                        size="small"
                    />
                );
            },
        },
        {
            id: 'variants' as keyof Product,
            label: 'Variants',
            minWidth: 100,
            align: 'center' as const,
            render: (row: Product) => {
                const variantCount = row.variants?.length || 0;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Chip
                            label={`${variantCount} variant${variantCount !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{ fontWeight: 500 }}
                        />
                        <IconButton
                            size="small"
                            onClick={(e) => setVariantsAnchorEl({ el: e.currentTarget, product: row })}
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                color: 'primary.main',
                                '&:hover': { bgcolor: '#e3f2fd', borderColor: 'primary.main' }
                            }}
                        >
                            <InfoIcon fontSize="small" />
                        </IconButton>
                    </Box>
                );
            },
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
            render: (row: Product) => {
                const createdDate = row.created_at ?? row.createdAt;
                return createdDate ? format(new Date(createdDate), 'MMM dd, yyyy') : 'N/A';
            },
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

    const { paginationModel, setPaginationModel, tableState } = useServerPagination<Product>({
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
        <>
            <DataTable
                key={`sub-category-products-table-${paginationModel.page}-${paginationModel.pageSize}`}
                columns={columns}
                state={tableState}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
            />
            <Popover
                open={Boolean(variantsAnchorEl)}
                anchorEl={variantsAnchorEl?.el}
                onClose={() => setVariantsAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{
                    sx: {
                        maxHeight: '80vh',
                        overflow: 'auto',
                    }
                }}
            >
                {variantsAnchorEl && <VariantsPopover product={variantsAnchorEl.product} />}
            </Popover>
        </>
    );
}

interface ProductTypesTableProps {
    subCategoryId: number;
}

function ProductTypesTable({ subCategoryId }: ProductTypesTableProps) {
    const [productTypeDialogOpen, setProductTypeDialogOpen] = React.useState(false);
    const [editingProductType, setEditingProductType] = React.useState<ProductType | null>(null);

    const fetchProductTypesBySubCategory = React.useCallback(
        async (params: {
            page?: number;
            pageSize?: number;
            searchKeyword?: string;
            sorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
            signal?: AbortSignal;
        }) => {
            return getProductTypes({
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

    const { paginationModel, setPaginationModel, tableState, tableHandlers } = useServerPagination<ProductType>({
        fetchFunction: fetchProductTypesBySubCategory,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: {},
        initialSorting: [{ key: 'id', direction: 'DESC' }],
        searchDebounceMs: 500,
    });

    const columns: Column<ProductType>[] = [
        {
            id: 'id' as keyof ProductType,
            label: 'ID',
            minWidth: 80,
        },
        {
            id: 'title' as keyof ProductType,
            label: 'Title',
            minWidth: 200,
        },
        {
            id: 'status' as keyof ProductType,
            label: 'Status',
            minWidth: 100,
            align: 'center' as const,
            render: (row: ProductType) => (
                <Chip
                    label={row.status}
                    color={row.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
        {
            id: 'createdAt' as keyof ProductType,
            label: 'Created',
            minWidth: 140,
            render: (row: ProductType) => {
                const created = row.createdAt ?? row.created_at;
                return created ? format(new Date(created), 'MMM dd, yyyy') : 'N/A';
            },
        },
        {
            id: 'action' as keyof ProductType,
            label: 'Action',
            minWidth: 80,
            align: 'center' as const,
            render: (row: ProductType) => (
                <IconButton
                    size="small"
                    onClick={() => {
                        setEditingProductType(row);
                        setProductTypeDialogOpen(true);
                    }}
                    sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.main' },
                    }}
                    aria-label="Edit product type"
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            ),
        },
    ];

    const handleProductTypeSuccess = () => {
        setEditingProductType(null);
        tableHandlers.refresh();
    };

    const handleProductTypeDialogClose = () => {
        setProductTypeDialogOpen(false);
        setEditingProductType(null);
    };

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setEditingProductType(null);
                        setProductTypeDialogOpen(true);
                    }}
                    sx={{ textTransform: 'none' }}
                >
                    Add Product Type
                </Button>
            </Box>
            <DataTable
                key={`sub-category-product-types-table-${paginationModel.page}-${paginationModel.pageSize}`}
                columns={columns}
                state={tableState}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
            />
            <NewProductTypeDialog
                open={productTypeDialogOpen}
                onClose={handleProductTypeDialogClose}
                subCategoryId={subCategoryId}
                productType={editingProductType}
                onSuccess={handleProductTypeSuccess}
            />
        </>
    );
}

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
    const [stats, setStats] = React.useState<SubCategoryStats | null>(null);
    const [statsLoading, setStatsLoading] = React.useState(false);

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

    // Fetch stats when Reports tab is active and when date range changes
    React.useEffect(() => {
        const loadStats = async () => {
            if (!subCategory || tabValue !== 3) {
                return; // Only fetch when Reports tab is active
            }

            try {
                setStatsLoading(true);
                const startDateStr = dateRangeState[0].startDate.toISOString().split('T')[0];
                const endDateStr = dateRangeState[0].endDate.toISOString().split('T')[0];

                const statsData = await fetchSubCategoryStats({
                    subCategoryId: subCategory.id,
                    startDate: startDateStr,
                    endDate: endDateStr,
                });

                setStats(statsData);
            } catch (error) {
                console.error('Error fetching sub-category stats:', error);
                showErrorToast('Failed to load statistics');
            } finally {
                setStatsLoading(false);
            }
        };

        loadStats();
    }, [subCategory, tabValue, dateRangeState]);

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
            // Stats will be refreshed automatically via useEffect when dateRangeState changes
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
                    { name: 'Active', y: stats?.charts.product_status_distribution.active || 0, color: '#2e7d32' },
                    { name: 'Inactive', y: stats?.charts.product_status_distribution.inactive || 0, color: '#ed6c02' },
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
                    stats?.charts.stock_status_distribution.in_stock || 0,
                    stats?.charts.stock_status_distribution.low_stock || 0,
                    stats?.charts.stock_status_distribution.out_of_stock || 0,
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
                        <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                            {subCategory.title || 'Sub Category'}
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
                        disabled={false}
                    >
                        Delete
                    </Button>
                </Stack>
                </Box>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ pt: 2 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="Products" />
                            <Tab label="Product Types" />
                            <Tab label="Reports" />
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 3 }}>
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

                        {/* Product Types Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <ProductTypesTable subCategoryId={subCategory.id} />
                        </TabPanel>

                        {/* Reports Tab */}
                        <TabPanel value={tabValue} index={3}>
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
                                    {dateRangeState[0].startDate && dateRangeState[0].endDate
                                        ? `${format(dateRangeState[0].startDate, 'MMM dd, yyyy')} - ${format(dateRangeState[0].endDate, 'MMM dd, yyyy')}`
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
                            {statsLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                                    <CircularProgress />
                                </Box>
                            ) : stats ? (
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    {[
                                        {
                                            label: 'Total Products',
                                            value: stats.total_products,
                                            icon: <InventoryIcon />,
                                            iconBgColor: '#2e7d32',
                                            bgColor: '#e8f5e9',
                                        },
                                        {
                                            label: 'Active Products',
                                            value: stats.active_products,
                                            icon: <ShoppingCartIcon />,
                                            iconBgColor: '#0288d1',
                                            bgColor: '#e1f5fe',
                                            valueColor: '#2e7d32',
                                        },
                                        {
                                            label: 'Total Revenue',
                                            value: `₹${stats.total_revenue.toLocaleString()}`,
                                            icon: <AttachMoneyIcon />,
                                            iconBgColor: '#1b5e20',
                                            bgColor: '#e8f5e9',
                                            valueColor: '#2e7d32',
                                        },
                                        {
                                            label: 'Out of Stock',
                                            value: stats.out_of_stock,
                                            icon: <CancelIcon />,
                                            iconBgColor: '#d32f2f',
                                            bgColor: '#ffebee',
                                            valueColor: '#d32f2f',
                                        },
                                    ].map((kpi, index) => (
                                        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                                            <KPICard
                                                label={kpi.label}
                                                value={kpi.value}
                                                icon={kpi.icon}
                                                iconBgColor={kpi.iconBgColor}
                                                bgColor={kpi.bgColor}
                                                valueColor={kpi.valueColor}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        No statistics available for the selected date range
                                    </Typography>
                                </Box>
                            )}

                            {/* Charts Section */}
                            {stats && (
                                <>
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
                                </>
                            )}
                        </TabPanel>
                    </Box>
                </Grid>
            </Grid>
            </Paper>
        </Box>
    );
}
