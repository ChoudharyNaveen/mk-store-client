import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  List,
  ListItemButton,
  Paper,
  Divider,
  Chip,
  Button,
  TablePagination,
  CircularProgress,
  InputAdornment,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, fetchOrderDetails, updateOrder } from '../../services/order.service';
import { useServerPagination } from '../../hooks/useServerPagination';
import { useListPageDateRange } from '../../hooks/useListPageDateRange';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
import type { Order } from '../../types/order';
import type { ServerFilter } from '../../types/filter';
import { getOrderStatusSx, getPaymentStatusColor } from '../../utils/statusColors';
import { concatProductAndVariant } from '../../utils/orderHelpers';
import { ORDER_STATUS_API } from '../../constants/orderStatuses';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import DateRangePopover from '../../components/DateRangePopover';
import OrderList from './OrderList';
import { mapApiDataToOrderDetail, type OrderDetailData } from './orderDetailMapper';

const LIST_WIDTH = 380;
const MIN_RIGHT_WIDTH = 400;

export default function OrderListWithDetail() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
  const vendorId = user?.vendorId;

  const [viewMode, setViewMode] = useState<'listOnly' | 'split'>('listOnly');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: 'accept' | 'reject' | 'ready' | null }>({ open: false, type: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [validationError, setValidationError] = useState('');
  const [updating, setUpdating] = useState(false);

  const { dateRange, handleDateRangeApply } = useListPageDateRange(30);
  const buildFilters = useCallback((): ServerFilter[] => {
    const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
      dateRange,
      dateField: 'created_at',
      advancedFilters: {},
      filterMappings: {},
    });
    return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId ?? undefined);
  }, [dateRange, vendorId, selectedBranchId]);

  const {
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
    initialSorting: [{ key: 'created_at', direction: 'DESC' }],
    searchDebounceMs: 500,
  });

  useEffect(() => {
    setFilters(buildFilters());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [dateRange, setFilters, buildFilters, setPaginationModel]);

  const handleOpenSplitView = useCallback((row: Order) => {
    setSelectedOrderId(row.id);
    setViewMode('split');
  }, []);

  const handleCloseSplitView = useCallback(() => {
    setViewMode('listOnly');
    setSelectedOrderId(null);
    setDetailOrder(null);
  }, []);

  useEffect(() => {
    if (selectedOrderId == null) {
      setDetailOrder(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    fetchOrderDetails(selectedOrderId)
      .then((apiData) => {
        if (!cancelled) setDetailOrder(mapApiDataToOrderDetail(apiData));
      })
      .catch(() => {
        if (!cancelled) setDetailOrder(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  const handleFullScreen = () => {
    if (selectedOrderId != null) {
      navigate(`/orders/detail/${selectedOrderId}`, {
        state: { orderIds: tableState.data.map((o) => o.id) },
      });
    }
  };

  const orderActionValidators = {
    accept: {
      canPerform: (order: OrderDetailData) => order.status === ORDER_STATUS_API.PENDING,
      getDisabledReason: (order: OrderDetailData) =>
        order.status !== ORDER_STATUS_API.PENDING ? `Order status must be ${ORDER_STATUS_API.PENDING} to accept. Current: ${order.status}` : null,
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
        order.rawOrderStatus !== ORDER_STATUS_API.ACCEPTED ? `Order status must be ${ORDER_STATUS_API.ACCEPTED}. Current: ${order.status}` : null,
    },
  };

  const handleOpenDialog = (type: 'accept' | 'reject' | 'ready') => {
    if (!detailOrder) return;
    const validator = orderActionValidators[type];
    if (!validator.canPerform(detailOrder)) {
      showErrorToast(validator.getDisabledReason(detailOrder) || 'Action cannot be performed');
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
    if (!detailOrder || !actionDialog.type || !user?.id) return;
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
      const notes = actionDialog.type === 'reject' ? rejectionReason.trim() : undefined;
      await updateOrder(detailOrder.id, apiStatus, detailOrder.concurrency_stamp, user.id, notes);
      const apiData = await fetchOrderDetails(detailOrder.id);
      setDetailOrder(mapApiDataToOrderDetail(apiData));
      showSuccessToast(message);
      handleCloseDialog();
    } catch {
      showErrorToast('Failed to update order. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (viewMode === 'listOnly') {
    return <OrderList onRowSelect={handleOpenSplitView} />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: 'calc(100vh - 64px)',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Left: Order list */}
      <Paper
        elevation={0}
        sx={{
          width: LIST_WIDTH,
          minWidth: LIST_WIDTH,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Orders
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search orders..."
            value={tableState.search}
            onChange={tableHandlers.handleSearch}
            sx={{ mb: 1.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <DateRangePopover
            value={dateRange}
            onChange={handleDateRangeApply}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            buttonSize="small"
          />
        </Box>
        <List
          sx={{
            flex: 1,
            overflow: 'auto',
            py: 0,
          }}
        >
          {tableState.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : tableState.data.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No orders found
              </Typography>
            </Box>
          ) : (
            tableState.data.map((row) => (
              <ListItemButton
                key={row.id}
                selected={selectedOrderId === row.id}
                onClick={() => setSelectedOrderId(row.id)}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': { bgcolor: 'primary.light' },
                  },
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {row.order_number}
                    </Typography>
                    <Chip
                      label={row.status}
                      size="small"
                      sx={{ ...getOrderStatusSx(row.status), fontWeight: 500, fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {row.user?.name || 'N/A'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {row.created_at
                        ? format(new Date(row.created_at), 'MMM d, yyyy')
                        : '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      ₹{row.final_amount?.toLocaleString() ?? '0.00'}
                    </Typography>
                  </Box>
                </Box>
              </ListItemButton>
            ))
          )}
        </List>
        <TablePagination
          component="div"
          count={tableState.total}
          page={tableState.page - 1}
          onPageChange={(_e, page) => tableHandlers.handleChangePage(_e, page + 1)}
          rowsPerPage={tableState.rowsPerPage}
          onRowsPerPageChange={tableHandlers.handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>

      {/* Right: Order detail */}
      <Box
        sx={{
          flex: 1,
          minWidth: MIN_RIGHT_WIDTH,
          overflow: 'auto',
          bgcolor: 'grey.50',
        }}
      >
        {selectedOrderId == null ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Select an order to view details
            </Typography>
          </Box>
        ) : detailLoading ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            <CircularProgress />
          </Box>
        ) : detailOrder ? (
          <Paper
            elevation={0}
            sx={{
              m: 2,
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {detailOrder.order_number}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Chip label={detailOrder.status} size="small" sx={{ ...getOrderStatusSx(detailOrder.status), fontWeight: 500 }} />
                  <Chip label={detailOrder.payment_status} size="small" color={getPaymentStatusColor(detailOrder.payment_status)} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={handleCloseSplitView}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Close
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<OpenInFullIcon />}
                  onClick={handleFullScreen}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Full screen
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
              Order Actions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleOpenDialog('accept')}
                disabled={!orderActionValidators.accept.canPerform(detailOrder)}
                title={orderActionValidators.accept.getDisabledReason(detailOrder) || ''}
                sx={{ textTransform: 'none' }}
              >
                Accept
              </Button>
              {orderActionValidators.reject.canPerform(detailOrder) && (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<CancelIcon />}
                  onClick={() => handleOpenDialog('reject')}
                  sx={{ textTransform: 'none' }}
                >
                  Reject
                </Button>
              )}
              <Button
                variant="contained"
                color="info"
                size="small"
                startIcon={<LocalShippingIcon />}
                onClick={() => handleOpenDialog('ready')}
                disabled={!orderActionValidators.ready.canPerform(detailOrder)}
                title={orderActionValidators.ready.getDisabledReason(detailOrder) || ''}
                sx={{ textTransform: 'none' }}
              >
                Ready for Pickup
              </Button>
            </Stack>

            <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
              {/* Left: Customer & Delivery address */}
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                  Customer
                </Typography>
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '1rem' }}>
                      {detailOrder.user?.name?.charAt(0)?.toUpperCase() || '—'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {detailOrder.user?.name || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 14 }} />
                        {detailOrder.user?.email || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <PhoneIcon sx={{ fontSize: 14 }} />
                        {detailOrder.user?.mobile_number || detailOrder.address?.mobile_number || '—'}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.25, flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary">
                      {[
                        detailOrder.address?.name,
                        detailOrder.address?.house_no,
                        detailOrder.address?.street_details,
                        detailOrder.address?.landmark,
                      ]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {/* Right: Rider Details */}
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                  Rider Details
                </Typography>
                {detailOrder.riderInformation ? (
                  <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '1rem' }}>
                        {detailOrder.riderInformation.rider_name?.charAt(0)?.toUpperCase() || 'R'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {detailOrder.riderInformation.rider_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 14 }} />
                          {detailOrder.riderInformation.rider_phone_number}
                        </Typography>
                        {detailOrder.riderInformation.rider_pickup_time && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <EventAvailableIcon sx={{ fontSize: 14 }} />
                            Pickup: {format(new Date(detailOrder.riderInformation.rider_pickup_time), 'MMM d, yyyy hh:mm a')}
                          </Typography>
                        )}
                      </Box>
                      <Chip label="Assigned" size="small" color="success" variant="outlined" />
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ py: 2, px: 1.5, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
                    <TwoWheelerIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      No rider assigned
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block">
                      Rider will be assigned when order is ready for delivery
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
              Items
            </Typography>
            <List dense disablePadding sx={{ mb: 2, bgcolor: 'action.hover', borderRadius: 1, py: 0 }}>
              {detailOrder.orderItems?.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    px: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {concatProductAndVariant(item.product_name, item.variant_name)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Qty: {item.quantity} × ₹{item.unit_price?.toFixed(2)} = ₹{item.final_price?.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </List>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ textAlign: 'right', minWidth: 200 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal: ₹{detailOrder.total_amount?.toFixed(2) ?? '0.00'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Discount: -₹{detailOrder.discount_amount?.toFixed(2) ?? '0.00'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Shipping: ₹{detailOrder.shipping_charges?.toFixed(2) ?? '0.00'}
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Total: ₹{detailOrder.final_amount?.toLocaleString() ?? '0.00'}
                </Typography>
              </Box>
            </Box>

            <Dialog open={actionDialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
              <DialogTitle>
                {actionDialog.type === 'accept' && 'Accept Order'}
                {actionDialog.type === 'reject' && 'Reject Order'}
                {actionDialog.type === 'ready' && 'Mark as Ready for Pickup'}
              </DialogTitle>
              <DialogContent>
                {actionDialog.type === 'accept' && (
                  <Typography>Are you sure you want to accept this order? The order status will be changed to ACCEPTED.</Typography>
                )}
                {actionDialog.type === 'reject' && (
                  <Box sx={{ pt: 0.5 }}>
                    <Typography sx={{ mb: 2 }}>Please provide a reason for rejection.</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
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
                  <Typography>Are you sure you want to mark this order as ready for pickup? The order status will be changed to READY_FOR_PICKUP.</Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} disabled={updating} sx={{ textTransform: 'none' }}>
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
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Failed to load order details
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
