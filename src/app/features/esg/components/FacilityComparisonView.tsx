'use client';

import React, { useRef, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, Minus, Trophy } from 'lucide-react';
import { LoanTypeBadge } from './LoanTypeBadge';
import { StatusBadge } from './StatusBadge';
import {
  formatCurrency,
  type ESGFacility,
  type ComparisonResult,
  facilityComparisonMetrics,
  findBestPerformer,
  compareStatus,
  getComparisonClass,
} from '../lib';

interface FacilityComparisonViewProps {
  facilities: ESGFacility[];
  onRemoveFacility?: (id: string) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not set';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const ComparisonIndicator = memo(function ComparisonIndicator({
  result,
  isBest,
}: {
  result: ComparisonResult;
  isBest: boolean;
}) {
  if (isBest) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white ml-2">
        <Trophy className="w-3 h-3" />
      </span>
    );
  }

  switch (result) {
    case 'better':
      return <ArrowUp className="w-4 h-4 text-green-600 ml-2" />;
    case 'worse':
      return <ArrowDown className="w-4 h-4 text-red-600 ml-2" />;
    case 'equal':
      return <Minus className="w-4 h-4 text-zinc-400 ml-2" />;
    default:
      return null;
  }
});

const MetricRow = memo(function MetricRow({
  label,
  values,
  bestId,
  facilities,
  compareFunc,
}: {
  label: string;
  values: (string | number)[];
  bestId: string | null;
  facilities: ESGFacility[];
  compareFunc?: (a: number, b: number) => ComparisonResult;
}) {
  return (
    <div className="grid grid-cols-[200px_repeat(var(--col-count),1fr)] border-b border-zinc-100 last:border-b-0">
      <div className="p-3 text-sm font-medium text-zinc-600 bg-zinc-50 sticky left-0 z-10">
        {label}
      </div>
      {values.map((value, index) => {
        const facility = facilities[index];
        const isBest = bestId === facility.id;
        return (
          <div
            key={facility.id}
            className={`p-3 text-sm text-center ${
              isBest ? 'bg-green-50 font-semibold text-green-700' : 'text-zinc-900'
            }`}
          >
            <span className="inline-flex items-center">
              {typeof value === 'number' && label.includes('Amount')
                ? formatCurrency(value)
                : value}
              {isBest && <Trophy className="w-3 h-3 ml-1 text-green-600" />}
            </span>
          </div>
        );
      })}
    </div>
  );
});

export const FacilityComparisonView = memo(function FacilityComparisonView({
  facilities,
  onRemoveFacility,
}: FacilityComparisonViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((source: 'header' | 'content') => {
    const sourceRef = source === 'header' ? headerScrollRef : contentScrollRef;
    const targetRef = source === 'header' ? contentScrollRef : headerScrollRef;

    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
    }
  }, []);

  if (facilities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-zinc-500">Select facilities to compare</p>
        </CardContent>
      </Card>
    );
  }

  const colCount = facilities.length;
  const cssVars = { '--col-count': colCount } as React.CSSProperties;

  // Group metrics by category
  const metricsByCategory = {
    financial: facilityComparisonMetrics.filter((m) => m.category === 'financial'),
    performance: facilityComparisonMetrics.filter((m) => m.category === 'performance'),
    targets: facilityComparisonMetrics.filter((m) => m.category === 'targets'),
    margin: facilityComparisonMetrics.filter((m) => m.category === 'margin'),
  };

  // Find best performers for each metric
  const bestPerformers = new Map<string, string | null>();
  facilityComparisonMetrics.forEach((metric) => {
    bestPerformers.set(metric.label, findBestPerformer(facilities, metric));
  });

  // Find best status
  const statusBestId = (() => {
    let bestId: string | null = null;
    let bestStatus = 'off_track';
    facilities.forEach((f) => {
      const result = compareStatus(
        f.overall_performance_status,
        bestStatus as 'on_track' | 'at_risk' | 'off_track' | 'pending'
      );
      if (result === 'better') {
        bestStatus = f.overall_performance_status;
        bestId = f.id;
      }
    });
    return bestId;
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-500" style={cssVars}>
      {/* Header Cards - Facility Overview */}
      <div
        ref={headerScrollRef}
        onScroll={() => handleScroll('header')}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-100"
      >
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(280px, 1fr))` }}
        >
          {facilities.map((facility, index) => (
            <Card
              key={facility.id}
              className="relative animate-in slide-in-from-top-4"
              style={{ animationDelay: `${index * 100}ms` }}
              data-testid={`comparison-facility-card-${facility.id}`}
            >
              {onRemoveFacility && (
                <button
                  onClick={() => onRemoveFacility(facility.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-700 transition-colors z-10"
                  data-testid={`remove-facility-${facility.id}`}
                >
                  ×
                </button>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate" title={facility.facility_name}>
                      {facility.facility_name}
                    </CardTitle>
                    <p className="text-sm text-zinc-500 truncate">{facility.borrower_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <LoanTypeBadge type={facility.esg_loan_type} />
                  <StatusBadge status={facility.overall_performance_status} />
                  {statusBestId === facility.id && (
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      <Trophy className="w-3 h-3 mr-1" />
                      Best Status
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Industry</span>
                    <span className="font-medium">{facility.borrower_industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Maturity</span>
                    <span className="font-medium">{formatDate(facility.maturity_date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-zinc-50">
          <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
        </CardHeader>
        <div
          ref={contentScrollRef}
          onScroll={() => handleScroll('content')}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-100"
        >
          <div className="min-w-fit">
            {/* Financial Metrics */}
            <div className="border-b border-zinc-200">
              <div className="px-3 py-2 bg-blue-50 text-blue-800 font-semibold text-sm">
                Financial Metrics
              </div>
              {metricsByCategory.financial.map((metric) => (
                <MetricRow
                  key={metric.label}
                  label={metric.label}
                  values={facilities.map((f) => metric.getValue(f))}
                  bestId={bestPerformers.get(metric.label) ?? null}
                  facilities={facilities}
                  compareFunc={metric.compare}
                />
              ))}
            </div>

            {/* Performance Metrics */}
            <div className="border-b border-zinc-200">
              <div className="px-3 py-2 bg-green-50 text-green-800 font-semibold text-sm">
                Performance Metrics
              </div>
              <MetricRow
                label="Overall Status"
                values={facilities.map((f) => f.overall_performance_status.replace('_', ' '))}
                bestId={statusBestId}
                facilities={facilities}
              />
              {metricsByCategory.performance.map((metric) => (
                <MetricRow
                  key={metric.label}
                  label={metric.label}
                  values={facilities.map((f) => metric.getValue(f))}
                  bestId={bestPerformers.get(metric.label) ?? null}
                  facilities={facilities}
                  compareFunc={metric.compare}
                />
              ))}
            </div>

            {/* Target Metrics */}
            <div className="border-b border-zinc-200">
              <div className="px-3 py-2 bg-purple-50 text-purple-800 font-semibold text-sm">
                Target Metrics
              </div>
              {metricsByCategory.targets.map((metric) => (
                <MetricRow
                  key={metric.label}
                  label={metric.label}
                  values={facilities.map((f) => metric.getValue(f))}
                  bestId={bestPerformers.get(metric.label) ?? null}
                  facilities={facilities}
                  compareFunc={metric.compare}
                />
              ))}
              {/* Target Progress Bar */}
              <div className="grid grid-cols-[200px_repeat(var(--col-count),1fr)] border-b border-zinc-100">
                <div className="p-3 text-sm font-medium text-zinc-600 bg-zinc-50 sticky left-0 z-10">
                  Progress
                </div>
                {facilities.map((f, index) => {
                  const progress =
                    f.targets_total > 0 ? (f.targets_achieved / f.targets_total) * 100 : 0;
                  return (
                    <div key={f.id} className="p-3 flex items-center justify-center">
                      <Progress
                        value={progress}
                        className="h-2 w-24"
                        animate
                        animationDelay={index * 100 + 300}
                        data-testid={`facility-progress-${f.id}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Margin Metrics */}
            <div>
              <div className="px-3 py-2 bg-amber-50 text-amber-800 font-semibold text-sm">
                Margin Metrics
              </div>
              {metricsByCategory.margin.map((metric) => (
                <MetricRow
                  key={metric.label}
                  label={metric.label}
                  values={facilities.map((f) => metric.getValue(f))}
                  bestId={bestPerformers.get(metric.label) ?? null}
                  facilities={facilities}
                  compareFunc={metric.compare}
                />
              ))}
            </div>

            {/* Additional Info */}
            <div className="border-t border-zinc-200">
              <div className="px-3 py-2 bg-zinc-50 text-zinc-700 font-semibold text-sm">
                Additional Information
              </div>
              <MetricRow
                label="Framework"
                values={facilities.map((f) => f.framework_reference)}
                bestId={null}
                facilities={facilities}
              />
              <MetricRow
                label="Sustainability Coordinator"
                values={facilities.map((f) => f.sustainability_coordinator || 'Not specified')}
                bestId={null}
                facilities={facilities}
              />
              <MetricRow
                label="External Verifier"
                values={facilities.map((f) => f.external_verifier || 'Not specified')}
                bestId={null}
                facilities={facilities}
              />
              <MetricRow
                label="Next Reporting Date"
                values={facilities.map((f) => formatDate(f.next_reporting_date))}
                bestId={null}
                facilities={facilities}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="bg-zinc-50">
        <CardContent className="py-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-zinc-600 font-medium">Legend:</span>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-600" />
              <span className="text-zinc-600">Best performer for metric</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded" />
              <span className="text-zinc-600">Highlighted best value</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
