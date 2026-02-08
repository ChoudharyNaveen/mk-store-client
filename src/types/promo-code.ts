/**
 * Promo Code related types
 */

export type PromocodeType = 'PERCENTAGE' | 'FLAT';
export type PromocodeStatus = 'ACTIVE' | 'INACTIVE';

export interface Promocode {
  id: number;
  type: PromocodeType;
  code: string;
  description: string;
  percentage: number;
  discount?: number;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  status: PromocodeStatus;
  concurrency_stamp?: string;
  created_by?: number | null;
  updated_by?: number | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PromocodeListResponse {
  success: boolean;
  doc: Promocode[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

export interface CreatePromocodeRequest {
  type: PromocodeType;
  code: string;
  description: string;
  percentage: number;
  discount?: number;
  startDate: string; // Date string format: "2024-11-20"
  endDate: string; // Date string format: "2024-12-31"
  status: PromocodeStatus;
  branchId?: string | number;
  vendorId?: string | number;
}

export interface CreatePromocodeResponse {
  success: boolean;
  message?: string;
  doc?: Promocode;
}

export interface UpdatePromocodeRequest {
  type?: PromocodeType;
  code?: string;
  description?: string;
  percentage?: number;
  discount?: number;
  startDate?: string;
  endDate?: string;
  status?: PromocodeStatus;
  updated_by?: string | number;
  concurrency_stamp?: string;
}

export interface UpdatePromocodeResponse {
  success: boolean;
  message?: string;
  doc?: Promocode;
}

export interface PromocodeSummary {
  totalRedemptions: number;
  totalDiscountsGiven: number;
}

export interface PromocodeSummaryResponse {
  success: boolean;
  doc?: PromocodeSummary;
}

