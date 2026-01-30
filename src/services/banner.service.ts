/**
 * Banner Service
 * Handles all banner-related API calls with server pagination support
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type {
  Banner,
  BannerListRequest,
  BannerListResponse,
  CreateBannerRequest,
  CreateBannerResponse,
  UpdateBannerRequest,
  UpdateBannerResponse,
  DeleteBannerResponse,
} from '../types/banner';
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
export interface ServerPaginationResponse<T = Banner> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch banners with server pagination support
 * Uses POST request with JSON body containing pagination, filters, and sorting
 */
export const fetchBanners = async (
  params: FetchParams
): Promise<ServerPaginationResponse<Banner>> => {
  try {
    const page = params.page ?? 0;
    const pageSize = params.pageSize ?? 10;
    const pageNumber = page + 1; // Convert 0-based to 1-based

    // Build request body
    const requestBody: BannerListRequest = {
      pageSize,
      pageNumber,
    };

    // Convert filters to ServerFilter array if needed (pass through full filter objects so gte/lte/date range etc. are preserved)
    if (params.filters) {
      if (Array.isArray(params.filters)) {
        requestBody.filters = params.filters;
      } else {
        requestBody.filters = convertSimpleFiltersToServerFilters(params.filters);
      }
    }

    // Add sorting if provided
    if (params.sorting && params.sorting.length > 0) {
      requestBody.sorting = params.sorting.map((s) => ({
        key: s.key,
        direction: s.direction,
      }));
    }

    // Handle searchKeyword - convert to filter if needed
    if (params.searchKeyword) {
      if (!requestBody.filters) {
        requestBody.filters = [];
      }
      requestBody.filters.push({
        key: 'image_url',
        iLike: params.searchKeyword,
      });
    }

    // Make POST API call with JSON body
    const response = await http.post<BannerListResponse>(
      API_URLS.BANNERS.LIST,
      requestBody,
      {
        signal: params.signal,
      }
    );

    // Transform API response to hook's expected format
    // Map snake_case fields to camelCase
    const mappedList = (response.doc || []).map((banner: unknown) => {
      const b = banner as Record<string, unknown>;
      return {
        ...b,
        createdAt: b.created_at || b.createdAt,
        updatedAt: b.updated_at || b.updatedAt,
        concurrencyStamp: b.concurrency_stamp || b.concurrencyStamp,
        vendorId: b.vendor_id ?? b.vendorId,
        branchId: b.branch_id ?? b.branchId,
        subCategoryId: b.sub_category_id ?? b.subCategoryId,
        imageUrl: b.image_url ?? b.imageUrl,
        displayOrder: b.display_order ?? b.displayOrder,
        vendor: b.vendor || undefined,
        branch: b.branch || undefined,
        subCategory: b.subCategory || b.sub_category || null,
      } as unknown as Banner;
    });

    return {
      list: mappedList,
      totalCount: response.pagination?.totalCount || 0,
      pageDetails: {
        pageNumber: response.pagination?.pageNumber,
        pageSize: response.pagination?.pageSize,
        paginationEnabled: true,
      },
    };
  } catch (error) {
    console.error('Error fetching banners:', error);
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
 * Fetch banner details by ID
 * Uses GET request to fetch detailed banner information
 */
export const fetchBannerDetails = async (
  id: string | number
): Promise<Banner> => {
  try {
    const response = await http.get<{ success: boolean; doc: Banner }>(
      API_URLS.BANNERS.GET_BY_ID(id)
    );

    if (!response.success || !response.doc) {
      throw {
        message: 'Banner not found',
        status: 404,
        data: { error: 'Banner not found' },
      };
    }

    // Map snake_case fields to camelCase
    const banner = response.doc as unknown as Record<string, unknown>;
    const mappedBanner = {
      ...banner,
      createdAt: banner.created_at || banner.createdAt,
      updatedAt: banner.updated_at || banner.updatedAt,
      concurrencyStamp: banner.concurrency_stamp || banner.concurrencyStamp,
      vendorId: banner.vendor_id ?? banner.vendorId,
      branchId: banner.branch_id ?? banner.branchId,
      subCategoryId: banner.sub_category_id ?? banner.subCategoryId,
      imageUrl: banner.image_url ?? banner.imageUrl,
      displayOrder: banner.display_order ?? banner.displayOrder,
      vendor: banner.vendor || undefined,
      branch: banner.branch || undefined,
      subCategory: banner.subCategory || banner.sub_category || null,
    } as unknown as Banner;

    return mappedBanner;
  } catch (error) {
    console.error('Error fetching banner details:', error);
    throw error;
  }
};

/**
 * Create a new banner
 * Handles multipart/form-data for file upload
 */
export const createBanner = async (
  data: CreateBannerRequest
): Promise<CreateBannerResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('vendorId', String(data.vendorId));
    formData.append('branchId', String(data.branchId));
    if (data.subCategoryId !== undefined && data.subCategoryId !== null) {
      formData.append('subCategoryId', String(data.subCategoryId));
    }
    formData.append('displayOrder', String(data.displayOrder ?? 0));
    formData.append('status', data.status ?? 'ACTIVE');
    formData.append('file', data.file);

    // Make API call with FormData
    const response = await http.post<CreateBannerResponse>(
      API_URLS.BANNERS.CREATE,
      formData
    );

    return response;
  } catch (error) {
    console.error('Error creating banner:', error);
    throw error;
  }
};

/**
 * Update an existing banner
 * Handles multipart/form-data for file upload (file is optional)
 */
export const updateBanner = async (
  id: string | number,
  data: UpdateBannerRequest
): Promise<UpdateBannerResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Only include fields that are provided
    if (data.vendorId !== undefined) {
      formData.append('vendorId', String(data.vendorId));
    }
    if (data.branchId !== undefined) {
      formData.append('branchId', String(data.branchId));
    }
    if (data.subCategoryId !== undefined) {
      if (data.subCategoryId === null) {
        formData.append('subCategoryId', '');
      } else {
        formData.append('subCategoryId', String(data.subCategoryId));
      }
    }
    if (data.displayOrder !== undefined) {
      formData.append('displayOrder', String(data.displayOrder));
    }
    if (data.status !== undefined) {
      formData.append('status', data.status);
    }
    
    // Only append file if provided
    if (data.file) {
      formData.append('file', data.file);
    }
    
    // Required fields
    formData.append('updatedBy', String(data.updatedBy));
    formData.append('concurrencyStamp', data.concurrencyStamp);

    const response = await http.put<UpdateBannerResponse>(
      API_URLS.BANNERS.UPDATE(id),
      formData,
      {
        headers: {
          'x-concurrencystamp': data.concurrencyStamp,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error updating banner:', error);
    throw error;
  }
};

/**
 * Delete a banner
 */
export const deleteBanner = async (
  id: string | number,
  concurrencyStamp: string
): Promise<DeleteBannerResponse> => {
  try {
    const response = await http.delete<DeleteBannerResponse>(
      API_URLS.BANNERS.DELETE(id),
      {
        headers: {
          'x-concurrencystamp': concurrencyStamp,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error deleting banner:', error);
    throw error;
  }
};

const bannerService = {
  fetchBanners,
  fetchBannerDetails,
  createBanner,
  updateBanner,
  deleteBanner,
};

export default bannerService;
