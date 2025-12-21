'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Box, ArrowRight } from 'lucide-react';
import { InlineAIAssist } from '@/components/intelligence';
import {
  RecentActivitySection,
  UpcomingDeadlinesSection,
  StatDrilldownModal,
  PortfolioHealthScore,
  BenchmarkComparison,
  TrendAnalysis,
  RiskCorrelationEngine,
  StakeholderCommandCenter,
  StatsTopBar,
  CorrelationDiscovery,
  PortfolioAutopilot,
  ActionQueuePanel,
  AutopilotSettingsPanel,
} from './components';
import { Card, CardContent } from '@/components/ui/card';
import { PageContainer } from '@/components/layout';
import { toast } from '@/components/ui/use-toast';
import {
  stats,
  recentActivity,
  upcomingDeadlines,
  portfolioHealthData,
  mockRiskCorrelationDashboard,
  teamMembers,
  loanActivityStream,
  counterpartyActions,
  recentMentions,
  mockAutopilotDashboardData,
  mockActionQueueDashboardData,
  mockAutoApprovalThresholds,
  type StatDrilldownType,
} from './lib/mocks';

// Map stat labels to drilldown types
const statToDrilldownType: Record<string, StatDrilldownType> = {
  'Active Loans': 'loans',
  'Documents Processed': 'documents',
  'Upcoming Deadlines': 'deadlines',
  'Open Negotiations': 'negotiations',
  'ESG At Risk': 'esg',
};

export function DashboardPage() {
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [benchmarksOpen, setBenchmarksOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<{
    type: StatDrilldownType;
    title: string;
    value: string;
  } | null>(null);

  const handleStatClick = useCallback((label: string | null | undefined, value: string) => {
    // Validate label before lookup
    if (!label) {
      console.error('[DashboardPage] handleStatClick called with invalid label:', { label, value });
      toast({
        variant: 'destructive',
        title: 'Unable to open details',
        description: 'This statistic is missing required data. Please refresh the page or contact support if the issue persists.',
      });
      return;
    }

    const drilldownType = statToDrilldownType[label];
    if (!drilldownType) {
      console.warn('[DashboardPage] No drilldown type found for label:', { label, value, availableTypes: Object.keys(statToDrilldownType) });
      toast({
        variant: 'warning',
        title: 'Details unavailable',
        description: `No detailed view is available for "${label}".`,
      });
      return;
    }

    setSelectedStat({
      type: drilldownType,
      title: label,
      value: value,
    });
    setDrilldownOpen(true);
  }, []);

  const handleViewBenchmarks = useCallback(() => {
    setBenchmarksOpen(true);
  }, []);

  const handleViewTrends = useCallback(() => {
    setTrendsOpen(true);
  }, []);

  // Handler for opening settings modal
  const handleSettingsClick = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* AI Assist - Global Portfolio Intelligence */}
        <div className="flex justify-end">
          <InlineAIAssist
            domain="documents"
            context={{
              domain: 'documents',
              entityType: 'portfolio-dashboard',
              entityId: 'dashboard',
              entityName: 'Portfolio Dashboard',
            }}
            variant="popover"
            actions={['explain', 'suggest', 'analyze']}
          />
        </div>

        {/* Stats Top Bar */}
      <StatsTopBar
        stats={stats.map((stat) => ({
          label: stat.label,
          value: stat.value,
          change: stat.change,
          trend: stat.trend,
          icon: stat.icon,
          onClick: () => handleStatClick(stat.label, stat.value),
        }))}
      />

      {/* Portfolio Health Score, Recent Activity, Upcoming Deadlines - Horizontal Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PortfolioHealthScore
          data={portfolioHealthData}
          onViewBenchmarks={handleViewBenchmarks}
          onViewTrends={handleViewTrends}
        />
        <RecentActivitySection activities={recentActivity} />
        <UpcomingDeadlinesSection deadlines={upcomingDeadlines} />
      </div>

      {/* Portfolio Autopilot - AI-Powered Predictive Management */}
      <PortfolioAutopilot
        data={mockAutopilotDashboardData}
        onSettingsClick={handleSettingsClick}
      />

      {/* Action Queue Panel - Confidence-Weighted Execution */}
      <ActionQueuePanel
        data={mockActionQueueDashboardData}
        onSettingsClick={handleSettingsClick}
      />

      {/* Stakeholder Command Center - Real-time Collaboration */}
      <StakeholderCommandCenter
        teamMembers={teamMembers}
        loanActivities={loanActivityStream}
        counterpartyActions={counterpartyActions}
        mentions={recentMentions}
      />

      {/* Correlation Discovery - New First-Class Abstraction */}
      <CorrelationDiscovery />

      {/* Risk Correlation Engine */}
      <RiskCorrelationEngine
        data={mockRiskCorrelationDashboard}
      />

      {/* 3D Portfolio Visualization Link */}
      <Link href="/portfolio-3d" data-testid="portfolio-3d-link">
        <Card className="group cursor-pointer hover:shadow-lg hover:border-indigo-200 transition-all bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-indigo-100">
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-700 transition-colors">
                    3D Portfolio Landscape
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Explore borrower correlations in an immersive 3D environment with VR support
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  New
                </span>
                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Stat Drilldown Modal */}
      <StatDrilldownModal
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        type={selectedStat?.type || null}
        title={selectedStat?.title || ''}
        value={selectedStat?.value || ''}
      />

      {/* Benchmark Comparison Modal */}
      <BenchmarkComparison
        open={benchmarksOpen}
        onOpenChange={setBenchmarksOpen}
        benchmarks={portfolioHealthData.benchmarks}
        overallPercentile={portfolioHealthData.percentile}
      />

      {/* Trend Analysis Modal */}
      <TrendAnalysis
        open={trendsOpen}
        onOpenChange={setTrendsOpen}
        trendHistory={portfolioHealthData.trendHistory}
        components={portfolioHealthData.components}
        currentScore={portfolioHealthData.overallScore}
        previousScore={portfolioHealthData.previousScore}
      />

      {/* Autopilot Settings Panel */}
      <AutopilotSettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={mockAutopilotDashboardData.settings}
        thresholds={mockAutoApprovalThresholds}
      />
      </div>
    </PageContainer>
  );
}
