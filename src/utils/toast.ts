/**
 * Toast Utility Functions
 * Helper functions for showing toast notifications
 */

import { getToastService } from '../contexts/ToastContext';
import type { ApiError } from './http';

/**
 * Validation Error Format
 */
export interface ValidationError {
  name: string;
  message: string;
}

/**
 * API Error Response Format
 */
export interface ApiErrorResponse {
  success: false;
  errors: {
    message: string;
    code?: string;
  };
  message?: string;
  validationErrors?: ValidationError[];
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

  // Helper function to extract error data from various structures
  const extractErrorData = (err: unknown): ApiErrorResponse | null => {
    if (!err || typeof err !== 'object') return null;
    
    const apiError = err as ApiError;
    
    // Check if error data is nested in 'data' property (from http.ts)
    if ('data' in apiError && apiError.data && typeof apiError.data === 'object') {
      return apiError.data as ApiErrorResponse;
    }
    
    // Check if error itself is the ApiErrorResponse structure
    if ('success' in apiError || 'validationErrors' in apiError || 'errors' in apiError) {
      return apiError as unknown as ApiErrorResponse;
    }
    
    return null;
  };

  // Handle ApiErrorResponse format
  if (error && typeof error === 'object') {
    const errorData = extractErrorData(error);
    
    if (errorData) {
      // Handle validation errors first (most specific)
      if (errorData.validationErrors && Array.isArray(errorData.validationErrors) && errorData.validationErrors.length > 0) {
        // Format validation errors: "field1: message1\nfield2: message2"
        const validationMessages = errorData.validationErrors.map(
          (err) => `${err.name}: ${err.message}`
        );
        errorMessage = validationMessages.join('\n');
        errorTitle = errorData.errors?.code || errorData.message || 'Validation Error';
        toastService.showErrorToast(errorMessage, errorTitle);
        return;
      }
      
      // Handle standard API error response
      if (errorData.success === false && errorData.errors) {
        errorMessage = errorData.errors.message || defaultMessage;
        errorTitle = errorData.errors.code || 'Error';
        toastService.showErrorToast(errorMessage, errorTitle);
        return;
      }
    }
    
    // Handle ApiError format (from http.ts) - fallback to message
    const apiError = error as ApiError;
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

