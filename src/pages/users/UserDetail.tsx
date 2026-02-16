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
    Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUsers, deleteUser, convertUserToRider, convertRiderToUser } from '../../services/user.service';
import { fetchOrders, fetchOrderStats } from '../../services/order.service';
import { fetchAddresses } from '../../services/address.service';
import { fetchRiderStats, type RiderStats } from '../../services/rider.service';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import type { User } from '../../types/user';
import type { Order } from '../../types/order';
import type { Address } from '../../types/address';
import type { Column } from '../../types/table';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';
import KPICard from '../../components/KPICard';

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

const getOrderStatusColor = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
        DELIVERED: 'success',
        CONFIRMED: 'info',
        PROCESSING: 'info',
        SHIPPED: 'info',
        PENDING: 'warning',
        CANCELLED: 'error',
    };
    return statusMap[status] || 'default';
};

const getPaymentStatusColor = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
        PAID: 'success',
        PARTIAL: 'warning',
        UNPAID: 'error',
        REFUNDED: 'error',
    };
    return statusMap[status] || 'default';
};

interface OrdersTableProps {
    userId: string;
}

function OrdersTable({ userId }: OrdersTableProps) {
    const navigate = useNavigate();
    const fetchOrdersForUser = React.useCallback(
        async (params: {
            page?: number;
            pageSize?: number;
            searchKeyword?: string;
            sorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
            signal?: AbortSignal;
        }) => {
            return fetchOrders({
                page: params.page,
                pageSize: params.pageSize,
                searchKeyword: params.searchKeyword,
                sorting: params.sorting,
                signal: params.signal,
                filters: [{ key: 'created_by', eq: String(userId) }],
            });
        },
        [userId]
    );

    const { paginationModel, setPaginationModel, tableState } = useServerPagination<Order>({
        fetchFunction: fetchOrdersForUser,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: {},
    });

    const columns: Column<Order>[] = [
        {
            id: 'order_number' as keyof Order,
            label: 'Order Number',
            minWidth: 140,
            render: (row: Order) => (
                <Typography
                    sx={{
                        color: 'primary.main',
                        cursor: 'pointer',
                        fontWeight: 500,
                        '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={() => navigate(`/orders/detail/${row.id}`)}
                >
                    {row.order_number}
                </Typography>
            ),
        },
        {
            id: 'created_at' as keyof Order,
            label: 'Order Date',
            minWidth: 120,
            render: (row: Order) => format(new Date(row.created_at), 'MMM dd, yyyy'),
        },
        {
            id: 'status' as keyof Order,
            label: 'Status',
            minWidth: 100,
            align: 'center',
            render: (row: Order) => (
                <Chip label={row.status} color={getOrderStatusColor(row.status)} size="small" />
            ),
        },
        {
            id: 'payment_status' as keyof Order,
            label: 'Payment Status',
            minWidth: 120,
            align: 'center',
            render: (row: Order) => (
                <Chip label={row.payment_status} color={getPaymentStatusColor(row.payment_status)} size="small" />
            ),
        },
        {
            id: 'final_amount' as keyof Order,
            label: 'Total Amount',
            minWidth: 110,
            align: 'right',
            render: (row: Order) => `₹${row.final_amount?.toLocaleString() || '0.00'}`,
        },
        {
            id: 'action' as keyof Order,
            label: 'Action',
            minWidth: 120,
            align: 'center',
            render: (row: Order) => (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/orders/detail/${row.id}`)}
                    sx={{ textTransform: 'none' }}
                >
                    View Details
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            key={`user-orders-${userId}-${paginationModel.page}-${paginationModel.pageSize}`}
            columns={columns}
            state={tableState}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
        />
    );
}

interface RiderStatsTableProps {
    userId: string;
}

function RiderStatsTable({ userId }: RiderStatsTableProps) {
    const navigate = useNavigate();
    const fetchOrdersForRider = React.useCallback(
        async (params: {
            page?: number;
            pageSize?: number;
            searchKeyword?: string;
            sorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
            signal?: AbortSignal;
        }) => {
            return fetchOrders({
                page: params.page,
                pageSize: params.pageSize,
                searchKeyword: params.searchKeyword,
                sorting: params.sorting,
                signal: params.signal,
                filters: [{ key: 'rider_id', eq: String(userId) }],
            });
        },
        [userId]
    );

    const { paginationModel, setPaginationModel, tableState } = useServerPagination<Order>({
        fetchFunction: fetchOrdersForRider,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: {},
    });

    const columns: Column<Order>[] = [
        {
            id: 'order_number' as keyof Order,
            label: 'Order Number',
            minWidth: 140,
            render: (row: Order) => (
                <Typography
                    sx={{
                        color: 'primary.main',
                        cursor: 'pointer',
                        fontWeight: 500,
                        '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={() => navigate(`/orders/detail/${row.id}`)}
                >
                    {row.order_number}
                </Typography>
            ),
        },
        {
            id: 'created_at' as keyof Order,
            label: 'Order Date',
            minWidth: 120,
            render: (row: Order) => format(new Date(row.created_at), 'MMM dd, yyyy'),
        },
        {
            id: 'status' as keyof Order,
            label: 'Status',
            minWidth: 100,
            align: 'center',
            render: (row: Order) => (
                <Chip label={row.status} color={getOrderStatusColor(row.status)} size="small" />
            ),
        },
        {
            id: 'payment_status' as keyof Order,
            label: 'Payment Status',
            minWidth: 120,
            align: 'center',
            render: (row: Order) => (
                <Chip label={row.payment_status} color={getPaymentStatusColor(row.payment_status)} size="small" />
            ),
        },
        {
            id: 'final_amount' as keyof Order,
            label: 'Total Amount',
            minWidth: 110,
            align: 'right',
            render: (row: Order) => `₹${row.final_amount?.toLocaleString() || '0.00'}`,
        },
        {
            id: 'action' as keyof Order,
            label: 'Action',
            minWidth: 120,
            align: 'center',
            render: (row: Order) => (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/orders/detail/${row.id}`)}
                    sx={{ textTransform: 'none' }}
                >
                    View Details
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            key={`rider-stats-${userId}-${paginationModel.page}-${paginationModel.pageSize}`}
            columns={columns}
            state={tableState}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
        />
    );
}

interface AddressesTableProps {
    userId: string;
}

function AddressesTable({ userId }: AddressesTableProps) {
    const fetchAddressesForUser = React.useCallback(
        async (params: {
            page?: number;
            pageSize?: number;
            searchKeyword?: string;
            sorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
            signal?: AbortSignal;
        }) => {
            return fetchAddresses({
                page: params.page,
                pageSize: params.pageSize,
                searchKeyword: params.searchKeyword,
                sorting: params.sorting,
                signal: params.signal,
                filters: [{ key: 'created_by', eq: String(userId) }],
            });
        },
        [userId]
    );

    const { paginationModel, setPaginationModel, tableState } = useServerPagination<Address>({
        fetchFunction: fetchAddressesForUser,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: {},
    });

    const columns: Column<Address>[] = [
        {
            id: 'id' as keyof Address,
            label: 'ID',
            minWidth: 70,
        },
        {
            id: 'name' as keyof Address,
            label: 'Name',
            minWidth: 120,
        },
        {
            id: 'mobile_number' as keyof Address,
            label: 'Mobile',
            minWidth: 120,
        },
        {
            id: 'address_line_1' as keyof Address,
            label: 'Address Line 1',
            minWidth: 140,
        },
        {
            id: 'street' as keyof Address,
            label: 'Street',
            minWidth: 120,
        },
        {
            id: 'city' as keyof Address,
            label: 'City',
            minWidth: 100,
        },
        {
            id: 'state' as keyof Address,
            label: 'State',
            minWidth: 100,
        },
        {
            id: 'pincode' as keyof Address,
            label: 'Pincode',
            minWidth: 90,
        },
        {
            id: 'status' as keyof Address,
            label: 'Status',
            minWidth: 90,
            align: 'center',
            render: (row: Address) => (
                <Chip
                    label={row.status}
                    color={row.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
        {
            id: 'created_at' as keyof Address,
            label: 'Created',
            minWidth: 120,
            render: (row: Address) => format(new Date(row.created_at), 'MMM dd, yyyy'),
        },
    ];

    return (
        <DataTable
            key={`user-addresses-${userId}-${paginationModel.page}-${paginationModel.pageSize}`}
            columns={columns}
            state={tableState}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
        />
    );
}

export default function UserDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [tabValue, setTabValue] = React.useState(0);
    const [overviewTabValue, setOverviewTabValue] = React.useState(0);
    const [deleting, setDeleting] = React.useState(false);
    const [converting, setConverting] = React.useState(false);
    const loadingUserForIdRef = React.useRef<string | null>(null);
    const [hasRiderOrders, setHasRiderOrders] = React.useState<boolean | null>(null);
    const [orderStats, setOrderStats] = React.useState<{
        total_orders: number;
        total_amount: number;
        last_order_date: string | null;
        count_by_status: Record<string, number>;
    } | null>(null);
    const [orderStatsLoading, setOrderStatsLoading] = React.useState(false);
    const [riderStats, setRiderStats] = React.useState<RiderStats | null>(null);
    const [riderStatsLoading, setRiderStatsLoading] = React.useState(false);

    React.useEffect(() => {
        if (!id) {
            navigate('/users');
            return;
        }
        // Avoid duplicate get-users when effect runs twice (e.g. React Strict Mode)
        if (loadingUserForIdRef.current === id) return;
        loadingUserForIdRef.current = id;

        const loadUser = async () => {
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
                loadingUserForIdRef.current = null;
            }
        };

        loadUser();
    }, [id, navigate]);

    // Check if this user has any orders as rider (rider_id = userId) to show Rider Stats tab
    React.useEffect(() => {
        if (!id || !user) return;
        setHasRiderOrders(null);

        const checkRiderOrders = async () => {
            try {
                const response = await fetchOrders({
                    filters: [{ key: 'rider_id', eq: String(id) }],
                    page: 0,
                    pageSize: 1,
                });
                setHasRiderOrders((response.totalCount ?? 0) > 0);
            } catch {
                setHasRiderOrders(false);
            }
        };

        checkRiderOrders();
    }, [id, user]);

    // Fetch rider stats when Rider Stats tab is active and rider orders exist
    React.useEffect(() => {
        if (!id || hasRiderOrders !== true || tabValue !== 4) return;

        const loadRiderStats = async () => {
            try {
                setRiderStatsLoading(true);
                const stats = await fetchRiderStats(id);
                setRiderStats(stats);
            } catch (error) {
                console.error('Error fetching rider stats:', error);
                setRiderStats(null);
            } finally {
                setRiderStatsLoading(false);
            }
        };

        loadRiderStats();
    }, [id, hasRiderOrders, tabValue]);

    // Fetch order stats when Activity tab is active (GET get-order-stats?createdBy=)
    React.useEffect(() => {
        if (!id || tabValue !== 3) return;

        const loadOrderStats = async () => {
            try {
                setOrderStatsLoading(true);
                const data = await fetchOrderStats(id);
                setOrderStats(data);
            } catch (error) {
                console.error('Error fetching order stats:', error);
                setOrderStats(null);
            } finally {
                setOrderStatsLoading(false);
            }
        };

        loadOrderStats();
    }, [id, tabValue]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleOverviewTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setOverviewTabValue(newValue);
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

    const handleConvertToUser = async () => {
        if (!user) return;
        const confirmed = window.confirm(`Are you sure you want to convert "${user.name}" back to a regular user?`);
        if (!confirmed) return;
        try {
            setConverting(true);
            await convertRiderToUser(user.id);
            showSuccessToast('Rider converted to user successfully!');
            const response = await fetchUsers({
                filters: [{ key: 'id', eq: id }],
                page: 0,
                pageSize: 1,
            });
            if (response.list && response.list.length > 0) {
                setUser(response.list[0]);
            }
        } catch (error) {
            console.error('Error converting rider to user:', error);
            showErrorToast('Failed to convert rider to user. Please try again.');
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
                    {user.role === 'RIDER' && (
                        <Button
                            variant="outlined"
                            startIcon={<SwapHorizIcon />}
                            onClick={handleConvertToUser}
                            disabled={converting}
                            sx={{ textTransform: 'none' }}
                        >
                            Convert to User
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

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="Orders" />
                            <Tab label="Addresses" />
                            <Tab label="Activity" />
                            {hasRiderOrders === true && <Tab label="Rider Stats" />}
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                    {user.name || 'User'}
                                </Typography>
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
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, gap: 1, flexWrap: 'wrap' }}>
                                    {user.status && (
                                        <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                                    )}
                                    {user.profileStatus && (
                                        <Chip label={user.profileStatus} color={getStatusColor(user.profileStatus)} size="small" />
                                    )}
                                    {user.role && (
                                        <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                                    )}
                                </Box>
                            </Box>

                            <Tabs value={overviewTabValue} onChange={handleOverviewTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                <Tab label="Basic Information" />
                                <Tab label="Details" />
                                <Tab label="Metadata" />
                            </Tabs>

                            <TabPanel value={overviewTabValue} index={0}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>User ID</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>#{user.id}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Full Name</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.name || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Email</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.email || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Phone Number</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.mobileNumber || user.phone || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Status</Typography>
                                        {user.status ? (
                                            <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                                        ) : (
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>N/A</Typography>
                                        )}
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Profile Status</Typography>
                                        {user.profileStatus ? (
                                            <Chip label={user.profileStatus} color={getStatusColor(user.profileStatus)} size="small" />
                                        ) : (
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>N/A</Typography>
                                        )}
                                    </Grid>
                                </Grid>
                            </TabPanel>

                            <TabPanel value={overviewTabValue} index={1}>
                                {user.address ? (
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>Address</Typography>
                                        <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>{user.address}</Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>No address available.</Typography>
                                )}
                            </TabPanel>

                            <TabPanel value={overviewTabValue} index={2}>
                                <Grid container spacing={2}>
                                    {user.createdAt && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Created At</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{format(new Date(user.createdAt), 'MMM dd, yyyy HH:mm')}</Typography>
                                        </Grid>
                                    )}
                                    {user.concurrencyStamp && (
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Concurrency Stamp</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{user.concurrencyStamp}</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </TabPanel>
                        </TabPanel>

                        {/* Orders Tab */}
                        <TabPanel value={tabValue} index={1}>
                            {id && <OrdersTable userId={id} />}
                        </TabPanel>

                        {/* Addresses Tab - get-address API with created_by = userId */}
                        <TabPanel value={tabValue} index={2}>
                            {id && <AddressesTable userId={id} />}
                        </TabPanel>

                        {/* Activity Tab - stats from GET get-order-stats?createdBy= */}
                        <TabPanel value={tabValue} index={3}>
                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                {[
                                    {
                                        label: 'Total Orders',
                                        value: orderStats?.total_orders ?? 0,
                                        icon: <ShoppingCartIcon />,
                                        iconBgColor: '#1976d2',
                                        bgColor: '#e3f2fd',
                                    },
                                    {
                                        label: 'Total Spent',
                                        value: `₹${(orderStats?.total_amount ?? 0).toLocaleString()}`,
                                        icon: <AccountBalanceWalletIcon />,
                                        iconBgColor: '#2e7d32',
                                        bgColor: '#e8f5e9',
                                        valueColor: '#2e7d32',
                                    },
                                    {
                                        label: 'Last Order Date',
                                        value: orderStats?.last_order_date ? format(new Date(orderStats.last_order_date), 'MMM dd, yyyy') : 'N/A',
                                        icon: <CalendarTodayIcon />,
                                        iconBgColor: '#ed6c02',
                                        bgColor: '#fff3e0',
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
                                            loading={orderStatsLoading}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                            {orderStats?.count_by_status && Object.keys(orderStats.count_by_status).length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Orders by Status</Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {Object.entries(orderStats.count_by_status).map(([status, count]) => (
                                            <Chip key={status} label={`${status}: ${count}`} size="small" variant="outlined" />
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Account Activity & Audit
                            </Typography>
                            <Grid container spacing={2}>
                                {user.createdAt && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Account Created</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{format(new Date(user.createdAt), 'MMM dd, yyyy HH:mm')}</Typography>
                                    </Grid>
                                )}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>User ID</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>#{user.id}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Current Status</Typography>
                                    {user.status ? (
                                        <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                                    ) : (
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>N/A</Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/* Rider Stats Tab - orders where this user is the rider (shown when any such orders exist) */}
                        {hasRiderOrders === true && (
                            <TabPanel value={tabValue} index={4}>
                                {riderStats && (
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        {[
                                            {
                                                label: 'Rider Total Orders',
                                                value: riderStats.total_orders,
                                                icon: <AssignmentIcon />,
                                                iconBgColor: '#1976d2',
                                                bgColor: '#e3f2fd',
                                            },
                                            {
                                                label: 'Total Deliveries',
                                                value: riderStats.total_deliveries,
                                                icon: <LocalShippingIcon />,
                                                iconBgColor: '#0288d1',
                                                bgColor: '#e1f5fe',
                                            },
                                            {
                                                label: 'Completed Orders',
                                                value: riderStats.completed_orders,
                                                icon: <CheckCircleIcon />,
                                                iconBgColor: '#2e7d32',
                                                bgColor: '#e8f5e9',
                                                valueColor: '#2e7d32',
                                            },
                                            {
                                                label: 'Cancelled Orders',
                                                value: riderStats.cancelled_orders,
                                                icon: <CancelIcon />,
                                                iconBgColor: '#d32f2f',
                                                bgColor: '#ffebee',
                                                valueColor: '#d32f2f',
                                            },
                                            {
                                                label: 'Rating',
                                                value: riderStats.rating?.toFixed(1) ?? '0.0',
                                                icon: <StarIcon />,
                                                iconBgColor: '#ed6c02',
                                                bgColor: '#fff3e0',
                                                valueColor: '#ed6c02',
                                            },
                                        ].map((kpi, index) => (
                                            <Grid key={index} size={{ xs: 12, sm: 6, md: 2 }}>
                                                <KPICard
                                                    label={kpi.label}
                                                    value={kpi.value}
                                                    icon={kpi.icon}
                                                    iconBgColor={kpi.iconBgColor}
                                                    bgColor={kpi.bgColor}
                                                    valueColor={kpi.valueColor}
                                                    loading={riderStatsLoading}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                                {id && <RiderStatsTable userId={id} />}
                            </TabPanel>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
