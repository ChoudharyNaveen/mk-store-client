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
    Card,
    CardContent,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PaymentIcon from '@mui/icons-material/Payment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BuildIcon from '@mui/icons-material/Build';
import HistoryIcon from '@mui/icons-material/History';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import type { Order, OrderStatus, PaymentStatus, OrderPriority } from '../../types/order';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { fetchOrderDetails, fetchOrders, updateOrder } from '../../services/order.service';
import { ORDER_STATUS_API } from '../../constants/orderStatuses';
import { useAppSelector } from '../../store/hooks';
import { getOrderStatusColor, getPaymentStatusColor } from '../../utils/statusColors';
import { concatProductAndVariant } from '../../utils/orderHelpers';
import { mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useRecentlyViewed } from '../../contexts/RecentlyViewedContext';
import DataTable from '../../components/DataTable';
import DetailPageSkeleton from '../../components/DetailPageSkeleton';
import type { Column, TableState } from '../../types/table';

// Order detail data structure
interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    product_image?: string;
    variant_name?: string;
    variant_type?: string;
    variant_value?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount_amount: number;
    final_price: number;
    combo_id?: boolean;
    subtotal?: number;
    combo_quantity?: number;
}

// Order status history item
interface StatusHistoryItem {
    id: number;
    status: string;
    timestamp: string;
    changedBy?: string;
    notes?: string;
    isCurrent?: boolean;
    previousStatus?: string | null;
}

interface RiderInformation {
    rider_name: string;
    rider_phone_number: string;
    rider_pickup_time: string;
}

interface OrderDetailData extends Order {
    concurrency_stamp: string;
    rawOrderStatus?: string; // Store raw API status to check for ACCEPTED
    orderItems: OrderItem[];
    statusHistory?: StatusHistoryItem[];
    riderInformation?: RiderInformation | null;
    appliedDiscounts?: Array<{
        type: string;
        code?: string;
        description: string;
        discount_amount: number;
        status: string;
    }>;
}

// Helper function to map API response to component data structure
const mapApiDataToOrderDetail = (apiData: Awaited<ReturnType<typeof fetchOrderDetails>>): OrderDetailData => ({
    id: apiData.order_id,
    order_number: apiData.order_number,
    total_amount: apiData.summary.subtotal,
    discount_amount: apiData.summary.discount,
    shipping_charges: apiData.summary.shipping,
    final_amount: apiData.summary.total,
    order_priority: apiData.order_information.priority as OrderPriority,
    estimated_delivery_time: apiData.order_information.estimated_delivery || null,
    refund_amount: 0,
    refund_status: 'NONE',
    status: apiData.order_information.order_status as OrderStatus,
    rawOrderStatus: apiData.order_information.order_status, // Store raw status for ACCEPTED check
    payment_status: apiData.order_information.payment_status as PaymentStatus,
    rider_id: apiData.rider_information ? 1 : null,
    branch_id: 0,
    address_id: 0,
    created_by: 0,
    created_at: apiData.order_information.order_date,
    updated_at: apiData.order_information.order_date,
    concurrency_stamp: apiData.concurrency_stamp || '',
    address: {
        id: 0,
        house_no: apiData.delivery_address.address_line_1 || '',
        street_details: apiData.delivery_address.street_details || apiData.delivery_address.address_line_1 || '',
        landmark: apiData.delivery_address.landmark || apiData.delivery_address.address_line_2,
        name: apiData.delivery_address.recipient_name,
        mobile_number: apiData.delivery_address.mobile_number || '',
    },
    user: {
        id: 0,
        name: apiData.customer_information.name,
        email: apiData.customer_information.email,
        mobile_number: apiData.customer_information.mobile_number,
    },
    orderDiscount: [],
    orderItems: apiData.order_items.map(item => ({
        id: item.id,
        product_id: item.product.id,
        product_name: item.product.title,
        product_image: item.product.image,
        variant_name: item.variant?.variant_name || item.variant?.name,
        variant_type: item.variant?.variant_type,
        variant_value: item.variant?.variant_value,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        discount_amount: item.discount,
        final_price: item.total,
        combo_id: item.combo_id || false,
        subtotal: item.total,
        combo_quantity: item.combo_quantity || 0,
    })),
    statusHistory: apiData.status_history?.reverse()?.map((historyItem) => ({
        id: historyItem.id,
        status: historyItem.status,
        timestamp: historyItem.changed_at,
        changedBy: historyItem.changed_by?.name || historyItem.changed_by?.email || 'System',
        notes: historyItem.notes || undefined,
        previousStatus: historyItem.previous_status || undefined,
        isCurrent: historyItem.status === apiData.order_information.order_status,
    })) || [],
    riderInformation: apiData.rider_information ?? null,
    appliedDiscounts: apiData.applied_discounts,
});

// Helper function to check if request is still valid
const isRequestValid = (currentId: string | null, expectedId: string): boolean => {
    return currentId === expectedId;
};

// Reusable Info Section Component
interface InfoSectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

const InfoSection: React.FC<InfoSectionProps> = ({ icon, title, children }) => (
    <Paper sx={{ 
        p: 3,
        borderRadius: 2,
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
    }}>
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
        }}>
            {icon}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {title}
            </Typography>
        </Box>
        {children}
    </Paper>
);

// Reusable Info Field Component
interface InfoFieldProps {
    label?: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
}

const InfoField: React.FC<InfoFieldProps> = ({ label, value, icon }) => (
    <Box>
        {icon ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon}
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {value}
                </Typography>
            </Box>
        ) : (
            <>
                {label && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        {label}
                    </Typography>
                )}
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {value}
                </Typography>
            </>
        )}
    </Box>
);

export default function OrderDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;
    const { addOrder } = useRecentlyViewed();
    const [order, setOrder] = React.useState<OrderDetailData | null>(null);
    const [orderIds, setOrderIds] = React.useState<number[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [updating, setUpdating] = React.useState(false);
    const [actionDialog, setActionDialog] = React.useState<{
        open: boolean;
        type: 'accept' | 'reject' | 'ready' | null;
    }>({ open: false, type: null });
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [validationError, setValidationError] = React.useState('');
    const lastFetchedIdRef = React.useRef<string | null>(null);
    const isFetchingRef = React.useRef(false);
    
    // Table state for order items
    const [tableState, setTableState] = React.useState<TableState<OrderItem>>({
        data: [],
        total: 0,
        page: 0,
        rowsPerPage: 10,
        order: 'asc',
        orderBy: 'id',
        loading: false,
        search: '',
    });

    // Get orderIds from location state (passed from OrderList) or fetch for prev/next fallback
    React.useEffect(() => {
        const state = location.state as { orderIds?: number[] } | null;
        if (state?.orderIds && Array.isArray(state.orderIds)) {
            setOrderIds(state.orderIds);
        } else {
            setOrderIds([]);
        }
    }, [location.state]);

    const fetchAdjacentOrderIds = React.useCallback(async () => {
        if (!id) return;
        const currentId = Number(id);
        const baseFilters = mergeWithDefaultFilters([], vendorId, selectedBranchId);
        try {
            const [prevRes, nextRes] = await Promise.all([
                fetchOrders({
                    page: 0,
                    pageSize: 1,
                    filters: [...baseFilters, { key: 'id', lt: String(currentId) }],
                    sorting: [{ key: 'id', direction: 'DESC' }],
                }),
                fetchOrders({
                    page: 0,
                    pageSize: 1,
                    filters: [...baseFilters, { key: 'id', gt: String(currentId) }],
                    sorting: [{ key: 'id', direction: 'ASC' }],
                }),
            ]);
            const prevId = prevRes.list?.[0]?.id;
            const nextId = nextRes.list?.[0]?.id;
            const ids: number[] = [];
            if (prevId != null) ids.push(prevId);
            ids.push(currentId);
            if (nextId != null) ids.push(nextId);
            setOrderIds(ids);
        } catch (err) {
            console.error('Error fetching adjacent orders:', err);
        }
    }, [id, vendorId, selectedBranchId]);

    React.useEffect(() => {
        if (!id) {
            navigate('/orders');
            return;
        }

        // Prevent duplicate calls for the same ID
        if (lastFetchedIdRef.current === id || isFetchingRef.current) {
            return;
        }

        lastFetchedIdRef.current = id;
        isFetchingRef.current = true;

        const loadOrderDetails = async () => {
            try {
                setLoading(true);
                const apiData = await fetchOrderDetails(id);
                
                // Double check the ID hasn't changed
                if (!isRequestValid(lastFetchedIdRef.current, id)) {
                    return;
                }
                
                const orderData = mapApiDataToOrderDetail(apiData);
                setOrder(orderData);
                
                // Update table state with order items
                setTableState(prev => ({
                    ...prev,
                    data: orderData.orderItems,
                    total: orderData.orderItems.length,
                    loading: false,
                }));
            } catch (error: unknown) {
                console.error('Error loading order details:', error);
                if (isRequestValid(lastFetchedIdRef.current, id)) {
                    showErrorToast('Failed to load order details');
                    navigate('/orders');
                }
            } finally {
                if (isRequestValid(lastFetchedIdRef.current, id)) {
                    setLoading(false);
                }
                isFetchingRef.current = false;
            }
        };

        loadOrderDetails();
    }, [id, navigate]);

    React.useEffect(() => {
        if (order?.id != null && order?.order_number) {
            addOrder(order.id, order.order_number);
        }
    }, [order?.id, order?.order_number, addOrder]);

    // Fetch adjacent order IDs when no orderIds from location (e.g. direct URL, bookmark)
    React.useEffect(() => {
        if (order && orderIds.length === 0) {
            fetchAdjacentOrderIds();
        }
    }, [order, orderIds.length, fetchAdjacentOrderIds]);

    const currentIndex = orderIds.length > 0 ? orderIds.indexOf(Number(id)) : -1;
    const prevOrderId = currentIndex > 0 ? orderIds[currentIndex - 1] : null;
    const nextOrderId = currentIndex >= 0 && currentIndex < orderIds.length - 1 ? orderIds[currentIndex + 1] : null;

    const handleNavigateToOrder = (orderId: number) => {
        navigate(`/orders/detail/${orderId}`, { state: { orderIds } });
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case ORDER_STATUS_API.PENDING:
                return <ScheduleIcon />;
            case ORDER_STATUS_API.ACCEPTED:
            case ORDER_STATUS_API.CONFIRMED:
                return <CheckCircleIcon />;
            case ORDER_STATUS_API.PROCESSING:
                return <BuildIcon />;
            case ORDER_STATUS_API.READY_FOR_PICKUP:
                return <LocalShippingIcon />;
            case ORDER_STATUS_API.SHIPPED:
                return <LocalShippingIcon />;
            case ORDER_STATUS_API.DELIVERED:
                return <CheckCircleIcon />;
            case ORDER_STATUS_API.CANCELLED:
            case ORDER_STATUS_API.REJECTED:
                return <CancelIcon />;
            default:
                return <HistoryIcon />;
        }
    };

    // Get status color for history items
    const getHistoryStatusColor = (status: string, isCurrent: boolean) => {
        if (isCurrent) {
            switch (status) {
                case ORDER_STATUS_API.DELIVERED:
                    return 'success';
                case ORDER_STATUS_API.CANCELLED:
                case ORDER_STATUS_API.REJECTED:
                    return 'error';
                case ORDER_STATUS_API.SHIPPED:
                case ORDER_STATUS_API.READY_FOR_PICKUP:
                    return 'info';
                default:
                    return 'primary';
            }
        }
        return 'default';
    };

    // Order action validation helpers
    const orderActionValidators = {
        accept: {
            canPerform: (order: OrderDetailData) => order.status === ORDER_STATUS_API.PENDING,
            getDisabledReason: (order: OrderDetailData) => 
                order.status !== ORDER_STATUS_API.PENDING 
                    ? `Order status must be ${ORDER_STATUS_API.PENDING} to accept. Current status: ${order.status}`
                    : null,
        },
        reject: {
            canPerform: (order: OrderDetailData) => order.status === ORDER_STATUS_API.PENDING || order.status === ORDER_STATUS_API.CONFIRMED,
            getDisabledReason: (order: OrderDetailData) => 
                !(order.status === ORDER_STATUS_API.PENDING || order.status === ORDER_STATUS_API.CONFIRMED)
                    ? `Order can only be rejected if status is ${ORDER_STATUS_API.PENDING} or ${ORDER_STATUS_API.CONFIRMED}`
                    : null,
        },
        ready: {
            canPerform: (order: OrderDetailData) => order.rawOrderStatus === ORDER_STATUS_API.ACCEPTED,
            getDisabledReason: (order: OrderDetailData) => 
                order.rawOrderStatus !== ORDER_STATUS_API.ACCEPTED
                    ? `Order status must be ${ORDER_STATUS_API.ACCEPTED}. Current status: ${order.status}`
                    : null,
        },
    };

    const handleOpenDialog = (type: 'accept' | 'reject' | 'ready') => {
        if (!order) return;

        const validator = orderActionValidators[type];
        if (!validator.canPerform(order)) {
            const reason = validator.getDisabledReason(order);
            showErrorToast(reason || `Order action cannot be performed at this time`);
            return;
        }

        setActionDialog({ open: true, type });
        setRejectionReason('');
        setValidationError('');
    };

    const handleCloseDialog = () => {
        setActionDialog({ open: false, type: null });
        setRejectionReason('');
        setValidationError('');
    };

    const handleConfirmAction = async () => {
        if (!order || !actionDialog.type || !user?.id) return;

        if (actionDialog.type === 'reject' && !rejectionReason.trim()) {
            setValidationError('Please provide a reason for rejection');
            return;
        }

        const statusMap: Record<'accept' | 'reject' | 'ready', { apiStatus: string; message: string }> = {
            accept: { apiStatus: ORDER_STATUS_API.ACCEPTED, message: 'Order accepted successfully' },
            reject: { apiStatus: ORDER_STATUS_API.REJECTED, message: 'Order rejected successfully' },
            ready: { apiStatus: ORDER_STATUS_API.READY_FOR_PICKUP, message: 'Order marked as ready for pickup' },
        };

        const { apiStatus, message } = statusMap[actionDialog.type];

        setUpdating(true);
        try {
            // For reject action, include the rejection reason as notes
            const notes = actionDialog.type === 'reject' ? rejectionReason.trim() : undefined;
            
            await updateOrder(
                order.id,
                apiStatus,
                order.concurrency_stamp,
                user.id,
                notes
            );

            // Refresh order details after successful update
            const apiData = await fetchOrderDetails(order.id);
            const updatedOrderData = mapApiDataToOrderDetail(apiData);
            setOrder(updatedOrderData);

            // Update table state with refreshed order items
            setTableState(prev => ({
                ...prev,
                data: updatedOrderData.orderItems,
                total: updatedOrderData.orderItems.length,
            }));

            showSuccessToast(message);
            handleCloseDialog();
        } catch (error) {
            console.error('Error updating order:', error);
            showErrorToast('Failed to update order. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    // Sort order items based on table state
    const sortedOrderItems = React.useMemo(() => {
        if (!order?.orderItems) return [];
        
        const items = [...order.orderItems];
        const { orderBy, order: orderDirection } = tableState;
        
        return items.sort((a, b) => {
            const aValue = a[orderBy as keyof OrderItem];
            const bValue = b[orderBy as keyof OrderItem];
            
            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return orderDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }
            
            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();
            
            if (orderDirection === 'asc') {
                return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
            }
            return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order?.orderItems, tableState.orderBy, tableState.order]);

    // Paginate sorted items
    const paginatedItems = React.useMemo(() => {
        const start = tableState.page * tableState.rowsPerPage;
        const end = start + tableState.rowsPerPage;
        return sortedOrderItems.slice(start, end);
    }, [sortedOrderItems, tableState.page, tableState.rowsPerPage]);

    const orderItemsPaginationModel = React.useMemo(
        () => ({ page: tableState.page, pageSize: tableState.rowsPerPage }),
        [tableState.page, tableState.rowsPerPage],
    );
    const setOrderItemsPaginationModel = React.useCallback(
        (model: { page: number; pageSize: number }) => {
            setTableState((prev) => ({
                ...prev,
                page: model.page,
                rowsPerPage: model.pageSize,
                ...(model.pageSize !== prev.rowsPerPage ? { page: 0 } : {}),
            }));
        },
        [],
    );

    // Product Image Component with error handling
    const ProductImage: React.FC<{
        imageUrl: string | undefined;
        productName: string;
        productId: number;
    }> = ({ imageUrl, productName, productId }) => {
        const [imageError, setImageError] = React.useState(false);
        
        // Simple check like ProductDetail.tsx - just verify it exists and is not empty/null/NA
        // Type-safe check to avoid runtime errors
        const hasImage = imageUrl && 
                        typeof imageUrl === 'string' &&
                        imageUrl.trim() !== '' && 
                        imageUrl !== 'NA' && 
                        imageUrl !== 'null' && 
                        imageUrl !== 'undefined' &&
                        !imageError;

        if (hasImage) {
            return (
                <Box
                    component="img"
                    src={imageUrl}
                    alt={productName || 'Product'}
                    onError={() => setImageError(true)}
                    onClick={() => navigate(`/products/detail/${productId}`)}
                    sx={{
                        width: 50,
                        height: 50,
                        objectFit: 'cover',
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                            opacity: 0.8,
                            borderColor: 'primary.main',
                        },
                    }}
                />
            );
        }

        return (
            <Avatar
                variant="rounded"
                sx={{
                    width: 50,
                    height: 50,
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white',
                    },
                }}
                onClick={() => navigate(`/products/detail/${productId}`)}
            >
                {productName?.charAt(0)?.toUpperCase() || 'P'}
            </Avatar>
        );
    };

    // Order items columns
    const orderItemColumns: Column<OrderItem>[] = [
        {
            id: 'product_name' as keyof OrderItem,
            label: 'Product',
            minWidth: 250,
            render: (row: OrderItem) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ProductImage
                        imageUrl={row.product_image}
                        productName={row.product_name}
                        productId={row.product_id}
                    />
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, flexWrap: 'wrap' }}>
                            <Box
                                component="button"
                                onClick={() => navigate(`/products/detail/${row.product_id}`)}
                                sx={{
                                    width: '100%',
                                    minWidth: 0,
                                    maxHeight: '2.8em',
                                    margin: 0,
                                    padding: 0,
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'block',
                                    overflow: 'hidden',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    color: '#204564',
                                    fontSize: '14px',
                                    lineHeight: 1.4,
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                {concatProductAndVariant(row.product_name, row.variant_name)}
                            </Box>
                            {row.combo_id && row.combo_quantity > 0 && (
                                <Chip
                                    label={`Combo Discount (Pack of ${row.combo_quantity})`}
                                    size="small"
                                    color="success"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                    }}
                                />
                            )}
                        </Box>
                        {row.variant_type && row.variant_value && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    mt: 0.5,
                                }}
                            >
                                {row.variant_type}: {row.variant_value}
                            </Typography>
                        )}
                    </Box>
                </Box>
            ),
        },
        {
            id: 'quantity' as keyof OrderItem,
            label: 'Quantity',
            minWidth: 100,
            align: 'right',
            sortable: true,
        },
        {
            id: 'unit_price' as keyof OrderItem,
            label: 'Unit Price',
            minWidth: 120,
            align: 'right',
            sortable: true,
            format: (value: number) => `₹${value.toFixed(2)}`,
        },
        {
            id: 'subtotal' as keyof OrderItem,
            label: 'Subtotal',
            minWidth: 120,
            align: 'right',
            sortable: true,
            render: (row: OrderItem) => (
                <Typography>
                    ₹{row.subtotal.toFixed(2)}
                </Typography>
            ),
        },
        {
            id: 'discount_amount' as keyof OrderItem,
            label: 'Discount',
            minWidth: 120,
            align: 'right',
            sortable: true,
            render: (row: OrderItem) => (
                <Typography sx={{ color: 'error.main' }}>
                    -₹{row.discount_amount.toFixed(2)}
                </Typography>
            ),
        },
        {
            id: 'final_price' as keyof OrderItem,
            label: 'Total',
            minWidth: 120,
            align: 'right',
            sortable: true,
            format: (value: number) => `₹${value.toFixed(2)}`,
            render: (row: OrderItem) => (
                <Typography sx={{ fontWeight: 600 }}>
                    ₹{row.final_price.toFixed(2)}
                </Typography>
            ),
        },
    ];

    if (loading) {
        return <DetailPageSkeleton />;
    }

    if (!order) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Order not found</Alert>
            </Box>
        );
    }

    return (
        <Paper sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3, 
            p: 3, 
            borderRadius: 2,
            boxShadow: 2,
            border: '1px solid',
            borderColor: 'divider',
        }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: 2,
                pb: 2,
                borderBottom: '2px solid',
                borderColor: 'divider',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/orders')}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'transparent' }
                        }}
                    >
                        Back
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {order.order_number || 'Order'}
                        </Typography>
                        <Tooltip title="Copy order number">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    if (order.order_number) {
                                        navigator.clipboard.writeText(order.order_number);
                                        showSuccessToast('Order number copied');
                                    }
                                }}
                                sx={{ color: 'text.secondary' }}
                            >
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    {(prevOrderId != null || nextOrderId != null) && (
                        <Stack direction="row" spacing={0.5}>
                            <Tooltip title={prevOrderId != null ? 'Previous order' : 'No previous order'}>
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={() => prevOrderId != null && handleNavigateToOrder(prevOrderId)}
                                        disabled={prevOrderId == null}
                                        sx={{ border: '1px solid', borderColor: 'divider' }}
                                    >
                                        <ChevronLeftIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title={nextOrderId != null ? 'Next order' : 'No next order'}>
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={() => nextOrderId != null && handleNavigateToOrder(nextOrderId)}
                                        disabled={nextOrderId == null}
                                        sx={{ border: '1px solid', borderColor: 'divider' }}
                                    >
                                        <ChevronRightIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>
                    )}
                    <Chip
                        label={order.status}
                        color={getOrderStatusColor(order.status)}
                        size="medium"
                    />
                    <Chip
                        label={order.payment_status}
                        color={getPaymentStatusColor(order.payment_status)}
                        size="medium"
                    />
                </Stack>
            </Box>

            {/* Action Buttons */}
            <Paper sx={{ 
                p: 2.5, 
                bgcolor: 'background.default',
                borderRadius: 2,
                boxShadow: 1,
                border: '1px solid',
                borderColor: 'divider',
            }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Order Actions
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleOpenDialog('accept')}
                        disabled={!orderActionValidators.accept.canPerform(order)}
                        title={orderActionValidators.accept.getDisabledReason(order) || ''}
                        sx={{ textTransform: 'none' }}
                    >
                        Accept Order
                    </Button>
                    {orderActionValidators.reject.canPerform(order) && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleOpenDialog('reject')}
                            sx={{ textTransform: 'none' }}
                        >
                            Reject Order
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="info"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => handleOpenDialog('ready')}
                        disabled={!orderActionValidators.ready.canPerform(order)}
                        title={orderActionValidators.ready.getDisabledReason(order) || ''}
                        sx={{ textTransform: 'none' }}
                    >
                        Ready for Pickup
                    </Button>
                    {order.status === ORDER_STATUS_API.SHIPPED && (
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            sx={{ textTransform: 'none' }}
                        >
                            Mark as Delivered
                        </Button>
                    )}
                </Stack>
            </Paper>

            <Grid container spacing={3}>
                {/* Left Column - Order Items */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ 
                        p: 3,
                        borderRadius: 2,
                        boxShadow: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 3,
                            pb: 2,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        }}>
                            <ShoppingCartIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Order Items
                            </Typography>
                        </Box>
                        <DataTable
                            key={`order-items-table-${orderItemsPaginationModel.page}-${orderItemsPaginationModel.pageSize}`}
                            columns={orderItemColumns}
                            state={{
                                ...tableState,
                                data: paginatedItems,
                                total: sortedOrderItems.length,
                            }}
                            rowHeight={60}
                            paginationModel={orderItemsPaginationModel}
                            onPaginationModelChange={setOrderItemsPaginationModel}
                        />


                        {/* Pricing Summary */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 1.5, 
                            alignItems: 'flex-end',
                            pt: 3,
                            px: 2,
                            py: 2.5,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default',
                            borderRadius: 2,
                        }}>
                            {[
                                { label: 'Subtotal', value: order.total_amount, variant: 'body2' as const },
                                ...(order.discount_amount > 0 ? [{ label: 'Discount', value: -order.discount_amount, variant: 'body2' as const, color: 'error.main' }] : []),
                                { label: 'Shipping', value: order.shipping_charges, variant: 'body2' as const },
                            ].map((item) => (
                                <Box key={item.label} sx={{ display: 'flex', gap: 3, minWidth: 300, justifyContent: 'space-between' }}>
                                    <Typography variant={item.variant} sx={{ color: 'text.secondary' }}>
                                        {item.label}:
                                    </Typography>
                                    <Typography variant={item.variant} sx={item.color ? { color: item.color } : {}}>
                                        {item.value < 0 ? '-' : ''}₹{Math.abs(item.value).toFixed(2)}
                                    </Typography>
                                </Box>
                            ))}
                            <Divider sx={{ width: '100%', my: 1.5 }} />
                            <Box sx={{ display: 'flex', gap: 3, minWidth: 300, justifyContent: 'space-between', pt: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Total:
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    ₹{order.final_amount.toFixed(2)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Applied Discounts */}
                        {order.appliedDiscounts && order.appliedDiscounts.length > 0 && (
                            <>
                                <Divider sx={{ my: 3 }} />
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1, 
                                    mb: 2,
                                    pt: 2,
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                }}>
                                    <LocalOfferIcon color="primary" />
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        Applied Discounts
                                    </Typography>
                                </Box>
                                <Stack spacing={2}>
                                    {order.appliedDiscounts.map((discount, index) => (
                                        <Card 
                                            key={index} 
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 2,
                                                boxShadow: 1,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                '&:hover': {
                                                    boxShadow: 2,
                                                    borderColor: 'primary.main',
                                                },
                                            }}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {discount.type === 'promocode' && discount.code
                                                                ? `Promo Code: ${discount.code}`
                                                                : discount.description || 'Discount'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                            {discount.description || `₹${discount.discount_amount} off`}
                                                        </Typography>
                                                    </Box>
                                                    <Chip 
                                                        label={discount.status} 
                                                        color={discount.status === 'ACTIVE' ? 'success' : 'default'} 
                                                        size="small" 
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            </>
                        )}

                        {/* Order Activity / Status History */}
                        <Divider sx={{ my: 3 }} />
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 3,
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                        }}>
                            <HistoryIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Order Activity
                            </Typography>
                        </Box>
                        <Box>
                            {order && order.statusHistory && order.statusHistory.length > 0 ? (
                                order.statusHistory.map((item, index, array) => (
                                    <Box key={item.id}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            gap: 2, 
                                            position: 'relative',
                                            pb: index < array.length - 1 ? 3 : 0,
                                        }}>
                                            {/* Timeline line */}
                                            {index < array.length - 1 && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        left: 20,
                                                        top: 40,
                                                        bottom: 0,
                                                        width: 2,
                                                        bgcolor: 'divider',
                                                    }}
                                                />
                                            )}
                                            
                                            {/* Status icon */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    bgcolor: item.isCurrent 
                                                        ? (getHistoryStatusColor(item.status, true) === 'success' ? 'success.main' :
                                                           getHistoryStatusColor(item.status, true) === 'error' ? 'error.main' :
                                                           getHistoryStatusColor(item.status, true) === 'info' ? 'info.main' : 'primary.main')
                                                        : 'action.selected',
                                                    color: item.isCurrent ? 'white' : 'text.secondary',
                                                    border: item.isCurrent ? 'none' : '2px solid',
                                                    borderColor: 'divider',
                                                    flexShrink: 0,
                                                    zIndex: 1,
                                                }}
                                            >
                                                {getStatusIcon(item.status)}
                                            </Box>

                                            {/* Status content */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                    <Chip
                                                        label={item.status}
                                                        color={getHistoryStatusColor(item.status, item.isCurrent || false)}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: item.isCurrent ? 600 : 400,
                                                        }}
                                                    />
                                                    {item.isCurrent && (
                                                        <Chip
                                                            label="Current"
                                                            color="primary"
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                    {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                                                </Typography>
                                                {item.changedBy && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        Changed by: {item.changedBy}
                                                    </Typography>
                                                )}
                                                {item.notes && (
                                                    <Box sx={{ mt: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                            {item.notes}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                                    No activity history available
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column - Customer & Order Info */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={3}>
                        {/* Customer Information */}
                        <InfoSection icon={<PersonIcon color="primary" />} title="Customer Information">
                            <Stack spacing={2}>
                                <InfoField label="Name" value={order.user?.name || 'N/A'} />
                                <InfoField 
                                    value={order.user?.email || 'N/A'} 
                                    icon={<EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
                                />
                                <InfoField 
                                    value={order.user?.mobile_number || order.address?.mobile_number || 'N/A'} 
                                    icon={<PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
                                />
                            </Stack>
                        </InfoSection>

                        {/* Rider Details – from API rider_information when present */}
                        <InfoSection icon={<TwoWheelerIcon color="primary" />} title="Rider Details">
                            <Stack spacing={2}>
                                {order.riderInformation ? (
                                    <>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.25rem' }}>
                                                {order.riderInformation.rider_name?.charAt(0)?.toUpperCase() || 'R'}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                    {order.riderInformation.rider_name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    {order.riderInformation.rider_phone_number}
                                                </Typography>
                                            </Box>
                                            <Chip label="Assigned" size="small" color="success" variant="outlined" />
                                        </Box>
                                        <Divider sx={{ my: 0.5 }} />
                                        <InfoField label="Phone" value={order.riderInformation.rider_phone_number} icon={<PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />} />
                                        <InfoField label="Pickup time" value={order.riderInformation.rider_pickup_time ? format(new Date(order.riderInformation.rider_pickup_time), 'MMM dd, yyyy hh:mm a') : '—'} icon={<EventAvailableIcon fontSize="small" sx={{ color: 'text.secondary' }} />} />
                                        {order.estimated_delivery_time && (
                                            <InfoField label="Estimated arrival" value={format(new Date(order.estimated_delivery_time), 'MMM dd, yyyy hh:mm a')} />
                                        )}
                                    </>
                                ) : (
                                    <Box
                                        sx={{
                                            py: 2.5,
                                            px: 2,
                                            textAlign: 'center',
                                            bgcolor: 'action.hover',
                                            borderRadius: 2,
                                            border: '1px dashed',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <TwoWheelerIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                            No rider assigned
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                                            Rider will be assigned when order is ready for delivery
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </InfoSection>

                        {/* Delivery Address */}
                        <InfoSection icon={<LocationOnIcon color="primary" />} title="Delivery Address">
                            <Stack spacing={1}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {order.address?.name || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {order.address?.house_no} {order.address?.street_details}
                                </Typography>
                                {order.address?.landmark && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {order.address.landmark}
                                    </Typography>
                                )}
                                <InfoField 
                                    value={order.address?.mobile_number || 'N/A'} 
                                    icon={<PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
                                />
                            </Stack>
                        </InfoSection>

                        {/* Order Information */}
                        <InfoSection icon={<PaymentIcon color="primary" />} title="Order Information">
                            <Stack spacing={2}>
                                <InfoField 
                                    label="Order Date" 
                                    value={format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')} 
                                />
                                {order.estimated_delivery_time && (
                                    <InfoField 
                                        label="Estimated Delivery" 
                                        value={format(new Date(order.estimated_delivery_time), 'MMM dd, yyyy')} 
                                    />
                                )}
                                <Box>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Priority
                                    </Typography>
                                    <Chip
                                        label={order.order_priority}
                                        color={order.order_priority === 'URGENT' ? 'error' : 'default'}
                                        size="small"
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Payment Status
                                    </Typography>
                                    <Chip
                                        label={order.payment_status}
                                        color={getPaymentStatusColor(order.payment_status)}
                                        size="small"
                                    />
                                </Box>
                                {order.refund_status !== 'NONE' && (
                                    <Box>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Refund Status
                                        </Typography>
                                        <Chip
                                            label={order.refund_status}
                                            color={order.refund_status === 'PROCESSED' ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </Box>
                                )}
                            </Stack>
                        </InfoSection>
                    </Stack>
                </Grid>
            </Grid>

            {/* Action Dialog */}
            <Dialog open={actionDialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {actionDialog.type === 'accept' && 'Accept Order'}
                    {actionDialog.type === 'reject' && 'Reject Order'}
                    {actionDialog.type === 'ready' && 'Mark as Ready for Pickup'}
                </DialogTitle>
                <DialogContent>
                    {actionDialog.type === 'accept' && (
                        <Typography>
                            Are you sure you want to accept this order? The order status will be changed to ACCEPTED.
                        </Typography>
                    )}
                    {actionDialog.type === 'reject' && (
                        <Box>
                            <Typography sx={{ mb: 2 }}>
                                Are you sure you want to reject this order? Please provide a reason for rejection.
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Rejection Reason"
                                value={rejectionReason}
                                onChange={(e) => {
                                    setRejectionReason(e.target.value);
                                    setValidationError('');
                                }}
                                error={!!validationError}
                                helperText={validationError}
                                required
                            />
                        </Box>
                    )}
                    {actionDialog.type === 'ready' && (
                        <Typography>
                            Are you sure you want to mark this order as ready for pickup? The order status will be changed to READY_FOR_PICKUP.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCloseDialog} 
                        disabled={updating}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmAction}
                        variant="contained"
                        disabled={updating}
                        color={actionDialog.type === 'reject' ? 'error' : actionDialog.type === 'accept' ? 'success' : 'info'}
                        sx={{ textTransform: 'none' }}
                    >
                        {updating ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

