/* eslint-disable @typescript-eslint/no-unused-vars */

import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Avatar, Paper, Chip, Select, MenuItem, FormControl, InputLabel, Autocomplete, CircularProgress, Tooltip } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/EditOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InventoryIcon from '@mui/icons-material/Inventory';
import InfoIcon from '@mui/icons-material/Info';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import RowActionsMenu from '../../components/RowActionsMenu';
import type { RowActionItem } from '../../components/RowActionsMenu';
import DateRangePopover from '../../components/DateRangePopover';
import type { DateRangeSelection } from '../../components/DateRangePopover';
import { useServerPagination } from '../../hooks/useServerPagination';
import { fetchProducts, updateProduct, type FetchParams } from '../../services/product.service';
import { fetchCategories } from '../../services/category.service';
import { fetchSubCategories } from '../../services/sub-category.service';
import { getProductTypes } from '../../services/product-type.service';
import { fetchBrands } from '../../services/brand.service';
import type { Product, ProductVariant } from '../../types/product';
import type { Category } from '../../types/category';
import type { SubCategory } from '../../types/sub-category';
import type { ProductType } from '../../types/product-type';
import type { Brand } from '../../types/brand';
import type { ServerFilter } from '../../types/filter';
import type { Column, TableState } from '../../types/table';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';
import { PRODUCT_STATUS_OPTIONS, PRODUCT_STOCK_STATUS_OPTIONS } from '../../constants/statusOptions';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import StockUpdateDialog from './StockUpdateDialog';

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

    // Define columns for variants table
    const variantColumns: Column<ProductVariant>[] = [
        {
            id: 'variant_name',
            label: 'Variant Name',
            minWidth: 120,
        },
        {
            id: 'price',
            label: 'MRP',
            minWidth: 100,
            align: 'right',
            format: (value: number) => `₹${value}`,
        },
        {
            id: 'selling_price',
            label: 'Selling Price',
            minWidth: 120,
            align: 'right',
            format: (value: number) => `₹${value}`,
        },
        {
            id: 'quantity',
            label: 'Quantity',
            minWidth: 100,
            align: 'right',
        },
        {
            id: 'item_quantity' as keyof ProductVariant,
            label: 'Item Details',
            minWidth: 150,
            render: (row: ProductVariant) => formatVariantItemDetails(row),
        },
        {
            id: 'expiry_date' as keyof ProductVariant,
            label: 'Expiry Date',
            minWidth: 120,
            render: (row: ProductVariant) => {
                const { text: expiryText, color: expiryColor } = formatExpiryDate(row.expiry_date);
                return (
                    <Typography variant="body2" sx={{ color: expiryColor, fontWeight: 500 }}>
                        {expiryText}
                    </Typography>
                );
            },
        },
        {
            id: 'product_status' as keyof ProductVariant,
            label: 'Status',
            minWidth: 100,
            render: (row: ProductVariant) => (
                <Chip
                    label={row.product_status}
                    size="small"
                    color={row.product_status === 'INSTOCK' ? 'success' : 'error'}
                    sx={{ fontWeight: 500 }}
                />
            ),
        },
    ];

    // Create static table state (no pagination needed for popover)
    const variantTableState: TableState<ProductVariant> = {
        data: product.variants,
        total: product.variants.length,
        page: 0,
        rowsPerPage: product.variants.length, // Show all variants
        order: 'asc',
        orderBy: 'variant_name',
        loading: false,
        search: '',
    };

    // Create handlers (no-ops since we're showing all variants without pagination/sorting)
    const variantHandlers = {
        handleRequestSort: () => {
            // No-op: sorting not needed for popover
        },
        handleChangePage: () => {
            // No-op: pagination not needed for popover
        },
        handleChangeRowsPerPage: () => {
            // No-op: pagination not needed for popover
        },
    };

    return (
        <Box sx={{ width: 900, maxHeight: '80vh', overflow: 'auto', p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                Variants for {product.title}
            </Typography>
            <DataTable
                columns={variantColumns}
                state={variantTableState}
                handlers={variantHandlers}
                hidePagination={true}
            />
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
    // Stock update dialog
    const [stockUpdateProduct, setStockUpdateProduct] = React.useState<Product | null>(null);

    const [updatingProductId, setUpdatingProductId] = React.useState<number | null>(null);
    const refreshTableRef = React.useRef<() => void>(() => {});

    const handleToggleStatus = React.useCallback(async (row: Product) => {
        const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const concurrencyStamp = row.concurrencyStamp ?? row.concurrency_stamp ?? '';
        if (!concurrencyStamp) {
            showErrorToast('Cannot toggle: missing concurrency stamp.');
            return;
        }
        const userId = user?.id;
        if (userId == null) {
            showErrorToast('User not found.');
            return;
        }
        setUpdatingProductId(row.id);
        try {
            await updateProduct(row.id, {
                updatedBy: userId,
                concurrencyStamp,
                status: newStatus,
            });
            showSuccessToast(`Product set to ${newStatus}.`);
            refreshTableRef.current();
        } catch {
            showErrorToast('Failed to update product status.');
        } finally {
            setUpdatingProductId(null);
        }
    }, [user?.id]);

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
            id: 'productType' as keyof Product, 
            label: 'Product Type', 
            minWidth: 120,
            render: (row: Product) => row.productType?.title ?? 'N/A'
        },
        { 
            id: 'quantity' as keyof Product, 
            label: 'Quantity', 
            minWidth: 80,
            render: (row: Product) => {
                return row.variants.reduce((acc, variant) => acc + variant.quantity, 0);
            }
        },
        { 
            id: 'product_status' as keyof Product, 
            label: 'Status', 
            minWidth: 140,
            render: (row: Product) => {
                const firstVariant = getFirstVariant(row);
                const activeStatus = row.status ?? 'N/A';
                const stockStatus = firstVariant?.product_status ?? row.product_status ?? 'N/A';
                const label = [activeStatus, stockStatus].filter(Boolean).join(' - ');
                if (!label || label === 'N/A') return 'N/A';
                const stockColor = stockStatus === 'INSTOCK' ? 'success' : stockStatus === 'OUTOFSTOCK' ? 'error' : 'default';
                return (
                    <Chip
                        label={label}
                        size="small"
                        color={stockColor}
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
            minWidth: 80,
            align: 'center' as const,
            render: (row: Product) => (
                <RowActionsMenu<Product>
                    row={row}
                    ariaLabel="Product actions"
                    items={(r): RowActionItem<Product>[] => [
                        { type: 'item', label: 'View', icon: <VisibilityIcon fontSize="small" />, onClick: () => navigate(`/products/detail/${r.id}`) },
                        { type: 'item', label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: () => navigate(`/products/edit/${r.id}`, { state: { product: r } }) },
                        { type: 'item', label: 'Stock Update', icon: <InventoryIcon fontSize="small" />, onClick: () => setStockUpdateProduct(r) },
                        { type: 'item', label: 'Clone', icon: <ContentCopyIcon fontSize="small" />, onClick: () => navigate('/products/new', { state: { cloneFromProductId: r.id } }) },
                        { type: 'divider' },
                        { type: 'item', label: r.status === 'ACTIVE' ? 'Deactivate' : 'Activate', icon: r.status === 'ACTIVE' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />, onClick: () => handleToggleStatus(r), disabled: updatingProductId === r.id },
                    ]}
                />
            )
        },
    ];

    const [dateRange, setDateRange] = React.useState<DateRangeSelection>(() => {
        if (storeStartDate && storeEndDate) {
            return [{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection'
            }];
        }
        return getLastNDaysRangeForDatePicker(30);
    });
    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);

    type AdvancedFiltersState = {
        productName: string;
        categoryIds: number[];
        subCategoryIds: number[];
        productTypeIds: number[];
        brandIds: number[];
        status: string;
        product_status: string;
    };
    const emptyAdvancedFilters: AdvancedFiltersState = {
        productName: '',
        categoryIds: [],
        subCategoryIds: [],
        productTypeIds: [],
        brandIds: [],
        status: '',
        product_status: '',
    };

    const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);
    const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);
    const [hasComboActive, setHasComboActive] = React.useState(false);
    const hasComboActiveRef = React.useRef(hasComboActive);
    React.useEffect(() => {
        hasComboActiveRef.current = hasComboActive;
    }, [hasComboActive]);

    // Options for advanced search autocompletes (fetched via API)
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [subCategories, setSubCategories] = React.useState<SubCategory[]>([]);
    const [productTypes, setProductTypes] = React.useState<ProductType[]>([]);
    const [brands, setBrands] = React.useState<Brand[]>([]);
    const [loadingCategories, setLoadingCategories] = React.useState(false);
    const [loadingSubCategories, setLoadingSubCategories] = React.useState(false);
    const [loadingProductTypes, setLoadingProductTypes] = React.useState(false);
    const [loadingBrands, setLoadingBrands] = React.useState(false);

    // Cache: only fetch filter options on first dialog open, not every time
    const filterOptionsLoadedRef = React.useRef(false);

    // Fetch category, sub-category, product type, and brand options (once on first open, then cached)
    React.useEffect(() => {
        if (!filterAnchorEl || filterOptionsLoadedRef.current) return;
        let cancelled = false;
        const loadOptions = async () => {
            setLoadingCategories(true);
            setLoadingSubCategories(true);
            setLoadingProductTypes(true);
            setLoadingBrands(true);
            try {
                const [catRes, subRes, ptRes, brandRes] = await Promise.all([
                    fetchCategories({ page: 0, pageSize: 500, filters: mergeWithDefaultFilters([], vendorId, selectedBranchId) }),
                    fetchSubCategories({ page: 0, pageSize: 500, filters: mergeWithDefaultFilters([], vendorId, selectedBranchId) }),
                    getProductTypes({ page: 0, pageSize: 500, filters: [] }),
                    fetchBrands({ page: 0, pageSize: 500, filters: mergeWithDefaultFilters([], vendorId, selectedBranchId) }),
                ]);
                if (!cancelled) {
                    setCategories(catRes.list || []);
                    setSubCategories(subRes.list || []);
                    setProductTypes(ptRes.list || []);
                    setBrands(brandRes.list || []);
                    filterOptionsLoadedRef.current = true; // cache after successful load
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Error loading filter options:', err);
                    // ref stays false so next open will retry
                }
            } finally {
                if (!cancelled) {
                    setLoadingCategories(false);
                    setLoadingSubCategories(false);
                    setLoadingProductTypes(false);
                    setLoadingBrands(false);
                }
            }
        };
        loadOptions();
        return () => { cancelled = true; };
    }, [filterAnchorEl, vendorId, selectedBranchId]);

    // Helper function to build filters array (uses applied filters; API is called on Apply)
    const buildFilters = React.useCallback((): ServerFilter[] => {
        const applied = appliedAdvancedFilters;
        const advancedFiltersForBuild: Record<string, string | number | number[] | undefined> = {
            productName: applied.productName || undefined,
            status: applied.status || undefined,
            product_status: applied.product_status || undefined,
            categoryIds: applied.categoryIds?.length ? applied.categoryIds : undefined,
            subCategoryIds: applied.subCategoryIds?.length ? applied.subCategoryIds : undefined,
            productTypeIds: applied.productTypeIds?.length ? applied.productTypeIds : undefined,
            brandIds: applied.brandIds?.length ? applied.brandIds : undefined,
        };
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: advancedFiltersForBuild,
            filterMappings: {
                productName: { field: 'title', operator: 'iLike' },
                categoryIds: { field: 'categoryId', operator: 'in' },
                subCategoryIds: { field: 'subCategoryId', operator: 'in' },
                productTypeIds: { field: 'productTypeId', operator: 'in' },
                brandIds: { field: 'brandId', operator: 'in' },
                status: { field: 'status', operator: 'eq' },
                product_status: { field: 'product_status', operator: 'eq' },
            },
        });
        
        // Merge with default filters (vendorId and branchId)
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, appliedAdvancedFilters, vendorId, selectedBranchId]);

    // Wrap fetchProducts to pass hasActiveComboDiscounts when "Has Combo" chip is active (not part of filters).
    // Use ref so Clear button's refetch sees updated value immediately (avoids stale closure).
    const fetchProductsWithCombo = React.useCallback((params: FetchParams) => {
        return fetchProducts({
            ...params,
            hasActiveComboDiscounts: hasComboActiveRef.current ? true : undefined,
        });
    }, []);

    // Use server pagination hook - now includes tableState and tableHandlers
    const {
        paginationModel,
        setPaginationModel,
        setFilters,
        fetchData,
        tableState,
        tableHandlers,
    } = useServerPagination<Product>({
        fetchFunction: fetchProductsWithCombo,
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

    refreshTableRef.current = tableHandlers.refresh;

    // Refetch when "Has Combo" chip is toggled (request body changes)
    const hasComboTouchedRef = React.useRef(false);
    React.useEffect(() => {
        if (!hasComboTouchedRef.current) {
            hasComboTouchedRef.current = true;
            return;
        }
        tableHandlers.refresh();
    }, [hasComboActive]);

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

    // Update filters when applied filters or date range change (not on every form change; Apply triggers applied)
    React.useEffect(() => {
        setFilters(buildFilters());
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [appliedAdvancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

    // When opening the filter popover, sync form state to currently applied filters
    React.useEffect(() => {
        if (filterAnchorEl) {
            setAdvancedFilters(appliedAdvancedFilters);
        }
    }, [filterAnchorEl]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleApplyFilters = () => {
        const pending = advancedFilters;
        setAppliedAdvancedFilters(pending);
        const advancedFiltersForBuild: Record<string, string | number | number[] | undefined> = {
            productName: pending.productName || undefined,
            status: pending.status || undefined,
            product_status: pending.product_status || undefined,
            categoryIds: pending.categoryIds?.length ? pending.categoryIds : undefined,
            subCategoryIds: pending.subCategoryIds?.length ? pending.subCategoryIds : undefined,
            productTypeIds: pending.productTypeIds?.length ? pending.productTypeIds : undefined,
            brandIds: pending.brandIds?.length ? pending.brandIds : undefined,
        };
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: advancedFiltersForBuild,
            filterMappings: {
                productName: { field: 'title', operator: 'iLike' },
                categoryIds: { field: 'categoryId', operator: 'in' },
                subCategoryIds: { field: 'subCategoryId', operator: 'in' },
                productTypeIds: { field: 'productTypeId', operator: 'in' },
                brandIds: { field: 'brandId', operator: 'in' },
                status: { field: 'status', operator: 'eq' },
                product_status: { field: 'product_status', operator: 'eq' },
            },
        });
        const filtersToApply = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
        setFilters(filtersToApply);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        setFilterAnchorEl(null);
    };

    const handleClearFilters = () => {
        hasComboActiveRef.current = false;
        setHasComboActive(false);
        setAdvancedFilters(emptyAdvancedFilters);
        setAppliedAdvancedFilters(emptyAdvancedFilters);
        const emptyForBuild: Record<string, string | number[] | undefined> = {
            productName: undefined,
            status: undefined,
            product_status: undefined,
            categoryIds: undefined,
            subCategoryIds: undefined,
            productTypeIds: undefined,
            brandIds: undefined,
        };
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: emptyForBuild,
            filterMappings: {
                productName: { field: 'title', operator: 'iLike' },
                categoryIds: { field: 'categoryId', operator: 'in' },
                subCategoryIds: { field: 'subCategoryId', operator: 'in' },
                productTypeIds: { field: 'productTypeId', operator: 'in' },
                brandIds: { field: 'brandId', operator: 'in' },
                status: { field: 'status', operator: 'eq' },
                product_status: { field: 'product_status', operator: 'eq' },
            },
        });
        const filtersToApply = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
        setFilters(filtersToApply);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        setFilterAnchorEl(null);
        // Cleared filters match initial filters, so the hook's filters-effect skips the fetch.
        // Call fetchData with override filters so one API call runs immediately with cleared filters.
        fetchData({ force: true, initialFetch: true, filters: filtersToApply });
    };

    const handleDateRangeApply = (newRange: DateRangeSelection) => {
        setDateRange(newRange);
        const range = newRange?.[0];
        if (range) {
            dispatch(setDateRangeAction({ startDate: range.startDate, endDate: range.endDate }));
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
                        <DateRangePopover value={dateRange} onChange={handleDateRangeApply} />
                        <Tooltip title="Refresh table">
                            <IconButton
                                onClick={() => tableHandlers.refresh()}
                                size="small"
                                sx={{
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    color: 'text.secondary',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover', color: 'primary.main' },
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
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
                open={Boolean(filterAnchorEl)}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ p: 3, width: 340 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Products</Typography>
                    <Box sx={{ mb: 2 }}>
                        <Chip
                            label="Has Combo"
                            onClick={() => setHasComboActive((prev) => !prev)}
                            color={hasComboActive ? 'primary' : 'default'}
                            variant={hasComboActive ? 'filled' : 'outlined'}
                            size="small"
                            sx={{
                                fontWeight: 500,
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: hasComboActive ? 'primary.dark' : 'action.hover',
                                },
                            }}
                        />
                    </Box>
                    <TextField
                        fullWidth
                        size="small"
                        label="Product Name"
                        value={advancedFilters.productName}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, productName: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <Autocomplete
                        multiple
                        size="small"
                        options={categories}
                        getOptionLabel={(option) => (typeof option === 'object' && option?.title) ? option.title : ''}
                        value={categories.filter((c) => advancedFilters.categoryIds.includes(c.id))}
                        onChange={(_, newValue) => setAdvancedFilters({ ...advancedFilters, categoryIds: newValue.map((c) => c.id) })}
                        loading={loadingCategories}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Category"
                                placeholder={advancedFilters.categoryIds.length ? '' : 'Select categories'}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingCategories ? <CircularProgress size={20} color="inherit" /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        sx={{ mb: 2 }}
                    />
                    <Autocomplete
                        multiple
                        size="small"
                        options={subCategories}
                        getOptionLabel={(option) => (typeof option === 'object' && option?.title) ? option.title : ''}
                        value={subCategories.filter((s) => advancedFilters.subCategoryIds.includes(s.id))}
                        onChange={(_, newValue) => setAdvancedFilters({ ...advancedFilters, subCategoryIds: newValue.map((s) => s.id) })}
                        loading={loadingSubCategories}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Sub Category"
                                placeholder={advancedFilters.subCategoryIds.length ? '' : 'Select sub categories'}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingSubCategories ? <CircularProgress size={20} color="inherit" /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        sx={{ mb: 2 }}
                    />
                    <Autocomplete
                        multiple
                        size="small"
                        options={productTypes}
                        getOptionLabel={(option) => (typeof option === 'object' && option?.title) ? option.title : ''}
                        value={productTypes.filter((pt) => advancedFilters.productTypeIds.includes(pt.id))}
                        onChange={(_, newValue) => setAdvancedFilters({ ...advancedFilters, productTypeIds: newValue.map((pt) => pt.id) })}
                        loading={loadingProductTypes}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Product Type"
                                placeholder={advancedFilters.productTypeIds.length ? '' : 'Select product types'}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingProductTypes ? <CircularProgress size={20} color="inherit" /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        sx={{ mb: 2 }}
                    />
                    <Autocomplete
                        multiple
                        size="small"
                        options={brands}
                        getOptionLabel={(option) => (typeof option === 'object' && option?.name) ? option.name : ''}
                        value={brands.filter((b) => advancedFilters.brandIds.includes(b.id))}
                        onChange={(_, newValue) => setAdvancedFilters({ ...advancedFilters, brandIds: newValue.map((b) => b.id) })}
                        loading={loadingBrands}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Brand"
                                placeholder={advancedFilters.brandIds.length ? '' : 'Select brands'}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingBrands ? <CircularProgress size={20} color="inherit" /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={advancedFilters.status}
                            label="Status"
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
                        >
                            <MenuItem value="">All</MenuItem>
                            {PRODUCT_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Stock Status</InputLabel>
                        <Select
                            value={advancedFilters.product_status}
                            label="Stock Status"
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, product_status: e.target.value })}
                        >
                            <MenuItem value="">All</MenuItem>
                            {PRODUCT_STOCK_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
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

            <StockUpdateDialog
                open={Boolean(stockUpdateProduct)}
                onClose={() => setStockUpdateProduct(null)}
                onSuccess={() => refreshTableRef.current()}
                product={stockUpdateProduct}
            />

                {/* Data Table Section */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <DataTable 
                        key={`product-table-${paginationModel.page}-${paginationModel.pageSize}`}
                        columns={columns} 
                        state={tableState} 
                        handlers={tableHandlers}
                        emptyStateMessage="No products yet"
                        emptyStateActionLabel="Add Product"
                        emptyStateActionOnClick={() => navigate('/products/new')}
                    />
                </Box>
            </Box>
        </Paper>
    );
}
