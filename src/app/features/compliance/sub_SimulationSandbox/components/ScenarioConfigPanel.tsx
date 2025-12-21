'use client';

import React, { memo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Trash2,
  Percent,
  TrendingUp,
  Building2,
  Layers,
  Settings,
  Play,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ScenarioParams,
  ScenarioType,
  StressSeverity,
  RateChangeParams,
  EbitdaFluctuationParams,
  MonteCarloConfig,
} from '../lib/types';
import { getScenarioTypeLabel, getStressSeverityColor } from '../lib/types';

interface ScenarioConfigPanelProps {
  scenarios: ScenarioParams[];
  monteCarloConfig?: MonteCarloConfig;
  onScenariosChange: (scenarios: ScenarioParams[]) => void;
  onMonteCarloConfigChange: (config: MonteCarloConfig | undefined) => void;
  onRun: () => void;
  onSave: () => void;
  isRunning?: boolean;
}

const SEVERITY_OPTIONS: StressSeverity[] = ['mild', 'moderate', 'severe', 'extreme'];
const SCENARIO_TYPES: ScenarioType[] = ['rate_change', 'ebitda_fluctuation', 'ma_event', 'industry_downturn', 'custom'];

function getScenarioIcon(type: ScenarioType) {
  switch (type) {
    case 'rate_change':
      return Percent;
    case 'ebitda_fluctuation':
      return TrendingUp;
    case 'ma_event':
      return Building2;
    case 'industry_downturn':
      return Layers;
    case 'custom':
      return Settings;
  }
}

function createDefaultScenario(type: ScenarioType): ScenarioParams {
  const base = {
    id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: getScenarioTypeLabel(type),
    description: '',
    severity: 'moderate' as StressSeverity,
    time_horizon_quarters: 4,
  };

  switch (type) {
    case 'rate_change':
      return {
        ...base,
        type: 'rate_change',
        basis_points_change: 100,
        change_type: 'immediate',
      };
    case 'ebitda_fluctuation':
      return {
        ...base,
        type: 'ebitda_fluctuation',
        ebitda_change_percentage: -20,
        impact_duration: 'temporary',
        recovery_quarters: 4,
      };
    case 'ma_event':
      return {
        ...base,
        type: 'ma_event',
        event_type: 'acquisition',
        transaction_value_percentage: 25,
        debt_change_percentage: 30,
        ebitda_synergy_percentage: 10,
        synergy_realization_quarters: 6,
      };
    case 'industry_downturn':
      return {
        ...base,
        type: 'industry_downturn',
        affected_industry: 'manufacturing',
        revenue_decline_percentage: 20,
        margin_compression_bps: 150,
        downturn_duration_quarters: 4,
        recovery_shape: 'u',
      };
    case 'custom':
      return {
        ...base,
        type: 'custom',
        impacts: {},
      };
  }
}

export const ScenarioConfigPanel = memo(function ScenarioConfigPanel({
  scenarios,
  monteCarloConfig,
  onScenariosChange,
  onMonteCarloConfigChange,
  onRun,
  onSave,
  isRunning = false,
}: ScenarioConfigPanelProps) {
  const [activeTab, setActiveTab] = useState('scenarios');
  const [enableMonteCarlo, setEnableMonteCarlo] = useState(!!monteCarloConfig);

  const handleAddScenario = useCallback((type: ScenarioType) => {
    const newScenario = createDefaultScenario(type);
    onScenariosChange([...scenarios, newScenario]);
  }, [scenarios, onScenariosChange]);

  const handleRemoveScenario = useCallback((index: number) => {
    const updated = scenarios.filter((_, i) => i !== index);
    onScenariosChange(updated);
  }, [scenarios, onScenariosChange]);

  const handleScenarioChange = useCallback((index: number, updates: Partial<ScenarioParams>) => {
    const updated = scenarios.map((s, i) => i === index ? { ...s, ...updates } : s);
    onScenariosChange(updated as ScenarioParams[]);
  }, [scenarios, onScenariosChange]);

  const handleToggleMonteCarlo = useCallback((enabled: boolean) => {
    setEnableMonteCarlo(enabled);
    if (enabled) {
      onMonteCarloConfigChange({
        iterations: 1000,
        confidence_levels: [0.05, 0.25, 0.5, 0.75, 0.95],
        variables: [],
      });
    } else {
      onMonteCarloConfigChange(undefined);
    }
  }, [onMonteCarloConfigChange]);

  return (
    <Card data-testid="scenario-config-panel">
      <CardHeader>
        <CardTitle>Scenario Configuration</CardTitle>
        <CardDescription>
          Define stress scenarios and simulation parameters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="scenarios">Scenarios ({scenarios.length})</TabsTrigger>
            <TabsTrigger value="monte-carlo">Monte Carlo</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-4">
            {/* Add Scenario Buttons */}
            <div className="flex flex-wrap gap-2">
              {SCENARIO_TYPES.map((type) => {
                const Icon = getScenarioIcon(type);
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddScenario(type)}
                    data-testid={`add-scenario-${type}-btn`}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    {getScenarioTypeLabel(type)}
                  </Button>
                );
              })}
            </div>

            {/* Scenario List */}
            {scenarios.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Layers className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                <p>No scenarios configured.</p>
                <p className="text-sm">Add a scenario to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scenarios.map((scenario, index) => (
                  <div
                    key={scenario.id}
                    className="border border-zinc-200 rounded-lg p-4 space-y-3"
                    data-testid={`scenario-config-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{getScenarioTypeLabel(scenario.type)}</Badge>
                        <Badge className={getStressSeverityColor(scenario.severity)}>
                          {scenario.severity}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveScenario(index)}
                        data-testid={`remove-scenario-${index}-btn`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={scenario.name}
                          onChange={(e) => handleScenarioChange(index, { name: e.target.value })}
                          className="h-8 text-sm"
                          data-testid={`scenario-name-${index}-input`}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Severity</Label>
                        <Select
                          value={scenario.severity}
                          onValueChange={(value) => handleScenarioChange(index, { severity: value as StressSeverity })}
                        >
                          <SelectTrigger className="h-8 text-sm" data-testid={`scenario-severity-${index}-select`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEVERITY_OPTIONS.map((sev) => (
                              <SelectItem key={sev} value={sev}>
                                {sev.charAt(0).toUpperCase() + sev.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Time Horizon (Quarters)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={scenario.time_horizon_quarters}
                          onChange={(e) => handleScenarioChange(index, { time_horizon_quarters: parseInt(e.target.value) || 4 })}
                          className="h-8 text-sm"
                          data-testid={`scenario-horizon-${index}-input`}
                        />
                      </div>

                      {/* Type-specific fields */}
                      {scenario.type === 'rate_change' && (
                        <>
                          <div>
                            <Label className="text-xs">Rate Change (bps)</Label>
                            <Input
                              type="number"
                              value={(scenario as RateChangeParams).basis_points_change}
                              onChange={(e) => handleScenarioChange(index, { basis_points_change: parseInt(e.target.value) || 0 })}
                              className="h-8 text-sm"
                              data-testid={`scenario-bps-${index}-input`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Change Type</Label>
                            <Select
                              value={(scenario as RateChangeParams).change_type}
                              onValueChange={(value) => handleScenarioChange(index, { change_type: value as 'immediate' | 'gradual' })}
                            >
                              <SelectTrigger className="h-8 text-sm" data-testid={`scenario-changetype-${index}-select`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="immediate">Immediate</SelectItem>
                                <SelectItem value="gradual">Gradual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      {scenario.type === 'ebitda_fluctuation' && (
                        <>
                          <div>
                            <Label className="text-xs">EBITDA Change (%)</Label>
                            <Input
                              type="number"
                              value={(scenario as EbitdaFluctuationParams).ebitda_change_percentage}
                              onChange={(e) => handleScenarioChange(index, { ebitda_change_percentage: parseFloat(e.target.value) || 0 })}
                              className="h-8 text-sm"
                              data-testid={`scenario-ebitda-${index}-input`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Duration</Label>
                            <Select
                              value={(scenario as EbitdaFluctuationParams).impact_duration}
                              onValueChange={(value) => handleScenarioChange(index, { impact_duration: value as 'permanent' | 'temporary' })}
                            >
                              <SelectTrigger className="h-8 text-sm" data-testid={`scenario-duration-${index}-select`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="permanent">Permanent</SelectItem>
                                <SelectItem value="temporary">Temporary</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="monte-carlo" className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enable-monte-carlo"
                checked={enableMonteCarlo}
                onChange={(e) => handleToggleMonteCarlo(e.target.checked)}
                className="rounded border-zinc-300"
                data-testid="enable-monte-carlo-checkbox"
              />
              <Label htmlFor="enable-monte-carlo">Enable Monte Carlo Simulation</Label>
            </div>

            {enableMonteCarlo && monteCarloConfig && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Iterations</Label>
                    <Input
                      type="number"
                      min={100}
                      max={100000}
                      step={100}
                      value={monteCarloConfig.iterations}
                      onChange={(e) => onMonteCarloConfigChange({
                        ...monteCarloConfig,
                        iterations: parseInt(e.target.value) || 1000,
                      })}
                      className="h-8 text-sm"
                      data-testid="monte-carlo-iterations-input"
                    />
                    <p className="text-xs text-zinc-500 mt-1">More iterations = more accurate but slower</p>
                  </div>
                  <div>
                    <Label className="text-xs">Random Seed (optional)</Label>
                    <Input
                      type="number"
                      placeholder="Auto"
                      value={monteCarloConfig.random_seed ?? ''}
                      onChange={(e) => onMonteCarloConfigChange({
                        ...monteCarloConfig,
                        random_seed: e.target.value ? parseInt(e.target.value) : undefined,
                      })}
                      className="h-8 text-sm"
                      data-testid="monte-carlo-seed-input"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Set seed for reproducible results</p>
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-zinc-700 mb-2">Confidence Levels</h4>
                  <div className="flex flex-wrap gap-2">
                    {monteCarloConfig.confidence_levels.map((level) => (
                      <Badge key={level} variant="secondary">
                        {(level * 100).toFixed(0)}%
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 mt-4">
          <Button
            onClick={onRun}
            disabled={scenarios.length === 0 || isRunning}
            className="flex-1"
            data-testid="run-simulation-btn"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? 'Running Simulation...' : 'Run Simulation'}
          </Button>
          <Button
            variant="outline"
            onClick={onSave}
            disabled={scenarios.length === 0}
            data-testid="save-scenario-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
