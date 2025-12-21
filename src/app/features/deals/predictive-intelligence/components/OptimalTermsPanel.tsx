'use client';

import React from 'react';
import {
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { OptimalTermStructure } from '../lib/types';

interface OptimalTermsPanelProps {
  optimalStructure: OptimalTermStructure;
  onApplyTerm?: (termKey: string, value: unknown) => void;
  onApplyAll?: () => void;
}

export function OptimalTermsPanel({
  optimalStructure,
  onApplyTerm,
  onApplyAll,
}: OptimalTermsPanelProps) {
  const getPercentileColor = (percentile: number) => {
    if (percentile <= 30) return 'text-red-600';
    if (percentile <= 45) return 'text-amber-600';
    if (percentile <= 55) return 'text-green-600';
    if (percentile <= 70) return 'text-blue-600';
    return 'text-purple-600';
  };

  const getPercentileLabel = (percentile: number) => {
    if (percentile <= 30) return 'Aggressive';
    if (percentile <= 45) return 'Favorable';
    if (percentile <= 55) return 'Market';
    if (percentile <= 70) return 'Conservative';
    return 'Very Conservative';
  };

  const getAcceptanceColor = (prob: number) => {
    if (prob >= 0.85) return 'bg-green-500';
    if (prob >= 0.7) return 'bg-blue-500';
    if (prob >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card data-testid="optimal-terms-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Optimal Term Structure
          </CardTitle>
          {onApplyAll && (
            <Button
              size="sm"
              onClick={onApplyAll}
              data-testid="apply-all-terms-btn"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Apply All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Overall Acceptance</span>
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {Math.round(optimalStructure.overallAcceptanceProb * 100)}%
            </p>
            <Progress
              value={optimalStructure.overallAcceptanceProb * 100}
              className="h-1.5 mt-1"
            />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Est. Close Time</span>
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {optimalStructure.closingTimeEstimate}
            </p>
            <p className="text-xs text-amber-700">days</p>
          </div>
        </div>

        {/* Term Recommendations */}
        <div className="space-y-2">
          {optimalStructure.terms.map((term) => (
            <div
              key={term.termKey}
              className="p-3 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 transition-colors"
              data-testid={`optimal-term-${term.termKey}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-sm text-zinc-900">
                      {term.termLabel}
                    </h5>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        getPercentileColor(term.marketPercentile)
                      )}
                    >
                      {getPercentileLabel(term.marketPercentile)}
                    </Badge>
                  </div>

                  {/* Suggested Value */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded bg-zinc-100 border border-zinc-200">
                      <p className="text-xs text-zinc-500">Suggested Value</p>
                      <p className="text-sm font-semibold text-zinc-900">
                        {String(term.suggestedValue)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          Acceptance Probability
                        </span>
                        <span className="text-sm font-medium text-zinc-900">
                          {Math.round(term.acceptanceProbability * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            getAcceptanceColor(term.acceptanceProbability)
                          )}
                          style={{
                            width: `${term.acceptanceProbability * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <p className="text-xs text-zinc-600 mt-2 line-clamp-2">
                    {term.reasoning}
                  </p>
                </div>

                {/* Apply Button */}
                {onApplyTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => onApplyTerm(term.termKey, term.suggestedValue)}
                    data-testid={`apply-term-${term.termKey}`}
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Market Position Note */}
        <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-zinc-700">
                Market Position Analysis
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                These recommendations are based on analysis of similar successful
                deals. Values closer to market median (50th percentile) typically
                have higher acceptance rates.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
