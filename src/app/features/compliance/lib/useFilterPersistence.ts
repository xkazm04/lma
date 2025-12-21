'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * Filter state interface for compliance filters
 */
export interface ComplianceFilters {
  search: string;
  status: string;
  type: string;
  facility: string;
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: ComplianceFilters = {
  search: '',
  status: 'all',
  type: 'all',
  facility: 'all',
};

/**
 * Preset filter definitions
 */
export interface FilterPreset {
  id: string;
  label: string;
  description: string;
  filters: Partial<ComplianceFilters>;
  icon?: string;
}

/**
 * Predefined filter presets for common workflows
 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'needs_attention',
    label: 'Needs Attention',
    description: 'At risk, failing, or overdue items',
    filters: { status: 'needs_attention' },
    icon: 'alert-triangle',
  },
  {
    id: 'due_this_week',
    label: 'Due This Week',
    description: 'Items due within 7 days',
    filters: { status: 'due_this_week' },
    icon: 'calendar',
  },
  {
    id: 'my_facilities',
    label: 'My Facilities',
    description: 'Facilities assigned to you',
    filters: { facility: 'my_facilities' },
    icon: 'building',
  },
];

const STORAGE_KEY_PREFIX = 'lma_compliance_filters_';

/**
 * Get localStorage key based on the current page path
 */
function getStorageKey(pathname: string): string {
  const pageName = pathname.split('/').pop() || 'default';
  return `${STORAGE_KEY_PREFIX}${pageName}`;
}

/**
 * Safely read from localStorage
 */
function getStoredFilters(key: string): Partial<ComplianceFilters> | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to read filters from localStorage:', e);
  }
  return null;
}

/**
 * Safely write to localStorage
 */
function setStoredFilters(key: string, filters: ComplianceFilters): void {
  if (typeof window === 'undefined') return;

  try {
    // Only store non-default values
    const toStore: Partial<ComplianceFilters> = {};
    Object.keys(filters).forEach((k) => {
      const filterKey = k as keyof ComplianceFilters;
      if (filters[filterKey] !== DEFAULT_FILTERS[filterKey]) {
        toStore[filterKey] = filters[filterKey];
      }
    });

    if (Object.keys(toStore).length > 0) {
      localStorage.setItem(key, JSON.stringify(toStore));
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('Failed to write filters to localStorage:', e);
  }
}

/**
 * Parse filters from URL search params
 */
function parseUrlFilters(searchParams: URLSearchParams | null): Partial<ComplianceFilters> {
  if (!searchParams) return {};

  const filters: Partial<ComplianceFilters> = {};

  const search = searchParams.get('search');
  if (search) filters.search = search;

  const status = searchParams.get('status');
  if (status) filters.status = status;

  const type = searchParams.get('type');
  if (type) filters.type = type;

  const facility = searchParams.get('facility');
  if (facility) filters.facility = facility;

  return filters;
}

/**
 * Build URL search params from filters
 */
function buildUrlParams(filters: ComplianceFilters): URLSearchParams {
  const params = new URLSearchParams();

  Object.keys(filters).forEach((k) => {
    const filterKey = k as keyof ComplianceFilters;
    if (filters[filterKey] !== DEFAULT_FILTERS[filterKey]) {
      params.set(filterKey, filters[filterKey]);
    }
  });

  return params;
}

/**
 * Custom hook for persisting compliance filters
 *
 * This hook:
 * 1. Syncs filter state with URL query params (for shareable links)
 * 2. Persists filters to localStorage (for page refresh)
 * 3. Provides preset filter functions for common workflows
 *
 * NOTE: This hook uses useSearchParams which requires a Suspense boundary
 */
export function useFilterPersistence() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storageKey = useMemo(() => getStorageKey(pathname), [pathname]);

  // Initialize filters from defaults first
  const [filters, setFiltersState] = useState<ComplianceFilters>(DEFAULT_FILTERS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from URL/localStorage on mount (client-side only)
  useEffect(() => {
    if (isInitialized) return;

    const urlFilters = parseUrlFilters(searchParams);

    // URL params take precedence
    if (Object.keys(urlFilters).length > 0) {
      setFiltersState({ ...DEFAULT_FILTERS, ...urlFilters });
    } else {
      // Fall back to localStorage
      const storedFilters = getStoredFilters(storageKey);
      if (storedFilters) {
        setFiltersState({ ...DEFAULT_FILTERS, ...storedFilters });
      }
    }

    setIsInitialized(true);
  }, [searchParams, storageKey, isInitialized]);

  // Sync URL when filters change (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    if (typeof window === 'undefined') return;

    const params = buildUrlParams(filters);
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Only update if different to avoid unnecessary navigation
    const currentUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, pathname, router, isInitialized]);

  // Persist to localStorage when filters change
  useEffect(() => {
    if (!isInitialized) return;
    setStoredFilters(storageKey, filters);
  }, [filters, storageKey, isInitialized]);

  // Update individual filter
  const setFilter = useCallback(<K extends keyof ComplianceFilters>(
    key: K,
    value: ComplianceFilters[K]
  ) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Set multiple filters at once
  const setFilters = useCallback((newFilters: Partial<ComplianceFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear a single filter
  const clearFilter = useCallback((key: keyof ComplianceFilters) => {
    setFiltersState((prev) => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // Apply a preset filter
  const applyPreset = useCallback((presetId: string) => {
    const preset = FILTER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setFiltersState({ ...DEFAULT_FILTERS, ...preset.filters });
    }
  }, []);

  // Check if a preset is currently active
  const isPresetActive = useCallback((presetId: string): boolean => {
    const preset = FILTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return false;

    return Object.keys(preset.filters).every((k) => {
      const filterKey = k as keyof ComplianceFilters;
      return filters[filterKey] === preset.filters[filterKey];
    });
  }, [filters]);

  // Get active filters (non-default values)
  const activeFilters = useMemo(() => {
    const active: Array<{ key: keyof ComplianceFilters; value: string; label: string }> = [];

    if (filters.search !== DEFAULT_FILTERS.search) {
      active.push({ key: 'search', value: filters.search, label: `Search: "${filters.search}"` });
    }
    if (filters.status !== DEFAULT_FILTERS.status) {
      active.push({ key: 'status', value: filters.status, label: getStatusLabel(filters.status) });
    }
    if (filters.type !== DEFAULT_FILTERS.type) {
      active.push({ key: 'type', value: filters.type, label: getTypeLabel(filters.type) });
    }
    if (filters.facility !== DEFAULT_FILTERS.facility) {
      active.push({ key: 'facility', value: filters.facility, label: getFacilityLabel(filters.facility) });
    }

    return active;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = activeFilters.length > 0;

  return {
    filters,
    setFilter,
    setFilters,
    clearFilter,
    clearAllFilters,
    applyPreset,
    isPresetActive,
    activeFilters,
    hasActiveFilters,
    presets: FILTER_PRESETS,
  };
}

/**
 * Get human-readable label for status filter
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    all: 'All Status',
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed',
    overdue: 'Overdue',
    passing: 'Passing',
    failing: 'Failing',
    at_risk: 'At Risk',
    waived: 'Waived',
    needs_attention: 'Needs Attention',
    due_this_week: 'Due This Week',
  };
  return labels[status] || status;
}

/**
 * Get human-readable label for type filter
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    all: 'All Types',
    compliance_event: 'Compliance Events',
    covenant_test: 'Covenant Tests',
    notification_due: 'Notifications',
    waiver_expiration: 'Waiver Expirations',
    leverage_ratio: 'Leverage Ratio',
    interest_coverage: 'Interest Coverage',
    fixed_charge_coverage: 'Fixed Charge Coverage',
    debt_service_coverage: 'Debt Service Coverage',
    minimum_liquidity: 'Minimum Liquidity',
    capex: 'CapEx',
  };
  return labels[type] || type;
}

/**
 * Get human-readable label for facility filter
 */
function getFacilityLabel(facility: string): string {
  if (facility === 'all') return 'All Facilities';
  if (facility === 'my_facilities') return 'My Facilities';
  return facility;
}
