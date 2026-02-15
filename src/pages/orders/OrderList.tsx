import React from 'react';
import { Box, Typography, Button, TextField, Popover, Chip, List, ListItem, ListItemText, Divider, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import RowActionsMenu from '../../components/RowActionsMenu';
import type { RowActionItem } from '../../components/RowActionsMenu';
import ListPageLayout from '../../components/ListPageLayout';
import { useServerPagination } from '../../hooks/useServerPagination';
import { useListPageDateRange } from '../../hooks/useListPageDateRange';
import { fetchOrders } from '../../services/order.service';
import type { Order } from '../../types/order';
import type { ServerFilter } from '../../types/filter';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../constants/statusOptions';

export default function OrderList() {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;

    const { dateRange, handleDateRangeApply } = useListPageDateRange(30);
    
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
                const getStatusSx = (status: string) => {
                    const styles: Record<string, { bgcolor: string; color: string }> = {
                        DELIVERED: { bgcolor: '#a5d6a7', color: '#1b5e20' },
                        PENDING: { bgcolor: '#ffcc80', color: '#e65100' },
                        CANCELLED: { bgcolor: '#ef9a9a', color: '#b71c1c' },
                        REJECTED: { bgcolor: '#bcaaa4', color: '#3e2723' },
                        FAILED: { bgcolor: '#e57373', color: '#b71c1c' },
                        RETURN: { bgcolor: '#ffb74d', color: '#e65100' },
                        RETURNED: { bgcolor: '#ffa726', color: '#ef6c00' },
                        ACCEPTED: { bgcolor: '#90caf9', color: '#0d47a1' },
                        CONFIRMED: { bgcolor: '#4fc3f7', color: '#01579b' },
                        PROCESSING: { bgcolor: '#9fa8da', color: '#283593' },
                        SHIPPED: { bgcolor: '#80cbc4', color: '#004d40' },
                        READY_FOR_PICKUP: { bgcolor: '#ce93d8', color: '#4a148c' },
                        PICKED_UP: { bgcolor: '#b39ddb', color: '#311b92' },
                        ARRIVED: { bgcolor: '#b0bec5', color: '#263238' },
                    };
                    return styles[status] ?? { bgcolor: '#bdbdbd', color: '#212121' };
                };
                const sx = getStatusSx(row.status);
                return (
                    <Chip
                        label={row.status}
                        size="small"
                        sx={{ ...sx, fontWeight: 500 }}
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
            minWidth: 80,
            align: 'center' as const,
            render: (row: Order) => (
                <RowActionsMenu<Order>
                    row={row}
                    ariaLabel="Order actions"
                    items={(r): RowActionItem<Order>[] => [
                        { type: 'item', label: 'View', icon: <VisibilityIcon fontSize="small" />, onClick: () => navigate(`/orders/detail/${r.id}`) },
                    ]}
                />
            )
        },
    ];
    
    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const [itemsPopoverAnchor, setItemsPopoverAnchor] = React.useState<{ el: HTMLElement; orderId: number } | null>(null);
    const emptyAdvancedFilters = { orderNumber: '', customerName: '', status: '', payment_status: '' };
    const [advancedFilters, setAdvancedFilters] = React.useState(emptyAdvancedFilters);
    const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState(emptyAdvancedFilters);

    // Build filters from applied values (so Apply button commits form state, then effect runs once)
    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'created_at',
            advancedFilters: appliedAdvancedFilters,
            filterMappings: {
                orderNumber: { field: 'order_number', operator: 'iLike' },
                customerName: { field: 'user.name', operator: 'iLike' },
                status: { field: 'status', operator: 'eq' },
                payment_status: { field: 'payment_status', operator: 'eq' },
            },
        });
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, appliedAdvancedFilters, vendorId, selectedBranchId]);

    // Use server pagination hook - now includes tableState and tableHandlers
    const {
        paginationModel,
        setPaginationModel,
        setFilters,
        setSearchKeyword,
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

    // Update filters when applied advanced filters or date range changes (single source → one fetch)
    React.useEffect(() => {
        setFilters(buildFilters());
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [appliedAdvancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

    // When opening the filter popover, show currently applied values in the form
    React.useEffect(() => {
        if (filterAnchorEl) setAdvancedFilters(appliedAdvancedFilters);
    }, [filterAnchorEl]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleApplyFilters = () => {
        setAppliedAdvancedFilters(advancedFilters);
        setFilterAnchorEl(null);
    };

    const handleClearFilters = () => {
        setSearchKeyword('');
        setAdvancedFilters(emptyAdvancedFilters);
        setAppliedAdvancedFilters(emptyAdvancedFilters);
        setFilterAnchorEl(null);
        // Effect will run (appliedAdvancedFilters changed), setFilters + setPaginationModel → hook's filters effect fetches once with empty search/filters
    };

    return (
        <ListPageLayout
            title="Orders"
            searchId="orders-search"
            searchPlaceholder="Search orders..."
            searchValue={tableState.search}
            onSearchChange={tableHandlers.handleSearch}
            onClearAndRefresh={handleClearFilters}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeApply}
            onRefresh={() => tableHandlers.refresh()}
            filterAnchorEl={filterAnchorEl}
            onOpenFilterClick={(e) => setFilterAnchorEl(e.currentTarget)}
            onFilterClose={() => setFilterAnchorEl(null)}
            filterPopoverTitle="Filter Orders"
            filterPopoverContent={
                <>
                    <TextField fullWidth size="small" label="Order Number" value={advancedFilters.orderNumber} onChange={(e) => setAdvancedFilters({ ...advancedFilters, orderNumber: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth size="small" label="Customer Name" value={advancedFilters.customerName} onChange={(e) => setAdvancedFilters({ ...advancedFilters, customerName: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Order Status</InputLabel>
                        <Select value={advancedFilters.status} label="Order Status" onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}>
                            <MenuItem value="">All</MenuItem>
                            {ORDER_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Payment Status</InputLabel>
                        <Select value={advancedFilters.payment_status} label="Payment Status" onChange={(e) => setAdvancedFilters({ ...advancedFilters, payment_status: e.target.value })}>
                            <MenuItem value="">All</MenuItem>
                            {PAYMENT_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                        <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                    </Box>
                </>
            }
        >
            <DataTable key={`order-table-${paginationModel.page}-${paginationModel.pageSize}`} columns={columns} state={tableState} paginationModel={paginationModel} onPaginationModelChange={setPaginationModel} />
        </ListPageLayout>
    );
}
