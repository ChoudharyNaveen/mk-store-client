/**
 * Brand related types
 */

export type BrandStatus = 'ACTIVE' | 'INACTIVE';

export interface Brand {
  id: number;
  name: string;
  description: string;
  logo?: string; // API returns 'logo' field
  image?: string; // Legacy field, kept for backward compatibility
  status: BrandStatus;
  concurrencyStamp?: string;
  createdAt?: string;
  created_at?: string; // API returns snake_case
}

export interface BrandListResponse {
  success: boolean;
  doc: Brand[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

export interface CreateBrandRequest {
  name: string;
  description: string;
  branchId: string | number;
  vendorId: string | number;
  status: BrandStatus;
  file: File;
}

export interface CreateBrandResponse {
  success: boolean;
  message?: string;
  doc?: Brand;
}

export interface UpdateBrandRequest {
  name: string;
  description: string;
  updatedBy: string | number;
  concurrencyStamp: string;
  file?: File; // Optional for updates
  status?: BrandStatus; // Optional for status-only toggle
}

export interface UpdateBrandResponse {
  success: boolean;
  message?: string;
  doc?: Brand;
}

