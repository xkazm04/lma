import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

/**
 * Standard error codes used across the API
 */
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'DB_ERROR'
  | 'DATABASE_ERROR'
  | 'UPLOAD_ERROR'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'LLM_ERROR'
  | 'PROCESSING_ERROR';

/**
 * Options for error responses
 */
export interface ErrorResponseOptions {
  /** Additional error details (e.g., validation errors) */
  details?: Record<string, unknown>;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Options for success responses
 */
export interface SuccessResponseOptions {
  /** HTTP status code (default: 200) */
  status?: number;
  /** Pagination metadata for list responses */
  pagination?: PaginationMeta;
  /** Timing information in milliseconds */
  timing?: number;
}

/**
 * Creates a standardized error response.
 *
 * @param code - Error code identifying the type of error
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 500)
 * @param options - Additional options like error details
 * @returns NextResponse with standardized error format
 *
 * @example
 * // Simple error
 * return respondError('NOT_FOUND', 'Document not found', 404);
 *
 * @example
 * // Error with validation details
 * return respondError('VALIDATION_ERROR', 'Invalid request', 400, {
 *   details: parsed.error.flatten()
 * });
 */
export function respondError(
  code: ApiErrorCode | string,
  message: string,
  status: number = 500,
  options: ErrorResponseOptions = {}
): NextResponse<ApiResponse<null>> {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code,
      message,
      ...(options.details && { details: options.details }),
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized success response.
 *
 * @param data - The response data
 * @param options - Additional options like status code, pagination, timing
 * @returns NextResponse with standardized success format
 *
 * @example
 * // Simple success
 * return respondSuccess(document);
 *
 * @example
 * // Success with pagination
 * return respondSuccess(documents, {
 *   pagination: { page: 1, pageSize: 20, total: 100, totalPages: 5 }
 * });
 *
 * @example
 * // Created resource (201)
 * return respondSuccess(newDocument, { status: 201 });
 */
export function respondSuccess<T>(
  data: T,
  options: SuccessResponseOptions = {}
): NextResponse<ApiResponse<T>> {
  const { status = 200, pagination, timing } = options;

  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (pagination || timing !== undefined) {
    response.meta = {};
    if (pagination) {
      response.meta.pagination = pagination;
    }
    if (timing !== undefined) {
      response.meta.timing = timing;
    }
  }

  return NextResponse.json(response, { status });
}

// Convenience functions for common error responses

/**
 * Returns a 401 Unauthorized error response.
 */
export function respondUnauthorized(message = 'Authentication required'): NextResponse<ApiResponse<null>> {
  return respondError('UNAUTHORIZED', message, 401);
}

/**
 * Returns a 403 Forbidden error response.
 */
export function respondForbidden(message = 'Access denied'): NextResponse<ApiResponse<null>> {
  return respondError('FORBIDDEN', message, 403);
}

/**
 * Returns a 404 Not Found error response.
 */
export function respondNotFound(message = 'Resource not found'): NextResponse<ApiResponse<null>> {
  return respondError('NOT_FOUND', message, 404);
}

/**
 * Returns a 400 Validation Error response with optional details.
 */
export function respondValidationError(
  message = 'Invalid request',
  details?: Record<string, unknown>
): NextResponse<ApiResponse<null>> {
  return respondError('VALIDATION_ERROR', message, 400, { details });
}

/**
 * Returns a 500 Database Error response.
 */
export function respondDatabaseError(message = 'Database operation failed'): NextResponse<ApiResponse<null>> {
  return respondError('DB_ERROR', message, 500);
}

/**
 * Returns a 500 Internal Error response.
 */
export function respondInternalError(message = 'An unexpected error occurred'): NextResponse<ApiResponse<null>> {
  return respondError('INTERNAL_ERROR', message, 500);
}
