'use client';

import React, { memo, useState } from 'react';
import { TrendingDown, Percent, AlertTriangle, DollarSign, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PredefinedScenario } from '@/lib/llm/risk-scenario-simulation';

interface ScenarioSelectorProps {
  scenarios: PredefinedScenario[];
  selectedScenarioId: string | null;
  onSelectScenario: (scenario: PredefinedScenario | null) => void;
  customScenario: {
    scenarioName: string;
    scenarioDescription: string;
    stressParameters: Array<{
      metric: string;
      changePercentage: number;
      description: string;
    }>;
  } | null;
  onCustomScenarioChange: (scenario: ScenarioSelectorProps['customScenario']) => void;
  isCustomMode: boolean;
  onToggleCustomMode: (enabled: boolean) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  economic: <TrendingDown className="w-4 h-4" />,
  operational: <AlertTriangle className="w-4 h-4" />,
  market: <Percent className="w-4 h-4" />,
  regulatory: <DollarSign className="w-4 h-4" />,
  custom: <Plus className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  economic: 'border-red-200 bg-red-50 hover:border-red-300',
  operational: 'border-amber-200 bg-amber-50 hover:border-amber-300',
  market: 'border-blue-200 bg-blue-50 hover:border-blue-300',
  regulatory: 'border-purple-200 bg-purple-50 hover:border-purple-300',
  custom: 'border-zinc-200 bg-zinc-50 hover:border-zinc-300',
};

const categoryBadgeVariants: Record<string, 'destructive' | 'warning' | 'info' | 'secondary' | 'default'> = {
  economic: 'destructive',
  operational: 'warning',
  market: 'info',
  regulatory: 'secondary',
  custom: 'default',
};

export const ScenarioSelector = memo(function ScenarioSelector({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  customScenario,
  onCustomScenarioChange,
  isCustomMode,
  onToggleCustomMode,
}: ScenarioSelectorProps) {
  const [newMetric, setNewMetric] = useState('');
  const [newChange, setNewChange] = useState('');

  const handleAddParameter = () => {
    if (!newMetric || !newChange) return;

    const current = customScenario || {
      scenarioName: 'Custom Scenario',
      scenarioDescription: '',
      stressParameters: [],
    };

    onCustomScenarioChange({
      ...current,
      stressParameters: [
        ...current.stressParameters,
        {
          metric: newMetric,
          changePercentage: parseFloat(newChange),
          description: `${newMetric} ${parseFloat(newChange) >= 0 ? 'increases' : 'decreases'} by ${Math.abs(parseFloat(newChange))}%`,
        },
      ],
    });

    setNewMetric('');
    setNewChange('');
  };

  const handleRemoveParameter = (index: number) => {
    if (!customScenario) return;

    onCustomScenarioChange({
      ...customScenario,
      stressParameters: customScenario.stressParameters.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4" data-testid="scenario-selector">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={!isCustomMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToggleCustomMode(false)}
          data-testid="predefined-mode-btn"
        >
          Predefined Scenarios
        </Button>
        <Button
          variant={isCustomMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToggleCustomMode(true)}
          data-testid="custom-mode-btn"
        >
          <Plus className="w-4 h-4 mr-1" />
          Custom Scenario
        </Button>
      </div>

      {/* Predefined Scenarios Grid */}
      {!isCustomMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.scenarioId}
              className={cn(
                'cursor-pointer transition-all duration-200 border-2',
                categoryColors[scenario.category],
                selectedScenarioId === scenario.scenarioId && 'ring-2 ring-offset-2 ring-blue-500'
              )}
              onClick={() => onSelectScenario(selectedScenarioId === scenario.scenarioId ? null : scenario)}
              data-testid={`scenario-card-${scenario.scenarioId}`}
            >
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'p-1.5 rounded',
                      scenario.category === 'economic' && 'bg-red-100 text-red-600',
                      scenario.category === 'operational' && 'bg-amber-100 text-amber-600',
                      scenario.category === 'market' && 'bg-blue-100 text-blue-600',
                      scenario.category === 'regulatory' && 'bg-purple-100 text-purple-600',
                    )}>
                      {categoryIcons[scenario.category]}
                    </span>
                    <CardTitle className="text-sm font-medium">{scenario.scenarioName}</CardTitle>
                  </div>
                  <Badge variant={categoryBadgeVariants[scenario.category]} className="text-xs capitalize">
                    {scenario.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <CardDescription className="text-xs mb-2">{scenario.scenarioDescription}</CardDescription>
                <div className="flex flex-wrap gap-1">
                  {scenario.stressParameters.map((param, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {param.metric}: {param.changePercentage > 0 ? '+' : ''}{param.changePercentage}%
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Custom Scenario Builder */}
      {isCustomMode && (
        <Card className="border-2 border-dashed border-zinc-300" data-testid="custom-scenario-builder">
          <CardHeader>
            <CardTitle className="text-base">Build Custom Scenario</CardTitle>
            <CardDescription>Define your own stress parameters to simulate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scenario Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Scenario Name</label>
              <Input
                placeholder="e.g., Q4 Revenue Decline"
                value={customScenario?.scenarioName || ''}
                onChange={(e) => onCustomScenarioChange({
                  scenarioName: e.target.value,
                  scenarioDescription: customScenario?.scenarioDescription || '',
                  stressParameters: customScenario?.stressParameters || [],
                })}
                data-testid="custom-scenario-name-input"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Describe the scenario..."
                value={customScenario?.scenarioDescription || ''}
                onChange={(e) => onCustomScenarioChange({
                  scenarioName: customScenario?.scenarioName || 'Custom Scenario',
                  scenarioDescription: e.target.value,
                  stressParameters: customScenario?.stressParameters || [],
                })}
                data-testid="custom-scenario-description-input"
              />
            </div>

            {/* Stress Parameters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Stress Parameters</label>

              {/* Existing Parameters */}
              {customScenario?.stressParameters.map((param, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg">
                  <Badge variant="outline">{param.metric}</Badge>
                  <span className={cn(
                    'text-sm font-medium',
                    param.changePercentage < 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    {param.changePercentage > 0 ? '+' : ''}{param.changePercentage}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6 w-6 p-0"
                    onClick={() => handleRemoveParameter(index)}
                    data-testid={`remove-param-${index}-btn`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {/* Add Parameter Form */}
              <div className="flex items-center gap-2 mt-2">
                <Input
                  placeholder="Metric (e.g., EBITDA)"
                  value={newMetric}
                  onChange={(e) => setNewMetric(e.target.value)}
                  className="flex-1"
                  data-testid="new-metric-input"
                />
                <Input
                  placeholder="% Change"
                  type="number"
                  value={newChange}
                  onChange={(e) => setNewChange(e.target.value)}
                  className="w-24"
                  data-testid="new-change-input"
                />
                <Button
                  size="sm"
                  onClick={handleAddParameter}
                  disabled={!newMetric || !newChange}
                  data-testid="add-param-btn"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex flex-wrap gap-1 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setNewMetric('EBITDA');
                    setNewChange('-20');
                  }}
                  data-testid="quick-add-ebitda-btn"
                >
                  EBITDA -20%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setNewMetric('Interest Expense');
                    setNewChange('25');
                  }}
                  data-testid="quick-add-interest-btn"
                >
                  Interest +25%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setNewMetric('Total Debt');
                    setNewChange('15');
                  }}
                  data-testid="quick-add-debt-btn"
                >
                  Debt +15%
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
