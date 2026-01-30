/**
 * Category Service
 * Handles all category-related API calls with server pagination support
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { Category, CategoryListResponse, CreateCategoryRequest, CreateCategoryResponse, UpdateCategoryRequest, UpdateCategoryResponse } from '../types/category';
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
export interface ServerPaginationResponse<T = Category> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch categories with server pagination support
 * Uses POST request with JSON body containing pagination, filters, and sorting
 */
export const fetchCategories = async (
  params: FetchParams
): Promise<ServerPaginationResponse<Category>> => {
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
    // You can adjust this based on your backend API requirements
    if (params.searchKeyword) {
      // If searchKeyword should be a filter, add it
      // For now, we'll add it as a filter with 'like' operator on title
      if (!requestBody.filters) {
        requestBody.filters = [];
      }
      requestBody.filters.push({
        key: 'title',
        iLike: params.searchKeyword,
      });
    }

    // Make POST API call with JSON body
    const response = await http.post<CategoryListResponse>(
      API_URLS.CATEGORIES.LIST,
      requestBody,
      {
        signal: params.signal,
      }
    );

    // Transform API response to hook's expected format
    return {
      list: response.doc || [],
      totalCount: response.pagination?.totalCount || 0,
      pageDetails: {
        pageNumber: response.pagination?.pageNumber,
        pageSize: response.pagination?.pageSize,
        paginationEnabled: response.pagination?.paginationEnabled,
      },
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
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
 * Create a new category
 * Handles multipart/form-data for file upload
 */
export const createCategory = async (
  data: CreateCategoryRequest
): Promise<CreateCategoryResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('branchId', String(data.branchId));
    formData.append('vendorId', String(data.vendorId));
    formData.append('status', data.status);
    formData.append('file', data.file);

    // Make API call with FormData using httpRequest
    const response = await http.post<CreateCategoryResponse>(
      API_URLS.CATEGORIES.CREATE,
      formData
    );

    return response;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update an existing category
 * Handles multipart/form-data for file upload (file is optional)
 */
export const updateCategory = async (
  id: string | number,
  data: UpdateCategoryRequest
): Promise<UpdateCategoryResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('updatedBy', String(data.updatedBy));
    formData.append('concurrencyStamp', data.concurrencyStamp);

    if (data.status !== undefined) {
      formData.append('status', data.status);
    }

    // Only append file if provided
    if (data.file) {
      formData.append('file', data.file);
    }

    // Make API call with FormData and concurrencyStamp header using httpRequest
    const response = await http.patch<UpdateCategoryResponse>(
      API_URLS.CATEGORIES.UPDATE(id),
      formData,
      {
        headers: {
          'x-concurrencystamp': data.concurrencyStamp,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

const categoryService = {
  fetchCategories,
  createCategory,
  updateCategory,
};

export default categoryService;

