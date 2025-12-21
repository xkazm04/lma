'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  BreachPrediction,
  PredictionContributingFactor,
  QuarterlyProjection,
} from '../../lib/types';
import { getPredictionRiskColor, getPredictionRiskBorderColor } from '../../lib/types';

interface BreachPredictionPanelProps {
  prediction: BreachPrediction;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showCompact?: boolean;
}

function formatProbability(probability: number): string {
  return `${Math.round(probability)}%`;
}

function getRiskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
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

function getImpactColor(impact: 'positive' | 'negative' | 'neutral'): string {
  switch (impact) {
    case 'positive':
      return 'text-green-700 bg-green-50';
    case 'negative':
      return 'text-red-700 bg-red-50';
    case 'neutral':
      return 'text-zinc-600 bg-zinc-50';
  }
}

const ContributingFactorItem = memo(function ContributingFactorItem({
  factor,
}: {
  factor: PredictionContributingFactor;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-md border',
        getImpactColor(factor.impact)
      )}
      data-testid={`contributing-factor-${factor.factor.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="mt-0.5">{getImpactIcon(factor.impact)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{factor.factor}</span>
          <span className="text-xs opacity-75">{factor.weight}% weight</span>
        </div>
        <p className="text-xs mt-0.5 opacity-90">{factor.description}</p>
      </div>
    </div>
  );
});

const QuarterlyProjectionItem = memo(function QuarterlyProjectionItem({
  projection,
  threshold,
  thresholdType,
}: {
  projection: QuarterlyProjection;
  threshold: number;
  thresholdType: 'maximum' | 'minimum';
}) {
  const isAtRisk =
    thresholdType === 'maximum'
      ? projection.projected_ratio >= threshold * 0.9
      : projection.projected_ratio <= threshold * 1.1;

  return (
    <div
      className={cn(
        'p-2 rounded-md border',
        isAtRisk ? 'border-amber-200 bg-amber-50/50' : 'border-zinc-200 bg-zinc-50/50'
      )}
      data-testid={`quarterly-projection-${projection.quarter.replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-zinc-900">{projection.quarter}</span>
        <Badge
          className={cn(
            'text-xs',
            projection.breach_probability >= 50
              ? 'bg-red-100 text-red-700'
              : projection.breach_probability >= 25
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
          )}
        >
          {formatProbability(projection.breach_probability)} breach risk
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-zinc-600">
        <span>Projected: {projection.projected_ratio.toFixed(2)}x</span>
        <span>Confidence: {Math.round(projection.confidence)}%</span>
      </div>
    </div>
  );
});

export const BreachPredictionPanel = memo(function BreachPredictionPanel({
  prediction,
  isExpanded = false,
  onToggleExpand,
  showCompact = true,
}: BreachPredictionPanelProps) {
  const riskColor = getPredictionRiskColor(prediction.overall_risk_level);
  const borderColor = getPredictionRiskBorderColor(prediction.overall_risk_level);

  // Compact view for inline display in CovenantCard
  if (showCompact && !isExpanded) {
    return (
      <div
        className={cn(
          'mt-4 p-3 rounded-lg border',
          borderColor,
          prediction.overall_risk_level === 'critical' && 'bg-red-50/50',
          prediction.overall_risk_level === 'high' && 'bg-orange-50/50',
          prediction.overall_risk_level === 'medium' && 'bg-amber-50/50',
          prediction.overall_risk_level === 'low' && 'bg-green-50/50'
        )}
        data-testid="breach-prediction-panel-compact"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-zinc-900">AI Breach Prediction</span>
            <Badge className={cn('text-xs', riskColor)}>
              {getRiskLevelLabel(prediction.overall_risk_level)}
            </Badge>
          </div>
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-7 px-2"
              data-testid="prediction-expand-btn"
            >
              <span className="text-xs mr-1">Details</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <p className="text-xs text-zinc-500">2Q Breach Risk</p>
            <div className="flex items-center gap-2">
              <Progress
                value={prediction.breach_probability_2q}
                className="h-2 flex-1"
              />
              <span className="text-sm font-semibold text-zinc-900">
                {formatProbability(prediction.breach_probability_2q)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500">3Q Breach Risk</p>
            <div className="flex items-center gap-2">
              <Progress
                value={prediction.breach_probability_3q}
                className="h-2 flex-1"
              />
              <span className="text-sm font-semibold text-zinc-900">
                {formatProbability(prediction.breach_probability_3q)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Confidence</p>
            <span className="text-sm font-semibold text-zinc-900">
              {Math.round(prediction.confidence_score)}%
            </span>
          </div>
        </div>

        {prediction.projected_breach_quarter && (
          <div className="flex items-center gap-2 mt-3 text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Projected breach: <strong>{prediction.projected_breach_quarter}</strong>
            </span>
          </div>
        )}

        <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{prediction.summary}</p>
      </div>
    );
  }

  // Expanded view with full details
  return (
    <Card
      className={cn('mt-4', borderColor)}
      data-testid="breach-prediction-panel-expanded"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Breach Prediction
            <Badge className={cn('ml-2', riskColor)}>
              {getRiskLevelLabel(prediction.overall_risk_level)}
            </Badge>
          </CardTitle>
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              data-testid="prediction-collapse-btn"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Calendar className="w-3 h-3" />
          <span>Generated {new Date(prediction.prediction_date).toLocaleDateString()}</span>
          <span className="mx-1">|</span>
          <span>Confidence: {Math.round(prediction.confidence_score)}%</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Summary */}
        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
            <p className="text-sm text-zinc-700">{prediction.summary}</p>
          </div>
        </div>

        {/* Breach Probability Meters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg border border-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700">2 Quarter Risk</span>
              <span
                className={cn(
                  'text-lg font-bold',
                  prediction.breach_probability_2q >= 75
                    ? 'text-red-600'
                    : prediction.breach_probability_2q >= 50
                      ? 'text-orange-600'
                      : prediction.breach_probability_2q >= 25
                        ? 'text-amber-600'
                        : 'text-green-600'
                )}
              >
                {formatProbability(prediction.breach_probability_2q)}
              </span>
            </div>
            <Progress
              value={prediction.breach_probability_2q}
              className="h-3"
            />
          </div>
          <div className="p-3 bg-white rounded-lg border border-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700">3 Quarter Risk</span>
              <span
                className={cn(
                  'text-lg font-bold',
                  prediction.breach_probability_3q >= 75
                    ? 'text-red-600'
                    : prediction.breach_probability_3q >= 50
                      ? 'text-orange-600'
                      : prediction.breach_probability_3q >= 25
                        ? 'text-amber-600'
                        : 'text-green-600'
                )}
              >
                {formatProbability(prediction.breach_probability_3q)}
              </span>
            </div>
            <Progress
              value={prediction.breach_probability_3q}
              className="h-3"
            />
          </div>
        </div>

        {/* Projected Breach Warning */}
        {prediction.projected_breach_quarter && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Breach Projected: {prediction.projected_breach_quarter}
              </p>
              <p className="text-xs text-red-600">
                Based on current trajectory and historical patterns
              </p>
            </div>
          </div>
        )}

        {/* Quarterly Projections */}
        {prediction.quarterly_projections.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 mb-2">Quarterly Projections</h4>
            <div className="space-y-2">
              {prediction.quarterly_projections.map((proj) => (
                <QuarterlyProjectionItem
                  key={proj.quarter}
                  projection={proj}
                  threshold={0} // This would come from parent
                  thresholdType="maximum"
                />
              ))}
            </div>
          </div>
        )}

        {/* Contributing Factors */}
        {prediction.contributing_factors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 mb-2">Contributing Factors</h4>
            <div className="space-y-2">
              {prediction.contributing_factors.map((factor, idx) => (
                <ContributingFactorItem key={idx} factor={factor} />
              ))}
            </div>
          </div>
        )}

        {/* Seasonal Patterns */}
        {prediction.seasonal_patterns.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 mb-2">Seasonal Patterns</h4>
            <div className="flex flex-wrap gap-2">
              {prediction.seasonal_patterns.map((pattern) => (
                <div
                  key={pattern.quarter}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
                    getImpactColor(pattern.typical_impact)
                  )}
                  title={pattern.description}
                  data-testid={`seasonal-pattern-${pattern.quarter}`}
                >
                  {getImpactIcon(pattern.typical_impact)}
                  <span className="font-medium">{pattern.quarter}</span>
                  <span className="opacity-75">- {pattern.typical_impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {prediction.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {prediction.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-zinc-700"
                  data-testid={`recommendation-${idx}`}
                >
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default BreachPredictionPanel;
