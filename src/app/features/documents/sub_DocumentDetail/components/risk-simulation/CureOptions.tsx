'use client';

import React, { memo } from 'react';
import { Wrench, Clock, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { RiskScenarioSimulationResult } from '@/lib/llm/risk-scenario-simulation';

interface CureOptionsProps {
  cureOptions: RiskScenarioSimulationResult['cureOptions'];
}

const cureTypeLabels: Record<string, string> = {
  equity_cure: 'Equity Cure',
  asset_sale: 'Asset Sale',
  cost_reduction: 'Cost Reduction',
  debt_prepayment: 'Debt Prepayment',
  waiver_request: 'Waiver Request',
  amendment: 'Amendment',
  refinancing: 'Refinancing',
};

const cureTypeColors: Record<string, string> = {
  equity_cure: 'bg-blue-100 text-blue-700',
  asset_sale: 'bg-purple-100 text-purple-700',
  cost_reduction: 'bg-green-100 text-green-700',
  debt_prepayment: 'bg-amber-100 text-amber-700',
  waiver_request: 'bg-orange-100 text-orange-700',
  amendment: 'bg-cyan-100 text-cyan-700',
  refinancing: 'bg-indigo-100 text-indigo-700',
};

const feasibilityColors: Record<string, string> = {
  easy: 'text-green-600',
  moderate: 'text-amber-600',
  difficult: 'text-orange-600',
  unlikely: 'text-red-600',
};

const feasibilityBadgeVariants: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  easy: 'success',
  moderate: 'warning',
  difficult: 'warning',
  unlikely: 'destructive',
};

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export const CureOptions = memo(function CureOptions({ cureOptions }: CureOptionsProps) {
  // Sort by success probability descending
  const sortedOptions = [...cureOptions].sort((a, b) => b.successProbability - a.successProbability);

  return (
    <div className="space-y-4" data-testid="cure-options">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">Cure Options</CardTitle>
          </div>
          <CardDescription>
            Available remediation strategies to address covenant breaches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedOptions.length > 0 ? (
            sortedOptions.map((cure) => (
              <div
                key={cure.cureId}
                className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                data-testid={`cure-option-${cure.cureId}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-xs', cureTypeColors[cure.cureType])}>
                      {cureTypeLabels[cure.cureType] || cure.cureType}
                    </Badge>
                    <Badge variant={feasibilityBadgeVariants[cure.feasibility]} className="text-xs capitalize">
                      {cure.feasibility}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    {cure.timeRequired}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-zinc-700 mb-3">{cure.description}</p>

                {/* Success Probability */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">Success Probability</span>
                    <span className={cn('font-medium', feasibilityColors[cure.feasibility])}>
                      {(cure.successProbability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={cure.successProbability * 100} className="h-2" />
                </div>

                {/* Cost */}
                {cure.estimatedCost && (
                  <div className="flex items-center gap-1 mb-3 text-sm">
                    <DollarSign className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-600">Estimated Cost:</span>
                    <span className="font-medium">{formatCurrency(cure.estimatedCost)}</span>
                  </div>
                )}

                {/* Preconditions */}
                {cure.preconditions.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-zinc-600 mb-1">Preconditions:</div>
                    <ul className="space-y-1">
                      {cure.preconditions.map((condition, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-zinc-500">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {cure.risks.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-zinc-600 mb-1">Risks:</div>
                    <ul className="space-y-1">
                      {cure.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-zinc-500">
                          <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-zinc-500">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No cure options identified for this scenario</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
