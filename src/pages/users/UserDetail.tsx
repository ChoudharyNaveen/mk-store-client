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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUsers, deleteUser, convertUserToRider } from '../../services/user.service';
import { fetchOrders } from '../../services/order.service';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import type { User } from '../../types/user';
import type { Order } from '../../types/order';
import { format } from 'date-fns';

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

export default function UserDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = React.useState<User | null>(null);
    const [orders, setOrders] = React.useState<Order[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [ordersLoading, setOrdersLoading] = React.useState(false);
    const [tabValue, setTabValue] = React.useState(0);
    const [deleting, setDeleting] = React.useState(false);
    const [converting, setConverting] = React.useState(false);

    // Calculate statistics from orders
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.final_amount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = orders.length > 0
        ? new Date(Math.max(...orders.map(o => new Date(o.created_at).getTime())))
        : null;

    React.useEffect(() => {
        const loadUser = async () => {
            if (!id) {
                navigate('/users');
                return;
            }

            try {
                setLoading(true);
                const response = await fetchUsers({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    setUser(response.list[0]);
                } else {
                    showErrorToast('User not found');
                    navigate('/users');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                showErrorToast('Failed to load user details');
                navigate('/users');
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [id, navigate]);

    React.useEffect(() => {
        const loadOrders = async () => {
            if (!id) return;

            try {
                setOrdersLoading(true);
                // Convert id to number if it's a string
                const userId = typeof id === 'string' ? Number(id) : id;
                const response = await fetchOrders({
                    filters: [{ key: 'created_by', eq: userId }],
                    page: 0,
                    pageSize: 100, // Fetch more orders for stats
                });

                if (response.list) {
                    setOrders(response.list);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
                // Don't show error toast, just log it - user info is more important
            } finally {
                setOrdersLoading(false);
            }
        };

        if (user) {
            loadOrders();
        }
    }, [id, user]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleDelete = async () => {
        if (!user) return;

        const confirmed = window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            setDeleting(true);
            await deleteUser(user.id);
            showSuccessToast('User deleted successfully');
            navigate('/users');
        } catch (error) {
            console.error('Error deleting user:', error);
            showErrorToast('Failed to delete user. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const handleConvertToRider = async () => {
        if (!user) return;

        const confirmed = window.confirm(`Are you sure you want to convert "${user.name}" to a rider?`);
        if (!confirmed) return;

        try {
            setConverting(true);
            await convertUserToRider(user.id);
            showSuccessToast('User converted to rider successfully!');
            // Reload user data
            const response = await fetchUsers({
                filters: [{ key: 'id', eq: id }],
                page: 0,
                pageSize: 1,
            });
            if (response.list && response.list.length > 0) {
                setUser(response.list[0]);
            }
        } catch (error) {
            console.error('Error converting user to rider:', error);
            showErrorToast('Failed to convert user to rider. Please try again.');
        } finally {
            setConverting(false);
        }
    };

    const getStatusColor = (status?: string) => {
        if (!status) return 'default';
        return status === 'ACTIVE' || status === 'VERIFIED' ? 'success' : 'default';
    };

    const getRoleColor = (role?: string) => {
        if (!role) return 'default';
        return role === 'RIDER' ? 'primary' : 'default';
    };

    const getOrderStatusColor = (status: string) => {
        const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
            'DELIVERED': 'success',
            'CONFIRMED': 'info',
            'PROCESSING': 'info',
            'SHIPPED': 'info',
            'PENDING': 'warning',
            'CANCELLED': 'error',
        };
        return statusMap[status] || 'default';
    };

    const getPaymentStatusColor = (status: string) => {
        const statusMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
            'PAID': 'success',
            'PARTIAL': 'warning',
            'UNPAID': 'error',
            'REFUNDED': 'error',
        };
        return statusMap[status] || 'default';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return null;
    }

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
                        User Details
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    {user.role === 'USER' && (
                        <Button
                            variant="outlined"
                            startIcon={<SwapHorizIcon />}
                            onClick={handleConvertToRider}
                            disabled={converting}
                            sx={{ textTransform: 'none' }}
                        >
                            Convert to Rider
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/users/${id}`)}
                        sx={{ textTransform: 'none' }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                        disabled={deleting}
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
                                        {ordersLoading ? '...' : totalOrders}
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
                                    <AccountBalanceWalletIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Total Spent
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        {ordersLoading ? '...' : `₹${totalSpent.toLocaleString()}`}
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
                                    <TrendingUpIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Average Order Value
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                                        {ordersLoading ? '...' : `₹${Math.round(averageOrderValue).toLocaleString()}`}
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
                                    <CalendarTodayIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Last Order Date
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                        {ordersLoading ? '...' : lastOrderDate ? format(lastOrderDate, 'MMM dd, yyyy') : 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Left Column - Avatar and Basic Info */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <Avatar
                                sx={{
                                    width: 200,
                                    height: 200,
                                    bgcolor: 'primary.main',
                                    fontSize: '4rem',
                                }}
                            >
                                {user.name ? user.name.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 100 }} />}
                            </Avatar>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
                            {user.status && (
                                <Chip
                                    label={user.status}
                                    color={getStatusColor(user.status)}
                                    size="small"
                                />
                            )}
                            {user.profileStatus && (
                                <Chip
                                    label={user.profileStatus}
                                    color={getStatusColor(user.profileStatus)}
                                    size="small"
                                />
                            )}
                            {user.role && (
                                <Chip
                                    label={user.role}
                                    color={getRoleColor(user.role)}
                                    size="small"
                                />
                            )}
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                User ID
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                #{user.id}
                            </Typography>
                        </Box>
                        {user.createdAt && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                    Member Since
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Right Column - Tabs */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="Orders" />
                            <Tab label="Addresses" />
                            <Tab label="Activity" />
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                {user.name || 'User'}
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        User ID
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        #{user.id}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Full Name
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {user.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Email
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {user.email || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Phone Number
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {user.mobileNumber || user.phone || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Role
                                    </Typography>
                                    <Chip
                                        label={user.role || 'N/A'}
                                        color={getRoleColor(user.role)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Status
                                    </Typography>
                                    {user.status ? (
                                        <Chip
                                            label={user.status}
                                            color={getStatusColor(user.status)}
                                            size="small"
                                        />
                                    ) : (
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            N/A
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Profile Status
                                    </Typography>
                                    {user.profileStatus ? (
                                        <Chip
                                            label={user.profileStatus}
                                            color={getStatusColor(user.profileStatus)}
                                            size="small"
                                        />
                                    ) : (
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            N/A
                                        </Typography>
                                    )}
                                </Grid>
                                {user.address && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Address
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {user.address}
                                        </Typography>
                                    </Grid>
                                )}
                                {user.createdAt && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Created Date
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {format(new Date(user.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </TabPanel>

                        {/* Orders Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Order History
                            </Typography>
                            {ordersLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : orders.length === 0 ? (
                                <Box sx={{ textAlign: 'center', p: 3 }}>
                                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                        No orders found for this user.
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Order Number</TableCell>
                                                <TableCell>Order Date</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Payment Status</TableCell>
                                                <TableCell align="right">Total Amount</TableCell>
                                                <TableCell align="right">Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {orders.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell>
                                                        <Typography
                                                            sx={{
                                                                color: 'primary.main',
                                                                cursor: 'pointer',
                                                                fontWeight: 500,
                                                                '&:hover': {
                                                                    textDecoration: 'underline',
                                                                },
                                                            }}
                                                            onClick={() => navigate(`/orders/detail/${order.id}`)}
                                                        >
                                                            {order.order_number}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={order.status}
                                                            color={getOrderStatusColor(order.status)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={order.payment_status}
                                                            color={getPaymentStatusColor(order.payment_status)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        ₹{order.final_amount?.toLocaleString() || '0.00'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => navigate(`/orders/detail/${order.id}`)}
                                                            sx={{ textTransform: 'none' }}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </TabPanel>

                        {/* Addresses Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Delivery Addresses
                            </Typography>
                            {orders.length === 0 ? (
                                <Box sx={{ textAlign: 'center', p: 3 }}>
                                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                        No addresses found. Addresses will appear here when the user places orders.
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={2}>
                                    {orders
                                        .filter((order) => order.address)
                                        .map((order, index) => (
                                            <Card key={order.id || index} variant="outlined">
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box>
                                                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                                {order.address?.name || 'N/A'}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                                {order.address?.house_no} {order.address?.street_details}
                                                            </Typography>
                                                            {order.address?.landmark && (
                                                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                                    {order.address.landmark}
                                                                </Typography>
                                                            )}
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                Phone: {order.address?.mobile_number || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                        {index === 0 && (
                                                            <Chip
                                                                label="Latest"
                                                                color="primary"
                                                                size="small"
                                                            />
                                                        )}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    {orders.filter((order) => order.address).length === 0 && (
                                        <Box sx={{ textAlign: 'center', p: 3 }}>
                                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                                No address information available in orders.
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            )}
                        </TabPanel>

                        {/* Activity Tab */}
                        <TabPanel value={tabValue} index={3}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Account Activity & Audit
                            </Typography>
                            <Grid container spacing={2}>
                                {user.createdAt && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Account Created
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {format(new Date(user.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        User ID
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        #{user.id}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Current Role
                                    </Typography>
                                    <Chip
                                        label={user.role || 'N/A'}
                                        color={getRoleColor(user.role)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Current Status
                                    </Typography>
                                    {user.status ? (
                                        <Chip
                                            label={user.status}
                                            color={getStatusColor(user.status)}
                                            size="small"
                                        />
                                    ) : (
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            N/A
                                        </Typography>
                                    )}
                                </Grid>
                                {user.concurrencyStamp && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Concurrency Stamp
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                            {user.concurrencyStamp}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                            {orders.length > 0 && (
                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                        Order Activity Summary
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        Total Orders
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        {totalOrders}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        Total Spent
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                        ₹{totalSpent.toLocaleString()}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        Average Order Value
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                                                        ₹{Math.round(averageOrderValue).toLocaleString()}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        Last Order
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        {lastOrderDate ? format(lastOrderDate, 'MMM dd, yyyy') : 'N/A'}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
