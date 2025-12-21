'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  TrendingUp,
  Shield,
  Leaf,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Play,
  Target,
} from 'lucide-react';
import type { PortfolioOptimizationScenario } from '../lib';
import { formatCurrency } from '../lib';

interface OptimizationScenarioCardProps {
  data: PortfolioOptimizationScenario[];
  title?: string;
  description?: string;
  onSelectScenario?: (scenarioId: string) => void;
  onRunSimulation?: (scenarioId: string) => void;
}

function getScenarioTypeLabel(type: string): string {
  switch (type) {
    case 'aggressive_esg':
      return 'ESG Focus';
    case 'balanced':
      return 'Balanced';
    case 'yield_focused':
      return 'Yield Focus';
    case 'risk_minimization':
      return 'Risk Focus';
    case 'custom':
      return 'Custom';
    default:
      return type;
  }
}

function getScenarioTypeColor(type: string): string {
  switch (type) {
    case 'aggressive_esg':
      return 'bg-green-100 text-green-700';
    case 'balanced':
      return 'bg-blue-100 text-blue-700';
    case 'yield_focused':
      return 'bg-purple-100 text-purple-700';
    case 'risk_minimization':
      return 'bg-amber-100 text-amber-700';
    case 'custom':
      return 'bg-zinc-100 text-zinc-700';
    default:
      return 'bg-zinc-100 text-zinc-700';
  }
}

function getFeasibilityColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function getFeasibilityLabel(score: number): string {
  if (score >= 80) return 'Highly Feasible';
  if (score >= 60) return 'Feasible';
  if (score >= 40) return 'Moderate';
  return 'Challenging';
}

export const OptimizationScenarioCard = memo(function OptimizationScenarioCard({
  data,
  title = 'Optimization Scenarios',
  description = 'AI-recommended portfolio rebalancing strategies',
  onSelectScenario,
  onRunSimulation,
}: OptimizationScenarioCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectScenario?.(id);
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="optimization-scenario-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((scenario) => {
            const isExpanded = expandedId === scenario.id;
            const isSelected = selectedId === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`rounded-lg border overflow-hidden transition-all ${
                  isSelected ? 'border-purple-400 ring-2 ring-purple-100' : 'border-zinc-200 hover:border-zinc-300'
                }`}
                data-testid={`scenario-item-${scenario.id}`}
              >
                {/* Header */}
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    isSelected ? 'bg-purple-50' : 'bg-zinc-50'
                  }`}
                  onClick={() => toggleExpanded(scenario.id)}
                  data-testid={`scenario-toggle-${scenario.id}`}
                >
                  <div className="flex items-center gap-4">
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-zinc-900">{scenario.name}</h4>
                        <Badge className={getScenarioTypeColor(scenario.type)}>
                          {getScenarioTypeLabel(scenario.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">{scenario.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Feasibility</div>
                      <div className={`font-semibold ${getFeasibilityColor(scenario.feasibility_score)}`}>
                        {scenario.feasibility_score}%
                      </div>
                      <div className={`text-xs ${getFeasibilityColor(scenario.feasibility_score)}`}>
                        {getFeasibilityLabel(scenario.feasibility_score)}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-zinc-200 bg-white">
                    {/* Expected Outcomes */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-zinc-700 mb-2">Expected Outcomes</h5>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-3 rounded-lg bg-green-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-700">ESG Score</span>
                          </div>
                          <div className="text-lg font-bold text-green-700">
                            {scenario.expected_outcomes.portfolio_esg_score}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-purple-700">Avg Yield</span>
                          </div>
                          <div className="text-lg font-bold text-purple-700">
                            {scenario.expected_outcomes.weighted_avg_yield_bps}bps
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-700">Risk Score</span>
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            {scenario.expected_outcomes.concentration_risk_score}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-teal-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Leaf className="w-4 h-4 text-teal-600" />
                            <span className="text-xs text-teal-700">Carbon Reduction</span>
                          </div>
                          <div className="text-lg font-bold text-teal-700">
                            {scenario.expected_outcomes.carbon_intensity_reduction_pct}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Required Actions */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-zinc-700 mb-2">Required Actions</h5>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Participations */}
                        <div className="p-3 rounded-lg bg-zinc-50">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-zinc-700">
                              Participate ({scenario.required_actions.participate.length})
                            </span>
                          </div>
                          {scenario.required_actions.participate.length > 0 ? (
                            <ul className="space-y-1">
                              {scenario.required_actions.participate.map((facility) => (
                                <li key={facility.id} className="text-xs text-zinc-600 flex items-center justify-between">
                                  <span>{facility.facility_name}</span>
                                  <span className="text-zinc-400">{formatCurrency(facility.available_participation)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-zinc-400">No participations required</p>
                          )}
                        </div>

                        {/* Divestments */}
                        <div className="p-3 rounded-lg bg-zinc-50">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                            <span className="text-sm font-medium text-zinc-700">
                              Divest ({scenario.required_actions.divest.length})
                            </span>
                          </div>
                          {scenario.required_actions.divest.length > 0 ? (
                            <ul className="space-y-1">
                              {scenario.required_actions.divest.map((facility) => (
                                <li key={facility.id} className="text-xs text-zinc-600 flex items-center justify-between">
                                  <span>{facility.facility_name}</span>
                                  <span className="text-zinc-400">{formatCurrency(facility.current_exposure)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-zinc-400">No divestments required</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-zinc-500">
                        Estimated execution: {scenario.required_actions.estimated_execution_period}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
                      <Button
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => handleSelect(scenario.id)}
                        data-testid={`select-scenario-btn-${scenario.id}`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Selected
                          </>
                        ) : (
                          'Select Scenario'
                        )}
                      </Button>
                      {onRunSimulation && (
                        <Button
                          variant="outline"
                          onClick={() => onRunSimulation(scenario.id)}
                          data-testid={`simulate-scenario-btn-${scenario.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Run Simulation
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
