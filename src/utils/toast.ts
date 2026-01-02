/**
 * Toast Utility Functions
 * Helper functions for showing toast notifications
 */

import { getToastService } from '../contexts/ToastContext';
import type { ApiError } from './http';

/**
 * API Error Response Format
 */
export interface ApiErrorResponse {
  success: false;
  errors: {
    message: string;
    code?: string;
  };
}

/**
 * Show API error toast
 * Handles the standard API error response format
 */
export const showApiErrorToast = (
  error: unknown,
  defaultMessage: string = 'An error occurred. Please try again.'
): void => {
  const toastService = getToastService();

  if (!toastService) {
    console.error('Toast service not available. Make sure ToastProvider is set up.');
    console.error('Error:', error);
    return;
  }

  let errorMessage = defaultMessage;
  let errorTitle: string | undefined;

  // Handle ApiErrorResponse format
  if (error && typeof error === 'object') {
    const apiError = error as ApiError;
    
    // Check if it's the standard API error response format
    if ('data' in apiError && apiError.data) {
      const errorData = apiError.data as ApiErrorResponse;
      
      if (errorData.success === false && errorData.errors) {
        errorMessage = errorData.errors.message || defaultMessage;
        errorTitle = errorData.errors.code || 'Error';
        toastService.showErrorToast(errorMessage, errorTitle);
        return;
      }
    }
    
    // Handle ApiError format (from http.ts)
    if ('message' in apiError) {
      errorMessage = apiError.message || defaultMessage;
      errorTitle = apiError.status ? `Error ${apiError.status}` : 'Error';
    }
  } else if (error instanceof Error) {
    errorMessage = error.message || defaultMessage;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  toastService.showErrorToast(errorMessage, errorTitle);
};

/**
 * Show success toast
 */
export const showSuccessToast = (message: string, title?: string): void => {
  const toastService = getToastService();

  if (!toastService) {
    console.log('Success:', message);
    return;
  }

  toastService.showSuccessToast(message, title);
};

/**
 * Show error toast (generic)
 */
export const showErrorToast = (message: string, title?: string): void => {
  const toastService = getToastService();

  if (!toastService) {
    console.error('Error:', message);
    return;
  }

  toastService.showErrorToast(message, title);
};

