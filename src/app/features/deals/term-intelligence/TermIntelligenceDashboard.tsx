'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  MarginDeltaChart,
  TermGroundAnalysisTable,
  NegotiationSequencesPanel,
  CounterpartyHeatmap,
  PortfolioPerformanceCard,
} from './components';
import {
  mockTermIntelligenceData,
  formatCurrency,
} from './lib';
import type { DealType, TermCategory } from './lib/types';

export function TermIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('12m');
  const [dealTypeFilter, setDealTypeFilter] = useState<DealType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const data = mockTermIntelligenceData;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleExport = () => {
    console.log('Exporting term intelligence report...');
  };

  // Filter margin deltas by deal type if selected
  const filteredMarginDeltas = useMemo(() => {
    if (dealTypeFilter === 'all') return data.marginDeltas;
    return data.marginDeltas.filter((d) => d.dealType === dealTypeFilter);
  }, [data.marginDeltas, dealTypeFilter]);

  return (
    <div className="space-y-6" data-testid="term-intelligence-dashboard">
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
              <h1 className="text-2xl font-bold text-zinc-900">Cross-Deal Term Intelligence</h1>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Executive Dashboard
              </Badge>
            </div>
            <p className="text-zinc-500">
              Strategic insights across {data.portfolioPerformance.totalDeals} deals |{' '}
              {formatCurrency(data.portfolioPerformance.totalVolume, true)} total volume
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="refresh-data-btn"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} data-testid="export-report-btn">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Portfolio Performance Summary */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
        <PortfolioPerformanceCard performance={data.portfolioPerformance} />
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="animate-in fade-in slide-in-from-top-4 duration-500 delay-200"
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="margin" className="flex items-center gap-2" data-testid="tab-margin">
              <TrendingUp className="w-4 h-4" />
              Margin Analysis
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2" data-testid="tab-terms">
              <Filter className="w-4 h-4" />
              Term Analysis
            </TabsTrigger>
            <TabsTrigger value="playbooks" className="flex items-center gap-2" data-testid="tab-playbooks">
              <Award className="w-4 h-4" />
              Playbooks
            </TabsTrigger>
            <TabsTrigger value="counterparties" className="flex items-center gap-2" data-testid="tab-counterparties">
              <Users className="w-4 h-4" />
              Counterparties
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32" data-testid="filter-date-range">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
                <SelectItem value="24m">Last 24 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dealTypeFilter} onValueChange={(v) => setDealTypeFilter(v as DealType | 'all')}>
              <SelectTrigger className="w-40" data-testid="filter-deal-type">
                <SelectValue placeholder="Deal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deal Types</SelectItem>
                <SelectItem value="new_facility">New Facility</SelectItem>
                <SelectItem value="amendment">Amendment</SelectItem>
                <SelectItem value="refinancing">Refinancing</SelectItem>
                <SelectItem value="extension">Extension</SelectItem>
                <SelectItem value="consent">Consent</SelectItem>
                <SelectItem value="waiver">Waiver</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Margin Delta Chart - Compact View */}
            <MarginDeltaChart
              marginDeltas={filteredMarginDeltas}
              timeSeries={data.marginDeltaTimeSeries}
              avgDelta={data.portfolioPerformance.avgMarginDelta}
              marketAvgDelta={-0.08}
            />

            {/* Counterparty Relationships - Compact View */}
            <CounterpartyHeatmap
              relationships={data.counterpartyRelationships.slice(0, 4)}
              heatmapData={data.counterpartyHeatmap}
            />
          </div>

          {/* Term Ground Analysis - Compact View */}
          <TermGroundAnalysisTable termAnalysis={data.termGroundAnalysis.slice(0, 4)} />

          {/* Negotiation Sequences Preview */}
          <NegotiationSequencesPanel sequences={data.negotiationSequences.slice(0, 2)} />
        </TabsContent>

        {/* Margin Analysis Tab */}
        <TabsContent value="margin" className="space-y-6">
          <MarginDeltaChart
            marginDeltas={filteredMarginDeltas}
            timeSeries={data.marginDeltaTimeSeries}
            avgDelta={data.portfolioPerformance.avgMarginDelta}
            marketAvgDelta={-0.08}
          />
        </TabsContent>

        {/* Term Analysis Tab */}
        <TabsContent value="terms" className="space-y-6">
          <TermGroundAnalysisTable termAnalysis={data.termGroundAnalysis} />
        </TabsContent>

        {/* Playbooks Tab */}
        <TabsContent value="playbooks" className="space-y-6">
          <NegotiationSequencesPanel sequences={data.negotiationSequences} />
        </TabsContent>

        {/* Counterparties Tab */}
        <TabsContent value="counterparties" className="space-y-6">
          <CounterpartyHeatmap
            relationships={data.counterpartyRelationships}
            heatmapData={data.counterpartyHeatmap}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
