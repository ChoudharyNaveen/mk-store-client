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
    LIST: `${API_PREFIX}/sub-categories`,
    CREATE: `${API_PREFIX}/sub-categories`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/sub-categories/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/sub-categories/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/sub-categories/${id}`,
  },
  
  // Product endpoints
  PRODUCTS: {
    LIST: `${API_PREFIX}/products`,
    CREATE: `${API_PREFIX}/products`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/products/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/products/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/products/${id}`,
  },
  
  // Promo code endpoints
  PROMO_CODES: {
    LIST: `${API_PREFIX}/promo-codes`,
    CREATE: `${API_PREFIX}/promo-codes`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/promo-codes/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/promo-codes/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/promo-codes/${id}`,
  },
  
  // Offer endpoints
  OFFERS: {
    LIST: `${API_PREFIX}/offers`,
    CREATE: `${API_PREFIX}/offers`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/offers/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/offers/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/offers/${id}`,
  },
  
  // Order endpoints
  ORDERS: {
    LIST: `${API_PREFIX}/orders`,
    CREATE: `${API_PREFIX}/orders`,
    GET_BY_ID: (id: string | number) => `${API_PREFIX}/orders/${id}`,
    UPDATE: (id: string | number) => `${API_PREFIX}/orders/${id}`,
    DELETE: (id: string | number) => `${API_PREFIX}/orders/${id}`,
  },
} as const;

export default API_URLS;

