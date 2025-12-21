'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  PortfolioComparisonFilters,
  TermCategory,
  AnomalySeverity,
} from '../lib/types';
import {
  TERM_CATEGORY_CONFIG,
  ANOMALY_SEVERITY_CONFIG,
  DEFAULT_PORTFOLIO_FILTERS,
} from '../lib/types';

interface PortfolioFiltersProps {
  filters: PortfolioComparisonFilters;
  onFiltersChange: (filters: PortfolioComparisonFilters) => void;
  totalTerms: number;
  filteredTerms: number;
  totalAnomalies: number;
  filteredAnomalies: number;
}

export const PortfolioFilters = memo(function PortfolioFilters({
  filters,
  onFiltersChange,
  totalTerms,
  filteredTerms,
  totalAnomalies,
  filteredAnomalies,
}: PortfolioFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery.length > 0 ||
    filters.showOnlyAnomalies ||
    filters.termCategories.length < 6 ||
    filters.anomalySeverity.length < 3;

  const toggleCategory = (category: TermCategory) => {
    const newCategories = filters.termCategories.includes(category)
      ? filters.termCategories.filter((c) => c !== category)
      : [...filters.termCategories, category];
    onFiltersChange({ ...filters, termCategories: newCategories });
  };

  const toggleSeverity = (severity: AnomalySeverity) => {
    const newSeverities = filters.anomalySeverity.includes(severity)
      ? filters.anomalySeverity.filter((s) => s !== severity)
      : [...filters.anomalySeverity, severity];
    onFiltersChange({ ...filters, anomalySeverity: newSeverities });
  };

  const resetFilters = () => {
    onFiltersChange(DEFAULT_PORTFOLIO_FILTERS);
  };

  const getSeverityIcon = (severity: AnomalySeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-3 h-3" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3" />;
      case 'info':
        return <Info className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200" data-testid="portfolio-filters">
      {/* Search and Toggle Row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search terms..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="pl-9"
            data-testid="portfolio-search-input"
          />
        </div>

        <Button
          variant={filters.showOnlyAnomalies ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, showOnlyAnomalies: !filters.showOnlyAnomalies })}
          className={cn(
            filters.showOnlyAnomalies && 'bg-amber-600 hover:bg-amber-700'
          )}
          data-testid="show-anomalies-only-btn"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Anomalies Only
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-zinc-500"
            data-testid="reset-filters-btn"
          >
            <X className="w-4 h-4 mr-1" />
            Reset
          </Button>
        )}

        <div className="ml-auto text-sm text-zinc-500">
          Showing {filteredTerms} of {totalTerms} terms
          {filteredAnomalies !== totalAnomalies && (
            <span className="ml-2">
              ({filteredAnomalies} of {totalAnomalies} anomalies)
            </span>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-zinc-500 mr-2">Categories:</span>
        {(Object.keys(TERM_CATEGORY_CONFIG) as TermCategory[]).map((category) => {
          const config = TERM_CATEGORY_CONFIG[category];
          const isActive = filters.termCategories.includes(category);
          return (
            <Badge
              key={category}
              variant={isActive ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                isActive ? cn(config.bgColor, config.color) : 'hover:bg-zinc-100'
              )}
              onClick={() => toggleCategory(category)}
              data-testid={`category-filter-${category}`}
            >
              {config.label}
            </Badge>
          );
        })}
      </div>

      {/* Severity Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500 mr-2">Severity:</span>
        {(Object.keys(ANOMALY_SEVERITY_CONFIG) as AnomalySeverity[]).map((severity) => {
          const config = ANOMALY_SEVERITY_CONFIG[severity];
          const isActive = filters.anomalySeverity.includes(severity);
          return (
            <Badge
              key={severity}
              variant={isActive ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                isActive ? cn(config.bgColor, config.color, config.borderColor) : 'hover:bg-zinc-100'
              )}
              onClick={() => toggleSeverity(severity)}
              data-testid={`severity-filter-${severity}`}
            >
              {getSeverityIcon(severity)}
              <span className="ml-1">{config.label}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
});
