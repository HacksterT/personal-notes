/**
 * useErrorHandler Hook
 * 
 * This hook provides centralized error handling functionality for the LibraryStacks component.
 * It handles:
 * - Error state management with different error types
 * - User-friendly error messages
 * - Error recovery mechanisms
 * - Error logging and reporting
 * - Toast notifications for non-critical errors
 */

import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [errors, setErrors] = useState({});
  const [criticalError, setCriticalError] = useState(null);

  // Error types for different categories
  const ERROR_TYPES = {
    NETWORK: 'network',
    VALIDATION: 'validation', 
    PERMISSION: 'permission',
    NOT_FOUND: 'not_found',
    SERVER: 'server',
    UNKNOWN: 'unknown'
  };

  // User-friendly error messages
  const getErrorMessage = useCallback((error, context = '') => {
    const contextPrefix = context ? `${context}: ` : '';
    
    if (error?.message?.includes('fetch')) {
      return `${contextPrefix}Network connection failed. Please check your internet connection and try again.`;
    }
    
    if (error?.message?.includes('404')) {
      return `${contextPrefix}The requested content could not be found. It may have been deleted or moved.`;
    }
    
    if (error?.message?.includes('403') || error?.message?.includes('401')) {
      return `${contextPrefix}You don't have permission to access this content. Please check your authentication.`;
    }
    
    if (error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
      return `${contextPrefix}Server error occurred. Please try again in a few moments.`;
    }
    
    if (error?.message?.includes('timeout')) {
      return `${contextPrefix}The request took too long to complete. Please try again.`;
    }
    
    // Default message
    return `${contextPrefix}${error?.message || 'An unexpected error occurred. Please try again.'}`;
  }, []);

  // Determine error type based on error characteristics
  const getErrorType = useCallback((error) => {
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return ERROR_TYPES.NETWORK;
    }
    
    if (error?.message?.includes('404')) {
      return ERROR_TYPES.NOT_FOUND;
    }
    
    if (error?.message?.includes('403') || error?.message?.includes('401')) {
      return ERROR_TYPES.PERMISSION;
    }
    
    if (error?.message?.includes('500')) {
      return ERROR_TYPES.SERVER;
    }
    
    return ERROR_TYPES.UNKNOWN;
  }, [ERROR_TYPES]);

  // Handle non-critical errors (show toast, don't break UI)
  const handleError = useCallback((error, context = '', options = {}) => {
    const { 
      critical = false, 
      showToast = true, 
      logError = true,
      errorKey = 'general'
    } = options;

    const errorMessage = getErrorMessage(error, context);
    const errorType = getErrorType(error);

    // Log error for debugging
    if (logError) {
      console.error(`[${context || 'Error'}]`, {
        message: error?.message || error,
        type: errorType,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
    }

    // Handle critical errors that should break component rendering
    if (critical) {
      setCriticalError({
        message: errorMessage,
        type: errorType,
        context,
        timestamp: new Date().toISOString(),
        originalError: error
      });
      return;
    }

    // Handle non-critical errors
    setErrors(prev => ({
      ...prev,
      [errorKey]: {
        message: errorMessage,
        type: errorType,
        context,
        timestamp: new Date().toISOString(),
        show: showToast
      }
    }));

    // Auto-dismiss non-critical errors after 5 seconds
    if (showToast) {
      setTimeout(() => {
        dismissError(errorKey);
      }, 5000);
    }
  }, [getErrorMessage, getErrorType]);

  // Handle async operations with error catching
  const handleAsyncOperation = useCallback(async (operation, context = '', options = {}) => {
    try {
      return await operation();
    } catch (error) {
      handleError(error, context, options);
      throw error; // Re-throw so caller can handle if needed
    }
  }, [handleError]);

  // Dismiss specific error
  const dismissError = useCallback((errorKey) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setCriticalError(null);
  }, []);

  // Clear critical error (for retry scenarios)
  const clearCriticalError = useCallback(() => {
    setCriticalError(null);
  }, []);

  // Get active errors for display
  const getActiveErrors = useCallback(() => {
    return Object.entries(errors)
      .filter(([_, error]) => error.show)
      .map(([key, error]) => ({ key, ...error }));
  }, [errors]);

  // Check if there are any errors of a specific type
  const hasErrorType = useCallback((type) => {
    return Object.values(errors).some(error => error.type === type) || 
           (criticalError && criticalError.type === type);
  }, [errors, criticalError]);

  return {
    // State
    errors,
    criticalError,
    
    // Error handling functions
    handleError,
    handleAsyncOperation,
    
    // Error management
    dismissError,
    clearErrors,
    clearCriticalError,
    
    // Utility functions
    getActiveErrors,
    hasErrorType,
    getErrorMessage,
    
    // Constants
    ERROR_TYPES
  };
};