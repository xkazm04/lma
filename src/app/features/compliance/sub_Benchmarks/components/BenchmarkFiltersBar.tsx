'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IndustrySector, CompanySize, BenchmarkCovenantType } from '../../lib';
import { getIndustrySectorLabel, getCompanySizeLabel } from '../../lib';

interface BenchmarkFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  industryFilter: IndustrySector | 'all';
  onIndustryChange: (value: IndustrySector | 'all') => void;
  companySizeFilter: CompanySize | 'all';
  onCompanySizeChange: (value: CompanySize | 'all') => void;
  covenantTypeFilter: BenchmarkCovenantType | 'all';
  onCovenantTypeChange: (value: BenchmarkCovenantType | 'all') => void;
  timeRangeFilter: '3m' | '6m' | '1y' | '2y' | 'all';
  onTimeRangeChange: (value: '3m' | '6m' | '1y' | '2y' | 'all') => void;
}

const industries: { value: IndustrySector | 'all'; label: string }[] = [
  { value: 'all', label: 'All Industries' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'energy', label: 'Energy' },
  { value: 'consumer_goods', label: 'Consumer Goods' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'utilities', label: 'Utilities' },
];

const companySizes: { value: CompanySize | 'all'; label: string }[] = [
  { value: 'all', label: 'All Sizes' },
  { value: 'small', label: 'Small ($0-50M)' },
  { value: 'mid_market', label: 'Mid-Market ($50-500M)' },
  { value: 'large', label: 'Large ($500M-2B)' },
  { value: 'enterprise', label: 'Enterprise ($2B+)' },
];

const covenantTypes: { value: BenchmarkCovenantType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Covenant Types' },
  { value: 'leverage_ratio', label: 'Leverage Ratio' },
  { value: 'interest_coverage', label: 'Interest Coverage' },
  { value: 'fixed_charge_coverage', label: 'FCCR' },
  { value: 'debt_service_coverage', label: 'DSCR' },
  { value: 'minimum_liquidity', label: 'Min. Liquidity' },
  { value: 'capex', label: 'CapEx' },
  { value: 'net_worth', label: 'Net Worth' },
];

const timeRanges: { value: '3m' | '6m' | '1y' | '2y' | 'all'; label: string }[] = [
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
  { value: 'all', label: 'All Time' },
];

export const BenchmarkFiltersBar = memo(function BenchmarkFiltersBar({
  searchQuery,
  onSearchChange,
  industryFilter,
  onIndustryChange,
  companySizeFilter,
  onCompanySizeChange,
  covenantTypeFilter,
  onCovenantTypeChange,
  timeRangeFilter,
  onTimeRangeChange,
}: BenchmarkFiltersBarProps) {
  const hasActiveFilters =
    industryFilter !== 'all' ||
    companySizeFilter !== 'all' ||
    covenantTypeFilter !== 'all' ||
    timeRangeFilter !== '1y' ||
    searchQuery.length > 0;

  const clearFilters = () => {
    onSearchChange('');
    onIndustryChange('all');
    onCompanySizeChange('all');
    onCovenantTypeChange('all');
    onTimeRangeChange('1y');
  };

  return (
    <Card className="animate-in fade-in" data-testid="benchmark-filters-bar">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search benchmarks, facilities, borrowers..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="benchmark-search-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-500">Filters:</span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-zinc-500 hover:text-zinc-700"
                data-testid="clear-filters-btn"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={industryFilter}
              onChange={(e) => onIndustryChange(e.target.value as IndustrySector | 'all')}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="industry-filter-select"
            >
              {industries.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={companySizeFilter}
              onChange={(e) => onCompanySizeChange(e.target.value as CompanySize | 'all')}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="company-size-filter-select"
            >
              {companySizes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={covenantTypeFilter}
              onChange={(e) => onCovenantTypeChange(e.target.value as BenchmarkCovenantType | 'all')}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="covenant-type-filter-select"
            >
              {covenantTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 ml-auto">
              <span className="text-sm text-zinc-500 mr-2">Time Range:</span>
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={timeRangeFilter === range.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTimeRangeChange(range.value)}
                  className={cn(
                    'min-w-[60px]',
                    timeRangeFilter === range.value && 'bg-blue-600 hover:bg-blue-700'
                  )}
                  data-testid={`time-range-${range.value}-btn`}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
