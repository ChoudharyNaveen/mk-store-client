/**
 * New Order Dialog Component
 * Displays order details when a new order notification is received
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  Paper,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { format, isValid } from 'date-fns';
import type { Notification } from '../types/notification';
import { fetchOrderDetails } from '../services/order.service';
import type { OrderDetailsResponse } from '../services/order.service';

interface NewOrderDialogProps {
  open: boolean;
  notification: Notification;
  onClose: () => void;
  onViewOrder: (orderId: number) => void;
}

const NewOrderDialog: React.FC<NewOrderDialogProps> = ({
  open,
  notification,
  onClose,
  onViewOrder,
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (open && notification?.entity_id) {
      fetchOrderData();
    } else {
      setOrderDetails(null);
      setError(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, notification?.entity_id]);

  const fetchOrderData = async () => {
    if (!notification?.entity_id) {
      setError('Order ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderDetails(notification.entity_id);
      
      // Validate the response data
      if (!data || !data.order_number) {
        throw new Error('Invalid order data received');
      }
      
      setOrderDetails(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order details';
      setError(errorMessage);
      setOrderDetails(null);
      // Don't crash - just show error
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = () => {
    if (notification?.entity_id) {
      onViewOrder(notification.entity_id);
      onClose();
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'warning';
      case 'CONFIRMED':
        return 'primary';
      case 'PROCESSING':
        return 'primary';
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (status.toUpperCase()) {
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

  // Don't render if notification is invalid
  if (!open || !notification) {
    return null;
  }

  // Format date safely
  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isValid(date)) {
        return format(date, 'PPpp');
      }
      return 'Invalid Date';
    } catch {
      return 'N/A';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h6" component="div">
            New Order Received
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            {notification?.message && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                  Notification:
                </Typography>
                <Typography variant="body2">{notification.message}</Typography>
              </Alert>
            )}
            {notification?.entity_id && (
              <Button
                variant="contained"
                onClick={handleViewOrder}
                startIcon={<LocalShippingIcon />}
                sx={{ mt: 2 }}
              >
                View Order Details
              </Button>
            )}
          </Box>
        ) : orderDetails ? (
          <Box>
            {/* Order Header */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Order Number
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {orderDetails.order_number}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Order Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(orderDetails.order_information.order_date)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Chip
                        label={orderDetails.order_information.order_status}
                        color={getStatusColor(orderDetails.order_information.order_status)}
                        size="small"
                      />
                    </Stack>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Payment:
                      </Typography>
                      <Chip
                        label={orderDetails.order_information.payment_status}
                        color={getPaymentStatusColor(orderDetails.order_information.payment_status)}
                        size="small"
                      />
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </Paper>

            <Divider sx={{ my: 2 }} />

            {/* Customer Information */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon fontSize="small" />
                Customer Information
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">{orderDetails.customer_information.name}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" />
                        Email
                      </Typography>
                      <Typography variant="body1">{orderDetails.customer_information.email}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="small" />
                      Mobile
                    </Typography>
                    <Typography variant="body1">{orderDetails.customer_information.mobile_number}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>

            {/* Delivery Address */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon fontSize="small" />
                Delivery Address
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body1" fontWeight={500} sx={{ mb: 0.5 }}>
                  {orderDetails.delivery_address.recipient_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {orderDetails.delivery_address.address_line_1}
                  {orderDetails.delivery_address.address_line_2 && `, ${orderDetails.delivery_address.address_line_2}`}
                </Typography>
                {orderDetails.delivery_address.street_details && (
                  <Typography variant="body2" color="text.secondary">
                    {orderDetails.delivery_address.street_details}
                  </Typography>
                )}
                {orderDetails.delivery_address.landmark && (
                  <Typography variant="body2" color="text.secondary">
                    Landmark: {orderDetails.delivery_address.landmark}
                  </Typography>
                )}
                {orderDetails.delivery_address.mobile_number && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon fontSize="small" />
                    {orderDetails.delivery_address.mobile_number}
                  </Typography>
                )}
              </Paper>
            </Box>

            {/* Order Items */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon fontSize="small" />
                Order Items ({orderDetails.order_items.length})
              </Typography>
              <Paper elevation={0} sx={{ bgcolor: 'background.default' }}>
                {orderDetails.order_items.map((item, index) => (
                  <Box key={item.id} sx={{ p: 2, borderBottom: index < orderDetails.order_items.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {item.product?.title || 'N/A'}
                          </Typography>
                          {item.is_combo && (
                            <Chip
                              label="Combo Discount"
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
                        {item.variant?.variant_name && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {item.variant.variant_name}
                          </Typography>
                        )}
                        {item.variant?.variant_type && item.variant?.variant_value && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {item.variant.variant_type}: {item.variant.variant_value}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Qty: {item.quantity} × ₹{item.unit_price?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'right' } }}>
                        <Typography variant="body2" color="text.secondary">
                          Subtotal: ₹{((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Discount: ₹{item.discount?.toFixed(2) || '0.00'}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          ₹{item.total?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Box>

            {/* Order Summary */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Order Summary
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2">₹{orderDetails.summary?.subtotal?.toFixed(2) || '0.00'}</Typography>
                  </Box>
                  {(orderDetails.summary?.discount || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Discount
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        -₹{orderDetails.summary.discount?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Shipping Charges
                    </Typography>
                    <Typography variant="body2">₹{orderDetails.summary?.shipping?.toFixed(2) || '0.00'}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={600}>
                      Total Amount
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="primary">
                      ₹{orderDetails.summary?.total?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {orderDetails && (
          <Button onClick={handleViewOrder} variant="contained" startIcon={<LocalShippingIcon />}>
            View Full Order
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NewOrderDialog;
