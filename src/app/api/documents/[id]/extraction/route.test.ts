/**
 * Document Extraction API Route Tests
 *
 * Tests for the /api/documents/[id]/extraction endpoint.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. GET returns extraction results aggregated from multiple tables
 * 2. Extraction result includes facility, covenants, obligations, events, ESG provisions, and terms
 * 3. Overall confidence is calculated as average of all extraction confidences
 * 4. 404 returned when document not found
 * 5. PUT allows manual corrections to extraction data
 * 6. Empty extraction results return null facility with empty arrays
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, PUT } from './route';
import {
  createMockRequest,
  createMockSupabaseClient,
  createQueryChain,
  createMockDocument,
  createRouteParams,
  parseResponseBody,
  expectSuccessResponse,
  expectErrorResponse,
  setupApiRouteTest,
  cleanupApiRouteTest,
  type MockSupabaseClient,
} from '@/lib/test-utils';
import type { ExtractionResult } from '@/types';

// Mock Supabase
let mockSupabase: MockSupabaseClient;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock data factories specific to extraction
function createMockFacility(overrides = {}) {
  return {
    id: 'facility-123',
    source_document_id: 'doc-123',
    facility_name: 'Test Term Loan Facility',
    facility_reference: 'TLF-2024-001',
    execution_date: '2024-01-15',
    effective_date: '2024-02-01',
    maturity_date: '2029-02-01',
    borrowers: [{ name: 'Test Borrower Inc', role: 'primary' }],
    lenders: [{ name: 'Test Bank', commitment: 500000000 }],
    agents: [{ name: 'Admin Bank', role: 'administrative_agent' }],
    facility_type: 'term_loan',
    currency: 'USD',
    total_commitments: 500000000,
    interest_rate_type: 'floating',
    base_rate: 'SOFR',
    margin_initial: 2.5,
    margin_grid: [],
    governing_law: 'New York',
    jurisdiction: 'United States',
    extraction_confidence: 0.92,
    ...overrides,
  };
}

function createMockCovenant(overrides = {}) {
  return {
    id: 'cov-123',
    source_document_id: 'doc-123',
    covenant_type: 'leverage_ratio',
    covenant_name: 'Maximum Leverage Ratio',
    numerator_definition: 'Total Debt',
    denominator_definition: 'EBITDA',
    threshold_type: 'maximum',
    threshold_value: 4.5,
    testing_frequency: 'quarterly',
    clause_reference: 'Section 7.1(a)',
    page_number: 45,
    raw_text: 'Borrower shall maintain a Leverage Ratio not exceeding 4.50:1.00',
    extraction_confidence: 0.88,
    ...overrides,
  };
}

function createMockObligation(overrides = {}) {
  return {
    id: 'obl-123',
    source_document_id: 'doc-123',
    obligation_type: 'financial_statements',
    description: 'Annual audited financial statements',
    frequency: 'annually',
    deadline_days: 90,
    recipient_role: 'administrative_agent',
    clause_reference: 'Section 6.1(a)',
    page_number: 38,
    raw_text: 'Annual audited financials within 90 days of fiscal year end',
    extraction_confidence: 0.91,
    ...overrides,
  };
}

function createMockEventOfDefault(overrides = {}) {
  return {
    id: 'eod-123',
    source_document_id: 'doc-123',
    event_category: 'payment_default',
    description: 'Failure to pay principal or interest when due',
    grace_period_days: 5,
    cure_rights: 'Payment within grace period',
    consequences: 'Acceleration of all outstanding obligations',
    clause_reference: 'Section 8.1(a)',
    page_number: 52,
    raw_text: 'Failure to pay principal when due...',
    extraction_confidence: 0.95,
    ...overrides,
  };
}

function createMockESGProvision(overrides = {}) {
  return {
    id: 'esg-123',
    source_document_id: 'doc-123',
    provision_type: 'sustainability_kpi',
    kpi_name: 'Carbon Emissions Reduction',
    kpi_definition: 'Year-over-year reduction in Scope 1 and 2 emissions',
    kpi_baseline: '100,000 tonnes CO2e',
    kpi_targets: [{ year: 2025, target: '85,000 tonnes' }],
    verification_required: true,
    clause_reference: 'Schedule 5',
    page_number: 78,
    raw_text: 'Sustainability-linked margin adjustment...',
    extraction_confidence: 0.85,
    ...overrides,
  };
}

function createMockDefinedTerm(overrides = {}) {
  return {
    id: 'term-123',
    source_document_id: 'doc-123',
    term: 'EBITDA',
    definition: 'Earnings before interest, taxes, depreciation and amortization...',
    clause_reference: 'Section 1.1',
    page_number: 5,
    references_terms: ['Consolidated Net Income', 'Interest Expense'],
    ...overrides,
  };
}

describe('GET /api/documents/[id]/extraction', () => {
  beforeEach(() => {
    setupApiRouteTest();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(cleanupApiRouteTest);

  describe('SPEC: Basic Extraction Retrieval', () => {
    it('returns complete extraction results for a processed document', async () => {
      const mockDoc = createMockDocument({ id: 'doc-123' });
      const mockFacility = createMockFacility();
      const mockCovenant = createMockCovenant();
      const mockObligation = createMockObligation();
      const mockEvent = createMockEventOfDefault();
      const mockESG = createMockESGProvision();
      const mockTerm = createMockDefinedTerm();

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'loan_documents':
            return createQueryChain({ data: mockDoc, error: null });
          case 'loan_facilities':
            return createQueryChain({ data: mockFacility, error: null });
          case 'financial_covenants':
            return createQueryChain({ data: [mockCovenant], error: null });
          case 'reporting_obligations':
            return createQueryChain({ data: [mockObligation], error: null });
          case 'events_of_default':
            return createQueryChain({ data: [mockEvent], error: null });
          case 'esg_provisions':
            return createQueryChain({ data: [mockESG], error: null });
          case 'defined_terms':
            return createQueryChain({ data: [mockTerm], error: null });
          default:
            return createQueryChain({ data: null, error: null });
        }
      });

      const request = createMockRequest('/api/documents/doc-123/extraction');
      const params = createRouteParams({ id: 'doc-123' });
      const response = await GET(request, params);

      expect(response.status).toBe(200);
      const body = await parseResponseBody<ExtractionResult>(response);
      expect(body.success).toBe(true);
      expect(body.data?.documentId).toBe('doc-123');
      expect(body.data?.facility).toBeDefined();
      expect(body.data?.facility?.facilityName).toBe('Test Term Loan Facility');
      expect(body.data?.covenants).toHaveLength(1);
      expect(body.data?.obligations).toHaveLength(1);
      expect(body.data?.eventsOfDefault).toHaveLength(1);
      expect(body.data?.esgProvisions).toHaveLength(1);
      expect(body.data?.definedTerms).toHaveLength(1);
    });

    it('returns 404 when document not found', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_documents') {
          return createQueryChain({
            data: null,
            error: { message: 'Row not found', code: 'PGRST116' },
          });
        }
        return createQueryChain({ data: null, error: null });
      });

      const request = createMockRequest('/api/documents/nonexistent/extraction');
      const params = createRouteParams({ id: 'nonexistent' });
      const response = await GET(request, params);

      await expectErrorResponse(response, 404, 'NOT_FOUND');
    });
  });

  describe('SPEC: Empty Extraction Results', () => {
    it('returns null facility when no facility data exists', async () => {
      const mockDoc = createMockDocument({ id: 'doc-456' });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'loan_documents':
            return createQueryChain({ data: mockDoc, error: null });
          case 'loan_facilities':
            return createQueryChain({ data: null, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/documents/doc-456/extraction');
      const params = createRouteParams({ id: 'doc-456' });
      const response = await GET(request, params);

      const body = await expectSuccessResponse<ExtractionResult>(response);
      expect(body.data?.facility).toBeNull();
      expect(body.data?.covenants).toEqual([]);
      expect(body.data?.obligations).toEqual([]);
    });

    it('returns empty arrays when no covenants exist', async () => {
      const mockDoc = createMockDocument();

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'loan_documents':
            return createQueryChain({ data: mockDoc, error: null });
          case 'financial_covenants':
            return createQueryChain({ data: [], error: null });
          default:
            return createQueryChain({ data: null, error: null });
        }
      });

      const request = createMockRequest('/api/documents/doc-123/extraction');
      const params = createRouteParams({ id: 'doc-123' });
      const response = await GET(request, params);

      const body = await expectSuccessResponse<ExtractionResult>(response);
      expect(body.data?.covenants).toEqual([]);
    });
  });

  describe('SPEC: Confidence Calculation', () => {
    it('calculates overall confidence as average of all extraction confidences', async () => {
      const mockDoc = createMockDocument();
      const mockFacility = createMockFacility({ extraction_confidence: 0.9 });
      const mockCov1 = createMockCovenant({ extraction_confidence: 0.8 });
      const mockCov2 = createMockCovenant({ id: 'cov-2', extraction_confidence: 0.85 });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'loan_documents':
            return createQueryChain({ data: mockDoc, error: null });
          case 'loan_facilities':
            return createQueryChain({ data: mockFacility, error: null });
          case 'financial_covenants':
            return createQueryChain({ data: [mockCov1, mockCov2], error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/documents/doc-123/extraction');
      const params = createRouteParams({ id: 'doc-123' });
      const response = await GET(request, params);

      const body = await expectSuccessResponse<ExtractionResult>(response);
      // Average of 0.9, 0.8, 0.85 = 0.85
      expect(body.data?.overallConfidence).toBeCloseTo(0.85, 2);
    });

    it('returns 0 confidence when no extraction data exists', async () => {
      const mockDoc = createMockDocument();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_documents') {
          return createQueryChain({ data: mockDoc, error: null });
        }
        return createQueryChain({ data: table === 'loan_facilities' ? null : [], error: null });
      });

      const request = createMockRequest('/api/documents/doc-123/extraction');
      const params = createRouteParams({ id: 'doc-123' });
      const response = await GET(request, params);

      const body = await expectSuccessResponse<ExtractionResult>(response);
      expect(body.data?.overallConfidence).toBe(0);
    });
  });

  describe('SPEC: Data Transformation', () => {
    it('transforms facility data to camelCase response format', async () => {
      const mockDoc = createMockDocument();
      const mockFacility = createMockFacility({
        facility_name: 'My Facility',
        facility_type: 'revolving_credit',
        total_commitments: 1000000000,
        interest_rate_type: 'fixed',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'loan_documents':
            return createQueryChain({ data: mockDoc, error: null });
          case 'loan_facilities':
            return createQueryChain({ data: mockFacility, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/documents/doc-123/extraction');
      const params = createRouteParams({ id: 'doc-123' });
      const response = await GET(request, params);

      const body = await expectSuccessResponse<ExtractionResult>(response);
      expect(body.data?.facility?.facilityName).toBe('My Facility');
      expect(body.data?.facility?.facilityType).toBe('revolving_credit');
      expect(body.data?.facility?.totalCommitments).toBe(1000000000);
      expect(body.data?.facility?.interestRateType).toBe('fixed');
    });

    it('transforms covenant data to camelCase response format', async () => {
      const mockDoc = createMockDocument();
      const mockCovenant = createMockCovenant({
        covenant_type: 'interest_coverage',
        covenant_name: 'Interest Coverage Ratio',
        threshold_value: 3.0,
        testing_frequency: 'quarterly',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'loan_documents':
            return createQueryChain({ data: mockDoc, error: null });
          case 'financial_covenants':
            return createQueryChain({ data: [mockCovenant], error: null });
          default:
            return createQueryChain({ data: null, error: null });
        }
      });

      const request = createMockRequest('/api/documents/doc-123/extraction');
      const params = createRouteParams({ id: 'doc-123' });
      const response = await GET(request, params);

      const body = await expectSuccessResponse<ExtractionResult>(response);
      expect(body.data?.covenants[0].covenantType).toBe('interest_coverage');
      expect(body.data?.covenants[0].covenantName).toBe('Interest Coverage Ratio');
      expect(body.data?.covenants[0].thresholdValue).toBe(3.0);
      expect(body.data?.covenants[0].testingFrequency).toBe('quarterly');
    });
  });

  describe('SPEC: Multiple Items', () => {
    it('handles multiple covenants correctly', async () => {
      const mockDoc = createMockDocument();
      const covenants = [
        createMockCovenant({ id: 'cov-1', covenant_name: 'Leverage Ratio' }),
        createMockCovenant({ id: 'cov-2', covenant_name: 'Interest Coverage' }),
        createMockCovenant({ id: 'cov-3', covenant_name: 'Fixed Charge Coverage' }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'loan_documents':
            return createQueryChain({ data: mockDoc, error: null });
          case 'financial_covenants':
            return createQueryChain({ data: covenants, error: null });
          default:
            return createQueryChain({ data: null, error: null });
        }
      });

      const request = createMockRequest('/api/documents/doc-123/extraction');
      const params = createRouteParams({ id: 'doc-123' });
      const response = await GET(request, params);

      const body = await expectSuccessResponse<ExtractionResult>(response);
      expect(body.data?.covenants).toHaveLength(3);
    });

    it('handles multiple defined terms correctly', async () => {
      const mockDoc = createMockDocument();
      const terms = [
        createMockDefinedTerm({ id: 'term-1', term: 'EBITDA' }),
        createMockDefinedTerm({ id: 'term-2', term: 'Material Adverse Effect' }),
        createMockDefinedTerm({ id: 'term-3', term: 'Permitted Indebtedness' }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'loan_documents':
            return createQueryChain({ data: mockDoc, error: null });
          case 'defined_terms':
            return createQueryChain({ data: terms, error: null });
          default:
            return createQueryChain({ data: null, error: null });
        }
      });

      const request = createMockRequest('/api/documents/doc-123/extraction');
      const params = createRouteParams({ id: 'doc-123' });
      const response = await GET(request, params);

      const body = await expectSuccessResponse<ExtractionResult>(response);
      expect(body.data?.definedTerms).toHaveLength(3);
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns 500 for unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const request = createMockRequest('/api/documents/doc-123/extraction');
      const params = createRouteParams({ id: 'doc-123' });
      const response = await GET(request, params);

      await expectErrorResponse(response, 500, 'INTERNAL_ERROR');
    });
  });
});

describe('PUT /api/documents/[id]/extraction', () => {
  beforeEach(() => {
    setupApiRouteTest();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(cleanupApiRouteTest);

  describe('SPEC: Facility Updates', () => {
    it('updates facility data when provided', async () => {
      const facilitiesChain = createQueryChain({ data: null, error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'loan_facilities') {
          return facilitiesChain;
        }
        return createQueryChain({ data: null, error: null });
      });

      const request = createMockRequest('/api/documents/doc-123/extraction', {
        method: 'PUT',
        body: {
          facility: {
            facility_name: 'Updated Facility Name',
            total_commitments: 750000000,
          },
        },
      });
      const params = createRouteParams({ id: 'doc-123' });
      const response = await PUT(request, params);

      expect(response.status).toBe(200);
      const body = await parseResponseBody<{ updated: string[] }>(response);
      expect(body.success).toBe(true);
      expect(body.data?.updated).toContain('facility');
    });
  });

  describe('SPEC: Response Format', () => {
    it('returns list of updated entities', async () => {
      mockSupabase.from.mockReturnValue(createQueryChain({ data: null, error: null }));

      const request = createMockRequest('/api/documents/doc-123/extraction', {
        method: 'PUT',
        body: {
          facility: { facility_name: 'Updated' },
        },
      });
      const params = createRouteParams({ id: 'doc-123' });
      const response = await PUT(request, params);

      const body = await parseResponseBody<{ updated: string[] }>(response);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data?.updated)).toBe(true);
    });

    it('returns empty array when no updates provided', async () => {
      const request = createMockRequest('/api/documents/doc-123/extraction', {
        method: 'PUT',
        body: {},
      });
      const params = createRouteParams({ id: 'doc-123' });
      const response = await PUT(request, params);

      const body = await parseResponseBody<{ updated: string[] }>(response);
      expect(body.data?.updated).toEqual([]);
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns 500 for unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Update failed');
      });

      const request = createMockRequest('/api/documents/doc-123/extraction', {
        method: 'PUT',
        body: { facility: { name: 'Test' } },
      });
      const params = createRouteParams({ id: 'doc-123' });
      const response = await PUT(request, params);

      await expectErrorResponse(response, 500, 'INTERNAL_ERROR');
    });
  });
});
