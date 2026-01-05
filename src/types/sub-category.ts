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

