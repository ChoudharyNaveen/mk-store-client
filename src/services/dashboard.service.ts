/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';

/**
 * KPI Metric
 */
export interface KPIMetric {
  value: number;
  change: number;
  change_type: 'up' | 'down';
  period: string;
}

/**
 * Dashboard KPIs Response
 */
export interface DashboardKPIs {
  total_users: KPIMetric;
  total_orders: KPIMetric;
  revenue: KPIMetric;
  total_returns: KPIMetric;
}

/**
 * Dashboard KPIs API Response
 */
export interface DashboardKPIsResponse {
  success: boolean;
  doc: DashboardKPIs;
}

/**
 * Fetch Dashboard KPIs Request Parameters
 */
export interface FetchDashboardKPIsParams {
  vendorId: number;
  branchId: number;
}

/**
 * Sales Overview Data Point
 */
export interface SalesOverviewDataPoint {
  period_type: 'hour' | 'day' | 'week' | 'month';
  period_label: string;
  period_value: string | number;
  sales: number;
  orders: number;
  // Additional fields based on period_type
  hour?: number;
  date?: string;
  day?: string;
  day_name?: string;
  week_start?: string;
  week_number?: number;
  year?: number;
  month?: number;
}

/**
 * Sales Overview API Response
 */
export interface SalesOverviewResponse {
  success: boolean;
  doc: SalesOverviewDataPoint[];
  period_type: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Fetch Sales Overview Request Parameters
 */
export interface FetchSalesOverviewParams {
  days?: number;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  vendorId?: number;
  branchId?: number;
}

/**
 * Fetch dashboard KPIs
 */
export const fetchDashboardKPIs = async (
  params: FetchDashboardKPIsParams
): Promise<DashboardKPIs> => {
  try {
    const response = await http.post<DashboardKPIsResponse>(
      API_URLS.DASHBOARD.GET_KPIS,
      params
    );

    if (response.success && response.doc) {
      return response.doc;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    throw error;
  }
};

/**
 * Fetch sales overview data
 */
export const fetchSalesOverview = async (
  params: FetchSalesOverviewParams = {}
): Promise<SalesOverviewDataPoint[]> => {
  try {
    const response = await http.post<SalesOverviewResponse>(
      API_URLS.DASHBOARD.GET_SALES_OVERVIEW,
      params
    );

    if (response.success && response.doc) {
      return response.doc;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching sales overview:', error);
    throw error;
  }
};

/**
 * Sales by Category Data Point
 */
export interface SalesByCategoryDataPoint {
  category_id: number;
  category_name: string;
  sales: number;
  order_count: number;
  percentage: string;
}

/**
 * Sales by Category API Response
 */
export interface SalesByCategoryResponse {
  success: boolean;
  doc: SalesByCategoryDataPoint[];
}

/**
 * Fetch Sales by Category Request Parameters
 */
export interface FetchSalesByCategoryParams {
  vendorId?: number;
  branchId?: number;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
}

/**
 * Fetch sales by category data
 */
export const fetchSalesByCategory = async (
  params: FetchSalesByCategoryParams = {}
): Promise<SalesByCategoryDataPoint[]> => {
  try {
    const response = await http.post<SalesByCategoryResponse>(
      API_URLS.DASHBOARD.GET_SALES_BY_CATEGORY,
      params
    );

    if (response.success && response.doc) {
      return response.doc;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching sales by category:', error);
    throw error;
  }
};

/**
 * Top Product Data Point
 */
export interface TopProductDataPoint {
  rank: number;
  product_id: number;
  product_name: string;
  revenue: number;
  orders: number;
  trend: number;
  trend_type: 'up' | 'down';
}

/**
 * Top Products API Response
 */
export interface TopProductsResponse {
  success: boolean;
  doc: TopProductDataPoint[];
}

/**
 * Fetch Top Products Request Parameters
 */
export interface FetchTopProductsParams {
  limit?: number; // default: 5
  vendorId?: number;
  branchId?: number;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
}

/**
 * Fetch top products data
 */
export const fetchTopProducts = async (
  params: FetchTopProductsParams = {}
): Promise<TopProductDataPoint[]> => {
  try {
    const response = await http.post<TopProductsResponse>(
      API_URLS.DASHBOARD.GET_TOP_PRODUCTS,
      params
    );

    if (response.success && response.doc) {
      return response.doc;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching top products:', error);
    throw error;
  }
};

/**
 * Recent Order Data Point
 */
export interface RecentOrderDataPoint {
  order_id: number;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
  price: number;
  time_ago: string;
  created_at: string;
}

/**
 * Recent Orders API Response
 */
export interface RecentOrdersResponse {
  success: boolean;
  doc: RecentOrderDataPoint[];
}

/**
 * Fetch Recent Orders Request Parameters
 */
export interface FetchRecentOrdersParams {
  limit?: number; // default: 5
  vendorId?: number;
  branchId?: number;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
}

/**
 * Fetch recent orders data
 */
export const fetchRecentOrders = async (
  params: FetchRecentOrdersParams = {}
): Promise<RecentOrderDataPoint[]> => {
  try {
    const response = await http.post<RecentOrdersResponse>(
      API_URLS.DASHBOARD.GET_RECENT_ORDERS,
      params
    );

    if (response.success && response.doc) {
      return response.doc;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw error;
  }
};

/**
 * Expiring Product Variant (API Response)
 */
export interface ExpiringProductVariantResponse {
  variant_id: number;
  variant_name: string;
  variant_type: string;
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  stock: number;
  price: number;
  expiry_date: string; // ISO 8601 format
  expiry_date_formatted: string;
  expiry_status: string;
  expiry_status_type: 'expired' | 'expiring_today' | 'expiring_soon';
  days_until_expiry: number;
}

/**
 * Expiring Products API Response
 */
export interface ExpiringProductsResponse {
  success: boolean;
  doc: ExpiringProductVariantResponse[];
  pagination: {
    pageSize: number;
    pageNumber: number; // 1-based
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Fetch Expiring Products Request Parameters
 */
export interface FetchExpiringProductsParams {
  pageSize?: number; // default: 10
  pageNumber?: number; // 1-based, default: 1
  vendorId?: number;
  branchId?: number;
  daysAhead?: number; // default: 30
  filters?: Array<{
    key: string;
    eq?: string;
    neq?: string;
    in?: any[];
    gt?: string;
    gte?: string;
    lt?: string;
    lte?: string;
    like?: string;
    iLike?: string;
  }>;
  sorting?: Array<{
    key: string;
    direction: 'ASC' | 'DESC';
  }>;
}

/**
 * Fetch expiring products data
 */
export const fetchExpiringProducts = async (
  params: FetchExpiringProductsParams = {}
): Promise<ExpiringProductsResponse> => {
  try {
    const response = await http.post<ExpiringProductsResponse>(
      API_URLS.DASHBOARD.GET_EXPIRING_PRODUCTS,
      params
    );

    if (response.success) {
      return response;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching expiring products:', error);
    throw error;
  }
};
