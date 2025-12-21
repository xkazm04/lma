/**
 * Filter Pipeline Examples
 *
 * This file demonstrates various ways to use the composable filter pipeline.
 * These patterns can be reused across Documents, Compliance, and other modules.
 */

import type { DealWithStats } from './types';
import {
  pipe,
  createPipeline,
  createNamedPipeline,
  filterBySearch,
  filterByStatus,
  filterByStatuses,
  excludeStatuses,
  filterByType,
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
  urgentDealsFilter,
  stalledDealsFilter,
  completedDealsFilter,
  type FilterFn,
} from './filter-pipeline';

// ============================================================================
// Example 1: Basic Filtering
// ============================================================================

export function example1_basicFiltering(deals: DealWithStats[]) {
  // Filter active deals
  const activeDeals = filterByStatus('active')(deals);

  // Filter by search query
  const apolloDeals = filterBySearch('apollo')(deals);

  // Filter by type
  const amendments = filterByType('amendment')(deals);

  return { activeDeals, apolloDeals, amendments };
}

// ============================================================================
// Example 2: Composing Filters with pipe()
// ============================================================================

export function example2_composedFiltering(deals: DealWithStats[]) {
  // Chain multiple filters
  const result = pipe(
    deals,
    filterByStatus('active'),
    filterByType('new_facility'),
    filterByPendingProposals({ min: 1 }),
    sortBy('target_close_date', 'asc')
  );

  return result;
}

// ============================================================================
// Example 3: Reusable Filter Pipelines
// ============================================================================

// Create a reusable pipeline for high-priority deals
export const highPriorityDealsFilter = createPipeline([
  filterByStatuses(['active', 'paused']),
  filterByDeadlineWithinDays(7),
  filterByPendingProposals({ min: 3 }),
  sortBy('target_close_date', 'asc'),
]);

// Use it anywhere
export function example3_reusablePipeline(deals: DealWithStats[]) {
  return highPriorityDealsFilter(deals);
}

// ============================================================================
// Example 4: Named Pipelines for Debugging
// ============================================================================

export const executiveDashboardFilter = createNamedPipeline<DealWithStats>([
  {
    name: 'Active Deals Only',
    description: 'Show only active negotiations',
    fn: filterByStatus('active'),
  },
  {
    name: 'Large Deals',
    description: 'More than 5 participants',
    fn: filterByParticipantCount({ min: 5 }),
  },
  {
    name: 'Sort by Progress',
    description: 'Lowest progress first',
    fn: sortBy('progress', 'asc'),
  },
]);

// You can access the configuration for debugging
export function example4_namedPipeline(deals: DealWithStats[]) {
  const result = executiveDashboardFilter(deals);

  // Log pipeline configuration
  console.log('Pipeline steps:', executiveDashboardFilter.configs.map(c => c.name));

  return result;
}

// ============================================================================
// Example 5: Dynamic Filter Composition
// ============================================================================

export function example5_dynamicComposition(
  deals: DealWithStats[],
  userPreferences: {
    showOnlyActive: boolean;
    dealType?: string;
    minProgress?: number;
  }
) {
  const filters: FilterFn<DealWithStats>[] = [];

  // Conditionally add filters based on user preferences
  if (userPreferences.showOnlyActive) {
    filters.push(filterByStatus('active'));
  }

  if (userPreferences.dealType && userPreferences.dealType !== 'all') {
    filters.push(filterByType(userPreferences.dealType as any));
  }

  if (userPreferences.minProgress !== undefined) {
    filters.push(filterByProgress({ min: userPreferences.minProgress }));
  }

  // Always sort by deadline
  filters.push(sortBy('target_close_date', 'asc'));

  return pipe(deals, ...filters);
}

// ============================================================================
// Example 6: Pagination
// ============================================================================

export function example6_pagination(
  deals: DealWithStats[],
  page: number,
  pageSize: number
) {
  return pipe(
    deals,
    filterByStatus('active'),
    sortBy('created_at', 'desc'),
    paginate({ page, pageSize })
  );
}

// ============================================================================
// Example 7: Complex Business Logic
// ============================================================================

// Deals requiring immediate attention
export const dealsRequiringAttention = createNamedPipeline<DealWithStats>([
  {
    name: 'Exclude completed',
    fn: excludeStatuses(['closed', 'terminated', 'agreed']),
  },
  {
    name: 'Overdue or high proposals',
    fn: filterBy(deal => {
      const isOverdue = deal.target_close_date
        ? new Date(deal.target_close_date) < new Date()
        : false;
      const hasHighProposals = (deal.stats?.pending_proposals || 0) >= 5;
      return isOverdue || hasHighProposals;
    }),
  },
  {
    name: 'Sort by urgency',
    fn: sortBy('target_close_date', 'asc'),
  },
]);

// ============================================================================
// Example 8: A/B Testing Different Algorithms
// ============================================================================

// Algorithm A: Sort by deadline
const sortAlgorithmA = createPipeline([
  filterByStatus('active'),
  sortBy('target_close_date', 'asc'),
]);

// Algorithm B: Sort by progress
const sortAlgorithmB = createPipeline([
  filterByStatus('active'),
  sortBy('progress', 'asc'),
]);

// Algorithm C: Weighted score (custom)
const sortAlgorithmC = createPipeline([
  filterByStatus('active'),
  filterBy((deal) => {
    // Custom scoring logic
    const score =
      (deal.stats?.pending_proposals || 0) * 10 +
      (100 - ((deal.stats?.agreed_terms || 0) / (deal.stats?.total_terms || 1)) * 100);
    return score > 0;
  }),
  sortBy('created_at', 'desc'), // Fallback sort
]);

export function example8_abTesting(
  deals: DealWithStats[],
  algorithm: 'A' | 'B' | 'C'
) {
  switch (algorithm) {
    case 'A':
      return sortAlgorithmA(deals);
    case 'B':
      return sortAlgorithmB(deals);
    case 'C':
      return sortAlgorithmC(deals);
  }
}

// ============================================================================
// Example 9: Filter State History (Undo/Redo)
// ============================================================================

export class FilterHistory<T> {
  private history: FilterFn<T>[][] = [];
  private currentIndex = -1;

  apply(input: T[], filters: FilterFn<T>[]): T[] {
    // Add to history
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(filters);
    this.currentIndex++;

    return pipe(input, ...filters);
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  undo(input: T[]): T[] | null {
    if (!this.canUndo()) return null;
    this.currentIndex--;
    return pipe(input, ...this.history[this.currentIndex]);
  }

  redo(input: T[]): T[] | null {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return pipe(input, ...this.history[this.currentIndex]);
  }
}

export function example9_undoRedo() {
  const history = new FilterHistory<DealWithStats>();

  // Usage:
  // const result1 = history.apply(deals, [filterByStatus('active')]);
  // const result2 = history.apply(deals, [filterByStatus('active'), filterByType('amendment')]);
  // const previous = history.undo(deals); // Back to result1
  // const next = history.redo(deals);      // Forward to result2

  return history;
}

// ============================================================================
// Example 10: Cross-Module Reusability
// ============================================================================

// These filters can work with ANY type that has the required fields
// Just create type-specific wrappers:

export interface Document {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
}

// Reuse the same pattern for documents
export const filterDocumentsByStatus = (status: Document['status']) =>
  filterBy<Document>(doc => doc.status === status);

export const searchDocuments = (query: string) =>
  filterBy<Document>(doc => doc.name.toLowerCase().includes(query.toLowerCase()));

// Compose document filters just like deal filters
export function example10_crossModuleReuse(documents: Document[], query: string) {
  return pipe(documents, searchDocuments(query), filterDocumentsByStatus('active'));
}

// ============================================================================
// Example 11: Pre-configured Filters
// ============================================================================

// Use the pre-configured filters from the main module
export function example11_preConfigured(deals: DealWithStats[]) {
  const urgent = urgentDealsFilter(deals);
  const stalled = stalledDealsFilter(deals);
  const completed = completedDealsFilter(deals);

  return { urgent, stalled, completed };
}

// ============================================================================
// Example 12: Combining Multiple Pipelines
// ============================================================================

export function example12_combiningPipelines(deals: DealWithStats[]) {
  // Get urgent deals and limit to top 5
  const topUrgent = pipe(deals, urgentDealsFilter, limit(5));

  // Get stalled deals with low progress
  const stalledLowProgress = pipe(
    deals,
    stalledDealsFilter,
    filterByProgress({ max: 25 })
  );

  return { topUrgent, stalledLowProgress };
}

// ============================================================================
// Example 13: Custom Filter Factory
// ============================================================================

// Create a factory for custom date range filters
export function createDateRangeFilter(
  field: 'created_at' | 'updated_at',
  start: Date,
  end: Date
): FilterFn<DealWithStats> {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return filterBy(deal => {
    const date = new Date(deal[field]).getTime();
    return date >= startTime && date <= endTime;
  });
}

export function example13_customFactory(deals: DealWithStats[]) {
  const thisMonth = createDateRangeFilter(
    'created_at',
    new Date(2024, 0, 1),
    new Date(2024, 0, 31)
  );

  return thisMonth(deals);
}
