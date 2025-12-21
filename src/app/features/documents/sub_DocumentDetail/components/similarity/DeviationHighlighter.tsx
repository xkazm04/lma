'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Filter,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TermDeviation } from '@/app/features/documents/lib/types';

interface DeviationHighlighterProps {
  documentId: string;
  onDeviationSelect?: (deviation: TermDeviation) => void;
}

const SeverityIcon = memo(function SeverityIcon({
  severity,
}: {
  severity: TermDeviation['severity'];
}) {
  const iconClass = {
    low: 'text-zinc-400',
    medium: 'text-amber-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  }[severity];

  return <AlertTriangle className={`w-4 h-4 ${iconClass}`} />;
});

const DeviationDirectionIcon = memo(function DeviationDirectionIcon({
  direction,
}: {
  direction: TermDeviation['deviationDirection'];
}) {
  switch (direction) {
    case 'better':
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    case 'worse':
      return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-zinc-400" />;
  }
});

const DeviationCard = memo(function DeviationCard({
  deviation,
  index,
  isExpanded,
  onToggle,
}: {
  deviation: TermDeviation;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const severityColors = {
    low: 'bg-zinc-50 border-zinc-200',
    medium: 'bg-amber-50 border-amber-200',
    high: 'bg-orange-50 border-orange-200',
    critical: 'bg-red-50 border-red-200',
  };

  const severityBadgeVariant = {
    low: 'secondary',
    medium: 'warning',
    high: 'warning',
    critical: 'destructive',
  } as const;

  const categoryLabels = {
    financial_terms: 'Financial Terms',
    covenants: 'Covenants',
    legal_provisions: 'Legal Provisions',
    key_dates: 'Key Dates',
    parties: 'Parties',
    other: 'Other',
  };

  return (
    <Card
      className={`animate-in fade-in slide-in-from-bottom-2 transition-all duration-200 hover:shadow-md ${severityColors[deviation.severity]}`}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`deviation-card-${deviation.id}`}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-white/80 transition-transform hover:scale-110 flex-shrink-0"
            data-testid={`toggle-deviation-details-${deviation.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <SeverityIcon severity={deviation.severity} />
                <h3 className="font-medium text-zinc-900">{deviation.termName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={severityBadgeVariant[deviation.severity]} className="capitalize">
                  {deviation.severity}
                </Badge>
                <Badge variant="outline">{categoryLabels[deviation.category]}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <DeviationDirectionIcon direction={deviation.deviationDirection} />
                <span className="text-sm">
                  <span className="text-zinc-500">Current:</span>{' '}
                  <span className="font-medium text-zinc-700">{deviation.currentValue}</span>
                </span>
              </div>
              <span className="text-zinc-300">→</span>
              <span className="text-sm">
                <span className="text-zinc-500">Norm:</span>{' '}
                <span className="font-medium text-zinc-700">{deviation.normValue}</span>
              </span>
              {deviation.deviationPercentage !== undefined && deviation.deviationPercentage !== 0 && (
                <Badge
                  variant={deviation.deviationDirection === 'better' ? 'success' : 'destructive'}
                  className="text-xs"
                >
                  {deviation.deviationPercentage > 0 ? '+' : ''}
                  {deviation.deviationPercentage.toFixed(1)}%
                </Badge>
              )}
            </div>

            {deviation.clauseReference && (
              <div className="mt-2 text-xs text-zinc-400">
                {deviation.clauseReference}
                {deviation.pageNumber && ` • Page ${deviation.pageNumber}`}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-2 bg-white/60 rounded-lg p-3">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-zinc-600">{deviation.explanation}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export const DeviationHighlighter = memo(function DeviationHighlighter({
  documentId,
  onDeviationSelect,
}: DeviationHighlighterProps) {
  const [deviations, setDeviations] = useState<TermDeviation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<TermDeviation['severity'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TermDeviation['category'] | 'all'>('all');

  const fetchDeviations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/documents/${documentId}/similarity?type=deviations`;
      if (severityFilter !== 'all') {
        url += `&minSeverity=${severityFilter}`;
      }
      if (categoryFilter !== 'all') {
        url += `&categories=${categoryFilter}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setDeviations(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch deviations');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, severityFilter, categoryFilter]);

  useEffect(() => {
    fetchDeviations();
  }, [fetchDeviations]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Calculate statistics
  const criticalCount = deviations.filter((d) => d.severity === 'critical').length;
  const highCount = deviations.filter((d) => d.severity === 'high').length;
  const mediumCount = deviations.filter((d) => d.severity === 'medium').length;
  const lowCount = deviations.filter((d) => d.severity === 'low').length;

  const betterCount = deviations.filter((d) => d.deviationDirection === 'better').length;
  const worseCount = deviations.filter((d) => d.deviationDirection === 'worse').length;

  // Group by category for display
  const groupedDeviations = deviations.reduce(
    (acc, deviation) => {
      if (!acc[deviation.category]) {
        acc[deviation.category] = [];
      }
      acc[deviation.category].push(deviation);
      return acc;
    },
    {} as Record<string, TermDeviation[]>
  );

  const categoryOrder: TermDeviation['category'][] = [
    'financial_terms',
    'covenants',
    'key_dates',
    'legal_provisions',
    'parties',
    'other',
  ];

  const sortedCategories = categoryOrder.filter((cat) => groupedDeviations[cat]?.length > 0);

  return (
    <div className="space-y-6" data-testid="deviation-highlighter">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Deviations from Norms</CardTitle>
                <CardDescription>
                  Terms that differ from organizational standards
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDeviations}
              disabled={isLoading}
              data-testid="refresh-deviations-btn"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          {!isLoading && deviations.length > 0 && (
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="text-xl font-bold text-red-600">{criticalCount}</div>
                  <div className="text-xs text-zinc-500">Critical</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <div className="text-xl font-bold text-orange-600">{highCount}</div>
                  <div className="text-xs text-zinc-500">High</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-xl font-bold text-amber-600">{mediumCount}</div>
                  <div className="text-xs text-zinc-500">Medium</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="text-xl font-bold text-zinc-600">{lowCount}</div>
                  <div className="text-xs text-zinc-500">Low</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    {betterCount} favorable
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <ArrowDownRight className="w-4 h-4" />
                    {worseCount} unfavorable
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-500">Severity:</span>
            </div>
            <div className="flex gap-2">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
                <Button
                  key={sev}
                  variant={severityFilter === sev ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSeverityFilter(sev)}
                  className="capitalize"
                  data-testid={`filter-severity-${sev}`}
                >
                  {sev}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Category:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('all')}
                data-testid="filter-category-all"
              >
                All
              </Button>
              {categoryOrder.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className="capitalize"
                  data-testid={`filter-category-${cat}`}
                >
                  {cat.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm text-zinc-500">Analyzing deviations...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDeviations}
              className="mt-2"
              data-testid="retry-deviations-btn"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Deviation List by Category */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {deviations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                <p className="text-zinc-500">No deviations from norms found</p>
                <p className="text-sm text-zinc-400 mt-1">
                  All terms are within organizational standards
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedCategories.map((category) => (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
                  {category.replace(/_/g, ' ')} ({groupedDeviations[category].length})
                </h3>
                {groupedDeviations[category]
                  .sort((a, b) => {
                    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                    return severityOrder[a.severity] - severityOrder[b.severity];
                  })
                  .map((deviation, index) => (
                    <DeviationCard
                      key={deviation.id}
                      deviation={deviation}
                      index={index}
                      isExpanded={expandedIds.has(deviation.id)}
                      onToggle={() => toggleExpanded(deviation.id)}
                    />
                  ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});
