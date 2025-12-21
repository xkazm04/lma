/**
 * Deals API Route Tests
 *
 * Tests for the /api/deals endpoint (list and create operations).
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. GET /api/deals requires no authentication (public listing)
 * 2. POST /api/deals requires authentication
 * 3. Pagination defaults to page 1, pageSize 20
 * 4. Filtering supports status, type, and search
 * 5. Search matches deal_name and deal_reference (case-insensitive)
 * 6. Created deals default to 'draft' status
 * 7. Creator is automatically added as deal lead participant
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { GET, POST } from './route';
import {
  createMockRequest,
  createMockSupabaseClient,
  createQueryChain,
  createMockDeal,
  parseResponseBody,
  expectSuccessResponse,
  expectErrorResponse,
  setupApiRouteTest,
  cleanupApiRouteTest,
  DEFAULT_USER,
  type MockSupabaseClient,
  type MockSupabaseQueryResult,
} from '@/lib/test-utils';
import type { DealWithStats } from '@/types';

// Mock Supabase
let mockSupabase: MockSupabaseClient;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe('GET /api/deals', () => {
  beforeEach(() => {
    setupApiRouteTest();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(cleanupApiRouteTest);

  describe('SPEC: Basic Listing', () => {
    it('returns empty array when no deals exist', async () => {
      const mockDealsQuery = createQueryChain({ data: [], error: null, count: 0 });
      mockSupabase.from.mockReturnValue(mockDealsQuery);

      const request = createMockRequest('/api/deals');
      const response = await GET(request);

      const body = await expectSuccessResponse<DealWithStats[]>(response, 200);
      expect(body.data).toEqual([]);
    });

    it('returns list of deals with stats', async () => {
      const mockDeal = createMockDeal();
      const dealsResult: MockSupabaseQueryResult = {
        data: [mockDeal],
        error: null,
        count: 1,
      };

      // Set up the from() mock to return different chains for different tables
      const dealsChain = createQueryChain(dealsResult);
      const termsChain = createQueryChain({ data: null, error: null, count: 5 });
      const proposalsChain = createQueryChain({ data: null, error: null, count: 2 });
      const participantsChain = createQueryChain({ data: null, error: null, count: 3 });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deals':
            return dealsChain;
          case 'negotiation_terms':
            return termsChain;
          case 'term_proposals':
            return proposalsChain;
          case 'deal_participants':
            return participantsChain;
          default:
            return createQueryChain();
        }
      });

      const request = createMockRequest('/api/deals');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await parseResponseBody<DealWithStats[]>(response);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data?.[0].deal_name).toBe('Test Deal');
    });
  });

  describe('SPEC: Pagination', () => {
    it('uses default pagination (page 1, pageSize 20)', async () => {
      const mockDealsChain = createQueryChain({ data: [], error: null, count: 0 });
      mockSupabase.from.mockReturnValue(mockDealsChain);

      const request = createMockRequest('/api/deals');
      await GET(request);

      // Verify range was called with correct pagination
      expect(mockDealsChain.range).toHaveBeenCalledWith(0, 19);
    });

    it('applies custom pagination parameters', async () => {
      const mockDealsChain = createQueryChain({ data: [], error: null, count: 0 });
      mockSupabase.from.mockReturnValue(mockDealsChain);

      const request = createMockRequest('/api/deals', {
        searchParams: { page: '2', pageSize: '10' },
      });
      await GET(request);

      // Page 2 with pageSize 10: offset = (2-1) * 10 = 10, limit = 10 + 10 - 1 = 19
      expect(mockDealsChain.range).toHaveBeenCalledWith(10, 19);
    });

    it('includes pagination metadata in response', async () => {
      const mockDealsChain = createQueryChain({ data: [], error: null, count: 100 });
      mockSupabase.from.mockReturnValue(mockDealsChain);

      const request = createMockRequest('/api/deals', {
        searchParams: { page: '2', pageSize: '10' },
      });
      const response = await GET(request);

      const body = await parseResponseBody<DealWithStats[]>(response);
      expect(body.meta?.pagination).toEqual({
        page: 2,
        pageSize: 10,
        total: 100,
        totalPages: 10,
      });
    });
  });

  describe('SPEC: Filtering', () => {
    it('filters by status when provided', async () => {
      const mockDealsChain = createQueryChain({ data: [], error: null, count: 0 });
      mockSupabase.from.mockReturnValue(mockDealsChain);

      const request = createMockRequest('/api/deals', {
        searchParams: { status: 'active' },
      });
      await GET(request);

      expect(mockDealsChain.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('does not filter by status when "all" is specified', async () => {
      const mockDealsChain = createQueryChain({ data: [], error: null, count: 0 });
      mockSupabase.from.mockReturnValue(mockDealsChain);

      const request = createMockRequest('/api/deals', {
        searchParams: { status: 'all' },
      });
      await GET(request);

      // eq should not be called with 'status'
      const eqCalls = (mockDealsChain.eq as Mock).mock.calls;
      const statusCall = eqCalls.find((call: unknown[]) => call[0] === 'status');
      expect(statusCall).toBeUndefined();
    });

    it('filters by deal type when provided', async () => {
      const mockDealsChain = createQueryChain({ data: [], error: null, count: 0 });
      mockSupabase.from.mockReturnValue(mockDealsChain);

      const request = createMockRequest('/api/deals', {
        searchParams: { type: 'new_facility' },
      });
      await GET(request);

      expect(mockDealsChain.eq).toHaveBeenCalledWith('deal_type', 'new_facility');
    });

    it('applies search filter with ilike on name and reference', async () => {
      const mockDealsChain = createQueryChain({ data: [], error: null, count: 0 });
      mockSupabase.from.mockReturnValue(mockDealsChain);

      const request = createMockRequest('/api/deals', {
        searchParams: { search: 'apollo' },
      });
      await GET(request);

      expect(mockDealsChain.or).toHaveBeenCalledWith(
        'deal_name.ilike.%apollo%,deal_reference.ilike.%apollo%'
      );
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns database error when query fails', async () => {
      const mockDealsChain = createQueryChain({
        data: null,
        error: { message: 'Connection failed', code: '08000' },
      });
      mockSupabase.from.mockReturnValue(mockDealsChain);

      const request = createMockRequest('/api/deals');
      const response = await GET(request);

      await expectErrorResponse(response, 500, 'DB_ERROR');
    });
  });

  describe('SPEC: Ordering', () => {
    it('orders by updated_at descending', async () => {
      const mockDealsChain = createQueryChain({ data: [], error: null, count: 0 });
      mockSupabase.from.mockReturnValue(mockDealsChain);

      const request = createMockRequest('/api/deals');
      await GET(request);

      expect(mockDealsChain.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });
  });
});

describe('POST /api/deals', () => {
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

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: { deal_name: 'Test Deal', deal_type: 'new_facility' },
      });
      const response = await POST(request);

      await expectErrorResponse(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('SPEC: Validation', () => {
    it('returns 400 for missing required fields', async () => {
      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {},
      });
      const response = await POST(request);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });

    it('returns 400 for invalid deal_type', async () => {
      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          deal_name: 'Test Deal',
          deal_type: 'invalid_type',
        },
      });
      const response = await POST(request);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });

    it('accepts valid deal creation request', async () => {
      const createdDeal = createMockDeal({ id: 'new-deal-123' });

      const dealsChain = createQueryChain({ data: createdDeal, error: null });
      const participantsChain = createQueryChain({ data: null, error: null });
      const activitiesChain = createQueryChain({ data: null, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deals':
            return dealsChain;
          case 'deal_participants':
            return participantsChain;
          case 'deal_activities':
            return activitiesChain;
          default:
            return createQueryChain();
        }
      });

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          deal_name: 'New Test Deal',
          deal_type: 'new_facility',
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await parseResponseBody(response);
      expect(body.success).toBe(true);
    });
  });

  describe('SPEC: Deal Creation', () => {
    it('creates deal with draft status by default', async () => {
      const createdDeal = createMockDeal();
      const dealsChain = createQueryChain({ data: createdDeal, error: null });
      const participantsChain = createQueryChain({ data: null, error: null });
      const activitiesChain = createQueryChain({ data: null, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deals':
            return dealsChain;
          case 'deal_participants':
            return participantsChain;
          case 'deal_activities':
            return activitiesChain;
          default:
            return createQueryChain();
        }
      });

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          deal_name: 'New Deal',
          deal_type: 'new_facility',
        },
      });
      await POST(request);

      // Verify insert was called with draft status
      expect(dealsChain.insert).toHaveBeenCalled();
      const insertCall = (dealsChain.insert as Mock).mock.calls[0][0];
      expect(insertCall.status).toBe('draft');
    });

    it('adds creator as deal lead participant', async () => {
      const createdDeal = createMockDeal({ id: 'new-deal-789' });
      const dealsChain = createQueryChain({ data: createdDeal, error: null });
      const participantsChain = createQueryChain({ data: null, error: null });
      const activitiesChain = createQueryChain({ data: null, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deals':
            return dealsChain;
          case 'deal_participants':
            return participantsChain;
          case 'deal_activities':
            return activitiesChain;
          default:
            return createQueryChain();
        }
      });

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          deal_name: 'New Deal',
          deal_type: 'new_facility',
        },
      });
      await POST(request);

      // Verify participant was added
      expect(participantsChain.insert).toHaveBeenCalled();
      const insertCall = (participantsChain.insert as Mock).mock.calls[0][0];
      expect(insertCall.user_id).toBe(DEFAULT_USER.id);
      expect(insertCall.deal_role).toBe('deal_lead');
      expect(insertCall.can_approve).toBe(true);
    });

    it('logs deal creation activity', async () => {
      const createdDeal = createMockDeal();
      const dealsChain = createQueryChain({ data: createdDeal, error: null });
      const participantsChain = createQueryChain({ data: null, error: null });
      const activitiesChain = createQueryChain({ data: null, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deals':
            return dealsChain;
          case 'deal_participants':
            return participantsChain;
          case 'deal_activities':
            return activitiesChain;
          default:
            return createQueryChain();
        }
      });

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          deal_name: 'Activity Test Deal',
          deal_type: 'new_facility',
        },
      });
      await POST(request);

      expect(activitiesChain.insert).toHaveBeenCalled();
      const insertCall = (activitiesChain.insert as Mock).mock.calls[0][0];
      expect(insertCall.activity_type).toBe('deal_created');
    });
  });

  describe('SPEC: Database Error Handling', () => {
    it('returns 500 when deal creation fails', async () => {
      const dealsChain = createQueryChain({
        data: null,
        error: { message: 'Insert failed', code: '23505' },
      });

      mockSupabase.from.mockReturnValue(dealsChain);

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          deal_name: 'Failing Deal',
          deal_type: 'new_facility',
        },
      });
      const response = await POST(request);

      await expectErrorResponse(response, 500, 'DB_ERROR');
    });
  });

  describe('SPEC: Additional Participants', () => {
    it('adds provided participants to the deal', async () => {
      const createdDeal = createMockDeal();
      const dealsChain = createQueryChain({ data: createdDeal, error: null });
      const participantsChain = createQueryChain({ data: null, error: null });
      const activitiesChain = createQueryChain({ data: null, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deals':
            return dealsChain;
          case 'deal_participants':
            return participantsChain;
          case 'deal_activities':
            return activitiesChain;
          default:
            return createQueryChain();
        }
      });

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          deal_name: 'Multi-party Deal',
          deal_type: 'new_facility',
          participants: [
            { party_name: 'Lender A', party_type: 'lender_side' },
            { party_name: 'Borrower Inc', party_type: 'borrower_side' },
          ],
        },
      });
      await POST(request);

      // First insert is for creator, second is for additional participants
      const insertCalls = (participantsChain.insert as Mock).mock.calls;
      expect(insertCalls.length).toBeGreaterThanOrEqual(2);
    });

    it('skips participants with empty party_name', async () => {
      const createdDeal = createMockDeal();
      const dealsChain = createQueryChain({ data: createdDeal, error: null });
      const participantsChain = createQueryChain({ data: null, error: null });
      const activitiesChain = createQueryChain({ data: null, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deals':
            return dealsChain;
          case 'deal_participants':
            return participantsChain;
          case 'deal_activities':
            return activitiesChain;
          default:
            return createQueryChain();
        }
      });

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          deal_name: 'Deal with Empty Participant',
          deal_type: 'new_facility',
          participants: [
            { party_name: '', party_type: 'lender_side' },
            { party_name: '   ', party_type: 'borrower_side' },
          ],
        },
      });
      await POST(request);

      // Only creator should be added
      const insertCalls = (participantsChain.insert as Mock).mock.calls;
      // First call adds the creator, no additional participants should be added
      expect(insertCalls.length).toBe(1);
    });
  });
});
