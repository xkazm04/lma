import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import type { ApiErrorCode } from './api-response';
import type { z } from 'zod';

/**
 * Field-level validation error information
 */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
  received?: unknown;
  expected?: string;
}

/**
 * Suggested fix for an error
 */
export interface SuggestedFix {
  description: string;
  action?: string;
  example?: string;
}

/**
 * Extended error details with actionable information
 */
export interface ActionableErrorDetails {
  /** Unique request ID for tracing */
  requestId: string;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Field-level validation errors */
  fieldErrors?: FieldError[];
  /** Form-level errors (not tied to a specific field) */
  formErrors?: string[];
  /** Suggested fixes for the error */
  suggestions?: SuggestedFix[];
  /** Path or resource that caused the error */
  path?: string;
  /** HTTP method used */
  method?: string;
  /** Additional context for debugging */
  context?: Record<string, unknown>;
}

/**
 * Common fix suggestions for different error types
 */
const COMMON_SUGGESTIONS: Record<string, SuggestedFix[]> = {
  UNAUTHORIZED: [
    {
      description: 'Ensure you are logged in',
      action: 'Navigate to /login and sign in with your credentials',
    },
    {
      description: 'Check if your session has expired',
      action: 'Refresh your authentication token or log in again',
    },
  ],
  FORBIDDEN: [
    {
      description: 'Verify you have the required permissions',
      action: 'Contact your administrator to request access',
    },
    {
      description: 'Check if the resource belongs to your organization',
      action: 'Verify the resource ID is correct',
    },
  ],
  NOT_FOUND: [
    {
      description: 'Verify the resource ID is correct',
      action: 'Double-check the ID in your request URL',
    },
    {
      description: 'The resource may have been deleted',
      action: 'Check if the resource still exists in the system',
    },
  ],
  VALIDATION_ERROR: [
    {
      description: 'Review the field errors below for specific issues',
      action: 'Correct the invalid fields and retry the request',
    },
  ],
  DB_ERROR: [
    {
      description: 'This may be a temporary database issue',
      action: 'Wait a moment and retry the request',
    },
    {
      description: 'If the error persists, contact support',
      action: 'Include the request ID in your support ticket',
    },
  ],
  DATABASE_ERROR: [
    {
      description: 'A database operation failed',
      action: 'Check if all required fields are provided and valid',
    },
  ],
  UPLOAD_ERROR: [
    {
      description: 'Verify the file meets size and format requirements',
      action: 'Ensure file is under 50MB and is a PDF or Word document',
    },
  ],
  LLM_ERROR: [
    {
      description: 'The AI service encountered an issue',
      action: 'Retry the request or try with a simpler input',
    },
  ],
  PROCESSING_ERROR: [
    {
      description: 'Document processing encountered an issue',
      action: 'Check if the document is valid and try re-uploading',
    },
  ],
  RATE_LIMITED: [
    {
      description: 'You have exceeded the rate limit',
      action: 'Wait before making more requests',
    },
  ],
  SERVICE_UNAVAILABLE: [
    {
      description: 'The service is temporarily unavailable',
      action: 'Retry after a few minutes',
    },
  ],
  CONFLICT: [
    {
      description: 'The resource has been modified by another process',
      action: 'Refresh the data and try again',
    },
  ],
  INTERNAL_ERROR: [
    {
      description: 'An unexpected error occurred',
      action: 'Please try again or contact support with the request ID',
    },
  ],
};

/**
 * Generates a unique request ID for tracing
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * ErrorBuilder provides a fluent API for creating standardized,
 * actionable error responses for API routes.
 *
 * @example
 * ```typescript
 * // Simple error
 * return ErrorBuilder.notFound('Deal not found')
 *   .withPath('/api/deals/123')
 *   .build();
 *
 * // Validation error with Zod
 * return ErrorBuilder.validation('Invalid request')
 *   .withZodErrors(parsed.error)
 *   .build();
 *
 * // Database error with context
 * return ErrorBuilder.database('Failed to update deal')
 *   .withContext({ dealId: id, operation: 'update' })
 *   .withSuggestion('Check if the deal exists and you have permission to modify it')
 *   .build();
 * ```
 */
export class ErrorBuilder {
  private code: ApiErrorCode | string;
  private message: string;
  private status: number;
  private requestId: string;
  private details: ActionableErrorDetails;

  private constructor(code: ApiErrorCode | string, message: string, status: number) {
    this.code = code;
    this.message = message;
    this.status = status;
    this.requestId = generateRequestId();
    this.details = {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
    };

    // Add default suggestions for known error codes
    const defaultSuggestions = COMMON_SUGGESTIONS[code];
    if (defaultSuggestions) {
      this.details.suggestions = [...defaultSuggestions];
    }
  }

  // ============================================
  // Static factory methods for common errors
  // ============================================

  /**
   * Creates a 400 Bad Request error
   */
  static badRequest(message: string): ErrorBuilder {
    return new ErrorBuilder('BAD_REQUEST', message, 400);
  }

  /**
   * Creates a 401 Unauthorized error
   */
  static unauthorized(message = 'Authentication required'): ErrorBuilder {
    return new ErrorBuilder('UNAUTHORIZED', message, 401);
  }

  /**
   * Creates a 403 Forbidden error
   */
  static forbidden(message = 'Access denied'): ErrorBuilder {
    return new ErrorBuilder('FORBIDDEN', message, 403);
  }

  /**
   * Creates a 404 Not Found error
   */
  static notFound(message = 'Resource not found'): ErrorBuilder {
    return new ErrorBuilder('NOT_FOUND', message, 404);
  }

  /**
   * Creates a 409 Conflict error
   */
  static conflict(message: string): ErrorBuilder {
    return new ErrorBuilder('CONFLICT', message, 409);
  }

  /**
   * Creates a 400 Validation Error
   */
  static validation(message = 'Invalid request'): ErrorBuilder {
    return new ErrorBuilder('VALIDATION_ERROR', message, 400);
  }

  /**
   * Creates a 500 Database Error
   */
  static database(message = 'Database operation failed'): ErrorBuilder {
    return new ErrorBuilder('DB_ERROR', message, 500);
  }

  /**
   * Creates a 500 Upload Error
   */
  static upload(message: string): ErrorBuilder {
    return new ErrorBuilder('UPLOAD_ERROR', message, 500);
  }

  /**
   * Creates a 500 LLM/AI Error
   */
  static llm(message = 'AI processing failed'): ErrorBuilder {
    return new ErrorBuilder('LLM_ERROR', message, 500);
  }

  /**
   * Creates a 500 Processing Error
   */
  static processing(message: string): ErrorBuilder {
    return new ErrorBuilder('PROCESSING_ERROR', message, 500);
  }

  /**
   * Creates a 429 Rate Limited error
   */
  static rateLimited(message = 'Too many requests'): ErrorBuilder {
    return new ErrorBuilder('RATE_LIMITED', message, 429);
  }

  /**
   * Creates a 503 Service Unavailable error
   */
  static serviceUnavailable(message = 'Service temporarily unavailable'): ErrorBuilder {
    return new ErrorBuilder('SERVICE_UNAVAILABLE', message, 503);
  }

  /**
   * Creates a 500 Internal Error
   */
  static internal(message = 'An unexpected error occurred'): ErrorBuilder {
    return new ErrorBuilder('INTERNAL_ERROR', message, 500);
  }

  /**
   * Creates an error with custom code and status
   */
  static custom(code: string, message: string, status: number): ErrorBuilder {
    return new ErrorBuilder(code, message, status);
  }

  // ============================================
  // Fluent builder methods
  // ============================================

  /**
   * Adds the request path to the error details
   */
  withPath(path: string): ErrorBuilder {
    this.details.path = path;
    return this;
  }

  /**
   * Adds the HTTP method to the error details
   */
  withMethod(method: string): ErrorBuilder {
    this.details.method = method;
    return this;
  }

  /**
   * Adds field-level errors from a Zod validation error
   */
  withZodErrors(error: z.ZodError): ErrorBuilder {
    const flattened = error.flatten();

    // Convert field errors
    this.details.fieldErrors = Object.entries(flattened.fieldErrors).map(
      ([field, messages]) => ({
        field,
        message: Array.isArray(messages) ? messages[0] : String(messages),
        code: 'INVALID_VALUE',
      })
    );

    // Add form-level errors
    if (flattened.formErrors.length > 0) {
      this.details.formErrors = flattened.formErrors;
    }

    return this;
  }

  /**
   * Adds raw flattened Zod error object to details (backward compatible)
   */
  withZodFlattened(flattened: z.ZodFlattenedError<unknown, string>): ErrorBuilder {
    // Convert field errors
    this.details.fieldErrors = Object.entries(flattened.fieldErrors).map(
      ([field, messages]) => ({
        field,
        message: Array.isArray(messages) ? messages[0] : String(messages),
        code: 'INVALID_VALUE',
      })
    );

    // Add form-level errors
    if (flattened.formErrors.length > 0) {
      this.details.formErrors = flattened.formErrors;
    }

    return this;
  }

  /**
   * Adds a single field error
   */
  withFieldError(field: string, message: string, options?: { code?: string; received?: unknown; expected?: string }): ErrorBuilder {
    if (!this.details.fieldErrors) {
      this.details.fieldErrors = [];
    }
    this.details.fieldErrors.push({
      field,
      message,
      ...options,
    });
    return this;
  }

  /**
   * Adds multiple field errors
   */
  withFieldErrors(errors: FieldError[]): ErrorBuilder {
    this.details.fieldErrors = [...(this.details.fieldErrors || []), ...errors];
    return this;
  }

  /**
   * Adds a form-level error
   */
  withFormError(error: string): ErrorBuilder {
    if (!this.details.formErrors) {
      this.details.formErrors = [];
    }
    this.details.formErrors.push(error);
    return this;
  }

  /**
   * Adds a suggested fix for the error
   */
  withSuggestion(description: string, action?: string, example?: string): ErrorBuilder {
    if (!this.details.suggestions) {
      this.details.suggestions = [];
    }
    this.details.suggestions.push({ description, action, example });
    return this;
  }

  /**
   * Replaces all suggestions with new ones
   */
  withSuggestions(suggestions: SuggestedFix[]): ErrorBuilder {
    this.details.suggestions = suggestions;
    return this;
  }

  /**
   * Clears all default suggestions
   */
  clearSuggestions(): ErrorBuilder {
    this.details.suggestions = [];
    return this;
  }

  /**
   * Adds additional context for debugging
   */
  withContext(context: Record<string, unknown>): ErrorBuilder {
    this.details.context = { ...this.details.context, ...context };
    return this;
  }

  /**
   * Sets a custom request ID (useful for request tracing from headers)
   */
  withRequestId(requestId: string): ErrorBuilder {
    this.requestId = requestId;
    this.details.requestId = requestId;
    return this;
  }

  /**
   * Overrides the HTTP status code
   */
  withStatus(status: number): ErrorBuilder {
    this.status = status;
    return this;
  }

  /**
   * Gets the request ID for logging purposes
   */
  getRequestId(): string {
    return this.requestId;
  }

  /**
   * Builds and returns the NextResponse with the error
   */
  build(): NextResponse<ApiResponse<null>> {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };

    return NextResponse.json(response, { status: this.status });
  }

  /**
   * Returns the error as a plain object (useful for non-response contexts)
   */
  toObject(): { code: string; message: string; status: number; details: ActionableErrorDetails } {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
    };
  }
}

// ============================================
// Helper functions for common patterns
// ============================================

/**
 * Creates a validation error response from a Zod safeParse result
 *
 * @example
 * ```typescript
 * const parsed = schema.safeParse(body);
 * if (!parsed.success) {
 *   return createZodValidationError(parsed.error, '/api/deals', 'POST');
 * }
 * ```
 */
export function createZodValidationError(
  error: z.ZodError,
  path?: string,
  method?: string
): NextResponse<ApiResponse<null>> {
  const builder = ErrorBuilder.validation('Validation failed')
    .withZodErrors(error);

  if (path) builder.withPath(path);
  if (method) builder.withMethod(method);

  return builder.build();
}

/**
 * Creates a not found error for a specific resource type
 *
 * @example
 * ```typescript
 * return createNotFoundError('Deal', dealId);
 * // Returns: "Deal not found with ID: abc123"
 * ```
 */
export function createNotFoundError(
  resourceType: string,
  resourceId?: string,
  path?: string
): NextResponse<ApiResponse<null>> {
  const message = resourceId
    ? `${resourceType} not found with ID: ${resourceId}`
    : `${resourceType} not found`;

  const builder = ErrorBuilder.notFound(message);

  if (resourceId) {
    builder.withContext({ resourceType, resourceId });
  }
  if (path) {
    builder.withPath(path);
  }

  builder.withSuggestion(
    `Verify the ${resourceType.toLowerCase()} ID is correct`,
    `Check that the ${resourceType.toLowerCase()} exists and you have access to it`
  );

  return builder.build();
}

/**
 * Creates a database error with operation context
 *
 * @example
 * ```typescript
 * return createDatabaseError('Failed to update deal', { dealId: id, operation: 'update' });
 * ```
 */
export function createDatabaseError(
  message: string,
  context?: Record<string, unknown>,
  path?: string
): NextResponse<ApiResponse<null>> {
  const builder = ErrorBuilder.database(message);

  if (context) builder.withContext(context);
  if (path) builder.withPath(path);

  return builder.build();
}

/**
 * Creates an unauthorized error with optional context
 */
export function createUnauthorizedError(
  message = 'Authentication required',
  path?: string
): NextResponse<ApiResponse<null>> {
  const builder = ErrorBuilder.unauthorized(message);
  if (path) builder.withPath(path);
  return builder.build();
}

/**
 * Creates a forbidden error with context about required permissions
 */
export function createForbiddenError(
  message = 'Access denied',
  requiredPermission?: string,
  path?: string
): NextResponse<ApiResponse<null>> {
  const builder = ErrorBuilder.forbidden(message);

  if (requiredPermission) {
    builder.withContext({ requiredPermission });
    builder.withSuggestion(
      `This action requires the "${requiredPermission}" permission`,
      'Contact your administrator to request this permission'
    );
  }

  if (path) builder.withPath(path);

  return builder.build();
}

/**
 * Extracts request ID from headers or generates a new one
 */
export function getOrCreateRequestId(request: Request): string {
  const existingId = request.headers.get('x-request-id')
    || request.headers.get('x-correlation-id');
  return existingId || generateRequestId();
}
