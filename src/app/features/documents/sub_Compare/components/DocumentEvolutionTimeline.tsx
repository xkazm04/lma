'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  FileText,
  GitCompare,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  ChevronDown,
  Calendar,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  FacilityTimeline,
  TimelinePoint,
  DocumentState,
  TemporalComparisonResult,
} from '../lib/temporal-types';

interface DocumentEvolutionTimelineProps {
  timeline: FacilityTimeline;
  visualPoints: TimelinePoint[];
  selectedFromState?: DocumentState | null;
  selectedToState?: DocumentState | null;
  comparisonResult?: TemporalComparisonResult | null;
  onSelectFromState?: (state: DocumentState) => void;
  onSelectToState?: (state: DocumentState) => void;
  onCompare?: (fromState: DocumentState, toState: DocumentState) => void;
  isLoading?: boolean;
  className?: string;
}

export const DocumentEvolutionTimeline = memo(function DocumentEvolutionTimeline({
  timeline,
  visualPoints,
  selectedFromState,
  selectedToState,
  comparisonResult,
  onSelectFromState,
  onSelectToState,
  onCompare,
  isLoading = false,
  className,
}: DocumentEvolutionTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectionMode, setSelectionMode] = useState<'from' | 'to' | null>(null);

  const handlePointClick = useCallback((state: DocumentState) => {
    if (selectionMode === 'from') {
      onSelectFromState?.(state);
      setSelectionMode('to');
    } else if (selectionMode === 'to') {
      onSelectToState?.(state);
      setSelectionMode(null);
    } else {
      // Start selection from this point
      onSelectFromState?.(state);
      setSelectionMode('to');
    }
  }, [selectionMode, onSelectFromState, onSelectToState]);

  const handleCompareClick = useCallback(() => {
    if (selectedFromState && selectedToState) {
      onCompare?.(selectedFromState, selectedToState);
    }
  }, [selectedFromState, selectedToState, onCompare]);

  const canCompare = selectedFromState && selectedToState && selectedFromState.id !== selectedToState.id;

  // Calculate comparison range for visualization
  const comparisonRange = useMemo(() => {
    if (!selectedFromState || !selectedToState) return null;

    const fromIndex = visualPoints.findIndex(p => p.state.id === selectedFromState.id);
    const toIndex = visualPoints.findIndex(p => p.state.id === selectedToState.id);

    if (fromIndex === -1 || toIndex === -1) return null;

    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);

    return {
      startPosition: visualPoints[startIndex].position,
      endPosition: visualPoints[endIndex].position,
    };
  }, [selectedFromState, selectedToState, visualPoints]);

  return (
    <Card className={cn('animate-in fade-in slide-in-from-top-4 duration-300', className)} data-testid="document-evolution-timeline">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="timeline-toggle-btn"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Document Evolution
              <Badge variant="secondary" className="ml-1">
                {timeline.stats.totalDocuments} versions
              </Badge>
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {selectionMode && (
              <Badge
                variant="secondary"
                className={cn(
                  'flex items-center gap-1',
                  selectionMode === 'from'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                )}
              >
                <GitCompare className="w-3 h-3" />
                Select {selectionMode === 'from' ? 'start' : 'end'} point
              </Badge>
            )}

            {canCompare && (
              <Button
                size="sm"
                onClick={handleCompareClick}
                disabled={isLoading}
                data-testid="compare-selected-btn"
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare Selected
              </Button>
            )}
          </div>
        </div>

        {/* Facility Info */}
        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
          <span className="font-medium text-zinc-700">{timeline.facilityName}</span>
          <span>{timeline.borrowerName}</span>
          {timeline.stats.dateRange && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(parseISO(timeline.stats.dateRange.earliest), 'MMM yyyy')} -{' '}
              {format(parseISO(timeline.stats.dateRange.latest), 'MMM yyyy')}
            </span>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Timeline Visualization */}
          <div className="relative py-8" data-testid="timeline-visualization">
            {/* Timeline track */}
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-zinc-200 rounded-full">
              {/* Comparison range highlight */}
              {comparisonRange && (
                <div
                  className="absolute top-0 h-full bg-blue-200 rounded-full transition-all duration-300"
                  style={{
                    left: `${comparisonRange.startPosition}%`,
                    width: `${comparisonRange.endPosition - comparisonRange.startPosition}%`,
                  }}
                  data-testid="comparison-range-highlight"
                />
              )}
            </div>

            {/* Timeline points */}
            <div className="relative flex justify-between px-8">
              {visualPoints.map((point, index) => {
                const isFromSelected = selectedFromState?.id === point.state.id;
                const isToSelected = selectedToState?.id === point.state.id;
                const isSelected = isFromSelected || isToSelected;
                const isInRange = comparisonRange &&
                  point.position >= comparisonRange.startPosition &&
                  point.position <= comparisonRange.endPosition;

                return (
                  <TooltipProvider key={point.state.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            'relative flex flex-col items-center gap-2 transition-all duration-200',
                            'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2',
                            isSelected && 'scale-110'
                          )}
                          onClick={() => handlePointClick(point.state)}
                          data-testid={`timeline-point-${point.state.id}`}
                        >
                          {/* Point marker */}
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border-2 transition-all duration-200',
                              point.isOriginal && 'w-5 h-5',
                              point.isCurrent && 'w-5 h-5',
                              isFromSelected && 'bg-blue-500 border-blue-600 ring-4 ring-blue-100',
                              isToSelected && 'bg-purple-500 border-purple-600 ring-4 ring-purple-100',
                              !isSelected && isInRange && 'bg-blue-300 border-blue-400',
                              !isSelected && !isInRange && 'bg-white border-zinc-400',
                              point.isOriginal && !isSelected && 'border-green-500 bg-green-50',
                              point.isCurrent && !isSelected && 'border-blue-500 bg-blue-50'
                            )}
                          >
                            {point.isOriginal && !isSelected && (
                              <FileText className="w-2.5 h-2.5 m-0.5 text-green-600" />
                            )}
                          </div>

                          {/* Date label */}
                          <span className={cn(
                            'text-xs whitespace-nowrap',
                            isSelected ? 'font-medium text-zinc-900' : 'text-zinc-500'
                          )}>
                            {format(parseISO(point.state.effectiveDate), 'MMM yyyy')}
                          </span>

                          {/* Document type badge */}
                          {point.state.amendmentNumber !== null && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs px-1.5 py-0',
                                isSelected ? 'bg-zinc-200' : 'bg-zinc-100'
                              )}
                            >
                              A{point.state.amendmentNumber}
                            </Badge>
                          )}
                          {point.isOriginal && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0 bg-green-100 text-green-700"
                            >
                              Original
                            </Badge>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{point.state.name}</p>
                          <p className="text-xs text-zinc-400">
                            {point.state.description || point.state.documentType}
                          </p>
                          <p className="text-xs text-zinc-400">
                            Effective: {format(parseISO(point.state.effectiveDate), 'PPP')}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>

          {/* Selection Summary */}
          {(selectedFromState || selectedToState) && (
            <div className="mt-4 p-4 bg-zinc-50 rounded-lg" data-testid="selection-summary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* From state */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <span className="text-xs text-zinc-500">From</span>
                      <p className="font-medium text-sm">
                        {selectedFromState?.name || 'Select start point'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-400" />

                  {/* To state */}
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      selectedToState ? 'bg-purple-500' : 'bg-zinc-300'
                    )} />
                    <div>
                      <span className="text-xs text-zinc-500">To</span>
                      <p className="font-medium text-sm">
                        {selectedToState?.name || 'Select end point'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedFromState && selectedToState && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onSelectFromState?.(undefined as unknown as DocumentState);
                      onSelectToState?.(undefined as unknown as DocumentState);
                      setSelectionMode(null);
                    }}
                    data-testid="clear-selection-btn"
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Comparison Result Preview */}
          {comparisonResult && (
            <div className="mt-4" data-testid="comparison-result-preview">
              <TemporalComparisonSummary result={comparisonResult} />
            </div>
          )}

          {/* Instructions */}
          {!selectedFromState && !comparisonResult && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-start gap-3" data-testid="timeline-instructions">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Compare document versions over time</p>
                <p className="text-blue-600 mt-1">
                  Click on any two points in the timeline to compare how the facility evolved between those states.
                  See when covenants tightened, margins changed, or commitments were adjusted.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
});

// Sub-component for displaying temporal comparison summary
interface TemporalComparisonSummaryProps {
  result: TemporalComparisonResult;
}

const TemporalComparisonSummary = memo(function TemporalComparisonSummary({
  result,
}: TemporalComparisonSummaryProps) {
  const { changesSummary, timeElapsed, differences } = result;

  const getRiskIcon = () => {
    switch (changesSummary.riskDirection) {
      case 'more_favorable':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'less_favorable':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getRiskLabel = () => {
    switch (changesSummary.riskDirection) {
      case 'more_favorable':
        return 'More Favorable';
      case 'less_favorable':
        return 'Less Favorable';
      default:
        return 'Neutral';
    }
  };

  const getRiskColor = () => {
    switch (changesSummary.riskDirection) {
      case 'more_favorable':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'less_favorable':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-zinc-50 border-zinc-200 text-zinc-700';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Time period header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Clock className="w-4 h-4" />
          <span>
            {timeElapsed.years > 0 && `${timeElapsed.years} year${timeElapsed.years > 1 ? 's' : ''} `}
            {timeElapsed.months % 12 > 0 && `${timeElapsed.months % 12} month${timeElapsed.months % 12 > 1 ? 's' : ''} `}
            evolution
          </span>
        </div>
        <Badge
          variant="secondary"
          className={cn('flex items-center gap-1', getRiskColor())}
        >
          {getRiskIcon()}
          {getRiskLabel()}
        </Badge>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        {/* Total changes */}
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Total Changes</p>
              <p className="text-lg font-bold">{differences.length}</p>
            </div>
          </div>
        </Card>

        {/* Commitment change */}
        {changesSummary.financialTerms.commitmentChange && (
          <Card className={cn(
            'p-3',
            changesSummary.financialTerms.commitmentChange.direction === 'increase'
              ? 'bg-green-50'
              : 'bg-red-50'
          )}>
            <div className="flex items-center gap-2">
              <DollarSign className={cn(
                'w-4 h-4',
                changesSummary.financialTerms.commitmentChange.direction === 'increase'
                  ? 'text-green-500'
                  : 'text-red-500'
              )} />
              <div>
                <p className="text-xs text-zinc-500">Commitment</p>
                <p className={cn(
                  'text-lg font-bold',
                  changesSummary.financialTerms.commitmentChange.direction === 'increase'
                    ? 'text-green-700'
                    : 'text-red-700'
                )}>
                  {changesSummary.financialTerms.commitmentChange.direction === 'increase' ? '+' : ''}
                  {changesSummary.financialTerms.commitmentChange.percentageChange.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Covenant changes */}
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Covenants</p>
              <div className="flex items-center gap-2">
                {changesSummary.covenants.tightened.length > 0 && (
                  <span className="text-sm font-medium text-amber-600">
                    {changesSummary.covenants.tightened.length} tightened
                  </span>
                )}
                {changesSummary.covenants.loosened.length > 0 && (
                  <span className="text-sm font-medium text-green-600">
                    {changesSummary.covenants.loosened.length} loosened
                  </span>
                )}
                {changesSummary.covenants.tightened.length === 0 &&
                 changesSummary.covenants.loosened.length === 0 && (
                  <span className="text-sm text-zinc-400">No changes</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Maturity change */}
        <Card className={cn(
          'p-3',
          changesSummary.dateChanges.maturityExtended ? 'bg-green-50' : ''
        )}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Maturity</p>
              {changesSummary.dateChanges.maturityDays ? (
                <p className={cn(
                  'text-sm font-medium',
                  changesSummary.dateChanges.maturityExtended
                    ? 'text-green-700'
                    : 'text-amber-700'
                )}>
                  {changesSummary.dateChanges.maturityExtended ? '+' : '-'}
                  {changesSummary.dateChanges.maturityDays} days
                </p>
              ) : (
                <span className="text-sm text-zinc-400">Unchanged</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Narrative points */}
      {changesSummary.narrativePoints.length > 0 && (
        <div className="p-3 bg-zinc-50 rounded-lg">
          <p className="text-xs font-medium text-zinc-500 mb-2">Key Changes</p>
          <ul className="space-y-1">
            {changesSummary.narrativePoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
