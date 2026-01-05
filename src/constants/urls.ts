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
    LIST: `${API_PREFIX}/users`,
    CREATE: `${API_PREFIX}/users`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/users/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/users/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/users/${id}`,
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
  },
  
  // Product endpoints
  PRODUCTS: {
    LIST: `${API_PREFIX}/get-product`,
    CREATE: `${API_PREFIX}/save-product`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/products/${id}`,
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
    LIST: `${API_PREFIX}/orders`,
    CREATE: `${API_PREFIX}/orders`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/orders/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/orders/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/orders/${id}`,
  },
  
  // Branch endpoints
  BRANCHES: {
    LIST: `${API_PREFIX}/get-branch`,
  },
} as const;

export default API_URLS;

