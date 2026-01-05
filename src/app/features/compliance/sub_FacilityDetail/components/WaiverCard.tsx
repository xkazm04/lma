'use client';

import React, { memo, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ShieldCheck,
  ShieldX,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Waiver } from '../../lib';
import {
  getWaiverStatusColor,
  getWaiverStatusLabel,
  getWaiverPriorityColor,
  getWaiverPriorityLabel,
} from '../../lib';

// =============================================================================
// Headroom Visualization Component
// =============================================================================

interface HeadroomVisualizationProps {
  actualValue: number;
  threshold: number;
  headroomPercentage: number;
  testDate: string;
  thresholdType?: 'maximum' | 'minimum';
}

/**
 * Proportional bar chart visualization for covenant headroom.
 * Shows threshold vs actual value with color gradient indicating status.
 */
function HeadroomVisualization({
  actualValue,
  threshold,
  headroomPercentage,
  testDate,
  thresholdType = 'maximum',
}: HeadroomVisualizationProps) {
  // Determine the range for visualization
  // For a maximum threshold (e.g., leverage ≤ 4.0x), breach happens when actual > threshold
  // For a minimum threshold (e.g., coverage ≥ 2.0x), breach happens when actual < threshold
  const isBreached = headroomPercentage < 0;
  const isAtRisk = headroomPercentage >= 0 && headroomPercentage < 15;

  // Calculate visualization parameters
  // We need to show both the threshold and actual value proportionally
  const visualData = useMemo(() => {
    const maxValue = Math.max(actualValue, threshold) * 1.25; // Add 25% padding
    const minValue = 0;
    const range = maxValue - minValue;

    // Calculate positions as percentages of the bar
    const thresholdPosition = ((threshold - minValue) / range) * 100;
    const actualPosition = ((actualValue - minValue) / range) * 100;

    // Determine fill width based on threshold type
    // For maximum thresholds: fill from 0 to actual (breach if actual > threshold)
    // For minimum thresholds: fill from actual to max (breach if actual < threshold)
    let fillWidth: number;
    let fillStart: number;

    if (thresholdType === 'maximum') {
      fillStart = 0;
      fillWidth = actualPosition;
    } else {
      fillStart = actualPosition;
      fillWidth = 100 - actualPosition;
    }

    return {
      thresholdPosition: Math.min(100, Math.max(0, thresholdPosition)),
      actualPosition: Math.min(100, Math.max(0, actualPosition)),
      fillWidth: Math.min(100, Math.max(0, fillWidth)),
      fillStart: Math.min(100, Math.max(0, fillStart)),
      maxValue,
    };
  }, [actualValue, threshold, thresholdType]);

  // Determine the gradient/color based on headroom status
  const getBarColor = () => {
    if (isBreached) {
      return 'bg-gradient-to-r from-red-400 to-red-500';
    }
    if (isAtRisk) {
      return 'bg-gradient-to-r from-amber-400 to-amber-500';
    }
    return 'bg-gradient-to-r from-green-400 to-green-500';
  };

  const getIndicatorColor = () => {
    if (isBreached) return 'bg-red-600';
    if (isAtRisk) return 'bg-amber-600';
    return 'bg-green-600';
  };

  const getStatusText = () => {
    if (isBreached) return 'Breached';
    if (isAtRisk) return 'At Risk';
    return 'Compliant';
  };

  return (
    <TooltipProvider>
      <div
        className="space-y-2"
        data-testid="headroom-visualization"
      >
        {/* Header with test date and status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              'w-4 h-4',
              isBreached ? 'text-red-500' : isAtRisk ? 'text-amber-500' : 'text-green-500'
            )} />
            <span className="text-xs font-medium text-zinc-700">Triggering Test Result</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{formatDate(testDate)}</span>
            <Badge
              className={cn(
                'text-xs',
                isBreached ? 'bg-red-100 text-red-700' :
                isAtRisk ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              )}
              data-testid="headroom-status-badge"
            >
              {getStatusText()}
            </Badge>
          </div>
        </div>

        {/* Proportional bar visualization */}
        <div className="relative">
          {/* Background bar with gridlines */}
          <div
            className="relative h-6 bg-zinc-100 rounded-md overflow-hidden"
            data-testid="headroom-bar"
          >
            {/* Subtle gridlines at 25% intervals */}
            <div className="absolute inset-0 flex">
              {[25, 50, 75].map((pct) => (
                <div
                  key={pct}
                  className="absolute top-0 bottom-0 w-px bg-zinc-200"
                  style={{ left: `${pct}%` }}
                />
              ))}
            </div>

            {/* Fill bar showing actual value */}
            <div
              className={cn(
                'absolute top-0 bottom-0 transition-all duration-500 ease-out',
                getBarColor()
              )}
              style={{
                left: `${visualData.fillStart}%`,
                width: `${visualData.fillWidth}%`,
              }}
              data-testid="headroom-fill"
            />

            {/* Threshold marker */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-zinc-800 z-10 cursor-help"
                  style={{ left: `${visualData.thresholdPosition}%` }}
                  data-testid="headroom-threshold-marker"
                >
                  {/* Triangle indicator at top */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-zinc-800" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>Threshold: {threshold.toFixed(2)}x</p>
              </TooltipContent>
            </Tooltip>

            {/* Actual value indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'absolute top-0 bottom-0 w-1 z-20 cursor-help shadow-sm',
                    getIndicatorColor()
                  )}
                  style={{ left: `${visualData.actualPosition}%`, transform: 'translateX(-50%)' }}
                  data-testid="headroom-actual-marker"
                >
                  {/* Diamond indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className={cn(
                      'w-2.5 h-2.5 rotate-45 border-2 border-white shadow-sm',
                      getIndicatorColor()
                    )} />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>Actual: {actualValue.toFixed(2)}x</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Scale labels */}
          <div className="flex justify-between mt-1 text-[10px] text-zinc-400">
            <span>0x</span>
            <span>{(visualData.maxValue / 2).toFixed(1)}x</span>
            <span>{visualData.maxValue.toFixed(1)}x</span>
          </div>
        </div>

        {/* Value summary row */}
        <div className="grid grid-cols-3 gap-3 text-xs pt-1">
          <div className="text-center p-1.5 bg-zinc-50 rounded">
            <p className="text-zinc-500 mb-0.5">Actual</p>
            <p className="font-semibold text-zinc-900">{actualValue.toFixed(2)}x</p>
          </div>
          <div className="text-center p-1.5 bg-zinc-50 rounded">
            <p className="text-zinc-500 mb-0.5">Threshold</p>
            <p className="font-semibold text-zinc-900">{threshold.toFixed(2)}x</p>
          </div>
          <div className="text-center p-1.5 bg-zinc-50 rounded">
            <p className="text-zinc-500 mb-0.5">Headroom</p>
            <p className={cn(
              'font-semibold',
              isBreached ? 'text-red-600' : isAtRisk ? 'text-amber-600' : 'text-green-600'
            )}>
              {headroomPercentage >= 0 ? '+' : ''}{headroomPercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500 pt-1">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
            <span>Threshold</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn('w-2.5 h-2.5 rounded-full', getIndicatorColor())} />
            <span>Actual Value</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

interface WaiverCardProps {
  waiver: Waiver;
  index?: number;
  onApprove?: (waiverId: string) => void;
  onReject?: (waiverId: string) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number | null, currency: string): string {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusIcon(status: Waiver['status']) {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'approved':
      return <CheckCircle className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    case 'expired':
      return <ShieldX className="w-4 h-4" />;
    case 'withdrawn':
      return <XCircle className="w-4 h-4" />;
  }
}

function getCovenantTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    leverage_ratio: 'Leverage',
    interest_coverage: 'Interest Coverage',
    fixed_charge_coverage: 'FCCR',
    debt_service_coverage: 'DSCR',
    minimum_liquidity: 'Liquidity',
    capex: 'CapEx',
    net_worth: 'Net Worth',
  };
  return labels[type] || type;
}

export const WaiverCard = memo(function WaiverCard({
  waiver,
  index = 0,
  onApprove,
  onReject,
}: WaiverCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPending = waiver.status === 'pending';
  const isApproved = waiver.status === 'approved';
  const isRejected = waiver.status === 'rejected';
  const isExpired = waiver.status === 'expired';

  const borderColor = cn(
    isPending && 'border-amber-200',
    isApproved && 'border-green-200',
    isRejected && 'border-red-200',
    isExpired && 'border-zinc-200'
  );

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        borderColor,
        'animate-in fade-in slide-in-from-bottom-3'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`waiver-card-${waiver.id}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header with badges */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-zinc-900">{waiver.covenant_name}</h3>
              <Badge className={cn(getWaiverStatusColor(waiver.status), 'hover:opacity-90')}>
                {getStatusIcon(waiver.status)}
                <span className="ml-1">{getWaiverStatusLabel(waiver.status)}</span>
              </Badge>
              <Badge variant="outline">{getCovenantTypeLabel(waiver.covenant_type)}</Badge>
              <Badge className={cn(getWaiverPriorityColor(waiver.priority), 'hover:opacity-90')}>
                {getWaiverPriorityLabel(waiver.priority)}
              </Badge>
            </div>

            {/* Reason */}
            <p className="text-sm text-zinc-600 mb-4">{waiver.request_reason}</p>

            {/* Key metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Requested</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-900">
                    {formatDate(waiver.requested_date)}
                  </p>
                </div>
              </div>
              {isApproved && (
                <div>
                  <p className="text-xs text-zinc-500">Expires</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-900">
                      {formatDate(waiver.expiration_date)}
                    </p>
                  </div>
                </div>
              )}
              {waiver.waiver_fee && (
                <div>
                  <p className="text-xs text-zinc-500">Waiver Fee</p>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-900">
                      {formatCurrency(waiver.waiver_fee, waiver.fee_currency)}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500">Requested By</p>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {waiver.requested_by.split('@')[0]}
                  </p>
                </div>
              </div>
            </div>

            {/* Triggering test info with proportional headroom visualization */}
            {waiver.triggering_test && (
              <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <HeadroomVisualization
                  actualValue={waiver.triggering_test.calculated_ratio}
                  threshold={waiver.triggering_test.threshold}
                  headroomPercentage={waiver.triggering_test.headroom_percentage}
                  testDate={waiver.triggering_test.test_date}
                  thresholdType="maximum"
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 ml-4 shrink-0">
            {isPending && onApprove && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onApprove(waiver.id)}
                data-testid={`approve-waiver-btn-${waiver.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
            {isPending && onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(waiver.id)}
                data-testid={`reject-waiver-btn-${waiver.id}`}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`expand-waiver-btn-${waiver.id}`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  More
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* Justification */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-700 mb-1">Justification</h4>
              <p className="text-sm text-zinc-600">{waiver.justification}</p>
            </div>

            {/* Waiver Terms (if approved) */}
            {waiver.waiver_terms && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  Waiver Terms
                </h4>
                <p className="text-sm text-zinc-600 bg-green-50 p-3 rounded-lg border border-green-100">
                  {waiver.waiver_terms}
                </p>
              </div>
            )}

            {/* Rejection Reason (if rejected) */}
            {waiver.rejection_reason && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-600" />
                  Rejection Reason
                </h4>
                <p className="text-sm text-zinc-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  {waiver.rejection_reason}
                </p>
              </div>
            )}

            {/* Supporting Documents */}
            {waiver.supporting_documents.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Supporting Documents ({waiver.supporting_documents.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {waiver.supporting_documents.map((doc) => (
                    <Badge
                      key={doc.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-zinc-50"
                      data-testid={`waiver-doc-${doc.id}`}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {doc.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {waiver.comments.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Comments ({waiver.comments.length})
                </h4>
                <div className="space-y-2">
                  {waiver.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="text-sm p-2 bg-zinc-50 rounded-lg"
                      data-testid={`waiver-comment-${comment.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-zinc-900">
                          {comment.author.split('@')[0]}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-zinc-600">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision info */}
            {waiver.decision_date && waiver.decision_by && (
              <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                Decision made on {formatDate(waiver.decision_date)} by {waiver.decision_by}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
