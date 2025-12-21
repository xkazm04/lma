'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical,
  Plus,
  Search,
  FileText,
  History,
  Settings,
  Play,
  Activity,
  ArrowRight,
  Layers,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SimulationStatsBar,
  StressTestTemplateCard,
  ScenarioCard,
  ScenarioConfigPanel,
  SimulationResultsSummary,
  MonteCarloResultsPanel,
  CovenantImpactCard,
} from './components';
import {
  stressTestTemplates,
  savedScenarios,
  simulationResults,
  simulationDashboardStats,
} from './lib';
import type {
  StressTestTemplate,
  SimulationScenario,
  SimulationResult,
  ScenarioParams,
  MonteCarloConfig,
} from './lib/types';

type ViewMode = 'dashboard' | 'templates' | 'scenarios' | 'builder' | 'results';

export const SimulationSandboxPage = memo(function SimulationSandboxPage() {
  const [activeTab, setActiveTab] = useState<ViewMode>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<StressTestTemplate | null>(null);
  const [selectedResult, setSelectedResult] = useState<SimulationResult | null>(null);
  const [builderScenarios, setBuilderScenarios] = useState<ScenarioParams[]>([]);
  const [builderMonteCarloConfig, setBuilderMonteCarloConfig] = useState<MonteCarloConfig | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return stressTestTemplates;
    const query = searchQuery.toLowerCase();
    return stressTestTemplates.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Filter scenarios based on search
  const filteredScenarios = useMemo(() => {
    if (!searchQuery) return savedScenarios;
    const query = searchQuery.toLowerCase();
    return savedScenarios.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.description && s.description.toLowerCase().includes(query)) ||
      s.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Handle template selection
  const handleSelectTemplate = useCallback((template: StressTestTemplate) => {
    setBuilderScenarios([...template.scenarios]);
    setBuilderMonteCarloConfig(template.monte_carlo_config);
    setActiveTab('builder');
  }, []);

  // Handle template clone
  const handleCloneTemplate = useCallback((template: StressTestTemplate) => {
    // Clone scenarios with new IDs
    const clonedScenarios = template.scenarios.map(s => ({
      ...s,
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    setBuilderScenarios(clonedScenarios);
    setBuilderMonteCarloConfig(template.monte_carlo_config);
    setActiveTab('builder');
  }, []);

  // Handle scenario actions
  const handleRunScenario = useCallback(async (scenario: SimulationScenario) => {
    setIsRunning(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Use first mock result
    setSelectedResult(simulationResults[0]);
    setActiveTab('results');
    setIsRunning(false);
  }, []);

  const handleEditScenario = useCallback((scenario: SimulationScenario) => {
    setBuilderScenarios([...scenario.params]);
    setBuilderMonteCarloConfig(scenario.monte_carlo_config);
    setActiveTab('builder');
  }, []);

  const handleDeleteScenario = useCallback((scenario: SimulationScenario) => {
    // In production, would call API
    console.log('Delete scenario:', scenario.id);
  }, []);

  const handleViewResults = useCallback((scenario: SimulationScenario) => {
    const result = simulationResults.find(r => r.scenario_id === scenario.id);
    if (result) {
      setSelectedResult(result);
      setActiveTab('results');
    }
  }, []);

  // Handle builder actions
  const handleRunSimulation = useCallback(async () => {
    setIsRunning(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Use first mock result
    setSelectedResult(simulationResults[0]);
    setActiveTab('results');
    setIsRunning(false);
  }, []);

  const handleSaveScenario = useCallback(() => {
    // In production, would call API
    console.log('Save scenario:', builderScenarios);
  }, [builderScenarios]);

  return (
    <div className="space-y-4 animate-in fade-in" data-testid="simulation-sandbox-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
            <Link href="/compliance" className="hover:text-zinc-900 transition-colors">
              Compliance
            </Link>
            <span>/</span>
            <span className="text-zinc-900">Simulation Sandbox</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-purple-600" />
            Simulation Sandbox
          </h1>
          <p className="text-zinc-500">
            Model future scenarios, run stress tests, and analyze covenant cascade effects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setActiveTab('scenarios')}
            data-testid="view-scenarios-btn"
          >
            <History className="w-4 h-4 mr-2" />
            My Scenarios
          </Button>
          <Button
            onClick={() => {
              setBuilderScenarios([]);
              setBuilderMonteCarloConfig(undefined);
              setActiveTab('builder');
            }}
            data-testid="new-simulation-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Simulation
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <SimulationStatsBar stats={simulationDashboardStats} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewMode)}>
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <Activity className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="scenarios" data-testid="tab-scenarios">
            <Layers className="w-4 h-4 mr-2" />
            My Scenarios
          </TabsTrigger>
          <TabsTrigger value="builder" data-testid="tab-builder">
            <Settings className="w-4 h-4 mr-2" />
            Builder
          </TabsTrigger>
          {selectedResult && (
            <TabsTrigger value="results" data-testid="tab-results">
              <TrendingDown className="w-4 h-4 mr-2" />
              Results
            </TabsTrigger>
          )}
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Quick Start Templates */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quick Start Templates</CardTitle>
                <CardDescription>Pre-configured stress scenarios matching regulatory requirements</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('templates')}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stressTestTemplates.slice(0, 4).map((template, idx) => (
                  <StressTestTemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleSelectTemplate}
                    onClone={handleCloneTemplate}
                    index={idx}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Scenarios */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Scenarios</CardTitle>
                <CardDescription>Your latest simulation scenarios and results</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('scenarios')}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedScenarios.slice(0, 3).map((scenario, idx) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    onRun={handleRunScenario}
                    onEdit={handleEditScenario}
                    onDelete={handleDeleteScenario}
                    onViewResults={handleViewResults}
                    index={idx}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Latest Results Preview */}
          {simulationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Simulation Results</CardTitle>
                <CardDescription>Most recent analysis from your scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <SimulationResultsSummary result={simulationResults[0]} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-zinc-900">Top Impacts</h4>
                    {simulationResults[0].covenant_impacts.slice(0, 3).map((impact, idx) => (
                      <CovenantImpactCard key={impact.covenant_id} impact={impact} index={idx} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="templates-search-input"
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-zinc-100">regulatory</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-zinc-100">rate-shock</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-zinc-100">ebitda</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-zinc-100">m&a</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template, idx) => (
              <StressTestTemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
                onClone={handleCloneTemplate}
                index={idx}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <FileText className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                <p className="text-zinc-500">No templates found matching your search.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search scenarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="scenarios-search-input"
              />
            </div>
            <Button onClick={() => {
              setBuilderScenarios([]);
              setBuilderMonteCarloConfig(undefined);
              setActiveTab('builder');
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Scenario
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScenarios.map((scenario, idx) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onRun={handleRunScenario}
                onEdit={handleEditScenario}
                onDelete={handleDeleteScenario}
                onViewResults={handleViewResults}
                index={idx}
              />
            ))}
          </div>

          {filteredScenarios.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Layers className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                <p className="text-zinc-500">No scenarios found.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setBuilderScenarios([]);
                    setBuilderMonteCarloConfig(undefined);
                    setActiveTab('builder');
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Scenario
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ScenarioConfigPanel
                scenarios={builderScenarios}
                monteCarloConfig={builderMonteCarloConfig}
                onScenariosChange={setBuilderScenarios}
                onMonteCarloConfigChange={setBuilderMonteCarloConfig}
                onRun={handleRunSimulation}
                onSave={handleSaveScenario}
                isRunning={isRunning}
              />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Preview</CardTitle>
                  <CardDescription>Preview of scenario effects before running</CardDescription>
                </CardHeader>
                <CardContent>
                  {builderScenarios.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <FlaskConical className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                      <p>Add scenarios to see preview</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-zinc-50 rounded-lg">
                        <p className="text-sm font-medium text-zinc-900">
                          {builderScenarios.length} scenario{builderScenarios.length > 1 ? 's' : ''} configured
                        </p>
                        <p className="text-xs text-zinc-500">
                          {builderMonteCarloConfig
                            ? `Monte Carlo with ${builderMonteCarloConfig.iterations.toLocaleString()} iterations`
                            : 'Deterministic simulation'}
                        </p>
                      </div>
                      {builderScenarios.map((scenario) => (
                        <div key={scenario.id} className="p-3 border border-zinc-200 rounded-lg">
                          <p className="text-sm font-medium">{scenario.name}</p>
                          <p className="text-xs text-zinc-500">
                            {scenario.time_horizon_quarters} quarters &bull; {scenario.severity}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Results Tab */}
        {selectedResult && (
          <TabsContent value="results" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SimulationResultsSummary result={selectedResult} />
                {selectedResult.monte_carlo_result && (
                  <MonteCarloResultsPanel result={selectedResult.monte_carlo_result} />
                )}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-zinc-900">Covenant Impacts</h3>
                {selectedResult.covenant_impacts.map((impact, idx) => (
                  <CovenantImpactCard key={impact.covenant_id} impact={impact} index={idx} />
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
});
