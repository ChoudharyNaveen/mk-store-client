/**
 * Order Service
 * Handles all order-related API calls with server pagination support
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { Order, OrderListResponse } from '../types/order';
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
export interface ServerPaginationResponse<T = Order> {
  list: T[];
  totalCount: number;
  pageDetails?: {
    pageNumber?: number;
    pageSize?: number;
    paginationEnabled?: boolean;
  };
}

/**
 * Fetch orders with server pagination support
 * Uses POST request with JSON body containing pagination, filters, and sorting
 */
export const fetchOrders = async (
  params: FetchParams
): Promise<ServerPaginationResponse<Order>> => {
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
        key: 'order_number',
        iLike: params.searchKeyword,
      });
    }

    // Make POST API call with JSON body
    const response = await http.post<OrderListResponse>(
      API_URLS.ORDERS.LIST,
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
    console.error('Error fetching orders:', error);
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
 * Order Details Response Interface
 */
export interface OrderDetailsResponse {
  success: boolean;
  data: {
    order_id: number;
    order_number: string;
    concurrency_stamp?: string;
    order_items: Array<{
      id: number;
      product: {
        id: number;
        title: string;
        image?: string;
        selling_price: number;
        price: number;
      };
      variant?: {
        id: number;
        name: string;
        selling_price: number;
        variant_name?: string;
        variant_type?: string;
        variant_value?: string;
      };
      quantity: number;
      unit_price: number;
      discount: number;
      total: number;
      is_combo?: boolean;
    }>;
    summary: {
      subtotal: number;
      discount: number;
      shipping: number;
      total: number;
    };
    applied_discounts: Array<{
      type: string;
      code?: string;
      description: string;
      discount_amount: number;
      status: string;
    }>;
    customer_information: {
      name: string;
      email: string;
      mobile_number: string;
    };
    delivery_address: {
      recipient_name: string;
      address_line_1: string;
      address_line_2?: string;
      street_details?: string;
      landmark?: string;
      city?: string;
      state?: string;
      country?: string;
      postal_code?: string;
      mobile_number?: string;
    };
    order_information: {
      order_date: string;
      estimated_delivery?: string | null;
      priority: string;
      payment_status: string;
      order_status: string;
    };
    status_history?: Array<{
      id: number;
      status: string;
      previous_status: string | null;
      notes: string | null;
      changed_by: {
        id: number;
        name: string | null;
        email: string | null;
      };
      changed_at: string;
    }>;
  };
}

/**
 * Fetch order details by ID
 */
export const fetchOrderDetails = async (id: string | number): Promise<OrderDetailsResponse['data']> => {
  try {
    const response = await http.post<OrderDetailsResponse>(
      API_URLS.ORDERS.GET_DETAILS,
      { orderId: String(id) }
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to fetch order details');
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

/**
 * Update Order Request Interface
 */
export interface UpdateOrderRequest {
  status: string;
  updatedBy: number;
  concurrencyStamp: string;
  notes?: string;
}

/**
 * Update Order Response Interface
 */
export interface UpdateOrderResponse {
  success: boolean;
  message?: string;
  data?: Order;
}

/**
 * Common function to update order status
 * @param orderId - The ID of the order to update
 * @param status - The new status (e.g., 'ACCEPTED', 'READY_FOR_PICKUP', 'REJECTED')
 * @param concurrencyStamp - The concurrency stamp from the order
 * @param updatedBy - The ID of the user making the update
 * @param notes - Optional notes/reason for the update (required for REJECTED status)
 */
export const updateOrder = async (
  orderId: string | number,
  status: string,
  concurrencyStamp: string,
  updatedBy: number,
  notes?: string
): Promise<UpdateOrderResponse> => {
  try {
    const url = API_URLS.ORDERS.UPDATE(orderId);
    const requestBody: UpdateOrderRequest = {
      status,
      updatedBy,
      concurrencyStamp,
    };

    // Add notes if provided (e.g., for rejection reason)
    if (notes) {
      requestBody.notes = notes;
    }

    // Add concurrencyStamp as header
    const response = await http.patch<UpdateOrderResponse>(
      url,
      requestBody,
      {
        headers: {
          'x-concurrencystamp': concurrencyStamp,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

const orderService = {
  fetchOrders,
  fetchOrderDetails,
  updateOrder,
};

export default orderService;


