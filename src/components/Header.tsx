import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Avatar,
    Badge,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
    Popover,
    Paper,
    Stack,
    Chip,
    Button,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import authService from '../services/auth.service';
import { showSuccessToast } from '../utils/toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuth } from '../store/authSlice';
import { clearBranches } from '../store/branchSlice';
import { useNotifications } from '../contexts/NotificationContext';
// import NewOrderDialog from './NewOrderDialog';
import type { Notification } from '../types/notification';
import NewOrderDialog from './NewOrderDialog';

const drawerWidth = 260;
const closedDrawerWidth = 70;

interface HeaderProps {
    open: boolean;
}

export default function Header({ open }: HeaderProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = React.useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const id = user?.id;
    
    const {
        notifications,
        unreadCount,
        loading: notificationsLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        newOrderNotification,
        setNewOrderNotification,
    } = useNotifications();
    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        navigate(`/users/${id}`)
        setAnchorEl(null);
    };

    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

    const handleNotificationItemClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        
        if (notification.action_url) {
            navigate(notification.action_url);
        }
        
        handleNotificationClose();
    };

    const handleViewOrder = (orderId: number) => {
        navigate(`/orders/detail/${orderId}`);
    };

    const getPriorityColor = (priority: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
        switch (priority) {
            case 'URGENT':
                return 'error';
            case 'HIGH':
                return 'warning';
            case 'MEDIUM':
                return 'primary';
            default:
                return 'default';
        }
    };

    const openNotificationPopover = Boolean(notificationAnchorEl);

    const handleLogout = async () => {
        setAnchorEl(null);
        try {
            await authService.logout();
            dispatch(clearAuth());
            dispatch(clearBranches());
            showSuccessToast('Logged out successfully');
            // Navigate to login after clearing auth data
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            dispatch(clearAuth());
            dispatch(clearBranches());
            // Still navigate to login even if logout API fails
            navigate('/login', { replace: true });
        }
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                width: `calc(100% - ${open ? drawerWidth : closedDrawerWidth}px)`,
                ml: `${open ? drawerWidth : closedDrawerWidth}px`,
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 'none',
                borderBottom: '1px solid #f0f0f0',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                transition: (theme) => theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
            }}
        >
            <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>

                {/* Right Icons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

                    <IconButton onClick={handleNotificationClick}>
                        <Badge badgeContent={unreadCount > 0 && typeof unreadCount === 'number' ? unreadCount : undefined} color="error">
                            <NotificationsIcon sx={{ color: '#204564' }} />
                        </Badge>
                    </IconButton>

                    <Popover
                        open={openNotificationPopover}
                        anchorEl={notificationAnchorEl}
                        onClose={handleNotificationClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        PaperProps={{
                            sx: {
                                width: 400,
                                mt: 1,
                                display: 'flex',
                                flexDirection: 'column',
                            },
                        }}
                    >
                        <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" fontWeight={600}>
                                        Notifications
                                    </Typography>
                                    {unreadCount > 0 && (
                                        <Button
                                            size="small"
                                            onClick={markAllAsRead}
                                            startIcon={<CheckCircleIcon />}
                                        >
                                            Mark all read
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                            <Box
                                sx={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    maxHeight: 'calc(100vh - 300px)', // Ensure it doesn't exceed viewport
                                }}
                            >
                                {notificationsLoading && notifications.length === 0 ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : notifications.length === 0 ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No notifications
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List sx={{ p: 0 }}>
                                        {notifications.map((notification) => (
                                            <ListItem
                                                key={notification.id}
                                                onClick={() => handleNotificationItemClick(notification)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    bgcolor: notification.is_read 
                                                        ? 'background.paper' 
                                                        : (theme) => theme.palette.mode === 'dark' 
                                                            ? 'rgba(25, 118, 210, 0.12)' 
                                                            : 'rgba(25, 118, 210, 0.08)',
                                                    borderBottom: '1px solid',
                                                    borderColor: 'divider',
                                                    borderLeft: notification.is_read 
                                                        ? 'none' 
                                                        : '4px solid',
                                                    borderLeftColor: notification.is_read 
                                                        ? 'transparent' 
                                                        : 'primary.main',
                                                    py: 1.5,
                                                    px: 2,
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        bgcolor: notification.is_read 
                                                            ? 'action.hover' 
                                                            : (theme) => theme.palette.mode === 'dark' 
                                                                ? 'rgba(25, 118, 210, 0.2)' 
                                                                : 'rgba(25, 118, 210, 0.12)',
                                                        transform: 'translateX(2px)',
                                                    },
                                                }}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        sx={{
                                                            '&:hover': {
                                                                bgcolor: 'error.light',
                                                                color: 'error.main',
                                                            },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography 
                                                                variant="body2" 
                                                                fontWeight={notification.is_read ? 400 : 700}
                                                                color={notification.is_read ? 'text.primary' : 'primary.dark'}
                                                            >
                                                                {notification.title}
                                                            </Typography>
                                                            <Chip
                                                                label={notification.priority}
                                                                size="small"
                                                                color={getPriorityColor(notification.priority)}
                                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                                            />
                                                            {!notification.is_read && (
                                                                <Box
                                                                    sx={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: '50%',
                                                                        bgcolor: 'primary.main',
                                                                        ml: 0.5,
                                                                    }}
                                                                />
                                                            )}
                                                        </Stack>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography 
                                                                variant="caption" 
                                                                color={notification.is_read ? 'text.secondary' : 'text.primary'} 
                                                                component="div" 
                                                                display="block"
                                                                sx={{ 
                                                                    mt: 0.5,
                                                                    fontWeight: notification.is_read ? 400 : 500,
                                                                }}
                                                            >
                                                                {notification.message}
                                                            </Typography>
                                                            <Typography 
                                                                variant="caption" 
                                                                color="text.secondary" 
                                                                component="div" 
                                                                sx={{ mt: 0.5, display: 'block' }}
                                                            >
                                                                {notification.created_at 
                                                                    ? (() => {
                                                                        try {
                                                                            const date = new Date(notification.created_at);
                                                                            return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'PPp');
                                                                        } catch {
                                                                            return 'Invalid Date';
                                                                        }
                                                                    })()
                                                                    : 'N/A'}
                                                            </Typography>
                                                        </>
                                                    }
                                                    secondaryTypographyProps={{
                                                        component: 'div',
                                                    }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </Box>
                        </Paper>
                    </Popover>

                    <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, cursor: 'pointer' }}
                        onClick={handleMenu}
                    >
                        <Avatar 
                            alt={user?.name || 'User'} 
                            src="/static/images/avatar/1.jpg" 
                            sx={{ width: 32, height: 32 }}
                        >
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1 }}>
                                {user?.name || 'User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {user?.roleName?.replace('_', ' ') || 'User'}
                            </Typography>
                        </Box>
                        <ArrowDropDownIcon color="action" />
                    </Box>
                    <Menu
                        anchorEl={anchorEl}
                        id="account-menu"
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                        onClick={handleClose}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                mt: 1.5,
                                width: 200,
                                '& .MuiAvatar-root': {
                                    width: 32,
                                    height: 32,
                                    ml: -0.5,
                                    mr: 1,
                                },
                                '&:before': {
                                    content: '""',
                                    display: 'block',
                                    position: 'absolute',
                                    top: 0,
                                    right: 14,
                                    width: 10,
                                    height: 10,
                                    bgcolor: 'background.paper',
                                    transform: 'translateY(-50%) rotate(45deg)',
                                    zIndex: 0,
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
                            <ListItemIcon>
                                <SettingsIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            </ListItemIcon>
                            <Typography variant="body2" color="text.primary">Settings</Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
                            </ListItemIcon>
                            <Typography variant="body2" color="error.main" fontWeight={500}>Logout</Typography>
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
            
            {newOrderNotification && (
                <NewOrderDialog
                    open={!!newOrderNotification}
                    notification={newOrderNotification}
                    onClose={() => setNewOrderNotification(null)}
                    onViewOrder={handleViewOrder}
                />
            )}
        </AppBar>
    );
}