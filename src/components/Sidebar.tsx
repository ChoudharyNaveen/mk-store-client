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
} from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import LayersIcon from '@mui/icons-material/Layers';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DiscountIcon from '@mui/icons-material/Discount';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const drawerWidth = 260;
const closedDrawerWidth = 70;

interface MenuItem {
    text: string;
    icon: React.ReactElement;
    path: string;
    children?: Array<{ text: string; path: string }>;
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
        text: 'Products',
        icon: <InventoryIcon />,
        path: '/products',
        // children: [
        //     { text: 'Product List', path: '/products' },
        // ],
    },
    {
        text: 'Promocode',
        icon: <LocalOfferIcon />,
        path: '/promo-code',
        // children: [
        //     { text: 'Promocode List', path: '/promo-code' },
        // ],
    },
    {
        text: 'Offers',
        icon: <DiscountIcon />,
        path: '/offers',
        // children: [
        //     { text: 'Offers List', path: '/offers' },
        // ],
    },
    {
        text: 'Orders List',
        icon: <ShoppingCartIcon />,
        path: '/orders',
    },
];

interface SidebarProps {
    open: boolean;
    onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
    const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);
    const location = useLocation();
    const pathname = location.pathname;

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
                py: 2
            }}>
                {open ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                            }}
                        >
                            <ShoppingBagIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1 }}>
                                MK Store
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Online Store
                            </Typography>
                        </Box>
                    </Box>
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
                {open && (
                    <IconButton onClick={onToggle}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Toolbar>

            <Box sx={{ overflow: 'auto', mt: 1 }}>
                <List component="nav">
                    {menuItems.map((item) => {
                        const isDashboard = item.path === '/';
                        const isItemActive = isDashboard ? pathname === '/' : pathname === item.path || pathname.startsWith(item.path + '/');

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
                                                            color: isItemActive ? 'primary.main' : 'inherit'
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
