'use client';

import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompactDataTable, type ColumnDef } from '@/components/ui/compact-data-table';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpDown,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIndustrySectorLabel } from '../../lib/types';
import type { IndustryHealthMetrics } from '../../lib/types';

// Sort options
type SortField = 'health_score' | 'stress_level' | 'trend';
type SortDirection = 'asc' | 'desc';

// Filter options
type StressFilter = 'all' | 'high' | 'elevated' | 'moderate' | 'low';
type TrendFilter = 'all' | 'improving' | 'stable' | 'declining';

// View mode
type ViewMode = 'cards' | 'table';

interface IndustryHealthGridProps {
  healthMetrics: IndustryHealthMetrics[];
}

// Map stress levels to numeric values for sorting
const stressLevelValue: Record<string, number> = {
  high: 4,
  elevated: 3,
  moderate: 2,
  low: 1,
};

// Map trend to numeric values for sorting
const trendValue: Record<string, number> = {
  declining: 3,
  stable: 2,
  improving: 1,
};

export function IndustryHealthGrid({ healthMetrics }: IndustryHealthGridProps) {
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('stress_level');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // State for filtering
  const [stressFilter, setStressFilter] = useState<StressFilter>('all');
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('all');

  // State for view mode
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Refs for FLIP animation
  const gridRef = useRef<HTMLDivElement>(null);
  const cardPositions = useRef<Map<string, DOMRect>>(new Map());

  // Filter and sort the metrics
  const processedMetrics = useMemo(() => {
    let result = [...healthMetrics];

    // Apply stress filter
    if (stressFilter !== 'all') {
      result = result.filter((m) => m.stress_level === stressFilter);
    }

    // Apply trend filter
    if (trendFilter !== 'all') {
      result = result.filter((m) => m.headroom_trend_3m === trendFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'health_score':
          comparison = a.overall_health_score - b.overall_health_score;
          break;
        case 'stress_level':
          comparison = stressLevelValue[a.stress_level] - stressLevelValue[b.stress_level];
          break;
        case 'trend':
          comparison = trendValue[a.headroom_trend_3m] - trendValue[b.headroom_trend_3m];
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [healthMetrics, sortField, sortDirection, stressFilter, trendFilter]);

  // Capture positions before DOM update for FLIP animation
  useLayoutEffect(() => {
    if (viewMode !== 'cards' || !gridRef.current) return;

    const cards = gridRef.current.querySelectorAll('[data-industry-card]');
    cards.forEach((card) => {
      const industry = card.getAttribute('data-industry-card');
      if (industry) {
        cardPositions.current.set(industry, card.getBoundingClientRect());
      }
    });
  });

  // Apply FLIP animation after DOM update
  useEffect(() => {
    if (viewMode !== 'cards' || !gridRef.current) return;

    const cards = gridRef.current.querySelectorAll('[data-industry-card]');

    cards.forEach((card) => {
      const industry = card.getAttribute('data-industry-card');
      if (!industry) return;

      const oldRect = cardPositions.current.get(industry);
      if (!oldRect) return;

      const newRect = card.getBoundingClientRect();

      const deltaX = oldRect.left - newRect.left;
      const deltaY = oldRect.top - newRect.top;

      if (deltaX === 0 && deltaY === 0) return;

      // Apply transform to start from old position
      (card as HTMLElement).style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      (card as HTMLElement).style.transition = 'none';

      // Force reflow
      void (card as HTMLElement).offsetHeight;

      // Animate to new position
      (card as HTMLElement).style.transform = '';
      (card as HTMLElement).style.transition = 'transform 300ms ease-out';
    });
  }, [processedMetrics, viewMode]);

  // Handle sort change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setStressFilter('all');
    setTrendFilter('all');
  };

  const hasActiveFilters = stressFilter !== 'all' || trendFilter !== 'all';

  // Table columns for compact view
  const tableColumns: ColumnDef<IndustryHealthMetrics>[] = useMemo(
    () => [
      {
        key: 'industry',
        label: 'Industry',
        flex: 2,
        render: (item) => (
          <span className="font-medium text-sm truncate">
            {getIndustrySectorLabel(item.industry)}
          </span>
        ),
      },
      {
        key: 'health_score',
        label: 'Health',
        width: '70px',
        align: 'center',
        render: (item) => (
          <span
            className={cn(
              'font-bold text-sm',
              item.overall_health_score >= 70 && 'text-green-600',
              item.overall_health_score >= 40 &&
                item.overall_health_score < 70 &&
                'text-amber-600',
              item.overall_health_score < 40 && 'text-red-600'
            )}
          >
            {item.overall_health_score}
          </span>
        ),
      },
      {
        key: 'stress_level',
        label: 'Stress',
        width: '90px',
        align: 'center',
        render: (item) => (
          <Badge
            variant={
              item.stress_level === 'high' || item.stress_level === 'elevated'
                ? 'destructive'
                : 'secondary'
            }
            className="text-xs capitalize"
          >
            {item.stress_level}
          </Badge>
        ),
      },
      {
        key: 'headroom',
        label: 'Headroom',
        width: '80px',
        align: 'right',
        render: (item) => (
          <span
            className={cn(
              'text-sm',
              item.average_headroom_all_covenants < 15 && 'text-red-600 font-medium'
            )}
          >
            {item.average_headroom_all_covenants.toFixed(1)}%
          </span>
        ),
      },
      {
        key: 'at_risk',
        label: 'At-Risk',
        width: '70px',
        align: 'right',
        render: (item) => (
          <span className="text-sm text-red-600">
            {item.covenants_at_risk_percentage.toFixed(1)}%
          </span>
        ),
      },
      {
        key: 'trend',
        label: '3M Trend',
        width: '100px',
        align: 'center',
        render: (item) => (
          <div className="flex items-center justify-center gap-1">
            {item.headroom_trend_3m === 'declining' && (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            {item.headroom_trend_3m === 'improving' && (
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            )}
            <span
              className={cn(
                'text-xs',
                item.headroom_trend_3m === 'declining' && 'text-red-600',
                item.headroom_trend_3m === 'improving' && 'text-green-600'
              )}
            >
              {item.headroom_change_3m_percentage > 0 ? '+' : ''}
              {item.headroom_change_3m_percentage.toFixed(1)}%
            </span>
          </div>
        ),
      },
      {
        key: 'warnings',
        label: 'Warnings',
        width: '80px',
        align: 'center',
        render: (item) =>
          item.early_warning_signals.length > 0 ? (
            <div className="flex items-center justify-center gap-1 text-orange-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{item.early_warning_signals.length}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    []
  );

  return (
    <div className="space-y-3" data-testid="industry-health-grid">
      {/* Compact Header with Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Industry Health</h2>
          <span className="text-xs text-muted-foreground">
            {processedMetrics.length}/{healthMetrics.length} shown
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
            {(['health_score', 'stress_level', 'trend'] as const).map((field) => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-colors',
                  sortField === field
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid={`sort-${field}-btn`}
              >
                {field === 'health_score' ? 'Health' : field === 'stress_level' ? 'Stress' : 'Trend'}
                {sortField === field && <span className="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'cards' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              data-testid="view-cards-btn"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'table' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              data-testid="view-table-btn"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Filter Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Stress Filters */}
        {(['high', 'elevated', 'moderate', 'low'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setStressFilter(stressFilter === level ? 'all' : level)}
            className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors capitalize',
              stressFilter === level
                ? level === 'high' || level === 'elevated'
                  ? 'bg-red-100 border-red-300 text-red-700'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
            )}
            data-testid={`filter-stress-${level}-btn`}
          >
            {level}
          </button>
        ))}
        <span className="text-zinc-300">|</span>
        {/* Trend Filters */}
        {(['declining', 'stable', 'improving'] as const).map((trend) => (
          <button
            key={trend}
            onClick={() => setTrendFilter(trendFilter === trend ? 'all' : trend)}
            className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors capitalize flex items-center gap-0.5',
              trendFilter === trend
                ? trend === 'declining'
                  ? 'bg-red-100 border-red-300 text-red-700'
                  : trend === 'improving'
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
            )}
            data-testid={`filter-trend-${trend}-btn`}
          >
            {trend === 'declining' && <TrendingDown className="h-2.5 w-2.5" />}
            {trend === 'improving' && <TrendingUp className="h-2.5 w-2.5" />}
            {trend}
          </button>
        ))}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            data-testid="clear-filters-btn"
          >
            <X className="h-2.5 w-2.5" />
            Clear
          </button>
        )}
      </div>

      {/* Card View - More Compact */}
      {viewMode === 'cards' && (
        <div
          ref={gridRef}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3"
          data-testid="industry-health-cards-grid"
        >
          {processedMetrics.map((industry) => (
            <Card
              key={industry.industry}
              data-industry-card={industry.industry}
              className={cn(
                'p-4 border will-change-transform',
                industry.stress_level === 'high' && 'border-red-200 bg-red-50/50',
                industry.stress_level === 'elevated' && 'border-orange-200 bg-orange-50/50'
              )}
              data-testid={`industry-health-card-${industry.industry}`}
            >
              <div className="space-y-2">
                {/* Header - Compact */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{getIndustrySectorLabel(industry.industry)}</h3>
                    <Badge
                      variant={
                        industry.stress_level === 'high' || industry.stress_level === 'elevated'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {industry.stress_level}
                    </Badge>
                  </div>
                  <div className="text-xl font-bold">{industry.overall_health_score}</div>
                </div>

                {/* Metrics - Single Row */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Headroom: <span className={cn('font-medium', industry.average_headroom_all_covenants < 15 && 'text-red-600')}>{industry.average_headroom_all_covenants.toFixed(0)}%</span>
                  </span>
                  <span className="text-muted-foreground">
                    Risk: <span className="font-medium text-red-600">{industry.covenants_at_risk_percentage.toFixed(0)}%</span>
                  </span>
                  <div className={cn(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                    industry.headroom_trend_3m === 'declining' && 'bg-red-100 text-red-700',
                    industry.headroom_trend_3m === 'improving' && 'bg-green-100 text-green-700',
                    industry.headroom_trend_3m === 'stable' && 'bg-zinc-100 text-zinc-600'
                  )}>
                    {industry.headroom_trend_3m === 'declining' && <TrendingDown className="h-3 w-3" />}
                    {industry.headroom_trend_3m === 'improving' && <TrendingUp className="h-3 w-3" />}
                    {industry.headroom_change_3m_percentage > 0 ? '+' : ''}{industry.headroom_change_3m_percentage.toFixed(0)}%
                  </div>
                </div>

                {/* Early Warnings - Inline */}
                {industry.early_warning_signals.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="truncate">{industry.early_warning_signals[0]}</span>
                    {industry.early_warning_signals.length > 1 && (
                      <span className="text-orange-400">+{industry.early_warning_signals.length - 1}</span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="p-0 overflow-hidden" data-testid="industry-health-table">
          <CompactDataTable
            data={processedMetrics}
            columns={tableColumns}
            rowHeight="sm"
            stickyHeader
            maxHeight="500px"
            alternatingRows
            getRowKey={(item) => item.industry}
            emptyMessage="No industries match your filters"
          />
        </Card>
      )}

      {/* Empty state */}
      {processedMetrics.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No industries match your current filters.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-primary hover:underline"
            data-testid="empty-state-clear-filters-btn"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
