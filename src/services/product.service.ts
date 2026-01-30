/**
 * Product Service
 * Handles all product-related API calls with server pagination support
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { 
  Product, 
  ProductListResponse,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  ProductVariant,
  ProductImage,
  ProductStats,
  ProductStatsResponse,
  InventoryMovement,
  InventoryMovementsResponse
} from '../types/product';
import type { ServerFilter, ServerSorting } from '../types/filter';
import { convertSimpleFiltersToServerFilters } from '../utils/filterBuilder';

/**
 * Fetch parameters for server pagination hook
 */
export interface FetchParams {
  page?: number; // Page number for API (0-based: 0, 1, 2, ...). Omitted on initial fetch.
  pageSize?: number; // Omitted on initial fetch
  searchKeyword?: string;
  filters?: Record<string, string | number | boolean | null | undefined> | ServerFilter[];
  sorting?: ServerSorting[];
  signal?: AbortSignal;
  /** When true, send hasActiveComboDiscounts: true in request body (not part of filters) */
  hasActiveComboDiscounts?: boolean;
}

/**
 * Server pagination response format expected by the hook
 */
export interface ServerPaginationResponse<T = Product> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch products with server pagination support
 * Uses POST request with JSON body containing pagination, filters, and sorting
 */
export const fetchProducts = async (
  params: FetchParams
): Promise<ServerPaginationResponse<Product>> => {
  try {
    const page = params.page ?? 0;
    const pageSize = params.pageSize ?? 10;
    const pageNumber = page + 1; // Convert 0-based to 1-based

    // Build request body
    const requestBody: {
      pageSize: number;
      pageNumber: number;
      filters?: ServerFilter[];
      sorting?: ServerSorting[];
      hasActiveComboDiscounts?: boolean;
    } = {
      pageSize,
      pageNumber,
    };

    if (params.hasActiveComboDiscounts === true) {
      requestBody.hasActiveComboDiscounts = true;
    }

    // Convert filters to ServerFilter array if needed
    if (params.filters) {
      if (Array.isArray(params.filters)) {
        requestBody.filters = params.filters;
      } else {
        // Convert simple object format to ServerFilter array
        requestBody.filters = convertSimpleFiltersToServerFilters(params.filters);
      }
    }

    // Add sorting if provided
    if (params.sorting && params.sorting.length > 0) {
      requestBody.sorting = params.sorting;
    }

    // Handle searchKeyword - convert to filter if needed
    if (params.searchKeyword) {
      if (!requestBody.filters) {
        requestBody.filters = [];
      }
      requestBody.filters.push({
        key: 'title',
        iLike: params.searchKeyword,
      });
    }

    // Make POST API call with JSON body
    const response = await http.post<ProductListResponse>(
      API_URLS.PRODUCTS.LIST,
      requestBody,
      {
        signal: params.signal,
      }
    );

    // Transform API response to hook's expected format
    // Map snake_case fields to camelCase and handle new fields
    const mappedList = (response.doc || []).map((product: unknown) => {
      const p = product as Record<string, unknown>;
      
      // Map variants array if present
      const variants = Array.isArray(p.variants) 
        ? (p.variants as unknown[]).map((variant: unknown) => {
            const v = variant as Record<string, unknown>;
            return {
              ...v,
              items_per_unit: v.items_per_unit ?? v.itemsPerUnit ?? null,
              units: v.units ?? null,
            };
          })
        : p.variants;
      
      return {
        ...p,
        variants,
        createdAt: p.created_at || p.createdAt,
        concurrencyStamp: p.concurrency_stamp || p.concurrencyStamp,
        // Handle new fields - API may return in camelCase or snake_case
        itemQuantity: p.itemQuantity ?? p.item_quantity ?? undefined,
        itemUnit: p.itemUnit ?? p.item_unit ?? undefined,
        itemsPerUnit: p.itemsPerUnit ?? p.items_per_unit ?? undefined,
        expiryDate: p.expiryDate ?? p.expiry_date ?? undefined,
        // Handle brand - API may return as object or null
        brand: p.brand || null,
        brandId: (p.brand as { id?: number })?.id || p.brandId || undefined,
        // Handle productType - API may return as object or null
        productType: p.productType || p.product_type || undefined,
        productTypeId: (p.productType as { id?: number })?.id ?? (p.product_type as { id?: number })?.id ?? undefined,
      } as unknown as Product;
    });

    return {
      list: mappedList,
      totalCount: response.pagination?.totalCount || 0,
      pageDetails: {
        pageNumber: response.pagination?.pageNumber,
        pageSize: response.pagination?.pageSize,
        paginationEnabled: response.pagination?.paginationEnabled,
      },
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return empty response on error
    return {
      list: [],
      totalCount: 0,
      pageDetails: {
        paginationEnabled: false,
      },
    };
  }
};

/**
 * Fetch product statistics by product ID
 * Uses POST request to fetch product stats
 */
export const fetchProductStats = async (
  productId: string | number
): Promise<ProductStats> => {
  try {
    const response = await http.post<ProductStatsResponse>(
      API_URLS.PRODUCTS.GET_STATS,
      { productId: Number(productId) }
    );

    if (!response.success || !response.doc) {
      throw {
        message: 'Product stats not found',
        status: 404,
        data: { error: 'Product stats not found' },
      };
    }

    return response.doc;
  } catch (error) {
    console.error('Error fetching product stats:', error);
    throw error;
  }
};

/**
 * Fetch inventory movements for a product
 * Uses POST request with pagination
 */
export const fetchInventoryMovements = async (
  productId: string | number,
  page: number = 0,
  pageSize: number = 10
): Promise<ServerPaginationResponse<InventoryMovement>> => {
  try {
    const pageNumber = page + 1; // Convert 0-based to 1-based

    const response = await http.post<InventoryMovementsResponse>(
      API_URLS.PRODUCTS.GET_INVENTORY_MOVEMENTS,
      {
        productId: Number(productId),
        pageSize,
        pageNumber,
      }
    );

    if (!response.success || !response.doc) {
      return {
        list: [],
        totalCount: 0,
        pageDetails: {
          paginationEnabled: false,
        },
      };
    }

    return {
      list: response.doc,
      totalCount: response.pagination?.totalCount || 0,
      pageDetails: {
        pageNumber: response.pagination?.pageNumber,
        pageSize: response.pagination?.pageSize,
        paginationEnabled: response.pagination?.paginationEnabled,
      },
    };
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return {
      list: [],
      totalCount: 0,
      pageDetails: {
        paginationEnabled: false,
      },
    };
  }
};

/**
 * Create a new product
 * Handles multipart/form-data for file upload
 */
export const createProduct = async (
  data: CreateProductRequest
): Promise<CreateProductResponse> => {
  try {
    // Validate at least one variant is required
    if (!data.variants || data.variants.length === 0) {
      throw {
        message: 'At least one variant is required',
        status: 400,
        data: { error: 'At least one variant is required' },
      };
    }

    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('categoryId', String(data.categoryId));
    formData.append('subCategoryId', String(data.subCategoryId));
    formData.append('branchId', String(data.branchId));
    formData.append('vendorId', String(data.vendorId));
    formData.append('status', data.status);
    
    if (data.brandId) {
      formData.append('brandId', String(data.brandId));
    }
    if (data.productTypeId != null && data.productTypeId !== '') {
      formData.append('productTypeId', String(data.productTypeId));
    }

    // Add createdBy if available (from user context)
    const userId = localStorage.getItem('user_id');
    if (userId) {
      formData.append('createdBy', userId);
    }
    
    // Send variants as a single JSON string array
    formData.append('variants', JSON.stringify(data.variants));
    
    // Append multiple image files
    if (data.images && data.images.length > 0) {
      data.images.forEach(image => {
        formData.append('images', image);
      });
    }

    // Make API call with FormData using httpRequest
    const response = await http.post<CreateProductResponse>(
      API_URLS.PRODUCTS.CREATE,
      formData
    );

    return response;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Fetch product details by ID
 * Uses GET request to fetch detailed product information
 */
export const fetchProductDetails = async (
  id: string | number
): Promise<Product> => {
  try {
    const response = await http.get<{ success: boolean; doc: Product }>(
      API_URLS.PRODUCTS.GET_DETAILS(id)
    );

    if (!response.success || !response.doc) {
      throw {
        message: 'Product not found',
        status: 404,
        data: { error: 'Product not found' },
      };
    }

    // Map snake_case fields to camelCase and handle nested objects
    const product = response.doc as unknown as Record<string, unknown>;
    
    // Map variants array if present
    const variants = Array.isArray(product.variants) 
      ? (product.variants as unknown[]).map((variant: unknown) => {
          const v = variant as Record<string, unknown>;
          
          // Map combo_discounts if present
          const comboDiscounts = Array.isArray(v.combo_discounts)
            ? (v.combo_discounts as unknown[]).map((discount: unknown) => {
                const d = discount as Record<string, unknown>;
                return {
                  comboQuantity: d.combo_quantity ?? d.comboQuantity,
                  discountType: d.discount_type ?? d.discountType,
                  discountValue: d.discount_value ?? d.discountValue,
                  startDate: d.start_date ?? d.startDate,
                  endDate: d.end_date ?? d.endDate,
                  status: d.status || 'ACTIVE',
                };
              })
            : undefined;
          
          return {
            ...v,
            items_per_unit: v.items_per_unit ?? v.itemsPerUnit ?? null,
            units: v.units ?? null,
            expiry_date: v.expiry_date ?? v.expiryDate ?? null,
            product_status: v.product_status ?? v.productStatus ?? 'INSTOCK',
            concurrency_stamp: v.concurrency_stamp ?? v.concurrencyStamp,
            combo_discounts: comboDiscounts,
          };
        })
      : product.variants || [];
    
    // Map images array if present
    const images = Array.isArray(product.images)
      ? (product.images as unknown[]).map((image: unknown) => {
          const img = image as Record<string, unknown>;
          return {
            ...img,
            image_url: img.image_url ?? img.imageUrl,
            is_default: img.is_default ?? img.isDefault ?? false,
            display_order: img.display_order ?? img.displayOrder ?? 0,
            variant_id: img.variant_id ?? img.variantId ?? null,
            concurrency_stamp: img.concurrency_stamp ?? img.concurrencyStamp,
          };
        })
      : product.images || [];

    // Find default image or use first image
    const defaultImage = Array.isArray(images)
      ? (images.find((img: ProductImage) => img && (img as ProductImage).is_default) || images[0] || null)
      : null;
    const defaultImageUrl = defaultImage ? defaultImage.image_url : null;

    // Map the product with proper field names
    const mappedProduct = {
      ...product,
      variants,
      images,
      createdAt: product.created_at || product.createdAt,
      updatedAt: product.updated_at || product.updatedAt,
      concurrencyStamp: product.concurrency_stamp || product.concurrencyStamp,
      // Handle nested objects
      category: product.category || undefined,
      subCategory: product.subCategory || product.sub_category || undefined,
      brand: product.brand || null,
      brandId: (product.brand as { id?: number })?.id || product.brandId || undefined,
      productType: product.productType || product.product_type || undefined,
      productTypeId: (product.productType as { id?: number })?.id ?? (product.product_type as { id?: number })?.id ?? product.productTypeId ?? undefined,
    } as unknown as Product;

    return mappedProduct;
  } catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
  }
};

/**
 * Update an existing product
 * Handles multipart/form-data for file upload (file is optional)
 * Supports all update scenarios: variants, images, deletions, etc.
 */
export const updateProduct = async (
  id: string | number,
  data: UpdateProductRequest
): Promise<UpdateProductResponse> => {
  try {
    // Validate variants: if variants are provided or deletions are specified, ensure at least one variant remains
    if (data.variants !== undefined) {
      if (data.variants.length === 0) {
        // Check if we're deleting all variants
        if (data.variantIdsToDelete && data.variantIdsToDelete.length > 0) {
          throw {
            message: 'At least one variant is required. Cannot delete all variants.',
            status: 400,
            data: { error: 'At least one variant is required' },
          };
        }
        // If no variants and no deletions specified, it's invalid
        throw {
          message: 'At least one variant is required',
          status: 400,
          data: { error: 'At least one variant is required' },
        };
      }
    } else if (data.variantIdsToDelete && data.variantIdsToDelete.length > 0) {
      // If only deletions are specified without new variants, validate on server
      // (We can't know how many variants exist without fetching, so we'll let server handle this)
    }

    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Basic product fields (optional - only include if provided)
    if (data.title !== undefined) {
      formData.append('title', data.title);
    }
    if (data.categoryId !== undefined) {
      formData.append('categoryId', String(data.categoryId));
    }
    if (data.subCategoryId !== undefined) {
      formData.append('subCategoryId', String(data.subCategoryId));
    }
    if (data.status !== undefined) {
      formData.append('status', data.status);
    }
    
    // Required fields
    formData.append('updatedBy', String(data.updatedBy));
    formData.append('concurrencyStamp', data.concurrencyStamp);
    
    // Brand ID - can be null to remove brand
    if (data.brandId !== undefined) {
      if (data.brandId === null) {
        formData.append('brandId', ''); // Empty string to set to null
      } else {
        formData.append('brandId', String(data.brandId));
      }
    }
    // Product type ID - optional
    if (data.productTypeId !== undefined) {
      if (data.productTypeId === null || data.productTypeId === '') {
        formData.append('productTypeId', '');
      } else {
        formData.append('productTypeId', String(data.productTypeId));
      }
    }

    // Variants - send as a single JSON string array
    if (data.variants && data.variants.length > 0) {
      formData.append('variants', JSON.stringify(data.variants));
    }
    
    // Variant IDs to delete
    if (data.variantIdsToDelete && data.variantIdsToDelete.length > 0) {
      formData.append('variantIdsToDelete', JSON.stringify(data.variantIdsToDelete));
    }
    
    // Image file uploads (multipart/form-data)
    if (data.images && data.images.length > 0) {
      data.images.forEach(image => {
        formData.append('images', image);
      });
    }
    
    // Images data (for existing images or pre-uploaded URLs)
    if (data.imagesData && data.imagesData.length > 0) {
      formData.append('imagesData', JSON.stringify(data.imagesData));
    }
    
    // Image IDs to delete
    if (data.imageIdsToDelete && data.imageIdsToDelete.length > 0) {
      formData.append('imageIdsToDelete', JSON.stringify(data.imageIdsToDelete));
    }
  
    // Make API call with FormData and concurrencyStamp header using httpRequest
    const response = await http.patch<UpdateProductResponse>(
      API_URLS.PRODUCTS.UPDATE(id),
      formData,
      {
        headers: {
          'x-concurrencystamp': data.concurrencyStamp,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

const productService = {
  fetchProducts,
  fetchProductDetails,
  fetchProductStats,
  fetchInventoryMovements,
  createProduct,
  updateProduct,
};

export default productService;

