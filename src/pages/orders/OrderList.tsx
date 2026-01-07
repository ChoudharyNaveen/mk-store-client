import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Chip, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';
import { fetchOrders } from '../../services/order.service';
import type { Order } from '../../types/order';
import type { ServerFilter } from '../../types/filter';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';

export default function OrderList() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    
    // Get vendorId and branchId from store
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;
    
    // Get date range from store, or use default
    const storeStartDate = useAppSelector((state) => state.dateRange.startDate);
    const storeEndDate = useAppSelector((state) => state.dateRange.endDate);
    
    const columns = [
        {
            id: 'order_number' as keyof Order,
            label: 'Order ID',
            minWidth: 150,
            render: (row: Order) => (
                <Typography
                    component="button"
                    onClick={() => navigate(`/orders/detail/${row.id}`)}
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
                    {row.order_number}
                </Typography>
            )
        },
        {
            id: 'user' as keyof Order,
            label: 'Customer',
            minWidth: 150,
            render: (row: Order) => row.user?.name || 'N/A'
        },
        {
            id: 'created_at' as keyof Order,
            label: 'Order Date',
            minWidth: 120,
            render: (row: Order) => {
                if (!row.created_at) return 'N/A';
                try {
                    return format(new Date(row.created_at), 'MMM dd, yyyy');
                } catch {
                    return row.created_at;
                }
            }
        },
        {
            id: 'final_amount' as keyof Order,
            label: 'Amount',
            minWidth: 120,
            render: (row: Order) => `₹${row.final_amount?.toLocaleString() || '0.00'}`
        },
        {
            id: 'orderItems' as keyof Order,
            label: 'Items',
            minWidth: 100,
            align: 'center' as const,
            render: (row: Order) => {
                const itemsCount = row.orderItems?.length || 0;
                const totalQuantity = row.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                
                return (
                    <Box
                        onMouseEnter={(e) => {
                            if (itemsCount > 0) {
                                setItemsPopoverAnchor({ el: e.currentTarget, orderId: row.id });
                            }
                        }}
                        onMouseLeave={() => {
                            setItemsPopoverAnchor(null);
                        }}
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: itemsCount > 0 ? 'pointer' : 'default',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            bgcolor: itemsCount > 0 ? '#e3f2fd' : 'transparent',
                            color: itemsCount > 0 ? '#1976d2' : 'text.secondary',
                            border: itemsCount > 0 ? '1px solid #90caf9' : 'none',
                            transition: 'all 0.2s',
                            '&:hover': itemsCount > 0 ? {
                                bgcolor: '#1976d2',
                                color: 'white',
                                borderColor: '#1976d2',
                            } : {},
                        }}
                    >
                        <ShoppingCartIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {itemsCount}
                        </Typography>
                        {itemsCount > 0 && (
                            <Popover
                                open={itemsPopoverAnchor?.orderId === row.id}
                                anchorEl={itemsPopoverAnchor?.el}
                                onClose={() => setItemsPopoverAnchor(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                disableRestoreFocus
                                sx={{
                                    pointerEvents: 'none',
                                }}
                                PaperProps={{
                                    onMouseEnter: () => {
                                        // Keep popover open when hovering over it
                                    },
                                    onMouseLeave: () => {
                                        setItemsPopoverAnchor(null);
                                    },
                                    sx: {
                                        pointerEvents: 'auto',
                                        mt: 1,
                                        minWidth: 280,
                                        maxWidth: 350,
                                        boxShadow: 3,
                                        borderRadius: 2,
                                    }
                                }}
                            >
                                <Box sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <ShoppingCartIcon color="primary" sx={{ fontSize: 20 }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            Order Items ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
                                        </Typography>
                                    </Box>
                                    <List dense sx={{ p: 0 }}>
                                        {row.orderItems?.map((item, index) => (
                                            <React.Fragment key={item.id}>
                                                <ListItem
                                                    sx={{
                                                        px: 1.5,
                                                        py: 1,
                                                        borderRadius: 1,
                                                        '&:hover': {
                                                            bgcolor: 'action.hover',
                                                        }
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                                                                    {item.product?.title || `Product #${item.product_id}`}
                                                                </Typography>
                                                                <Chip
                                                                    label={`Qty: ${item.quantity}`}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                    sx={{
                                                                        ml: 1,
                                                                        height: 24,
                                                                        fontSize: '0.75rem',
                                                                    }}
                                                                />
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                                {index < (row.orderItems?.length || 0) - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Box>
                            </Popover>
                        )}
                    </Box>
                );
            }
        },
        {
            id: 'status' as keyof Order,
            label: 'Status',
            minWidth: 120,
            render: (row: Order) => {
                const getStatusColor = (status: string) => {
                    switch (status) {
                        case 'DELIVERED':
                            return 'success';
                        case 'PENDING':
                            return 'warning';
                        case 'CANCELLED':
                            return 'error';
                        case 'PROCESSING':
                        case 'SHIPPED':
                            return 'info';
                        default:
                            return 'default';
                    }
                };
                return (
                    <Chip
                        label={row.status}
                        color={getStatusColor(row.status)}
                        size="small"
                    />
                );
            }
        },
        {
            id: 'payment_status' as keyof Order,
            label: 'Payment Status',
            minWidth: 130,
            render: (row: Order) => {
                const getPaymentColor = (status: string) => {
                    switch (status) {
                        case 'PAID':
                            return 'success';
                        case 'UNPAID':
                            return 'error';
                        case 'PARTIAL':
                            return 'warning';
                        case 'REFUNDED':
                            return 'default';
                        default:
                            return 'default';
                    }
                };
                return (
                    <Chip
                        label={row.payment_status}
                        color={getPaymentColor(row.payment_status)}
                        size="small"
                    />
                );
            }
        },
        {
            id: 'action' as keyof Order,
            label: 'Action',
            minWidth: 100,
            align: 'center' as const,
            render: (row: Order) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/orders/detail/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2' }
                        }}
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/orders/edit/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.main' }
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'error.main',
                            bgcolor: '#ffebee',
                            '&:hover': { bgcolor: '#ffcdd2', borderColor: 'error.main' }
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            )
        },
    ];
    
    const [dateRange, setDateRange] = React.useState(() => {
        if (storeStartDate && storeEndDate) {
            return [{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection'
            }];
        }
        return getLastNDaysRangeForDatePicker(30);
    });
    const [dateAnchorEl, setDateAnchorEl] = React.useState<null | HTMLElement>(null);
    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const [itemsPopoverAnchor, setItemsPopoverAnchor] = React.useState<{ el: HTMLElement; orderId: number } | null>(null);
    const [advancedFilters, setAdvancedFilters] = React.useState({
        orderNumber: '',
        customerName: '',
        status: '',
    });

    // Helper function to build filters array with date range and default filters
    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'created_at',
            advancedFilters,
            filterMappings: {
                orderNumber: { field: 'order_number', operator: 'iLike' },
                customerName: { field: 'user.name', operator: 'iLike' },
                status: { field: 'status', operator: 'eq' },
            },
        });
        
        // Merge with default filters (vendorId and branchId)
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, advancedFilters, vendorId, selectedBranchId]);

    // Use server pagination hook - now includes tableState and tableHandlers
    const {
        paginationModel,
        setPaginationModel,
        setFilters,
        tableState,
        tableHandlers,
    } = useServerPagination<Order>({
        fetchFunction: fetchOrders,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: buildFilters(),
        initialSorting: [
            {
                key: 'created_at',
                direction: 'DESC',
            },
        ],
        searchDebounceMs: 500,
    });

    // Sync local date range with store when store dates change
    React.useEffect(() => {
        if (storeStartDate && storeEndDate) {
            setDateRange([{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection'
            }]);
        }
    }, [storeStartDate, storeEndDate]);

    // Update filters when advanced filters or date range changes
    React.useEffect(() => {
        setFilters(buildFilters());
        // Reset to first page when filters change
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [advancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

    const handleApplyFilters = () => {
        setFilterAnchorEl(null);
        tableHandlers.refresh();
    };

    const handleClearFilters = () => {
        setAdvancedFilters({ orderNumber: '', customerName: '', status: '' });
        tableHandlers.refresh();
    };

    const handleDateSelect = (ranges: RangeKeyDict) => {
        if (ranges.selection && ranges.selection.startDate && ranges.selection.endDate) {
            const newDateRange = [{
                startDate: ranges.selection.startDate,
                endDate: ranges.selection.endDate,
                key: ranges.selection.key || 'selection'
            }];
            setDateRange(newDateRange);
            
            // Save to store
            dispatch(setDateRangeAction({
                startDate: ranges.selection.startDate,
                endDate: ranges.selection.endDate,
            }));
        }
    };

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Orders
                </Typography>
            </Box>

            {/* Unified Container for Search, Filters and Table */}
            <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 1,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden'
            }}>
                {/* Search and Filter Section */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    gap: 2,
                    p: 2.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                }}>
                    <TextField
                        id="orders-search"
                        placeholder="Search orders..."
                        variant="outlined"
                        size="small"
                        value={tableState.search}
                        onChange={tableHandlers.handleSearch}
                        sx={{
                            flex: 1,
                            minWidth: 280,
                            maxWidth: 400,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'background.default',
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<CalendarTodayIcon />}
                            onClick={(e) => setDateAnchorEl(e.currentTarget)}
                            sx={{ 
                                borderRadius: 2, 
                                textTransform: 'none', 
                                borderColor: 'divider', 
                                color: 'text.secondary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            {format(dateRange[0].startDate || new Date(), 'MMM dd')} - {format(dateRange[0].endDate || new Date(), 'MMM dd')}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<FilterListIcon />}
                            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                            sx={{ 
                                borderRadius: 2, 
                                textTransform: 'none', 
                                borderColor: 'divider', 
                                color: 'text.secondary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            Advanced Search
                        </Button>
                    </Box>
                </Box>

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
                        onChange={handleDateSelect}
                        moveRangeOnFirstSelection={false}
                    />
                </Box>
            </Popover>

            <Popover
                open={Boolean(filterAnchorEl)}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ p: 3, width: 300 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Orders</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="Order Number"
                        value={advancedFilters.orderNumber}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, orderNumber: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Customer Name"
                        value={advancedFilters.customerName}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, customerName: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Status"
                        value={advancedFilters.status}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                        <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                    </Box>
                </Box>
            </Popover>

                {/* Data Table Section */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <DataTable 
                        key={`order-table-${paginationModel.page}-${paginationModel.pageSize}`}
                        columns={columns} 
                        state={tableState} 
                        handlers={tableHandlers} 
                    />
                </Box>
            </Box>
        </Paper>
    );
}
