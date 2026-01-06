/**
 * User Service
 * Handles all user-related API calls with server pagination support
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { User, UserListResponse, CreateUserRequest, CreateUserResponse, UpdateUserRequest, UpdateUserResponse, UserRole } from '../types/user';
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
  tab?: UserRole; // Tab parameter for filtering USER or RIDER
}

/**
 * Server pagination response format expected by the hook
 */
export interface ServerPaginationResponse<T = User> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch users with server pagination support
 * Uses POST request with JSON body containing pagination, filters, and sorting
 * Tab parameter is added as query parameter in the URL
 */
export const fetchUsers = async (
  params: FetchParams
): Promise<ServerPaginationResponse<User>> => {
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

    if (params.searchKeyword && params.searchKeyword.trim()) {
      if (!requestBody.filters) {
        requestBody.filters = [];
      }
      // Search in name, email, or phone
      requestBody.filters.push({
        key: 'name',
        iLike: params.searchKeyword.trim(),
      });
    }

    // Build URL with tab query parameter
    let url: string = API_URLS.USERS.LIST;
    if (params.tab) {
      url = `${url}?tab=${params.tab}`;
    }

    // Make POST API call with JSON body
    const response = await http.post<UserListResponse>(
      url,
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
    console.error('Error fetching users:', error);
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
 * Create a new user
 */
export const createUser = async (
  data: CreateUserRequest
): Promise<CreateUserResponse> => {
  try {
    const response = await http.post<CreateUserResponse>(
      API_URLS.USERS.CREATE,
      data
    );
    return response;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update an existing user
 */
export const updateUser = async (
  id: string | number,
  data: UpdateUserRequest
): Promise<UpdateUserResponse> => {
  try {
    const response = await http.put<UpdateUserResponse>(
      API_URLS.USERS.UPDATE(id),
      data
    );
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (
  id: string | number
): Promise<void> => {
  try {
    await http.delete(API_URLS.USERS.DELETE(id));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Convert user to rider
 */
export const convertUserToRider = async (
  userId: string | number
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await http.post<{ success: boolean; message?: string }>(
      API_URLS.USERS.CONVERT_TO_RIDER,
      { userId }
    );
    return response;
  } catch (error) {
    console.error('Error converting user to rider:', error);
    throw error;
  }
};

const userService = {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  convertUserToRider,
};

export default userService;
