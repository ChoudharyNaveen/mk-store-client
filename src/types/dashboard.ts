/**
 * Dashboard-related types (inventory alerts, expiring / low stock variants).
 */
export type ExpiringProductVariant = {
    id: number;
    productId: number;
    productName: string;
    variantId: number;
    variantName: string;
    quantity: number;
    expiryDate: Date;
    sellingPrice: number;
    category: string;
};

export type LowStockProduct = {
    id: number;
    productId: number;
    productName: string;
    variantId: number;
    variantName: string;
    stock: number;
    price: number;
    category: string;
    status: string;
    thresholdStock: number;
};

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
    in?: (string | number)[];
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
 * Low Stock Product Variant (API Response)
 */
export interface LowStockProductVariantResponse {
  variant_id: number;
  variant_name: string;
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  stock: number;
  price: number;
  product_status: string;
  threshold_stock: number;
}

/**
 * Low Stock Products API Response
 */
export interface LowStockProductsResponse {
  success: boolean;
  doc: LowStockProductVariantResponse[];
  pagination: {
    pageSize: number;
    pageNumber: number; // 1-based
    totalCount: number;
    paginationEnabled: boolean;
  };
}
