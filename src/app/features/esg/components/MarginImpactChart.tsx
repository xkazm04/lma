'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import type { MarginImpactPrediction, PredictionConfidence } from '../lib/types';
import { formatCurrency } from '../lib/formatters';

interface MarginImpactChartProps {
  marginImpact: MarginImpactPrediction;
  showBreakdown?: boolean;
}

const confidenceColors: Record<PredictionConfidence, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-700',
};

export const MarginImpactChart = memo(function MarginImpactChart({
  marginImpact,
  showBreakdown = true,
}: MarginImpactChartProps) {
  const isStepUp = marginImpact.predicted_adjustment_bps > 0;
  const isStepDown = marginImpact.predicted_adjustment_bps < 0;
  const noChange = marginImpact.predicted_adjustment_bps === 0;

  const adjustmentPercentage = Math.abs(marginImpact.predicted_adjustment_bps) / marginImpact.max_adjustment_bps * 100;

  const getStatusBadge = () => {
    if (noChange) {
      return (
        <Badge variant="outline" className="bg-zinc-100 text-zinc-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          No Change
        </Badge>
      );
    }
    if (isStepUp) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
          <TrendingUp className="w-3 h-3 mr-1" />
          Step-Up Risk
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
        <TrendingDown className="w-3 h-3 mr-1" />
        Step-Down
      </Badge>
    );
  };

  return (
    <Card
      className={`transition-all duration-300 ${
        isStepUp ? 'border-red-200 bg-red-50/30' :
        isStepDown ? 'border-green-200 bg-green-50/30' :
        'border-zinc-200'
      }`}
      data-testid="margin-impact-chart"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className={`w-5 h-5 ${
              isStepUp ? 'text-red-600' : isStepDown ? 'text-green-600' : 'text-zinc-600'
            }`} />
            <div>
              <CardTitle className="text-lg">Margin Impact Forecast</CardTitle>
              <CardDescription>Predicted margin adjustment based on KPI performance</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Badge variant="outline" className={confidenceColors[marginImpact.confidence]}>
              {marginImpact.confidence} confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Margin Visualization */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            {/* Current Margin */}
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Current Margin</p>
              <p className="text-2xl font-bold text-zinc-900">
                {marginImpact.current_margin_bps}
                <span className="text-sm font-normal text-zinc-500">bps</span>
              </p>
            </div>

            {/* Arrow with adjustment */}
            <div className="flex flex-col items-center px-4">
              <div className={`flex items-center gap-1 text-sm font-medium ${
                isStepUp ? 'text-red-600' : isStepDown ? 'text-green-600' : 'text-zinc-500'
              }`}>
                {isStepUp ? '+' : ''}{marginImpact.predicted_adjustment_bps}bps
              </div>
              <ArrowRight className={`w-8 h-8 ${
                isStepUp ? 'text-red-400' : isStepDown ? 'text-green-400' : 'text-zinc-300'
              }`} />
            </div>

            {/* Predicted Margin */}
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Predicted Margin</p>
              <p className={`text-2xl font-bold ${
                isStepUp ? 'text-red-600' : isStepDown ? 'text-green-600' : 'text-zinc-900'
              }`}>
                {marginImpact.predicted_margin_bps}
                <span className="text-sm font-normal text-zinc-500">bps</span>
              </p>
            </div>
          </div>

          {/* Progress bar showing adjustment relative to max */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Base: {marginImpact.base_margin_bps}bps</span>
              <span>Max adjustment: ±{marginImpact.max_adjustment_bps}bps</span>
            </div>
            <div className="relative h-6 bg-zinc-100 rounded-full overflow-hidden">
              {/* Base marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-zinc-400 z-10"
                style={{ left: '50%' }}
              />
              {/* Adjustment bar */}
              {!noChange && (
                <div
                  className={`absolute top-0 bottom-0 ${
                    isStepUp ? 'bg-red-400' : 'bg-green-400'
                  } transition-all duration-500`}
                  style={{
                    left: isStepUp ? '50%' : `${50 - adjustmentPercentage / 2}%`,
                    width: `${adjustmentPercentage / 2}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Financial Impact */}
        <div className={`p-4 rounded-lg ${
          isStepUp ? 'bg-red-50 border border-red-100' :
          isStepDown ? 'bg-green-50 border border-green-100' :
          'bg-zinc-50 border border-zinc-100'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className={`w-5 h-5 ${
              isStepUp ? 'text-red-600' : isStepDown ? 'text-green-600' : 'text-zinc-600'
            }`} />
            <span className="font-medium text-zinc-900">Financial Impact</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Annual Interest Change</p>
              <p className={`text-lg font-bold ${
                marginImpact.financial_impact.annual_interest_cost_change > 0 ? 'text-red-600' :
                marginImpact.financial_impact.annual_interest_cost_change < 0 ? 'text-green-600' :
                'text-zinc-700'
              }`}>
                {marginImpact.financial_impact.annual_interest_cost_change > 0 ? '+' : ''}
                {formatCurrency(marginImpact.financial_impact.annual_interest_cost_change)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Outstanding Amount</p>
              <p className="text-lg font-bold text-zinc-700">
                {formatCurrency(marginImpact.financial_impact.outstanding_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Percentage Change</p>
              <p className={`text-lg font-bold ${
                marginImpact.financial_impact.percentage_change > 0 ? 'text-red-600' :
                marginImpact.financial_impact.percentage_change < 0 ? 'text-green-600' :
                'text-zinc-700'
              }`}>
                {marginImpact.financial_impact.percentage_change > 0 ? '+' : ''}
                {marginImpact.financial_impact.percentage_change.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* KPI Breakdown */}
        {showBreakdown && marginImpact.contributing_kpis.length > 0 && (
          <div className="space-y-3">
            <p className="font-medium text-zinc-900">Contributing KPIs</p>
            <div className="space-y-2">
              {marginImpact.contributing_kpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-100"
                  data-testid={`kpi-contribution-${idx}`}
                >
                  <div className="flex items-center gap-2">
                    {kpi.will_miss ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-sm font-medium text-zinc-700">{kpi.kpi_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={kpi.will_miss ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}
                    >
                      {kpi.will_miss ? 'At Risk' : 'On Track'}
                    </Badge>
                    <span className={`text-sm font-bold ${
                      kpi.contribution_bps > 0 ? 'text-red-600' :
                      kpi.contribution_bps < 0 ? 'text-green-600' :
                      'text-zinc-500'
                    }`}>
                      {kpi.contribution_bps > 0 ? '+' : ''}{kpi.contribution_bps}bps
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Effective Date */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <span className="text-sm text-zinc-500">Effective Date</span>
          <span className="text-sm font-medium text-zinc-900">
            {new Date(marginImpact.effective_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});
