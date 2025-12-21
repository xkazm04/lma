'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PortfolioRiskScore } from '../lib/types';
import { TERM_CATEGORY_CONFIG } from '../lib/types';

interface RiskBreakdownChartProps {
  riskScore: PortfolioRiskScore;
}

const getRiskColor = (score: number) => {
  if (score <= 30) return { bar: 'bg-green-500', text: 'text-green-700', label: 'Low' };
  if (score <= 60) return { bar: 'bg-amber-500', text: 'text-amber-700', label: 'Moderate' };
  return { bar: 'bg-red-500', text: 'text-red-700', label: 'High' };
};

export const RiskBreakdownChart = memo(function RiskBreakdownChart({
  riskScore,
}: RiskBreakdownChartProps) {
  const overallColor = getRiskColor(riskScore.overallScore);

  return (
    <Card data-testid="risk-breakdown-chart">
      <CardHeader>
        <CardTitle className="text-lg">Risk Score Breakdown</CardTitle>
        <CardDescription>
          Portfolio risk assessment by category
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">Overall Risk Score</span>
            <span className={cn('text-lg font-bold', overallColor.text)}>
              {riskScore.overallScore}/100 ({overallColor.label})
            </span>
          </div>
          <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', overallColor.bar)}
              style={{ width: `${riskScore.overallScore}%` }}
            />
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Term Consistency</p>
            <p className={cn('text-xl font-bold mt-1', getRiskColor(riskScore.termConsistencyScore).text)}>
              {riskScore.termConsistencyScore}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Market Alignment</p>
            <p className={cn('text-xl font-bold mt-1', getRiskColor(riskScore.marketAlignmentScore).text)}>
              {riskScore.marketAlignmentScore}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Data Coverage</p>
            <p className={cn('text-xl font-bold mt-1', getRiskColor(riskScore.coverageScore).text)}>
              {riskScore.coverageScore}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4 pt-4 border-t border-zinc-100">
          <p className="text-sm font-medium text-zinc-700">By Category</p>
          {riskScore.breakdown.map((item) => {
            const categoryConfig = TERM_CATEGORY_CONFIG[item.category];
            const riskColor = getRiskColor(item.score);

            return (
              <div key={item.category} className="space-y-2" data-testid={`risk-category-${item.category}`}>
                <div className="flex items-center justify-between">
                  <span className={cn('text-sm', categoryConfig.color)}>
                    {categoryConfig.label}
                  </span>
                  <span className={cn('text-sm font-medium', riskColor.text)}>
                    {item.score}/100
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', riskColor.bar)}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                {item.contributingFactors.length > 0 && (
                  <ul className="text-xs text-zinc-500 ml-2 space-y-0.5">
                    {item.contributingFactors.map((factor, index) => (
                      <li key={index}>• {factor}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
