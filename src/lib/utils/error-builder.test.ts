import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  ErrorBuilder,
  generateRequestId,
  createZodValidationError,
  createNotFoundError,
  createDatabaseError,
  createUnauthorizedError,
  createForbiddenError,
  getOrCreateRequestId,
} from './error-builder';

describe('generateRequestId', () => {
  it('should generate a unique request ID', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
    expect(id2).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });
});

describe('getOrCreateRequestId', () => {
  it('should use existing x-request-id header if present', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-request-id': 'existing-id-123' },
    });

    expect(getOrCreateRequestId(request)).toBe('existing-id-123');
  });

  it('should use x-correlation-id as fallback', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-correlation-id': 'correlation-456' },
    });

    expect(getOrCreateRequestId(request)).toBe('correlation-456');
  });

  it('should generate a new ID if no header is present', () => {
    const request = new Request('http://localhost/api/test');
    const id = getOrCreateRequestId(request);

    expect(id).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
  });
});

describe('ErrorBuilder', () => {
  describe('static factory methods', () => {
    it('should create a badRequest error (400)', async () => {
      const response = ErrorBuilder.badRequest('Invalid input').build();
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toBe('Invalid input');
    });

    it('should create an unauthorized error (401)', async () => {
      const response = ErrorBuilder.unauthorized().build();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toBe('Authentication required');
      expect(body.error.details.suggestions).toBeDefined();
      expect(body.error.details.suggestions.length).toBeGreaterThan(0);
    });

    it('should create a forbidden error (403)', async () => {
      const response = ErrorBuilder.forbidden('Access denied').build();
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toBe('Access denied');
    });

    it('should create a notFound error (404)', async () => {
      const response = ErrorBuilder.notFound('Resource not found').build();
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Resource not found');
    });

    it('should create a conflict error (409)', async () => {
      const response = ErrorBuilder.conflict('Resource already exists').build();
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error.code).toBe('CONFLICT');
    });

    it('should create a validation error (400)', async () => {
      const response = ErrorBuilder.validation('Invalid request').build();
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should create a database error (500)', async () => {
      const response = ErrorBuilder.database('Query failed').build();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('DB_ERROR');
    });

    it('should create a rate limited error (429)', async () => {
      const response = ErrorBuilder.rateLimited().build();
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.error.code).toBe('RATE_LIMITED');
    });

    it('should create a service unavailable error (503)', async () => {
      const response = ErrorBuilder.serviceUnavailable().build();
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should create a custom error', async () => {
      const response = ErrorBuilder.custom('CUSTOM_ERROR', 'Custom message', 418).build();
      const body = await response.json();

      expect(response.status).toBe(418);
      expect(body.error.code).toBe('CUSTOM_ERROR');
      expect(body.error.message).toBe('Custom message');
    });
  });

  describe('fluent builder methods', () => {
    it('should add path and method', async () => {
      const response = ErrorBuilder.notFound('Not found')
        .withPath('/api/deals/123')
        .withMethod('GET')
        .build();

      const body = await response.json();

      expect(body.error.details.path).toBe('/api/deals/123');
      expect(body.error.details.method).toBe('GET');
    });

    it('should add context', async () => {
      const response = ErrorBuilder.database('Query failed')
        .withContext({ dealId: '123', operation: 'update' })
        .build();

      const body = await response.json();

      expect(body.error.details.context).toEqual({
        dealId: '123',
        operation: 'update',
      });
    });

    it('should add custom request ID', async () => {
      const response = ErrorBuilder.internal()
        .withRequestId('custom-request-id')
        .build();

      const body = await response.json();

      expect(body.error.details.requestId).toBe('custom-request-id');
    });

    it('should add single field error', async () => {
      const response = ErrorBuilder.validation('Validation failed')
        .withFieldError('email', 'Invalid email format', {
          received: 'not-an-email',
          expected: 'Valid email address',
        })
        .build();

      const body = await response.json();

      expect(body.error.details.fieldErrors).toHaveLength(1);
      expect(body.error.details.fieldErrors[0].field).toBe('email');
      expect(body.error.details.fieldErrors[0].message).toBe('Invalid email format');
      expect(body.error.details.fieldErrors[0].received).toBe('not-an-email');
    });

    it('should add multiple field errors', async () => {
      const response = ErrorBuilder.validation('Validation failed')
        .withFieldErrors([
          { field: 'email', message: 'Required' },
          { field: 'password', message: 'Too short' },
        ])
        .build();

      const body = await response.json();

      expect(body.error.details.fieldErrors).toHaveLength(2);
    });

    it('should add form error', async () => {
      const response = ErrorBuilder.validation('Validation failed')
        .withFormError('Passwords do not match')
        .build();

      const body = await response.json();

      expect(body.error.details.formErrors).toContain('Passwords do not match');
    });

    it('should add custom suggestion', async () => {
      const response = ErrorBuilder.notFound('Deal not found')
        .withSuggestion(
          'Check the deal ID',
          'Verify the ID is correct',
          'GET /api/deals/{id}'
        )
        .build();

      const body = await response.json();

      const customSuggestion = body.error.details.suggestions.find(
        (s: { description: string }) => s.description === 'Check the deal ID'
      );
      expect(customSuggestion).toBeDefined();
      expect(customSuggestion.action).toBe('Verify the ID is correct');
      expect(customSuggestion.example).toBe('GET /api/deals/{id}');
    });

    it('should clear default suggestions', async () => {
      const response = ErrorBuilder.unauthorized()
        .clearSuggestions()
        .build();

      const body = await response.json();

      expect(body.error.details.suggestions).toEqual([]);
    });

    it('should replace all suggestions', async () => {
      const response = ErrorBuilder.notFound()
        .withSuggestions([
          { description: 'Only suggestion', action: 'Do this' },
        ])
        .build();

      const body = await response.json();

      expect(body.error.details.suggestions).toHaveLength(1);
      expect(body.error.details.suggestions[0].description).toBe('Only suggestion');
    });

    it('should override status code', async () => {
      const response = ErrorBuilder.validation('Validation failed')
        .withStatus(422)
        .build();

      expect(response.status).toBe(422);
    });
  });

  describe('Zod integration', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().min(18, 'Must be at least 18'),
    });

    it('should convert Zod errors to field errors', async () => {
      const result = testSchema.safeParse({
        name: '',
        email: 'invalid',
        age: 15,
      });

      if (result.success) {
        throw new Error('Expected validation to fail');
      }

      const response = ErrorBuilder.validation('Validation failed')
        .withZodErrors(result.error)
        .build();

      const body = await response.json();

      expect(body.error.details.fieldErrors).toBeDefined();
      expect(body.error.details.fieldErrors.length).toBe(3);

      const nameError = body.error.details.fieldErrors.find(
        (e: { field: string }) => e.field === 'name'
      );
      const emailError = body.error.details.fieldErrors.find(
        (e: { field: string }) => e.field === 'email'
      );
      const ageError = body.error.details.fieldErrors.find(
        (e: { field: string }) => e.field === 'age'
      );

      expect(nameError.message).toBe('Name is required');
      expect(emailError.message).toBe('Invalid email');
      expect(ageError.message).toBe('Must be at least 18');
    });

    it('should handle flattened Zod errors', async () => {
      const result = testSchema.safeParse({ name: '', email: 'bad' });

      if (result.success) {
        throw new Error('Expected validation to fail');
      }

      const response = ErrorBuilder.validation('Validation failed')
        .withZodFlattened(result.error.flatten())
        .build();

      const body = await response.json();

      expect(body.error.details.fieldErrors).toBeDefined();
      expect(body.error.details.fieldErrors.length).toBeGreaterThan(0);
    });
  });

  describe('toObject', () => {
    it('should return error as plain object', () => {
      const error = ErrorBuilder.notFound('Resource not found')
        .withPath('/api/test')
        .withContext({ id: '123' })
        .toObject();

      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.status).toBe(404);
      expect(error.details.path).toBe('/api/test');
      expect(error.details.context).toEqual({ id: '123' });
    });
  });

  describe('getRequestId', () => {
    it('should return the request ID', () => {
      const builder = ErrorBuilder.internal().withRequestId('test-id');
      expect(builder.getRequestId()).toBe('test-id');
    });
  });

  describe('default suggestions', () => {
    it('should include default suggestions for known error codes', async () => {
      const errorTypes = [
        { builder: ErrorBuilder.unauthorized(), code: 'UNAUTHORIZED' },
        { builder: ErrorBuilder.forbidden(), code: 'FORBIDDEN' },
        { builder: ErrorBuilder.notFound(), code: 'NOT_FOUND' },
        { builder: ErrorBuilder.database(), code: 'DB_ERROR' },
        { builder: ErrorBuilder.internal(), code: 'INTERNAL_ERROR' },
      ];

      for (const { builder, code } of errorTypes) {
        const response = builder.build();
        const body = await response.json();

        expect(body.error.details.suggestions).toBeDefined();
        expect(body.error.details.suggestions.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Helper functions', () => {
  describe('createZodValidationError', () => {
    it('should create a validation error from Zod error', async () => {
      const schema = z.object({ name: z.string().min(1) });
      const result = schema.safeParse({ name: '' });

      if (result.success) {
        throw new Error('Expected validation to fail');
      }

      const response = createZodValidationError(result.error, '/api/test', 'POST');
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details.path).toBe('/api/test');
      expect(body.error.details.method).toBe('POST');
      expect(body.error.details.fieldErrors).toBeDefined();
    });
  });

  describe('createNotFoundError', () => {
    it('should create a not found error with resource type', async () => {
      const response = createNotFoundError('Deal', 'abc123', '/api/deals/abc123');
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.message).toBe('Deal not found with ID: abc123');
      expect(body.error.details.path).toBe('/api/deals/abc123');
      expect(body.error.details.context.resourceType).toBe('Deal');
      expect(body.error.details.context.resourceId).toBe('abc123');
    });

    it('should work without resource ID', async () => {
      const response = createNotFoundError('Document');
      const body = await response.json();

      expect(body.error.message).toBe('Document not found');
    });
  });

  describe('createDatabaseError', () => {
    it('should create a database error with context', async () => {
      const response = createDatabaseError(
        'Failed to update',
        { operation: 'update', table: 'deals' },
        '/api/deals'
      );
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('DB_ERROR');
      expect(body.error.details.context.operation).toBe('update');
      expect(body.error.details.path).toBe('/api/deals');
    });
  });

  describe('createUnauthorizedError', () => {
    it('should create an unauthorized error', async () => {
      const response = createUnauthorizedError('Token expired', '/api/protected');
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error.message).toBe('Token expired');
      expect(body.error.details.path).toBe('/api/protected');
    });
  });

  describe('createForbiddenError', () => {
    it('should create a forbidden error with permission info', async () => {
      const response = createForbiddenError(
        'Cannot delete',
        'admin:delete',
        '/api/admin/users/123'
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.details.context.requiredPermission).toBe('admin:delete');
      expect(body.error.details.path).toBe('/api/admin/users/123');

      const permSuggestion = body.error.details.suggestions.find(
        (s: { description: string }) => s.description.includes('admin:delete')
      );
      expect(permSuggestion).toBeDefined();
    });
  });
});

describe('Error response structure', () => {
  it('should always include requestId and timestamp', async () => {
    const response = ErrorBuilder.internal().build();
    const body = await response.json();

    expect(body.error.details.requestId).toBeDefined();
    expect(body.error.details.requestId).toMatch(/^req_/);
    expect(body.error.details.timestamp).toBeDefined();
    expect(new Date(body.error.details.timestamp).getTime()).not.toBeNaN();
  });

  it('should have consistent response format', async () => {
    const response = ErrorBuilder.validation('Test error')
      .withFieldError('field1', 'Error 1')
      .withSuggestion('Fix it', 'Do this')
      .withPath('/api/test')
      .withContext({ key: 'value' })
      .build();

    const body = await response.json();

    // Check top-level structure
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
    expect(body.error).toHaveProperty('details');

    // Check details structure
    expect(body.error.details).toHaveProperty('requestId');
    expect(body.error.details).toHaveProperty('timestamp');
    expect(body.error.details).toHaveProperty('fieldErrors');
    expect(body.error.details).toHaveProperty('suggestions');
    expect(body.error.details).toHaveProperty('path');
    expect(body.error.details).toHaveProperty('context');
  });
});
