'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { WhatIfScenario, Intervention, RiskLevel } from '../lib/types';
import { formatCurrency } from '../lib/formatters';

interface WhatIfScenarioCardProps {
  scenario: WhatIfScenario;
  onApply?: () => void;
  isExpanded?: boolean;
}

const riskLevelColors: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const categoryIcons: Record<string, React.ReactNode> = {
  operational: <Zap className="w-4 h-4" />,
  capital: <DollarSign className="w-4 h-4" />,
  strategic: <Target className="w-4 h-4" />,
  regulatory: <Shield className="w-4 h-4" />,
};

export const WhatIfScenarioCard = memo(function WhatIfScenarioCard({
  scenario,
  onApply,
  isExpanded: initialExpanded = false,
}: WhatIfScenarioCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const improvementValue = scenario.original_prediction.predicted_value - scenario.adjusted_prediction.predicted_value;
  const improvementPercentage = (improvementValue / scenario.original_prediction.predicted_value) * 100;

  const getSuccessColor = () => {
    if (scenario.probability_of_success >= 80) return 'text-green-600';
    if (scenario.probability_of_success >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card
      className="transition-all duration-300 hover:shadow-md border-blue-100 bg-gradient-to-br from-blue-50/50 to-white"
      data-testid={`whatif-scenario-${scenario.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{scenario.name}</CardTitle>
              <CardDescription className="mt-1">{scenario.description}</CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${getSuccessColor()} border-current`}
            data-testid={`scenario-success-badge-${scenario.id}`}
          >
            {scenario.probability_of_success}% success
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-white border border-zinc-100">
            <div className="flex items-center justify-center gap-1 mb-1">
              {scenario.margin_impact_change < 0 ? (
                <TrendingDown className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingUp className="w-4 h-4 text-red-600" />
              )}
              <span className="text-xs text-zinc-500">Margin Impact</span>
            </div>
            <p className={`text-lg font-bold ${
              scenario.margin_impact_change < 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {scenario.margin_impact_change > 0 ? '+' : ''}{scenario.margin_impact_change}bps
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white border border-zinc-100">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs text-zinc-500">Financial Benefit</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(scenario.financial_benefit)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white border border-zinc-100">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-zinc-500">Time to Implement</span>
            </div>
            <p className="text-lg font-bold text-blue-600">
              {scenario.time_to_implement}
            </p>
          </div>
        </div>

        {/* ROI Section */}
        {scenario.roi !== undefined && scenario.implementation_cost !== undefined && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Return on Investment</p>
                <p className="text-2xl font-bold text-green-700">{scenario.roi.toFixed(1)}x</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Implementation Cost</p>
                <p className="text-sm font-medium text-zinc-700">
                  {formatCurrency(scenario.implementation_cost)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Comparison */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-700">KPI Trajectory Change</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Without Intervention</span>
              <span className="text-amber-600 font-medium">
                {scenario.original_prediction.predicted_value.toLocaleString()} {scenario.original_prediction.unit}
              </span>
            </div>
            <Progress
              value={(scenario.original_prediction.predicted_value / scenario.original_prediction.target_value) * 100}
              className="h-2 bg-amber-100"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">With Intervention</span>
              <span className="text-green-600 font-medium">
                {scenario.adjusted_prediction.predicted_value.toLocaleString()} {scenario.adjusted_prediction.unit}
              </span>
            </div>
            <Progress
              value={(scenario.adjusted_prediction.predicted_value / scenario.adjusted_prediction.target_value) * 100}
              className="h-2 bg-green-100"
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
            <span className="text-zinc-500">Target</span>
            <span className="text-blue-600 font-medium">
              {scenario.original_prediction.target_value.toLocaleString()} {scenario.original_prediction.unit}
            </span>
          </div>
        </div>

        {/* Expand/Collapse Interventions */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`toggle-interventions-${scenario.id}`}
        >
          <span className="text-sm">
            {scenario.interventions.length} Intervention{scenario.interventions.length > 1 ? 's' : ''}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {/* Interventions List */}
        {isExpanded && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            {scenario.interventions.map((intervention) => (
              <InterventionItem key={intervention.id} intervention={intervention} />
            ))}
          </div>
        )}

        {/* Action Button */}
        {onApply && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={onApply}
            data-testid={`apply-scenario-${scenario.id}`}
          >
            <Target className="w-4 h-4 mr-2" />
            Apply This Scenario
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

interface InterventionItemProps {
  intervention: Intervention;
}

const InterventionItem = memo(function InterventionItem({ intervention }: InterventionItemProps) {
  return (
    <div
      className="p-3 rounded-lg bg-white border border-zinc-100 space-y-2"
      data-testid={`intervention-${intervention.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-zinc-100">
            {categoryIcons[intervention.category] || <Zap className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{intervention.name}</p>
            <p className="text-xs text-zinc-500">{intervention.description}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={riskLevelColors[intervention.risk_level]}
        >
          {intervention.risk_level} risk
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-50">
        <div>
          <p className="text-xs text-zinc-400">KPI Impact</p>
          <p className="text-sm font-medium text-green-600">
            +{intervention.kpi_impact_percentage.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Cost</p>
          <p className="text-sm font-medium text-zinc-700">
            {intervention.cost_estimate ? formatCurrency(intervention.cost_estimate) : 'TBD'}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Time</p>
          <p className="text-sm font-medium text-zinc-700">
            {intervention.time_to_effect}
          </p>
        </div>
      </div>
    </div>
  );
});
