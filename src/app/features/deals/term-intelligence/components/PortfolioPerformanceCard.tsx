'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Target, Clock, Briefcase, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PortfolioPerformance } from '../lib/types';
import { formatCurrency, getScoreColor, getScoreBgColor } from '../lib/mock-data';

interface PortfolioPerformanceCardProps {
  performance: PortfolioPerformance;
}

export function PortfolioPerformanceCard({ performance }: PortfolioPerformanceCardProps) {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white" data-testid="portfolio-performance-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Portfolio Negotiation Performance
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-sm px-3 py-1',
              performance.overallSuccessRate >= 70
                ? 'bg-green-50 text-green-700 border-green-200'
                : performance.overallSuccessRate >= 50
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
            )}
            data-testid="success-rate-badge"
          >
            {performance.overallSuccessRate}% Success Rate
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-zinc-100">
            <div className="flex items-center justify-center mb-2">
              <Briefcase className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{performance.totalDeals}</p>
            <p className="text-xs text-zinc-500">Total Deals</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-zinc-100">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(performance.totalVolume, true)}</p>
            <p className="text-xs text-zinc-500">Total Volume</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-zinc-100">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{performance.avgNegotiationDays.toFixed(1)}</p>
            <p className="text-xs text-zinc-500">Avg Days to Close</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-zinc-100">
            <div className="flex items-center justify-center mb-2">
              {performance.avgMarginDelta < 0 ? (
                <TrendingDown className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingUp className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className={cn(
              'text-2xl font-bold',
              performance.avgMarginDelta < 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {performance.avgMarginDelta > 0 ? '+' : ''}{(performance.avgMarginDelta * 100).toFixed(0)}bps
            </p>
            <p className="text-xs text-zinc-500">Avg Margin Delta</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-zinc-100">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <p className={cn(
              'text-2xl font-bold',
              getScoreColor(performance.overallSuccessRate)
            )}>
              {performance.overallSuccessRate}%
            </p>
            <p className="text-xs text-zinc-500">Success Rate</p>
          </div>
        </div>

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Top Negotiation Strengths
            </h4>
            <div className="space-y-3">
              {performance.topStrengths.map((strength, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-green-900">{strength.area}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        strength.impact === 'high'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : strength.impact === 'medium'
                          ? 'bg-green-50 text-green-600 border-green-100'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-100'
                      )}
                    >
                      {strength.impact} impact
                    </Badge>
                  </div>
                  <p className="text-xs text-green-700">{strength.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-green-800 font-semibold">
                      You: {typeof strength.metric === 'number' && strength.metric < 0 ? '' : ''}
                      {typeof strength.metric === 'number'
                        ? strength.metric < 1
                          ? `${(strength.metric * 100).toFixed(0)}bps`
                          : strength.metric.toFixed(1)
                        : strength.metric}
                    </span>
                    <span className="text-green-500">vs</span>
                    <span className="text-green-600">
                      Market: {typeof strength.benchmark === 'number'
                        ? strength.benchmark < 1
                          ? `${(strength.benchmark * 100).toFixed(0)}bps`
                          : strength.benchmark.toFixed(1)
                        : strength.benchmark}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Areas for Improvement
            </h4>
            <div className="space-y-3">
              {performance.areasForImprovement.map((area, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-amber-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-amber-900">{area.area}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        area.impact === 'high'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : area.impact === 'medium'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-100'
                      )}
                    >
                      {area.impact} impact
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-700">{area.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-amber-800 font-semibold">
                      You: {typeof area.metric === 'number'
                        ? area.metric < 1
                          ? `${(area.metric * 100).toFixed(0)}%`
                          : area.metric.toFixed(1)
                        : area.metric}
                    </span>
                    <span className="text-amber-500">vs</span>
                    <span className="text-amber-600">
                      Market: {typeof area.benchmark === 'number'
                        ? area.benchmark < 1
                          ? `${(area.benchmark * 100).toFixed(0)}%`
                          : area.benchmark.toFixed(1)
                        : area.benchmark}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
