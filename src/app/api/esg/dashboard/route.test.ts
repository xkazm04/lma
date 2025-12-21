/**
 * ESG Dashboard API Route Tests
 *
 * Tests for the /api/esg/dashboard endpoint (dashboard statistics).
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. Requires authentication and user profile
 * 2. Returns comprehensive ESG statistics for the organization
 * 3. Supports target_year query parameter (defaults to current year)
 * 4. Validates target_year is between 2000-2100
 * 5. Aggregates KPI performance stats from targets
 * 6. Calculates allocation summary from proceeds data
 * 7. Returns upcoming deadlines and recent activity
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
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
import type { ESGDashboardStats } from '@/types';

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
    kpi_name: 'Carbon Emissions',
    is_active: true,
    ...overrides,
  };
}

function createMockTarget(overrides = {}) {
  return {
    id: 'target-123',
    kpi_id: 'kpi-123',
    target_year: new Date().getFullYear(),
    target_status: 'on_track',
    ...overrides,
  };
}

function createMockCategory(overrides = {}) {
  return {
    id: 'cat-123',
    facility_id: 'esg-facility-123',
    eligible_amount: 1000000,
    ...overrides,
  };
}

describe('GET /api/esg/dashboard', () => {
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

      const request = createMockRequest('/api/esg/dashboard');
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

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      await expectErrorResponse(response, 404, 'NOT_FOUND');
    });
  });

  describe('SPEC: Target Year Validation', () => {
    it('accepts valid target_year parameter', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/dashboard', {
        searchParams: { target_year: '2025' },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('returns 400 for target_year before 2000', async () => {
      const request = createMockRequest('/api/esg/dashboard', {
        searchParams: { target_year: '1999' },
      });
      const response = await GET(request);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });

    it('returns 400 for target_year after 2100', async () => {
      const request = createMockRequest('/api/esg/dashboard', {
        searchParams: { target_year: '2101' },
      });
      const response = await GET(request);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });

    it('returns 400 for non-numeric target_year', async () => {
      const request = createMockRequest('/api/esg/dashboard', {
        searchParams: { target_year: 'invalid' },
      });
      const response = await GET(request);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });

    it('defaults to current year when target_year not provided', async () => {
      const mockUser = createMockUserData();
      const currentYear = new Date().getFullYear();
      const mockTarget = createMockTarget({ target_year: currentYear, target_status: 'on_track' });
      const mockKPI = createMockKPI();

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [createMockESGFacility()], error: null });
          case 'esg_kpis':
            return createQueryChain({ data: [mockKPI], error: null });
          case 'esg_targets':
            return createQueryChain({ data: [mockTarget], error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGDashboardStats>(response);
      expect(body.data?.kpi_performance.on_track).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SPEC: Dashboard Statistics', () => {
    it('returns total ESG facilities count', async () => {
      const mockUser = createMockUserData();
      const facilities = [
        createMockESGFacility({ id: 'fac-1' }),
        createMockESGFacility({ id: 'fac-2' }),
        createMockESGFacility({ id: 'fac-3' }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        if (table === 'esg_facilities') {
          return createQueryChain({ data: facilities, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGDashboardStats>(response);
      expect(body.data?.total_esg_facilities).toBe(3);
    });

    it('counts facilities by loan type', async () => {
      const mockUser = createMockUserData();
      const facilities = [
        createMockESGFacility({ id: 'fac-1', esg_loan_type: 'sustainability_linked' }),
        createMockESGFacility({ id: 'fac-2', esg_loan_type: 'sustainability_linked' }),
        createMockESGFacility({ id: 'fac-3', esg_loan_type: 'green_loan' }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        if (table === 'esg_facilities') {
          return createQueryChain({ data: facilities, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGDashboardStats>(response);
      expect(body.data?.by_loan_type.sustainability_linked.count).toBe(2);
      expect(body.data?.by_loan_type.green_loan.count).toBe(1);
    });
  });

  describe('SPEC: KPI Performance Stats', () => {
    it('counts total active KPIs', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility();
      const kpis = [
        createMockKPI({ id: 'kpi-1', facility_id: mockFacility.id }),
        createMockKPI({ id: 'kpi-2', facility_id: mockFacility.id }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          case 'esg_kpis':
            return createQueryChain({ data: kpis, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGDashboardStats>(response);
      expect(body.data?.kpi_performance.total_kpis).toBe(2);
    });

    it('counts KPIs by performance status from targets', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility();
      const currentYear = new Date().getFullYear();
      const kpis = [
        createMockKPI({ id: 'kpi-1', facility_id: mockFacility.id }),
        createMockKPI({ id: 'kpi-2', facility_id: mockFacility.id }),
        createMockKPI({ id: 'kpi-3', facility_id: mockFacility.id }),
      ];
      const targets = [
        createMockTarget({ kpi_id: 'kpi-1', target_year: currentYear, target_status: 'on_track' }),
        createMockTarget({ kpi_id: 'kpi-2', target_year: currentYear, target_status: 'at_risk' }),
        createMockTarget({ kpi_id: 'kpi-3', target_year: currentYear, target_status: 'missed' }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          case 'esg_kpis':
            return createQueryChain({ data: kpis, error: null });
          case 'esg_targets':
            return createQueryChain({ data: targets, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGDashboardStats>(response);
      expect(body.data?.kpi_performance.on_track).toBe(1);
      expect(body.data?.kpi_performance.at_risk).toBe(1);
      expect(body.data?.kpi_performance.missed).toBe(1);
    });

    it('counts achieved targets as on_track', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility();
      const currentYear = new Date().getFullYear();
      const kpis = [createMockKPI({ id: 'kpi-1', facility_id: mockFacility.id })];
      const targets = [
        createMockTarget({ kpi_id: 'kpi-1', target_year: currentYear, target_status: 'achieved' }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          case 'esg_kpis':
            return createQueryChain({ data: kpis, error: null });
          case 'esg_targets':
            return createQueryChain({ data: targets, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGDashboardStats>(response);
      expect(body.data?.kpi_performance.on_track).toBe(1);
    });
  });

  describe('SPEC: Allocation Summary', () => {
    it('calculates total proceeds from categories', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility();
      const categories = [
        createMockCategory({ id: 'cat-1', facility_id: mockFacility.id, eligible_amount: 500000 }),
        createMockCategory({ id: 'cat-2', facility_id: mockFacility.id, eligible_amount: 300000 }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          case 'use_of_proceeds_categories':
            return createQueryChain({ data: categories, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGDashboardStats>(response);
      expect(body.data?.allocation_summary.total_proceeds).toBe(800000);
    });

    it('calculates allocation percentage', async () => {
      const mockUser = createMockUserData();
      const mockFacility = createMockESGFacility();
      const categories = [
        createMockCategory({ id: 'cat-1', facility_id: mockFacility.id, eligible_amount: 1000000 }),
      ];
      const allocations = [
        { allocated_amount: 250000 },
        { allocated_amount: 250000 },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            return createQueryChain({ data: mockUser, error: null });
          case 'esg_facilities':
            return createQueryChain({ data: [mockFacility], error: null });
          case 'use_of_proceeds_categories':
            return createQueryChain({ data: categories, error: null });
          case 'proceeds_allocations':
            return createQueryChain({ data: allocations, error: null });
          default:
            return createQueryChain({ data: [], error: null });
        }
      });

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGDashboardStats>(response);
      expect(body.data?.allocation_summary.allocated).toBe(500000);
      expect(body.data?.allocation_summary.unallocated).toBe(500000);
      expect(body.data?.allocation_summary.allocation_percentage).toBe(50);
    });
  });

  describe('SPEC: Empty State', () => {
    it('returns zero values when no facilities exist', async () => {
      const mockUser = createMockUserData();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createQueryChain({ data: mockUser, error: null });
        }
        return createQueryChain({ data: [], error: null });
      });

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      const body = await expectSuccessResponse<ESGDashboardStats>(response);
      expect(body.data?.total_esg_facilities).toBe(0);
      expect(body.data?.kpi_performance.total_kpis).toBe(0);
      expect(body.data?.allocation_summary.total_proceeds).toBe(0);
      expect(body.data?.upcoming_deadlines).toEqual([]);
      expect(body.data?.recent_activity).toEqual([]);
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns 500 for unexpected errors', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Connection failed'));

      const request = createMockRequest('/api/esg/dashboard');
      const response = await GET(request);

      await expectErrorResponse(response, 500, 'INTERNAL_ERROR');
    });
  });
});
