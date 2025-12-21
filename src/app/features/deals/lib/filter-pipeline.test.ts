/**
 * Filter Pipeline Tests
 *
 * These tests serve as living documentation of the intended filter pipeline behavior.
 * They explicitly cover edge cases and prevent regression.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. Filters are composable via pipe() and can be chained in any order
 * 2. createPipeline() produces reusable, preconfigured filter chains
 * 3. "all" status/type values bypass filtering (return everything)
 * 4. Empty arrays return empty results (no errors thrown)
 * 5. Null deadline dates are excluded from deadline-based filters
 * 6. Progress is calculated as (agreed_terms / total_terms) * 100
 * 7. sortByMultiple applies primary sort first, then secondary for ties
 * 8. Pagination is 1-indexed (page 1 = first page)
 * 9. Pre-configured pipelines (urgentDealsFilter, etc.) are composable presets
 * 10. Invalid status values in deals are silently excluded from results
 */

import { describe, it, expect } from 'vitest';
import type { DealWithStats } from './types';
import {
  pipe,
  createPipeline,
  filterBySearch,
  filterByStatus,
  filterByStatuses,
  excludeStatuses,
  filterByType,
  filterByTypes,
  filterByDeadlineBefore,
  filterByDeadlineWithinDays,
  filterByUpdatedSince,
  filterByPendingProposals,
  filterByProgress,
  filterByParticipantCount,
  sortBy,
  sortByMultiple,
  limit,
  skip,
  paginate,
  filterBy,
  reverse,
  urgentDealsFilter,
  stalledDealsFilter,
  completedDealsFilter,
} from './filter-pipeline';

// Mock deal factory
function createMockDeal(overrides: Partial<DealWithStats> = {}): DealWithStats {
  return {
    id: `deal-${Math.random()}`,
    organization_id: 'org-1',
    created_by: 'user-1',
    deal_name: 'Test Deal',
    description: null,
    deal_type: 'new_facility',
    status: 'active',
    negotiation_mode: 'collaborative',
    base_facility_id: null,
    target_close_date: null,
    created_at: new Date('2024-01-01').toISOString(),
    updated_at: new Date('2024-01-01').toISOString(),
    stats: {
      total_terms: 10,
      agreed_terms: 5,
      pending_proposals: 0,
      participant_count: 2,
    },
    ...overrides,
  };
}

describe('Filter Pipeline', () => {
  describe('pipe', () => {
    it('should apply filters in sequence', () => {
      const deals = [
        createMockDeal({ deal_name: 'Apollo', status: 'active' }),
        createMockDeal({ deal_name: 'Beta', status: 'draft' }),
        createMockDeal({ deal_name: 'Gamma', status: 'active' }),
      ];

      const result = pipe(
        deals,
        filterByStatus('active'),
        filterBySearch('apollo')
      );

      expect(result).toHaveLength(1);
      expect(result[0].deal_name).toBe('Apollo');
    });

    it('should handle empty input', () => {
      const result = pipe([], filterByStatus('active'));
      expect(result).toEqual([]);
    });
  });

  describe('createPipeline', () => {
    it('should create reusable pipeline', () => {
      const activeDealsFilter = createPipeline([
        filterByStatus('active'),
        sortBy('deal_name', 'asc'),
      ]);

      const deals = [
        createMockDeal({ deal_name: 'Zulu', status: 'active' }),
        createMockDeal({ deal_name: 'Alpha', status: 'draft' }),
        createMockDeal({ deal_name: 'Beta', status: 'active' }),
      ];

      const result = activeDealsFilter(deals);

      expect(result).toHaveLength(2);
      expect(result[0].deal_name).toBe('Beta');
      expect(result[1].deal_name).toBe('Zulu');
    });
  });

  describe('filterBySearch', () => {
    it('should filter by deal name', () => {
      const deals = [
        createMockDeal({ deal_name: 'Project Apollo' }),
        createMockDeal({ deal_name: 'Beta Corp' }),
        createMockDeal({ deal_name: 'Apollo Industries' }),
      ];

      const result = filterBySearch('apollo')(deals);

      expect(result).toHaveLength(2);
      expect(result.every(d => d.deal_name.toLowerCase().includes('apollo'))).toBe(true);
    });

    it('should handle empty query', () => {
      const deals = [createMockDeal(), createMockDeal()];
      const result = filterBySearch('')(deals);
      expect(result).toHaveLength(2);
    });
  });

  describe('filterByStatus', () => {
    it('should filter by single status', () => {
      const deals = [
        createMockDeal({ status: 'active' }),
        createMockDeal({ status: 'draft' }),
        createMockDeal({ status: 'active' }),
      ];

      const result = filterByStatus('active')(deals);

      expect(result).toHaveLength(2);
      expect(result.every(d => d.status === 'active')).toBe(true);
    });

    it('should return all deals for "all" status', () => {
      const deals = [
        createMockDeal({ status: 'active' }),
        createMockDeal({ status: 'draft' }),
      ];

      const result = filterByStatus('all')(deals);
      expect(result).toHaveLength(2);
    });
  });

  describe('filterByStatuses', () => {
    it('should filter by multiple statuses', () => {
      const deals = [
        createMockDeal({ status: 'active' }),
        createMockDeal({ status: 'draft' }),
        createMockDeal({ status: 'paused' }),
        createMockDeal({ status: 'closed' }),
      ];

      const result = filterByStatuses(['active', 'paused'])(deals);

      expect(result).toHaveLength(2);
      expect(result.every(d => d.status === 'active' || d.status === 'paused')).toBe(true);
    });
  });

  describe('excludeStatuses', () => {
    it('should exclude specific statuses', () => {
      const deals = [
        createMockDeal({ status: 'active' }),
        createMockDeal({ status: 'closed' }),
        createMockDeal({ status: 'terminated' }),
      ];

      const result = excludeStatuses(['closed', 'terminated'])(deals);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
    });
  });

  describe('filterByType', () => {
    it('should filter by deal type', () => {
      const deals = [
        createMockDeal({ deal_type: 'new_facility' }),
        createMockDeal({ deal_type: 'amendment' }),
        createMockDeal({ deal_type: 'new_facility' }),
      ];

      const result = filterByType('new_facility')(deals);

      expect(result).toHaveLength(2);
      expect(result.every(d => d.deal_type === 'new_facility')).toBe(true);
    });

    it('should return all deals for "all" type', () => {
      const deals = [
        createMockDeal({ deal_type: 'new_facility' }),
        createMockDeal({ deal_type: 'amendment' }),
      ];

      const result = filterByType('all')(deals);
      expect(result).toHaveLength(2);
    });
  });

  describe('filterByTypes', () => {
    it('should filter by multiple types', () => {
      const deals = [
        createMockDeal({ deal_type: 'new_facility' }),
        createMockDeal({ deal_type: 'amendment' }),
        createMockDeal({ deal_type: 'waiver' }),
      ];

      const result = filterByTypes(['amendment', 'waiver'])(deals);

      expect(result).toHaveLength(2);
    });
  });

  describe('filterByDeadlineBefore', () => {
    it('should filter deals with deadlines before date', () => {
      const cutoff = new Date('2024-06-01');
      const deals = [
        createMockDeal({ target_close_date: '2024-05-01' }),
        createMockDeal({ target_close_date: '2024-07-01' }),
        createMockDeal({ target_close_date: null }),
      ];

      const result = filterByDeadlineBefore(cutoff)(deals);

      expect(result).toHaveLength(1);
      expect(result[0].target_close_date).toBe('2024-05-01');
    });
  });

  describe('filterByDeadlineWithinDays', () => {
    it('should filter deals due within N days', () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

      const deals = [
        createMockDeal({ target_close_date: tomorrow.toISOString() }),
        createMockDeal({ target_close_date: nextWeek.toISOString() }),
      ];

      const result = filterByDeadlineWithinDays(7)(deals);

      expect(result).toHaveLength(1);
    });
  });

  describe('filterByUpdatedSince', () => {
    it('should filter deals updated after date', () => {
      const cutoff = new Date('2024-06-01');
      const deals = [
        createMockDeal({ updated_at: '2024-05-01T00:00:00Z' }),
        createMockDeal({ updated_at: '2024-07-01T00:00:00Z' }),
        createMockDeal({ updated_at: '2024-08-01T00:00:00Z' }),
      ];

      const result = filterByUpdatedSince(cutoff)(deals);

      expect(result).toHaveLength(2);
    });
  });

  describe('filterByPendingProposals', () => {
    it('should filter by minimum proposals', () => {
      const deals = [
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 0, participant_count: 2 } }),
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 3, participant_count: 2 } }),
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 5, participant_count: 2 } }),
      ];

      const result = filterByPendingProposals({ min: 3 })(deals);

      expect(result).toHaveLength(2);
    });

    it('should filter by max proposals', () => {
      const deals = [
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 2, participant_count: 2 } }),
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 5, participant_count: 2 } }),
      ];

      const result = filterByPendingProposals({ max: 3 })(deals);

      expect(result).toHaveLength(1);
      if (result[0].stats) {
        expect(result[0].stats.pending_proposals).toBe(2);
      }
    });
  });

  describe('filterByProgress', () => {
    it('should filter by progress range', () => {
      const deals = [
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 2, pending_proposals: 0, participant_count: 2 } }), // 20%
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 0, participant_count: 2 } }), // 50%
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 9, pending_proposals: 0, participant_count: 2 } }), // 90%
      ];

      const result = filterByProgress({ min: 40, max: 60 })(deals);

      expect(result).toHaveLength(1);
      if (result[0].stats) {
        expect(result[0].stats.agreed_terms).toBe(5);
      }
    });
  });

  describe('filterByParticipantCount', () => {
    it('should filter by participant count', () => {
      const deals = [
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 0, participant_count: 2 } }),
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 0, participant_count: 5 } }),
        createMockDeal({ stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 0, participant_count: 10 } }),
      ];

      const result = filterByParticipantCount({ min: 5 })(deals);

      expect(result).toHaveLength(2);
    });
  });

  describe('sortBy', () => {
    it('should sort by deal name ascending', () => {
      const deals = [
        createMockDeal({ deal_name: 'Zulu' }),
        createMockDeal({ deal_name: 'Alpha' }),
        createMockDeal({ deal_name: 'Beta' }),
      ];

      const result = sortBy('deal_name', 'asc')(deals);

      expect(result.length).toBe(3);
      if (result[0] && result[1] && result[2]) {
        expect(result[0].deal_name).toBe('Alpha');
        expect(result[1].deal_name).toBe('Beta');
        expect(result[2].deal_name).toBe('Zulu');
      }
    });

    it('should sort by deal name descending', () => {
      const deals = [
        createMockDeal({ deal_name: 'Alpha' }),
        createMockDeal({ deal_name: 'Zulu' }),
        createMockDeal({ deal_name: 'Beta' }),
      ];

      const result = sortBy('deal_name', 'desc')(deals);

      expect(result.length).toBe(3);
      if (result[0] && result[1] && result[2]) {
        expect(result[0].deal_name).toBe('Zulu');
        expect(result[1].deal_name).toBe('Beta');
        expect(result[2].deal_name).toBe('Alpha');
      }
    });
  });

  describe('sortByMultiple', () => {
    it('should sort by primary and secondary fields', () => {
      const deals = [
        createMockDeal({ status: 'active', deal_name: 'Zulu' }),
        createMockDeal({ status: 'draft', deal_name: 'Alpha' }),
        createMockDeal({ status: 'active', deal_name: 'Beta' }),
      ];

      const result = sortByMultiple({
        primary: { field: 'status', direction: 'asc' },
        secondary: { field: 'deal_name', direction: 'asc' },
      })(deals);

      expect(result.length).toBe(3);
      if (result[0] && result[1] && result[2]) {
        expect(result[0].status).toBe('active');
        expect(result[0].deal_name).toBe('Beta');
        expect(result[1].status).toBe('active');
        expect(result[1].deal_name).toBe('Zulu');
        expect(result[2].status).toBe('draft');
      }
    });
  });

  describe('limit', () => {
    it('should limit results', () => {
      const deals = [
        createMockDeal(),
        createMockDeal(),
        createMockDeal(),
        createMockDeal(),
      ];

      const result = limit(2)(deals);
      expect(result).toHaveLength(2);
    });
  });

  describe('skip', () => {
    it('should skip first N results', () => {
      const deals = [
        createMockDeal({ deal_name: 'First' }),
        createMockDeal({ deal_name: 'Second' }),
        createMockDeal({ deal_name: 'Third' }),
      ];

      const result = skip(1)(deals);

      expect(result).toHaveLength(2);
      expect((result[0] as DealWithStats).deal_name).toBe('Second');
    });
  });

  describe('paginate', () => {
    it('should paginate results', () => {
      const deals = Array.from({ length: 25 }, (_, i) =>
        createMockDeal({ deal_name: `Deal ${i + 1}` })
      );

      const page1 = paginate({ page: 1, pageSize: 10 })(deals);
      const page2 = paginate({ page: 2, pageSize: 10 })(deals);

      expect(page1).toHaveLength(10);
      expect((page1[0] as DealWithStats).deal_name).toBe('Deal 1');

      expect(page2).toHaveLength(10);
      expect((page2[0] as DealWithStats).deal_name).toBe('Deal 11');
    });
  });

  describe('filterBy', () => {
    it('should filter by custom predicate', () => {
      const deals = [
        createMockDeal({ stats: { total_terms: 5, agreed_terms: 2, pending_proposals: 0, participant_count: 2 } }),
        createMockDeal({ stats: { total_terms: 15, agreed_terms: 8, pending_proposals: 0, participant_count: 2 } }),
      ];

      const result = filterBy((deal: DealWithStats) => (deal.stats?.total_terms || 0) > 10)(deals);

      expect(result).toHaveLength(1);
      if (result[0].stats) {
        expect(result[0].stats.total_terms).toBe(15);
      }
    });
  });

  describe('reverse', () => {
    it('should reverse order', () => {
      const deals = [
        createMockDeal({ deal_name: 'First' }),
        createMockDeal({ deal_name: 'Second' }),
        createMockDeal({ deal_name: 'Third' }),
      ];

      const result = reverse()(deals);

      expect(result.length).toBe(3);
      expect((result[0] as DealWithStats).deal_name).toBe('Third');
      expect((result[2] as DealWithStats).deal_name).toBe('First');
    });
  });

  describe('Pre-configured pipelines', () => {
    it('urgentDealsFilter should work', () => {
      const deals = [
        createMockDeal({
          status: 'active',
          target_close_date: '2024-12-01',
          stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 3, participant_count: 2 },
        }),
        createMockDeal({
          status: 'draft',
          target_close_date: '2024-12-15',
          stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 0, participant_count: 2 },
        }),
        createMockDeal({
          status: 'active',
          target_close_date: '2024-11-01',
          stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 2, participant_count: 2 },
        }),
      ];

      const result = urgentDealsFilter(deals);

      expect(result).toHaveLength(2);
      expect(result.every(d => d.status === 'active')).toBe(true);
      expect(result.every(d => (d.stats?.pending_proposals || 0) > 0)).toBe(true);
    });

    it('completedDealsFilter should work', () => {
      const deals = [
        createMockDeal({ status: 'active' }),
        createMockDeal({ status: 'agreed' }),
        createMockDeal({ status: 'closed' }),
      ];

      const result = completedDealsFilter(deals);

      expect(result).toHaveLength(2);
      expect(result.every(d => d.status === 'agreed' || d.status === 'closed')).toBe(true);
    });
  });

  describe('Complex pipelines', () => {
    it('should chain multiple filters and sorts', () => {
      const deals = [
        createMockDeal({
          deal_name: 'Zulu Active',
          status: 'active',
          deal_type: 'new_facility',
          stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 3, participant_count: 2 },
        }),
        createMockDeal({
          deal_name: 'Alpha Closed',
          status: 'closed',
          deal_type: 'new_facility',
          stats: { total_terms: 10, agreed_terms: 10, pending_proposals: 0, participant_count: 2 },
        }),
        createMockDeal({
          deal_name: 'Beta Active',
          status: 'active',
          deal_type: 'amendment',
          stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 1, participant_count: 2 },
        }),
        createMockDeal({
          deal_name: 'Gamma Active',
          status: 'active',
          deal_type: 'new_facility',
          stats: { total_terms: 10, agreed_terms: 5, pending_proposals: 5, participant_count: 2 },
        }),
      ];

      const result = pipe(
        deals,
        filterByStatus('active'),
        filterByType('new_facility'),
        filterByPendingProposals({ min: 2 }),
        sortBy('deal_name', 'asc')
      );

      expect(result).toHaveLength(2);
      expect(result[0].deal_name).toBe('Gamma Active');
      expect(result[1].deal_name).toBe('Zulu Active');
    });
  });
});
