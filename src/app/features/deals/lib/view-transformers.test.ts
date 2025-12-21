/**
 * View Transformers Tests
 *
 * These tests serve as living documentation of how deal data is transformed for different views.
 * They demonstrate that data transformations are independently testable, separate from UI.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. transformToKanbanView groups deals into columns by status (draft, active, paused, agreed, closed)
 * 2. Invalid/unrecognized status values are silently excluded from all columns
 * 3. Empty input arrays produce empty column groups (no errors)
 * 4. transformToTimelineView separates deals with target_close_date from those without
 * 5. Deals with dates are sorted chronologically (earliest first)
 * 6. Deals without dates go to a separate "undated" bucket
 * 7. transformToInboxView groups deals by priority level (critical, high, medium, low)
 * 8. Priority is determined by the deal's priority.level property
 * 9. Invalid priority levels are silently excluded from all priority groups
 * 10. All transformers produce deterministic output for consistent UI rendering
 */

import { describe, it, expect } from 'vitest';
import {
  transformToKanbanView,
  transformToTimelineView,
  transformToInboxView,
} from './view-transformers';
import type { DealWithStats } from './types';

// Mock deals for testing
const createMockDeal = (overrides: Partial<DealWithStats> = {}): DealWithStats => ({
  id: '1',
  organization_id: 'org-1',
  created_by: 'user-1',
  deal_name: 'Test Deal',
  description: null,
  deal_type: 'new_facility',
  status: 'draft',
  negotiation_mode: 'collaborative',
  base_facility_id: null,
  target_close_date: null,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  stats: {
    total_terms: 10,
    agreed_terms: 5,
    pending_proposals: 2,
    participant_count: 3,
  },
  ...overrides,
});

describe('transformToKanbanView', () => {
  it('groups deals by status', () => {
    const deals = [
      createMockDeal({ id: '1', status: 'draft' }),
      createMockDeal({ id: '2', status: 'active' }),
      createMockDeal({ id: '3', status: 'active' }),
      createMockDeal({ id: '4', status: 'agreed' }),
    ];

    const result = transformToKanbanView(deals);

    expect(result.draft).toHaveLength(1);
    expect(result.active).toHaveLength(2);
    expect(result.paused).toHaveLength(0);
    expect(result.agreed).toHaveLength(1);
    expect(result.closed).toHaveLength(0);
  });

  it('handles empty array', () => {
    const result = transformToKanbanView([]);

    expect(result.draft).toEqual([]);
    expect(result.active).toEqual([]);
    expect(result.paused).toEqual([]);
    expect(result.agreed).toEqual([]);
    expect(result.closed).toEqual([]);
  });

  it('ignores invalid status values', () => {
    const deals = [
      createMockDeal({ id: '1', status: 'invalid' as any }),
      createMockDeal({ id: '2', status: 'active' }),
    ];

    const result = transformToKanbanView(deals);

    expect(result.active).toHaveLength(1);
    // Invalid status deal is not in any column
    const totalDeals = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalDeals).toBe(1);
  });
});

describe('transformToTimelineView', () => {
  it('separates deals with dates from those without', () => {
    const deals = [
      createMockDeal({ id: '1', target_close_date: '2025-03-01' }),
      createMockDeal({ id: '2', target_close_date: null }),
      createMockDeal({ id: '3', target_close_date: '2025-02-01' }),
      createMockDeal({ id: '4', target_close_date: null }),
    ];

    const result = transformToTimelineView(deals);

    expect(result.dealsWithDates).toHaveLength(2);
    expect(result.dealsWithoutDates).toHaveLength(2);
  });

  it('sorts deals with dates by target_close_date', () => {
    const deals = [
      createMockDeal({ id: '1', target_close_date: '2025-03-15' }),
      createMockDeal({ id: '2', target_close_date: '2025-01-10' }),
      createMockDeal({ id: '3', target_close_date: '2025-02-20' }),
    ];

    const result = transformToTimelineView(deals);

    expect(result.dealsWithDates[0].id).toBe('2'); // Earliest date
    expect(result.dealsWithDates[1].id).toBe('3');
    expect(result.dealsWithDates[2].id).toBe('1'); // Latest date
  });

  it('handles empty array', () => {
    const result = transformToTimelineView([]);

    expect(result.dealsWithDates).toEqual([]);
    expect(result.dealsWithoutDates).toEqual([]);
  });
});

describe('transformToInboxView', () => {
  it('groups deals by priority level', () => {
    const deals = [
      { ...createMockDeal({ id: '1' }), priority: { level: 'critical', score: 90, reasons: [], primaryReason: '', actionSuggestion: '' } },
      { ...createMockDeal({ id: '2' }), priority: { level: 'high', score: 70, reasons: [], primaryReason: '', actionSuggestion: '' } },
      { ...createMockDeal({ id: '3' }), priority: { level: 'high', score: 65, reasons: [], primaryReason: '', actionSuggestion: '' } },
      { ...createMockDeal({ id: '4' }), priority: { level: 'low', score: 20, reasons: [], primaryReason: '', actionSuggestion: '' } },
    ];

    const result = transformToInboxView(deals);

    expect(result.critical).toHaveLength(1);
    expect(result.high).toHaveLength(2);
    expect(result.medium).toHaveLength(0);
    expect(result.low).toHaveLength(1);
  });

  it('handles empty array', () => {
    const result = transformToInboxView([]);

    expect(result.critical).toEqual([]);
    expect(result.high).toEqual([]);
    expect(result.medium).toEqual([]);
    expect(result.low).toEqual([]);
  });

  it('ignores invalid priority levels', () => {
    const deals = [
      { ...createMockDeal({ id: '1' }), priority: { level: 'invalid' as any, score: 50, reasons: [], primaryReason: '', actionSuggestion: '' } },
      { ...createMockDeal({ id: '2' }), priority: { level: 'high', score: 70, reasons: [], primaryReason: '', actionSuggestion: '' } },
    ];

    const result = transformToInboxView(deals);

    expect(result.high).toHaveLength(1);
    // Invalid priority deal is not in any group
    const totalDeals = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalDeals).toBe(1);
  });
});
