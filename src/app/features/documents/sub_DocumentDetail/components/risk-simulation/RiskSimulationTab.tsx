'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  Zap,
  Play,
  Loader2,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScenarioSelector } from './ScenarioSelector';
import { BreachAnalysis } from './BreachAnalysis';
import { CascadingEffects } from './CascadingEffects';
import { CureOptions } from './CureOptions';
import { CovenantInterconnections } from './CovenantInterconnections';
import { cn } from '@/lib/utils';
import type {
  PredefinedScenario,
  RiskScenarioSimulationResult,
} from '@/lib/llm/risk-scenario-simulation';

interface RiskSimulationTabProps {
  documentId: string;
}

const riskLevelColors: Record<string, string> = {
  low: 'text-green-600 bg-green-50 border-green-200',
  moderate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  elevated: 'text-orange-600 bg-orange-50 border-orange-200',
  high: 'text-red-600 bg-red-50 border-red-200',
  critical: 'text-red-800 bg-red-100 border-red-300',
};

const riskLevelBadgeVariants: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  low: 'success',
  moderate: 'warning',
  elevated: 'warning',
  high: 'destructive',
  critical: 'destructive',
};

export const RiskSimulationTab = memo(function RiskSimulationTab({
  documentId,
}: RiskSimulationTabProps) {
  const [scenarios, setScenarios] = useState<PredefinedScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<PredefinedScenario | null>(null);
  const [customScenario, setCustomScenario] = useState<{
    scenarioName: string;
    scenarioDescription: string;
    stressParameters: Array<{
      metric: string;
      changePercentage: number;
      description: string;
    }>;
  } | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [simulation, setSimulation] = useState<RiskScenarioSimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingScenarios, setIsFetchingScenarios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState('breaches');

  // Fetch available scenarios on mount
  React.useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/risk-simulation`);
        const data = await response.json();
        if (data.success) {
          setScenarios(data.data.scenarios);
        }
      } catch (err) {
        console.error('Failed to fetch scenarios:', err);
      } finally {
        setIsFetchingScenarios(false);
      }
    };
    fetchScenarios();
  }, [documentId]);

  const runSimulation = useCallback(async () => {
    const scenarioToRun = isCustomMode ? customScenario : selectedScenario;
    if (!scenarioToRun) return;

    setIsLoading(true);
    setError(null);
    setSimulation(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/risk-simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioType: isCustomMode ? 'custom' : 'predefined',
          predefinedScenarioId: !isCustomMode && selectedScenario
            ? selectedScenario.scenarioId
            : undefined,
          customScenario: isCustomMode ? customScenario : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSimulation(data.data.simulation);
      } else {
        setError(data.error?.message || 'Failed to run simulation');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, isCustomMode, selectedScenario, customScenario]);

  const canRunSimulation = useMemo(() => {
    if (isCustomMode) {
      return customScenario &&
        customScenario.scenarioName &&
        customScenario.stressParameters.length > 0;
    }
    return !!selectedScenario;
  }, [isCustomMode, customScenario, selectedScenario]);

  // Build covenant name map for interconnections visualization
  const allCovenantNames = useMemo(() => {
    if (!simulation) return {};
    const names: Record<string, string> = {};
    [...simulation.breachedCovenants, ...simulation.atRiskCovenants].forEach(c => {
      names[c.covenantId] = c.covenantName;
    });
    simulation.safeCovenants.forEach(c => {
      names[c.covenantId] = c.covenantName;
    });
    return names;
  }, [simulation]);

  return (
    <div className="space-y-6" data-testid="risk-simulation-tab">
      {/* Header Card */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Risk Scenario Simulation</CardTitle>
                <CardDescription>
                  Simulate stress scenarios to understand covenant breach risks and cascading effects
                </CardDescription>
              </div>
            </div>
            {simulation && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSimulation(null)}
                data-testid="reset-simulation-btn"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                New Simulation
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Scenario Selection (when no simulation running) */}
      {!simulation && !isLoading && (
        <Card data-testid="scenario-selection-card">
          <CardHeader>
            <CardTitle className="text-base">Select Stress Scenario</CardTitle>
            <CardDescription>
              Choose a predefined scenario or create a custom stress test
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFetchingScenarios ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : (
              <>
                <ScenarioSelector
                  scenarios={scenarios}
                  selectedScenarioId={selectedScenario?.scenarioId || null}
                  onSelectScenario={setSelectedScenario}
                  customScenario={customScenario}
                  onCustomScenarioChange={setCustomScenario}
                  isCustomMode={isCustomMode}
                  onToggleCustomMode={setIsCustomMode}
                />

                <Button
                  className="w-full"
                  size="lg"
                  onClick={runSimulation}
                  disabled={!canRunSimulation}
                  data-testid="run-simulation-btn"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card data-testid="simulation-loading">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                <Zap className="w-5 h-5 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <div className="font-medium text-zinc-700">Running Simulation...</div>
                <div className="text-sm text-zinc-500">
                  Analyzing covenants, calculating breach probabilities, and mapping cascading effects
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50" data-testid="simulation-error">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <div className="font-medium text-red-800">Simulation Failed</div>
                <div className="text-sm text-red-600">{error}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runSimulation}
              className="mt-3"
              data-testid="retry-simulation-btn"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Simulation Results */}
      {simulation && !isLoading && (
        <>
          {/* Summary Card */}
          <Card className={cn('border', riskLevelColors[simulation.riskLevel])} data-testid="simulation-summary-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{simulation.scenarioName}</CardTitle>
                  <CardDescription>{simulation.scenarioDescription}</CardDescription>
                </div>
                <Badge variant={riskLevelBadgeVariants[simulation.riskLevel]} className="text-sm capitalize">
                  {simulation.riskLevel} Risk
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="text-xl font-bold text-red-600">
                    {simulation.breachedCovenants.length}
                  </div>
                  <div className="text-xs text-zinc-500">Breached</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-xl font-bold text-amber-600">
                    {simulation.atRiskCovenants.length}
                  </div>
                  <div className="text-xs text-zinc-500">At Risk</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="text-xl font-bold text-purple-600">
                    {simulation.cascadingEffects.length}
                  </div>
                  <div className="text-xs text-zinc-500">Cascading Effects</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="text-xl font-bold text-blue-600">
                    {simulation.cureOptions.length}
                  </div>
                  <div className="text-xs text-zinc-500">Cure Options</div>
                </div>
              </div>

              {/* Risk Score */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border mb-4">
                <span className="text-sm font-medium">Overall Risk Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        simulation.overallRiskScore < 30 && 'bg-green-500',
                        simulation.overallRiskScore >= 30 && simulation.overallRiskScore < 50 && 'bg-yellow-500',
                        simulation.overallRiskScore >= 50 && simulation.overallRiskScore < 70 && 'bg-orange-500',
                        simulation.overallRiskScore >= 70 && 'bg-red-500'
                      )}
                      style={{ width: `${simulation.overallRiskScore}%` }}
                    />
                  </div>
                  <span className="font-bold text-lg">{simulation.overallRiskScore}</span>
                </div>
              </div>

              {/* Key Insights */}
              {simulation.keyInsights.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h4 className="font-medium text-zinc-800">Key Insights</h4>
                  </div>
                  <ul className="space-y-2">
                    {simulation.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-zinc-600">
                        <AlertCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {simulation.recommendedActions.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-zinc-800">Recommended Actions</h4>
                  </div>
                  <ul className="space-y-2">
                    {simulation.recommendedActions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-zinc-600">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Results Tabs */}
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} data-testid="simulation-results-tabs">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="breaches"
                className="flex items-center gap-1"
                data-testid="breaches-subtab"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Breaches</span>
                {simulation.breachedCovenants.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {simulation.breachedCovenants.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="cascading"
                className="flex items-center gap-1"
                data-testid="cascading-subtab"
              >
                <TrendingDown className="w-4 h-4" />
                <span className="hidden sm:inline">Effects</span>
                {simulation.cascadingEffects.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {simulation.cascadingEffects.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="cures"
                className="flex items-center gap-1"
                data-testid="cures-subtab"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Cures</span>
                {simulation.cureOptions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {simulation.cureOptions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="network"
                className="flex items-center gap-1"
                data-testid="network-subtab"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="5" cy="6" r="2" />
                  <circle cx="12" cy="18" r="2" />
                  <circle cx="19" cy="6" r="2" />
                  <line x1="5" y1="8" x2="12" y2="16" />
                  <line x1="19" y1="8" x2="12" y2="16" />
                </svg>
                <span className="hidden sm:inline">Network</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="breaches" className="mt-6" data-testid="breaches-content">
              <BreachAnalysis
                breachedCovenants={simulation.breachedCovenants}
                atRiskCovenants={simulation.atRiskCovenants}
                safeCovenants={simulation.safeCovenants}
              />
            </TabsContent>

            <TabsContent value="cascading" className="mt-6" data-testid="cascading-content">
              <CascadingEffects
                cascadingEffects={simulation.cascadingEffects}
                mandatoryPrepaymentTriggers={simulation.mandatoryPrepaymentTriggers}
                totalPotentialPrepayment={simulation.totalPotentialPrepayment}
              />
            </TabsContent>

            <TabsContent value="cures" className="mt-6" data-testid="cures-content">
              <CureOptions cureOptions={simulation.cureOptions} />
            </TabsContent>

            <TabsContent value="network" className="mt-6" data-testid="network-content">
              <CovenantInterconnections
                covenantInterconnections={simulation.covenantInterconnections}
                breachedCovenants={simulation.breachedCovenants}
                allCovenantNames={allCovenantNames}
              />
            </TabsContent>
          </Tabs>

          {/* Confidence and Limitations */}
          <Card className="bg-zinc-50" data-testid="simulation-confidence">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500">
                  Analysis Confidence: {(simulation.analysisConfidence * 100).toFixed(0)}%
                </div>
                {simulation.limitations.length > 0 && (
                  <div className="text-xs text-zinc-400">
                    {simulation.limitations.length} limitation(s) noted
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
});
