'use client';

import React, { useState } from 'react';
import {
  Compass,
  ChevronRight,
  Clock,
  TrendingUp,
  CheckCircle2,
  Star,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NegotiationStrategy } from '../lib/types';

interface StrategiesPanelProps {
  strategies: NegotiationStrategy[];
  onApplyStrategy?: (strategyId: string) => void;
}

export function StrategiesPanel({
  strategies,
  onApplyStrategy,
}: StrategiesPanelProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(
    strategies[0]?.id || null
  );

  const getApplicabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    return 'text-zinc-600';
  };

  const getApplicabilityBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    return 'bg-zinc-50 border-zinc-200';
  };

  const selectedStrategyData = strategies.find((s) => s.id === selectedStrategy);

  return (
    <Card data-testid="strategies-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-500" />
          Recommended Strategies
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Strategy List */}
          <div className="w-1/3 space-y-2">
            {strategies.map((strategy, index) => (
              <button
                key={strategy.id}
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all duration-200',
                  selectedStrategy === strategy.id
                    ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                )}
                onClick={() => setSelectedStrategy(strategy.id)}
                data-testid={`strategy-option-${strategy.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                      <span className="font-medium text-sm text-zinc-900">
                        {strategy.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          getApplicabilityBg(strategy.applicability),
                          getApplicabilityColor(strategy.applicability)
                        )}
                      >
                        {strategy.applicability}% fit
                      </Badge>
                    </div>
                  </div>
                  {selectedStrategy === strategy.id && (
                    <ChevronRight className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Strategy Details */}
          <div className="flex-1 border rounded-lg p-4 bg-zinc-50">
            {selectedStrategyData ? (
              <div className="space-y-4" data-testid="strategy-details">
                {/* Header */}
                <div>
                  <h4 className="font-semibold text-zinc-900">
                    {selectedStrategyData.name}
                  </h4>
                  <p className="text-sm text-zinc-600 mt-1">
                    {selectedStrategyData.description}
                  </p>
                </div>

                {/* Expected Outcomes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white border border-zinc-200">
                    <div className="flex items-center gap-1 text-zinc-400 mb-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">Time Impact</span>
                    </div>
                    <p
                      className={cn(
                        'text-lg font-semibold',
                        selectedStrategyData.expectedOutcome.closingTimeDelta < 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {selectedStrategyData.expectedOutcome.closingTimeDelta > 0
                        ? '+'
                        : ''}
                      {selectedStrategyData.expectedOutcome.closingTimeDelta} days
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-zinc-200">
                    <div className="flex items-center gap-1 text-zinc-400 mb-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs">Success Impact</span>
                    </div>
                    <p
                      className={cn(
                        'text-lg font-semibold',
                        selectedStrategyData.expectedOutcome.successProbabilityDelta > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {selectedStrategyData.expectedOutcome.successProbabilityDelta > 0
                        ? '+'
                        : ''}
                      {Math.round(
                        selectedStrategyData.expectedOutcome.successProbabilityDelta * 100
                      )}
                      %
                    </p>
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <h5 className="text-xs font-medium text-zinc-500 mb-2">
                    Implementation Steps
                  </h5>
                  <ul className="space-y-2">
                    {selectedStrategyData.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-zinc-700"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Supporting Evidence */}
                <div className="p-3 rounded-lg bg-white border border-zinc-200">
                  <div className="flex items-center gap-1 text-zinc-400 mb-2">
                    <BarChart3 className="w-3 h-3" />
                    <span className="text-xs font-medium">Supporting Evidence</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">
                      Based on {selectedStrategyData.supportingEvidence.similarDeals} similar
                      deals
                    </span>
                    <Badge variant="outline" className="text-green-600 bg-green-50">
                      {Math.round(
                        selectedStrategyData.supportingEvidence.successRate * 100
                      )}
                      % success rate
                    </Badge>
                  </div>
                </div>

                {/* Apply Button */}
                {onApplyStrategy && (
                  <Button
                    className="w-full"
                    onClick={() => onApplyStrategy(selectedStrategyData.id)}
                    data-testid="apply-strategy-btn"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Apply This Strategy
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                Select a strategy to view details
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
