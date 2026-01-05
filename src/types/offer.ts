/**
 * Offer related types
 */

export type OfferType = 'SEASONAL' | 'PROMOTIONAL' | 'OTHER';
export type OfferStatus = 'ACTIVE' | 'INACTIVE';

export interface Offer {
  id: number;
  type: OfferType;
  code: string;
  description: string;
  min_order_price: number;
  percentage: number;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  image: string;
  status: OfferStatus;
  concurrency_stamp?: string;
  created_by?: number | null;
  updated_by?: number | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface OfferListResponse {
  success: boolean;
  doc: Offer[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

export interface CreateOfferRequest {
  type: OfferType;
  code: string;
  description: string;
  min_order_price: number;
  percentage: number;
  start_date: string;
  end_date: string;
  image?: File | string;
  status: OfferStatus;
  branchId?: string | number;
  vendorId?: string | number;
}

export interface CreateOfferResponse {
  success: boolean;
  message?: string;
  doc?: Offer;
}

export interface UpdateOfferRequest {
  type?: OfferType;
  code?: string;
  description?: string;
  min_order_price?: number;
  percentage?: number;
  start_date?: string;
  end_date?: string;
  image?: File | string;
  status?: OfferStatus;
  updated_by?: string | number;
  concurrency_stamp: string;
}

export interface UpdateOfferResponse {
  success: boolean;
  message?: string;
  doc?: Offer;
}

