/**
 * Branch related types
 */

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

