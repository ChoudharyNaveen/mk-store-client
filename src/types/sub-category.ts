/**
 * Sub-category related types
 */

export type SubCategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface SubCategory {
  id: number;
  title: string;
  description: string;
  image: string;
  categoryId: number;
  category?: {
    id: number;
    title: string;
  };
  status: SubCategoryStatus;
  concurrencyStamp?: string;
  createdAt?: string;
}

export interface SubCategoryListResponse {
  success: boolean;
  doc: SubCategory[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

export interface CreateSubCategoryRequest {
  title: string;
  description: string;
  categoryId: string | number;
  branchId: string | number;
  vendorId: string | number;
  status: SubCategoryStatus;
  file: File;
}

export interface CreateSubCategoryResponse {
  success: boolean;
  message?: string;
  doc?: SubCategory;
}

export interface UpdateSubCategoryRequest {
  title: string;
  description: string;
  updatedBy: string | number;
  concurrencyStamp: string;
  file?: File; // Optional for updates
}

export interface UpdateSubCategoryResponse {
  success: boolean;
  message?: string;
  doc?: SubCategory;
}

export interface SubCategoryByCategoryIdItem {
  id: number;
  name: string;
  products_count: number;
  status: SubCategoryStatus;
}

export interface SubCategoryByCategoryIdResponse {
  success: boolean;
  doc: SubCategoryByCategoryIdItem[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

export interface SubCategoryStats {
  sub_category_id: number;
  sub_category_title: string;
  total_products: number;
  active_products: number;
  total_revenue: number;
  out_of_stock: number;
  charts: {
    product_status_distribution: {
      active: number;
      inactive: number;
    };
    stock_status_distribution: {
      in_stock: number;
      low_stock: number;
      out_of_stock: number;
    };
  };
}

export interface SubCategoryStatsResponse {
  success: boolean;
  doc: SubCategoryStats;
}

export interface FetchSubCategoryStatsParams {
  subCategoryId: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}
