/**
 * Error logging utilities for enhanced diagnostics
 */

interface ErrorContext {
  [key: string]: any;
}

/**
 * Enhanced error logger with context
 */
export function logError(
  operation: string,
  error: any,
  context?: ErrorContext
): void {
  const errorDetails = {
    operation,
    message: error.message || 'Unknown error',
    type: error.type,
    code: error.code,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString()
  };

  console.error(`[Error] ${operation}:`, errorDetails);
}

/**
 * Enhanced info logger with context
 */
export function logInfo(
  operation: string,
  message: string,
  context?: ErrorContext
): void {
  const logDetails = {
    operation,
    message,
    ...context,
    timestamp: new Date().toISOString()
  };

  console.log(`[Info] ${operation}:`, logDetails);
}

/**
 * Enhanced warning logger with context
 */
export function logWarning(
  operation: string,
  message: string,
  context?: ErrorContext
): void {
  const logDetails = {
    operation,
    message,
    ...context,
    timestamp: new Date().toISOString()
  };

  console.warn(`[Warning] ${operation}:`, logDetails);
}

/**
 * Format Stripe error for user-friendly display
 */
export function formatStripeError(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Handle Stripe-specific error codes
  if (error.type === 'StripeCardError') {
    return `Payment failed: ${error.message}`;
  }

  if (error.type === 'StripeInvalidRequestError') {
    return `Invalid request: ${error.message}`;
  }

  if (error.type === 'StripeAPIError') {
    return 'Stripe service temporarily unavailable. Please try again.';
  }

  if (error.type === 'StripeConnectionError') {
    return 'Network error connecting to Stripe. Please check your connection.';
  }

  if (error.type === 'StripeAuthenticationError') {
    return 'Stripe authentication failed. Please reconnect your Stripe account.';
  }

  if (error.type === 'StripeRateLimitError') {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Default to the error message
  return error.message || 'An error occurred with Stripe';
}

/**
 * Format Supabase error for user-friendly display
 */
export function formatSupabaseError(error: any): string {
  if (!error) return 'An unknown database error occurred';

  // Handle common Supabase/PostgreSQL error codes
  if (error.code === '23505') {
    return 'A record with this information already exists.';
  }

  if (error.code === '23503') {
    return 'This operation would violate a database constraint.';
  }

  if (error.code === '42P01') {
    return 'Database table not found. Please contact support.';
  }

  if (error.code === '42703') {
    return 'Database column not found. Please contact support.';
  }

  if (error.code === 'PGRST116') {
    return 'Record not found.';
  }

  // Network or connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Default to the error message
  return error.message || 'A database error occurred';
}

/**
 * Create a standardized error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  timestamp: string;
}

export function createErrorResponse(
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a standardized success response
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}
