'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Bell,
  Download,
  RefreshCw,
  ArrowRight,
  Globe,
  Building2,
  AlertTriangle,
  CheckCircle,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BenchmarkStatsBar,
  BenchmarkFiltersBar,
  IndustryBenchmarkCard,
  CovenantTrendChart,
  MarketComparisonAlertCard,
  NetworkContributionCard,
} from './components';
import {
  benchmarkDashboardStats,
  mockIndustryBenchmarks,
  mockBenchmarkTrends,
  mockCovenantBenchmarkComparisons,
  mockMarketComparisonAlerts,
  mockNetworkContributionStatus,
  getUnacknowledgedAlerts,
} from '../lib';
import type { IndustrySector, CompanySize, BenchmarkCovenantType } from '../lib';

type ViewMode = 'benchmarks' | 'trends' | 'alerts' | 'comparisons';

export const BenchmarkNetworkPage = memo(function BenchmarkNetworkPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('benchmarks');
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<IndustrySector | 'all'>('all');
  const [companySizeFilter, setCompanySizeFilter] = useState<CompanySize | 'all'>('all');
  const [covenantTypeFilter, setCovenantTypeFilter] = useState<BenchmarkCovenantType | 'all'>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<'3m' | '6m' | '1y' | '2y' | 'all'>('1y');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  // Filter benchmarks
  const filteredBenchmarks = useMemo(() => {
    return mockIndustryBenchmarks.filter((benchmark) => {
      const matchesSearch =
        searchQuery === '' ||
        benchmark.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        benchmark.covenant_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = industryFilter === 'all' || benchmark.industry === industryFilter;
      const matchesSize = companySizeFilter === 'all' || benchmark.company_size === companySizeFilter;
      const matchesType = covenantTypeFilter === 'all' || benchmark.covenant_type === covenantTypeFilter;
      return matchesSearch && matchesIndustry && matchesSize && matchesType;
    });
  }, [searchQuery, industryFilter, companySizeFilter, covenantTypeFilter]);

  // Filter trends
  const filteredTrends = useMemo(() => {
    return mockBenchmarkTrends.filter((trend) => {
      const matchesIndustry = industryFilter === 'all' || trend.industry === industryFilter;
      const matchesType = covenantTypeFilter === 'all' || trend.covenant_type === covenantTypeFilter;
      return matchesIndustry && matchesType;
    });
  }, [industryFilter, covenantTypeFilter]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return mockMarketComparisonAlerts.filter((alert) => {
      if (!showAcknowledged && alert.acknowledged) return false;
      const matchesSearch =
        searchQuery === '' ||
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.borrower_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = covenantTypeFilter === 'all' || alert.covenant_type === covenantTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, covenantTypeFilter, showAcknowledged]);

  // Filter comparisons
  const filteredComparisons = useMemo(() => {
    return mockCovenantBenchmarkComparisons.filter((comparison) => {
      const matchesSearch =
        searchQuery === '' ||
        comparison.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comparison.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comparison.covenant_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = industryFilter === 'all' || comparison.industry === industryFilter;
      const matchesSize = companySizeFilter === 'all' || comparison.company_size === companySizeFilter;
      const matchesType = covenantTypeFilter === 'all' || comparison.covenant_type === covenantTypeFilter;
      return matchesSearch && matchesIndustry && matchesSize && matchesType;
    });
  }, [searchQuery, industryFilter, companySizeFilter, covenantTypeFilter]);

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    // In a real app, this would call an API
    console.log('Acknowledge alert:', alertId);
  }, []);

  const handleViewAlertDetails = useCallback((alertId: string) => {
    // In a real app, this would navigate to alert details
    console.log('View alert details:', alertId);
  }, []);

  const unacknowledgedCount = getUnacknowledgedAlerts().length;

  return (
    <div className="space-y-6 animate-in fade-in" data-testid="benchmark-network-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
            <Link href="/compliance" className="hover:text-zinc-900 transition-colors">
              Compliance
            </Link>
            <span>/</span>
            <span className="text-zinc-900">Benchmark Network</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Covenant Benchmark Intelligence</h1>
          <p className="text-zinc-500">
            Compare your covenant terms to anonymized industry benchmarks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hover:shadow-sm transition-all" data-testid="sync-data-btn">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Data
          </Button>
          <Button variant="outline" className="hover:shadow-sm transition-all" data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <BenchmarkStatsBar stats={benchmarkDashboardStats} />

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-4">
        <Button
          variant={viewMode === 'benchmarks' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('benchmarks')}
          className={cn(viewMode === 'benchmarks' && 'bg-blue-600 hover:bg-blue-700')}
          data-testid="view-benchmarks-btn"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Industry Benchmarks
        </Button>
        <Button
          variant={viewMode === 'trends' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('trends')}
          className={cn(viewMode === 'trends' && 'bg-blue-600 hover:bg-blue-700')}
          data-testid="view-trends-btn"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Market Trends
        </Button>
        <Button
          variant={viewMode === 'comparisons' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('comparisons')}
          className={cn(viewMode === 'comparisons' && 'bg-blue-600 hover:bg-blue-700')}
          data-testid="view-comparisons-btn"
        >
          <Building2 className="w-4 h-4 mr-2" />
          Your Comparisons
        </Button>
        <Button
          variant={viewMode === 'alerts' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('alerts')}
          className={cn(viewMode === 'alerts' && 'bg-blue-600 hover:bg-blue-700')}
          data-testid="view-alerts-btn"
        >
          <Bell className="w-4 h-4 mr-2" />
          Market Alerts
          {unacknowledgedCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unacknowledgedCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      <BenchmarkFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        industryFilter={industryFilter}
        onIndustryChange={setIndustryFilter}
        companySizeFilter={companySizeFilter}
        onCompanySizeChange={setCompanySizeFilter}
        covenantTypeFilter={covenantTypeFilter}
        onCovenantTypeChange={setCovenantTypeFilter}
        timeRangeFilter={timeRangeFilter}
        onTimeRangeChange={setTimeRangeFilter}
      />

      {/* Content based on view mode */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'benchmarks' && (
            <>
              {filteredBenchmarks.length > 0 ? (
                <div className="space-y-4">
                  {filteredBenchmarks.map((benchmark, index) => {
                    const comparison = mockCovenantBenchmarkComparisons.find(
                      (c) =>
                        c.covenant_type === benchmark.covenant_type &&
                        c.industry === benchmark.industry
                    );
                    return (
                      <IndustryBenchmarkCard
                        key={benchmark.id}
                        benchmark={benchmark}
                        comparison={comparison}
                        index={index}
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                    <p className="text-zinc-500">No benchmarks found matching your filters.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {viewMode === 'trends' && (
            <>
              {filteredTrends.length > 0 ? (
                <div className="space-y-6">
                  {filteredTrends.map((trend, index) => (
                    <CovenantTrendChart key={`${trend.covenant_type}-${trend.industry}`} trend={trend} index={index} />
                  ))}
                </div>
              ) : (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                    <p className="text-zinc-500">No trends found matching your filters.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {viewMode === 'comparisons' && (
            <>
              {filteredComparisons.length > 0 ? (
                <div className="space-y-4">
                  {filteredComparisons.map((comparison, index) => {
                    const benchmark = mockIndustryBenchmarks.find(
                      (b) => b.id === comparison.benchmark_id
                    );
                    if (!benchmark) return null;
                    return (
                      <IndustryBenchmarkCard
                        key={comparison.covenant_id}
                        benchmark={benchmark}
                        comparison={comparison}
                        index={index}
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Building2 className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                    <p className="text-zinc-500">No comparisons found matching your filters.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {viewMode === 'alerts' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Market Comparison Alerts
                </h2>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAcknowledged}
                    onChange={(e) => setShowAcknowledged(e.target.checked)}
                    className="rounded border-zinc-300"
                    data-testid="show-acknowledged-checkbox"
                  />
                  Show acknowledged
                </label>
              </div>
              {filteredAlerts.length > 0 ? (
                <div className="space-y-4">
                  {filteredAlerts.map((alert, index) => (
                    <MarketComparisonAlertCard
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={handleAcknowledgeAlert}
                      onViewDetails={handleViewAlertDetails}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-4" />
                    <p className="text-zinc-500">
                      {showAcknowledged
                        ? 'No alerts found matching your filters.'
                        : 'All alerts have been acknowledged. Enable "Show acknowledged" to view past alerts.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Network Contribution Status */}
          <NetworkContributionCard status={mockNetworkContributionStatus} />

          {/* Quick Stats */}
          <Card className="animate-in fade-in slide-in-from-right-3">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Network Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Market Standard Covenants</span>
                <Badge className="bg-green-100 text-green-700">
                  {mockCovenantBenchmarkComparisons.filter((c) => c.market_position === 'market').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Tighter than Market</span>
                <Badge className="bg-red-100 text-red-700">
                  {mockCovenantBenchmarkComparisons.filter((c) => c.market_position === 'tight').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Looser than Market</span>
                <Badge className="bg-amber-100 text-amber-700">
                  {mockCovenantBenchmarkComparisons.filter((c) => c.market_position === 'loose').length}
                </Badge>
              </div>
              <div className="pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-500">Benchmark Coverage</span>
                  <span className="font-medium text-zinc-900">
                    {benchmarkDashboardStats.benchmark_coverage_percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2 transition-all"
                    style={{ width: `${benchmarkDashboardStats.benchmark_coverage_percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts Summary */}
          {unacknowledgedCount > 0 && viewMode !== 'alerts' && (
            <Card className="animate-in fade-in slide-in-from-right-3 border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  Unacknowledged Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 mb-3">
                  You have {unacknowledgedCount} alert{unacknowledgedCount > 1 ? 's' : ''} requiring attention.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('alerts')}
                  className="w-full bg-white hover:bg-amber-50"
                  data-testid="view-unacknowledged-alerts-btn"
                >
                  View Alerts
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="animate-in fade-in slide-in-from-right-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Understanding Benchmarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-zinc-600">
                <p>
                  <strong className="text-zinc-900">Percentile Rank:</strong> Shows where your covenant
                  sits compared to peers. 50th = market median.
                </p>
                <p>
                  <strong className="text-zinc-900">Tight vs. Loose:</strong> For maximum ratios, lower
                  is tighter. For minimum ratios, higher is tighter.
                </p>
                <p>
                  <strong className="text-zinc-900">Trend Direction:</strong> Shows if market thresholds
                  are becoming more or less restrictive over time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});
