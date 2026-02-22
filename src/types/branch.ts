/**
 * Branch related types
 */

import type { ServerFilter } from './filter';

export type BranchStatus = 'ACTIVE' | 'INACTIVE';

export interface Branch {
  id: number;
  vendor_id: number;
  name: string;
  code: string;
  address_line1: string | null;
  address_line2: string | null;
  street: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  status: BranchStatus;
  concurrency_stamp: string;
  created_by: number | null;
  updated_by: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchListRequest {
  pageSize: number;
  pageNumber?: number;
  filters?: ServerFilter[];
}

export interface BranchListResponse {
  success: boolean;
  doc: Branch[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

/** Request body for update-branch (address and contact) */
export interface UpdateBranchRequest {
  address_line1?: string | null;
  address_line2?: string | null;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  updatedBy: number;
  concurrencyStamp: string;
}

