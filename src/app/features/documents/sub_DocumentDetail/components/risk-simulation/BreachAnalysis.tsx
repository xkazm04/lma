'use client';

import React, { memo } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { RiskScenarioSimulationResult } from '@/lib/llm/risk-scenario-simulation';

interface BreachAnalysisProps {
  breachedCovenants: RiskScenarioSimulationResult['breachedCovenants'];
  atRiskCovenants: RiskScenarioSimulationResult['atRiskCovenants'];
  safeCovenants: RiskScenarioSimulationResult['safeCovenants'];
}

const severityColors: Record<string, string> = {
  minor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  moderate: 'bg-orange-100 text-orange-700 border-orange-200',
  severe: 'bg-red-100 text-red-700 border-red-200',
  critical: 'bg-red-200 text-red-800 border-red-300',
};

const severityBadgeVariants: Record<string, 'warning' | 'destructive' | 'default'> = {
  minor: 'warning',
  moderate: 'warning',
  severe: 'destructive',
  critical: 'destructive',
};

function formatCovenantValue(value: number, type: string): string {
  if (['capex', 'minimum_liquidity', 'net_worth'].includes(type)) {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  }
  return `${value.toFixed(2)}x`;
}

export const BreachAnalysis = memo(function BreachAnalysis({
  breachedCovenants,
  atRiskCovenants,
  safeCovenants,
}: BreachAnalysisProps) {
  const [expandedBreached, setExpandedBreached] = React.useState(true);
  const [expandedAtRisk, setExpandedAtRisk] = React.useState(true);
  const [expandedSafe, setExpandedSafe] = React.useState(false);

  return (
    <div className="space-y-4" data-testid="breach-analysis">
      {/* Breached Covenants */}
      {breachedCovenants.length > 0 && (
        <Card className="border-red-200 bg-red-50/50" data-testid="breached-covenants-card">
          <CardHeader
            className="cursor-pointer pb-2"
            onClick={() => setExpandedBreached(!expandedBreached)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-base text-red-800">
                  Breached Covenants ({breachedCovenants.length})
                </CardTitle>
              </div>
              {expandedBreached ? (
                <ChevronUp className="w-5 h-5 text-red-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-red-600" />
              )}
            </div>
          </CardHeader>
          {expandedBreached && (
            <CardContent className="space-y-3">
              {breachedCovenants.map((covenant) => (
                <div
                  key={covenant.covenantId}
                  className={cn('p-3 rounded-lg border', severityColors[covenant.breachSeverity])}
                  data-testid={`breached-covenant-${covenant.covenantId}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{covenant.covenantName}</span>
                        <Badge variant={severityBadgeVariants[covenant.breachSeverity]} className="text-xs">
                          {covenant.breachSeverity}
                        </Badge>
                      </div>
                      <span className="text-xs text-zinc-500 capitalize">
                        {covenant.covenantType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {(covenant.breachProbability * 100).toFixed(0)}% likely
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-2 text-center">
                    <div className="p-2 bg-white/60 rounded">
                      <div className="text-xs text-zinc-500">Threshold</div>
                      <div className="font-medium text-sm">
                        {covenant.thresholdType === 'maximum' ? '≤' : '≥'}{' '}
                        {formatCovenantValue(covenant.thresholdValue, covenant.covenantType)}
                      </div>
                    </div>
                    <div className="p-2 bg-white/60 rounded">
                      <div className="text-xs text-zinc-500">Projected</div>
                      <div className="font-bold text-sm text-red-700">
                        {formatCovenantValue(covenant.projectedValue, covenant.covenantType)}
                      </div>
                    </div>
                    <div className="p-2 bg-white/60 rounded">
                      <div className="text-xs text-zinc-500">Breach Margin</div>
                      <div className="font-medium text-sm text-red-700">
                        {covenant.breachMargin > 0 ? '+' : ''}{covenant.breachMargin.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {covenant.calculationBreakdown && (
                    <div className="mt-2 p-2 bg-white/60 rounded text-xs text-zinc-600">
                      <span className="font-medium">Calculation:</span> {covenant.calculationBreakdown}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* At-Risk Covenants */}
      {atRiskCovenants.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50" data-testid="at-risk-covenants-card">
          <CardHeader
            className="cursor-pointer pb-2"
            onClick={() => setExpandedAtRisk(!expandedAtRisk)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-base text-amber-800">
                  At-Risk Covenants ({atRiskCovenants.length})
                </CardTitle>
              </div>
              {expandedAtRisk ? (
                <ChevronUp className="w-5 h-5 text-amber-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-600" />
              )}
            </div>
          </CardHeader>
          {expandedAtRisk && (
            <CardContent className="space-y-3">
              {atRiskCovenants.map((covenant) => (
                <div
                  key={covenant.covenantId}
                  className="p-3 rounded-lg border border-amber-200 bg-amber-100/50"
                  data-testid={`at-risk-covenant-${covenant.covenantId}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm">{covenant.covenantName}</span>
                      <div className="text-xs text-zinc-500 capitalize">
                        {covenant.covenantType.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <Badge variant="warning" className="text-xs">
                      Within 10% of threshold
                    </Badge>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Threshold: {formatCovenantValue(covenant.thresholdValue, covenant.covenantType)}</span>
                      <span>Projected: {formatCovenantValue(covenant.projectedValue, covenant.covenantType)}</span>
                    </div>
                    <Progress
                      value={Math.min(100, (covenant.projectedValue / covenant.thresholdValue) * 100)}
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Safe Covenants */}
      {safeCovenants.length > 0 && (
        <Card className="border-green-200 bg-green-50/50" data-testid="safe-covenants-card">
          <CardHeader
            className="cursor-pointer pb-2"
            onClick={() => setExpandedSafe(!expandedSafe)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <CardTitle className="text-base text-green-800">
                  Safe Covenants ({safeCovenants.length})
                </CardTitle>
              </div>
              {expandedSafe ? (
                <ChevronUp className="w-5 h-5 text-green-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-green-600" />
              )}
            </div>
          </CardHeader>
          {expandedSafe && (
            <CardContent className="space-y-2">
              {safeCovenants.map((covenant) => (
                <div
                  key={covenant.covenantId}
                  className="flex items-center justify-between p-2 rounded-lg border border-green-200 bg-green-100/50"
                  data-testid={`safe-covenant-${covenant.covenantId}`}
                >
                  <span className="text-sm font-medium text-green-800">{covenant.covenantName}</span>
                  <Badge variant="success" className="text-xs">
                    {covenant.headroomPercentage.toFixed(1)}% headroom
                  </Badge>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* No Issues */}
      {breachedCovenants.length === 0 && atRiskCovenants.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="font-medium text-green-800">No Covenant Breaches</div>
                <div className="text-sm text-green-600">All covenants remain within thresholds under this scenario</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
