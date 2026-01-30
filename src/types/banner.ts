/**
 * Banner related types
 */

import type { ServerFilter, ServerSorting } from './filter';

export type BannerStatus = 'ACTIVE' | 'INACTIVE';

export interface Banner {
  id: number;
  vendor_id: number;
  branch_id: number;
  sub_category_id: number | null;
  image_url: string;
  display_order: number;
  status: BannerStatus;
  concurrency_stamp?: string;
  concurrencyStamp?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  // Related data (included in API responses)
  vendor?: {
    id: number;
    name: string;
    code: string;
  };
  branch?: {
    id: number;
    name: string;
    code: string;
  };
  subCategory?: {
    id: number;
    title: string;
  } | null;
}

export interface BannerListRequest {
  pageSize?: number;
  pageNumber?: number;
  filters?: ServerFilter[];
  sorting?: ServerSorting[];
}

export interface BannerListResponse {
  success: boolean;
  doc: Banner[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CreateBannerRequest {
  vendorId: number;
  branchId: number;
  subCategoryId?: number | null;
  file: File;
  displayOrder?: number;
  status?: BannerStatus;
}

export interface CreateBannerResponse {
  success: boolean;
  message?: string;
  doc?: Banner;
}

export interface UpdateBannerRequest {
  vendorId?: number;
  branchId?: number;
  subCategoryId?: number | null;
  file?: File;
  displayOrder?: number;
  status?: BannerStatus;
  updatedBy: number;
  concurrencyStamp: string;
}

export interface UpdateBannerResponse {
  success: boolean;
  message?: string;
  doc?: Banner;
}

export interface DeleteBannerResponse {
  success: boolean;
  message?: string;
}
