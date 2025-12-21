/**
 * API Route Test Utilities
 *
 * This module provides comprehensive testing utilities for Next.js API routes
 * with mocked Supabase client, authentication, and common request/response patterns.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE UTILITIES:
 * 1. All API routes require authentication by default (use mockUnauthenticated for public routes)
 * 2. Supabase client is consistently mocked to avoid real database calls
 * 3. Request/Response helpers mirror Next.js API patterns exactly
 * 4. Mock data factories ensure consistent test fixtures
 */

import { vi, type Mock } from 'vitest';
import { NextRequest } from 'next/server';
import type { ApiResponse } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface MockUser {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

export interface MockOrganization {
  id: string;
  name: string;
}

export interface MockSupabaseQueryResult<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

export type SupabaseQueryChain = {
  select: Mock;
  insert: Mock;
  update: Mock;
  delete: Mock;
  upsert: Mock;
  eq: Mock;
  neq: Mock;
  in: Mock;
  or: Mock;
  ilike: Mock;
  order: Mock;
  range: Mock;
  single: Mock;
  maybeSingle: Mock;
  limit: Mock;
  filter: Mock;
};

export interface MockSupabaseClient {
  auth: {
    getUser: Mock;
    signInWithPassword: Mock;
    signUp: Mock;
    signOut: Mock;
  };
  from: Mock;
  storage: {
    from: Mock;
  };
  rpc: Mock;
}

// ============================================================================
// Default Mock Data
// ============================================================================

export const DEFAULT_USER: MockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { name: 'Test User' },
};

export const DEFAULT_ORGANIZATION: MockOrganization = {
  id: 'org-123',
  name: 'Test Organization',
};

// ============================================================================
// Supabase Mock Factory
// ============================================================================

/**
 * Creates a chainable mock for Supabase query builder
 * Each method returns the same chain to allow fluent API calls
 * The chain is also thenable, so it can be awaited directly
 *
 * IMPORTANT: All chain methods return the SAME chain instance to allow
 * verifying mock method calls. This is necessary because tests like:
 *   expect(chain.eq).toHaveBeenCalledWith('status', 'active')
 * require the same chain instance to be used throughout the query.
 */
export function createQueryChain(result: MockSupabaseQueryResult = { data: null, error: null }): SupabaseQueryChain {
  const chain: Record<string, unknown> = {};

  // All chainable methods return the SAME chain instance
  const chainMethods = [
    'eq', 'neq', 'in', 'or', 'ilike',
    'order', 'range', 'limit', 'filter', 'lte', 'gte', 'lt', 'gt',
  ];

  // Terminal methods return the result as a promise
  const terminalMethods = ['single', 'maybeSingle'];

  for (const method of chainMethods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  for (const method of terminalMethods) {
    chain[method] = vi.fn().mockResolvedValue(result);
  }

  // select() should be chainable and thenable - returns same chain
  chain.select = vi.fn().mockReturnValue(chain);

  // insert() should be chainable and thenable - returns same chain
  chain.insert = vi.fn().mockReturnValue(chain);

  // update() should be chainable and thenable - returns same chain
  chain.update = vi.fn().mockReturnValue(chain);

  // delete() should be chainable and thenable - returns same chain
  chain.delete = vi.fn().mockReturnValue(chain);

  // upsert() should be chainable and thenable - returns same chain
  chain.upsert = vi.fn().mockReturnValue(chain);

  // Make the chain thenable so it can be awaited directly
  chain.then = (resolve: (value: MockSupabaseQueryResult) => unknown, reject?: (reason: unknown) => unknown) => {
    return Promise.resolve(result).then(resolve, reject);
  };

  // Add catch for proper promise behavior
  chain.catch = (reject: (reason: unknown) => unknown) => {
    return Promise.resolve(result).catch(reject);
  };

  return chain as unknown as SupabaseQueryChain;
}

/**
 * Creates a mock Supabase client with all common methods mocked
 */
export function createMockSupabaseClient(options: {
  user?: MockUser | null;
  authError?: { message: string } | null;
} = {}): MockSupabaseClient {
  const { user = DEFAULT_USER, authError = null } = options;

  const defaultQueryChain = createQueryChain();

  const mockClient: MockSupabaseClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user, session: { access_token: 'mock-token' } },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue(defaultQueryChain),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file' } }),
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return mockClient;
}

/**
 * Sets up a mock for a specific table with custom query results
 */
export function mockTableQuery(
  mockClient: MockSupabaseClient,
  tableName: string,
  result: MockSupabaseQueryResult
): SupabaseQueryChain {
  const chain = createQueryChain(result);

  mockClient.from.mockImplementation((table: string) => {
    if (table === tableName) {
      return chain;
    }
    return createQueryChain();
  });

  return chain;
}

/**
 * Sets up multiple table mocks at once
 */
export function mockMultipleTables(
  mockClient: MockSupabaseClient,
  tables: Record<string, MockSupabaseQueryResult>
): Record<string, SupabaseQueryChain> {
  const chains: Record<string, SupabaseQueryChain> = {};

  for (const [tableName, result] of Object.entries(tables)) {
    chains[tableName] = createQueryChain(result);
  }

  mockClient.from.mockImplementation((table: string) => {
    return chains[table] || createQueryChain();
  });

  return chains;
}

// ============================================================================
// Request/Response Helpers
// ============================================================================

/**
 * Creates a mock NextRequest with the specified options
 */
export function createMockRequest(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options;

  const baseUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  const urlWithParams = new URL(baseUrl);

  for (const [key, value] of Object.entries(searchParams)) {
    urlWithParams.searchParams.set(key, value);
  }

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(urlWithParams, requestInit);
}

/**
 * Creates a mock FormData request (for file uploads)
 */
export function createMockFormDataRequest(
  url: string,
  formData: FormData,
  options: {
    method?: 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'POST', headers = {} } = options;

  const baseUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;

  return new NextRequest(baseUrl, {
    method,
    body: formData,
    headers,
  });
}

/**
 * Extracts and parses the JSON body from a NextResponse
 */
export async function parseResponseBody<T = unknown>(
  response: Response
): Promise<ApiResponse<T>> {
  const text = await response.text();
  return JSON.parse(text) as ApiResponse<T>;
}

/**
 * Asserts that a response is a success response with the expected data shape
 */
export async function expectSuccessResponse<T>(
  response: Response,
  expectedStatus: number = 200
): Promise<ApiResponse<T>> {
  expect(response.status).toBe(expectedStatus);
  const body = await parseResponseBody<T>(response);
  expect(body.success).toBe(true);
  expect(body.data).toBeDefined();
  return body;
}

/**
 * Asserts that a response is an error response with the expected code
 */
export async function expectErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedCode?: string
): Promise<ApiResponse<null>> {
  expect(response.status).toBe(expectedStatus);
  const body = await parseResponseBody<null>(response);
  expect(body.success).toBe(false);
  expect(body.error).toBeDefined();
  if (expectedCode) {
    expect(body.error?.code).toBe(expectedCode);
  }
  return body;
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Creates a mock deal with optional overrides
 */
export function createMockDeal(overrides: Partial<{
  id: string;
  deal_name: string;
  deal_type: string;
  status: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}> = {}) {
  return {
    id: 'deal-123',
    deal_name: 'Test Deal',
    deal_type: 'new_facility',
    status: 'draft',
    organization_id: 'org-123',
    created_by: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock document with optional overrides
 */
export function createMockDocument(overrides: Partial<{
  id: string;
  original_filename: string;
  document_type: string;
  processing_status: string;
  organization_id: string;
  uploaded_by: string;
  storage_path: string;
  file_size: number;
  uploaded_at: string;
}> = {}) {
  return {
    id: 'doc-123',
    original_filename: 'test-document.pdf',
    document_type: 'credit_agreement',
    processing_status: 'completed',
    organization_id: 'org-123',
    uploaded_by: 'user-123',
    storage_path: 'org-123/doc-123.pdf',
    file_size: 1024000,
    uploaded_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock ESG facility with optional overrides
 */
export function createMockESGFacility(overrides: Partial<{
  id: string;
  facility_name: string;
  borrower_name: string;
  esg_loan_type: string;
  status: string;
  organization_id: string;
  created_at: string;
}> = {}) {
  return {
    id: 'esg-facility-123',
    facility_name: 'Test ESG Facility',
    borrower_name: 'Test Borrower',
    esg_loan_type: 'sustainability_linked',
    status: 'active',
    organization_id: 'org-123',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock compliance facility with optional overrides
 */
export function createMockComplianceFacility(overrides: Partial<{
  id: string;
  facility_name: string;
  borrower_name: string;
  status: string;
  organization_id: string;
  created_at: string;
}> = {}) {
  return {
    id: 'compliance-facility-123',
    facility_name: 'Test Compliance Facility',
    borrower_name: 'Test Borrower',
    status: 'active',
    organization_id: 'org-123',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock user data record (from users table)
 */
export function createMockUserData(overrides: Partial<{
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: string;
}> = {}) {
  return {
    id: 'user-123',
    organization_id: 'org-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    ...overrides,
  };
}

/**
 * Creates a mock file for upload testing
 */
export function createMockFile(
  name: string = 'test.pdf',
  type: string = 'application/pdf',
  size: number = 1024
): File {
  const content = new Array(size).fill('x').join('');
  return new File([content], name, { type });
}

// ============================================================================
// Module Mocking Helpers
// ============================================================================

/**
 * Mocks the Supabase server module
 * Call this in beforeEach with the mock client
 */
export function mockSupabaseServer(mockClient: MockSupabaseClient) {
  vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue(mockClient),
  }));
}

/**
 * Creates params object for dynamic route handlers
 * Next.js 15 uses Promise-based params
 */
export function createRouteParams<T extends Record<string, string>>(params: T): { params: Promise<T> } {
  return {
    params: Promise.resolve(params),
  };
}

// ============================================================================
// Test Lifecycle Helpers
// ============================================================================

/**
 * Standard beforeEach setup for API route tests
 */
export function setupApiRouteTest() {
  vi.clearAllMocks();
}

/**
 * Standard afterEach cleanup for API route tests
 */
export function cleanupApiRouteTest() {
  vi.restoreAllMocks();
}
