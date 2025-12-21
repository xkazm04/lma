'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  RefreshCw,
  Download,
  Settings2,
  Sparkles,
  Network,
  Target,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import {
  PredictionScoreCard,
  StickingPointsPanel,
  StrategiesPanel,
  SimilarDealsPanel,
  MarketInsightsGrid,
  KnowledgeGraphVisualization,
  CounterpartyInsightsPanel,
  OptimalTermsPanel,
} from './components';
import {
  mockDealPrediction,
  mockMarketInsights,
  mockGraphVisualization,
  mockDashboardData,
} from './lib';

interface PredictiveIntelligenceDashboardProps {
  dealId?: string;
  dealName?: string;
}

export function PredictiveIntelligenceDashboard({
  dealId: _dealId,
  dealName = 'Apex Manufacturing Term Loan B',
}: PredictiveIntelligenceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // In production, this would fetch real data based on dealId
  const prediction = mockDealPrediction;
  const insights = mockMarketInsights;
  const graphData = mockGraphVisualization;
  const dashboardData = mockDashboardData;

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleExport = () => {
    console.log('Exporting predictive intelligence report...');
  };

  const handleViewTermDetails = (termId: string) => {
    console.log('View term details:', termId);
  };

  const handleApplyStrategy = (strategyId: string) => {
    console.log('Apply strategy:', strategyId);
  };

  const handleViewDeal = (dealId: string) => {
    console.log('View similar deal:', dealId);
  };

  const handleNodeClick = (nodeId: string) => {
    console.log('Graph node clicked:', nodeId);
  };

  const handleViewCounterpartyHistory = (counterpartyId: string) => {
    console.log('View counterparty history:', counterpartyId);
  };

  return (
    <div className="space-y-6" data-testid="predictive-intelligence-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/deals">
            <Button variant="ghost" size="icon" data-testid="back-to-deals-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-500" />
              <h1 className="text-2xl font-bold text-zinc-900">
                Predictive Intelligence
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  'text-sm',
                  prediction.predictions.closingProbability >= 0.75
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : prediction.predictions.closingProbability >= 0.5
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                )}
                data-testid="deal-status-badge"
              >
                {prediction.predictions.closingProbability >= 0.75
                  ? 'High Success Probability'
                  : prediction.predictions.closingProbability >= 0.5
                    ? 'Moderate Outlook'
                    : 'Needs Attention'}
              </Badge>
            </div>
            <p className="text-zinc-500">{dealName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="refresh-predictions-btn"
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-testid="export-report-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" data-testid="settings-btn">
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Prediction Score */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
        <PredictionScoreCard prediction={prediction} />
      </div>

      {/* Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="animate-in fade-in slide-in-from-top-4 duration-500 delay-200"
      >
        <TabsList>
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2"
            data-testid="tab-overview"
          >
            <Target className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="strategies"
            className="flex items-center gap-2"
            data-testid="tab-strategies"
          >
            <Sparkles className="w-4 h-4" />
            Strategies
          </TabsTrigger>
          <TabsTrigger
            value="graph"
            className="flex items-center gap-2"
            data-testid="tab-graph"
          >
            <Network className="w-4 h-4" />
            Knowledge Graph
          </TabsTrigger>
          <TabsTrigger
            value="counterparties"
            className="flex items-center gap-2"
            data-testid="tab-counterparties"
          >
            <MessageSquare className="w-4 h-4" />
            Counterparties
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Sticking Points */}
            <StickingPointsPanel
              stickingPoints={prediction.predictions.likelyStickingPoints}
              onViewDetails={handleViewTermDetails}
            />

            {/* Similar Deals */}
            <SimilarDealsPanel
              similarDeals={dashboardData.historicalComparisons.similarDeals}
              avgMetrics={dashboardData.historicalComparisons.avgMetrics}
              onViewDeal={handleViewDeal}
            />
          </div>

          {/* Market Insights */}
          <MarketInsightsGrid
            insights={insights}
            onViewDetails={(id) => console.log('View insight:', id)}
          />
        </TabsContent>

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <StrategiesPanel
                strategies={prediction.predictions.recommendedStrategies}
                onApplyStrategy={handleApplyStrategy}
              />
            </div>

            <OptimalTermsPanel
              optimalStructure={prediction.predictions.optimalTermStructure}
              onApplyTerm={(key, value) =>
                console.log('Apply term:', key, value)
              }
              onApplyAll={() => console.log('Apply all optimal terms')}
            />

            <StickingPointsPanel
              stickingPoints={prediction.predictions.likelyStickingPoints}
              onViewDetails={handleViewTermDetails}
            />
          </div>
        </TabsContent>

        {/* Knowledge Graph Tab */}
        <TabsContent value="graph" className="space-y-6 mt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <KnowledgeGraphVisualization
                graphData={graphData}
                onNodeClick={handleNodeClick}
                onExpandGraph={() => console.log('Expand graph')}
              />
            </div>
            <div className="space-y-6">
              <SimilarDealsPanel
                similarDeals={dashboardData.historicalComparisons.similarDeals.slice(
                  0,
                  3
                )}
                avgMetrics={dashboardData.historicalComparisons.avgMetrics}
                onViewDeal={handleViewDeal}
              />
            </div>
          </div>
        </TabsContent>

        {/* Counterparties Tab */}
        <TabsContent value="counterparties" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-6">
            <CounterpartyInsightsPanel
              counterpartyInsights={prediction.predictions.counterpartyInsights}
              onViewHistory={handleViewCounterpartyHistory}
            />
            <div className="space-y-6">
              <OptimalTermsPanel
                optimalStructure={prediction.predictions.optimalTermStructure}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Assistant CTA */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Deal Assistant</h3>
              <p className="text-sm text-white/80">
                Get personalized negotiation advice and strategy recommendations
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-indigo-600 hover:bg-white/90"
            data-testid="ai-assistant-btn"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask AI Assistant
          </Button>
        </div>
      </div>
    </div>
  );
}
