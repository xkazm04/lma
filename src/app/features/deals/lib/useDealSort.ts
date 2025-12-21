'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DealWithStats } from './types';
import type { DealSortState, DealSortField, SortDirection } from './sort-types';
import { DEFAULT_SORT_STATE } from './sort-types';

const STORAGE_KEY = 'deals-sort-preference';

function loadSortState(): DealSortState {
  if (typeof window === 'undefined') {
    return DEFAULT_SORT_STATE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the parsed state
      if (parsed.primary && parsed.primary.field && parsed.primary.direction) {
        return parsed as DealSortState;
      }
    }
  } catch {
    // Invalid stored data, use default
  }

  return DEFAULT_SORT_STATE;
}

function saveSortState(state: DealSortState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage not available
  }
}

function getProgressPercentage(deal: DealWithStats): number {
  if (!deal.stats) return 0;
  const total = deal.stats.total_terms || 0;
  const agreed = deal.stats.agreed_terms || 0;
  return total > 0 ? Math.round((agreed / total) * 100) : 0;
}

const STATUS_ORDER: Record<string, number> = {
  active: 1,
  draft: 2,
  paused: 3,
  agreed: 4,
  closed: 5,
  terminated: 6,
};

function compareDeals(
  a: DealWithStats,
  b: DealWithStats,
  field: DealSortField,
  direction: SortDirection
): number {
  let comparison = 0;

  switch (field) {
    case 'deal_name':
      comparison = a.deal_name.localeCompare(b.deal_name);
      break;

    case 'status':
      comparison = (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
      break;

    case 'progress':
      comparison = getProgressPercentage(a) - getProgressPercentage(b);
      break;

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

export function useDealSort(deals: DealWithStats[]) {
  // Initialize state lazily from localStorage
  const [sortState, setSortState] = useState<DealSortState>(() => loadSortState());

  // Save to localStorage when state changes
  useEffect(() => {
    saveSortState(sortState);
  }, [sortState]);

  const handleSort = useCallback((field: DealSortField, isShiftHeld: boolean) => {
    setSortState((prev) => {
      // If shift is held and we have a primary sort, add/update secondary
      if (isShiftHeld && prev.primary.field !== field) {
        const existingSecondary = prev.secondary;

        // If this field is already the secondary, toggle its direction
        if (existingSecondary?.field === field) {
          return {
            ...prev,
            secondary: {
              field,
              direction: existingSecondary.direction === 'asc' ? 'desc' : 'asc',
            },
          };
        }

        // Add as new secondary sort
        return {
          ...prev,
          secondary: { field, direction: 'asc' },
        };
      }

      // Regular click - update primary sort
      if (prev.primary.field === field) {
        // Same field - toggle direction
        return {
          primary: {
            field,
            direction: prev.primary.direction === 'asc' ? 'desc' : 'asc',
          },
          secondary: null, // Clear secondary when primary changes
        };
      }

      // Different field - set as new primary, clear secondary
      return {
        primary: { field, direction: 'asc' },
        secondary: null,
      };
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortState(DEFAULT_SORT_STATE);
  }, []);

  const sortedDeals = useMemo(() => {
    return [...deals].sort((a, b) => {
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

      // Secondary sort (if defined and primary values are equal)
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
  }, [deals, sortState]);

  return {
    sortState,
    sortedDeals,
    handleSort,
    clearSort,
  };
}
