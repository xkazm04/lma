/**
 * Composable Filter Pipeline
 *
 * A functional approach to filtering and transforming deal data.
 * Each filter is a pure function that accepts and returns an array,
 * enabling composition, reusability, and testability.
 *
 * ## Benefits
 * 1. **Composition**: Combine filters using pipe operator
 * 2. **Reusability**: Share filters across modules (Documents, Compliance, etc.)
 * 3. **Testability**: Pure functions are easy to test and reason about
 * 4. **Extensibility**: Add new filters without modifying existing code
 * 5. **Undo/Redo**: Pure functions enable state history tracking
 *
 * ## Usage
 *
 * ```typescript
 * // Individual filters
 * const filtered = filterByStatus(deals, 'active');
 *
 * // Composed pipeline
 * const result = pipe(
 *   deals,
 *   filterBySearch(searchQuery),
 *   filterByStatus(statusFilter),
 *   filterByType(typeFilter),
 *   sortBy(sortState)
 * );
 *
 * // Create reusable pipelines
 * const activeDealsFilter = createPipeline([
 *   filterByStatus('active'),
 *   sortBy({ field: 'created_at', direction: 'desc' })
 * ]);
 * const activeDeals = activeDealsFilter(deals);
 * ```
 */

import type { Deal, DealWithStats } from './types';
import type { DealSortState, DealSortField, SortDirection } from './sort-types';
import { searchDeals } from './search';

// ============================================================================
// Core Pipeline Types
// ============================================================================

/**
 * A filter function that transforms an array of items
 */
export type FilterFn<T> = (items: T[]) => T[];

/**
 * A filter configuration with metadata
 */
export interface FilterConfig<T> {
  name: string;
  description?: string;
  fn: FilterFn<T>;
}

/**
 * Pipeline state for undo/redo functionality
 */
export interface PipelineState<T> {
  input: T[];
  output: T[];
  filters: FilterConfig<T>[];
  timestamp: number;
}

// ============================================================================
// Pipeline Composition
// ============================================================================

/**
 * Compose multiple filter functions into a single pipeline
 *
 * @example
 * const pipeline = pipe(
 *   deals,
 *   filterByStatus('active'),
 *   filterByType('new_facility')
 * );
 */
export function pipe<T>(input: T[], ...filters: FilterFn<T>[]): T[] {
  return filters.reduce((acc, filter) => filter(acc), input);
}

/**
 * Create a reusable pipeline from an array of filters
 *
 * @example
 * const activeDealsFilter = createPipeline([
 *   filterByStatus('active'),
 *   sortByDate
 * ]);
 * const result = activeDealsFilter(allDeals);
 */
export function createPipeline<T>(filters: FilterFn<T>[]): FilterFn<T> {
  return (input: T[]) => pipe(input, ...filters);
}

/**
 * Create a named pipeline with metadata for debugging
 */
export function createNamedPipeline<T>(
  configs: FilterConfig<T>[]
): FilterFn<T> & { configs: FilterConfig<T>[] } {
  const pipeline = (input: T[]) => pipe(input, ...configs.map(c => c.fn));
  return Object.assign(pipeline, { configs });
}

// ============================================================================
// Search Filters
// ============================================================================

/**
 * Filter by search query (case-insensitive substring match on deal_name)
 *
 * @example
 * const filtered = filterBySearch('apollo')(deals);
 */
export function filterBySearch(query: string | null | undefined): FilterFn<DealWithStats> {
  return (deals: DealWithStats[]) => searchDeals(deals, query);
}

// ============================================================================
// Status Filters
// ============================================================================

export type DealStatus = Deal['status'] | 'all';

/**
 * Filter deals by status
 *
 * @example
 * const activeDeals = filterByStatus('active')(deals);
 * const allDeals = filterByStatus('all')(deals);
 */
export function filterByStatus(status: DealStatus): FilterFn<DealWithStats> {
  if (status === 'all') {
    return (deals) => deals;
  }

  return (deals: DealWithStats[]) => deals.filter(deal => deal.status === status);
}

/**
 * Filter deals by multiple statuses (OR logic)
 *
 * @example
 * const filtered = filterByStatuses(['active', 'paused'])(deals);
 */
export function filterByStatuses(statuses: Deal['status'][]): FilterFn<DealWithStats> {
  const statusSet = new Set(statuses);
  return (deals: DealWithStats[]) => deals.filter(deal => statusSet.has(deal.status));
}

/**
 * Exclude deals with specific statuses
 *
 * @example
 * const filtered = excludeStatuses(['closed', 'terminated'])(deals);
 */
export function excludeStatuses(statuses: Deal['status'][]): FilterFn<DealWithStats> {
  const statusSet = new Set(statuses);
  return (deals: DealWithStats[]) => deals.filter(deal => !statusSet.has(deal.status));
}

// ============================================================================
// Type Filters
// ============================================================================

export type DealType = Deal['deal_type'] | 'all';

/**
 * Filter deals by type
 *
 * @example
 * const newFacilities = filterByType('new_facility')(deals);
 */
export function filterByType(dealType: DealType): FilterFn<DealWithStats> {
  if (dealType === 'all') {
    return (deals) => deals;
  }

  return (deals: DealWithStats[]) => deals.filter(deal => deal.deal_type === dealType);
}

/**
 * Filter deals by multiple types (OR logic)
 *
 * @example
 * const filtered = filterByTypes(['amendment', 'waiver'])(deals);
 */
export function filterByTypes(types: Deal['deal_type'][]): FilterFn<DealWithStats> {
  const typeSet = new Set(types);
  return (deals: DealWithStats[]) => deals.filter(deal => typeSet.has(deal.deal_type));
}

// ============================================================================
// Date Filters
// ============================================================================

/**
 * Filter deals with deadlines before a specific date
 *
 * @example
 * const overdueDeals = filterByDeadlineBefore(new Date())(deals);
 */
export function filterByDeadlineBefore(date: Date): FilterFn<DealWithStats> {
  const timestamp = date.getTime();
  return (deals: DealWithStats[]) =>
    deals.filter(deal => {
      if (!deal.target_close_date) return false;
      return new Date(deal.target_close_date).getTime() < timestamp;
    });
}

/**
 * Filter deals with deadlines within N days
 *
 * @example
 * const upcomingDeals = filterByDeadlineWithinDays(7)(deals);
 */
export function filterByDeadlineWithinDays(days: number): FilterFn<DealWithStats> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return (deals: DealWithStats[]) =>
    deals.filter(deal => {
      if (!deal.target_close_date) return false;
      const deadline = new Date(deal.target_close_date);
      return deadline >= now && deadline <= futureDate;
    });
}

/**
 * Filter deals updated since a specific date
 *
 * @example
 * const recentlyUpdated = filterByUpdatedSince(new Date('2024-01-01'))(deals);
 */
export function filterByUpdatedSince(date: Date): FilterFn<DealWithStats> {
  const timestamp = date.getTime();
  return (deals: DealWithStats[]) =>
    deals.filter(deal => new Date(deal.updated_at).getTime() >= timestamp);
}

// ============================================================================
// Stats Filters
// ============================================================================

/**
 * Filter deals with pending proposals
 *
 * @example
 * const withProposals = filterByPendingProposals({ min: 1 })(deals);
 * const highProposals = filterByPendingProposals({ min: 5 })(deals);
 */
export function filterByPendingProposals(
  options: { min?: number; max?: number } = {}
): FilterFn<DealWithStats> {
  const { min = 0, max = Infinity } = options;

  return (deals: DealWithStats[]) =>
    deals.filter(deal => {
      const count = deal.stats?.pending_proposals || 0;
      return count >= min && count <= max;
    });
}

/**
 * Filter deals by progress percentage
 *
 * @example
 * const lowProgress = filterByProgress({ max: 25 })(deals);
 * const nearComplete = filterByProgress({ min: 90 })(deals);
 */
export function filterByProgress(
  options: { min?: number; max?: number } = {}
): FilterFn<DealWithStats> {
  const { min = 0, max = 100 } = options;

  return (deals: DealWithStats[]) =>
    deals.filter(deal => {
      if (!deal.stats || !deal.stats.total_terms || deal.stats.total_terms === 0) {
        return min === 0; // 0% progress matches if min is 0
      }
      const progress = (deal.stats.agreed_terms / deal.stats.total_terms) * 100;
      return progress >= min && progress <= max;
    });
}

/**
 * Filter deals by participant count
 *
 * @example
 * const multiParty = filterByParticipantCount({ min: 3 })(deals);
 */
export function filterByParticipantCount(
  options: { min?: number; max?: number } = {}
): FilterFn<DealWithStats> {
  const { min = 0, max = Infinity } = options;

  return (deals: DealWithStats[]) =>
    deals.filter(deal => {
      const count = deal.stats?.participant_count || 0;
      return count >= min && count <= max;
    });
}

// ============================================================================
// Sorting (as a filter operation)
// ============================================================================

/**
 * Helper function to compare deals by a specific field
 */
function compareDeals(
  a: DealWithStats,
  b: DealWithStats,
  field: DealSortField,
  direction: SortDirection
): number {
  let comparison = 0;

  const STATUS_ORDER: Record<string, number> = {
    active: 1,
    draft: 2,
    paused: 3,
    agreed: 4,
    closed: 5,
    terminated: 6,
  };

  switch (field) {
    case 'deal_name':
      comparison = a.deal_name.localeCompare(b.deal_name);
      break;

    case 'status':
      comparison = (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
      break;

    case 'progress': {
      const getProgress = (deal: DealWithStats) => {
        if (!deal.stats || !deal.stats.total_terms || deal.stats.total_terms === 0) return 0;
        return (deal.stats.agreed_terms / deal.stats.total_terms) * 100;
      };
      comparison = getProgress(a) - getProgress(b);
      break;
    }

    case 'target_close_date': {
      const dateA = a.target_close_date ? new Date(a.target_close_date).getTime() : Infinity;
      const dateB = b.target_close_date ? new Date(b.target_close_date).getTime() : Infinity;
      comparison = dateA - dateB;
      break;
    }

    case 'created_at': {
      const createdA = new Date(a.created_at).getTime();
      const createdB = new Date(b.created_at).getTime();
      comparison = createdA - createdB;
      break;
    }

    case 'participant_count':
      comparison = (a.stats?.participant_count || 0) - (b.stats?.participant_count || 0);
      break;

    default:
      return 0;
  }

  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Sort deals by a single field
 *
 * @example
 * const sorted = sortBy({ field: 'deal_name', direction: 'asc' })(deals);
 */
export function sortBy(
  field: DealSortField,
  direction: SortDirection = 'asc'
): FilterFn<DealWithStats> {
  return (deals: DealWithStats[]) =>
    [...deals].sort((a, b) => compareDeals(a, b, field, direction));
}

/**
 * Sort deals with primary and optional secondary sort
 *
 * @example
 * const sorted = sortByMultiple({
 *   primary: { field: 'status', direction: 'asc' },
 *   secondary: { field: 'created_at', direction: 'desc' }
 * })(deals);
 */
export function sortByMultiple(sortState: DealSortState): FilterFn<DealWithStats> {
  return (deals: DealWithStats[]) =>
    [...deals].sort((a, b) => {
      // Primary sort
      const primaryResult = compareDeals(
        a,
        b,
        sortState.primary.field,
        sortState.primary.direction
      );

      if (primaryResult !== 0) {
        return primaryResult;
      }

      // Secondary sort (if defined)
      if (sortState.secondary) {
        return compareDeals(
          a,
          b,
          sortState.secondary.field,
          sortState.secondary.direction
        );
      }

      return 0;
    });
}

// ============================================================================
// Utility Filters
// ============================================================================

/**
 * Limit the number of results
 *
 * @example
 * const top10 = limit(10)(deals);
 */
export function limit<T>(count: number): FilterFn<T> {
  return (items: T[]) => items.slice(0, count);
}

/**
 * Skip the first N results
 *
 * @example
 * const afterFirst10 = skip(10)(deals);
 */
export function skip<T>(count: number): FilterFn<T> {
  return (items: T[]) => items.slice(count);
}

/**
 * Paginate results
 *
 * @example
 * const page2 = paginate({ page: 2, pageSize: 20 })(deals);
 */
export function paginate<T>(options: { page: number; pageSize: number }): FilterFn<T> {
  const { page, pageSize } = options;
  const start = (page - 1) * pageSize;
  return (items: T[]) => items.slice(start, start + pageSize);
}

/**
 * Filter by custom predicate function
 *
 * @example
 * const custom = filterBy((deal) => deal.stats?.total_terms > 10)(deals);
 */
export function filterBy<T>(predicate: (item: T) => boolean): FilterFn<T> {
  return (items: T[]) => items.filter(predicate);
}

/**
 * Reverse the order of results
 *
 * @example
 * const reversed = reverse()(deals);
 */
export function reverse<T>(): FilterFn<T> {
  return (items: T[]) => [...items].reverse();
}

// ============================================================================
// Common Pipelines
// ============================================================================

/**
 * Pre-configured pipeline for active deals needing attention
 */
export const urgentDealsFilter = createNamedPipeline<DealWithStats>([
  {
    name: 'Active Only',
    fn: filterByStatus('active'),
  },
  {
    name: 'Has Pending Proposals',
    fn: filterByPendingProposals({ min: 1 }),
  },
  {
    name: 'Sort by Deadline',
    fn: sortBy('target_close_date', 'asc'),
  },
]);

/**
 * Pre-configured pipeline for stalled deals
 */
export const stalledDealsFilter = createNamedPipeline<DealWithStats>([
  {
    name: 'Active or Paused',
    fn: filterByStatuses(['active', 'paused']),
  },
  {
    name: 'Low Progress',
    fn: filterByProgress({ max: 50 }),
  },
  {
    name: 'No Recent Updates',
    fn: filterBy(deal => {
      const daysSince = (new Date().getTime() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 5;
    }),
  },
  {
    name: 'Sort by Last Updated',
    fn: sortBy('created_at', 'asc'),
  },
]);

/**
 * Pre-configured pipeline for completed deals
 */
export const completedDealsFilter = createNamedPipeline<DealWithStats>([
  {
    name: 'Agreed or Closed',
    fn: filterByStatuses(['agreed', 'closed']),
  },
  {
    name: 'Sort by Completion Date',
    fn: sortBy('created_at', 'desc'),
  },
]);
