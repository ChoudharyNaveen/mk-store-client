/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type {
  DashboardKPIs,
  DashboardKPIsResponse,
  FetchDashboardKPIsParams,
  SalesOverviewDataPoint,
  SalesOverviewResponse,
  FetchSalesOverviewParams,
  SalesByCategoryDataPoint,
  SalesByCategoryResponse,
  FetchSalesByCategoryParams,
  TopProductDataPoint,
  TopProductsResponse,
  FetchTopProductsParams,
  RecentOrderDataPoint,
  RecentOrdersResponse,
  FetchRecentOrdersParams,
  ExpiringProductsResponse,
  FetchExpiringProductsParams,
  LowStockProductsResponse
} from '../types/dashboard';

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
 * Fetch expiring products data
 */
export const fetchExpiringProducts = async (
  params: FetchExpiringProductsParams = {}
): Promise<ExpiringProductsResponse> => {
  const response = await http.post<ExpiringProductsResponse>(
    API_URLS.DASHBOARD.GET_EXPIRING_PRODUCTS,
    params
  );

  if (response.success) {
    return response;
  }

  throw new Error('Invalid response format');
};

/**
 * Fetch low stock products data
 */
export const fetchLowStockProducts = async (
  params: FetchExpiringProductsParams = {}
): Promise<LowStockProductsResponse> => {
  const response = await http.post<LowStockProductsResponse>(
    API_URLS.DASHBOARD.GET_LOW_STOCK_PRODUCTS,
    params
  );

  if (response.success) {
    return response;
  }

  throw new Error('Invalid response format');
};
