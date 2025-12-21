'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Shield,
  Activity,
  TrendingUp,
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/components/layout';
import {
  IntelligencePanel,
  AlertCard,
  SignalCard,
  MetricCard,
  InlineAIAssist,
  StatsBar,
} from '@/components/intelligence';
import type {
  IntelligenceItem,
  AlertItem,
  SignalItem,
  MetricItem,
} from '@/components/intelligence';
import { cn } from '@/lib/utils';

// Mock data for portfolio intelligence
const mockIntelligenceItems: IntelligenceItem[] = [
  {
    id: 'int-1',
    domain: 'documents',
    title: 'Covenant Breach Risk Elevated',
    subtitle: 'ABC Corp Credit Agreement',
    description: 'Financial ratios trending toward breach threshold based on recent quarterly data.',
    severity: 'high',
    confidence: 87,
    aiSummary: 'Debt-to-EBITDA ratio has increased from 3.2x to 4.1x over the past quarter, approaching the 4.5x covenant threshold.',
    predictions: [
      { horizon: '30d', probability: 45 },
      { horizon: '90d', probability: 72 },
    ],
    factors: [
      { source: 'Q3 Financials', summary: 'Revenue declined 12% YoY', impact: 'negative' },
      { source: 'Market Analysis', summary: 'Industry headwinds persist', impact: 'negative' },
    ],
    status: 'new',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'int-2',
    domain: 'documents',
    title: 'Amendment Opportunity Detected',
    subtitle: 'XYZ Holdings Facility',
    description: 'Market conditions suggest favorable terms for refinancing or amendment.',
    severity: 'medium',
    confidence: 79,
    aiSummary: 'Current spread is 75bps above market. Peer facilities have been repriced successfully.',
    predictions: [
      { horizon: '30d', probability: 65 },
    ],
    status: 'under_review',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const mockAlerts: AlertItem[] = [
  {
    id: 'alert-1',
    domain: 'documents',
    type: 'covenant_breach',
    title: 'Interest Coverage Ratio Warning',
    message: 'DEF Industries ICR has fallen to 2.1x, triggering the 2.0x early warning threshold.',
    severity: 'critical',
    priority: 'critical',
    isRead: false,
    isDismissed: false,
    recommendation: 'Schedule borrower review meeting within 5 business days.',
    relatedEntity: { type: 'Document', id: 'doc-123', name: 'DEF Industries Credit Agreement' },
    timestamp: new Date().toISOString(),
  },
  {
    id: 'alert-2',
    domain: 'documents',
    type: 'maturity',
    title: 'Facility Maturity in 90 Days',
    message: 'GHI Corp revolving facility matures on March 15, 2025.',
    severity: 'high',
    priority: 'high',
    isRead: false,
    isDismissed: false,
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
];

const mockSignals: SignalItem[] = [
  {
    id: 'sig-1',
    domain: 'documents',
    type: 'market',
    title: 'Spread compression in leveraged loans',
    summary: 'BB-rated loan spreads have tightened 25bps over the past month.',
    direction: 'positive',
    changeValue: -25,
    changeUnit: 'bps',
    confidence: 92,
    signalStrength: 'strong',
    source: 'LCD Market Data',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'sig-2',
    domain: 'documents',
    type: 'news',
    title: 'Fed signals rate cut pause',
    summary: 'FOMC minutes indicate potential hold on further rate cuts.',
    direction: 'neutral',
    confidence: 78,
    signalStrength: 'moderate',
    source: 'Reuters',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockMetrics: MetricItem[] = [
  {
    id: 'metric-1',
    domain: 'documents',
    label: 'Total Documents',
    value: '1,247',
    trend: 'improving',
    change: '+12',
    changeDirection: 'up',
    icon: FileText,
    iconBgClass: 'bg-indigo-100',
    iconColorClass: 'text-indigo-600',
  },
  {
    id: 'metric-2',
    domain: 'documents',
    label: 'At Risk',
    value: '23',
    trend: 'stable',
    change: '-2',
    changeDirection: 'down',
    icon: AlertCircle,
    iconBgClass: 'bg-red-100',
    iconColorClass: 'text-red-600',
  },
  {
    id: 'metric-3',
    domain: 'documents',
    label: 'Pending Review',
    value: '47',
    trend: 'declining',
    change: '+8',
    changeDirection: 'up',
    icon: Clock,
    iconBgClass: 'bg-amber-100',
    iconColorClass: 'text-amber-600',
  },
  {
    id: 'metric-4',
    domain: 'documents',
    label: 'Compliant',
    value: '1,177',
    trend: 'improving',
    change: '+6',
    changeDirection: 'up',
    icon: CheckCircle,
    iconBgClass: 'bg-green-100',
    iconColorClass: 'text-green-600',
  },
];

export function PortfolioIntelligencePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [insights, setInsights] = useState<IntelligenceItem[]>(mockIntelligenceItems);
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [signals, setSignals] = useState<SignalItem[]>(mockSignals);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const handleAlertStatusChange = useCallback((id: string, status: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === id
        ? { ...alert, isRead: status === 'acknowledged', isDismissed: status === 'dismissed' }
        : alert
    ));
  }, []);

  const handleInsightAction = useCallback((id: string, action: string) => {
    console.log('Insight action:', id, action);
  }, []);

  // Stats for the stats bar
  const statsBarItems = useMemo(() => [
    { id: 'total', label: 'Total Documents', value: '1,247', change: '+12 this week', changeDirection: 'up' as const },
    { id: 'at-risk', label: 'At Risk', value: '23', change: '-2 from last week', changeDirection: 'down' as const },
    { id: 'pending', label: 'Pending Review', value: '47', change: '+8 new', changeDirection: 'up' as const },
    { id: 'ai-insights', label: 'AI Insights', value: '15', change: '5 critical', changeDirection: 'up' as const },
  ], []);

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/documents')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Portfolio Intelligence</h1>
              <p className="text-sm text-zinc-500">
                Unified risk analysis, evolution tracking, and portfolio benchmarking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InlineAIAssist
              domain="documents"
              context={{
                domain: 'documents',
                entityType: 'portfolio',
                entityId: 'all',
                entityName: 'Document Portfolio',
              }}
              variant="popover"
              actions={['explain', 'suggest', 'analyze']}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('w-4 h-4 mr-1', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <StatsBar
          domain="documents"
          stats={statsBarItems}
          variant="horizontal"
          size="md"
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="overview" className="text-sm">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-sm">
              <Shield className="w-4 h-4 mr-1.5" />
              Risk Analysis
            </TabsTrigger>
            <TabsTrigger value="evolution" className="text-sm">
              <Activity className="w-4 h-4 mr-1.5" />
              Evolution
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="text-sm">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Benchmarking
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Metrics Cards */}
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                {mockMetrics.map((metric) => (
                  <MetricCard
                    key={metric.id}
                    metric={metric}
                    variant="compact"
                  />
                ))}
              </div>

              {/* Quick Intelligence Panel */}
              <IntelligencePanel
                domain="documents"
                insights={insights}
                alerts={alerts}
                signals={signals}
                compact
                maxItems={3}
                onAlertStatusChange={handleAlertStatusChange}
                onItemAction={(type, id, action) => console.log(type, id, action)}
              />
            </div>

            {/* Full Intelligence Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <IntelligencePanel
                domain="documents"
                title="AI Insights"
                insights={insights}
                alerts={[]}
                signals={[]}
                tabs={['insights']}
                onItemAction={handleInsightAction}
              />
              <IntelligencePanel
                domain="documents"
                title="Market Signals"
                insights={[]}
                alerts={[]}
                signals={signals}
                tabs={['signals']}
              />
            </div>
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Risk Stats */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      Risk Overview
                    </CardTitle>
                    <CardDescription>
                      AI-powered risk detection across your document portfolio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-2xl font-bold text-red-700">8</p>
                        <p className="text-xs text-red-600">Critical Risks</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="text-2xl font-bold text-amber-700">15</p>
                        <p className="text-xs text-amber-600">High Priority</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-50 border border-green-100">
                        <p className="text-2xl font-bold text-green-700">1,224</p>
                        <p className="text-xs text-green-600">Low Risk</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Risk Insights */}
              <IntelligencePanel
                domain="documents"
                title="Risk Alerts"
                insights={[]}
                alerts={alerts}
                signals={[]}
                tabs={['alerts']}
                onAlertStatusChange={handleAlertStatusChange}
              />
            </div>

            {/* Risk Intelligence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.filter(i => i.severity === 'critical' || i.severity === 'high').map((insight) => (
                <Card key={insight.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-zinc-900">{insight.title}</h4>
                        <p className="text-xs text-zinc-500">{insight.subtitle}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600 mb-3">{insight.aiSummary}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {insight.confidence}% confidence
                      </span>
                      {insight.predictions && (
                        <span>
                          {insight.predictions[0].probability}% probability in {insight.predictions[0].horizon}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Evolution Tab */}
          <TabsContent value="evolution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Document Evolution Engine
                </CardTitle>
                <CardDescription>
                  Track amendments, market trends, and optimization opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                    <p className="text-xl font-bold text-indigo-700">12</p>
                    <p className="text-xs text-indigo-600">Active Suggestions</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                    <p className="text-xl font-bold text-green-700">$2.4M</p>
                    <p className="text-xs text-green-600">Potential Savings</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                    <p className="text-xl font-bold text-purple-700">8</p>
                    <p className="text-xs text-purple-600">In Progress</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <p className="text-xl font-bold text-zinc-700">45</p>
                    <p className="text-xs text-zinc-600">Completed YTD</p>
                  </div>
                </div>

                {/* Evolution Signals */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-zinc-700">Recent Signals</h4>
                  {signals.map((signal) => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      compact
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benchmarking Tab */}
          <TabsContent value="benchmark" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Portfolio Benchmarking
                </CardTitle>
                <CardDescription>
                  Compare your portfolio against market standards and peer groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg border">
                    <p className="text-xs text-zinc-500 mb-1">Avg. Spread vs Market</p>
                    <p className="text-lg font-semibold text-green-600">-15 bps</p>
                    <p className="text-xs text-zinc-400">Better than market</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-xs text-zinc-500 mb-1">Covenant Compliance</p>
                    <p className="text-lg font-semibold text-zinc-900">98.2%</p>
                    <p className="text-xs text-zinc-400">Industry avg: 94.5%</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-xs text-zinc-500 mb-1">Documentation Quality</p>
                    <p className="text-lg font-semibold text-zinc-900">A</p>
                    <p className="text-xs text-zinc-400">Top quartile</p>
                  </div>
                </div>

                <div className="text-center py-8 text-zinc-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm">Detailed benchmarking charts coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
