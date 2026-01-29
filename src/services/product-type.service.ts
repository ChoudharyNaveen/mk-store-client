/**
 * Product type service
 * Handles get-product-type (POST, same filter pattern as get-product) and save-product-type (POST)
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type {
  ProductType,
  ProductTypeListResponse,
  CreateProductTypeRequest,
  CreateProductTypeResponse,
  UpdateProductTypeRequest,
  UpdateProductTypeResponse,
} from '../types/product-type';
import type { ServerFilter, ServerSorting } from '../types/filter';
import { convertSimpleFiltersToServerFilters } from '../utils/filterBuilder';

/**
 * Fetch parameters for server pagination hook (same pattern as product.service)
 */
export interface FetchParams {
  page?: number;
  pageSize?: number;
  searchKeyword?: string;
  filters?: Record<string, string | number | boolean | null | undefined> | ServerFilter[];
  sorting?: ServerSorting[];
  signal?: AbortSignal;
}

export interface ServerPaginationResponse<T = ProductType> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch product types with server pagination (POST, same filter pattern as get-product)
 * Request body: pageSize, pageNumber, filters?, sorting?; searchKeyword → title iLike filter
 */
export const getProductTypes = async (
  params: FetchParams
): Promise<ServerPaginationResponse<ProductType>> => {
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
    requestBody.filters = Array.isArray(params.filters)
      ? params.filters
      : convertSimpleFiltersToServerFilters(params.filters);
  }

  if (params.sorting && params.sorting.length > 0) {
    requestBody.sorting = params.sorting;
  }

  if (params.searchKeyword) {
    if (!requestBody.filters) requestBody.filters = [];
    requestBody.filters.push({
      key: 'title',
      iLike: params.searchKeyword,
    });
  }

  const response = await http.post<ProductTypeListResponse>(
    API_URLS.PRODUCT_TYPES.LIST,
    requestBody,
    { signal: params.signal }
  );

  const raw = response as ProductTypeListResponse & {
    doc?: ProductType[];
    pagination?: { totalCount?: number; pageNumber?: number; pageSize?: number; paginationEnabled?: boolean };
  };
  const list = raw.doc ?? raw.list ?? [];
  const totalCount =
    raw.pagination?.totalCount ?? (Array.isArray(list) ? list.length : 0);

  return {
    list: Array.isArray(list) ? list : [],
    totalCount,
    pageDetails: raw.pagination
      ? {
          pageNumber: raw.pagination.pageNumber,
          pageSize: raw.pagination.pageSize,
          paginationEnabled: raw.pagination.paginationEnabled,
        }
      : undefined,
  };
};

/**
 * Create a new product type (POST)
 */
export const createProductType = async (
  body: CreateProductTypeRequest
): Promise<CreateProductTypeResponse> => {
  const response = await http.post<CreateProductTypeResponse>(
    API_URLS.PRODUCT_TYPES.CREATE,
    body
  );
  return response;
};

/**
 * Update a product type (PATCH)
 */
export const updateProductType = async (
  id: number,
  body: UpdateProductTypeRequest
): Promise<UpdateProductTypeResponse> => {
  const response = await http.patch<UpdateProductTypeResponse>(
    API_URLS.PRODUCT_TYPES.UPDATE(id),
    body
  );
  return response;
};
