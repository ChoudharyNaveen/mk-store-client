/**
 * Status Options Constants
 * Provides dropdown options for all status types used in filter sections
 */

export interface StatusOption {
  value: string;
  label: string;
}

// Order Status Options - Only these statuses are valid
export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'RETURN', label: 'Return' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'FAILED', label: 'Failed' },
];

// Payment Status Options
export const PAYMENT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'REFUNDED', label: 'Refunded' },
];

// User Status Options
export const USER_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

// Profile Status Options
export const PROFILE_STATUS_OPTIONS: StatusOption[] = [
  { value: 'COMPLETE', label: 'Complete' },
  { value: 'INCOMPLETE', label: 'Incomplete' },
  { value: 'PENDING', label: 'Pending' },
];

// Product Status Options
export const PRODUCT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Product Status Type Options (Stock Status)
export const PRODUCT_STOCK_STATUS_OPTIONS: StatusOption[] = [
  { value: 'INSTOCK', label: 'In Stock' },
  { value: 'OUTOFSTOCK', label: 'Out of Stock' },
];

// Category Status Options
export const CATEGORY_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// SubCategory Status Options
export const SUBCATEGORY_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Brand Status Options
export const BRAND_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Offer Status Options
export const OFFER_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Promocode Status Options
export const PROMOCODE_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];
