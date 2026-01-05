'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { ComparisonCategory, ComparisonChange } from '../../lib/types';
import type {
  LensFiltersState,
  LensDataProviders,
  RiskFilterOption,
  MarketFilterOption,
  PartyFilterOption,
  ImpactFilterOption,
} from '../lib/lens-types';
import {
  DEFAULT_LENS_FILTERS,
  isValidRiskLevel,
  isValidMarketPosition,
  isValidPartyOption,
  isValidImpactLevel,
} from '../lib/lens-types';
import {
  createCombinedPredicate,
  hasActiveLensFilters,
  enrichChangeWithLensData,
} from '../lib/lenses';
import { createChangeId } from '../lib/mock-data';

// ============================================
// Change Type Filter Types
// ============================================

export type ChangeTypeFilter = 'added' | 'removed' | 'modified';

const validChangeTypes: ChangeTypeFilter[] = ['added', 'removed', 'modified'];

// ============================================
// Unified Filter State
// ============================================

/**
 * Unified filter state that combines change type filters and lens filters
 */
export interface UnifiedFiltersState {
  /** Change type filters (added, removed, modified) */
  changeTypes: ChangeTypeFilter[];
  /** Search query string */
  searchQuery: string;
  /** Risk severity filters */
  riskLevels: RiskFilterOption[];
  /** Market position filters */
  marketPositions: MarketFilterOption[];
  /** Favored party filters */
  favoredParties: PartyFilterOption[];
  /** Impact level filters */
  impactLevels: ImpactFilterOption[];
  /** Require market deviation flag */
  requiresMarketDeviation: boolean;
}

/**
 * Default unified filter state
 */
export const DEFAULT_UNIFIED_FILTERS: UnifiedFiltersState = {
  changeTypes: [],
  searchQuery: '',
  riskLevels: [],
  marketPositions: [],
  favoredParties: [],
  impactLevels: [],
  requiresMarketDeviation: false,
};

// ============================================
// URL Parameter Names
// ============================================

const CHANGE_TYPES_PARAM = 'types';
const SEARCH_PARAM = 'q';
const RISK_PARAM = 'risk';
const MARKET_PARAM = 'market';
const PARTY_PARAM = 'party';
const IMPACT_PARAM = 'impact';
const DEVIATION_PARAM = 'deviation';

// ============================================
// URL Parsing Utilities
// ============================================

function parseChangeTypes(param: string | null): ChangeTypeFilter[] {
  if (!param) return [];
  return param
    .split(',')
    .filter((t): t is ChangeTypeFilter => validChangeTypes.includes(t as ChangeTypeFilter));
}

function parseRiskLevels(param: string | null): RiskFilterOption[] {
  if (!param) return [];
  return param
    .split(',')
    .filter(isValidRiskLevel)
    .filter((v) => v !== 'all');
}

function parseMarketPositions(param: string | null): MarketFilterOption[] {
  if (!param) return [];
  return param
    .split(',')
    .filter(isValidMarketPosition)
    .filter((v) => v !== 'all');
}

function parsePartyOptions(param: string | null): PartyFilterOption[] {
  if (!param) return [];
  return param
    .split(',')
    .filter(isValidPartyOption)
    .filter((v) => v !== 'all');
}

function parseImpactLevels(param: string | null): ImpactFilterOption[] {
  if (!param) return [];
  return param
    .split(',')
    .filter(isValidImpactLevel)
    .filter((v) => v !== 'all');
}

function serializeArray(values: string[]): string | null {
  if (values.length === 0) return null;
  return values.join(',');
}

// ============================================
// Filter Result Types
// ============================================

export interface FilteredResult {
  filteredCategories: ComparisonCategory[];
  totalChangesCount: number;
  filteredChangesCount: number;
  enrichedChanges: Map<string, ReturnType<typeof enrichChangeWithLensData>>;
}

// ============================================
// Hook Options
// ============================================

export interface UseComparisonFiltersOptions {
  /** Data providers for lens filtering (risk scores, market benchmarks) */
  providers?: LensDataProviders;
}

// ============================================
// Main Hook
// ============================================

export function useComparisonFilters(options: UseComparisonFiltersOptions = {}) {
  const { providers = {} } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse all filters from URL
  const filters: UnifiedFiltersState = useMemo(
    () => ({
      changeTypes: parseChangeTypes(searchParams.get(CHANGE_TYPES_PARAM)),
      searchQuery: searchParams.get(SEARCH_PARAM) || '',
      riskLevels: parseRiskLevels(searchParams.get(RISK_PARAM)),
      marketPositions: parseMarketPositions(searchParams.get(MARKET_PARAM)),
      favoredParties: parsePartyOptions(searchParams.get(PARTY_PARAM)),
      impactLevels: parseImpactLevels(searchParams.get(IMPACT_PARAM)),
      requiresMarketDeviation: searchParams.get(DEVIATION_PARAM) === 'true',
    }),
    [searchParams]
  );

  // Update URL with new filters
  const setFilters = useCallback(
    (newFilters: UnifiedFiltersState) => {
      const params = new URLSearchParams(searchParams.toString());

      // Change types
      const typesParam = serializeArray(newFilters.changeTypes);
      if (typesParam) {
        params.set(CHANGE_TYPES_PARAM, typesParam);
      } else {
        params.delete(CHANGE_TYPES_PARAM);
      }

      // Search query
      if (newFilters.searchQuery) {
        params.set(SEARCH_PARAM, newFilters.searchQuery);
      } else {
        params.delete(SEARCH_PARAM);
      }

      // Risk levels
      const riskParam = serializeArray(newFilters.riskLevels);
      if (riskParam) {
        params.set(RISK_PARAM, riskParam);
      } else {
        params.delete(RISK_PARAM);
      }

      // Market positions
      const marketParam = serializeArray(newFilters.marketPositions);
      if (marketParam) {
        params.set(MARKET_PARAM, marketParam);
      } else {
        params.delete(MARKET_PARAM);
      }

      // Party options
      const partyParam = serializeArray(newFilters.favoredParties);
      if (partyParam) {
        params.set(PARTY_PARAM, partyParam);
      } else {
        params.delete(PARTY_PARAM);
      }

      // Impact levels
      const impactParam = serializeArray(newFilters.impactLevels);
      if (impactParam) {
        params.set(IMPACT_PARAM, impactParam);
      } else {
        params.delete(IMPACT_PARAM);
      }

      // Market deviation flag
      if (newFilters.requiresMarketDeviation) {
        params.set(DEVIATION_PARAM, 'true');
      } else {
        params.delete(DEVIATION_PARAM);
      }

      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_UNIFIED_FILTERS);
  }, [setFilters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    const hasChangeTypeFilters = filters.changeTypes.length > 0;
    const hasSearchQuery = filters.searchQuery.length > 0;
    const hasLensFilters = hasActiveLensFilters({
      riskLevels: filters.riskLevels,
      marketPositions: filters.marketPositions,
      favoredParties: filters.favoredParties,
      impactLevels: filters.impactLevels,
      requiresMarketDeviation: filters.requiresMarketDeviation,
    });

    return hasChangeTypeFilters || hasSearchQuery || hasLensFilters;
  }, [filters]);

  // Check if only change type/search filters are active (no lens filters)
  const hasActiveChangeTypeFilters = useMemo(() => {
    return filters.changeTypes.length > 0 || filters.searchQuery.length > 0;
  }, [filters]);

  // Check if lens filters are active
  const hasActiveLensFiltersValue = useMemo(() => {
    return hasActiveLensFilters({
      riskLevels: filters.riskLevels,
      marketPositions: filters.marketPositions,
      favoredParties: filters.favoredParties,
      impactLevels: filters.impactLevels,
      requiresMarketDeviation: filters.requiresMarketDeviation,
    });
  }, [filters]);

  // Extract lens filters subset for compatibility
  const lensFilters: LensFiltersState = useMemo(
    () => ({
      riskLevels: filters.riskLevels,
      marketPositions: filters.marketPositions,
      favoredParties: filters.favoredParties,
      impactLevels: filters.impactLevels,
      requiresMarketDeviation: filters.requiresMarketDeviation,
    }),
    [filters]
  );

  // Unified filtering function - applies all filters in a single pass
  const filterCategories = useCallback(
    (categories: ComparisonCategory[]): FilteredResult => {
      let totalChangesCount = 0;
      let filteredChangesCount = 0;
      const enrichedChanges = new Map<
        string,
        ReturnType<typeof enrichChangeWithLensData>
      >();

      // Count total changes and enrich all changes
      categories.forEach((category) => {
        (category.changes ?? []).forEach((change) => {
          totalChangesCount++;
          const changeId = createChangeId(category.category, change.field);
          const enriched = enrichChangeWithLensData(change, changeId, providers);
          enrichedChanges.set(changeId, enriched);
        });
      });

      // If no filters are active, return original categories
      if (!hasActiveFilters) {
        return {
          filteredCategories: categories,
          totalChangesCount,
          filteredChangesCount: totalChangesCount,
          enrichedChanges,
        };
      }

      // Create lens predicate if lens filters are active
      const lensPredicate = hasActiveLensFiltersValue
        ? createCombinedPredicate(lensFilters, providers)
        : null;

      const searchLower = filters.searchQuery.toLowerCase().trim();

      // Helper functions for filtering
      const matchesSearch = (change: ComparisonChange): boolean => {
        if (!searchLower) return true;

        // Match field name
        if (change.field.toLowerCase().includes(searchLower)) return true;

        // Match doc1 value
        if (change.doc1Value?.toLowerCase().includes(searchLower)) return true;

        // Match doc2 value
        if (change.doc2Value?.toLowerCase().includes(searchLower)) return true;

        // Match impact text
        if (change.impact.toLowerCase().includes(searchLower)) return true;

        return false;
      };

      const matchesChangeType = (change: ComparisonChange): boolean => {
        if (filters.changeTypes.length === 0) return true;
        return filters.changeTypes.includes(change.changeType);
      };

      // Filter categories and changes in a single pass
      const filteredCategories = categories
        .map((category) => {
          const filteredChanges = (category.changes ?? []).filter((change) => {
            const changeId = createChangeId(category.category, change.field);

            // Apply change type filter
            if (!matchesChangeType(change)) return false;

            // Apply search filter
            if (!matchesSearch(change)) return false;

            // Apply lens filters if active
            if (lensPredicate && !lensPredicate(change, changeId)) {
              return false;
            }

            filteredChangesCount++;
            return true;
          });

          return {
            ...category,
            changes: filteredChanges,
          };
        })
        .filter((category) => category.changes.length > 0);

      return {
        filteredCategories,
        totalChangesCount,
        filteredChangesCount,
        enrichedChanges,
      };
    },
    [filters, hasActiveFilters, hasActiveLensFiltersValue, lensFilters, providers]
  );

  // Get enriched change data by ID
  const getEnrichedChange = useCallback(
    (
      change: ComparisonChange,
      categoryName: string
    ): ReturnType<typeof enrichChangeWithLensData> => {
      const changeId = createChangeId(categoryName, change.field);
      return enrichChangeWithLensData(change, changeId, providers);
    },
    [providers]
  );

  return {
    filters,
    setFilters,
    clearFilters,
    filterCategories,
    hasActiveFilters,
    hasActiveChangeTypeFilters,
    hasActiveLensFilters: hasActiveLensFiltersValue,
    lensFilters,
    getEnrichedChange,
  };
}

/**
 * Creates a standalone filter function without URL persistence
 * Useful for embedded/controlled filtering
 */
export function createComparisonFilter(
  filters: UnifiedFiltersState,
  providers: LensDataProviders
) {
  const hasLensFilters = hasActiveLensFilters({
    riskLevels: filters.riskLevels,
    marketPositions: filters.marketPositions,
    favoredParties: filters.favoredParties,
    impactLevels: filters.impactLevels,
    requiresMarketDeviation: filters.requiresMarketDeviation,
  });

  const lensPredicate = hasLensFilters
    ? createCombinedPredicate(
        {
          riskLevels: filters.riskLevels,
          marketPositions: filters.marketPositions,
          favoredParties: filters.favoredParties,
          impactLevels: filters.impactLevels,
          requiresMarketDeviation: filters.requiresMarketDeviation,
        },
        providers
      )
    : null;

  const searchLower = filters.searchQuery.toLowerCase().trim();

  const matchesSearch = (change: ComparisonChange): boolean => {
    if (!searchLower) return true;
    if (change.field.toLowerCase().includes(searchLower)) return true;
    if (change.doc1Value?.toLowerCase().includes(searchLower)) return true;
    if (change.doc2Value?.toLowerCase().includes(searchLower)) return true;
    if (change.impact.toLowerCase().includes(searchLower)) return true;
    return false;
  };

  const matchesChangeType = (change: ComparisonChange): boolean => {
    if (filters.changeTypes.length === 0) return true;
    return filters.changeTypes.includes(change.changeType);
  };

  return (
    categories: ComparisonCategory[]
  ): Omit<FilteredResult, 'enrichedChanges'> => {
    let totalChangesCount = 0;
    let filteredChangesCount = 0;

    // Count total
    categories.forEach((category) => {
      totalChangesCount += (category.changes ?? []).length;
    });

    // If no filters active, return all
    const hasActiveFilters =
      filters.changeTypes.length > 0 ||
      filters.searchQuery.length > 0 ||
      hasLensFilters;

    if (!hasActiveFilters) {
      return {
        filteredCategories: categories,
        totalChangesCount,
        filteredChangesCount: totalChangesCount,
      };
    }

    // Filter
    const filteredCategories = categories
      .map((category) => {
        const filteredChanges = (category.changes ?? []).filter((change) => {
          const changeId = createChangeId(category.category, change.field);

          if (!matchesChangeType(change)) return false;
          if (!matchesSearch(change)) return false;
          if (lensPredicate && !lensPredicate(change, changeId)) return false;

          filteredChangesCount++;
          return true;
        });

        return {
          ...category,
          changes: filteredChanges,
        };
      })
      .filter((category) => category.changes.length > 0);

    return {
      filteredCategories,
      totalChangesCount,
      filteredChangesCount,
    };
  };
}
