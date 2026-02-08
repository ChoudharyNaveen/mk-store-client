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
    Card,
    CardContent,
    Tabs,
    Tab,
    Stack,
    IconButton,
    Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductDetails, fetchProductStats, fetchInventoryMovements } from '../../services/product.service';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import type { Product, ProductVariant } from '../../types/product';
import type { ProductStats, InventoryMovement } from '../../types/product';
import DataTable from '../../components/DataTable';
import { useRecentlyViewed } from '../../contexts/RecentlyViewedContext';
import { useServerPagination } from '../../hooks/useServerPagination';
import type { Column, TableState } from '../../types/table';
import { formatExpiryDate, getExpiryDateColor } from '../../utils/productHelpers';
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

// Helper to get default product image
const getDefaultImage = (product: Product): string | undefined => {
    if (product.images && product.images.length > 0) {
        const defaultImage = product.images.find(img => img.is_default);
        return defaultImage?.image_url || product.images[0]?.image_url;
    }
    return product.image;
};

export default function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { addProduct } = useRecentlyViewed();
    const [product, setProduct] = React.useState<Product | null>(null);
    const [productStats, setProductStats] = React.useState<ProductStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [tabValue, setTabValue] = React.useState(0);
    const [overviewTabValue, setOverviewTabValue] = React.useState(0);

    const {
        tableState,
        tableHandlers,
    } = useServerPagination<InventoryMovement>({
        fetchFunction: async (params) => {
            if (!id) return { list: [], totalCount: 0 };
            return await fetchInventoryMovements(id, params.page || 0, params.pageSize || 10);
        },
        initialPageSize: 10,
    });

    React.useEffect(() => {
        const loadProduct = async () => {
            if (!id) {
                navigate('/products');
                return;
            }

            try {
                setLoading(true);
                const [productData, statsData] = await Promise.all([
                    fetchProductDetails(id),
                    fetchProductStats(id).catch((error) => {
                        console.error('Error fetching product stats:', error);
                        return null;
                    }),
                ]);
                setProduct(productData);
                setProductStats(statsData);
            } catch (error) {
                console.error('Error fetching product:', error);
                showErrorToast('Failed to load product details');
                navigate('/products');
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id, navigate]);

    React.useEffect(() => {
        if (product?.id != null && product?.title) {
            addProduct(product.id, product.title);
        }
    }, [product?.id, product?.title, addProduct]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!product) {
        return null;
    }

    const getStatusColor = (status: string) => {
        return status === 'ACTIVE' ? 'success' : 'default';
    };

    const getAvailabilityColor = (status: string) => {
        return status === 'INSTOCK' ? 'success' : 'error';
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleOverviewTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setOverviewTabValue(newValue);
    };

    const imageUrl = getDefaultImage(product);

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
                        Product Details
                    </Typography>
                    {id && (
                        <Tooltip title="Copy product ID">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    if (id) {
                                        navigator.clipboard.writeText(id);
                                        showSuccessToast('Product ID copied');
                                    }
                                }}
                                sx={{ color: 'text.secondary' }}
                            >
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<FileCopyIcon />}
                        onClick={() => navigate('/products/new', { state: { cloneFromProductId: product.id } })}
                        sx={{ textTransform: 'none' }}
                    >
                        Clone
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/products/edit/${id}`)}
                        sx={{ textTransform: 'none' }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DeleteIcon />}
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
                                        {productStats?.total_orders ?? 0}
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
                                    <TrendingUpIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Units Sold
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        {productStats?.units_sold ?? 0}
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
                                    <InventoryIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Revenue Generated
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                                        ₹{productStats?.revenue_generated ? (productStats.revenue_generated / 1000000).toFixed(1) + 'M' : '0'}
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
                                    <WarehouseIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Current Stock
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                        {productStats?.current_stock?.toLocaleString() ?? product.quantity?.toLocaleString() ?? 0}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="Media" />
                            <Tab label="Variants" />
                            <Tab label="Audit" />
                            <Tab label="Combo Discounts" />
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                    {product.title}
                                </Typography>

                                {/* Image Section */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                    {imageUrl ? (
                                        <Box
                                            component="img"
                                            src={imageUrl}
                                            alt={product.title}
                                            sx={{
                                                width: '100%',
                                                maxWidth: 400,
                                                height: 'auto',
                                                borderRadius: 2,
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <Avatar
                                            sx={{
                                                width: 200,
                                                height: 200,
                                                bgcolor: '#e0e0e0',
                                                fontSize: '3rem',
                                            }}
                                        >
                                            {product.title.charAt(0).toUpperCase()}
                                        </Avatar>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                    <Chip
                                        label={product.status}
                                        color={getStatusColor(product.status)}
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            {/* Nested Tabs within Overview */}
                            <Tabs value={overviewTabValue} onChange={handleOverviewTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                <Tab label="Basic Information" />
                                <Tab label="Details" />
                                <Tab label="Metadata" />
                            </Tabs>

                            {/* Basic Information Tab */}
                            <TabPanel value={overviewTabValue} index={0}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Product ID
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            #{product.id}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Status
                                        </Typography>
                                        <Chip
                                            label={product.status}
                                            color={getStatusColor(product.status)}
                                            size="small"
                                        />
                                    </Grid>
                                    {product.category && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                Category
                                            </Typography>
                                            <Button
                                                variant="text"
                                                onClick={() => navigate(`/category/detail/${product.category?.id}`)}
                                                sx={{ textTransform: 'none', p: 0, justifyContent: 'flex-start' }}
                                            >
                                                {product.category?.title || 'N/A'}
                                            </Button>
                                        </Grid>
                                    )}
                                    {product.subCategory && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                Sub Category
                                            </Typography>
                                            <Button
                                                variant="text"
                                                onClick={() => navigate(`/sub-category/detail/${product.subCategory?.id}`)}
                                                sx={{ textTransform: 'none', p: 0, justifyContent: 'flex-start' }}
                                            >
                                                {product.subCategory?.title || 'N/A'}
                                            </Button>
                                        </Grid>
                                    )}
                                    {product.brand && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                Brand
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {product.brand.logo && (
                                                    <Avatar
                                                        src={product.brand.logo}
                                                        alt={product.brand.name}
                                                        sx={{ width: 24, height: 24 }}
                                                    />
                                                )}
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {product.brand.name}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                    {product.productType && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                Product Type
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {product.productType.title}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </TabPanel>

                            {/* Details Tab */}
                            <TabPanel value={overviewTabValue} index={1}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                        Product Summary
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                                        {product.variants && product.variants.length > 0
                                            ? `This product has ${product.variants.length} variant${product.variants.length !== 1 ? 's' : ''}. View the Variants tab for pricing, stock, and expiry details.`
                                            : 'No variants configured. Use Edit to add variants.'}
                                    </Typography>
                                    {product.variants && product.variants.length > 0 && (
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Total quantity across variants: {product.variants.reduce((acc, v) => acc + (v.quantity || 0), 0).toLocaleString()}
                                        </Typography>
                                    )}
                                </Box>
                            </TabPanel>

                            {/* Metadata Tab */}
                            <TabPanel value={overviewTabValue} index={2}>
                                <Grid container spacing={2}>
                                    {(product.created_at || product.createdAt) && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                Created At
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {format(new Date(product.created_at || product.createdAt || ''), 'MMM dd, yyyy HH:mm')}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {(product.updated_at || product.updatedAt) && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                Updated At
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {format(new Date(product.updated_at || product.updatedAt || ''), 'MMM dd, yyyy HH:mm')}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </TabPanel>
                        </TabPanel>

                        {/* Media Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Product Media
                            </Typography>
                            {product.images && product.images.length > 0 ? (
                                <Grid container spacing={2}>
                                    {product.images
                                        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                                        .map((image) => (
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={image.id}>
                                                <Box sx={{ position: 'relative' }}>
                                                    <Box
                                                        component="img"
                                                        src={image.image_url}
                                                        alt={`${product.title} - Image ${image.display_order || image.id}`}
                                                        sx={{
                                                            width: '100%',
                                                            height: 200,
                                                            objectFit: 'cover',
                                                            borderRadius: 2,
                                                            border: '1px solid #e0e0e0',
                                                        }}
                                                    />
                                                    {image.is_default && (
                                                        <Chip
                                                            label="Default"
                                                            color="primary"
                                                            size="small"
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 8,
                                                                right: 8,
                                                            }}
                                                        />
                                                    )}
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            Display Order: {image.display_order ?? 'N/A'}
                                                        </Typography>
                                                        {image.variant_id && (
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                                Variant ID: {image.variant_id}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                </Grid>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    No images available
                                </Typography>
                            )}
                        </TabPanel>

                        {/* Variants Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Product Variants
                            </Typography>
                            {product.variants && product.variants.length > 0 ? (
                                (() => {
                                    const variantColumns: Column<ProductVariant>[] = [
                                        {
                                            id: 'variant_name',
                                            label: 'Variant Name',
                                            render: (row: ProductVariant) => (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {row.variant_name || 'Default'}
                                                </Typography>
                                            ),
                                        },
                                        {
                                            id: 'price',
                                            label: 'Base Price',
                                            align: 'right',
                                            format: (value: number) => `₹${value?.toLocaleString() || '0.00'}`,
                                        },
                                        {
                                            id: 'selling_price',
                                            label: 'Selling Price',
                                            align: 'right',
                                            render: (row: ProductVariant) => (
                                                <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                                                    ₹{row.selling_price?.toLocaleString() || '0.00'}
                                                </Typography>
                                            ),
                                        },
                                        {
                                            id: 'quantity',
                                            label: 'Quantity',
                                            align: 'right',
                                            format: (value: number) => value?.toLocaleString() || '0',
                                        },
                                        {
                                            id: 'units',
                                            label: 'Units',
                                            format: (value: string | null) => value || 'N/A',
                                        },
                                        {
                                            id: 'items_per_unit',
                                            label: 'Items/Unit',
                                            align: 'right',
                                            format: (value: number | null) => value?.toString() || '-',
                                        },
                                        {
                                            id: 'status',
                                            label: 'Status',
                                            render: (row: ProductVariant) => (
                                                <Box>
                                                    <Chip
                                                        label={row.status || 'N/A'}
                                                        color={getStatusColor(row.status || 'ACTIVE')}
                                                        size="small"
                                                    />
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Chip
                                                            label={row.product_status || 'N/A'}
                                                            color={getAvailabilityColor(row.product_status || 'INSTOCK')}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                </Box>
                                            ),
                                        },
                                        {
                                            id: 'expiry_date',
                                            label: 'Expiry Date',
                                            render: (row: ProductVariant) =>
                                                row.expiry_date ? (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: getExpiryDateColor(row.expiry_date) }}
                                                    >
                                                        {formatExpiryDate(row.expiry_date)}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        No expiry
                                                    </Typography>
                                                ),
                                        },
                                    ];

                                    const variantTableState: TableState<ProductVariant> = {
                                        data: product.variants,
                                        total: product.variants.length,
                                        page: 0,
                                        rowsPerPage: 10,
                                        order: 'asc',
                                        orderBy: 'variant_name',
                                        loading: false,
                                        search: '',
                                    };

                                    const variantHandlers = {
                                        handleRequestSort: () => {},
                                        handleChangePage: () => {},
                                        handleChangeRowsPerPage: () => {},
                                    };

                                    return (
                                        <DataTable<ProductVariant>
                                            columns={variantColumns}
                                            state={variantTableState}
                                            handlers={variantHandlers}
                                        />
                                    );
                                })()
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    No variants available
                                </Typography>
                            )}
                        </TabPanel>

                        {/* Audit Tab */}
                        <TabPanel value={tabValue} index={3}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                Inventory Movements
                            </Typography>
                            {(() => {
                                const columns: Column<InventoryMovement>[] = [
                                    {
                                        id: 'createdAt',
                                        label: 'Date',
                                        minWidth: 150,
                                        format: (value: string) => format(new Date(value), 'MMM dd, yyyy HH:mm'),
                                    },
                                    {
                                        id: 'movementType',
                                        label: 'Type',
                                        minWidth: 120,
                                        render: (row: InventoryMovement) => (
                                            <Chip
                                                label={row.movementType}
                                                size="small"
                                                color={
                                                    row.movementType === 'REMOVED' ? 'error' :
                                                    row.movementType === 'ADDED' ? 'success' :
                                                    row.movementType === 'REVERTED' ? 'warning' : 'default'
                                                }
                                            />
                                        ),
                                    },
                                    {
                                        id: 'quantityChange',
                                        label: 'Change',
                                        minWidth: 100,
                                        align: 'right',
                                        render: (row: InventoryMovement) => (
                                            <Typography
                                                sx={{
                                                    color: row.quantityChange >= 0 ? 'success.main' : 'error.main',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {row.quantityChange >= 0 ? '+' : ''}{row.quantityChange}
                                            </Typography>
                                        ),
                                    },
                                    {
                                        id: 'quantityBefore',
                                        label: 'Before',
                                        minWidth: 100,
                                        align: 'right',
                                    },
                                    {
                                        id: 'quantityAfter',
                                        label: 'After',
                                        minWidth: 100,
                                        align: 'right',
                                        render: (row: InventoryMovement) => (
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {row.quantityAfter}
                                            </Typography>
                                        ),
                                    },
                                    {
                                        id: 'referenceType',
                                        label: 'Reference',
                                        minWidth: 120,
                                        render: (row: InventoryMovement) => (
                                            <Box>
                                                <Typography variant="body2">{row.referenceType}</Typography>
                                                {row.referenceId && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        ID: {row.referenceId}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ),
                                    },
                                    {
                                        id: 'notes',
                                        label: 'Notes',
                                        minWidth: 200,
                                        format: (value: string | null) => value || '-',
                                    },
                                    {
                                        id: 'user',
                                        label: 'User',
                                        minWidth: 150,
                                        format: (value: InventoryMovement['user']) => {
                                            if (!value) return 'N/A';
                                            return value.name || value.email || `User ${value.id}`;
                                        },
                                    },
                                ];

                                return (
                                    <DataTable<InventoryMovement>
                                        columns={columns}
                                        state={tableState}
                                        handlers={tableHandlers}
                                    />
                                );
                            })()}
                        </TabPanel>

                        {/* Combo Discounts Tab */}
                        <TabPanel value={tabValue} index={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <LocalOfferIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    Combo Discounts
                                </Typography>
                            </Box>
                            {(() => {
                                interface ComboDiscountRow {
                                    id: string | number;
                                    variantName: string;
                                    variantId: number;
                                    comboQuantity: number;
                                    discountType: string;
                                    discountValue: number;
                                    startDate: string;
                                    endDate: string;
                                    status: string;
                                }

                                const comboDiscountRows: ComboDiscountRow[] = [];

                                product.variants?.forEach((variant) => {
                                    const variantRecord = variant as unknown as Record<string, unknown>;
                                    const comboDiscounts = variant.combo_discounts || variantRecord.comboDiscounts || [];

                                    if (Array.isArray(comboDiscounts) && comboDiscounts.length > 0) {
                                        comboDiscounts.forEach((discount: Record<string, unknown>, discountIndex: number) => {
                                            const comboQuantity = (discount.combo_quantity ?? discount.comboQuantity) as number;
                                            const discountType = (discount.discount_type ?? discount.discountType) as string;
                                            const discountValue = (discount.discount_value ?? discount.discountValue) as number;
                                            const startDate = (discount.start_date ?? discount.startDate) as string;
                                            const endDate = (discount.end_date ?? discount.endDate) as string;
                                            const status = (discount.status || 'ACTIVE') as string;

                                            comboDiscountRows.push({
                                                id: `${variant.id}-${discountIndex}`,
                                                variantName: variant.variant_name || 'N/A',
                                                variantId: variant.id,
                                                comboQuantity,
                                                discountType,
                                                discountValue,
                                                startDate,
                                                endDate,
                                                status,
                                            });
                                        });
                                    }
                                });

                                if (comboDiscountRows.length === 0) {
                                    return (
                                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                                            No combo discounts available for this product
                                        </Typography>
                                    );
                                }

                                const columns: Column<ComboDiscountRow>[] = [
                                    {
                                        id: 'variantName',
                                        label: 'Variant Name',
                                        minWidth: 150,
                                        render: (row) => (
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {row.variantName}
                                            </Typography>
                                        ),
                                    },
                                    {
                                        id: 'comboQuantity',
                                        label: 'Combo Quantity',
                                        minWidth: 120,
                                        align: 'right',
                                        format: (value: number) => value.toString(),
                                    },
                                    {
                                        id: 'discountType',
                                        label: 'Discount Type',
                                        minWidth: 120,
                                        render: (row) => (
                                            <Chip
                                                label={row.discountType}
                                                size="small"
                                                color={row.discountType === 'PERCENT' ? 'primary' : 'secondary'}
                                                sx={{ fontWeight: 500 }}
                                            />
                                        ),
                                    },
                                    {
                                        id: 'discountValue',
                                        label: 'Discount Value',
                                        minWidth: 130,
                                        align: 'right',
                                        render: (row) => (
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                {row.discountType === 'PERCENT'
                                                    ? `${row.discountValue}%`
                                                    : `Offer #${row.discountValue}`}
                                            </Typography>
                                        ),
                                    },
                                    {
                                        id: 'startDate',
                                        label: 'Start Date',
                                        minWidth: 120,
                                        format: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
                                    },
                                    {
                                        id: 'endDate',
                                        label: 'End Date',
                                        minWidth: 120,
                                        format: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
                                    },
                                    {
                                        id: 'status',
                                        label: 'Status',
                                        minWidth: 100,
                                        render: (row) => (
                                            <Chip
                                                label={row.status}
                                                size="small"
                                                color={row.status === 'ACTIVE' ? 'success' : 'default'}
                                            />
                                        ),
                                    },
                                ];

                                const comboDiscountTableState: TableState<ComboDiscountRow> = {
                                    data: comboDiscountRows,
                                    total: comboDiscountRows.length,
                                    page: 0,
                                    rowsPerPage: 10,
                                    order: 'asc',
                                    orderBy: 'variantName',
                                    loading: false,
                                    search: '',
                                };

                                const comboDiscountHandlers = {
                                    handleRequestSort: () => {},
                                    handleChangePage: () => {},
                                    handleChangeRowsPerPage: () => {},
                                };

                                return (
                                    <DataTable<ComboDiscountRow>
                                        columns={columns}
                                        state={comboDiscountTableState}
                                        handlers={comboDiscountHandlers}
                                    />
                                );
                            })()}
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
