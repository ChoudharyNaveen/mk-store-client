import React from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Toolbar,
    Collapse,
    IconButton,
    Tooltip,
    Popover,
    Select,
    MenuItem,
    FormControl,
    Divider,
} from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useRecentlyViewed } from '../contexts/RecentlyViewedContext';
import { setSelectedBranch } from '../store/branchSlice';
import { setAuth } from '../store/authSlice';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import LayersIcon from '@mui/icons-material/Layers';
import InventoryIcon from '@mui/icons-material/Inventory';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import DiscountIcon from '@mui/icons-material/Discount';
import ImageIcon from '@mui/icons-material/Image';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import LabelIcon from '@mui/icons-material/Label';

const drawerWidth = 260;
const closedDrawerWidth = 70;

interface MenuChild {
    text: string;
    path: string;
    icon?: React.ReactElement;
}

interface MenuItem {
    text: string;
    icon: React.ReactElement;
    path: string;
    children?: MenuChild[];
}

const menuItems: MenuItem[] = [
    {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/',
    },
    {
        text: 'Users',
        icon: <PeopleIcon />,
        path: '/users',
        // children: [
        //     { text: 'User List', path: '/users' },
        // ],
    },
    {
        text: 'Category',
        icon: <CategoryIcon />,
        path: '/category',
        // children: [
        //     { text: 'Category List', path: '/category' },
        // ],
    },
    {
        text: 'Sub Category',
        icon: <LayersIcon />,
        path: '/sub-category',
        // children: [
        //     { text: 'Sub Category List', path: '/sub-category' },
        // ],
    },
    {
        text: 'Brands',
        icon: <BrandingWatermarkIcon />,
        path: '/brands',
        // children: [
        //     { text: 'Brand List', path: '/brands' },
        // ],
    },
    {
        text: 'Products',
        icon: <InventoryIcon />,
        path: '/products',
        // children: [
        //     { text: 'Product List', path: '/products' },
        // ],
    },
    {
        text: 'Orders List',
        icon: <ShoppingCartIcon />,
        path: '/orders',
    },
    {
        text: 'Notifications',
        icon: <NotificationsIcon />,
        path: '/notifications',
    },
    {
        text: 'Promotions',
        icon: <LocalOfferIcon />,
        path: '/promotions',
        children: [
            { text: 'Promocode', path: '/promo-code', icon: <ConfirmationNumberIcon /> },
            { text: 'Offers', path: '/offers', icon: <DiscountIcon /> },
            { text: 'Banners', path: '/banners', icon: <ImageIcon /> },
        ],
    },
    {
        text: 'Settings',
        icon: <SettingsIcon />,
        path: '/settings',
        children: [
            { text: 'Product Types', path: '/product-types', icon: <LabelIcon /> },
            { text: 'Shipping Charges', path: '/settings/shipping-charges', icon: <LocalShippingIcon /> },
        ],
    },
];

interface SidebarProps {
    open: boolean;
    onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
    const location = useLocation();
    const pathname = location.pathname;
    const dispatch = useAppDispatch();
    const { orders: recentOrders, products: recentProducts } = useRecentlyViewed();

    // Auto-open submenu when current path is a child of an item with children
    const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(() => {
        const item = menuItems.find((i) => i.children?.some((c) => pathname === c.path || pathname.startsWith(c.path + '/')));
        return item?.text ?? null;
    });

    React.useEffect(() => {
        const item = menuItems.find((i) => i.children?.some((c) => pathname === c.path || pathname.startsWith(c.path + '/')));
        const next = item?.text ?? null;
        setOpenSubmenu((prev) => (next ? next : prev));
    }, [pathname]);
    
    // Get data from store
    const { user, token } = useAppSelector((state) => state.auth);
    const { branches, selectedBranchId } = useAppSelector((state) => state.branch);
    
    // Get vendor name (check for vendorName field, fallback to name or default)
    const vendorName = user?.vendorName || user?.name || 'MK Store';
    
    // Handle branch change
    const handleBranchChange = (event: { target: { value: unknown } }) => {
        const newBranchId = event.target.value as number;
        if (newBranchId && user && token) {
            dispatch(setSelectedBranch(newBranchId));
            // Update auth store with new branch ID
            dispatch(setAuth({
                user,
                token,
                branchId: newBranchId,
            }));
        }
    };

    // State for hover menu in collapsed mode
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [hoveredMenu, setHoveredMenu] = React.useState<string | null>(null);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleClick = (text: string) => {
        if (!open) return;
        if (openSubmenu === text) {
            setOpenSubmenu(null);
        } else {
            setOpenSubmenu(text);
        }
    };

    // Hover handlers for collapsed mode
    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>, text: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setAnchorEl(event.currentTarget);
        setHoveredMenu(text);
    };

    const handlePopoverClose = () => {
        timeoutRef.current = setTimeout(() => {
            setAnchorEl(null);
            setHoveredMenu(null);
        }, 200);
    };

    // Handler to keep popover open when entering it
    const handlePopoverEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    // Helper to find the active menu item object
    const getActiveMenuItem = (text: string) => menuItems.find(item => item.text === text);

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: open ? drawerWidth : closedDrawerWidth,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
                [`& .MuiDrawer-paper`]: {
                    width: open ? drawerWidth : closedDrawerWidth,
                    transition: (theme) => theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    overflowX: 'hidden',
                    borderRight: '1px solid #e0e0e0',
                },
            }}
        >
            <Toolbar sx={{
                display: 'flex',
                flexDirection: open ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: open ? 'space-between' : 'center',
                px: 2,
                py: 2,
                gap: 1,
                position: 'relative',
            }}>
                {open ? (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0, maxWidth: 'calc(100% - 60px)' }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    flexShrink: 0,
                                }}
                            >
                                <ShoppingBagIcon />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
                                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1, mb: 0.5 }}>
                                    {vendorName}
                                </Typography>
                                <FormControl 
                                    size="small" 
                                    sx={{ 
                                        minWidth: 140,
                                        maxWidth: 180,
                                        width: '100%',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#2C405A',
                                        borderWidth: '1.5px',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#2C405A',
                                    },
                                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#2C405A',
                                        borderWidth: '2px',
                                    },
                                }}
                            >
                                <Select
                                    value={selectedBranchId || ''}
                                    onChange={handleBranchChange}
                                    displayEmpty
                                    renderValue={(value) => {
                                        if (!value) return 'Select Branch';
                                        const branch = branches.find(b => b.id === value);
                                        if (!branch) return 'Select Branch';
                                        return (
                                            <Tooltip title={branch.name} arrow placement="top">
                                                <Box sx={{ 
                                                    width: '100%', 
                                                    minWidth: 0,
                                                    overflow: 'hidden',
                                                }}>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            fontWeight: 600, 
                                                            color: '#2C405A',
                                                            lineHeight: 1.2,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '100%',
                                                        }}
                                                    >
                                                        {branch.name}
                                                    </Typography>
                                                    {/* {branch.code && (
                                                        <Typography 
                                                            variant="caption" 
                                                            sx={{ 
                                                                color: '#6C757D',
                                                                fontSize: '0.7rem',
                                                                lineHeight: 1.2,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                maxWidth: '100%',
                                                            }}
                                                        >
                                                            {branch.code}
                                                        </Typography>
                                                    )} */}
                                                </Box>
                                            </Tooltip>
                                        );
                                    }}
                                    sx={{
                                        height: 'auto',
                                        minHeight: 40,
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        '& .MuiSelect-select': {
                                            py: 1,
                                            px: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            minWidth: 0,
                                            width: '100%',
                                        },
                                        '& .MuiSelect-icon': {
                                            color: '#6C757D',
                                            flexShrink: 0,
                                        },
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                maxHeight: 300,
                                                mt: 0.5,
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                            },
                                        },
                                    }}
                                >
                                    {branches.length === 0 ? (
                                        <MenuItem value="" disabled>
                                            No branches available
                                        </MenuItem>
                                    ) : (
                                        branches.map((branch) => (
                                            <MenuItem 
                                                key={branch.id} 
                                                value={branch.id}
                                                sx={{
                                                    py: 1.5,
                                                    px: 2,
                                                    bgcolor: branch.id === selectedBranchId ? 'rgba(32, 69, 100, 0.08)' : 'transparent',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(32, 69, 100, 0.04)',
                                                    },
                                                }}
                                            >
                                                <Tooltip title={branch.name} arrow placement="right">
                                                    <Box sx={{ 
                                                        width: '100%', 
                                                        minWidth: 0,
                                                        overflow: 'hidden',
                                                    }}>
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ 
                                                                fontWeight: branch.id === selectedBranchId ? 600 : 500,
                                                                color: branch.id === selectedBranchId ? '#2C405A' : '#333',
                                                                lineHeight: 1.3,
                                                                mb: 0.25,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                maxWidth: '100%',
                                                            }}
                                                        >
                                                            {branch.name}
                                                        </Typography>
                                                        {branch.code && (
                                                            <Typography 
                                                                variant="caption" 
                                                                sx={{
                                                                    color: '#6C757D',
                                                                    fontSize: '0.75rem',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    maxWidth: '100%',
                                                                }}
                                                            >
                                                                {branch.code}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Tooltip>
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                    <IconButton 
                        onClick={onToggle}
                        sx={{
                            flexShrink: 0,
                            position: 'absolute',
                            right: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    </>
                ) : (
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            mb: 1,
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            }
                        }}
                    >
                        <ShoppingBagIcon />
                    </Box>
                )}
            </Toolbar>

            <Box sx={{ overflow: 'auto' }}>
                <List component="nav">
                    {menuItems.map((item) => {
                        const isDashboard = item.path === '/';
                        const hasChildren = Boolean(item.children?.length);
                        const isItemActive = isDashboard
                            ? pathname === '/'
                            : hasChildren
                                ? item.children!.some((c) => pathname === c.path || pathname.startsWith(c.path + '/'))
                                : pathname === item.path || pathname.startsWith(item.path + '/');

                        return (
                            <React.Fragment key={item.text}>
                                <ListItem component="div" disablePadding sx={{ display: 'block' }}>
                                    {!open && !item.children ? (
                                        <Tooltip title={item.text} placement="right">
                                            <ListItemButton
                                                component={Link}
                                                to={item.path!}
                                                sx={{
                                                    minHeight: 48,
                                                    justifyContent: 'center',
                                                    px: 2.5,
                                                    color: isItemActive ? 'primary.main' : 'text.secondary',
                                                    bgcolor: isItemActive ? 'action.selected' : 'transparent',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                    }
                                                }}
                                            >
                                                <ListItemIcon
                                                    sx={{
                                                        minWidth: 0,
                                                        mr: 'auto',
                                                        justifyContent: 'center',
                                                        color: isItemActive ? 'primary.main' : 'inherit'
                                                    }}
                                                >
                                                    {item.icon}
                                                </ListItemIcon>
                                            </ListItemButton>
                                        </Tooltip>
                                    ) : (
                                        <>
                                            {!item.children ? (
                                                <ListItemButton
                                                    component={Link}
                                                    to={item.path!}
                                                    sx={{
                                                        minHeight: 48,
                                                        justifyContent: open ? 'initial' : 'center',
                                                        px: 2.5,
                                                        color: isItemActive ? 'white' : 'text.secondary',
                                                        bgcolor: isItemActive ? '#204564' : 'transparent',
                                                        '&:hover': {
                                                            bgcolor: isItemActive ? '#1a3852' : 'action.hover',
                                                        }
                                                    }}
                                                >
                                                    <ListItemIcon
                                                        sx={{
                                                            minWidth: 0,
                                                            mr: open ? 2 : 'auto',
                                                            justifyContent: 'center',
                                                            color: isItemActive ? 'white' : 'inherit'
                                                        }}
                                                    >
                                                        {item.icon}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={item.text}
                                                        sx={{ opacity: open ? 1 : 0, display: open ? 'block' : 'none' }}
                                                        primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: isItemActive ? 600 : 500 }}
                                                    />
                                                </ListItemButton>
                                            ) : (
                                                <ListItemButton
                                                    onClick={() => handleClick(item.text)}
                                                    onMouseEnter={(e: React.MouseEvent<HTMLElement>) => !open ? handlePopoverOpen(e, item.text) : null}
                                                    onMouseLeave={!open ? handlePopoverClose : undefined}
                                                    sx={{
                                                        minHeight: 48,
                                                        justifyContent: open ? 'initial' : 'center',
                                                        px: 2.5,
                                                        color: isItemActive ? 'white' : 'text.secondary',
                                                        bgcolor: isItemActive ? '#204564' : 'transparent',
                                                        '&:hover': {
                                                            bgcolor: isItemActive ? '#1a3852' : 'action.hover',
                                                        }
                                                    }}
                                                >
                                                    <ListItemIcon
                                                        sx={{
                                                            minWidth: 0,
                                                            mr: open ? 2 : 'auto',
                                                            justifyContent: 'center',
                                                            color: isItemActive ? 'white' : 'inherit',
                                                        }}
                                                    >
                                                        {item.icon}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={item.text}
                                                        sx={{ opacity: open ? 1 : 0, display: open ? 'block' : 'none' }}
                                                        primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: isItemActive ? 600 : 500 }}
                                                    />
                                                    {open && item.children ? (openSubmenu === item.text ? <ExpandLess /> : <ExpandMore />) : null}
                                                </ListItemButton>
                                            )}
                                        </>
                                    )}
                                </ListItem>
                                {item.children && (
                                    <Collapse in={open && openSubmenu === item.text} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {item.children.map((child) => (
                                                <ListItemButton
                                                    key={child.text}
                                                    component={Link}
                                                    to={child.path}
                                                    sx={{ pl: 9 }}
                                                    selected={pathname === child.path}
                                                >
                                                    {child.icon && (
                                                        <ListItemIcon
                                                            sx={{
                                                                minWidth: 36,
                                                                color: pathname === child.path ? 'primary.main' : 'inherit',
                                                            }}
                                                        >
                                                            {child.icon}
                                                        </ListItemIcon>
                                                    )}
                                                    <ListItemText
                                                        primary={child.text}
                                                        primaryTypographyProps={{
                                                            fontSize: '0.85rem',
                                                            color: pathname === child.path ? 'primary.main' : 'text.primary'
                                                        }}
                                                    />
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    </Collapse>
                                )}
                            </React.Fragment>
                        );
                    })}
                    {/* Recently viewed */}
                    {(recentOrders.length > 0 || recentProducts.length > 0) && open && (
                        <>
                            <Divider sx={{ my: 1 }} />
                            <ListItem component="div" disablePadding sx={{ display: 'block', px: 2.5, py: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                    Recently viewed
                                </Typography>
                                {recentOrders.slice(0, 3).map((item) => (
                                    <ListItemButton
                                        key={`order-${item.id}`}
                                        component={Link}
                                        to={`/orders/detail/${item.id}`}
                                        sx={{ pl: 1, py: 0.25, minHeight: 36 }}
                                    >
                                        <HistoryIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                        <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.8rem', noWrap: true }} />
                                    </ListItemButton>
                                ))}
                                {recentProducts.slice(0, 3).map((item) => (
                                    <ListItemButton
                                        key={`product-${item.id}`}
                                        component={Link}
                                        to={`/products/detail/${item.id}`}
                                        sx={{ pl: 1, py: 0.25, minHeight: 36 }}
                                    >
                                        <HistoryIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                        <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.8rem', noWrap: true }} />
                                    </ListItemButton>
                                ))}
                            </ListItem>
                        </>
                    )}
                </List>
            </Box>

            {/* Popover Menu for Collapsed Submenus */}
            <Popover
                id="mouse-over-popover"
                sx={{
                    pointerEvents: 'none',
                }}
                open={!open && Boolean(anchorEl)}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <Box
                    sx={{ p: 2, pointerEvents: 'auto', minWidth: 150 }}
                    onMouseEnter={handlePopoverEnter}
                    onMouseLeave={handlePopoverClose}
                >
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>{hoveredMenu}</Typography>
                    <List dense disablePadding>
                        {getActiveMenuItem(hoveredMenu || '')?.children?.map((child) => (
                            <ListItemButton
                                key={child.text}
                                component={Link}
                                to={child.path}
                                sx={{ pl: 0 }}
                            >
                                {child.icon && (
                                    <ListItemIcon sx={{ minWidth: 36 }}>{child.icon}</ListItemIcon>
                                )}
                                <ListItemText primary={child.text} />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            </Popover>

            {/* Bottom Expand Button - Only visible when collapsed */}
            {!open && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        borderTop: '1px solid #e0e0e0',
                        bgcolor: 'background.paper'
                    }}
                >
                    <IconButton
                        onClick={onToggle}
                        sx={{
                            color: 'primary.main',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
            )}
        </Drawer>
    );
}
