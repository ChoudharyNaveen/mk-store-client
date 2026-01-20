/**
 * HTTP Utility Functions
 * Provides a centralized way to make API calls with error handling, interceptors, and token management
 */

import config from '../config/env';
import { showApiErrorToast } from './toast';

export interface HttpRequestOptions extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
  showErrorToast?: boolean; // Whether to automatically show error toast
}

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

/**
 * Get authentication token from storage
 */
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Set authentication token in storage
 */
export const setAuthToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

/**
 * Get user data from storage
 */
export const getUserData = (): unknown | null => {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Set user data in storage
 */
export const setUserData = (user: unknown): void => {
  try {
    localStorage.setItem('user_data', JSON.stringify(user));
  } catch (error) {
    console.error('Error setting user data:', error);
  }
};

/**
 * Clear authentication data
 */
export const clearAuthData = (): void => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

/**
 * Create a timeout promise
 */
const createTimeoutPromise = (timeout: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
  });
};

/**
 * Build full URL from endpoint
 */
const buildUrl = (endpoint: string): string => {
  // If endpoint already includes the base URL, return as is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const baseUrl = config.apiBaseUrl.endsWith('/') 
    ? config.apiBaseUrl.slice(0, -1) 
    : config.apiBaseUrl;
  
  return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * Make HTTP request with timeout and error handling
 */
const httpRequest = async <T = unknown>(
  url: string,
  options: HttpRequestOptions = {}
): Promise<T> => {
  const {
    timeout = config.apiTimeout,
    skipAuth = false,
    showErrorToast = true, // Default to showing error toasts
    headers = {},
    ...fetchOptions
  } = options;

  // Build full URL
  const fullUrl = buildUrl(url);

  // Check if body is FormData
  const isFormData = fetchOptions.body instanceof FormData;

  // Prepare headers
  const requestHeaders: HeadersInit = {
    // Don't set Content-Type for FormData - browser will set it with boundary
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...headers,
  };

  // Add authentication token if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await Promise.race([
      fetch(fullUrl, {
        ...fetchOptions,
        headers: requestHeaders,
        signal: controller.signal,
      }),
      createTimeoutPromise(timeout),
    ]);

    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      const error: ApiError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        data: errorData,
      };

      // Handle 401 Unauthorized - clear auth and redirect to login
      if (response.status === 401 && !skipAuth) {
        clearAuthData();
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // Show error toast if enabled
      if (showErrorToast) {
        showApiErrorToast(error);
      }

      throw error;
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return (await response.text()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    let apiError: ApiError;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        apiError = {
          message: 'Request timeout. Please try again.',
          status: 408,
        };
      } else {
        apiError = {
          message: error.message || 'Network error occurred',
        };
      }
    } else if (error && typeof error === 'object' && 'message' in error) {
      apiError = error as ApiError;
    } else {
      apiError = {
        message: 'An unexpected error occurred',
      };
    }

    // Show error toast if enabled
    if (showErrorToast) {
      showApiErrorToast(apiError);
    }

    throw apiError;
  }
};

/**
 * HTTP Client with common methods
 */
export const http = {
  /**
   * GET request
   */
  get: <T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> => {
    return httpRequest<T>(url, {
      ...options,
      method: 'GET',
    });
  },

  /**
   * POST request
   */
  post: <T = unknown>(
    url: string,
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<T> => {
    // If data is FormData, use it directly; otherwise stringify JSON
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
    return httpRequest<T>(url, {
      ...options,
      method: 'POST',
      body,
    });
  },

  /**
   * PUT request
   */
  put: <T = unknown>(
    url: string,
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<T> => {
    // If data is FormData, use it directly; otherwise stringify JSON
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
    return httpRequest<T>(url, {
      ...options,
      method: 'PUT',
      body,
    });
  },

  /**
   * PATCH request
   */
  patch: <T = unknown>(
    url: string,
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<T> => {
    // If data is FormData, use it directly; otherwise stringify JSON
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
    return httpRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body,
    });
  },

  /**
   * DELETE request
   */
  delete: <T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> => {
    return httpRequest<T>(url, {
      ...options,
      method: 'DELETE',
    });
  },
};

export default http;

