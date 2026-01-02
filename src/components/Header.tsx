import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    InputBase,
    Box,
    IconButton,
    Avatar,
    Badge,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { showSuccessToast } from '../utils/toast';
import { useAppDispatch } from '../store/hooks';
import { clearAuth } from '../store/authSlice';

const drawerWidth = 260;
const closedDrawerWidth = 70;

interface HeaderProps {
    open: boolean;
}

export default function Header({ open }: HeaderProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        setAnchorEl(null);
        try {
            await authService.logout();
            dispatch(clearAuth());
            showSuccessToast('Logged out successfully');
            // Navigate to login after clearing auth data
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            dispatch(clearAuth());
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
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {/* Search Bar */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: '#f5f7fa',
                        borderRadius: 8,
                        px: 2,
                        py: 0.5,
                        width: '400px',
                    }}
                >
                    <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <InputBase
                        placeholder="Search"
                        sx={{ flex: 1 }}
                    />
                </Box>

                {/* Right Icons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: '#ffcdd2'
                        }}
                    />
                    <IconButton>
                        <DarkModeIcon sx={{ color: '#204564' }} />
                    </IconButton>

                    <IconButton>
                        <Badge badgeContent={6} color="error">
                            <NotificationsIcon sx={{ color: '#204564' }} />
                        </Badge>
                    </IconButton>

                    <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, cursor: 'pointer' }}
                        onClick={handleMenu}
                    >
                        <Avatar alt="Moni Roy" src="/static/images/avatar/1.jpg" sx={{ width: 32, height: 32 }} />
                        <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1 }}>
                                Moni Roy
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Admin
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
        </AppBar>
    );
}
