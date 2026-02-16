/**
 * Address type for get-address API response
 */

export interface Address {
  id: number;
  address_line_1: string;
  address_line_2: string | null;
  street: string;
  landmark: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  name: string;
  mobile_number: string;
  phone: string | null;
  email: string | null;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  concurrency_stamp: string;
}

export interface AddressListResponse {
  success: boolean;
  doc: Address[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}
