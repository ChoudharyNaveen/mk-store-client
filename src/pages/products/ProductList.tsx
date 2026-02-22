/* eslint-disable @typescript-eslint/no-unused-vars */

import React from 'react';
import { Box, Typography, Button, TextField, Popover, IconButton, Chip, Select, MenuItem, FormControl, InputLabel, Autocomplete, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/EditOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InventoryIcon from '@mui/icons-material/Inventory';
import InfoIcon from '@mui/icons-material/Info';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import CollapsibleKPISection from '../../components/CollapsibleKPISection';
import RowActionsMenu from '../../components/RowActionsMenu';
import type { RowActionItem } from '../../components/RowActionsMenu';
import ListPageLayout from '../../components/ListPageLayout';
import { useServerPagination } from '../../hooks/useServerPagination';
import { useListPageDateRange } from '../../hooks/useListPageDateRange';
import { fetchProducts, fetchProductsSummary, updateProduct, type FetchParams } from '../../services/product.service';
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
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
import { exportToCSV } from '../../utils/exportCsv';
import { PRODUCT_STATUS_OPTIONS, PRODUCT_STOCK_STATUS_OPTIONS } from '../../constants/statusOptions';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import ImagePreviewAvatar from '../../components/ImagePreviewAvatar';
import StockUpdateDialog from './StockUpdateDialog';
import VariantsPopover from './VariantsPopover';

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

export default function ProductList() {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;

    const { dateRange, handleDateRangeApply: baseHandleDateRangeApply } = useListPageDateRange(30);

    // Variants popover state
    const [variantsAnchorEl, setVariantsAnchorEl] = React.useState<{ el: HTMLElement; product: Product } | null>(null);
    // Variants hover preview
    const [variantsPreviewAnchor, setVariantsPreviewAnchor] = React.useState<{ el: HTMLElement; product: Product } | null>(null);
    const variantsPreviewCloseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    // Stock update dialog
    const [stockUpdateProduct, setStockUpdateProduct] = React.useState<Product | null>(null);
    // Products summary KPIs
    const [productsSummary, setProductsSummary] = React.useState<{
        total_products: number;
        active_products: number;
        inactive_products: number;
        expired_variants: number;
        low_stock_variants: number;
    } | null>(null);
    const [summaryLoading, setSummaryLoading] = React.useState(false);

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
            render: (row: Product) => (
                <ImagePreviewAvatar
                    imageUrl={getDefaultImage(row)}
                    alt={row.title}
                    size={50}
                    onClick={() => navigate(`/products/detail/${row.id}`, { state: { productIds: tableState.data.map((p) => p.id) } })}
                />
            )
        },
        { 
            id: 'title' as keyof Product, 
            label: 'Product Name', 
            minWidth: 250,
            render: (row: Product) => (
                <Box
                    component="button"
                    onClick={() => navigate(`/products/detail/${row.id}`, { state: { productIds: tableState.data.map((p) => p.id) } })}
                    sx={{
                        width: '100%',
                        minWidth: 0,
                        maxHeight: '2.8em',
                        margin: 0,
                        padding: 0,
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'block',
                        overflow: 'hidden',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        color: '#204564',
                        fontSize: '14px',
                        lineHeight: 1.4,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    {row.title}
                </Box>
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
            minWidth: 120,
            align: 'center' as const,
            render: (row: Product) => {
                const variantCount = row.variants?.length || 0;
                const variants = row.variants || [];
                const previewLimit = 5;
                const hasMore = variantCount > previewLimit;
                return (
                    <Box
                        onMouseEnter={(e) => {
                            if (variantsPreviewCloseTimeoutRef.current) {
                                clearTimeout(variantsPreviewCloseTimeoutRef.current);
                                variantsPreviewCloseTimeoutRef.current = null;
                            }
                            if (variantCount > 0) setVariantsPreviewAnchor({ el: e.currentTarget, product: row });
                        }}
                        onMouseLeave={() => {
                            variantsPreviewCloseTimeoutRef.current = setTimeout(() => setVariantsPreviewAnchor(null), 150);
                        }}
                        onClick={(e) => { e.stopPropagation(); setVariantsAnchorEl({ el: e.currentTarget, product: row }); }}
                        sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Chip
                            label={variantCount > 0 ? `${variantCount} variant${variantCount !== 1 ? 's' : ''}` : '—'}
                            size="small"
                            sx={{
                                fontWeight: 500,
                                cursor: variantCount > 0 ? 'pointer' : 'default',
                                '&:hover': variantCount > 0 ? { bgcolor: 'primary.main', color: 'white' } : {},
                            }}
                        />
                        {variantCount > 0 && (
                            <Popover
                                open={variantsPreviewAnchor?.product?.id === row.id}
                                anchorEl={variantsPreviewAnchor?.el}
                                onClose={() => setVariantsPreviewAnchor(null)}
                                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                                disableRestoreFocus
                                slotProps={{ root: { sx: { pointerEvents: 'none' } } } as object}
                                PaperProps={{
                                    onMouseEnter: () => {
                                        if (variantsPreviewCloseTimeoutRef.current) {
                                            clearTimeout(variantsPreviewCloseTimeoutRef.current);
                                            variantsPreviewCloseTimeoutRef.current = null;
                                        }
                                    },
                                    onMouseLeave: () => setVariantsPreviewAnchor(null),
                                    sx: { pointerEvents: 'auto', minWidth: 260, maxWidth: 340, p: 2, borderRadius: 2, boxShadow: 3, ml: 0.5 },
                                }}
                            >
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                                        Variants
                                    </Typography>
                                    <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                                        {variants.slice(0, previewLimit).map((v) => (
                                            <Box
                                                key={v.id}
                                                component="li"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 1,
                                                    py: 0.75,
                                                    px: 1,
                                                    borderRadius: 1,
                                                    '&:hover': { bgcolor: 'action.hover' },
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {v.variant_name || 'Unnamed'}
                                                </Typography>
                                                <Typography variant="body2" color="primary" sx={{ fontWeight: 600, flexShrink: 0 }}>
                                                    ₹{v.selling_price?.toLocaleString() ?? v.price?.toLocaleString() ?? '—'}
                                                </Typography>
                                                <Chip
                                                    label={v.product_status === 'INSTOCK' ? 'In' : 'Out'}
                                                    size="small"
                                                    color={v.product_status === 'INSTOCK' ? 'success' : 'error'}
                                                    sx={{ height: 20, fontSize: '0.7rem', flexShrink: 0 }}
                                                />
                                            </Box>
                                        ))}
                                    </Box>
                                    {hasMore && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                            +{variantCount - previewLimit} more
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                        Click to see full details
                                    </Typography>
                                </Box>
                            </Popover>
                        )}
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
                        { type: 'item', label: 'View', icon: <VisibilityIcon fontSize="small" />, onClick: () => navigate(`/products/detail/${r.id}`, { state: { productIds: tableState.data.map((p) => p.id) } }) },
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

    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);

    type AdvancedFiltersState = {
        categoryIds: number[];
        subCategoryIds: number[];
        productTypeIds: number[];
        brandIds: number[];
        status: string;
        product_status: string;
    };
    const emptyAdvancedFilters: AdvancedFiltersState = {
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
    const [expiredProductsActive, setExpiredProductsActive] = React.useState(false);
    const [lowStockProductsActive, setLowStockProductsActive] = React.useState(false);
    const hasComboActiveRef = React.useRef(hasComboActive);
    const expiredProductsActiveRef = React.useRef(expiredProductsActive);
    const lowStockProductsActiveRef = React.useRef(lowStockProductsActive);
    hasComboActiveRef.current = hasComboActive;
    expiredProductsActiveRef.current = expiredProductsActive;
    lowStockProductsActiveRef.current = lowStockProductsActive;

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

    // When filter popover opens: sync form to applied filters and load options (once, then cached)
    React.useEffect(() => {
        if (!filterAnchorEl) return;
        setAdvancedFilters(appliedAdvancedFilters);
        if (filterOptionsLoadedRef.current) return;
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
                    filterOptionsLoadedRef.current = true;
                }
            } catch (err) {
                if (!cancelled) console.error('Error loading filter options:', err);
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
    }, [filterAnchorEl, vendorId, selectedBranchId, appliedAdvancedFilters]);

    // Helper function to build filters array (uses applied filters; API is called on Apply)
    const buildFilters = React.useCallback((): ServerFilter[] => {
        const applied = appliedAdvancedFilters;
        const advancedFiltersForBuild: Record<string, string | number | number[] | undefined> = {
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

    // Wrap fetchProducts to pass body-only params (not part of filters).
    const fetchProductsWithCombo = React.useCallback((params: FetchParams) => {
        return fetchProducts({
            ...params,
            hasActiveComboDiscounts: hasComboActiveRef.current ? true : undefined,
            expiredProducts: expiredProductsActiveRef.current ? true : undefined,
            lowStockProducts: lowStockProductsActiveRef.current ? true : undefined,
        });
    }, []);

    // Use server pagination hook (same pattern as SubCategoryList: autoFetch true, effect updates filters + reset page)
    const {
        paginationModel,
        setPaginationModel,
        setFilters,
        setSearchKeyword,
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

    // Fetch products summary (KPIs)
    const fetchSummary = React.useCallback(async () => {
        if (!vendorId || !selectedBranchId) return;
        setSummaryLoading(true);
        try {
            const summary = await fetchProductsSummary({
                branchId: selectedBranchId,
                vendorId,
            });
            setProductsSummary(summary);
        } catch {
            setProductsSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    }, [vendorId, selectedBranchId]);

    React.useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    refreshTableRef.current = () => {
        tableHandlers.refresh();
        fetchSummary();
    };

    // Update filters when applied filters or date range change
    React.useEffect(() => {
        setFilters(buildFilters());
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [appliedAdvancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

    // When body-only filter chips toggle, refresh to refetch with updated request body
    const bodyFiltersInitializedRef = React.useRef(false);
    React.useEffect(() => {
        if (!bodyFiltersInitializedRef.current) {
            bodyFiltersInitializedRef.current = true;
            return;
        }
        tableHandlers.refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasComboActive, expiredProductsActive, lowStockProductsActive]);

    React.useEffect(() => {
        if (filterAnchorEl) {
            setAdvancedFilters(appliedAdvancedFilters);
        }
    }, [filterAnchorEl]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleApplyFilters = () => {
        setAppliedAdvancedFilters(advancedFilters);
        setFilterAnchorEl(null);
    };

    const handleClearFilters = () => {
        hasComboActiveRef.current = false;
        expiredProductsActiveRef.current = false;
        lowStockProductsActiveRef.current = false;
        setHasComboActive(false);
        setExpiredProductsActive(false);
        setLowStockProductsActive(false);
        setSearchKeyword('');
        setAdvancedFilters(emptyAdvancedFilters);
        setAppliedAdvancedFilters(emptyAdvancedFilters);
        setFilterAnchorEl(null);
    };

    const handleDateRangeApply = (newRange: Parameters<typeof baseHandleDateRangeApply>[0]) => {
        baseHandleDateRangeApply(newRange);
        // Effect [appliedAdvancedFilters, dateRange, hasComboActive] will run (dateRange changed) → setFilters + setPaginationModel → hook fetches
    };

    const handleExport = () => {
        exportToCSV<Product>(
            tableState.data,
            [
                { id: 'title', label: 'Product Name' },
                { id: 'category', label: 'Category', getExportValue: (row) => row.category?.title || 'N/A' },
                { id: 'subCategory', label: 'Sub Category', getExportValue: (row) => row.subCategory?.title || 'N/A' },
                { id: 'brand', label: 'Brand', getExportValue: (row) => row.brand?.name || 'N/A' },
                { id: 'productType', label: 'Product Type', getExportValue: (row) => row.productType?.title ?? 'N/A' },
                { id: 'quantity', label: 'Quantity', getExportValue: (row) => row.variants?.reduce((acc, v) => acc + (v.quantity || 0), 0) ?? 0 },
                { id: 'status', label: 'Status' },
            ],
            `products-${format(new Date(), 'yyyy-MM-dd')}.csv`
        );
    };

    return (
        <ListPageLayout
            title="Products"
            addButton={{ to: '/products/new', label: 'Add Product' }}
            searchId="products-search"
            searchPlaceholder="Search products..."
            searchValue={tableState.search}
            onSearchChange={tableHandlers.handleSearch}
            onClearAndRefresh={handleClearFilters}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeApply}
            onRefresh={() => refreshTableRef.current()}
            filterAnchorEl={filterAnchorEl}
            onOpenFilterClick={(e) => setFilterAnchorEl(e.currentTarget)}
            onFilterClose={() => setFilterAnchorEl(null)}
            filterPopoverTitle="Filter Products"
            filterPopoverWidth={340}
            onExport={handleExport}
            contentBeforeToolbar={
                <CollapsibleKPISection
                    kpis={[
                        {
                            label: 'Total Products',
                            value: productsSummary != null ? productsSummary.total_products.toLocaleString() : '—',
                            icon: <InventoryIcon />,
                            iconBgColor: '#1976d2',
                            bgColor: '#e3f2fd',
                        },
                        {
                            label: 'Expired Variants',
                            value: productsSummary != null ? productsSummary.expired_variants.toLocaleString() : '—',
                            icon: <EventBusyIcon />,
                            iconBgColor: '#d32f2f',
                            bgColor: '#ffebee',
                            valueColor: '#d32f2f',
                        },
                        {
                            label: 'Low Stock Variants',
                            value: productsSummary != null ? productsSummary.low_stock_variants.toLocaleString() : '—',
                            icon: <WarningAmberIcon />,
                            iconBgColor: '#ed6c02',
                            bgColor: '#fff3e0',
                            valueColor: '#ed6c02',
                        },
                        {
                            label: 'Active / Inactive',
                            value: productsSummary != null ? `${productsSummary.active_products} / ${productsSummary.inactive_products}` : '—',
                            icon: <CompareArrowsIcon />,
                            iconBgColor: '#7b1fa2',
                            bgColor: '#f3e5f5',
                            valueColor: '#7b1fa2',
                        },
                    ]}
                    loading={summaryLoading}
                />
            }
            filterPopoverContent={
                <>
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label="Has Combo"
                            onClick={() => setHasComboActive((prev) => !prev)}
                            color={hasComboActive ? 'primary' : 'default'}
                            variant={hasComboActive ? 'filled' : 'outlined'}
                            size="small"
                            sx={{
                                fontWeight: 500,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: hasComboActive ? 'primary.dark' : 'action.hover' },
                            }}
                        />
                        <Chip
                            label="Expired"
                            onClick={() => setExpiredProductsActive((prev) => !prev)}
                            color={expiredProductsActive ? 'error' : 'default'}
                            variant={expiredProductsActive ? 'filled' : 'outlined'}
                            size="small"
                            sx={{
                                fontWeight: 500,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: expiredProductsActive ? 'error.dark' : 'action.hover' },
                            }}
                        />
                        <Chip
                            label="Low Stock"
                            onClick={() => setLowStockProductsActive((prev) => !prev)}
                            color={lowStockProductsActive ? 'warning' : 'default'}
                            variant={lowStockProductsActive ? 'filled' : 'outlined'}
                            size="small"
                            sx={{
                                fontWeight: 500,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: lowStockProductsActive ? 'warning.dark' : 'action.hover' },
                            }}
                        />
                    </Box>
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
                        <Select value={advancedFilters.status} label="Status" onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}>
                            <MenuItem value="">All</MenuItem>
                            {PRODUCT_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Stock Status</InputLabel>
                        <Select value={advancedFilters.product_status} label="Stock Status" onChange={(e) => setAdvancedFilters({ ...advancedFilters, product_status: e.target.value })}>
                            <MenuItem value="">All</MenuItem>
                            {PRODUCT_STOCK_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                        <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                    </Box>
                </>
            }
        >
            <Popover
                open={Boolean(variantsAnchorEl)}
                anchorEl={variantsAnchorEl?.el}
                onClose={() => setVariantsAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                {variantsAnchorEl && <VariantsPopover product={variantsAnchorEl.product} />}
            </Popover>
            <StockUpdateDialog
                open={Boolean(stockUpdateProduct)}
                onClose={() => setStockUpdateProduct(null)}
                onSuccess={() => refreshTableRef.current()}
                product={stockUpdateProduct}
            />
            <DataTable
                key={`product-table-${paginationModel.page}-${paginationModel.pageSize}`}
                columns={columns}
                state={tableState}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                emptyStateMessage="No products yet"
                emptyStateActionLabel="Add Product"
                emptyStateActionOnClick={() => navigate('/products/new')}
            />
        </ListPageLayout>
    );
}
