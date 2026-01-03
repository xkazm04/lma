'use client';

import React, { memo, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Brain,
  Filter,
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/layout';
import { DemoCard } from '@/lib/demo-guide';
import {
  AutopilotStatsBar,
  PredictionCard,
  SignalFeed,
  AlertsList,
  RemediationCard,
} from './components';
import {
  mockAutopilotDashboardStats,
  mockAutopilotPredictions,
  mockAutopilotAlerts,
  mockMarketSignals,
  mockTransactionPatterns,
  mockNewsSentiment,
  mockBenchmarkSignals,
  mockRemediationStrategies,
} from './lib';
import type { PredictionRiskLevel } from '../lib/types';

type TabValue = 'overview' | 'predictions' | 'signals' | 'remediations';
type RiskFilter = 'all' | PredictionRiskLevel;

export const AutopilotPage = memo(function AutopilotPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  const filteredPredictions = useMemo(() => {
    if (riskFilter === 'all') return mockAutopilotPredictions;
    return mockAutopilotPredictions.filter(
      (p) => p.overall_risk_level === riskFilter
    );
  }, [riskFilter]);

  const criticalPredictions = mockAutopilotPredictions.filter(
    (p) => p.overall_risk_level === 'critical' || p.overall_risk_level === 'high'
  );

  const handleAcknowledgeAlert = (alertId: string) => {
    console.log('Acknowledging alert:', alertId);
    // In production, this would call the API
  };

  const handleDismissAlert = (alertId: string) => {
    console.log('Dismissing alert:', alertId);
  };

  const handleViewPrediction = (predictionId: string) => {
    console.log('Viewing prediction:', predictionId);
    setActiveTab('predictions');
  };

  const handleRefreshSignals = () => {
    console.log('Refreshing signals...');
  };

  return (
    <PageContainer>
      <div className="space-y-4 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/compliance">
            <Button
              variant="ghost"
              size="sm"
              data-testid="back-to-compliance-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Predictive Compliance Autopilot
            </h1>
            <p className="text-zinc-500 text-sm">
              AI-powered early warning system with multi-signal intelligence
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <DemoCard sectionId="autopilot-stats" fullWidth>
          <AutopilotStatsBar stats={mockAutopilotDashboardStats} />
        </DemoCard>

      {/* Critical Alerts Banner */}
      {criticalPredictions.length > 0 && (
        <Card className="border-red-200 bg-red-50" data-testid="critical-alerts-banner">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-800">
                    {criticalPredictions.length} High/Critical Risk Prediction
                    {criticalPredictions.length > 1 ? 's' : ''} Detected
                  </p>
                  <p className="text-sm text-red-600">
                    Immediate attention required for{' '}
                    {criticalPredictions.map((p) => p.borrower_name).join(', ')}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setActiveTab('predictions');
                  setRiskFilter('critical');
                }}
                className="bg-red-600 hover:bg-red-700"
                data-testid="view-critical-btn"
              >
                View Critical
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <TrendingUp className="w-4 h-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="predictions" data-testid="tab-predictions">
            <Brain className="w-4 h-4 mr-1" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="signals" data-testid="tab-signals">
            <Activity className="w-4 h-4 mr-1" />
            Signals
          </TabsTrigger>
          <TabsTrigger value="remediations" data-testid="tab-remediations">
            <Shield className="w-4 h-4 mr-1" />
            Remediations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Alerts */}
            <div className="lg:col-span-2">
              <AlertsList
                alerts={mockAutopilotAlerts}
                onAcknowledge={handleAcknowledgeAlert}
                onDismiss={handleDismissAlert}
                onViewPrediction={handleViewPrediction}
              />
            </div>

            {/* Signal Feed Summary */}
            <div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Signal Summary
                  </CardTitle>
                  <CardDescription>Last 24 hours</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-sm font-medium text-blue-800">
                      Market Data
                    </span>
                    <Badge className="bg-blue-100 text-blue-700">
                      {mockMarketSignals.length} signals
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <span className="text-sm font-medium text-purple-800">
                      Transaction Patterns
                    </span>
                    <Badge className="bg-purple-100 text-purple-700">
                      {mockTransactionPatterns.length} patterns
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <span className="text-sm font-medium text-orange-800">
                      News Sentiment
                    </span>
                    <Badge className="bg-orange-100 text-orange-700">
                      {mockNewsSentiment.length} articles
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <span className="text-sm font-medium text-green-800">
                      Benchmark Updates
                    </span>
                    <Badge className="bg-green-100 text-green-700">
                      {mockBenchmarkSignals.length} updates
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab('signals')}
                    data-testid="view-all-signals-btn"
                  >
                    View All Signals
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Predictions */}
          <DemoCard sectionId="predictions" fullWidth>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Top Risk Predictions</CardTitle>
                  <CardDescription>
                    Covenants requiring immediate attention
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('predictions')}
                  data-testid="view-all-predictions-btn"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {criticalPredictions.slice(0, 2).map((prediction) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      onViewDetails={handleViewPrediction}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </DemoCard>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-500">Risk Level:</span>
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(
                (level) => (
                  <Button
                    key={level}
                    variant={riskFilter === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRiskFilter(level)}
                    className={cn(
                      riskFilter === level &&
                        level === 'critical' &&
                        'bg-red-600 hover:bg-red-700',
                      riskFilter === level &&
                        level === 'high' &&
                        'bg-orange-600 hover:bg-orange-700'
                    )}
                    data-testid={`filter-${level}`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                    {level !== 'all' && (
                      <Badge className="ml-1 text-xs bg-white/20">
                        {
                          mockAutopilotPredictions.filter(
                            (p) => p.overall_risk_level === level
                          ).length
                        }
                      </Badge>
                    )}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Predictions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPredictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                onViewDetails={handleViewPrediction}
                onGenerateRemediation={(id) => {
                  console.log('Generating remediation for:', id);
                  setActiveTab('remediations');
                }}
              />
            ))}
          </div>

          {filteredPredictions.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500">
                No predictions found for the selected filter
              </p>
            </div>
          )}
        </TabsContent>

        {/* Signals Tab */}
        <TabsContent value="signals" className="space-y-4">
          <SignalFeed
            marketSignals={mockMarketSignals}
            transactionPatterns={mockTransactionPatterns}
            newsSentiment={mockNewsSentiment}
            benchmarks={mockBenchmarkSignals}
            onRefresh={handleRefreshSignals}
          />
        </TabsContent>

        {/* Remediations Tab */}
        <TabsContent value="remediations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Active Remediation Strategies
              </h2>
              <p className="text-sm text-zinc-500">
                AI-generated strategies for at-risk covenants
              </p>
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="generate-new-remediation-btn"
            >
              <Brain className="w-4 h-4 mr-2" />
              Generate New Strategy
            </Button>
          </div>

          <div className="space-y-4">
            {mockRemediationStrategies.map((remediation) => (
              <RemediationCard
                key={remediation.id}
                remediation={remediation}
                onStartStep={(stepNumber) => {
                  console.log('Starting step:', stepNumber);
                }}
                onCompleteStep={(stepNumber) => {
                  console.log('Completing step:', stepNumber);
                }}
              />
            ))}
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
});

export default AutopilotPage;
