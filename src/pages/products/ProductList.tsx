
import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Avatar, Paper, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';
import { fetchProducts } from '../../services/product.service';
import type { Product, ProductVariant } from '../../types/product';
import type { ServerFilter } from '../../types/filter';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';

// Helper function to get default image from images array
const getDefaultImage = (product: Product): string | undefined => {
    if (product.images && product.images.length > 0) {
        const defaultImage = product.images.find(img => img.is_default);
        return defaultImage?.image_url || product.images[0]?.image_url;
    }
    return product.image;
};

// Helper function to get first variant
const getFirstVariant = (product: Product): ProductVariant | null => {
    if (product.variants && product.variants.length > 0) {
        return product.variants[0];
    }
    return null;
};

// Helper function to format variant item details
const formatVariantItemDetails = (variant: ProductVariant): string => {
    const parts: string[] = [];
    
    // Quantity (units)
    if (variant.quantity !== undefined && variant.quantity !== null) {
        parts.push(`${variant.quantity} unit${variant.quantity !== 1 ? 's' : ''}`);
    }
    
    // Item quantity + unit
    if (variant.item_quantity !== undefined && variant.item_quantity !== null && variant.item_unit) {
        parts.push(`${variant.item_quantity} ${variant.item_unit}`);
    } else if (variant.item_quantity !== undefined && variant.item_quantity !== null) {
        parts.push(`${variant.item_quantity}`);
    } else if (variant.item_unit) {
        parts.push(variant.item_unit);
    }
    
    return parts.length > 0 ? parts.join(' × ') : 'N/A';
};

// Helper function to format item details (legacy support)
const formatItemDetails = (product: Product): string => {
    const firstVariant = getFirstVariant(product);
    if (firstVariant) {
        return formatVariantItemDetails(firstVariant);
    }
    
    // Fallback to legacy fields
    const parts: string[] = [];
    
    if (product.quantity !== undefined && product.quantity !== null) {
        parts.push(`${product.quantity} unit${product.quantity !== 1 ? 's' : ''}`);
    }
    
    if (product.itemsPerUnit !== undefined && product.itemsPerUnit !== null) {
        parts.push(`${product.itemsPerUnit} item${product.itemsPerUnit !== 1 ? 's' : ''}/unit`);
    }
    
    if (product.itemQuantity !== undefined && product.itemQuantity !== null && product.itemUnit) {
        parts.push(`${product.itemQuantity} ${product.itemUnit}`);
    } else if (product.itemQuantity !== undefined && product.itemQuantity !== null) {
        parts.push(`${product.itemQuantity}`);
    } else if (product.itemUnit) {
        parts.push(product.itemUnit);
    }
    
    return parts.length > 0 ? parts.join(' × ') : 'N/A';
};

// Helper function to format expiry date with color coding
const formatExpiryDate = (expiryDate: string | Date | undefined | null): { text: string; color: string } => {
    if (!expiryDate) {
        return { text: 'N/A', color: '#666' };
    }
    
    try {
        const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(date);
        expiry.setHours(0, 0, 0, 0);
        
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const formattedDate = format(date, 'MMM dd, yyyy');
        
        if (diffDays < 0) {
            return { text: formattedDate, color: '#d32f2f' }; // Red - expired
        } else if (diffDays <= 7) {
            return { text: formattedDate, color: '#ed6c02' }; // Orange - expiring soon
        } else {
            return { text: formattedDate, color: '#2e7d32' }; // Green - valid
        }
    } catch {
        return { text: 'Invalid Date', color: '#666' };
    }
};

// Helper component for Variants Popover
const VariantsPopover: React.FC<{ product: Product }> = ({ product }) => {
    if (!product.variants || product.variants.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">No variants available</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: 800, maxHeight: 600, overflow: 'auto', p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                Variants for {product.title}
            </Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Variant Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">MRP</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Selling Price</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Item Details</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Expiry Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {product.variants.map((variant) => {
                            const { text: expiryText, color: expiryColor } = formatExpiryDate(variant.expiry_date);
                            return (
                                <TableRow key={variant.id} hover>
                                    <TableCell>{variant.variant_name}</TableCell>
                                    <TableCell align="right">₹{variant.price}</TableCell>
                                    <TableCell align="right">₹{variant.selling_price}</TableCell>
                                    <TableCell align="right">{variant.quantity}</TableCell>
                                    <TableCell>{formatVariantItemDetails(variant)}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: expiryColor, fontWeight: 500 }}>
                                            {expiryText}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={variant.product_status}
                                            size="small"
                                            color={variant.product_status === 'INSTOCK' ? 'success' : 'error'}
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default function ProductList() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    
    // Get vendorId and branchId from store
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;
    
    // Get date range from store, or use default
    const storeStartDate = useAppSelector((state) => state.dateRange.startDate);
    const storeEndDate = useAppSelector((state) => state.dateRange.endDate);
    
    // Variants popover state
    const [variantsAnchorEl, setVariantsAnchorEl] = React.useState<{ el: HTMLElement; product: Product } | null>(null);

    const columns = [
        {
            id: 'image' as keyof Product,
            label: 'Image',
            minWidth: 80,
            render: (row: Product) => {
                const imageUrl = getDefaultImage(row);
                return (
                    <Avatar
                        src={imageUrl}
                        alt={row.title}
                        variant="rounded"
                        sx={{ width: 50, height: 50 }}
                    />
                );
            }
        },
        { 
            id: 'title' as keyof Product, 
            label: 'Product Name', 
            minWidth: 150,
            render: (row: Product) => (
                <Typography
                    component="button"
                    onClick={() => navigate(`/products/detail/${row.id}`)}
                    sx={{
                        background: 'none',
                        border: 'none',
                        color: '#204564',
                        cursor: 'pointer',
                        textAlign: 'left',
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                >
                    {row.title}
                </Typography>
            )
        },
        { 
            id: 'category' as keyof Product, 
            label: 'Category', 
            minWidth: 120,
            render: (row: Product) => row.category?.title || 'N/A'
        },
        { 
            id: 'subCategory' as keyof Product, 
            label: 'Sub Category', 
            minWidth: 120,
            render: (row: Product) => row.subCategory?.title || 'N/A'
        },
        { 
            id: 'brand' as keyof Product, 
            label: 'Brand', 
            minWidth: 120,
            render: (row: Product) => row.brand?.name || 'N/A'
        },
        { 
            id: 'quantity' as keyof Product, 
            label: 'Quantity', 
            minWidth: 80,
            render: (row: Product) => {
                const firstVariant = getFirstVariant(row);
                const quantity = firstVariant?.quantity ?? row.quantity;
                return quantity !== undefined && quantity !== null ? quantity : 'N/A';
            }
        },
        { 
            id: 'itemDetails' as keyof Product, 
            label: 'Item Details', 
            minWidth: 120,
            render: (row: Product) => (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatItemDetails(row)}
                </Typography>
            )
        },
        { 
            id: 'product_status' as keyof Product, 
            label: 'Status', 
            minWidth: 100,
            render: (row: Product) => {
                const firstVariant = getFirstVariant(row);
                const status = firstVariant?.product_status ?? row.product_status;
                if (!status) return 'N/A';
                return (
                    <Chip
                        label={status}
                        size="small"
                        color={status === 'INSTOCK' ? 'success' : 'error'}
                        sx={{ fontWeight: 500 }}
                    />
                );
            }
        },
        {
            id: 'variants' as keyof Product,
            label: 'Variants',
            minWidth: 100,
            align: 'center' as const,
            render: (row: Product) => {
                const variantCount = row.variants?.length || 0;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Chip
                            label={`${variantCount} variant${variantCount !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{ fontWeight: 500 }}
                        />
                        <IconButton
                            size="small"
                            onClick={(e) => setVariantsAnchorEl({ el: e.currentTarget, product: row })}
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                color: 'primary.main',
                                '&:hover': { bgcolor: '#e3f2fd', borderColor: 'primary.main' }
                            }}
                        >
                            <InfoIcon fontSize="small" />
                        </IconButton>
                    </Box>
                );
            }
        },
        {
            id: 'createdAt' as keyof Product,
            label: 'Created Date',
            minWidth: 120,
            render: (row: Product) => {
                const createdDate = row.created_at ?? row.createdAt;
                return createdDate ? format(new Date(createdDate), 'MMM dd, yyyy') : 'N/A';
            }
        },
        {
            id: 'action' as keyof Product,
            label: 'Action',
            minWidth: 100,
            align: 'center' as const,
            render: (row: Product) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/products/detail/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2' }
                        }}
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/products/edit/${row.id}`, { state: { product: row } })}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.main' }
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'error.main',
                            bgcolor: '#ffebee',
                            '&:hover': { bgcolor: '#ffcdd2', borderColor: 'error.main' }
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            )
        },
    ];
    
    const [dateRange, setDateRange] = React.useState(() => {
        if (storeStartDate && storeEndDate) {
            return [{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection'
            }];
        }
        return getLastNDaysRangeForDatePicker(30);
    });
    const [dateAnchorEl, setDateAnchorEl] = React.useState<null | HTMLElement>(null);
    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const [advancedFilters, setAdvancedFilters] = React.useState({
        productName: '',
        category: '',
    });

    // Helper function to build filters array with date range and default filters
    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters,
            filterMappings: {
                productName: { field: 'title', operator: 'iLike' },
                category: { field: 'category.title', operator: 'iLike' },
            },
        });
        
        // Merge with default filters (vendorId and branchId)
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, advancedFilters, vendorId, selectedBranchId]);

    // Use server pagination hook - now includes tableState and tableHandlers
    const {
        paginationModel,
        setPaginationModel,
        setFilters,
        tableState,
        tableHandlers,
    } = useServerPagination<Product>({
        fetchFunction: fetchProducts,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: buildFilters(),
        initialSorting: [
            {
                key: 'created_at',
                direction: 'DESC',
            },
        ],
        searchDebounceMs: 500,
    });

    // Sync local date range with store when store dates change
    React.useEffect(() => {
        if (storeStartDate && storeEndDate) {
            setDateRange([{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection'
            }]);
        }
    }, [storeStartDate, storeEndDate]);

    // Update filters when advanced filters or date range changes
    React.useEffect(() => {
        setFilters(buildFilters());
        // Reset to first page when filters change
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [advancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

    const handleApplyFilters = () => {
        setFilterAnchorEl(null);
        tableHandlers.refresh();
    };

    const handleClearFilters = () => {
        setAdvancedFilters({ productName: '', category: '' });
        tableHandlers.refresh();
    };

    const handleDateSelect = (ranges: RangeKeyDict) => {
        if (ranges.selection && ranges.selection.startDate && ranges.selection.endDate) {
            const newDateRange = [{
                startDate: ranges.selection.startDate,
                endDate: ranges.selection.endDate,
                key: ranges.selection.key || 'selection'
            }];
            setDateRange(newDateRange);
            
            // Save to store
            dispatch(setDateRangeAction({
                startDate: ranges.selection.startDate,
                endDate: ranges.selection.endDate,
            }));
        }
    };

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Products
                </Typography>
                <Link to="/products/new" style={{ textDecoration: 'none' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                            textTransform: 'none',
                            px: 3,
                            borderRadius: 2,
                            boxShadow: 2,
                        }}
                    >
                        Add Product
                    </Button>
                </Link>
            </Box>

            {/* Unified Container for Search, Filters and Table */}
            <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 1,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden'
            }}>
                {/* Search and Filter Section */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    gap: 2,
                    p: 2.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                }}>
                    <TextField
                        id="products-search"
                        placeholder="Search products..."
                        variant="outlined"
                        size="small"
                        value={tableState.search}
                        onChange={tableHandlers.handleSearch}
                        sx={{
                            flex: 1,
                            minWidth: 280,
                            maxWidth: 400,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'background.default',
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<CalendarTodayIcon />}
                            onClick={(e) => setDateAnchorEl(e.currentTarget)}
                            sx={{ 
                                borderRadius: 2, 
                                textTransform: 'none', 
                                borderColor: 'divider', 
                                color: 'text.secondary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            {format(dateRange[0].startDate || new Date(), 'MMM dd')} - {format(dateRange[0].endDate || new Date(), 'MMM dd')}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<FilterListIcon />}
                            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                            sx={{ 
                                borderRadius: 2, 
                                textTransform: 'none', 
                                borderColor: 'divider', 
                                color: 'text.secondary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            Advanced Search
                        </Button>
                    </Box>
                </Box>

            <Popover
                open={Boolean(dateAnchorEl)}
                anchorEl={dateAnchorEl}
                onClose={() => setDateAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Box sx={{ p: 1 }}>
                    <DateRangePicker
                        ranges={dateRange}
                        onChange={handleDateSelect}
                        moveRangeOnFirstSelection={false}
                    />
                </Box>
            </Popover>

            <Popover
                open={Boolean(filterAnchorEl)}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ p: 3, width: 300 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Products</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="Product Name"
                        value={advancedFilters.productName}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, productName: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Category"
                        value={advancedFilters.category}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, category: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                        <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                    </Box>
                </Box>
            </Popover>

            <Popover
                open={Boolean(variantsAnchorEl)}
                anchorEl={variantsAnchorEl?.el}
                onClose={() => setVariantsAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{
                    sx: {
                        maxHeight: '80vh',
                        overflow: 'auto',
                    }
                }}
            >
                {variantsAnchorEl && <VariantsPopover product={variantsAnchorEl.product} />}
            </Popover>

                {/* Data Table Section */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <DataTable 
                        key={`product-table-${paginationModel.page}-${paginationModel.pageSize}`}
                        columns={columns} 
                        state={tableState} 
                        handlers={tableHandlers} 
                    />
                </Box>
            </Box>
        </Paper>
    );
}
