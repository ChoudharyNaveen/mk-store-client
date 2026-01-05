import React from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Paper,
    Divider,
    Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import productService, { fetchProducts } from '../../services/product.service';
import { fetchCategories } from '../../services/category.service';
import { fetchSubCategories } from '../../services/sub-category.service';
import { fetchBrands } from '../../services/brand.service';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';
import { FormTextField, FormFileUpload, FormSelect, FormAutocomplete, FormNumberField, FormDatePicker, FormProvider } from '../../components/forms';
import { mergeWithDefaultFilters } from '../../utils/filterBuilder';
import type { ProductStatus, Product, ItemUnit } from '../../types/product';
import type { Category } from '../../types/category';
import type { SubCategory } from '../../types/sub-category';
import type { Brand } from '../../types/brand';
import { getItemUnitOptions } from '../../constants/itemUnits';

// Valid item unit values
const validItemUnits = ['LTR', 'ML', 'GAL', 'FL_OZ', 'KG', 'G', 'MG', 'OZ', 'LB', 'TON', 'PCS', 'UNIT', 'DOZEN', 'SET', 'PAIR', 'BUNDLE', 'PKG', 'BOX', 'BOTTLE', 'CAN', 'CARTON', 'TUBE', 'JAR', 'BAG', 'POUCH', 'M', 'CM', 'MM', 'FT', 'IN', 'SQFT', 'SQM'] as const;

// Base validation schema - shared fields
const baseProductFormSchema = {
    title: yup.string().required('Title is required').min(2, 'Title must be at least 2 characters'),
    description: yup.string().optional().default(''),
    price: yup.number().required('Price is required').min(0, 'Price must be greater than 0'),
    sellingPrice: yup.number().required('Selling Price is required').min(0, 'Selling Price must be greater than 0'),
    quantity: yup.number().required('Quantity is required').min(0, 'Quantity must be greater than or equal to 0'),
    units: yup.string().optional().nullable().transform((value, originalValue) => originalValue === '' ? undefined : value),
    categoryId: yup.number().required('Category is required').min(1, 'Please select a category'),
    subCategoryId: yup.number().required('Sub Category is required').min(1, 'Please select a sub category'),
    status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Status must be ACTIVE or INACTIVE').required('Status is required'),
    productStatus: yup.string().oneOf(['INSTOCK', 'OUTOFSTOCK'], 'Product Status must be INSTOCK or OUTOFSTOCK').required('Product Status is required'),
    // New/Updated fields - itemQuantity and itemUnit are now mandatory
    itemQuantity: yup.number()
        .required('Item quantity is required')
        .min(0, 'Item quantity must be greater than or equal to 0')
        .transform((value, originalValue) => originalValue === '' ? undefined : value),
    itemUnit: yup.string()
        .required('Item unit is required')
        .oneOf([...validItemUnits], 'Item unit must be one of the valid unit types')
        .transform((value, originalValue) => originalValue === '' ? undefined : value),
    itemsPerUnit: yup.number()
        .nullable()
        .optional()
        .integer('Items per unit must be a whole number')
        .min(1, 'Items per unit must be greater than or equal to 1')
        .transform((value, originalValue) => originalValue === '' ? undefined : value),
    expiryDate: yup.date()
        .nullable()
        .optional()
        .transform((value, originalValue) => {
            if (originalValue === '' || originalValue == null) return undefined;
            return value;
        }),
};

// File validation - shared test functions
const fileTypeTest = (value: File | null, isOptional: boolean) => {
    if (!value) return isOptional;
    return value instanceof File && value.type.startsWith('image/');
};

const fileSizeTest = (value: File | null, isOptional: boolean) => {
    if (!value) return isOptional;
    return value instanceof File && value.size <= 5 * 1024 * 1024;
};

// Create validation schema factory
const createProductFormSchema = (isEditMode: boolean) => {
    const fileValidation = isEditMode
        ? yup
              .mixed<File>()
              .nullable()
              .optional()
              .test('fileType', 'File must be an image', (value) => fileTypeTest(value, true))
              .test('fileSize', 'File size must be less than 5MB', (value) => fileSizeTest(value, true))
        : yup
              .mixed<File>()
              .required('Image file is required')
              .test('fileType', 'File must be an image', (value) => fileTypeTest(value, false))
              .test('fileSize', 'File size must be less than 5MB', (value) => fileSizeTest(value, false));

    // For create mode, quantity and expiryDate are required
    // For edit mode, they are optional
    const quantityValidation = isEditMode
        ? yup.number().optional().nullable().min(0, 'Quantity must be greater than or equal to 0')
        : yup.number().required('Quantity is required').min(0, 'Quantity must be greater than or equal to 0');
    
    const expiryDateValidation = isEditMode
        ? yup.date().nullable().optional().transform((value, originalValue) => {
            if (originalValue === '' || originalValue == null) return undefined;
            return value;
        })
        : yup.date().required('Expiry date is required').nullable().transform((value, originalValue) => {
            if (originalValue === '' || originalValue == null) return undefined;
            return value;
        });

    // Conditional validation for itemsPerUnit: required if units is provided
    const itemsPerUnitValidation = yup.number()
        .nullable()
        .when('units', {
            is: (units: string | null | undefined) => units && units.trim() !== '',
            then: (schema) => schema
                .required('Items per unit is required when stock unit is provided')
                .integer('Items per unit must be a whole number')
                .min(1, 'Items per unit must be greater than or equal to 1'),
            otherwise: (schema) => schema.optional().nullable(),
        })
        .transform((value, originalValue) => originalValue === '' ? undefined : value);

    return yup.object({
        ...baseProductFormSchema,
        quantity: quantityValidation,
        expiryDate: expiryDateValidation,
        file: fileValidation,
        nutritional: yup.string().optional().nullable(),
        brandId: yup.number().optional().nullable(),
        itemsPerUnit: itemsPerUnitValidation,
    });
};

interface ProductFormData {
    title: string;
    description?: string;
    price: number;
    sellingPrice: number;
    quantity: number;
    units: string;
    categoryId: number;
    subCategoryId: number;
    status: 'ACTIVE' | 'INACTIVE';
    productStatus: 'INSTOCK' | 'OUTOFSTOCK';
    nutritional?: string | null;
    brandId?: number | null;
    file: File | null;
    // New/Updated fields
    itemQuantity?: number | null;
    itemUnit?: ItemUnit | null;
    itemsPerUnit?: number | null;
    expiryDate?: Date | string | null;
}

export default function ProductForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;
    
    // Get user ID for update operations
    const userId = user?.id || 1;
    
    const [loading, setLoading] = React.useState(false);
    const [fetchingProduct, setFetchingProduct] = React.useState(isEditMode);
    const [filePreview, setFilePreview] = React.useState<string | null>(null);
    const [productData, setProductData] = React.useState<Product | null>(null);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [subCategories, setSubCategories] = React.useState<SubCategory[]>([]);
    const [brands, setBrands] = React.useState<Brand[]>([]);
    const [loadingCategories, setLoadingCategories] = React.useState(false);
    const [loadingSubCategories, setLoadingSubCategories] = React.useState(false);
    const [loadingBrands, setLoadingBrands] = React.useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = React.useState('');
    const [subCategorySearchTerm, setSubCategorySearchTerm] = React.useState('');
    const [brandSearchTerm, setBrandSearchTerm] = React.useState('');
    const categorySearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const subCategorySearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const brandSearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const hasFetchedRef = React.useRef(false);
    const selectedBrandIdRef = React.useRef<number | null>(null);
    const brandsFetchingRef = React.useRef(false);

    const methods = useForm<ProductFormData>({
        resolver: yupResolver(createProductFormSchema(isEditMode)) as any,
        defaultValues: {
            title: '',
            description: '',
            price: 0,
            sellingPrice: 0,
            quantity: 0,
            units: '',
            categoryId: 0,
            subCategoryId: 0,
            status: 'ACTIVE' as ProductStatus,
            productStatus: 'INSTOCK',
            nutritional: null,
            brandId: null,
            file: null,
            // New/Updated fields
            itemQuantity: null,
            itemUnit: null,
            itemsPerUnit: null,
            expiryDate: null,
        },
        mode: 'onChange',
    });

    const { handleSubmit, watch, reset, formState: { isValid }, control, setValue } = methods;
    const selectedCategoryId = watch('categoryId');
    const selectedBrandId = watch('brandId');
    const quantity = watch('quantity');
    const units = watch('units');
    
    // Update ref when selectedBrandId changes
    React.useEffect(() => {
        selectedBrandIdRef.current = selectedBrandId ?? null;
    }, [selectedBrandId]);

    // Auto-calculate itemsPerUnit when units and quantity are provided
    React.useEffect(() => {
        if (units && units.trim() !== '' && quantity != null && quantity > 0) {
            const unitsValue = parseFloat(units);
            if (!isNaN(unitsValue) && unitsValue > 0) {
                const calculatedItemsPerUnit = Math.floor(quantity / unitsValue);
                if (calculatedItemsPerUnit > 0) {
                    setValue('itemsPerUnit', calculatedItemsPerUnit, { shouldValidate: true });
                }
            }
        } else if (!units || units.trim() === '') {
            // Clear itemsPerUnit if units is cleared
            setValue('itemsPerUnit', null, { shouldValidate: true });
        }
    }, [quantity, units, setValue]);

    // Helper function to fetch a single item by ID and add to list
    const fetchAndAddItem = React.useCallback(async <T extends { id: number }>(
        id: number,
        fetchFn: (params: { filters: Array<{ key: string; eq: string }>; page: number; pageSize: number }) => Promise<{ list: T[] }>,
        setListFn: React.Dispatch<React.SetStateAction<T[]>>,
        itemName: string
    ) => {
        try {
            const response = await fetchFn({
                filters: [{ key: 'id', eq: String(id) }],
                page: 0,
                pageSize: 1,
            });
            
            if (response.list?.[0]) {
                const item = response.list[0];
                setListFn(prev => {
                    const exists = prev.some(existing => existing.id === item.id);
                    return exists ? prev : [item, ...prev];
                });
            }
        } catch (error) {
            console.error(`Error fetching ${itemName} for edit:`, error);
        }
    }, []);

    // Fetch categories with debounced search
    React.useEffect(() => {
        // Skip if search term is empty and we already have categories (initial load handled separately)
        if (!categorySearchTerm && categories.length > 0) {
            return;
        }

        if (categorySearchTimeoutRef.current) {
            clearTimeout(categorySearchTimeoutRef.current);
        }

        categorySearchTimeoutRef.current = setTimeout(async () => {
            try {
                setLoadingCategories(true);
                const additionalFilters: Array<{ key: string; iLike: string }> = [];
                if (categorySearchTerm) {
                    additionalFilters.push({ key: 'title', iLike: categorySearchTerm });
                }
                const filters = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
                const response = await fetchCategories({ filters, page: 0, pageSize: 20 });
                setCategories(response.list || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
                showErrorToast('Failed to load categories');
            } finally {
                setLoadingCategories(false);
            }
        }, categorySearchTerm ? 500 : 0);

        return () => {
            if (categorySearchTimeoutRef.current) {
                clearTimeout(categorySearchTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categorySearchTerm]);


    // Fetch sub-categories when category is selected
    React.useEffect(() => {
        if (!selectedCategoryId || selectedCategoryId === 0) {
            setSubCategories([]);
            return;
        }

        // Skip if search term is empty and we already have sub-categories for this category
        if (!subCategorySearchTerm && subCategories.length > 0 && subCategories.some(sub => sub.categoryId === selectedCategoryId)) {
            return;
        }

        if (subCategorySearchTimeoutRef.current) {
            clearTimeout(subCategorySearchTimeoutRef.current);
        }

        subCategorySearchTimeoutRef.current = setTimeout(async () => {
            try {
                setLoadingSubCategories(true);
                const additionalFilters: Array<{ key: string; iLike?: string; eq?: string }> = [
                    { key: 'categoryId', eq: String(selectedCategoryId) }
                ];
                if (subCategorySearchTerm) {
                    additionalFilters.push({ key: 'title', iLike: subCategorySearchTerm });
                }
                const filters = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
                const response = await fetchSubCategories({ filters, page: 0, pageSize: 20 });
                setSubCategories(response.list || []);
            } catch (error) {
                console.error('Error fetching sub-categories:', error);
                showErrorToast('Failed to load sub-categories');
            } finally {
                setLoadingSubCategories(false);
            }
        }, subCategorySearchTerm ? 500 : 0);

        return () => {
            if (subCategorySearchTimeoutRef.current) {
                clearTimeout(subCategorySearchTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategoryId, subCategorySearchTerm]);

    // Fetch brands with debounced search (handles initial load and search, similar to categories)
    React.useEffect(() => {
        // Skip if search term is empty and we already have brands (initial load handled by this same effect)
        if (!brandSearchTerm && brands.length > 0) {
            return;
        }

        // Skip if already fetching to prevent duplicate calls
        if (brandsFetchingRef.current) {
            return;
        }

        if (brandSearchTimeoutRef.current) {
            clearTimeout(brandSearchTimeoutRef.current);
        }

        brandSearchTimeoutRef.current = setTimeout(async () => {
            // Mark as fetching to prevent duplicate calls
            brandsFetchingRef.current = true;
            try {
                setLoadingBrands(true);
                const additionalFilters: Array<{ key: string; iLike: string }> = [];
                if (brandSearchTerm) {
                    additionalFilters.push({ key: 'name', iLike: brandSearchTerm });
                }
                const filters = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
                const response = await fetchBrands({ filters, page: 0, pageSize: 20 });
                const newBrands = response.list || [];
                
                // Preserve the currently selected brand if it exists and is not in the new list
                const currentBrandId = selectedBrandIdRef.current;
                if (currentBrandId && !newBrands.some(b => b.id === currentBrandId)) {
                    // Try to fetch the selected brand to keep it in the list
                    try {
                        const brandResponse = await fetchBrands({
                            filters: [{ key: 'id', eq: String(currentBrandId) }],
                            page: 0,
                            pageSize: 1,
                        });
                        if (brandResponse.list?.[0]) {
                            setBrands([brandResponse.list[0], ...newBrands]);
                            return;
                        }
                    } catch {
                        // Fall through to setBrands with newBrands only
                    }
                }
                setBrands(newBrands);
            } catch (error) {
                console.error('Error fetching brands:', error);
                showErrorToast('Failed to load brands');
            } finally {
                setLoadingBrands(false);
                brandsFetchingRef.current = false;
            }
        }, brandSearchTerm ? 500 : 0);

        return () => {
            if (brandSearchTimeoutRef.current) {
                clearTimeout(brandSearchTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [brandSearchTerm]);

    // Fetch product data on mount if in edit mode
    React.useEffect(() => {
        const loadProduct = async () => {
            if (!isEditMode || !id || hasFetchedRef.current) {
                return;
            }

            // Mark as fetched to prevent duplicate calls
            hasFetchedRef.current = true;

            try {
                setFetchingProduct(true);
                // Fetch product using fetchProducts with id filter
                const response = await fetchProducts({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    const product = response.list[0];
                    setProductData(product);
                    
                    // Fetch the specific category, sub-category, and brand to ensure they're in the options list
                    if (product.category?.id) {
                        await fetchAndAddItem(product.category.id, fetchCategories, setCategories, 'category');
                    }
                    if (product.subCategory?.id) {
                        await fetchAndAddItem(product.subCategory.id, fetchSubCategories, setSubCategories, 'sub-category');
                    }
                    // Check both brand object and brandId field
                    // In edit mode, ensure the selected brand is in the list
                    // The brand search effect will handle loading the initial list
                    const brandId = product.brand?.id || product.brandId;
                    if (brandId) {
                        await fetchAndAddItem(brandId, fetchBrands, setBrands, 'brand');
                    }

                    // Set image preview from API
                    if (product.image) {
                        setFilePreview(product.image);
                    }
                } else {
                    showErrorToast('Product not found');
                    navigate('/products');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                navigate('/products');
            } finally {
                setFetchingProduct(false);
            }
        };

        loadProduct();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // Only depend on id, reset and navigate are stable

    // Helper function to build form reset data
    const buildFormResetData = React.useCallback((data: Product) => {
        // Handle expiryDate - convert string to Date if needed
        let expiryDateValue: Date | string | null = null;
        if (data.expiryDate) {
            expiryDateValue = typeof data.expiryDate === 'string' ? new Date(data.expiryDate) : data.expiryDate;
        }
        
        // Handle brandId - check both brand object and brandId field
        const brandId = data.brand?.id || data.brandId || null;
        
        return {
            title: data.title,
            description: data.description || '',
            price: data.price,
            sellingPrice: data.selling_price,
            quantity: data.quantity,
            units: data.units,
            categoryId: data.category?.id || 0,
            subCategoryId: data.subCategory?.id || 0,
            status: data.status,
            productStatus: data.product_status,
            nutritional: data.nutritional,
            brandId: brandId,
            file: null,
            // New/Updated fields
            itemQuantity: data.itemQuantity ?? null,
            itemUnit: data.itemUnit ?? null,
            itemsPerUnit: data.itemsPerUnit ?? null,
            expiryDate: expiryDateValue,
        };
    }, []);

    // Reset form when product data and related data are ready
    React.useEffect(() => {
        if (isEditMode && productData) {
            // Check if category, sub-category, and brand are in the lists
            const categoryExists = !productData.category?.id || categories.some(cat => cat.id === productData.category!.id);
            const subCategoryExists = !productData.subCategory?.id || subCategories.some(sub => sub.id === productData.subCategory!.id);
            // Check both brand object and brandId field
            const brandId = productData.brand?.id || productData.brandId;
            const brandExists = !brandId || brands.some(b => b.id === brandId);
            
            if (categoryExists && subCategoryExists && brandExists) {
                const resetData = buildFormResetData(productData);
                reset(resetData);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productData, categories, subCategories, brands, isEditMode, buildFormResetData]);

    // Helper function to build common product data
    const buildProductData = React.useCallback((data: ProductFormData) => {
        // Format expiryDate - convert Date to ISO string if needed
        let expiryDateValue: string | undefined = undefined;
        if (data.expiryDate) {
            if (data.expiryDate instanceof Date) {
                expiryDateValue = data.expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            } else if (typeof data.expiryDate === 'string') {
                expiryDateValue = data.expiryDate;
            }
        }
        
        // Handle brandId - include if it's a valid number (not null or undefined)
        // Note: 0 is a valid brandId if the API uses 0-based IDs, but typically IDs start from 1
        let brandIdValue: number | undefined = undefined;
        if (data.brandId !== null && data.brandId !== undefined) {
            brandIdValue = Number(data.brandId); // Ensure it's a number
        }
        
        return {
            title: data.title,
            description: data.description || '',
            price: data.price,
            sellingPrice: data.sellingPrice,
            quantity: data.quantity,
            units: data.units,
            brandId: brandIdValue,
            // New/Updated fields
            itemQuantity: data.itemQuantity ?? undefined,
            itemUnit: data.itemUnit ?? undefined,
            itemsPerUnit: data.itemsPerUnit ?? undefined,
            expiryDate: expiryDateValue,
        };
    }, []);

    const onSubmit = async (data: ProductFormData) => {
        // Validation checks
        if (isEditMode) {
            if (!productData || !id || !productData.concurrencyStamp) {
                if (!productData?.concurrencyStamp) {
                    console.error('Product concurrencyStamp is missing');
                }
                return;
            }
        } else {
            if (!data.file || !selectedBranchId) {
                if (!selectedBranchId) {
                    showErrorToast('No branch selected. Please select a branch.');
                }
                return;
            }
        }

        setLoading(true);
        try {
            const commonData = buildProductData(data);
            
            if (isEditMode) {
                await productService.updateProduct(id!, {
                    ...commonData,
                    updatedBy: userId,
                    concurrencyStamp: productData!.concurrencyStamp,
                    file: data.file || undefined,
                });
                showSuccessToast('Product updated successfully!');
            } else {
                await productService.createProduct({
                    ...commonData,
                    categoryId: data.categoryId,
                    subCategoryId: data.subCategoryId,
                    branchId: selectedBranchId!,
                    vendorId: user?.vendorId || 1,
                    status: data.status as ProductStatus,
                    file: data.file!,
                });
                showSuccessToast('Product created successfully!');
            }

            navigate('/products');
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error);
            // Error toast is automatically shown by HTTP utilities
        } finally {
            setLoading(false);
        }
    };

    if (fetchingProduct) {
        return (
            <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{
                        color: 'text.secondary',
                        textTransform: 'none',
                        minWidth: 'auto',
                        '&:hover': { bgcolor: 'transparent' }
                    }}
                >
                    Back
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 500, color: '#333', fontSize: '1.75rem' }}>
                    {isEditMode ? 'Edit Product' : 'New Product'}
                </Typography>
            </Box>

            <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                    {/* Basic Information Section */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mb: 1.5, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon sx={{ color: '#204564', fontSize: '1.25rem' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
                                Basic Information
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormTextField
                                name="title"
                                control={control}
                                label="Product Title"
                                required
                                placeholder="Enter product name"
                                variant="outlined"
                                size="small"
                                disabled={loading}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                The name of your product as it will appear to customers
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormAutocomplete
                                name="brandId"
                                label="Brand"
                                disabled={loading}
                                loading={loadingBrands}
                                options={brands.map(brand => ({
                                    value: Number(brand.id),
                                    label: brand.name,
                                }))}
                                onInputChange={(_, newInputValue, reason) => {
                                    if (reason === 'input') {
                                        setBrandSearchTerm(newInputValue);
                                    }
                                }}
                                size="small"
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                Select the product brand (optional)
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Category & Classification Section */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mb: 1.5, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon sx={{ color: '#204564', fontSize: '1.25rem' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
                                Category & Classification
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormAutocomplete
                                name="categoryId"
                                label="Category"
                                required
                                disabled={loading || isEditMode}
                                loading={loadingCategories}
                                options={categories.map(cat => ({
                                    value: cat.id,
                                    label: cat.title,
                                }))}
                                onInputChange={(_, newInputValue, reason) => {
                                    if (reason === 'input') {
                                        setCategorySearchTerm(newInputValue);
                                    }
                                }}
                                size="small"
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                Select the main product category
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormAutocomplete
                                name="subCategoryId"
                                label="Sub Category"
                                required
                                disabled={loading || isEditMode || !selectedCategoryId || selectedCategoryId === 0}
                                loading={loadingSubCategories}
                                options={subCategories.map(sub => ({
                                    value: sub.id,
                                    label: sub.title,
                                }))}
                                onInputChange={(_, newInputValue, reason) => {
                                    if (reason === 'input') {
                                        setSubCategorySearchTerm(newInputValue);
                                    }
                                }}
                                size="small"
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                Select a sub-category within the chosen category
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Pricing & Inventory Section */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mb: 1.5, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachMoneyIcon sx={{ color: '#204564', fontSize: '1.25rem' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
                                Pricing & Inventory
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormTextField
                                name="price"
                                control={control}
                                label="Cost Price"
                                required
                                placeholder="0.00"
                                variant="outlined"
                                size="small"
                                type="number"
                                disabled={loading}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                The cost price of the product
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormTextField
                                name="sellingPrice"
                                control={control}
                                label="Selling Price"
                                required
                                placeholder="0.00"
                                variant="outlined"
                                size="small"
                                type="number"
                                disabled={loading}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                The price at which you'll sell to customers
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormNumberField
                                name="quantity"
                                control={control}
                                label="Stock Quantity"
                                required
                                placeholder="0"
                                variant="outlined"
                                size="small"
                                disabled={loading}
                                inputProps={{ step: 1, min: 0 }}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                Total number of units available in stock
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormTextField
                                name="units"
                                control={control}
                                label="Stock Unit"
                                placeholder="e.g., 25"
                                variant="outlined"
                                size="small"
                                disabled={loading}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                Optional: Number of items per stock unit (used to calculate items per unit)
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormSelect
                                name="productStatus"
                                control={control}
                                label="Availability Status"
                                required
                                disabled={loading}
                                options={[
                                    { value: 'INSTOCK', label: 'In Stock' },
                                    { value: 'OUTOFSTOCK', label: 'Out of Stock' },
                                ]}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormSelect
                                name="status"
                                control={control}
                                label="Product Status"
                                required
                                disabled={loading}
                                options={[
                                    { value: 'ACTIVE', label: 'Active' },
                                    { value: 'INACTIVE', label: 'Inactive' },
                                ]}
                            />
                        </Box>
                    </Grid>

                    {/* Item Details Section */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mb: 1.5, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InventoryIcon sx={{ color: '#204564', fontSize: '1.25rem' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
                                Item Measurement Details
                            </Typography>
                            <Chip 
                                label="Required" 
                                size="small" 
                                sx={{ 
                                    bgcolor: '#e3f2fd', 
                                    color: '#1976d2', 
                                    fontSize: '0.65rem',
                                    height: '18px'
                                }} 
                            />
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, fontSize: '0.85rem' }}>
                            Specify the measurement details for individual items in this product
                        </Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormNumberField
                                name="itemQuantity"
                                control={control}
                                label="Item Quantity"
                                required
                                placeholder="e.g., 500"
                                variant="outlined"
                                size="small"
                                disabled={loading}
                                inputProps={{ step: 'any' }}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                The quantity measurement per individual item (e.g., 500 for 500 grams)
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormAutocomplete
                                name="itemUnit"
                                label="Item Unit"
                                required
                                disabled={loading}
                                options={getItemUnitOptions()}
                                size="small"
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                The unit of measurement (e.g., G for grams, KG for kilograms, ML for milliliters)
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormNumberField
                                name="itemsPerUnit"
                                control={control}
                                label="Items Per Unit"
                                placeholder="Auto-calculated"
                                variant="outlined"
                                size="small"
                                disabled={true}
                            />
                            <Typography variant="caption" sx={{ color: units && units.trim() !== '' && quantity ? 'success.main' : 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: units && units.trim() !== '' && quantity ? 500 : 400 }}>
                                {units && units.trim() !== '' && quantity 
                                    ? (() => {
                                        const unitsValue = parseFloat(units);
                                        const calculated = !isNaN(unitsValue) && unitsValue > 0 ? Math.floor(quantity / unitsValue) : null;
                                        return calculated && calculated > 0 
                                            ? `✓ Auto-calculated: ${calculated} items per unit`
                                            : 'Enter valid Stock Unit and Stock Quantity to calculate';
                                    })()
                                    : 'Enter Stock Unit above to auto-calculate items per unit'}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormDatePicker
                                name="expiryDate"
                                control={control}
                                label="Expiry Date"
                                required={!isEditMode}
                                variant="outlined"
                                size="small"
                                disabled={loading}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                {isEditMode ? 'Optional: Product expiration date' : 'Required: When does this product expire?'}
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Additional Information Section */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mb: 1.5, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DescriptionIcon sx={{ color: '#204564', fontSize: '1.25rem' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
                                Additional Information
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormTextField
                                name="description"
                                control={control}
                                label="Product Description"
                                placeholder="Enter a detailed description of the product..."
                                variant="outlined"
                                multiline
                                rows={4}
                                disabled={loading}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                Provide a detailed description that helps customers understand your product
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 2 }}>
                            <FormTextField
                                name="nutritional"
                                control={control}
                                label="Nutritional Information"
                                placeholder="Enter nutritional details..."
                                variant="outlined"
                                multiline
                                rows={4}
                                disabled={loading}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                Optional: Add nutritional facts, ingredients, or other relevant information
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Product Image Section */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mb: 1.5, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ImageIcon sx={{ color: '#204564', fontSize: '1.25rem' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
                                Product Image
                            </Typography>
                            {!isEditMode && (
                                <Chip 
                                    label="Required" 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: '#e3f2fd', 
                                        color: '#1976d2', 
                                        fontSize: '0.65rem',
                                        height: '18px'
                                    }} 
                                />
                            )}
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormFileUpload
                            name="file"
                            control={control}
                            label="Upload Product Image"
                            required={!isEditMode}
                            accept="image/*"
                            disabled={loading}
                            preview={filePreview}
                            onPreviewChange={setFilePreview}
                            minHeight={150}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                            {isEditMode 
                                ? 'Upload a new image to replace the current product image (optional)'
                                : 'Upload a high-quality image that represents your product (required)'}
                        </Typography>
                    </Grid>
                </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !isValid}
                    sx={{
                        bgcolor: '#204564',
                        color: 'white',
                        px: 6,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#1a3852' },
                        '&:disabled': { bgcolor: '#ccc', color: '#666' }
                    }}
                >
                    {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                            {isEditMode ? 'Updating...' : 'Submitting...'}
                        </Box>
                    ) : (
                        isEditMode ? 'Update' : 'Submit'
                    )}
                </Button>
                <Button
                    type="button"
                    variant="contained"
                    disabled={loading}
                    onClick={() => navigate(-1)}
                    sx={{
                        bgcolor: '#e0e0e0',
                        color: '#333',
                        px: 6,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#d5d5d5' }
                    }}
                >
                    Cancel
                </Button>
            </Box>
            </FormProvider>
        </Paper>
    );
}

