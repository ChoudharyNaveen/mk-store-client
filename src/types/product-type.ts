/**
 * Product type related types
 */

export type ProductTypeStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductType {
  id: number;
  subCategoryId: number;
  title: string;
  status: ProductTypeStatus;
  concurrencyStamp?: string;
  concurrency_stamp?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  subCategory?: {
    id: number;
    title: string;
  };
}

export interface ProductTypeListResponse {
  success?: boolean;
  doc?: ProductType[];
  list?: ProductType[];
  totalCount?: number;
  pagination?: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

export interface CreateProductTypeRequest {
  subCategoryId: number;
  title: string;
  status: ProductTypeStatus;
}

export interface CreateProductTypeResponse {
  success?: boolean;
  message?: string;
  doc?: ProductType;
}

export interface UpdateProductTypeRequest {
  title: string;
  status: ProductTypeStatus;
  updatedBy: number;
  concurrencyStamp: string;
}

export interface UpdateProductTypeResponse {
  success?: boolean;
  message?: string;
  doc?: ProductType;
}
