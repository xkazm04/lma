'use client';

import React, { memo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronRight,
  Lightbulb,
  Network,
  Target,
  TrendingDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RippleEffect, AffectedBorrower } from '../lib/mocks';
import {
  formatExposure,
  getSeverityVariant,
  getSeverityColor,
  getCorrelationColor,
} from '../lib/mocks';

interface RippleEffectViewProps {
  ripple: RippleEffect;
  onBorrowerClick?: (borrowerId: string) => void;
}

// Source event card
const SourceEventCard = memo(function SourceEventCard({
  event,
}: {
  event: RippleEffect['sourceEvent'];
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 animate-in fade-in zoom-in-95 duration-300',
        event.severity === 'critical'
          ? 'border-red-400 bg-red-50'
          : event.severity === 'high'
          ? 'border-amber-400 bg-amber-50'
          : 'border-zinc-300 bg-zinc-50'
      )}
      data-testid="source-event-card"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            event.severity === 'critical'
              ? 'bg-red-200'
              : event.severity === 'high'
              ? 'bg-amber-200'
              : 'bg-zinc-200'
          )}
        >
          <AlertTriangle
            className={cn(
              'w-5 h-5',
              event.severity === 'critical'
                ? 'text-red-700'
                : event.severity === 'high'
                ? 'text-amber-700'
                : 'text-zinc-700'
            )}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-zinc-900">{event.title}</h4>
            <Badge variant={getSeverityVariant(event.severity)}>
              {event.severity}
            </Badge>
          </div>
          <p className="text-sm text-zinc-600 mb-2">{event.description}</p>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {event.borrowerName}
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {event.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Affected borrower card
const AffectedBorrowerCard = memo(function AffectedBorrowerCard({
  borrower,
  index,
  onClick,
}: {
  borrower: AffectedBorrower;
  index: number;
  onClick?: () => void;
}) {
  const riskLevel = borrower.riskProbability * 100;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all cursor-pointer group animate-in fade-in slide-in-from-right-4',
        borrower.estimatedImpact === 'critical'
          ? 'border-red-200 bg-red-50/50 hover:border-red-300'
          : borrower.estimatedImpact === 'high'
          ? 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
          : 'border-zinc-100 bg-white hover:border-zinc-200'
      )}
      style={{ animationDelay: `${index * 100 + 200}ms`, animationFillMode: 'both' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      data-testid={`affected-borrower-${borrower.borrowerId}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="font-medium text-zinc-900 truncate">
              {borrower.borrowerName}
            </h5>
            <Badge variant={getSeverityVariant(borrower.estimatedImpact)} className="text-[10px]">
              {borrower.estimatedImpact}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 truncate">{borrower.facilityName}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Risk probability bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-zinc-600">Risk Probability</span>
          <span className={cn('font-medium', getSeverityColor(borrower.estimatedImpact))}>
            {riskLevel.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              borrower.estimatedImpact === 'critical'
                ? 'bg-red-500'
                : borrower.estimatedImpact === 'high'
                ? 'bg-amber-500'
                : borrower.estimatedImpact === 'medium'
                ? 'bg-yellow-500'
                : 'bg-green-500'
            )}
            style={{ width: `${riskLevel}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-zinc-500">Exposure</span>
          <p className="font-medium text-zinc-900">
            {formatExposure(borrower.exposure)}
          </p>
        </div>
        <div>
          <span className="text-zinc-500">Correlation</span>
          <p className={cn('font-medium', getCorrelationColor(borrower.correlationStrength))}>
            {(borrower.correlationStrength * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Shared factors */}
      {borrower.sharedFactors.length > 0 && (
        <div className="mt-2 pt-2 border-t border-zinc-100">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Correlation Factors
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {borrower.sharedFactors.slice(0, 3).map((factor, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px]">
                {factor.split(':')[0]}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Impact summary
const ImpactSummary = memo(function ImpactSummary({
  ripple,
}: {
  ripple: RippleEffect;
}) {
  return (
    <div
      className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-bottom-2 duration-500"
      data-testid="impact-summary"
    >
      <h5 className="text-sm font-medium text-purple-900 mb-3 flex items-center gap-2">
        <TrendingDown className="w-4 h-4" />
        Portfolio Impact Analysis
      </h5>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-purple-700">Affected Borrowers</p>
          <p className="text-2xl font-bold text-purple-900">
            {ripple.affectedBorrowers.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-purple-700">Exposure at Risk</p>
          <p className="text-2xl font-bold text-purple-900">
            {formatExposure(ripple.totalExposureAtRisk)}
          </p>
        </div>
        <div>
          <p className="text-xs text-purple-700">Portfolio Impact</p>
          <p className="text-2xl font-bold text-purple-900">
            {ripple.portfolioImpactPercentage.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
});

// Recommendations panel
const RecommendationsPanel = memo(function RecommendationsPanel({
  recommendations,
}: {
  recommendations: string[];
}) {
  if (recommendations.length === 0) return null;

  return (
    <div
      className="p-4 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
      data-testid="recommendations-panel"
    >
      <h5 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" />
        Recommended Actions
      </h5>
      <ul className="space-y-2">
        {recommendations.map((rec, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-sm text-blue-800 animate-in fade-in slide-in-from-left-2"
            style={{ animationDelay: `${idx * 100 + 400}ms`, animationFillMode: 'both' }}
          >
            <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export const RippleEffectView = memo(function RippleEffectView({
  ripple,
  onBorrowerClick,
}: RippleEffectViewProps) {
  const highRiskBorrowers = ripple.affectedBorrowers.filter(
    (b) => b.estimatedImpact === 'critical' || b.estimatedImpact === 'high'
  );
  const otherBorrowers = ripple.affectedBorrowers.filter(
    (b) => b.estimatedImpact !== 'critical' && b.estimatedImpact !== 'high'
  );

  return (
    <div className="space-y-4" data-testid="ripple-effect-view">
      {/* Source Event */}
      <div>
        <h4 className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-500" />
          Source Event
        </h4>
        <SourceEventCard event={ripple.sourceEvent} />
      </div>

      {/* Impact Summary */}
      <ImpactSummary ripple={ripple} />

      {/* Affected Borrowers */}
      {ripple.affectedBorrowers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            Correlated Borrowers at Risk
            <Badge variant="secondary" className="text-xs">
              {ripple.affectedBorrowers.length}
            </Badge>
          </h4>

          {/* High risk borrowers */}
          {highRiskBorrowers.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                High Priority
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {highRiskBorrowers.map((borrower, idx) => (
                  <AffectedBorrowerCard
                    key={borrower.borrowerId}
                    borrower={borrower}
                    index={idx}
                    onClick={() => onBorrowerClick?.(borrower.borrowerId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other borrowers */}
          {otherBorrowers.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                Monitor
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otherBorrowers.map((borrower, idx) => (
                  <AffectedBorrowerCard
                    key={borrower.borrowerId}
                    borrower={borrower}
                    index={idx + highRiskBorrowers.length}
                    onClick={() => onBorrowerClick?.(borrower.borrowerId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No affected borrowers */}
      {ripple.affectedBorrowers.length === 0 && (
        <div className="p-6 text-center bg-green-50 rounded-lg border border-green-100">
          <Network className="w-10 h-10 mx-auto mb-2 text-green-500" />
          <p className="text-sm text-green-800 font-medium">
            No correlated borrowers identified
          </p>
          <p className="text-xs text-green-600 mt-1">
            This event appears isolated within the portfolio
          </p>
        </div>
      )}

      {/* Recommendations */}
      <RecommendationsPanel recommendations={ripple.recommendations} />
    </div>
  );
});
