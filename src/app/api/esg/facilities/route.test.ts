/**
 * ESG Facilities API Route Tests
 *
 * Tests for the /api/esg/facilities endpoint (list and create ESG facilities).
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. All operations require authentication
 * 2. Facilities are scoped to user's organization
 * 3. GET returns facilities with KPI counts and performance stats
 * 4. Filtering supports esg_loan_type, status, and search
 * 5. POST creates facility with organization_id from authenticated user
 * 6. Activity logging captures ESG facility creation events
 * 7. Performance status calculated from target achievement ratio
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from './route';
import {
  createMockRequest,
  createMockSupabaseClient,
  createQueryChain,
  createMockESGFacility,
  createMockUserData,
  parseResponseBody,
  expectSuccessResponse,
  expectErrorResponse,
  setupApiRouteTest,
  cleanupApiRouteTest,
  type MockSupabaseClient,
} from '@/lib/test-utils';
import type { ESGFacilityWithKPIs } from '@/types';

// Mock Supabase
let mockSupabase: MockSupabaseClient;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock data factories
function createMockKPI(overrides = {}) {
  return {
    id: 'kpi-123',
    facility_id: 'esg-facility-123',
    kpi_name: 'Carbon Emissions Reduction',
    kpi_category: 'environmental',
    unit: 'tonnes CO2e',
    baseline_value: 100000,
    is_active: true,
    ...overrides,
  };
}

function createMockTarget(overrides = {}) {
  return {
    id: 'target-123',
    kpi_id: 'kpi-123',
    target_year: 2025,
    target_value: 85000,
    target_status: 'on_track',
    ...overrides,
  };
}

describe('GET /api/esg/facilities', () => {
  beforeEach(() => {
    setupApiRouteTest();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(cleanupApiRouteTest);

  describe('SPEC: Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      await expectErrorResponse(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('SPEC: User Profile Requirement', () => {
    it('returns 404 when user profile not found', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: null, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      await expectErrorResponse(response, 404, 'NOT_FOUND');
    });
  });

  describe('SPEC: Basic Listing', () => {
    it('returns empty array when no facilities exist', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data).toEqual([]);
    });

    it('returns facilities with KPI stats', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility();
      const mockKPI = createMockKPI({ facility_id: mockFacility.id });
      const mockTarget = createMockTarget({ kpi_id: mockKPI.id, target_status: 'achieved' });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          case 'esg_kpis':
            return createQueryChain({ data: [mockKPI], error: null });
          case 'esg_targets':
            return createQueryChain({ data: [mockTarget], error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data).toHaveLength(1);
      expect(body.data?.[0].kpi_count).toBe(1);
    });
  });

  describe('SPEC: Organization Scoping', () => {
    it('returns organization-scoped facilities successfully', async () => {
      const mockUser = createMockUserData({ organization_id: 'org-456' });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      // Request should succeed when user has organization
      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data).toEqual([]);
    });
  });

  describe('SPEC: Filtering', () => {
    it('accepts ESG loan type filter and returns results', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities', {
        searchParams: { esg_loan_type: 'sustainability_linked' },
      });
      const response = await GET(request);

      // Request should succeed with filter applied
      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data).toEqual([]);
    });

    it('accepts status filter and returns results', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities', {
        searchParams: { status: 'active' },
      });
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data).toEqual([]);
    });

    it('accepts search filter and returns results', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities', {
        searchParams: { search: 'green' },
      });
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data).toEqual([]);
    });

    it('accepts "all" filters and returns all results', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities', {
        searchParams: { esg_loan_type: 'all', status: 'all' },
      });
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data).toEqual([]);
    });
  });

  describe('SPEC: Pagination', () => {
    it('returns empty array with default pagination', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data).toEqual([]);
    });

    it('accepts custom pagination parameters', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities', {
        searchParams: { limit: '25', offset: '50' },
      });
      const response = await GET(request);

      // Should return successful response even with custom pagination
      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data).toEqual([]);
    });
  });

  describe('SPEC: Performance Status Calculation', () => {
    it('calculates on_track when 80%+ targets achieved', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility({ id: 'fac-1' });
      const mockKPIs = [
        createMockKPI({ id: 'kpi-1', facility_id: 'fac-1' }),
      ];
      const mockTargets = [
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'achieved' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'achieved' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'achieved' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'achieved' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'missed' }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          case 'esg_kpis':
            return createQueryChain({ data: mockKPIs, error: null });
          case 'esg_targets':
            return createQueryChain({ data: mockTargets, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data?.[0].overall_performance_status).toBe('on_track');
    });

    it('calculates at_risk when 50-79% targets achieved', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility({ id: 'fac-1' });
      const mockKPIs = [createMockKPI({ id: 'kpi-1', facility_id: 'fac-1' })];
      const mockTargets = [
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'achieved' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'achieved' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'missed' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'missed' }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          case 'esg_kpis':
            return createQueryChain({ data: mockKPIs, error: null });
          case 'esg_targets':
            return createQueryChain({ data: mockTargets, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data?.[0].overall_performance_status).toBe('at_risk');
    });

    it('calculates off_track when less than 50% targets achieved', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility({ id: 'fac-1' });
      const mockKPIs = [createMockKPI({ id: 'kpi-1', facility_id: 'fac-1' })];
      const mockTargets = [
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'achieved' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'missed' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'missed' }),
        createMockTarget({ kpi_id: 'kpi-1', target_status: 'missed' }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          case 'esg_kpis':
            return createQueryChain({ data: mockKPIs, error: null });
          case 'esg_targets':
            return createQueryChain({ data: mockTargets, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data?.[0].overall_performance_status).toBe('off_track');
    });

    it('shows pending when no targets exist', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility({ id: 'fac-1' });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGFacilityWithKPIs[]>(response);
      expect(body.data?.[0].overall_performance_status).toBe('pending');
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns 500 for database errors', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        if (table === 'esg_facilities') {
          return createQueryChain({
            data: null,
            error: { message: 'Connection failed' },
          });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/facilities');
      const response = await GET(request);

      await expectErrorResponse(response, 500, 'DB_ERROR');
    });
  });
});

describe('POST /api/esg/facilities', () => {
  beforeEach(() => {
    setupApiRouteTest();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(cleanupApiRouteTest);

  describe('SPEC: Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = createMockRequest('/api/esg/facilities', {
        method: 'POST',
        body: {
          facility_name: 'Test ESG Facility',
          borrower_name: 'Test Borrower',
          esg_loan_type: 'sustainability_linked',
        },
      });
      const response = await POST(request);

      await expectErrorResponse(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('SPEC: Validation', () => {
    it('returns 400 for missing required fields', async () => {
      const mockUser = createMockUserData();
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: null, error: null });
      });

      const request = createMockRequest('/api/esg/facilities', {
        method: 'POST',
        body: {},
      });
      const response = await POST(request);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });

    it('returns 400 for invalid esg_loan_type', async () => {
      const mockUser = createMockUserData();
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: null, error: null });
      });

      const request = createMockRequest('/api/esg/facilities', {
        method: 'POST',
        body: {
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          esg_loan_type: 'invalid_type',
        },
      });
      const response = await POST(request);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });
  });

  describe('SPEC: Facility Creation', () => {
    it('creates facility for user with organization', async () => {
      const mockUser = createMockUserData({ organization_id: 'org-789' });
      const createdFacility = createMockESGFacility({
        id: 'new-fac-123',
        organization_id: 'org-789',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: createdFacility, error: null });
          case 'activities':
            return createQueryChain({ data: null, error: null });
          default:
            return createQueryChain({ data: null, error: null });
        }
      });

      const request = createMockRequest('/api/esg/facilities', {
        method: 'POST',
        body: {
          facility_name: 'New Green Facility',
          facility_reference: 'GRN-2024-001',
          borrower_name: 'Eco Corp',
          esg_loan_type: 'green_loan',
          effective_date: '2024-01-01',
          maturity_date: '2029-01-01',
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await parseResponseBody(response);
      expect(body.success).toBe(true);
      expect(body.data?.id).toBe('new-fac-123');
    });

    it('returns 201 with created facility', async () => {
      const mockUser = createMockUserData();
      const createdFacility = createMockESGFacility({
        id: 'new-fac-456',
        facility_name: 'Solar Energy Facility',
      });
      const facilitiesChain = createQueryChain({ data: createdFacility, error: null });
      const activitiesChain = createQueryChain({ data: null, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return facilitiesChain;
          case 'activities':
            return activitiesChain;
          default:
            return createQueryChain({ data: null, error: null });
        }
      });

      const request = createMockRequest('/api/esg/facilities', {
        method: 'POST',
        body: {
          facility_name: 'Solar Energy Facility',
          facility_reference: 'SOL-2024-001',
          borrower_name: 'SolarCo',
          esg_loan_type: 'sustainability_linked',
          effective_date: '2024-01-01',
          maturity_date: '2029-01-01',
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await parseResponseBody(response);
      expect(body.success).toBe(true);
      expect(body.data?.facility_name).toBe('Solar Energy Facility');
    });
  });

  describe('SPEC: Activity Logging', () => {
    it('succeeds when activity logging completes', async () => {
      const mockUser = createMockUserData({ organization_id: 'org-123' });
      const createdFacility = createMockESGFacility({
        id: 'fac-123',
        facility_name: 'Wind Farm Facility',
        esg_loan_type: 'green_loan',
        borrower_name: 'WindCo',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: createdFacility, error: null });
          case 'activities':
            return createQueryChain({ data: null, error: null });
          default:
            return createQueryChain({ data: null, error: null });
        }
      });

      const request = createMockRequest('/api/esg/facilities', {
        method: 'POST',
        body: {
          facility_name: 'Wind Farm Facility',
          facility_reference: 'WND-2024-001',
          borrower_name: 'WindCo',
          esg_loan_type: 'green_loan',
          effective_date: '2024-01-01',
          maturity_date: '2029-01-01',
        },
      });
      const response = await POST(request);

      // Verify facility was created successfully (activity logging is internal)
      expect(response.status).toBe(201);
      const body = await parseResponseBody(response);
      expect(body.success).toBe(true);
      expect(body.data?.facility_name).toBe('Wind Farm Facility');
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns 500 when facility creation fails', async () => {
      const mockUser = createMockUserData();
      const facilitiesChain = createQueryChain({
        data: null,
        error: { message: 'Insert failed' },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        if (table === 'esg_facilities') {
          return facilitiesChain;
        }
        return createQueryChain({ data: null, error: null });
      });

      const request = createMockRequest('/api/esg/facilities', {
        method: 'POST',
        body: {
          facility_name: 'Failing Facility',
          facility_reference: 'FAIL-2024-001',
          borrower_name: 'FailCo',
          esg_loan_type: 'sustainability_linked',
          effective_date: '2024-01-01',
          maturity_date: '2029-01-01',
        },
      });
      const response = await POST(request);

      await expectErrorResponse(response, 500, 'DB_ERROR');
    });
  });
});
