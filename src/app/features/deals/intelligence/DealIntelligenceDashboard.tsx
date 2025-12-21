'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Target,
  TrendingUp,
  Lightbulb,
  Building2,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import {
  MarketBenchmarkCard,
  CovenantBenchmarkGrid,
  TrendAnalysisChart,
  MarginHistoryChart,
  DealComparisonTable,
  MarketInsightsPanel,
  MarketStatsSummary,
  StructureTermsComparison,
} from './components';
import {
  mockIntelligenceData,
  mockCurrentDealBenchmark,
  mockPeerComparisons,
  mockTrendData,
  mockInsights,
  mockMarketStats,
  formatCurrency,
  getPositionColor,
  getPositionBgColor,
} from './lib';

interface DealIntelligenceDashboardProps {
  dealId?: string;
}

export function DealIntelligenceDashboard({ dealId: _dealId }: DealIntelligenceDashboardProps) {
  // _dealId is available for future use when fetching deal-specific benchmarks from API
  const [activeTab, setActiveTab] = useState('overview');
  const [borrowerProfileFilter, setBorrowerProfileFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // In a real app, this would fetch data based on dealId and filters
  const dashboardData = useMemo(() => mockIntelligenceData, []);
  const currentDeal = dashboardData.currentDeal || mockCurrentDealBenchmark;

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleExport = () => {
    // In a real app, this would generate a PDF or Excel report
    console.log('Exporting intelligence report...');
  };

  return (
    <div className="space-y-6" data-testid="deal-intelligence-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/deals">
            <Button variant="ghost" size="icon" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900">Deal Intelligence</h1>
              <Badge
                variant="outline"
                className={cn(
                  'text-sm',
                  getPositionBgColor(currentDeal.marketPosition),
                  getPositionColor(currentDeal.marketPosition)
                )}
                data-testid="deal-position-badge"
              >
                {currentDeal.marketPosition === 'favorable'
                  ? 'Favorable Terms'
                  : currentDeal.marketPosition === 'aggressive'
                    ? 'Aggressive Pricing'
                    : 'At Market'}
              </Badge>
            </div>
            <p className="text-zinc-500">{currentDeal.dealName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="refresh-btn"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold',
                  currentDeal.overallScore >= 70 && 'bg-green-100 text-green-700 border-4 border-green-200',
                  currentDeal.overallScore >= 50 && currentDeal.overallScore < 70 && 'bg-blue-100 text-blue-700 border-4 border-blue-200',
                  currentDeal.overallScore < 50 && 'bg-amber-100 text-amber-700 border-4 border-amber-200'
                )}
                data-testid="overall-score"
              >
                {currentDeal.overallScore}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Market Position Score</h2>
                <p className="text-sm text-zinc-500 max-w-md">
                  Based on comparison of margin, covenants, and structure terms against{' '}
                  {mockMarketStats.totalDeals.toLocaleString()} anonymized market deals totaling{' '}
                  {formatCurrency(mockMarketStats.totalVolume, true)} in volume.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-zinc-900">{currentDeal.margin.current}%</p>
                <p className="text-xs text-zinc-500">Current Margin</p>
                <p className="text-xs text-green-600">vs {currentDeal.margin.marketMedian}% market</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-zinc-900">
                  {currentDeal.covenants.find((c) => c.type === 'leverage')?.current || '-'}x
                </p>
                <p className="text-xs text-zinc-500">Max Leverage</p>
                <p className="text-xs text-green-600">
                  vs {currentDeal.covenants.find((c) => c.type === 'leverage')?.marketMedian || '-'}x market
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-zinc-900">{formatCurrency(currentDeal.facilitySize, true)}</p>
                <p className="text-xs text-zinc-500">Facility Size</p>
                <p className="text-xs text-zinc-400">{currentDeal.facilityType.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Stats Summary */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-200">
        <MarketStatsSummary
          totalDeals={mockMarketStats.totalDeals}
          totalVolume={mockMarketStats.totalVolume}
          avgMargin={mockMarketStats.avgMargin}
          marginTrend={mockMarketStats.marginTrend}
          avgLeverage={mockMarketStats.avgLeverage}
          leverageTrend={mockMarketStats.leverageTrend}
          avgTenor={mockMarketStats.avgTenor}
          tenorTrend={mockMarketStats.tenorTrend}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-in fade-in slide-in-from-top-4 duration-500 delay-300">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
              <Target className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="benchmarks" className="flex items-center gap-2" data-testid="tab-benchmarks">
              <BarChart3 className="w-4 h-4" />
              Benchmarks
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2" data-testid="tab-trends">
              <TrendingUp className="w-4 h-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="comparisons" className="flex items-center gap-2" data-testid="tab-comparisons">
              <Building2 className="w-4 h-4" />
              Peer Deals
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2" data-testid="tab-insights">
              <Lightbulb className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <Select value={borrowerProfileFilter} onValueChange={setBorrowerProfileFilter}>
              <SelectTrigger className="w-40" data-testid="filter-borrower-profile">
                <SelectValue placeholder="Borrower Profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                <SelectItem value="investment_grade">Investment Grade</SelectItem>
                <SelectItem value="leveraged">Leveraged</SelectItem>
                <SelectItem value="middle_market">Middle Market</SelectItem>
                <SelectItem value="sponsor_backed">Sponsor-Backed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-40" data-testid="filter-industry">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="financial_services">Financial Services</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Margin Benchmark */}
            <MarketBenchmarkCard
              title="Interest Margin"
              description="Comparison of proposed margin against market pricing for similar deals"
              current={currentDeal.margin.current}
              marketMedian={currentDeal.margin.marketMedian}
              marketP25={currentDeal.margin.marketP25}
              marketP75={currentDeal.margin.marketP75}
              unit="%"
              trend={currentDeal.margin.trend}
              trendValue={currentDeal.margin.trendPercentage}
            />

            {/* Leverage Benchmark */}
            {currentDeal.covenants.find((c) => c.type === 'leverage') && (
              <MarketBenchmarkCard
                title="Max Leverage Ratio"
                description="Leverage covenant comparison - lower is tighter protection for lenders"
                current={currentDeal.covenants.find((c) => c.type === 'leverage')!.current}
                marketMedian={currentDeal.covenants.find((c) => c.type === 'leverage')!.marketMedian}
                marketP25={currentDeal.covenants.find((c) => c.type === 'leverage')!.marketP25}
                marketP75={currentDeal.covenants.find((c) => c.type === 'leverage')!.marketP75}
                unit="x"
                tighterIsHigher={false}
              />
            )}

            {/* Interest Coverage Benchmark */}
            {currentDeal.covenants.find((c) => c.type === 'interest_coverage') && (
              <MarketBenchmarkCard
                title="Min Interest Coverage"
                description="Coverage covenant comparison - higher is tighter protection for lenders"
                current={currentDeal.covenants.find((c) => c.type === 'interest_coverage')!.current}
                marketMedian={currentDeal.covenants.find((c) => c.type === 'interest_coverage')!.marketMedian}
                marketP25={currentDeal.covenants.find((c) => c.type === 'interest_coverage')!.marketP25}
                marketP75={currentDeal.covenants.find((c) => c.type === 'interest_coverage')!.marketP75}
                unit="x"
                tighterIsHigher={true}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Market Insights Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockInsights.slice(0, 3).map((insight) => (
                  <div
                    key={insight.id}
                    className={cn(
                      'p-3 rounded-lg text-sm',
                      insight.impact === 'positive' && 'bg-green-50 text-green-700',
                      insight.impact === 'negative' && 'bg-amber-50 text-amber-700',
                      insight.impact === 'neutral' && 'bg-zinc-50 text-zinc-700'
                    )}
                  >
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-xs mt-1 opacity-80">{insight.description.slice(0, 100)}...</p>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveTab('insights')}
                >
                  View All Insights
                </Button>
              </CardContent>
            </Card>

            {/* Structure Terms Comparison */}
            <StructureTermsComparison terms={currentDeal.structureTerms} />
          </div>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Margin Analysis</CardTitle>
              <CardDescription>12-month historical margin trends and your deal positioning</CardDescription>
            </CardHeader>
            <CardContent>
              <MarginHistoryChart
                data={currentDeal.margin.historicalData}
                currentMargin={currentDeal.margin.current}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Covenant Benchmarks</CardTitle>
              <CardDescription>Compare all covenant terms against market standards</CardDescription>
            </CardHeader>
            <CardContent>
              <CovenantBenchmarkGrid covenants={currentDeal.covenants} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysisChart
            trendData={mockTrendData}
            historicalMargin={currentDeal.margin.historicalData}
          />
        </TabsContent>

        {/* Comparisons Tab */}
        <TabsContent value="comparisons" className="space-y-6">
          <DealComparisonTable
            currentDeal={currentDeal}
            peerDeals={mockPeerComparisons}
            onDealClick={(id) => console.log('Navigate to deal:', id)}
          />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <MarketInsightsPanel insights={mockInsights} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
