'use client';

import React, { useState, useCallback } from 'react';
import {
  RecentActivitySection,
  UpcomingDeadlinesSection,
  StatDrilldownModal,
  PortfolioHealthScore,
  BenchmarkComparison,
  TrendAnalysis,
  RiskCorrelationEngine,
  StatsTopBar,
  CorrelationDiscovery,
} from './components';
import { PageContainer } from '@/components/layout';
import { toast } from '@/components/ui/use-toast';
import { DemoCard } from '@/lib/demo-guide';
import {
  stats,
  recentActivity,
  upcomingDeadlines,
  portfolioHealthData,
  mockRiskCorrelationDashboard,
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

  return (
    <PageContainer>
      <div className="space-y-3">
        {/* Stats Top Bar - Explorable Section */}
        <DemoCard sectionId="dashboard-stats" fullWidth>
          <StatsTopBar
            stats={stats.map((stat) => ({
              label: stat.label,
              value: stat.value,
              change: stat.change,
              trend: stat.trend,
              icon: <stat.icon className="w-4 h-4" />,
              onClick: () => handleStatClick(stat.label, stat.value),
              sparklineData: stat.sparklineData,
            }))}
          />
        </DemoCard>

        {/* Portfolio Health Score, Recent Activity, Upcoming Deadlines - Horizontal Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <PortfolioHealthScore
            data={portfolioHealthData}
            onViewBenchmarks={handleViewBenchmarks}
            onViewTrends={handleViewTrends}
          />
          {/* Recent Activity - Explorable Section */}
          <DemoCard sectionId="dashboard-activity" className="lg:col-span-2">
            <RecentActivitySection activities={recentActivity} />
          </DemoCard>
        </div>

        {/* Upcoming Deadlines + Correlation Discovery Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <UpcomingDeadlinesSection deadlines={upcomingDeadlines} />
          <CorrelationDiscovery />
        </div>

        {/* Risk Correlation Engine */}
        <RiskCorrelationEngine data={mockRiskCorrelationDashboard} />

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
      </div>
    </PageContainer>
  );
}
