'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Activity,
  FileText,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutopilotBreachPrediction, ContributingSignal } from '../lib/types';
import { getPredictionRiskColor, getPredictionRiskBorderColor } from '../../lib/types';
import { getSignalSourceLabel } from '../lib/types';
import { getSignalSourceColor } from '@/lib/utils';

interface PredictionCardProps {
  prediction: AutopilotBreachPrediction;
  onViewDetails?: (id: string) => void;
  onGenerateRemediation?: (id: string) => void;
}

function formatProbability(probability: number): string {
  return `${Math.round(probability)}%`;
}

function getRiskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical',
  };
  return labels[level] || level;
}

function getImpactIcon(impact: 'positive' | 'negative' | 'neutral') {
  switch (impact) {
    case 'positive':
      return <TrendingUp className="w-3 h-3 text-green-600" />;
    case 'negative':
      return <TrendingDown className="w-3 h-3 text-red-600" />;
    case 'neutral':
      return <Minus className="w-3 h-3 text-zinc-500" />;
  }
}

const SignalItem = memo(function SignalItem({
  signal,
}: {
  signal: ContributingSignal;
}) {
  return (
    <div
      className="flex items-start gap-2 p-2 rounded-md bg-zinc-50 border border-zinc-200"
      data-testid={`signal-${signal.signal_source}`}
    >
      <div className="mt-0.5">{getImpactIcon(signal.impact)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn('text-xs', getSignalSourceColor(signal.signal_source))}>
            {getSignalSourceLabel(signal.signal_source)}
          </Badge>
          <span className="text-xs text-zinc-500">{signal.weight}% weight</span>
        </div>
        <p className="text-xs text-zinc-700 mt-1 line-clamp-2">
          {signal.signal_summary}
        </p>
      </div>
    </div>
  );
});

export const PredictionCard = memo(function PredictionCard({
  prediction,
  onViewDetails,
  onGenerateRemediation,
}: PredictionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const riskColor = getPredictionRiskColor(prediction.overall_risk_level);
  const borderColor = getPredictionRiskBorderColor(prediction.overall_risk_level);

  const isCritical =
    prediction.overall_risk_level === 'critical' ||
    prediction.overall_risk_level === 'high';

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        borderColor,
        isCritical && 'bg-red-50/30'
      )}
      data-testid={`prediction-card-${prediction.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Brain className="w-4 h-4 text-purple-600 shrink-0" />
              <CardTitle className="text-base truncate">
                {prediction.covenant_name}
              </CardTitle>
              <Badge className={cn('shrink-0', riskColor)}>
                {getRiskLevelLabel(prediction.overall_risk_level)}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              {prediction.facility_name} | {prediction.borrower_name}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0"
            data-testid="prediction-expand-btn"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Breach Probability Timeline */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">6 Month Risk</p>
            <div className="flex items-center gap-2">
              <Progress
                value={prediction.breach_probability_6m}
                className="h-2 flex-1"
              />
              <span
                className={cn(
                  'text-sm font-bold',
                  prediction.breach_probability_6m >= 75
                    ? 'text-red-600'
                    : prediction.breach_probability_6m >= 50
                      ? 'text-orange-600'
                      : prediction.breach_probability_6m >= 25
                        ? 'text-amber-600'
                        : 'text-green-600'
                )}
              >
                {formatProbability(prediction.breach_probability_6m)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">9 Month Risk</p>
            <div className="flex items-center gap-2">
              <Progress
                value={prediction.breach_probability_9m}
                className="h-2 flex-1"
              />
              <span
                className={cn(
                  'text-sm font-bold',
                  prediction.breach_probability_9m >= 75
                    ? 'text-red-600'
                    : prediction.breach_probability_9m >= 50
                      ? 'text-orange-600'
                      : prediction.breach_probability_9m >= 25
                        ? 'text-amber-600'
                        : 'text-green-600'
                )}
              >
                {formatProbability(prediction.breach_probability_9m)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">12 Month Risk</p>
            <div className="flex items-center gap-2">
              <Progress
                value={prediction.breach_probability_12m}
                className="h-2 flex-1"
              />
              <span
                className={cn(
                  'text-sm font-bold',
                  prediction.breach_probability_12m >= 75
                    ? 'text-red-600'
                    : prediction.breach_probability_12m >= 50
                      ? 'text-orange-600'
                      : prediction.breach_probability_12m >= 25
                        ? 'text-amber-600'
                        : 'text-green-600'
                )}
              >
                {formatProbability(prediction.breach_probability_12m)}
              </span>
            </div>
          </div>
        </div>

        {/* Projected Breach Warning */}
        {prediction.projected_breach_quarter && (
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border',
              isCritical
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            )}
          >
            <AlertTriangle
              className={cn(
                'w-5 h-5 shrink-0',
                isCritical ? 'text-red-600' : 'text-amber-600'
              )}
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium',
                  isCritical ? 'text-red-800' : 'text-amber-800'
                )}
              >
                Projected Breach: {prediction.projected_breach_quarter}
              </p>
              {prediction.days_until_projected_breach && (
                <p
                  className={cn(
                    'text-xs',
                    isCritical ? 'text-red-600' : 'text-amber-600'
                  )}
                >
                  {prediction.days_until_projected_breach} days until projected breach
                </p>
              )}
            </div>
          </div>
        )}

        {/* Key Stats Row */}
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>Confidence: {Math.round(prediction.confidence_score)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>
              Signal Correlation: {Math.round(prediction.signal_correlation_score * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(prediction.generated_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-zinc-700 line-clamp-2">{prediction.summary}</p>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-zinc-200 animate-in fade-in slide-in-from-top-2">
            {/* Contributing Signals */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-2">
                Contributing Signals ({prediction.contributing_signals.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {prediction.contributing_signals.slice(0, 4).map((signal, idx) => (
                  <SignalItem key={idx} signal={signal} />
                ))}
              </div>
            </div>

            {/* Leading Indicators */}
            {prediction.leading_indicators.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 mb-2">
                  Leading Indicators
                </h4>
                <div className="flex flex-wrap gap-2">
                  {prediction.leading_indicators.map((indicator, idx) => (
                    <Badge
                      key={idx}
                      className={cn(
                        'text-xs',
                        indicator.status === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : indicator.status === 'warning'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                      )}
                    >
                      {indicator.indicator_name}: {indicator.status}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Key Risks */}
            {prediction.key_risks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 mb-2">
                  Key Risks
                </h4>
                <ul className="space-y-1">
                  {prediction.key_risks.slice(0, 4).map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-zinc-700">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Immediate Actions */}
            {prediction.immediate_actions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 mb-2">
                  Recommended Actions
                </h4>
                <ul className="space-y-1">
                  {prediction.immediate_actions.slice(0, 4).map((action, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-zinc-700"
                    >
                      <Clock className="w-3 h-3 text-purple-600 mt-0.5 shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(prediction.id)}
            className="flex-1"
            data-testid="view-details-btn"
          >
            <FileText className="w-4 h-4 mr-1" />
            View Details
          </Button>
          {isCritical && (
            <Button
              size="sm"
              onClick={() => onGenerateRemediation?.(prediction.id)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              data-testid="generate-remediation-btn"
            >
              <Brain className="w-4 h-4 mr-1" />
              Get Remediation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default PredictionCard;
