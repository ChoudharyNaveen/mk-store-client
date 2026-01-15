/**
 * Order Status Constants
 * Defines status values used in API requests and responses
 */

// API Status Values (as sent to/from the backend)
export const ORDER_STATUS_API = {
  ACCEPTED: 'ACCEPTED',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED', // Alternative status for rejection
} as const;

// Mapping from API status to internal OrderStatus type
export const API_STATUS_TO_ORDER_STATUS: Record<string, import('../types/order').OrderStatus> = {
  [ORDER_STATUS_API.ACCEPTED]: 'CONFIRMED',
  [ORDER_STATUS_API.READY_FOR_PICKUP]: 'SHIPPED',
  [ORDER_STATUS_API.PENDING]: 'PENDING',
  [ORDER_STATUS_API.CONFIRMED]: 'CONFIRMED',
  [ORDER_STATUS_API.PROCESSING]: 'PROCESSING',
  [ORDER_STATUS_API.SHIPPED]: 'SHIPPED',
  [ORDER_STATUS_API.DELIVERED]: 'DELIVERED',
  [ORDER_STATUS_API.CANCELLED]: 'CANCELLED',
  [ORDER_STATUS_API.REJECTED]: 'CANCELLED', // REJECTED maps to CANCELLED for display
} as const;
