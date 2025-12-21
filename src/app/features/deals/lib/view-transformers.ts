/**
 * View Transformers
 *
 * Separates data transformation from presentation by converting base deal arrays
 * into the data structures each view needs. Views become pure presentational
 * components receiving pre-shaped data.
 *
 * ## Pattern: Model-View Separation at the Component Level
 *
 * Traditional approach treats grid/list/kanban/timeline as UI rendering choices.
 * This module recognizes they're actually different data structures:
 * - Grid/List: Array (no transformation)
 * - Kanban: groupBy(status)
 * - Timeline: sortBy(date) + groupBy(hasDate)
 * - Inbox: groupBy(priority.level)
 *
 * ## Benefits
 *
 * 1. **Views Have No Business Logic**: Presentation components only render pre-shaped data
 * 2. **Independently Testable**: Transformations can be unit tested without mounting components
 * 3. **Easy to Add Views**: New view = new transformer function + presentational component
 * 4. **Reusable Across Modules**: Same transformer pattern works for documents, compliance, etc.
 *
 * ## Usage
 *
 * ```typescript
 * // In parent component (e.g., DealsListPage)
 * const viewData = useMemo(() => ({
 *   kanban: transformToKanbanView(deals),
 *   timeline: transformToTimelineView(deals),
 * }), [deals]);
 *
 * // Pass pre-shaped data to view
 * <DealKanbanView data={viewData.kanban} />
 * ```
 *
 * ## Adding a New View
 *
 * 1. Define the view's data structure type (e.g., `CalendarViewData`)
 * 2. Create a transformer function (e.g., `transformToCalendarView()`)
 * 3. Build a pure presentational component that receives the shaped data
 * 4. Add tests for the transformer
 */

import type { DealWithStats } from './types';

/**
 * Kanban View Data Structure
 * Groups deals by status into columns
 */
export interface KanbanViewData {
  draft: DealWithStats[];
  active: DealWithStats[];
  paused: DealWithStats[];
  agreed: DealWithStats[];
  closed: DealWithStats[];
}

/**
 * Timeline View Data Structure
 * Separates deals with target dates from those without, sorted by date
 */
export interface TimelineViewData {
  dealsWithDates: DealWithStats[];
  dealsWithoutDates: DealWithStats[];
}

/**
 * Smart Inbox View Data Structure
 * Groups deals by priority level
 */
export interface InboxViewData {
  critical: DealWithStats[];
  high: DealWithStats[];
  medium: DealWithStats[];
  low: DealWithStats[];
}

// ============================================================================
// Transformer Functions
// ============================================================================

/**
 * Kanban Transformer
 * Groups deals by status into columns
 */
export function transformToKanbanView(deals: DealWithStats[]): KanbanViewData {
  const columns: KanbanViewData = {
    draft: [],
    active: [],
    paused: [],
    agreed: [],
    closed: [],
  };

  deals.forEach((deal) => {
    const status = deal.status;
    if (status in columns) {
      columns[status as keyof KanbanViewData].push(deal);
    }
  });

  return columns;
}

/**
 * Timeline Transformer
 * Sorts by target date and separates deals with/without dates
 */
export function transformToTimelineView(deals: DealWithStats[]): TimelineViewData {
  const withDates = deals
    .filter((d) => d.target_close_date)
    .sort((a, b) => {
      const dateA = new Date(a.target_close_date!).getTime();
      const dateB = new Date(b.target_close_date!).getTime();
      return dateA - dateB;
    });

  const withoutDates = deals.filter((d) => !d.target_close_date);

  return {
    dealsWithDates: withDates,
    dealsWithoutDates: withoutDates,
  };
}

/**
 * Smart Inbox Transformer
 * Groups deals by priority level
 * Note: Expects deals to have a priority property (from prioritizeDeals)
 */
export function transformToInboxView<T extends DealWithStats & { priority: { level: string } }>(
  deals: T[]
): Record<'critical' | 'high' | 'medium' | 'low', T[]> {
  const groups: Record<'critical' | 'high' | 'medium' | 'low', T[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  deals.forEach((deal) => {
    const level = deal.priority.level;
    if (level in groups) {
      groups[level as keyof typeof groups].push(deal);
    }
  });

  return groups;
}

// ============================================================================
// Type Guards & Utilities
// ============================================================================

/**
 * Checks if a deal has a priority property (for inbox view)
 */
export function hasPriority(deal: DealWithStats): deal is DealWithStats & { priority: { level: string } } {
  return 'priority' in deal && typeof (deal as any).priority === 'object' && 'level' in (deal as any).priority;
}

/**
 * Union type for all view data structures
 */
export type ViewData = DealWithStats[] | KanbanViewData | TimelineViewData | InboxViewData;

/**
 * View mode to transformer mapping
 * Note: grid and list views use raw DealWithStats[] arrays directly (no transformation needed)
 */
export const VIEW_TRANSFORMERS = {
  grid: null,
  list: null,
  kanban: transformToKanbanView,
  timeline: transformToTimelineView,
  inbox: transformToInboxView,
} as const;

export type ViewMode = keyof typeof VIEW_TRANSFORMERS;
