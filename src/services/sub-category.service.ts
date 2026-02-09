/**
 * Sub-category Service
 * Handles all sub-category-related API calls with server pagination support
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { 
  SubCategory, 
  SubCategoryListResponse,
  CreateSubCategoryRequest,
  CreateSubCategoryResponse,
  UpdateSubCategoryRequest,
  UpdateSubCategoryResponse,
  SubCategoryByCategoryIdItem,
  SubCategoryByCategoryIdResponse,
  SubCategoryStats,
  SubCategoryStatsResponse,
  FetchSubCategoryStatsParams
} from '../types/sub-category';
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
export interface ServerPaginationResponse<T = SubCategory> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch sub-categories with server pagination support
 * Uses POST request with JSON body containing pagination, filters, and sorting
 */
export const fetchSubCategories = async (
  params: FetchParams
): Promise<ServerPaginationResponse<SubCategory>> => {
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

    // Handle searchKeyword - upsert title filter when non-empty; remove when empty so API never gets stale search
    const filters = (requestBody.filters ??= []);
    const titleIdx = filters.findIndex((f: ServerFilter) => f.key === 'title');
    if (params.searchKeyword !== undefined && params.searchKeyword !== null) {
      const trimmed = String(params.searchKeyword).trim();
      if (trimmed) {
        const titleFilter: ServerFilter = { key: 'title', iLike: trimmed };
        if (titleIdx >= 0) filters[titleIdx] = titleFilter;
        else filters.push(titleFilter);
      } else {
        if (titleIdx >= 0) filters.splice(titleIdx, 1);
      }
    }

    // Make POST API call with JSON body
    const response = await http.post<SubCategoryListResponse>(
      API_URLS.SUB_CATEGORIES.LIST,
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
    console.error('Error fetching sub-categories:', error);
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
 * Create a new sub-category
 * Handles multipart/form-data for file upload
 */
export const createSubCategory = async (
  data: CreateSubCategoryRequest
): Promise<CreateSubCategoryResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('categoryId', String(data.categoryId));
    formData.append('branchId', String(data.branchId));
    formData.append('vendorId', String(data.vendorId));
    formData.append('status', data.status);
    formData.append('file', data.file);

    // Make API call with FormData using httpRequest
    const response = await http.post<CreateSubCategoryResponse>(
      API_URLS.SUB_CATEGORIES.CREATE,
      formData
    );

    return response;
  } catch (error) {
    console.error('Error creating sub-category:', error);
    throw error;
  }
};

/**
 * Update an existing sub-category
 * Handles multipart/form-data for file upload (file is optional)
 */
export const updateSubCategory = async (
  id: string | number,
  data: UpdateSubCategoryRequest
): Promise<UpdateSubCategoryResponse> => {
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
    const response = await http.patch<UpdateSubCategoryResponse>(
      API_URLS.SUB_CATEGORIES.UPDATE(id),
      formData,
      {
        headers: {
          'x-concurrencystamp': data.concurrencyStamp,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error updating sub-category:', error);
    throw error;
  }
};

/**
 * Fetch sub-categories by category ID
 * Uses POST request with categoryId in body
 */
export const fetchSubCategoriesByCategoryId = async (
  params: FetchParams & { categoryId: number }
): Promise<ServerPaginationResponse<SubCategoryByCategoryIdItem>> => {
  try {
    const page = params.page ?? 0;
    const pageSize = params.pageSize ?? 10;
    const pageNumber = page + 1; // Convert 0-based to 1-based

    // Build request body
    const requestBody: {
      categoryId: number;
      pageSize?: number;
      pageNumber?: number;
    } = {
      categoryId: params.categoryId,
    };

    // Add pagination if provided
    if (pageSize !== undefined) {
      requestBody.pageSize = pageSize;
    }
    if (pageNumber !== undefined) {
      requestBody.pageNumber = pageNumber;
    }

    // Make POST API call with JSON body
    const response = await http.post<SubCategoryByCategoryIdResponse>(
      API_URLS.SUB_CATEGORIES.GET_BY_CATEGORY_ID,
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
    console.error('Error fetching sub-categories by category ID:', error);
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
 * Fetch sub-category statistics
 * Uses POST request with subCategoryId, startDate, and endDate
 */
export const fetchSubCategoryStats = async (
  params: FetchSubCategoryStatsParams
): Promise<SubCategoryStats> => {
  try {
    const response = await http.post<SubCategoryStatsResponse>(
      API_URLS.SUB_CATEGORIES.GET_STATS,
      {
        subCategoryId: params.subCategoryId,
        startDate: params.startDate,
        endDate: params.endDate,
      }
    );

    if (!response.success || !response.doc) {
      throw {
        message: 'Sub-category stats not found',
        status: 404,
        data: { error: 'Sub-category stats not found' },
      };
    }

    return response.doc;
  } catch (error) {
    console.error('Error fetching sub-category stats:', error);
    throw error;
  }
};

const subCategoryService = {
  fetchSubCategories,
  createSubCategory,
  updateSubCategory,
  fetchSubCategoriesByCategoryId,
  fetchSubCategoryStats,
};

export default subCategoryService;

