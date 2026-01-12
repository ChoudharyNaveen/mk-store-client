import React from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Paper,
    Chip,
    IconButton,
    Checkbox,
    FormControlLabel,
    Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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

// Valid variant type values
const validVariantTypes = ['WEIGHT', 'SIZE', 'COLOR', 'MATERIAL', 'FLAVOR', 'PACKAGING', 'OTHER'] as const;

// Variant validation schema
const variantSchema = yup.object().shape({
    variantName: yup.string().required('Variant name is required').min(1, 'Variant name is required'),
    variantType: yup.string().oneOf([...validVariantTypes], 'Invalid variant type').required('Variant type is required'),
    variantValue: yup.string().nullable().optional(),
    price: yup.number().required('Price is required').min(0, 'Price must be greater than 0'),
    sellingPrice: yup.number().required('Selling Price is required').min(0, 'Selling Price must be greater than 0'),
    quantity: yup.number().required('Quantity is required').min(0, 'Quantity must be greater than or equal to 0').integer('Quantity must be a whole number'),
    itemsPerUnit: yup.number().nullable().optional().integer('Items per unit must be a whole number').min(1, 'Items per unit must be greater than or equal to 1'),
    units: yup.string().nullable().optional(),
    itemQuantity: yup.number().nullable().optional().min(0, 'Item quantity must be greater than or equal to 0'),
    itemUnit: yup.string().nullable().optional().oneOf([...validItemUnits], 'Item unit must be one of the valid unit types'),
    expiryDate: yup.date().required('Expiry date is required').nullable().transform((value, originalValue) => {
        if (originalValue === '' || originalValue == null) return undefined;
        return value;
    }),
    status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Status must be ACTIVE or INACTIVE').required('Status is required'),
});

// Base validation schema - shared fields (removed price, sellingPrice, quantity, expiryDate - now in variants)
const baseProductFormSchema = {
    title: yup.string().required('Title is required').min(2, 'Title must be at least 2 characters'),
    description: yup.string().optional().default(''),
    categoryId: yup.number().required('Category is required').min(1, 'Please select a category'),
    subCategoryId: yup.number().required('Sub Category is required').min(1, 'Please select a sub category'),
    status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Status must be ACTIVE or INACTIVE').required('Status is required'),
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

// Image validation schema
const imageSchema = yup.object().shape({
    file: yup
        .mixed<File>()
        .nullable()
        .test('fileType', 'File must be an image', (value) => fileTypeTest(value, true))
        .test('fileSize', 'File size must be less than 5MB', (value) => fileSizeTest(value, true)),
    preview: yup.string().nullable().optional(),
});

// Create validation schema factory
const createProductFormSchema = (isEditMode: boolean) => {
    const imagesValidation = isEditMode
        ? yup
            .array()
            .of(imageSchema)
            .max(3, 'Maximum 3 images allowed')
            .test('atLeastOneImage', 'At least one image is required', (value) => {
                if (!value || value.length === 0) return false;
                return value.some((img) => img.file !== null || img.preview !== null);
            })
        : yup
            .array()
            .of(imageSchema)
            .min(1, 'At least one image is required')
            .max(3, 'Maximum 3 images allowed')
            .test('atLeastOneFile', 'At least one image file is required', (value) => {
                if (!value || value.length === 0) return false;
                return value.some((img) => img.file !== null);
            });

    return yup.object({
        ...baseProductFormSchema,
        images: imagesValidation,
        nutritional: yup.string().optional().nullable(),
        brandId: yup.number().optional().nullable(),
        variants: yup.array().of(variantSchema).min(1, 'At least one variant is required'),
    });
};

interface VariantFormData {
    variantName: string;
    variantType: 'WEIGHT' | 'SIZE' | 'COLOR' | 'MATERIAL' | 'FLAVOR' | 'PACKAGING' | 'OTHER';
    variantValue?: string | null;
    price: number;
    sellingPrice: number;
    quantity: number;
    itemsPerUnit?: number | null;
    units?: string | null;
    itemQuantity?: number | null;
    itemUnit?: ItemUnit | null;
    expiryDate: Date | string | null;
    status: 'ACTIVE' | 'INACTIVE';
}

interface ImageFormData {
    file: File | null;
    preview: string | null;
}

interface ProductFormData {
    title: string;
    description?: string;
    categoryId: number;
    subCategoryId: number;
    status: 'ACTIVE' | 'INACTIVE';
    nutritional?: string | null;
    brandId?: number | null;
    images: ImageFormData[];
    variants: VariantFormData[];
}

export default function ProductForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;

    // Get product data from navigation state
    const productFromState = location.state?.product as Product | undefined;

    // Get user ID for update operations
    const userId = user?.id || 1;

    const [loading, setLoading] = React.useState(false);
    const [fetchingProduct, setFetchingProduct] = React.useState(isEditMode);
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
    const [useSameExpiryDate, setUseSameExpiryDate] = React.useState(false);
    const [sharedExpiryDate, setSharedExpiryDate] = React.useState<Date | string | null>(null);
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
            categoryId: 0,
            subCategoryId: 0,
            status: 'ACTIVE' as ProductStatus,
            nutritional: null,
            brandId: null,
            images: [{ file: null, preview: null }],
            variants: [
                {
                    variantName: '',
                    variantType: 'OTHER',
                    variantValue: null,
                    price: 0,
                    sellingPrice: 0,
                    quantity: 0,
                    itemsPerUnit: null,
                    units: null,
                    itemQuantity: null,
                    itemUnit: null,
                    expiryDate: null,
                    status: 'ACTIVE',
                },
            ],
        },
        mode: 'onChange',
    });

    const { handleSubmit, watch, reset, formState: { isValid }, control, setValue } = methods;
    const selectedCategoryId = watch('categoryId');
    const selectedBrandId = watch('brandId');

    // Update ref when selectedBrandId changes
    React.useEffect(() => {
        selectedBrandIdRef.current = selectedBrandId ?? null;
    }, [selectedBrandId]);

    // Field array for variants
    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: 'variants',
    });

    // Field array for images
    const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
        control,
        name: 'images',
    });

    // Helper function to add a new variant
    const handleAddVariant = () => {
        appendVariant({
            variantName: '',
            variantType: 'OTHER',
            variantValue: null,
            price: 0,
            sellingPrice: 0,
            quantity: 0,
            itemsPerUnit: null,
            units: null,
            itemQuantity: null,
            itemUnit: null,
            expiryDate: useSameExpiryDate ? sharedExpiryDate : null,
            status: 'ACTIVE',
        });
    };

    // Handle shared expiry date change
    const handleSharedExpiryDateChange = React.useCallback((date: Date | string | null) => {
        setSharedExpiryDate(date);
        if (useSameExpiryDate && date) {
            // Update all variants with the shared expiry date
            variantFields.forEach((_, index) => {
                setValue(`variants.${index}.expiryDate`, date, { shouldValidate: true });
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useSameExpiryDate, variantFields.length, setValue]);

    // Handle "use same expiry date" toggle
    const handleUseSameExpiryDateChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setUseSameExpiryDate(checked);

        if (checked && sharedExpiryDate) {
            // Apply shared expiry date to all variants
            variantFields.forEach((_, index) => {
                setValue(`variants.${index}.expiryDate`, sharedExpiryDate, { shouldValidate: true });
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sharedExpiryDate, variantFields.length, setValue]);

    // Sync expiry dates when shared date changes or toggle is enabled
    React.useEffect(() => {
        if (useSameExpiryDate && sharedExpiryDate) {
            variantFields.forEach((_, index) => {
                const currentExpiryDate = watch(`variants.${index}.expiryDate`);
                if (currentExpiryDate !== sharedExpiryDate) {
                    setValue(`variants.${index}.expiryDate`, sharedExpiryDate, { shouldValidate: true });
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useSameExpiryDate, sharedExpiryDate, variantFields.length, setValue, watch]);

    // Watch all variants to calculate itemsPerUnit
    const watchedVariants = useWatch({
        control,
        name: 'variants',
    });

    // Calculate itemsPerUnit for each variant when units or quantity changes
    React.useEffect(() => {
        if (!watchedVariants) return;

        watchedVariants.forEach((variant, index) => {
            const units = variant?.units;
            const quantity = variant?.quantity;

            if (units && quantity !== undefined && quantity !== null) {
                // Convert units to number if it's a string
                const unitsNum = typeof units === 'string' ? parseFloat(units.trim()) : units;
                const quantityNum = typeof quantity === 'number' ? quantity : parseFloat(String(quantity));

                if (!isNaN(unitsNum) && !isNaN(quantityNum) && unitsNum > 0 && quantityNum > 0) {
                    const calculatedItemsPerUnit = Math.floor(quantityNum / unitsNum);

                    // Only update if the value has changed
                    if (variant.itemsPerUnit !== calculatedItemsPerUnit) {
                        setValue(`variants.${index}.itemsPerUnit`, calculatedItemsPerUnit, { shouldValidate: false });
                    }
                } else {
                    // Reset to null if calculation is not valid
                    if (variant.itemsPerUnit !== null) {
                        setValue(`variants.${index}.itemsPerUnit`, null, { shouldValidate: false });
                    }
                }
            } else {
                // Reset to null if either units or quantity is missing
                if (variant.itemsPerUnit !== null) {
                    setValue(`variants.${index}.itemsPerUnit`, null, { shouldValidate: false });
                }
            }
        });
    }, [watchedVariants, setValue]);

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

    // Helper function to process product data (extracted for reuse)
    const processProductData = React.useCallback(async (product: Product) => {
        setProductData(product);

        // Fetch the specific category, sub-category, and brand to ensure they're in the options list
        if (product.category?.id) {
            await fetchAndAddItem(product.category.id, fetchCategories, setCategories, 'category');
        }
        if (product.subCategory?.id) {
            await fetchAndAddItem(product.subCategory.id, fetchSubCategories, setSubCategories, 'sub-category');
        }
        const brandId = product.brand?.id || product.brandId;
        if (brandId) {
            await fetchAndAddItem(brandId, fetchBrands, setBrands, 'brand');
        }

        // Set images from product data
        if (product.images && product.images.length > 0) {
            const imageFormData: ImageFormData[] = product.images.map((img) => ({
                file: null,
                preview: img.image_url,
            }));
            setValue('images', imageFormData);
        } else if (product.image) {
            // Fallback for legacy single image
            setValue('images', [{ file: null, preview: product.image }]);
        }
    }, [fetchAndAddItem, setCategories, setSubCategories, setBrands, setValue]);

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

                // First, try to use product from navigation state (faster, no API call)
                if (productFromState) {
                    await processProductData(productFromState);
                } else {
                    // Fallback: Fetch product from API (for page refresh or direct URL access)
                    const response = await fetchProducts({
                        filters: [{ key: 'id', eq: id }],
                        page: 0,
                        pageSize: 1,
                    });

                    if (response.list && response.list.length > 0) {
                        const product = response.list[0];
                        await processProductData(product);
                    } else {
                        showErrorToast('Product not found');
                        navigate('/products');
                    }
                }
            } catch (error) {
                console.error('Error loading product:', error);
                showErrorToast('Failed to load product data');
                navigate('/products');
            } finally {
                setFetchingProduct(false);
            }
        };

        loadProduct();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, productFromState, processProductData]);

    // Helper function to build form reset data
    const buildFormResetData = React.useCallback((data: Product) => {
        // Handle brandId - check both brand object and brandId field
        const brandId = data.brand?.id || data.brandId || null;

        // Convert variants from API format to form format
        const variants: VariantFormData[] = (data.variants?.map((variant) => {
            let expiryDateValue: Date | string | null = null;
            if (variant.expiry_date) {
                expiryDateValue = typeof variant.expiry_date === 'string' ? new Date(variant.expiry_date) : variant.expiry_date;
            }

            const variantTypeMap: Record<string, VariantFormData['variantType']> = {
                'WEIGHT': 'WEIGHT',
                'SIZE': 'SIZE',
                'COLOR': 'COLOR',
                'MATERIAL': 'MATERIAL',
                'FLAVOR': 'FLAVOR',
                'PACKAGING': 'PACKAGING',
                'OTHER': 'OTHER',
            };

            return {
                variantName: variant.variant_name,
                variantType: variantTypeMap[variant.variant_type] || 'OTHER',
                variantValue: variant.variant_value,
                price: variant.price,
                sellingPrice: variant.selling_price,
                quantity: variant.quantity,
                itemsPerUnit: variant.items_per_unit ?? null,
                units: variant.units ?? null,
                itemQuantity: variant.item_quantity,
                itemUnit: variant.item_unit as ItemUnit | null,
                expiryDate: expiryDateValue,
                status: variant.status,
            };
        }) || []) as VariantFormData[];

        // Convert images from API format to form format
        const images: ImageFormData[] = (data.images?.map((img) => ({
            file: null,
            preview: img.image_url,
        })) || []) as ImageFormData[];

        return {
            title: data.title,
            description: data.description || '',
            categoryId: data.category?.id || 0,
            subCategoryId: data.subCategory?.id || 0,
            status: data.status,
            nutritional: data.nutritional,
            brandId: brandId,
            images: images.length > 0 ? images : [{ file: null, preview: null }],
            variants: variants.length > 0 ? variants : [
                {
                    variantName: '',
                    variantType: 'OTHER',
                    variantValue: null,
                    price: 0,
                    sellingPrice: 0,
                    quantity: 0,
                    itemsPerUnit: null,
                    units: null,
                    itemQuantity: null,
                    itemUnit: null,
                    expiryDate: null,
                    status: 'ACTIVE',
                },
            ],
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
                reset(resetData as ProductFormData);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productData, categories, subCategories, brands, isEditMode, buildFormResetData]);

    // Helper function to build variants for API submission
    const buildVariantsData = React.useCallback((variants: VariantFormData[]) => {
        return variants.map((variant) => {
            // Format expiryDate - convert Date to ISO string if needed
            let expiryDateValue: string | undefined = undefined;
            if (variant.expiryDate) {
                if (variant.expiryDate instanceof Date) {
                    expiryDateValue = variant.expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
                } else if (typeof variant.expiryDate === 'string') {
                    expiryDateValue = variant.expiryDate;
                }
            }

            return {
                variantName: variant.variantName,
                variantType: variant.variantType,
                variantValue: variant.variantValue || undefined,
                price: variant.price,
                sellingPrice: variant.sellingPrice,
                quantity: variant.quantity,
                itemsPerUnit: variant.itemsPerUnit ?? undefined,
                units: variant.units ?? undefined,
                itemQuantity: variant.itemQuantity ?? undefined,
                itemUnit: variant.itemUnit ?? undefined,
                expiryDate: expiryDateValue,
                status: variant.status,
            };
        });
    }, []);

    const onSubmit = async (data: ProductFormData) => {
        // Validation checks
        if (isEditMode) {
            if (!productData || !id || !productData.concurrency_stamp) {
                if (!productData?.concurrency_stamp) {
                    console.error('Product concurrency_stamp is missing');
                }
                return;
            }
        } else {
            const hasImageFiles = data.images && data.images.length > 0 && data.images.some(img => img.file !== null);
            if (!hasImageFiles || !selectedBranchId) {
                if (!selectedBranchId) {
                    showErrorToast('No branch selected. Please select a branch.');
                } else if (!hasImageFiles) {
                    showErrorToast('At least one image is required.');
                }
                return;
            }
        }

        setLoading(true);
        try {
            // Handle brandId - include if it's a valid number (not null or undefined)
            let brandIdValue: number | undefined = undefined;
            if (data.brandId !== null && data.brandId !== undefined) {
                brandIdValue = Number(data.brandId);
            }

            // Build variants data
            const variantsData = buildVariantsData(data.variants);

            const commonData = {
                title: data.title,
                description: data.description || '',
                brandId: brandIdValue,
                nutritional: data.nutritional ?? undefined,
                variants: variantsData,
            };

            // Get the first image file (API currently expects single file)
            // TODO: Update API to accept multiple images
            const images = data.images.filter(img => img.file !== null).map(img => img.file!);

            if (isEditMode) {
                await productService.updateProduct(id!, {
                    ...commonData,
                    updatedBy: userId,
                    concurrencyStamp: productData!.concurrency_stamp,
                    images: images,
                } as any);
                showSuccessToast('Product updated successfully!');
            } else {
                await productService.createProduct({
                    ...commonData,
                    categoryId: data.categoryId,
                    subCategoryId: data.subCategoryId,
                    branchId: selectedBranchId!,
                    vendorId: user?.vendorId || 1,
                    status: data.status as ProductStatus,
                    images: images,
                } as any);
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
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
            {/* Header Section */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(-1)}
                            sx={{
                                color: 'text.secondary',
                                textTransform: 'none',
                                minWidth: 'auto',
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                    color: 'text.primary'
                                }
                            }}
                        >
                            Back
                        </Button>
                        <Divider orientation="vertical" flexItem sx={{ height: 32, mx: 1 }} />
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    fontSize: '1.75rem',
                                    mb: 0.5
                                }}
                            >
                                {isEditMode ? 'Edit Product' : 'New Product'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                {isEditMode ? 'Update product information and details' : 'Create a new product for your store'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
                <Grid container>
                    {/* Basic Information Section */}
                    <Grid size={{ xs: 12 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                mb: 3
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <InfoIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem' }}>
                                    Basic Information
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            <Grid container spacing={3}>

                                <Grid size={{ xs: 12, md: 6 }}>
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
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                        The name of your product as it will appear to customers
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
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
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                        Select the product brand (optional)
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Category & Classification Section */}
                    <Grid size={{ xs: 12 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                mb: 3
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <CategoryIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem' }}>
                                    Category & Classification
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            <Grid container spacing={3}>

                                <Grid size={{ xs: 12, md: 6 }}>
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
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                        Select the main product category
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
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
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                        Select a sub-category within the chosen category
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Product Variants Section */}
                    <Grid size={{ xs: 12 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                mb: 3
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <AttachMoneyIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem' }}>
                                        Product Variants
                                    </Typography>
                                    <Chip
                                        label="Required"
                                        size="small"
                                        sx={{
                                            bgcolor: 'grey.100',
                                            color: 'text.secondary',
                                            fontSize: '0.7rem',
                                            height: '20px',
                                            fontWeight: 500,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={useSameExpiryDate}
                                                onChange={handleUseSameExpiryDateChange}
                                                disabled={loading}
                                                sx={{
                                                    color: 'text.secondary',
                                                    '&.Mui-checked': {
                                                        color: 'text.primary',
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 400, color: 'text.secondary' }}>
                                                Use same expiry date for all variants
                                            </Typography>
                                        }
                                        sx={{ mr: 0 }}
                                    />
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={handleAddVariant}
                                        disabled={loading}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: 1,
                                            px: 2,
                                            py: 1,
                                            borderColor: 'divider',
                                            color: 'text.primary',
                                            '&:hover': {
                                                borderColor: 'text.primary',
                                                bgcolor: 'action.hover',
                                            },
                                        }}
                                    >
                                        Add Variant
                                    </Button>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontSize: '0.875rem' }}>
                                Add product variants with different prices, quantities, and expiry dates
                            </Typography>

                            {/* Shared Expiry Date Field */}
                            {useSameExpiryDate && (
                                <Box
                                    sx={{
                                        p: 2.5,
                                        mb: 3,
                                        borderRadius: 1,
                                        bgcolor: 'background.paper',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderLeft: '4px solid',
                                        borderLeftColor: 'text.primary',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                <DatePicker
                                                    label="Expiry Date (All Variants)"
                                                    disabled={loading}
                                                    value={sharedExpiryDate ? (sharedExpiryDate instanceof Date ? sharedExpiryDate : new Date(sharedExpiryDate)) : null}
                                                    onChange={(newValue) => {
                                                        handleSharedExpiryDateChange(newValue);
                                                    }}
                                                    slotProps={{
                                                        textField: {
                                                            required: true,
                                                            size: 'small',
                                                            fullWidth: true,
                                                        },
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                            <Chip
                                                label={`Applied to ${variantFields.length} variant${variantFields.length !== 1 ? 's' : ''}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'grey.100',
                                                    color: 'text.secondary',
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem' }}>
                                        This date will be automatically applied to all variants
                                    </Typography>
                                </Box>
                            )}

                            {variantFields.map((field, index) => (
                                <Paper
                                    key={field.id}
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        mb: 3,
                                        borderRadius: 2,
                                        bgcolor: 'background.paper',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        position: 'relative',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                            Variant {index + 1}
                                        </Typography>
                                        {variantFields.length > 1 && (
                                            <IconButton
                                                onClick={() => removeVariant(index)}
                                                disabled={loading}
                                                size="small"
                                                sx={{
                                                    color: 'text.secondary',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                        color: 'text.primary'
                                                    },
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                    <Divider sx={{ mb: 3 }} />

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormTextField
                                                name={`variants.${index}.variantName`}
                                                control={control}
                                                label="Variant Name"
                                                required
                                                placeholder="e.g., Small, Red, 500g"
                                                variant="outlined"
                                                size="small"
                                                disabled={loading}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormSelect
                                                name={`variants.${index}.variantType`}
                                                control={control}
                                                label="Variant Type"
                                                required
                                                disabled={loading}
                                                options={[
                                                    { value: 'WEIGHT', label: 'Weight' },
                                                    { value: 'SIZE', label: 'Size' },
                                                    { value: 'COLOR', label: 'Color' },
                                                    { value: 'MATERIAL', label: 'Material' },
                                                    { value: 'FLAVOR', label: 'Flavor' },
                                                    { value: 'PACKAGING', label: 'Packaging' },
                                                    { value: 'OTHER', label: 'Other' },
                                                ]}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormTextField
                                                name={`variants.${index}.variantValue`}
                                                control={control}
                                                label="Variant Value (Optional)"
                                                placeholder="e.g., 500g, Red, Large"
                                                variant="outlined"
                                                size="small"
                                                disabled={loading}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormSelect
                                                name={`variants.${index}.status`}
                                                control={control}
                                                label="Status"
                                                required
                                                disabled={loading}
                                                options={[
                                                    { value: 'ACTIVE', label: 'Active' },
                                                    { value: 'INACTIVE', label: 'Inactive' },
                                                ]}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormTextField
                                                name={`variants.${index}.price`}
                                                control={control}
                                                label="Cost Price"
                                                required
                                                placeholder="0.00"
                                                variant="outlined"
                                                size="small"
                                                type="number"
                                                disabled={loading}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormTextField
                                                name={`variants.${index}.sellingPrice`}
                                                control={control}
                                                label="Selling Price"
                                                required
                                                placeholder="0.00"
                                                variant="outlined"
                                                size="small"
                                                type="number"
                                                disabled={loading}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormNumberField
                                                name={`variants.${index}.quantity`}
                                                control={control}
                                                label="Quantity"
                                                required
                                                placeholder="0"
                                                variant="outlined"
                                                size="small"
                                                disabled={loading}
                                                inputProps={{ step: 1, min: 0 }}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormTextField
                                                name={`variants.${index}.units`}
                                                control={control}
                                                label="Stock Unit (Optional)"
                                                placeholder="e.g., 25"
                                                variant="outlined"
                                                size="small"
                                                disabled={loading}
                                            />
                                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                                Optional: Number of items per stock unit (used to calculate items per unit)
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormNumberField
                                                name={`variants.${index}.itemsPerUnit`}
                                                control={control}
                                                label="Items Per Unit (Optional)"
                                                placeholder="Auto-calculated"
                                                variant="outlined"
                                                size="small"
                                                disabled={true}
                                            />
                                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                                Optional: Auto-calculated based on Stock Unit and Quantity
                                            </Typography>
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormNumberField
                                                name={`variants.${index}.itemQuantity`}
                                                control={control}
                                                label="Item Quantity (Optional)"
                                                placeholder="e.g., 500"
                                                variant="outlined"
                                                size="small"
                                                disabled={loading}
                                                inputProps={{ step: 'any' }}
                                            />
                                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                                Optional: The quantity measurement per individual item (e.g., 500 for 500 grams)
                                            </Typography>
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormAutocomplete
                                                name={`variants.${index}.itemUnit`}
                                                label="Item Unit (Optional)"
                                                disabled={loading}
                                                options={getItemUnitOptions()}
                                                size="small"
                                            />
                                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                                Optional: The unit of measurement (e.g., G for grams, KG for kilograms, ML for milliliters)
                                            </Typography>
                                        </Grid>


                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <FormDatePicker
                                                name={`variants.${index}.expiryDate`}
                                                control={control}
                                                label="Expiry Date"
                                                required
                                                disabled={loading || useSameExpiryDate}
                                                slotProps={{
                                                    textField: {
                                                        size: 'small',
                                                        variant: 'outlined',
                                                    },
                                                }}
                                            />
                                            {useSameExpiryDate && (
                                                <Typography variant="caption" sx={{ color: 'primary.main', mt: 0.5, display: 'block', fontSize: '0.7rem', fontStyle: 'italic' }}>
                                                    Using shared expiry date
                                                </Typography>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Paper>
                    </Grid>

                    {/* Additional Information Section */}
                    <Grid size={{ xs: 12 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                mb: 3
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <DescriptionIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem' }}>
                                    Additional Information
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
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
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                        Provide a detailed description that helps customers understand your product
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
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
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                        Optional: Add nutritional facts, ingredients, or other relevant information
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Product Image Section */}
                    <Grid size={{ xs: 12 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                mb: 3
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <ImageIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem' }}>
                                    Product Image
                                </Typography>
                                {!isEditMode && (
                                    <Chip
                                        label="Required"
                                        size="small"
                                        sx={{
                                            bgcolor: 'grey.100',
                                            color: 'text.secondary',
                                            fontSize: '0.7rem',
                                            height: '20px',
                                            fontWeight: 500,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                )}
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            <Grid container spacing={2}>
                                {imageFields.map((field, index) => {
                                    const imageValue = watch(`images.${index}`);
                                    const preview = imageValue?.preview || null;

                                    return (
                                        <Grid size={{ xs: 12, md: 4 }} key={field.id}>
                                            <Box sx={{ position: 'relative' }}>
                                                <FormFileUpload
                                                    name={`images.${index}.file`}
                                                    control={control}
                                                    label={`Image ${index + 1}`}
                                                    required={index === 0 && !isEditMode}
                                                    accept="image/*"
                                                    disabled={loading}
                                                    preview={preview}
                                                    onPreviewChange={(newPreview) => {
                                                        setValue(`images.${index}.preview`, newPreview);
                                                    }}
                                                    minHeight={200}
                                                />
                                                {index > 0 && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeImage(index)}
                                                        disabled={loading}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            right: 8,
                                                            bgcolor: 'error.main',
                                                            color: 'white',
                                                            '&:hover': { bgcolor: 'error.dark' },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Grid>
                                    );
                                })}
                                {imageFields.length < 3 && (
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Box
                                            onClick={() => !loading && appendImage({ file: null, preview: null })}
                                            sx={{
                                                border: '1px dashed',
                                                borderColor: 'divider',
                                                borderRadius: 2,
                                                p: 3,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                bgcolor: '#fdfdfd',
                                                minHeight: 200,
                                                opacity: loading ? 0.6 : 1,
                                                '&:hover': loading ? {} : { bgcolor: '#f5f5f5' },
                                            }}
                                        >
                                            <AddIcon sx={{ color: 'text.secondary', fontSize: '2rem', mb: 1 }} />
                                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                Add Image
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                                Max 3 images
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                                {isEditMode
                                    ? 'Upload new images to replace existing ones (optional). Maximum 3 images allowed.'
                                    : 'Upload high-quality images that represent your product. Maximum 3 images allowed. At least one image is required.'}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mt: 3,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2
                    }}
                >
                    <Button
                        type="button"
                        variant="outlined"
                        disabled={loading}
                        onClick={() => navigate(-1)}
                        sx={{
                            borderColor: 'divider',
                            color: 'text.primary',
                            px: 4,
                            py: 1.5,
                            borderRadius: 1,
                            textTransform: 'none',
                            fontWeight: 500,
                            minWidth: 120,
                            '&:hover': {
                                borderColor: 'text.primary',
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !isValid}
                        sx={{
                            bgcolor: 'text.primary',
                            color: 'background.paper',
                            px: 4,
                            py: 1.5,
                            borderRadius: 1,
                            textTransform: 'none',
                            fontWeight: 500,
                            minWidth: 120,
                            '&:hover': {
                                bgcolor: 'text.primary',
                                opacity: 0.9,
                            },
                            '&:disabled': {
                                bgcolor: 'action.disabledBackground',
                                color: 'action.disabled',
                            }
                        }}
                    >
                        {loading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={18} sx={{ color: 'background.paper' }} />
                                {isEditMode ? 'Updating...' : 'Submitting...'}
                            </Box>
                        ) : (
                            isEditMode ? 'Update Product' : 'Create Product'
                        )}
                    </Button>
                </Paper>
            </FormProvider>
        </Box>
    );
}

