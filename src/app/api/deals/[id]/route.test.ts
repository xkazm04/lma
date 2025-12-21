/**
 * Deals [id] API Route Tests
 *
 * Tests for the /api/deals/[id] endpoint (get, update, delete operations).
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. GET /api/deals/[id] returns deal with stats (terms, proposals, participants)
 * 2. PUT /api/deals/[id] validates input using updateDealSchema
 * 3. DELETE /api/deals/[id] only allows deletion of draft deals
 * 4. Non-draft deals return 403 Forbidden when attempting deletion
 * 5. Related data is cascade deleted before the deal
 * 6. Not found returns 404 with proper error structure
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { GET, PUT, DELETE } from './route';
import {
  createMockRequest,
  createMockSupabaseClient,
  createQueryChain,
  createMockDeal,
  createRouteParams,
  parseResponseBody,
  expectSuccessResponse,
  expectErrorResponse,
  setupApiRouteTest,
  cleanupApiRouteTest,
  type MockSupabaseClient,
} from '@/lib/test-utils';
import type { Deal } from '@/types';

// Mock Supabase
let mockSupabase: MockSupabaseClient;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe('GET /api/deals/[id]', () => {
  beforeEach(() => {
    setupApiRouteTest();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(cleanupApiRouteTest);

  describe('SPEC: Basic Retrieval', () => {
    it('returns deal with stats when found', async () => {
      const mockDeal = createMockDeal({ id: 'deal-456' });

      const dealsChain = createQueryChain({ data: mockDeal, error: null });
      const termsChain = createQueryChain({ data: null, error: null, count: 10 });
      const agreedTermsChain = createQueryChain({ data: null, error: null, count: 5 });
      const proposalsChain = createQueryChain({ data: null, error: null, count: 3 });
      const participantsChain = createQueryChain({ data: null, error: null, count: 4 });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deals':
            return dealsChain;
          case 'negotiation_terms':
            // Return different chain based on negotiation_status filter
            return termsChain;
          case 'term_proposals':
            return proposalsChain;
          case 'deal_participants':
            return participantsChain;
          default:
            return createQueryChain();
        }
      });

      const request = createMockRequest('/api/deals/deal-456');
      const params = createRouteParams({ id: 'deal-456' });
      const response = await GET(request, params);

      expect(response.status).toBe(200);
      const body = await parseResponseBody<Deal & { stats: Record<string, number> }>(response);
      expect(body.success).toBe(true);
      expect(body.data?.id).toBe('deal-456');
      expect(body.data?.deal_name).toBe('Test Deal');
    });

    it('returns 404 when deal not found', async () => {
      const dealsChain = createQueryChain({
        data: null,
        error: { message: 'Row not found', code: 'PGRST116' },
      });
      mockSupabase.from.mockReturnValue(dealsChain);

      const request = createMockRequest('/api/deals/nonexistent');
      const params = createRouteParams({ id: 'nonexistent' });
      const response = await GET(request, params);

      await expectErrorResponse(response, 404, 'NOT_FOUND');
    });
  });

  describe('SPEC: Stats Calculation', () => {
    it('includes term statistics in response', async () => {
      const mockDeal = createMockDeal();
      const dealsChain = createQueryChain({ data: mockDeal, error: null });
      const termsChain = createQueryChain({ data: null, error: null, count: 15 });
      const proposalsChain = createQueryChain({ data: null, error: null, count: 2 });
      const participantsChain = createQueryChain({ data: null, error: null, count: 5 });

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

      const request = createMockRequest('/api/deals/deal-123');
      const params = createRouteParams({ id: 'deal-123' });
      const response = await GET(request, params);

      const body = await parseResponseBody<Deal & { stats: Record<string, number> }>(response);
      expect(body.data?.stats).toBeDefined();
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns 500 for database errors other than not found', async () => {
      const dealsChain = createQueryChain({
        data: null,
        error: { message: 'Connection timeout', code: '08000' },
      });
      mockSupabase.from.mockReturnValue(dealsChain);

      const request = createMockRequest('/api/deals/deal-123');
      const params = createRouteParams({ id: 'deal-123' });
      const response = await GET(request, params);

      await expectErrorResponse(response, 500, 'DB_ERROR');
    });
  });
});

describe('PUT /api/deals/[id]', () => {
  beforeEach(() => {
    setupApiRouteTest();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(cleanupApiRouteTest);

  describe('SPEC: Validation', () => {
    it('returns 400 for invalid input', async () => {
      const request = createMockRequest('/api/deals/deal-123', {
        method: 'PUT',
        body: {
          // deal_name must be at least 1 character - empty string is invalid
          deal_name: '',
        },
      });
      const params = createRouteParams({ id: 'deal-123' });
      const response = await PUT(request, params);

      await expectErrorResponse(response, 400, 'VALIDATION_ERROR');
    });

    it('accepts valid partial updates', async () => {
      const updatedDeal = createMockDeal({ deal_name: 'Updated Deal Name' });
      const dealsChain = createQueryChain({ data: updatedDeal, error: null });
      mockSupabase.from.mockReturnValue(dealsChain);

      const request = createMockRequest('/api/deals/deal-123', {
        method: 'PUT',
        body: {
          deal_name: 'Updated Deal Name',
        },
      });
      const params = createRouteParams({ id: 'deal-123' });
      const response = await PUT(request, params);

      expect(response.status).toBe(200);
      const body = await parseResponseBody<Deal>(response);
      expect(body.success).toBe(true);
      expect(body.data?.deal_name).toBe('Updated Deal Name');
    });
  });

  describe('SPEC: Update Behavior', () => {
    it('sets updated_at timestamp on update', async () => {
      const dealsChain = createQueryChain({ data: createMockDeal(), error: null });
      mockSupabase.from.mockReturnValue(dealsChain);

      const request = createMockRequest('/api/deals/deal-123', {
        method: 'PUT',
        body: { deal_name: 'Test Update' },
      });
      const params = createRouteParams({ id: 'deal-123' });
      await PUT(request, params);

      const updateCall = (dealsChain.update as Mock).mock.calls[0][0];
      expect(updateCall.updated_at).toBeDefined();
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns 500 when update fails', async () => {
      const dealsChain = createQueryChain({
        data: null,
        error: { message: 'Update failed', code: '42000' },
      });
      mockSupabase.from.mockReturnValue(dealsChain);

      const request = createMockRequest('/api/deals/deal-123', {
        method: 'PUT',
        body: { deal_name: 'Failed Update' },
      });
      const params = createRouteParams({ id: 'deal-123' });
      const response = await PUT(request, params);

      await expectErrorResponse(response, 500, 'DB_ERROR');
    });
  });
});

describe('DELETE /api/deals/[id]', () => {
  beforeEach(() => {
    setupApiRouteTest();
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(cleanupApiRouteTest);

  describe('SPEC: Draft Only Deletion', () => {
    it('allows deletion of draft deals', async () => {
      const draftDeal = { status: 'draft' };
      const fetchChain = createQueryChain({ data: draftDeal, error: null });
      const deleteChain = createQueryChain({ data: null, error: null });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deals') {
          callCount++;
          // First call is to fetch the deal, subsequent calls are for operations
          if (callCount === 1) {
            return fetchChain;
          }
          return deleteChain;
        }
        return createQueryChain({ data: null, error: null });
      });

      const request = createMockRequest('/api/deals/deal-123', { method: 'DELETE' });
      const params = createRouteParams({ id: 'deal-123' });
      const response = await DELETE(request, params);

      expect(response.status).toBe(200);
    });

    it('returns 403 for active deals', async () => {
      const activeDeal = { status: 'active' };
      const fetchChain = createQueryChain({ data: activeDeal, error: null });
      mockSupabase.from.mockReturnValue(fetchChain);

      const request = createMockRequest('/api/deals/deal-123', { method: 'DELETE' });
      const params = createRouteParams({ id: 'deal-123' });
      const response = await DELETE(request, params);

      await expectErrorResponse(response, 403, 'FORBIDDEN');
    });

    it('returns 403 for completed deals', async () => {
      const completedDeal = { status: 'completed' };
      const fetchChain = createQueryChain({ data: completedDeal, error: null });
      mockSupabase.from.mockReturnValue(fetchChain);

      const request = createMockRequest('/api/deals/deal-123', { method: 'DELETE' });
      const params = createRouteParams({ id: 'deal-123' });
      const response = await DELETE(request, params);

      await expectErrorResponse(response, 403, 'FORBIDDEN');
    });

    it('returns 403 for in_negotiation deals', async () => {
      const negotiatingDeal = { status: 'in_negotiation' };
      const fetchChain = createQueryChain({ data: negotiatingDeal, error: null });
      mockSupabase.from.mockReturnValue(fetchChain);

      const request = createMockRequest('/api/deals/deal-123', { method: 'DELETE' });
      const params = createRouteParams({ id: 'deal-123' });
      const response = await DELETE(request, params);

      await expectErrorResponse(response, 403, 'FORBIDDEN');
    });
  });

  describe('SPEC: Cascade Deletion', () => {
    it('deletes related data before deleting deal', async () => {
      const draftDeal = { status: 'draft' };
      const deletedTables: string[] = [];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deals') {
          // First call fetches, subsequent deletes
          const chain = createQueryChain({ data: draftDeal, error: null });
          chain.delete = vi.fn().mockImplementation(() => {
            deletedTables.push(table);
            return chain;
          });
          return chain;
        }

        const chain = createQueryChain({ data: null, error: null });
        chain.delete = vi.fn().mockImplementation(() => {
          deletedTables.push(table);
          return chain;
        });
        return chain;
      });

      const request = createMockRequest('/api/deals/deal-123', { method: 'DELETE' });
      const params = createRouteParams({ id: 'deal-123' });
      await DELETE(request, params);

      // Verify related tables are deleted
      expect(deletedTables).toContain('deal_activities');
      expect(deletedTables).toContain('term_comments');
      expect(deletedTables).toContain('term_proposals');
      expect(deletedTables).toContain('negotiation_terms');
      expect(deletedTables).toContain('deal_participants');
    });
  });

  describe('SPEC: Not Found Handling', () => {
    it('returns 404 when deal does not exist', async () => {
      const fetchChain = createQueryChain({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });
      mockSupabase.from.mockReturnValue(fetchChain);

      const request = createMockRequest('/api/deals/nonexistent', { method: 'DELETE' });
      const params = createRouteParams({ id: 'nonexistent' });
      const response = await DELETE(request, params);

      await expectErrorResponse(response, 404, 'NOT_FOUND');
    });
  });

  describe('SPEC: Error Handling', () => {
    it('returns 500 when deletion fails', async () => {
      const draftDeal = { status: 'draft' };
      let callCount = 0;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deals') {
          callCount++;
          if (callCount === 1) {
            // First call - fetch deal
            return createQueryChain({ data: draftDeal, error: null });
          }
          // Delete call fails
          return createQueryChain({
            data: null,
            error: { message: 'Delete failed' },
          });
        }
        return createQueryChain({ data: null, error: null });
      });

      const request = createMockRequest('/api/deals/deal-123', { method: 'DELETE' });
      const params = createRouteParams({ id: 'deal-123' });
      const response = await DELETE(request, params);

      await expectErrorResponse(response, 500, 'DB_ERROR');
    });
  });
});
