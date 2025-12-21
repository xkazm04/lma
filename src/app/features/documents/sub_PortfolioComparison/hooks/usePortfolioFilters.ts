'use client';

import { useState, useMemo } from 'react';
import type {
  PortfolioComparisonFilters,
  AggregatedTerm,
  PortfolioAnomaly,
} from '../lib/types';
import { DEFAULT_PORTFOLIO_FILTERS } from '../lib/types';

interface UsePortfolioFiltersResult {
  filters: PortfolioComparisonFilters;
  setFilters: (filters: PortfolioComparisonFilters) => void;
  filteredTerms: AggregatedTerm[];
  filteredAnomalies: PortfolioAnomaly[];
  totalTerms: number;
  totalAnomalies: number;
}

export function usePortfolioFilters(
  terms: AggregatedTerm[],
  anomalies: PortfolioAnomaly[]
): UsePortfolioFiltersResult {
  const [filters, setFilters] = useState<PortfolioComparisonFilters>(DEFAULT_PORTFOLIO_FILTERS);

  const { filteredTerms, filteredAnomalies } = useMemo(() => {
    let resultTerms = [...terms];
    let resultAnomalies = [...anomalies];

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      resultTerms = resultTerms.filter(
        (term) =>
          term.termName.toLowerCase().includes(query) ||
          term.values.some(
            (v) =>
              v.documentName.toLowerCase().includes(query) ||
              (typeof v.value === 'string' && v.value.toLowerCase().includes(query))
          )
      );
      resultAnomalies = resultAnomalies.filter(
        (anomaly) =>
          anomaly.termName.toLowerCase().includes(query) ||
          anomaly.documentName.toLowerCase().includes(query) ||
          anomaly.description.toLowerCase().includes(query)
      );
    }

    // Filter by term categories
    if (filters.termCategories.length > 0 && filters.termCategories.length < 6) {
      resultTerms = resultTerms.filter((term) =>
        filters.termCategories.includes(term.termCategory)
      );
      resultAnomalies = resultAnomalies.filter((anomaly) =>
        filters.termCategories.includes(anomaly.termCategory as PortfolioComparisonFilters['termCategories'][number])
      );
    }

    // Filter by anomaly severity
    if (filters.anomalySeverity.length > 0 && filters.anomalySeverity.length < 3) {
      resultAnomalies = resultAnomalies.filter((anomaly) =>
        filters.anomalySeverity.includes(anomaly.severity)
      );
      // Also filter terms to only show those with matching severity anomalies
      if (filters.showOnlyAnomalies) {
        const termNamesWithMatchingAnomalies = new Set(
          resultAnomalies.map((a) => a.termName)
        );
        resultTerms = resultTerms.filter((term) =>
          termNamesWithMatchingAnomalies.has(term.termName)
        );
      }
    }

    // Show only anomalies
    if (filters.showOnlyAnomalies) {
      resultTerms = resultTerms.filter((term) => term.hasOutliers);
    }

    return {
      filteredTerms: resultTerms,
      filteredAnomalies: resultAnomalies,
    };
  }, [terms, anomalies, filters]);

  return {
    filters,
    setFilters,
    filteredTerms,
    filteredAnomalies,
    totalTerms: terms.length,
    totalAnomalies: anomalies.length,
  };
}
