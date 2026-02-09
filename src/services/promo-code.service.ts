/**
 * Promo Code Service
 * Handles all promo-code-related API calls with server pagination support
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { Promocode, PromocodeListResponse, CreatePromocodeRequest, CreatePromocodeResponse, UpdatePromocodeRequest, UpdatePromocodeResponse, PromocodeSummary, PromocodeSummaryResponse } from '../types/promo-code';
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
export interface ServerPaginationResponse<T = Promocode> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch promocodes with server pagination support
 * Uses POST request with JSON body containing pagination, filters, and sorting
 */
export const fetchPromocodes = async (
  params: FetchParams
): Promise<ServerPaginationResponse<Promocode>> => {
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

    // Handle searchKeyword - upsert code filter when non-empty; remove when empty so API never gets stale search
    const filters = (requestBody.filters ??= []);
    const codeIdx = filters.findIndex((f: ServerFilter) => f.key === 'code');
    if (params.searchKeyword !== undefined && params.searchKeyword !== null) {
      const trimmed = String(params.searchKeyword).trim();
      if (trimmed) {
        const codeFilter: ServerFilter = { key: 'code', iLike: trimmed };
        if (codeIdx >= 0) filters[codeIdx] = codeFilter;
        else filters.push(codeFilter);
      } else {
        if (codeIdx >= 0) filters.splice(codeIdx, 1);
      }
    }

    // Make POST API call with JSON body
    const response = await http.post<PromocodeListResponse>(
      API_URLS.PROMO_CODES.LIST,
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
    console.error('Error fetching promocodes:', error);
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
 * Fetch a single promo code by ID
 */
export const fetchPromocodeById = async (id: string | number): Promise<Promocode> => {
  const response = await http.post<{ success?: boolean; doc?: Promocode }>(
    API_URLS.PROMO_CODES.LIST,
    {
      filters: [
        {
          key: 'id',
          eq: id,
        },
      ],
    }
  );
  const raw = response as { doc?: Promocode; success?: boolean };
  if (!raw.doc) {
    throw new Error('Promo code not found');
  }
  return raw.doc?.[0];
};

/**
 * Create a new promo code
 * Uses JSON body (not multipart/form-data)
 */
export const createPromocode = async (
  data: CreatePromocodeRequest
): Promise<CreatePromocodeResponse> => {
  try {
    // Build request body
    const requestBody = {
      type: data.type,
      code: data.code,
      description: data.description,
      percentage: data.percentage,
      discount: data.discount || data.percentage, // Use percentage as discount if not provided
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    };

    // Make POST API call with JSON body
    const response = await http.post<CreatePromocodeResponse>(
      API_URLS.PROMO_CODES.CREATE,
      requestBody
    );

    return response;
  } catch (error) {
    console.error('Error creating promo code:', error);
    throw error;
  }
};

/**
 * Update an existing promo code
 * Uses JSON body (not multipart/form-data)
 */
export const updatePromocode = async (
  id: string | number,
  data: UpdatePromocodeRequest
): Promise<UpdatePromocodeResponse> => {
  try {
    // Build request body
    const requestBody: Record<string, any> = {};

    if (data.type) requestBody.type = data.type;
    if (data.code) requestBody.code = data.code;
    if (data.description) requestBody.description = data.description;
    if (data.percentage !== undefined) requestBody.percentage = data.percentage;
    if (data.discount !== undefined) requestBody.discount = data.discount;
    if (data.startDate) requestBody.startDate = data.startDate;
    if (data.endDate) requestBody.endDate = data.endDate;
    if (data.status) requestBody.status = data.status;
    if (data.updated_by) requestBody.updatedBy = data.updated_by;
    if (data.concurrency_stamp) requestBody.concurrencyStamp = data.concurrency_stamp;

    // Make PATCH API call with JSON body
    const response = await http.patch<UpdatePromocodeResponse>(
      API_URLS.PROMO_CODES.UPDATE(id),
      requestBody,
      {
        headers: {
          'x-concurrencystamp': data.concurrency_stamp,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error updating promo code:', error);
    throw error;
  }
};

/**
 * Fetch promo code summary (total redemptions and total discounts given)
 * POST /get-Promocode-summary with body { id: promocodeId }
 */
export const fetchPromocodeSummary = async (
  promocodeId: string | number
): Promise<PromocodeSummary> => {
  const response = await http.post<PromocodeSummaryResponse>(
    API_URLS.PROMO_CODES.GET_PROMOCODE_SUMMARY,
    { id: Number(promocodeId) }
  );
  if (!response.success || !response.doc) {
    throw new Error('Promo code summary not found');
  }
  return response.doc;
};

const promocodeService = {
  fetchPromocodes,
  fetchPromocodeById,
  createPromocode,
  updatePromocode,
  fetchPromocodeSummary,
};

export default promocodeService;

