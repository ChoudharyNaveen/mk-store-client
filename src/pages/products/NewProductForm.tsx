import React from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import productService, { fetchProducts } from '../../services/product.service';
import { fetchCategories } from '../../services/category.service';
import { fetchSubCategories } from '../../services/sub-category.service';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';
import { FormTextField, FormFileUpload, FormSelect, FormAutocomplete } from '../../components/forms';
import { mergeWithDefaultFilters } from '../../utils/filterBuilder';
import type { ProductStatus, Product } from '../../types/product';
import type { Category } from '../../types/category';
import type { SubCategory } from '../../types/sub-category';

// Base validation schema - shared fields
const baseProductFormSchema = {
    title: yup.string().required('Title is required').min(2, 'Title must be at least 2 characters'),
    description: yup.string().optional().default(''),
    price: yup.number().required('Price is required').min(0, 'Price must be greater than 0'),
    sellingPrice: yup.number().required('Selling Price is required').min(0, 'Selling Price must be greater than 0'),
    quantity: yup.number().required('Quantity is required').min(0, 'Quantity must be greater than or equal to 0'),
    units: yup.string().required('Units is required'),
    categoryId: yup.number().required('Category is required').min(1, 'Please select a category'),
    subCategoryId: yup.number().required('Sub Category is required').min(1, 'Please select a sub category'),
    status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Status must be ACTIVE or INACTIVE').required('Status is required'),
    productStatus: yup.string().oneOf(['INSTOCK', 'OUTOFSTOCK'], 'Product Status must be INSTOCK or OUTOFSTOCK').required('Product Status is required'),
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

    return yup.object({
        ...baseProductFormSchema,
        file: fileValidation,
        nutritional: yup.string().optional().nullable(),
        brandId: yup.number().optional().nullable(),
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
    const [loadingCategories, setLoadingCategories] = React.useState(false);
    const [loadingSubCategories, setLoadingSubCategories] = React.useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = React.useState('');
    const [subCategorySearchTerm, setSubCategorySearchTerm] = React.useState('');
    const categorySearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const subCategorySearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const hasFetchedRef = React.useRef(false);

    const {
        control,
        handleSubmit,
        formState: { isValid },
        reset,
        watch,
    } = useForm<ProductFormData>({
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
        },
        mode: 'onChange',
    });

    const selectedCategoryId = watch('categoryId');

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
                    
                    // Fetch the specific category and sub-category to ensure they're in the options list
                    if (product.category?.id) {
                        await fetchAndAddItem(product.category.id, fetchCategories, setCategories, 'category');
                    }
                    if (product.subCategory?.id) {
                        await fetchAndAddItem(product.subCategory.id, fetchSubCategories, setSubCategories, 'sub-category');
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
    const buildFormResetData = React.useCallback((data: Product) => ({
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
        brandId: null, // Brand ID not in response, set to null
        file: null,
    }), []);

    // Reset form when product data and related data are ready
    React.useEffect(() => {
        if (isEditMode && productData) {
            // Check if category and sub-category are in the lists
            const categoryExists = !productData.category?.id || categories.some(cat => cat.id === productData.category!.id);
            const subCategoryExists = !productData.subCategory?.id || subCategories.some(sub => sub.id === productData.subCategory!.id);
            
            if (categoryExists && subCategoryExists) {
                reset(buildFormResetData(productData));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productData, categories, subCategories, isEditMode, buildFormResetData]);

    // Helper function to build common product data
    const buildProductData = React.useCallback((data: ProductFormData) => ({
        title: data.title,
        description: data.description || '',
        price: data.price,
        sellingPrice: data.sellingPrice,
        quantity: data.quantity,
        units: data.units,
        brandId: data.brandId || undefined,
    }), []);

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

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={4}>
                    {/* Column 1 */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 4 }}>
                            <FormTextField
                                name="title"
                                control={control}
                                label="Title"
                                required
                                placeholder="Type here"
                                variant="outlined"
                                size="small"
                                disabled={loading}
                            />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <FormTextField
                                name="quantity"
                                control={control}
                                label="Quantity"
                                required
                                placeholder="Type here"
                                variant="outlined"
                                size="small"
                                type="number"
                                disabled={loading}
                            />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <FormAutocomplete
                                name="categoryId"
                                control={control}
                                label="Category"
                                required
                                disabled={loading || isEditMode}
                                loading={loadingCategories}
                                options={categories.map(cat => ({
                                    value: cat.id,
                                    label: cat.title,
                                }))}
                                onInputChange={(_, newInputValue) => {
                                    setCategorySearchTerm(newInputValue);
                                }}
                                size="small"
                            />
                        </Box>
                    </Grid>

                    {/* Column 2 */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 4 }}>
                            <FormTextField
                                name="price"
                                control={control}
                                label="Price"
                                required
                                placeholder="Type here"
                                variant="outlined"
                                size="small"
                                type="number"
                                disabled={loading}
                            />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <FormTextField
                                name="units"
                                control={control}
                                label="Unit"
                                required
                                placeholder="Type here"
                                variant="outlined"
                                size="small"
                                disabled={loading}
                            />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <FormAutocomplete
                                name="subCategoryId"
                                control={control}
                                label="Sub Category"
                                required
                                disabled={loading || isEditMode || !selectedCategoryId || selectedCategoryId === 0}
                                loading={loadingSubCategories}
                                options={subCategories.map(sub => ({
                                    value: sub.id,
                                    label: sub.title,
                                }))}
                                onInputChange={(_, newInputValue) => {
                                    setSubCategorySearchTerm(newInputValue);
                                }}
                                size="small"
                            />
                        </Box>
                    </Grid>

                    {/* Column 3 */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 4 }}>
                            <FormTextField
                                name="sellingPrice"
                                control={control}
                                label="Selling Price"
                                required
                                placeholder="Type here"
                                variant="outlined"
                                size="small"
                                type="number"
                                disabled={loading}
                            />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <FormSelect
                                name="productStatus"
                                control={control}
                                label="Availability Status"
                                required
                                disabled={loading}
                                options={[
                                    { value: 'INSTOCK', label: 'In stock' },
                                    { value: 'OUTOFSTOCK', label: 'Out of stock' },
                                ]}
                            />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <FormSelect
                                name="status"
                                control={control}
                                label="Status"
                                required
                                disabled={loading}
                                options={[
                                    { value: 'ACTIVE', label: 'Active' },
                                    { value: 'INACTIVE', label: 'Inactive' },
                                ]}
                            />
                        </Box>
                    </Grid>

                    {/* Full Width Text Areas */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormTextField
                            name="description"
                            control={control}
                            label="Description"
                            placeholder="Type here"
                            variant="outlined"
                            multiline
                            rows={6}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormTextField
                            name="nutritional"
                            control={control}
                            label="Nutritional"
                            placeholder="Type here"
                            variant="outlined"
                            multiline
                            rows={6}
                            disabled={loading}
                        />
                    </Grid>

                    {/* Image Upload Column 3 (Bottom) */}
                    <Grid size={{ xs: 12, md: 4 }} offset={{ md: 8 }}>
                        <FormFileUpload
                            name="file"
                            control={control}
                            label="Upload cover image"
                            required={!isEditMode}
                            accept="image/*"
                            disabled={loading}
                            preview={filePreview}
                            onPreviewChange={setFilePreview}
                            minHeight={150}
                        />
                    </Grid>
                </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 6 }}>
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
            </Box>
        </Paper>
    );
}
