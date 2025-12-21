'use client';

import React, { memo } from 'react';
import { GitBranch, ArrowRight, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskScenarioSimulationResult } from '@/lib/llm/risk-scenario-simulation';

interface CascadingEffectsProps {
  cascadingEffects: RiskScenarioSimulationResult['cascadingEffects'];
  mandatoryPrepaymentTriggers: RiskScenarioSimulationResult['mandatoryPrepaymentTriggers'];
  totalPotentialPrepayment: number;
}

const effectTypeLabels: Record<string, string> = {
  mandatory_prepayment: 'Mandatory Prepayment',
  interest_rate_increase: 'Interest Rate Increase',
  collateral_requirement: 'Collateral Requirement',
  reporting_frequency: 'Increased Reporting',
  dividend_restriction: 'Dividend Restriction',
  cross_default: 'Cross Default',
  acceleration: 'Acceleration',
};

const effectTypeColors: Record<string, string> = {
  mandatory_prepayment: 'bg-red-100 text-red-700 border-red-200',
  interest_rate_increase: 'bg-orange-100 text-orange-700 border-orange-200',
  collateral_requirement: 'bg-purple-100 text-purple-700 border-purple-200',
  reporting_frequency: 'bg-blue-100 text-blue-700 border-blue-200',
  dividend_restriction: 'bg-amber-100 text-amber-700 border-amber-200',
  cross_default: 'bg-red-200 text-red-800 border-red-300',
  acceleration: 'bg-red-300 text-red-900 border-red-400',
};

const severityBadgeVariants: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  low: 'default',
  medium: 'secondary',
  high: 'warning',
  critical: 'destructive',
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

export const CascadingEffects = memo(function CascadingEffects({
  cascadingEffects,
  mandatoryPrepaymentTriggers,
  totalPotentialPrepayment,
}: CascadingEffectsProps) {
  const triggeredPrepayments = mandatoryPrepaymentTriggers.filter(t => t.isTriggered);
  const potentialPrepayments = mandatoryPrepaymentTriggers.filter(t => !t.isTriggered && t.triggerProbability > 0.3);

  return (
    <div className="space-y-4" data-testid="cascading-effects">
      {/* Cascading Effects */}
      {cascadingEffects.length > 0 && (
        <Card data-testid="cascading-effects-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Cascading Effects</CardTitle>
            </div>
            <CardDescription>
              Chain reactions triggered by covenant breaches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cascadingEffects.map((effect) => (
              <div
                key={effect.effectId}
                className={cn('p-3 rounded-lg border', effectTypeColors[effect.effectType])}
                data-testid={`cascading-effect-${effect.effectId}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {effectTypeLabels[effect.effectType] || effect.effectType}
                    </Badge>
                    <Badge variant={severityBadgeVariants[effect.severity]} className="text-xs">
                      {effect.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Calendar className="w-3 h-3" />
                    {effect.timeToEffect}
                  </div>
                </div>
                <p className="text-sm">{effect.description}</p>
                {effect.financialImpact && (
                  <div className="mt-2 flex items-center gap-1 text-sm font-medium">
                    <DollarSign className="w-4 h-4" />
                    Impact: {formatCurrency(effect.financialImpact)}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mandatory Prepayment Triggers */}
      {mandatoryPrepaymentTriggers.length > 0 && (
        <Card className="border-red-200" data-testid="prepayment-triggers-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                <CardTitle className="text-base">Mandatory Prepayments</CardTitle>
              </div>
              {totalPotentialPrepayment > 0 && (
                <Badge variant="destructive">
                  Total: {formatCurrency(totalPotentialPrepayment)}
                </Badge>
              )}
            </div>
            <CardDescription>
              Prepayment requirements triggered under this scenario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Triggered Prepayments */}
            {triggeredPrepayments.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-red-600 uppercase">Triggered</div>
                {triggeredPrepayments.map((trigger) => (
                  <div
                    key={trigger.triggerId}
                    className="p-3 rounded-lg border border-red-200 bg-red-50"
                    data-testid={`prepayment-trigger-${trigger.triggerId}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-sm capitalize">
                          {trigger.triggerType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {trigger.prepaymentPercentage}%
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600 mb-2">{trigger.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{trigger.triggerCondition}</span>
                      {trigger.estimatedAmount && (
                        <span className="font-medium text-red-700">
                          Est. {formatCurrency(trigger.estimatedAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Potential Prepayments */}
            {potentialPrepayments.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-amber-600 uppercase">Potential</div>
                {potentialPrepayments.map((trigger) => (
                  <div
                    key={trigger.triggerId}
                    className="p-3 rounded-lg border border-amber-200 bg-amber-50"
                    data-testid={`potential-prepayment-${trigger.triggerId}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm capitalize">
                        {trigger.triggerType.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="warning" className="text-xs">
                        {(trigger.triggerProbability * 100).toFixed(0)}% probability
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600">{trigger.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Effects */}
      {cascadingEffects.length === 0 && mandatoryPrepaymentTriggers.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-6">
            <div className="text-center">
              <GitBranch className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium text-green-800">No Cascading Effects</div>
              <div className="text-sm text-green-600">
                This scenario does not trigger any cascading effects or mandatory prepayments
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
