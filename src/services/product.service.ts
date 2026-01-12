/**
 * Product Service
 * Handles all product-related API calls with server pagination support
 */

import http from '../utils/http';
import config from '../config/env';
import { API_URLS } from '../constants/urls';
import type { 
  Product, 
  ProductListResponse,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  UpdateProductResponse
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
    } = {
      pageSize,
      pageNumber,
    };

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
 * Create a new product
 * Handles multipart/form-data for file upload
 */
export const createProduct = async (
  data: CreateProductRequest
): Promise<CreateProductResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('categoryId', String(data.categoryId));
    formData.append('subCategoryId', String(data.subCategoryId));
    formData.append('branchId', String(data.branchId));
    formData.append('vendorId', String(data.vendorId));
    formData.append('status', data.status);
    
    if (data.brandId) {
      formData.append('brandId', String(data.brandId));
    }
    
    if (data.nutritional) {
      formData.append('nutritional', data.nutritional);
    }
    
    // Add createdBy if available (from user context)
    const userId = localStorage.getItem('user_id');
    if (userId) {
      formData.append('createdBy', userId);
    }
    
    // Send variants as a single JSON string array
    if (data.variants && data.variants.length > 0) {
      formData.append('variants', JSON.stringify(data.variants));
    }
    
    // Append multiple image files
    if (data.images && data.images.length > 0) {
      data.images.forEach(image => {
        formData.append('images', image);
      });
    }

    // Build full URL (same logic as http.ts buildUrl)
    const endpoint = API_URLS.PRODUCTS.CREATE;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const baseUrl = config.apiBaseUrl.endsWith('/') 
      ? config.apiBaseUrl.slice(0, -1) 
      : config.apiBaseUrl;
    const url = `${baseUrl}/${cleanEndpoint}`;

    // Get auth token
    const token = localStorage.getItem('auth_token');

    // Make API call with FormData
    // Note: Don't set Content-Type header, browser will set it with boundary
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        data: errorData,
      };
    }

    const result = await response.json();
    return result as CreateProductResponse;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update an existing product
 * Handles multipart/form-data for file upload (file is optional)
 */
export const updateProduct = async (
  id: string | number,
  data: UpdateProductRequest
): Promise<UpdateProductResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('updatedBy', String(data.updatedBy));
    formData.append('concurrencyStamp', data.concurrencyStamp);
    
    if (data.brandId) {
      formData.append('brandId', String(data.brandId));
    }
    
    if (data.nutritional) {
      formData.append('nutritional', data.nutritional);
    }
    
    // Send variants as a single JSON string array
    if (data.variants && data.variants.length > 0) {
      formData.append('variants', JSON.stringify(data.variants));
    }
    
    // Append multiple image files (optional for updates)
    if (data.images && data.images.length > 0) {
      data.images.forEach(image => {
        formData.append('images', image);
      });
    }
  
    // Build full URL
    const endpoint = API_URLS.PRODUCTS.UPDATE(id);
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const baseUrl = config.apiBaseUrl.endsWith('/') 
      ? config.apiBaseUrl.slice(0, -1) 
      : config.apiBaseUrl;
    const url = `${baseUrl}/${cleanEndpoint}`;

    // Get auth token
    const token = localStorage.getItem('auth_token');

    // Make API call with FormData and concurrencyStamp header
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-concurrencystamp': data.concurrencyStamp,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        data: errorData,
      };
    }

    const result = await response.json();
    return result as UpdateProductResponse;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

const productService = {
  fetchProducts,
  createProduct,
  updateProduct,
};

export default productService;

