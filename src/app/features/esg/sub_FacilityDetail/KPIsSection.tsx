'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Filter, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../components';
import { KPI_CATEGORIES } from '../lib';
import type { ESGKPI, KPICategory } from '../lib';

type KPIFilter = 'all' | 'at_risk';

interface KPIsSectionProps {
  kpis: ESGKPI[];
  filter?: KPIFilter;
  onFilterChange?: (filter: KPIFilter) => void;
}

export const KPIsSection = memo(function KPIsSection({ kpis, filter = 'all', onFilterChange }: KPIsSectionProps) {
  const getCategoryConfig = (category: KPICategory) => KPI_CATEGORIES[category];

  // Count at-risk KPIs
  const atRiskCount = useMemo(() => {
    return kpis.filter((kpi) => kpi.targets.some((t) => t.target_status === 'at_risk')).length;
  }, [kpis]);

  // Filter KPIs based on filter selection
  const filteredKpis = useMemo(() => {
    if (filter === 'at_risk') {
      return kpis.filter((kpi) => kpi.targets.some((t) => t.target_status === 'at_risk'));
    }
    return kpis;
  }, [kpis, filter]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="kpis-section">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">Key Performance Indicators</h2>
          {/* Filter toggle buttons */}
          {onFilterChange && (
            <div className="flex items-center gap-2 ml-4" data-testid="kpi-filter-controls">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('all')}
                data-testid="kpi-filter-all-btn"
              >
                <Filter className="w-3 h-3 mr-1" />
                All ({kpis.length})
              </Button>
              <Button
                variant={filter === 'at_risk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('at_risk')}
                className={filter === 'at_risk' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
                data-testid="kpi-filter-at-risk-btn"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                At Risk ({atRiskCount})
              </Button>
            </div>
          )}
        </div>
        <Button data-testid="add-kpi-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add KPI
        </Button>
      </div>

      {/* Show filtered state message */}
      {filter === 'at_risk' && filteredKpis.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 animate-in fade-in duration-300" data-testid="at-risk-filter-banner">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            Showing {filteredKpis.length} KPI{filteredKpis.length !== 1 ? 's' : ''} with at-risk targets
          </span>
        </div>
      )}

      {filter === 'at_risk' && filteredKpis.length === 0 && (
        <div className="p-6 text-center rounded-lg bg-green-50 border border-green-200 animate-in fade-in duration-300" data-testid="no-at-risk-message">
          <p className="text-green-800 font-medium">No KPIs are currently at risk</p>
          <p className="text-sm text-green-600 mt-1">All KPIs are on track or have achieved their targets</p>
        </div>
      )}

      <div className="space-y-3" data-testid="kpis-list">
        {filteredKpis.map((kpi, index) => {
          const hasAtRiskTarget = kpi.targets.some((t) => t.target_status === 'at_risk');
          return (
            <Card
              key={kpi.id}
              className={`transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-4 ${
                hasAtRiskTarget && filter === 'at_risk'
                  ? 'ring-2 ring-amber-400 border-amber-300 bg-amber-50/30'
                  : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              data-testid={`kpi-card-${kpi.id}`}
              data-at-risk={hasAtRiskTarget}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg" data-testid={`kpi-name-${kpi.id}`}>{kpi.kpi_name}</CardTitle>
                      <Badge className={getCategoryConfig(kpi.kpi_category).colorClass} data-testid={`kpi-category-${kpi.id}`}>
                        {getCategoryConfig(kpi.kpi_category).label}
                      </Badge>
                    </div>
                    <CardDescription>
                      Weight: {kpi.weight}% | Unit: {kpi.unit} | Baseline ({kpi.baseline_year}): {kpi.baseline_value}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">Current Value</p>
                    <p className="text-2xl font-bold text-zinc-900" data-testid={`kpi-current-value-${kpi.id}`}>
                      {kpi.current_value} {kpi.unit}
                    </p>
                    <p
                      className={`text-xs ${
                        kpi.current_value < kpi.baseline_value ? 'text-green-600' : 'text-zinc-500'
                      }`}
                    >
                      {(((kpi.current_value - kpi.baseline_value) / kpi.baseline_value) * 100).toFixed(1)}% vs baseline
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid={`kpi-targets-${kpi.id}`}>
                  {kpi.targets.map((target) => (
                    <div
                      key={target.target_year}
                      className={`p-3 rounded-lg border transition-all duration-300 hover:scale-105 ${
                        target.target_status === 'achieved'
                          ? 'border-green-200 bg-green-50'
                          : target.target_status === 'at_risk'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-zinc-200 bg-zinc-50'
                      }`}
                      data-testid={`kpi-target-${kpi.id}-${target.target_year}`}
                      data-status={target.target_status}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-zinc-900">{target.target_year}</span>
                        <StatusBadge status={target.target_status} />
                      </div>
                      <p className="text-base font-bold text-zinc-900">
                        {target.target_value} {kpi.unit}
                      </p>
                      {target.actual_value !== undefined && (
                        <p className="text-sm text-zinc-500 mt-1">
                          Actual: {target.actual_value} {kpi.unit}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});
