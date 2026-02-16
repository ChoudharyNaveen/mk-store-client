/**
 * Address Service
 * Handles get-address API with server pagination support
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { Address, AddressListResponse } from '../types/address';
import type { ServerFilter, ServerSorting } from '../types/filter';
import { convertSimpleFiltersToServerFilters } from '../utils/filterBuilder';

export interface FetchAddressParams {
  page?: number;
  pageSize?: number;
  searchKeyword?: string;
  filters?: Record<string, string | number | boolean | null | undefined> | ServerFilter[];
  sorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
  signal?: AbortSignal;
}

export interface ServerPaginationResponse<T = Address> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch addresses with server pagination (POST get-address).
 * Pass filters e.g. [{ key: 'created_by', eq: String(userId) }] to get addresses for a user.
 */
export const fetchAddresses = async (
  params: FetchAddressParams
): Promise<ServerPaginationResponse<Address>> => {
  try {
    const page = params.page ?? 0;
    const pageSize = params.pageSize ?? 10;
    const pageNumber = page + 1;

    const requestBody: {
      pageSize: number;
      pageNumber: number;
      filters?: ServerFilter[];
      sorting?: ServerSorting[];
    } = {
      pageSize,
      pageNumber,
    };

    if (params.filters) {
      if (Array.isArray(params.filters)) {
        requestBody.filters = params.filters;
      } else {
        requestBody.filters = convertSimpleFiltersToServerFilters(params.filters);
      }
    }

    if (params.sorting && params.sorting.length > 0) {
      requestBody.sorting = params.sorting.map((s) => ({
        key: s.key,
        direction: s.direction as 'ASC' | 'DESC',
      }));
    }

    const response = await http.post<AddressListResponse>(
      API_URLS.ADDRESSES.LIST,
      requestBody,
      { signal: params.signal }
    );

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
    console.error('Error fetching addresses:', error);
    return {
      list: [],
      totalCount: 0,
      pageDetails: { paginationEnabled: false },
    };
  }
};
