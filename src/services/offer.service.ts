/**
 * Offer Service
 * Handles all offer-related API calls with server pagination support
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { Offer, OfferListResponse, CreateOfferRequest, CreateOfferResponse, UpdateOfferRequest, UpdateOfferResponse, OfferSummary, OfferSummaryResponse } from '../types/offer';
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
export interface ServerPaginationResponse<T = Offer> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch offers with server pagination support
 * Uses POST request with query params for pagination and JSON body containing filters and sorting
 */
export const fetchOffers = async (
  params: FetchParams
): Promise<ServerPaginationResponse<Offer>> => {
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
      // If searchKeyword should be a filter, add it
      // For now, we'll add it as a filter with 'iLike' operator on code
      if (!requestBody.filters) {
        requestBody.filters = [];
      }
      requestBody.filters.push({
        key: 'code',
        iLike: params.searchKeyword,
      });
    }

    // Make POST API call with JSON body
    const response = await http.post<OfferListResponse>(
      API_URLS.OFFERS.LIST,
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
    console.error('Error fetching offers:', error);
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
 * Fetch a single offer by ID
 */
export const fetchOfferById = async (id: string | number): Promise<Offer> => {
  const response = await http.post<{ success?: boolean; doc?: Offer }>(
    API_URLS.OFFERS.LIST,
    {
      filters: [
        {
          key: 'id',
          eq: id,
        },
      ],
    }
  );
  const raw = response as { doc?: Offer; success?: boolean };
  if (!raw.doc) {
    throw new Error('Offer not found');
  }
  return raw.doc?.[0];
};

/**
 * Create a new offer
 * Handles multipart/form-data for file upload
 */
export const createOffer = async (
  data: CreateOfferRequest
): Promise<CreateOfferResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('code', data.code);
    formData.append('description', data.description);
    formData.append('minOrderPrice', String(data.min_order_price));
    formData.append('percentage', String(data.percentage));
    formData.append('startDate', data.start_date);
    formData.append('endDate', data.end_date);
    formData.append('status', data.status);
    
    if (data.branchId) {
      formData.append('branch_id', String(data.branchId));
    }
    if (data.vendorId) {
      formData.append('vendor_id', String(data.vendorId));
    }
    if (data.image && data.image instanceof File) {
      formData.append('file', data.image);
    } else if (data.image && typeof data.image === 'string') {
      formData.append('image', data.image);
    }

    // Make API call with FormData using httpRequest
    const response = await http.post<CreateOfferResponse>(
      API_URLS.OFFERS.CREATE,
      formData
    );

    return response;
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
};

/**
 * Update an existing offer
 * Handles multipart/form-data for file upload (file is optional)
 */
export const updateOffer = async (
  id: string | number,
  data: UpdateOfferRequest
): Promise<UpdateOfferResponse> => {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    if (data.type) formData.append('type', data.type);
    if (data.code) formData.append('code', data.code);
    if (data.description) formData.append('description', data.description);
    if (data.min_order_price !== undefined) formData.append('minOrderPrice', String(data.min_order_price));
    if (data.percentage !== undefined) formData.append('percentage', String(data.percentage));
    if (data.start_date) formData.append('startDate', data.start_date);
    if (data.end_date) formData.append('endDate', data.end_date);
    if (data.status) formData.append('status', data.status);
    if (data.updated_by) formData.append('updatedBy', String(data.updated_by));
    formData.append('concurrencyStamp', data.concurrency_stamp);
    
    // Only append file if provided
    if (data.image && data.image instanceof File) {
      formData.append('file', data.image);
    } else if (data.image && typeof data.image === 'string') {
      formData.append('image', data.image);
    }

    // Make API call with FormData and concurrencyStamp header using httpRequest
    const response = await http.patch<UpdateOfferResponse>(
      API_URLS.OFFERS.UPDATE(id),
      formData,
      {
        headers: {
          'x-concurrencystamp': data.concurrency_stamp,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error updating offer:', error);
    throw error;
  }
};

/**
 * Fetch offer summary (total redemptions and total discounts given)
 * POST /get-offer-summary with body { id: offerId }
 */
export const fetchOfferSummary = async (
  offerId: string | number
): Promise<OfferSummary> => {
  const response = await http.post<OfferSummaryResponse>(
    API_URLS.OFFERS.GET_OFFER_SUMMARY,
    { id: Number(offerId) }
  );
  if (!response.success || !response.doc) {
    throw new Error('Offer summary not found');
  }
  return response.doc;
};

const offerService = {
  fetchOffers,
  fetchOfferById,
  createOffer,
  updateOffer,
  fetchOfferSummary,
};

export default offerService;

