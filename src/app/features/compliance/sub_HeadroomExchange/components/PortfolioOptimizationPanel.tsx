'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import type { PortfolioOptimizationAnalysis } from '../lib/types';

interface PortfolioOptimizationPanelProps {
  analysis: PortfolioOptimizationAnalysis;
}

export const PortfolioOptimizationPanel = memo(function PortfolioOptimizationPanel({
  analysis,
}: PortfolioOptimizationPanelProps) {
  const getOpportunityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-2 border-amber-200 bg-amber-50/30" data-testid="portfolio-optimization-panel">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          <CardTitle className="text-amber-900">Portfolio Optimization Opportunity</CardTitle>
        </div>
        <CardDescription>AI-identified efficiency gains through headroom trading</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-zinc-500 mb-1">Optimization Score</p>
            <p className={`text-2xl font-bold ${getOpportunityColor(analysis.optimization_opportunity_score)}`}>
              {analysis.optimization_opportunity_score}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs text-zinc-500 mb-1">Value Created</p>
            <p className="text-2xl font-bold text-green-600">
              ${(analysis.estimated_total_value_created / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-zinc-500 mb-1">Breaches Prevented</p>
            <p className="text-2xl font-bold text-blue-600">{analysis.potential_breach_prevention}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-zinc-500 mb-1">Risk Reduction</p>
            <p className="text-2xl font-bold text-purple-600">
              {analysis.risk_reduction_percentage.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Breach probability visualization */}
        <div className="bg-white rounded-lg p-4 border border-zinc-200">
          <h4 className="font-semibold text-zinc-900 mb-3">Portfolio Breach Probability</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-600">Current State</span>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">
                    {analysis.portfolio_breach_probability_current.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress value={analysis.portfolio_breach_probability_current} className="h-2 bg-red-100">
                <div className="h-full bg-red-500 transition-all" />
              </Progress>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-600">After Optimization</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-600">
                    {analysis.portfolio_breach_probability_optimized.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress value={analysis.portfolio_breach_probability_optimized} className="h-2 bg-green-100">
                <div className="h-full bg-green-500 transition-all" />
              </Progress>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg p-4 border border-zinc-200">
          <p className="text-sm text-zinc-700 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Top priorities */}
        <div className="bg-white rounded-lg p-4 border border-zinc-200">
          <h4 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Top Priorities
          </h4>
          <ul className="space-y-2">
            {analysis.top_priorities.map((priority, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-zinc-700">
                <Badge variant="secondary" className="mt-0.5 text-xs">
                  {idx + 1}
                </Badge>
                <span>{priority}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Headroom allocation */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-700 font-medium mb-1">Excess Headroom</p>
            <p className="text-xl font-bold text-green-800">{analysis.total_excess_headroom.toFixed(0)}%</p>
            <p className="text-xs text-green-600 mt-1">Available to trade</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700 font-medium mb-1">Deficit Headroom</p>
            <p className="text-xl font-bold text-red-800">{Math.abs(analysis.total_deficit_headroom).toFixed(0)}%</p>
            <p className="text-xs text-red-600 mt-1">Needs support</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
