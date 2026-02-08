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
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { showSuccessToast } from '../utils/toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuth } from '../store/authSlice';
import { clearBranches } from '../store/branchSlice';
import { useNotifications } from '../contexts/NotificationContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { RECENTLY_VIEWED_STORAGE_KEY } from '../contexts/RecentlyViewedContext';
import NotificationPopover from './NotificationPopover';
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
    
    const { unreadCount, newOrderNotification, setNewOrderNotification } = useNotifications();
    const { mode, toggleMode } = useThemeMode();
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

    const handleViewOrder = (orderId: number) => {
        navigate(`/orders/detail/${orderId}`);
    };

    const handleLogout = async () => {
        setAnchorEl(null);
        try {
            await authService.logout();
            dispatch(clearAuth());
            dispatch(clearBranches());
            localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
            showSuccessToast('Logged out successfully');
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            dispatch(clearAuth());
            dispatch(clearBranches());
            localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={toggleMode} title={mode === 'light' ? 'Dark mode' : 'Light mode'} sx={{ color: '#204564' }}>
                        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                    </IconButton>
                    <IconButton onClick={handleNotificationClick}>
                        <Badge badgeContent={unreadCount > 0 && typeof unreadCount === 'number' ? unreadCount : undefined} color="error">
                            <NotificationsIcon sx={{ color: '#204564' }} />
                        </Badge>
                    </IconButton>

                    <NotificationPopover
                        anchorEl={notificationAnchorEl}
                        open={Boolean(notificationAnchorEl)}
                        onClose={handleNotificationClose}
                    />

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