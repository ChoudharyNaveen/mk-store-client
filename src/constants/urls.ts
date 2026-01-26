/**
 * API URL Constants
 * Centralized URL management for all API endpoints
 */

const API_PREFIX = '';

export const API_URLS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_PREFIX}/auth-login`,
    LOGOUT: `${API_PREFIX}/auth-logout`,
    REFRESH_TOKEN: `${API_PREFIX}/auth-refresh`,
    FORGOT_PASSWORD: `${API_PREFIX}/auth-forgot-password`,
    RESET_PASSWORD: `${API_PREFIX}/auth-reset-password`,
  },
  
  // User endpoints
  USERS: {
    LIST: `${API_PREFIX}/get-users`,
    CREATE: `${API_PREFIX}/users`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/users/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/update-user/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/users/${id}`,
    CONVERT_TO_RIDER: `${API_PREFIX}/convert-user-to-rider`,
  },
  
  // Category endpoints
  CATEGORIES: {
    LIST: `${API_PREFIX}/get-category`,
    CREATE: `${API_PREFIX}/save-category`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/categories/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/update-category/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/categories/${id}`,
  },
  
  // Sub-category endpoints
  SUB_CATEGORIES: {
    LIST: `${API_PREFIX}/get-sub-category`,
    CREATE: `${API_PREFIX}/save-sub-category`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/sub-categories/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/update-sub-category/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/sub-categories/${id}`,
    GET_BY_CATEGORY_ID: `${API_PREFIX}/get-sub-categories-by-category-id`,
    GET_STATS: `${API_PREFIX}/get-sub-category-stats`,
  },
  
  // Product endpoints
  PRODUCTS: {
    LIST: `${API_PREFIX}/get-product`,
    CREATE: `${API_PREFIX}/save-product`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/products/${id}`,
    GET_DETAILS: (id: string | number) => `${API_PREFIX}/get-product-details/${id}`,
    GET_STATS: `${API_PREFIX}/get-product-stats`,
    GET_INVENTORY_MOVEMENTS: `${API_PREFIX}/get-inventory-movements`,
    UPDATE: (id: string | number) => `${API_PREFIX}/update-product/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/products/${id}`,
  },
  
  // Promo code endpoints
  PROMO_CODES: {
    LIST: `${API_PREFIX}/get-Promocode`,
    CREATE: `${API_PREFIX}/save-Promocode`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/get-Promocode/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/update-Promocode/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/delete-Promocode/${id}`,
  },
  
  // Offer endpoints
  OFFERS: {
    LIST: `${API_PREFIX}/get-offer`,
    CREATE: `${API_PREFIX}/save-offer`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/get-offer/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/update-offer/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/delete-offer/${id}`,
  },
  
  // Order endpoints
  ORDERS: {
    LIST: `${API_PREFIX}/get-order`,
    CREATE: `${API_PREFIX}/orders`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/orders/${id}`,
    GET_DETAILS: `${API_PREFIX}/get-order-details`,
    UPDATE: (id: string | number) => `${API_PREFIX}/update-order/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/orders/${id}`,
  },
  
  // Branch endpoints
  BRANCHES: {
    LIST: `${API_PREFIX}/get-branch`,
  },
  
  // Brand endpoints
  BRANDS: {
    LIST: `${API_PREFIX}/get-brand`,
    CREATE: `${API_PREFIX}/save-brand`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/brands/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/update-brand/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/brands/${id}`,
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    LIST: `${API_PREFIX}/get-notifications`,
    GET_UNREAD_COUNT: `${API_PREFIX}/get-unread-notification-count`,
    MARK_READ: (id: string | number) => `${API_PREFIX}/mark-notification-read/${id}`,
    MARK_ALL_READ: `${API_PREFIX}/mark-all-notifications-read`,
    DELETE: (id: string | number) => `${API_PREFIX}/delete-notification/${id}`,
  },
  
  // Dashboard endpoints
  DASHBOARD: {
    GET_KPIS: `${API_PREFIX}/get-dashboard-kpis`,
    GET_SALES_OVERVIEW: `${API_PREFIX}/get-sales-overview`,
    GET_SALES_BY_CATEGORY: `${API_PREFIX}/get-sales-by-category`,
    GET_TOP_PRODUCTS: `${API_PREFIX}/get-top-products`,
    GET_RECENT_ORDERS: `${API_PREFIX}/get-recent-orders`,
    GET_EXPIRING_PRODUCTS: `${API_PREFIX}/get-expiring-products`,
  },
  
  // Banner endpoints
  BANNERS: {
    LIST: `${API_PREFIX}/get-banner`,
    CREATE: `${API_PREFIX}/save-banner`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/get-banner-by-id/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/update-banner/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/delete-banner/${id}`,
  },
} as const;

export default API_URLS;

