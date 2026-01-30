/**
 * Category related types
 */

export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface Category {
  id: number;
  title: string;
  description: string;
  image: string;
  status: CategoryStatus;
  concurrencyStamp?: string;
}

export interface CategoryListResponse {
  success: boolean;
  doc: Category[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

export interface CreateCategoryRequest {
  title: string;
  description: string;
  branchId: string | number;
  vendorId: string | number;
  status: CategoryStatus;
  file: File;
}

export interface CreateCategoryResponse {
  success: boolean;
  message?: string;
  doc?: Category;
}

export interface UpdateCategoryRequest {
  title: string;
  description: string;
  updatedBy: string | number;
  concurrencyStamp: string;
  file?: File; // Optional for updates
  status?: CategoryStatus; // Optional for status-only toggle
}

export interface UpdateCategoryResponse {
  success: boolean;
  message?: string;
  doc?: Category;
}

