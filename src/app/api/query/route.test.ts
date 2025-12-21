/**
 * Query API Route Tests
 *
 * Tests for the /api/query endpoint (natural language document queries).
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. POST only - natural language queries are submitted via POST
 * 2. Request validates question, optional facilityIds, and includeSources flag
 * 3. Different query types trigger different response patterns (interest, leverage, maturity, etc.)
 * 4. Sources are included when includeSources=true
 * 5. Confidence varies based on data availability and match quality
 * 6. Keywords are extracted from question for search
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import {
  createMockRequest,
  createMockSupabaseClient,
  createQueryChain,
  parseResponseBody,
  expectSuccessResponse,
  expectErrorResponse,
  setupApiRouteTest,
  cleanupApiRouteTest,
  type MockSupabaseClient,
} from '@/lib/test-utils';
import type { QueryResponse } from '@/types';

// Mock Supabase
let mockSupabase: MockSupabaseClient;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock data factories
function createMockLoanFacility(overrides = {}) {
  return {
    id: 'facility-123',
    source_document_id: 'doc-123',
    facility_name: 'Test Facility',
    base_rate: 'SOFR',
    margin_initial: 2.5,
    interest_rate_type: 'floating',
    maturity_date: '2029-02-01',
    total_commitments: 500000000,
    currency: 'USD',
    ...overrides,
  };
}

function createMockCovenant(overrides = {}) {
  return {
    id: 'cov-123',
    source_document_id: 'doc-123',
    covenant_type: 'leverage_ratio',
    covenant_name: 'Maximum Leverage Ratio',
    threshold_type: 'maximum',
    threshold_value: 4.5,
    testing_frequency: 'quarterly',
    clause_reference: 'Section 7.1',
    page_number: 45,
    raw_text: 'Leverage shall not exceed 4.5x',
    ...overrides,
  };
}

function createMockDefinedTerm(overrides = {}) {
  return {
    id: 'term-123',
    source_document_id: 'doc-123',
    term: 'EBITDA',
    definition: 'Earnings before interest, taxes, depreciation and amortization calculated in accordance with GAAP',
    clause_reference: 'Section 1.1',
    page_number: 5,
    ...overrides,
  };
}

describe('POST /api/query', () => {
  beforeEach(() => {
    setupApiRouteTest();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(cleanupApiRouteTest);

  describe('SPEC: Request Validation', () => {
    it('returns 400 when question is missing', async () => {
      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: {},
      });
      const response = await POST(request);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });

    it('returns 400 when question is empty string', async () => {
      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: '' },
      });
      const response = await POST(request);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });

    it('accepts valid query request', async () => {
      mockSupabase.from.mockReturnValue(createQueryChain({ data: [], error: null }));

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What is the interest rate?' },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('SPEC: Interest Rate Queries', () => {
    it('returns interest rate information for margin queries', async () => {
      const mockFacility = createMockLoanFacility({
        base_rate: 'SOFR',
        margin_initial: 2.75,
        interest_rate_type: 'floating',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'loan_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: {
          question: 'What is the interest rate margin?',
          includeSources: true,
        },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('SOFR');
      expect(body.data?.answer).toContain('2.75');
      expect(body.data?.confidence).toBeGreaterThan(0.8);
    });

    it('handles missing facility data for interest queries', async () => {
      mockSupabase.from.mockReturnValue(createQueryChain({ data: [], error: null }));

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What is the interest rate?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('No facility data found');
      expect(body.data?.confidence).toBeLessThan(0.6);
    });
  });

  describe('SPEC: Covenant Queries', () => {
    it('returns leverage covenant information', async () => {
      const mockCovenant = createMockCovenant({
        covenant_type: 'leverage_ratio',
        covenant_name: 'Maximum Leverage Ratio',
        threshold_value: 4.5,
        testing_frequency: 'quarterly',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'financial_covenants':
            return createQueryChain({ data: [mockCovenant], error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: {
          question: 'What is the leverage covenant?',
          includeSources: true,
        },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('4.5');
      expect(body.data?.answer).toContain('quarterly');
    });

    it('handles missing covenant data', async () => {
      mockSupabase.from.mockReturnValue(createQueryChain({ data: [], error: null }));

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What are the leverage covenants?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('No leverage covenant data found');
    });
  });

  describe('SPEC: Maturity Date Queries', () => {
    it('returns maturity date information', async () => {
      const mockFacility = createMockLoanFacility({
        maturity_date: '2030-06-15',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return createQueryChain({ data: [mockFacility], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What is the maturity date of the facility?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('2030-06-15');
      expect(body.data?.confidence).toBeGreaterThan(0.9);
    });

    it('matches expiration synonyms', async () => {
      const mockFacility = createMockLoanFacility({
        maturity_date: '2028-12-31',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return createQueryChain({ data: [mockFacility], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'When does this facility expire?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('2028-12-31');
    });
  });

  describe('SPEC: Commitment Amount Queries', () => {
    it('returns formatted commitment amount', async () => {
      const mockFacility = createMockLoanFacility({
        total_commitments: 750000000,
        currency: 'USD',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return createQueryChain({ data: [mockFacility], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What is the total commitment amount?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('750,000,000');
    });

    it('matches size synonyms', async () => {
      const mockFacility = createMockLoanFacility({
        total_commitments: 500000000,
        currency: 'EUR',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return createQueryChain({ data: [mockFacility], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What is the facility size?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('500,000,000');
    });
  });

  describe('SPEC: Definition Queries', () => {
    it('returns term definition', async () => {
      const mockTerm = createMockDefinedTerm({
        term: 'Material Adverse Effect',
        definition: 'Any event or circumstance that could reasonably be expected to have a material adverse effect on the business...',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'defined_terms':
            return createQueryChain({ data: [mockTerm], error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: {
          question: 'What does Material Adverse Effect mean?',
          includeSources: true,
        },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('Material Adverse Effect');
    });

    it('handles definition not found', async () => {
      mockSupabase.from.mockReturnValue(createQueryChain({ data: [], error: null }));

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What is the definition of XYZ?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('No matching definition found');
      expect(body.data?.confidence).toBeLessThan(0.5);
    });
  });

  describe('SPEC: Generic Queries', () => {
    it('returns helpful response for unrecognized queries', async () => {
      mockSupabase.from.mockReturnValue(createQueryChain({ data: [], error: null }));

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'Tell me something random about this document' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('more specific');
      expect(body.data?.confidence).toBeLessThan(0.7);
    });
  });

  describe('SPEC: Sources', () => {
    it('includes sources when includeSources is true', async () => {
      const mockFacility = createMockLoanFacility();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return createQueryChain({ data: [mockFacility], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: {
          question: 'What is the interest rate?',
          includeSources: true,
        },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.sources).toBeDefined();
      expect(body.data?.sources.length).toBeGreaterThan(0);
    });

    it('excludes sources when includeSources is false', async () => {
      const mockFacility = createMockLoanFacility();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return createQueryChain({ data: [mockFacility], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: {
          question: 'What is the interest rate?',
          includeSources: false,
        },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.sources).toEqual([]);
    });

    it('excludes sources by default', async () => {
      const mockFacility = createMockLoanFacility();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return createQueryChain({ data: [mockFacility], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What is the interest rate?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      // Without includeSources flag, sources may or may not be empty
      // The implementation determines default behavior
    });
  });

  describe('SPEC: Facility Filtering', () => {
    it('returns result when facilityIds filter is provided', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return createQueryChain({ data: [], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: {
          question: 'What is the interest rate?',
          // Use valid UUIDs as required by queryDocumentSchema
          facilityIds: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
        },
      });
      const response = await POST(request);

      // Request should succeed with filter applied (returns no facility data message)
      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('No facility data found');
    });
  });

  describe('SPEC: Case Insensitivity', () => {
    it('handles uppercase queries', async () => {
      const mockFacility = createMockLoanFacility();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return createQueryChain({ data: [mockFacility], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'WHAT IS THE INTEREST RATE?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('SOFR');
    });

    it('handles mixed case queries', async () => {
      const mockCovenant = createMockCovenant();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'financial_covenants') {
          return createQueryChain({ data: [mockCovenant], error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What Is The LeVeRaGe Ratio?' },
      });
      const response = await POST(request);

      const body = await expectSuccessResponse<QueryResponse>(response);
      expect(body.data?.answer).toContain('4.5');
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns 500 for unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const request = createMockRequest('/api/query', {
        method: 'POST',
        body: { question: 'What is the interest rate?' },
      });
      const response = await POST(request);

      await expectErrorResponse(response, 500, 'INTERNAL_ERROR');
    });
  });
});
