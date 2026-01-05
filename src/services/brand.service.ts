/**
 * Brand Service
 * Handles all brand-related API calls with server pagination support
 */

import http from '../utils/http';
import config from '../config/env';
import { API_URLS } from '../constants/urls';
import type { 
  Brand, 
  BrandListResponse,
  CreateBrandRequest,
  CreateBrandResponse,
  UpdateBrandRequest,
  UpdateBrandResponse
} from '../types/brand';
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
export interface ServerPaginationResponse<T = Brand> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch brands with server pagination support
 * Uses POST request with JSON body containing pagination, filters, and sorting
 */
export const fetchBrands = async (
  params: FetchParams
): Promise<ServerPaginationResponse<Brand>> => {
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
        key: 'name',
        iLike: params.searchKeyword,
      });
    }

    // Make POST API call with JSON body
    const response = await http.post<BrandListResponse>(
      API_URLS.BRANDS.LIST,
      requestBody,
      {
        signal: params.signal,
      }
    );

    // Transform API response to hook's expected format
    // Map snake_case fields to camelCase
    const mappedList = (response.doc || []).map((brand: any) => ({
      ...brand,
      logo: brand.logo || brand.image, // API returns 'logo', fallback to 'image' for backward compatibility
      image: brand.logo || brand.image, // Keep image for backward compatibility
      createdAt: brand.created_at || brand.createdAt,
      concurrencyStamp: brand.concurrency_stamp || brand.concurrencyStamp,
    }));

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
    console.error('Error fetching brands:', error);
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
 * Create a new brand
 * Handles multipart/form-data for file upload
 */
export const createBrand = async (
  data: CreateBrandRequest
): Promise<CreateBrandResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('branchId', String(data.branchId));
    formData.append('vendorId', String(data.vendorId));
    formData.append('status', data.status);
    formData.append('file', data.file);

    // Build full URL (same logic as http.ts buildUrl)
    const endpoint = API_URLS.BRANDS.CREATE;
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
    return result as CreateBrandResponse;
  } catch (error) {
    console.error('Error creating brand:', error);
    throw error;
  }
};

/**
 * Update an existing brand
 * Handles multipart/form-data for file upload (file is optional)
 */
export const updateBrand = async (
  id: string | number,
  data: UpdateBrandRequest
): Promise<UpdateBrandResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('updatedBy', String(data.updatedBy));
    formData.append('concurrencyStamp', data.concurrencyStamp);
    
    // Only append file if provided
    if (data.file) {
      formData.append('file', data.file);
    }

    // Build full URL
    const endpoint = API_URLS.BRANDS.UPDATE(id);
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
    return result as UpdateBrandResponse;
  } catch (error) {
    console.error('Error updating brand:', error);
    throw error;
  }
};

const brandService = {
  fetchBrands,
  createBrand,
  updateBrand,
};

export default brandService;

