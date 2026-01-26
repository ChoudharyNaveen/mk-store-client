import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Avatar,
    Chip,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Popover,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../components/DataTable';
import type { Column, TableState } from '../types/table';
import { getLastNDaysRangeForDatePicker } from '../utils/date';
import { 
    fetchDashboardKPIs, 
    fetchTopProducts,
    fetchRecentOrders,
    fetchExpiringProducts,
} from '../services/dashboard.service';
import type { 
    DashboardKPIs, 
    TopProductDataPoint,
    RecentOrderDataPoint,
    ExpiringProductVariantResponse,
    FetchExpiringProductsParams,
} from '../services/dashboard.service';
import { useServerPagination } from '../hooks/useServerPagination';
import type { FetchParams, ServerPaginationResponse } from '../hooks/useServerPagination';
import { useAppSelector } from '../store/hooks';
import { showErrorToast } from '../utils/toast';
import { formatDateToYYYYMMDD } from '../utils/date';


type ExpiringProductVariant = {
    id: number;
    productId: number;
    productName: string;
    variantId: number;
    variantName: string;
    quantity: number;
    expiryDate: Date;
    sellingPrice: number;
    category: string;
};

// Helper function to get expiry status and color
const getExpiryStatus = (expiryDate: Date): { text: string; color: string; days: number } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const days = differenceInDays(expiry, today);

    if (days < 0) {
        return { text: `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`, color: '#d32f2f', days };
    } else if (days <= 7) {
        return { text: `Expires in ${days} day${days !== 1 ? 's' : ''}`, color: '#ed6c02', days };
    } else {
        return { text: `Expires in ${days} days`, color: '#2e7d32', days };
    }
};

// Helper function to build base API params
const buildBaseParams = (vendorId: number | undefined, selectedBranchId: number | undefined, includeDateRange = false, dateRange?: any) => {
    const params: any = {
        vendorId: Number(vendorId),
        branchId: Number(selectedBranchId),
    };
    
    if (includeDateRange && dateRange?.[0]?.startDate && dateRange[0]?.endDate) {
        params.startDate = formatDateToYYYYMMDD(dateRange[0].startDate);
        params.endDate = formatDateToYYYYMMDD(dateRange[0].endDate);
    }
    
    return params;
};

// Helper function to sort expiring products
const sortExpiringProducts = <T extends ExpiringProductVariant>(
    data: T[],
    orderBy: string,
    order: 'asc' | 'desc'
): T[] => {
    return [...data].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (orderBy) {
            case 'expiryDate':
                aValue = a.expiryDate.getTime();
                bValue = b.expiryDate.getTime();
                break;
            case 'productName':
                aValue = a.productName.toLowerCase();
                bValue = b.productName.toLowerCase();
                break;
            case 'variantName':
                aValue = a.variantName.toLowerCase();
                bValue = b.variantName.toLowerCase();
                break;
            case 'quantity':
                aValue = a.quantity;
                bValue = b.quantity;
                break;
            case 'sellingPrice':
                aValue = a.sellingPrice;
                bValue = b.sellingPrice;
                break;
            case 'category':
                aValue = a.category.toLowerCase();
                bValue = b.category.toLowerCase();
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
    });
};

export default function Dashboard() {
    const navigate = useNavigate();

    // Get vendorId and branchId from store
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;

    const [expiringDialogOpen, setExpiringDialogOpen] = React.useState(false);

    // KPI state
    const [kpis, setKpis] = React.useState<DashboardKPIs | null>(null);
    const [kpisLoading, setKpisLoading] = React.useState(true);

    // Date range state
    const [dateAnchorEl, setDateAnchorEl] = React.useState<HTMLElement | null>(null);
    const [dateRange, setDateRange] = React.useState(getLastNDaysRangeForDatePicker(30));

    // Memoize date range strings to prevent unnecessary re-renders
    const dateRangeKey = React.useMemo(() => {
        if (dateRange[0]?.startDate && dateRange[0]?.endDate) {
            return `${formatDateToYYYYMMDD(dateRange[0].startDate)}_${formatDateToYYYYMMDD(dateRange[0].endDate)}`;
        }
        return 'default';
    }, [dateRange]);

    // Refs to prevent duplicate API calls
    const fetchRefs = React.useRef<Record<string, string | boolean | null>>({});

    // Fetch KPIs
    React.useEffect(() => {
        if (!vendorId || !selectedBranchId) {
            setKpisLoading(false);
            return;
        }

        const fetchKey = `kpis_${vendorId}_${selectedBranchId}`;
        if (fetchRefs.current[fetchKey] === true) {
            return;
        }
        fetchRefs.current[fetchKey] = true;

        const loadKPIs = async () => {
            try {
                setKpisLoading(true);
                const kpiData = await fetchDashboardKPIs({
                    vendorId: Number(vendorId),
                    branchId: Number(selectedBranchId),
                });
                setKpis(kpiData);
            } catch (error) {
                console.error('Error fetching dashboard KPIs:', error);
                showErrorToast('Failed to load dashboard KPIs');
                fetchRefs.current[fetchKey] = null;
            } finally {
                setKpisLoading(false);
                fetchRefs.current[fetchKey] = false;
            }
        };

        loadKPIs();
    }, [vendorId, selectedBranchId]);

    // Top products state
    const [topProducts, setTopProducts] = React.useState<TopProductDataPoint[]>([]);
    const [topProductsLoading, setTopProductsLoading] = React.useState(false);
    
    // Recent orders state
    const [recentOrders, setRecentOrders] = React.useState<RecentOrderDataPoint[]>([]);
    const [recentOrdersLoading, setRecentOrdersLoading] = React.useState(false);

    // Helper function to map API response to ExpiringProductVariant
    const mapExpiringProductVariant = (item: ExpiringProductVariantResponse): ExpiringProductVariant => ({
        id: item.variant_id,
        productId: item.product_id,
        productName: item.product_name,
        variantId: item.variant_id,
        variantName: item.variant_name,
        quantity: item.stock,
        expiryDate: new Date(item.expiry_date),
        sellingPrice: item.price,
        category: item.category_name,
    });

    // Wrapper function for useServerPagination to convert API format
    const fetchExpiringProductsForPagination = React.useCallback(async (
        params: FetchParams
    ): Promise<ServerPaginationResponse<ExpiringProductVariant>> => {
        // Validate required parameters
        if (!vendorId || !selectedBranchId) {
            return {
                list: [],
                totalCount: 0,
                pageDetails: {
                    pageNumber: 1,
                    pageSize: params.pageSize ?? 10,
                    paginationEnabled: true,
                },
            };
        }

        try {
            const apiParams: FetchExpiringProductsParams = {
                pageSize: params.pageSize ?? 10,
                pageNumber: (params.page ?? 0) + 1, // Convert 0-based to 1-based
                vendorId: Number(vendorId),
                branchId: Number(selectedBranchId),
                daysAhead: 30,
                sorting: params.sorting?.map(s => ({
                    key: s.key,
                    direction: s.direction,
                })),
            };

            // Convert filters if provided
            if (params.filters && Object.keys(params.filters).length > 0) {
                apiParams.filters = Object.entries(params.filters).map(([key, value]) => {
                    if (typeof value === 'string') {
                        return { key, eq: value };
                    }
                    return { key, eq: String(value) };
                });
            }

            const response = await fetchExpiringProducts(apiParams);
            
            return {
                list: response.doc.map(mapExpiringProductVariant),
                totalCount: response.pagination.totalCount,
                pageDetails: {
                    pageNumber: response.pagination.pageNumber,
                    pageSize: response.pagination.pageSize,
                    paginationEnabled: true,
                },
            };
        } catch (error) {
            console.error('Error fetching expiring products:', error);
            // Return empty response to prevent infinite retries
            return {
                list: [],
                totalCount: 0,
                pageDetails: {
                    pageNumber: 1,
                    pageSize: params.pageSize ?? 10,
                    paginationEnabled: true,
                },
            };
        }
    }, [vendorId, selectedBranchId]);

    // Build filters for expiring products (vendorId and branchId)
    const buildExpiringProductsFilters = React.useCallback(() => {
        const filters: Record<string, any> = {};
        if (vendorId) {
            filters.vendorId = vendorId;
        }
        if (selectedBranchId) {
            filters.branchId = selectedBranchId;
        }
        return filters;
    }, [vendorId, selectedBranchId]);

    // Use server pagination for dialog table - following ProductList.tsx pattern
    const {
        paginationModel: expiringPaginationModel,
        setPaginationModel: setExpiringPaginationModel,
        setFilters: setExpiringFilters,
        tableState: expiringTableState,
        tableHandlers: expiringTableHandlers,
    } = useServerPagination<ExpiringProductVariant>({
        fetchFunction: fetchExpiringProductsForPagination,
        initialPageSize: 10,
        enabled: true,
        autoFetch: false, // Fetch only when dialog opens
        filters: buildExpiringProductsFilters(),
        initialSorting: [
            {
                key: 'expiry_date',
                direction: 'ASC',
            },
        ],
        searchDebounceMs: 500,
    });

    // Expiring products state for dashboard table (first 10 items)
    const [dashboardExpiringProducts, setDashboardExpiringProducts] = React.useState<ExpiringProductVariant[]>([]);
    const [dashboardExpiringProductsLoading, setDashboardExpiringProductsLoading] = React.useState(false);
    const [expiringProductsTotalCount, setExpiringProductsTotalCount] = React.useState(0);

    // Fetch top products data
    React.useEffect(() => {
        if (!vendorId || !selectedBranchId) return;

        const fetchKey = `topProducts_${vendorId}_${selectedBranchId}_${dateRangeKey}`;
        if (fetchRefs.current[fetchKey] === true) return;
        fetchRefs.current[fetchKey] = true;

        const loadTopProducts = async () => {
            try {
                setTopProductsLoading(true);
                const params = buildBaseParams(vendorId, selectedBranchId, true, dateRange);
                params.limit = 5;
                const data = await fetchTopProducts(params);
                setTopProducts(data);
            } catch (error) {
                console.error('Error fetching top products:', error);
                fetchRefs.current[fetchKey] = null;
            } finally {
                setTopProductsLoading(false);
                fetchRefs.current[fetchKey] = false;
            }
        };

        loadTopProducts();
    }, [dateRangeKey, vendorId, selectedBranchId]);

    // Fetch recent orders data
    React.useEffect(() => {
        if (!vendorId || !selectedBranchId) return;

        const fetchKey = `recentOrders_${vendorId}_${selectedBranchId}`;
        if (fetchRefs.current[fetchKey] === true) return;
        fetchRefs.current[fetchKey] = true;

        const loadRecentOrders = async () => {
            try {
                setRecentOrdersLoading(true);
                const params = buildBaseParams(vendorId, selectedBranchId);
                params.limit = 5;
                const data = await fetchRecentOrders(params);
                setRecentOrders(data);
            } catch (error) {
                console.error('Error fetching recent orders:', error);
                fetchRefs.current[fetchKey] = null;
            } finally {
                setRecentOrdersLoading(false);
                fetchRefs.current[fetchKey] = false;
            }
        };

        loadRecentOrders();
    }, [vendorId, selectedBranchId]);

    // Fetch expiring products for dashboard (first 10 items)
    React.useEffect(() => {
        if (!vendorId || !selectedBranchId) {
            setDashboardExpiringProducts([]);
            setExpiringProductsTotalCount(0);
            return;
        }

        const fetchKey = `dashboardExpiringProducts_${vendorId}_${selectedBranchId}`;
        if (fetchRefs.current[fetchKey] === true) return;
        fetchRefs.current[fetchKey] = true;

        const loadDashboardExpiringProducts = async () => {
            try {
                setDashboardExpiringProductsLoading(true);
                const params: FetchExpiringProductsParams = {
                    pageSize: 10,
                    pageNumber: 1,
                    vendorId: Number(vendorId),
                    branchId: Number(selectedBranchId),
                    daysAhead: 30,
                    sorting: [
                        {
                            key: 'expiry_date',
                            direction: 'ASC',
                        },
                    ],
                };

                const response = await fetchExpiringProducts(params);
                const mappedProducts = response.doc.map(mapExpiringProductVariant);
                setDashboardExpiringProducts(mappedProducts);
                // Store total count from API response for "View All" button
                setExpiringProductsTotalCount(response.pagination.totalCount);
            } catch (error) {
                console.error('Error fetching dashboard expiring products:', error);
                setDashboardExpiringProducts([]);
                setExpiringProductsTotalCount(0);
                fetchRefs.current[fetchKey] = null;
            } finally {
                setDashboardExpiringProductsLoading(false);
                fetchRefs.current[fetchKey] = false;
            }
        };

        loadDashboardExpiringProducts();
    }, [vendorId, selectedBranchId]);

    // Ref to track if we've already fetched when dialog opens (prevent infinite retries)
    const expiringDialogFetchedRef = React.useRef(false);

    // Update filters when vendorId or selectedBranchId changes
    React.useEffect(() => {
        if (!vendorId || !selectedBranchId) {
            return;
        }
        setExpiringFilters(buildExpiringProductsFilters());
        // Reset to first page when filters change
        setExpiringPaginationModel((prev) => ({ ...prev, page: 0 }));
        // Reset fetch flag when filters change
        expiringDialogFetchedRef.current = false;
    }, [vendorId, selectedBranchId, setExpiringFilters, buildExpiringProductsFilters, setExpiringPaginationModel]);

    // Fetch expiring products for dialog when it opens - following ProductList.tsx pattern
    React.useEffect(() => {
        if (expiringDialogOpen && vendorId && selectedBranchId && !expiringDialogFetchedRef.current) {
            expiringDialogFetchedRef.current = true;
            expiringTableHandlers.refresh();
        }
        // Reset fetch flag when dialog closes
        if (!expiringDialogOpen) {
            expiringDialogFetchedRef.current = false;
        }
    }, [expiringDialogOpen, vendorId, selectedBranchId]);

    // Table state for dashboard expiring products (limited display - 10 rows, no pagination)
    const dashboardExpiringTableState: TableState<ExpiringProductVariant> = React.useMemo(() => ({
        data: dashboardExpiringProducts,
        total: dashboardExpiringProducts.length,
        page: 1,
        rowsPerPage: 10,
        order: 'asc',
        orderBy: 'expiryDate',
        loading: dashboardExpiringProductsLoading,
        search: '',
    }), [dashboardExpiringProducts, dashboardExpiringProductsLoading]);

    // Table handlers for dashboard expiring products (no-op since no pagination)
    const handleDashboardExpiringRequestSort = React.useCallback(() => {
        // Sorting is handled by API, but we can't change it for dashboard view
    }, []);

    const handleDashboardExpiringChangePage = React.useCallback(() => {
        // No pagination on dashboard
    }, []);

    const handleDashboardExpiringChangeRowsPerPage = React.useCallback(() => {
        // No pagination on dashboard
    }, []);

    // Handler to navigate to product detail page
    const handleExpiringProductClick = React.useCallback((row: ExpiringProductVariant) => {
        navigate(`/products/detail/${row.productId}`);
    }, [navigate]);

    // Columns for expiring products table (dashboard)
    const dashboardExpiringColumns: Column<ExpiringProductVariant>[] = React.useMemo(() => [
        {
            id: 'productName',
            label: 'Product Name',
            minWidth: 130,
            sortable: true,
            render: (row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Avatar
                        sx={{
                            width: 28,
                            height: 28,
                            bgcolor: getExpiryStatus(row.expiryDate).days < 0
                                ? 'error.main'
                                : getExpiryStatus(row.expiryDate).days <= 7
                                    ? 'warning.main'
                                    : 'success.main',
                        }}
                    >
                        <WarningIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#333', fontSize: '0.8rem' }}>
                        {row.productName}
                    </Typography>
                </Box>
            ),
        },
        {
            id: 'variantName',
            label: 'Variant',
            minWidth: 100,
            sortable: true,
            render: (row) => (
                <Chip
                    label={row.variantName}
                    size="small"
                    sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                    }}
                />
            ),
        },
        {
            id: 'category',
            label: 'Category',
            minWidth: 90,
            sortable: true,
            render: (row) => (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                    {row.category}
                </Typography>
            ),
        },
        {
            id: 'quantity',
            label: 'Stock',
            minWidth: 80,
            align: 'right',
            sortable: true,
            render: (row) => (
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#333', fontSize: '0.8rem' }}>
                    {row.quantity}
                </Typography>
            ),
        },
        {
            id: 'sellingPrice',
            label: 'Price',
            minWidth: 80,
            align: 'right',
            sortable: true,
            render: (row) => (
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.8rem' }}>
                    ₹{row.sellingPrice}
                </Typography>
            ),
        },
        {
            id: 'expiryDate',
            label: 'Expiry Status',
            minWidth: 160,
            sortable: true,
            render: (row) => {
                const expiryStatus = getExpiryStatus(row.expiryDate);
                const isExpired = expiryStatus.days < 0;
                const isExpiringSoon = expiryStatus.days <= 7 && expiryStatus.days >= 0;
    return (
        <Box>
                        <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.25, color: '#333', fontSize: '0.75rem', display: 'block' }}>
                            {format(row.expiryDate, 'MMM dd, yyyy')}
                        </Typography>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.25,
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: isExpired
                                    ? 'error.light'
                                    : isExpiringSoon
                                        ? 'warning.light'
                                        : 'success.light',
                                border: '1px solid',
                                borderColor: expiryStatus.color,
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                }}
                            >
                                {expiryStatus.text}
                            </Typography>
                        </Box>
                    </Box>
                );
            },
        },
    ], []);

    // Columns for expiring products table (dialog)
    const expiringColumns: Column<ExpiringProductVariant>[] = React.useMemo(() => [
        {
            id: 'productName',
            label: 'Product Name',
            minWidth: 150,
            sortable: true,
            render: (row) => (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.productName}
                </Typography>
            ),
        },
        {
            id: 'variantName',
            label: 'Variant',
            minWidth: 120,
            sortable: true,
            render: (row) => (
                <Chip
                    label={row.variantName}
                    size="small"
                    sx={{ height: 24, fontSize: '0.75rem' }}
                />
            ),
        },
        {
            id: 'category',
            label: 'Category',
            minWidth: 100,
            sortable: true,
            render: (row) => (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {row.category}
                </Typography>
            ),
        },
        {
            id: 'quantity',
            label: 'Quantity',
            minWidth: 100,
            align: 'right',
            sortable: true,
            render: (row) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.quantity}
                </Typography>
            ),
        },
        {
            id: 'sellingPrice',
            label: 'Price',
            minWidth: 100,
            align: 'right',
            sortable: true,
            render: (row) => (
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    ₹{row.sellingPrice}
                </Typography>
            ),
        },
        {
            id: 'expiryDate',
            label: 'Expiry Date',
            minWidth: 150,
            sortable: true,
            render: (row) => {
                const expiryStatus = getExpiryStatus(row.expiryDate);
                return (
                            <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            {format(row.expiryDate, 'MMM dd, yyyy')}
                        </Typography>
                        <Chip
                            label={expiryStatus.text}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: expiryStatus.days < 0
                                    ? 'error.light'
                                    : expiryStatus.days <= 7
                                        ? 'warning.light'
                                        : 'success.light',
                                color: "white",
                                fontWeight: 600,
                            }}
                        />
                    </Box>
                );
            },
        },
    ], []);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
                        Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Welcome back! Here's what's happening with your store today.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        startIcon={<DateRangeIcon />}
                        sx={{ textTransform: 'none' }}
                        onClick={(e) => setDateAnchorEl(e.currentTarget)}
                    >
                        {dateRange[0]?.startDate && dateRange[0]?.endDate
                            ? `${format(dateRange[0].startDate, 'MMM dd, yyyy')} - ${format(dateRange[0].endDate, 'MMM dd, yyyy')}`
                            : format(new Date(), 'MMM dd, yyyy')}
                    </Button>
                </Box>
            </Box>

            {/* Date Range Picker Popover */}
            <Popover
                open={Boolean(dateAnchorEl)}
                anchorEl={dateAnchorEl}
                onClose={() => setDateAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Box sx={{ p: 1 }}>
                    <DateRangePicker
                        ranges={dateRange}
                        onChange={(ranges: RangeKeyDict) => {
                            if (ranges.selection && ranges.selection.startDate && ranges.selection.endDate) {
                                setDateRange([{
                                    startDate: ranges.selection.startDate,
                                    endDate: ranges.selection.endDate,
                                    key: ranges.selection.key || 'selection'
                                }]);
                            }
                        }}
                        moveRangeOnFirstSelection={false}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1, px: 1, pb: 1 }}>
                        <Button
                            size="small"
                            onClick={() => {
                                setDateRange(getLastNDaysRangeForDatePicker(30));
                                setDateAnchorEl(null);
                            }}
                            sx={{ textTransform: 'none' }}
                        >
                            Reset
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => setDateAnchorEl(null)}
                            sx={{ textTransform: 'none' }}
                        >
                            Apply
                        </Button>
                    </Box>
                </Box>
            </Popover>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {kpisLoading ? (
                    // Loading state - show skeleton or loading cards
                    Array.from({ length: 4 }).map((_, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                            <Card
                                sx={{
                                    p: 2.5,
                                    height: '100%',
                                    borderRadius: 3,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                }}
                            >
                                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                                                Loading...
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5 }}>
                                                --
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : kpis ? (
                    // Render KPIs from API
                    [
                        {
                            title: 'Total Users',
                            kpi: kpis.total_users,
                            icon: PeopleIcon,
                            color: '#7e57c2',
                            bgColor: '#ede7f6',
                            formatValue: (val: number) => val.toLocaleString(),
                        },
                        {
                            title: 'Total Orders',
                            kpi: kpis.total_orders,
                            icon: InventoryIcon,
                            color: '#ffca28',
                            bgColor: '#fff8e1',
                            formatValue: (val: number) => val.toLocaleString(),
                        },
                        {
                            title: 'Revenue',
                            kpi: kpis.revenue,
                            icon: AttachMoneyIcon,
                            color: '#66bb6a',
                            bgColor: '#e8f5e9',
                            formatValue: (val: number) => `₹${val.toLocaleString()}`,
                        },
                        {
                            title: 'Total Returns',
                            kpi: kpis.total_returns,
                            icon: AssignmentReturnIcon,
                            color: '#ff7043',
                            bgColor: '#fbe9e7',
                            formatValue: (val: number) => val.toLocaleString(),
                        },
                    ].map((card, index) => {
                        const IconComponent = card.icon;
                        const isUp = card.kpi.change_type === 'up';
                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                                <Card
                                    sx={{
                                        p: 2.5,
                                        height: '100%',
                                        background: `linear-gradient(135deg, ${card.bgColor} 0%, ${card.bgColor}dd 100%)`,
                                        borderRadius: 3,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>
                                                    {card.title}
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5, color: '#333' }}>
                                                    {card.formatValue(card.kpi.value)}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {isUp ? (
                                                        <ArrowUpwardIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                    ) : (
                                                        <ArrowDownwardIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                                    )}
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: isUp ? 'success.main' : 'error.main',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {Math.abs(card.kpi.change)}%
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
                                                        {isUp ? 'Up' : 'Down'} from {card.kpi.period}
                                </Typography>
                            </Box>
                                            </Box>
                                            <Avatar
                                                sx={{
                                bgcolor: card.color,
                                                    width: 56,
                                                    height: 56,
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                }}
                                            >
                                                <IconComponent sx={{ fontSize: 28 }} />
                                            </Avatar>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })
                ) : (
                    // No data available
                    Array.from({ length: 4 }).map((_, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                            <Card
                                sx={{
                                    p: 2.5,
                                    height: '100%',
                                    borderRadius: 3,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                }}
                            >
                                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                                                No data available
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5 }}>
                                                --
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Bottom Row - Top Products and Recent Orders */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                Top Products
                            </Typography>
                            <Button 
                                size="small" 
                                sx={{ textTransform: 'none' }}
                                onClick={() => navigate('/products')}
                            >
                                View All
                            </Button>
                        </Box>
                        {topProductsLoading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                <Typography color="text.secondary">Loading top products...</Typography>
                            </Box>
                        ) : topProducts.length > 0 ? (
                            <Stack spacing={2}>
                                {topProducts.map((product, index) => (
                                    <Box
                                        key={product.product_id}
                                        sx={{
                                display: 'flex',
                                            justifyContent: 'space-between',
                                alignItems: 'center',
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: index % 2 === 0 ? 'background.default' : 'transparent',
                                            transition: 'background-color 0.2s, cursor 0.2s',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: 'action.hover',
                                            },
                                        }}
                                        onClick={() => navigate(`/products/detail/${product.product_id}`)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    width: 40,
                                                    height: 40,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {product.rank}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                                                    {product.product_name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    ₹{product.revenue.toLocaleString()} • {product.orders} orders
                                                </Typography>
                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {product.trend_type === 'up' ? (
                                                <TrendingUpIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                            ) : (
                                                <TrendingDownIcon sx={{ fontSize: 18, color: 'error.main' }} />
                                            )}
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: product.trend_type === 'up' ? 'success.main' : 'error.main',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {product.trend_type === 'up' ? '+' : ''}{product.trend}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                <Typography color="text.secondary">No top products data available</Typography>
                            </Box>
                        )}
                        </Paper>
                    </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                Recent Orders
                            </Typography>
                            <Button
                                size="small"
                                sx={{ textTransform: 'none' }}
                                onClick={() => navigate('/orders')}
                            >
                                View All
                            </Button>
                        </Box>
                        {recentOrdersLoading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                <Typography color="text.secondary">Loading recent orders...</Typography>
                            </Box>
                        ) : recentOrders.length > 0 ? (
                            <Stack spacing={2}>
                                {recentOrders.map((order) => {
                                    const getStatusColor = (status: string) => {
                                        const upperStatus = status.toUpperCase();
                                        if (upperStatus === 'DELIVERED' || upperStatus === 'COMPLETED') return 'success';
                                        if (upperStatus === 'PENDING') return 'warning';
                                        if (upperStatus === 'ACCEPTED' || upperStatus === 'PROCESSING') return 'info';
                                        return 'default';
                                    };

                                    return (
                                        <Box
                                            key={order.order_id}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                p: 2,
                                                borderRadius: 2,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                transition: 'box-shadow 0.2s, cursor 0.2s',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    borderColor: 'primary.main',
                                                },
                                            }}
                                            onClick={() => navigate(`/orders/detail/${order.order_id}`)}
                                        >
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: 'primary.main',
                                                            '&:hover': {
                                                                textDecoration: 'underline',
                                                            },
                                                        }}
                                                    >
                                                        {order.order_number}
                                                    </Typography>
                                                    <Chip
                                                        label={order.status}
                                                        size="small"
                                                        color={getStatusColor(order.status)}
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {order.customer_name != "N/A" ? order.customer_name : ''} • {order.time_ago}
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                ₹{order.price.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                <Typography color="text.secondary">No recent orders data available</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Expiring Products Section */}
            <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid size={{ xs: 12 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            background: 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)',
                            border: '1px solid',
                            borderColor: 'warning.light',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: 'warning.main',
                                        width: 40,
                                        height: 40,
                                        boxShadow: '0 2px 8px rgba(237, 108, 2, 0.3)',
                                    }}
                                >
                                    <WarningIcon sx={{ fontSize: 24 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', mb: 0.25 }}>
                                        Expiring Products
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Products and variants expiring soon
                                    </Typography>
                    </Box>
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{
                                    textTransform: 'none',
                                    borderColor: 'warning.main',
                                    color: 'warning.main',
                                    '&:hover': {
                                        borderColor: 'warning.dark',
                                        bgcolor: 'warning.light',
                                        color: 'white',
                                    },
                                }}
                                onClick={() => setExpiringDialogOpen(true)}
                            >
                                View All ({expiringProductsTotalCount})
                            </Button>
                        </Box>
                        <Box
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                            }}
                        >
                            {dashboardExpiringProductsLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                    <Typography color="text.secondary">Loading expiring products...</Typography>
                                </Box>
                            ) : dashboardExpiringProducts.length > 0 ? (
                                <DataTable
                                    columns={dashboardExpiringColumns}
                                    state={dashboardExpiringTableState}
                                    handlers={{
                                        handleRequestSort: handleDashboardExpiringRequestSort,
                                        handleChangePage: handleDashboardExpiringChangePage,
                                        handleChangeRowsPerPage: handleDashboardExpiringChangeRowsPerPage,
                                    }}
                                    hidePagination={true}
                                    compact={true}
                                    onRowClick={handleExpiringProductClick}
                                />
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                    <Typography color="text.secondary">No expiring products found</Typography>
                                </Box>
                            )}
                    </Box>
                </Paper>
                </Grid>
            </Grid>

            {/* Expiring Products Dialog */}
            <Dialog
                open={expiringDialogOpen}
                onClose={() => setExpiringDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: '90vh',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pb: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            All Expiring Products
                        </Typography>
            </Box>
                    <IconButton
                        onClick={() => setExpiringDialogOpen(false)}
                        sx={{ color: 'text.secondary' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3, pt: 3 }}>
                    <DataTable
                        key={`expiring-products-table-${expiringPaginationModel.page}-${expiringPaginationModel.pageSize}`}
                        columns={expiringColumns}
                        state={expiringTableState}
                        handlers={expiringTableHandlers}
                        onRowClick={handleExpiringProductClick}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        onClick={() => setExpiringDialogOpen(false)}
                        variant="contained"
                        sx={{ textTransform: 'none' }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
