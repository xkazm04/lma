'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Brain,
  Activity,
  Lightbulb,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/components/layout';
import {
  IntelligencePanel,
  SignalCard,
  MetricCard,
  StatsBar,
} from '@/components/intelligence';
import type {
  IntelligenceItem,
  AlertItem,
  SignalItem,
  MetricItem,
} from '@/components/intelligence';
import { cn } from '@/lib/utils';

// Mock market signals
const mockMarketSignals: SignalItem[] = [
  {
    id: 'ms-1',
    domain: 'deals',
    type: 'market',
    title: 'SOFR tightening expected',
    summary: 'Market pricing indicates 25bps rate cut probability at 78%',
    direction: 'positive',
    changeValue: -25,
    changeUnit: 'bps',
    confidence: 78,
    signalStrength: 'strong',
    source: 'CME FedWatch',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'ms-2',
    domain: 'deals',
    type: 'market',
    title: 'Credit spreads widening',
    summary: 'BB spreads have widened 15bps over the past week',
    direction: 'negative',
    changeValue: 15,
    changeUnit: 'bps',
    confidence: 85,
    signalStrength: 'moderate',
    source: 'Bloomberg',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ms-3',
    domain: 'deals',
    type: 'news',
    title: 'Leveraged loan issuance surges',
    summary: 'Q4 leveraged loan volume up 45% YoY, highest since 2021',
    direction: 'positive',
    confidence: 92,
    signalStrength: 'strong',
    source: 'LCD News',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Mock term intelligence insights
const mockTermInsights: IntelligenceItem[] = [
  {
    id: 'ti-1',
    domain: 'deals',
    title: 'Pricing Opportunity Detected',
    subtitle: 'Project Alpha Facility',
    description: 'Current spread of SOFR+325bps is above market for comparable credits.',
    severity: 'medium',
    confidence: 82,
    aiSummary: 'Analysis of 45 comparable facilities shows median spread of SOFR+275bps. Potential savings of $1.2M annually.',
    predictions: [
      { horizon: '30d', probability: 70 },
    ],
    factors: [
      { source: 'Peer Analysis', summary: '75% of peers have tighter spreads', impact: 'positive' },
      { source: 'Market Trend', summary: 'Spreads have compressed 20bps in 60 days', impact: 'positive' },
    ],
    status: 'new',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ti-2',
    domain: 'deals',
    title: 'Covenant Package Review',
    subtitle: 'Project Beta Amendment',
    description: 'Proposed covenant package is aggressive vs. market standards.',
    severity: 'high',
    confidence: 75,
    aiSummary: 'Leverage ratio of 5.5x is in the top quartile of recent deals. Consider negotiating to 5.0x.',
    status: 'under_review',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Mock calendar events
const mockCalendarEvents = [
  { id: 'cal-1', title: 'Project Alpha - Term Sheet Due', date: '2025-01-15', type: 'deadline', priority: 'high' },
  { id: 'cal-2', title: 'Project Beta - Negotiation Call', date: '2025-01-10', type: 'meeting', priority: 'medium' },
  { id: 'cal-3', title: 'Market Intelligence Review', date: '2025-01-08', type: 'internal', priority: 'low' },
  { id: 'cal-4', title: 'Q1 Pipeline Review', date: '2025-01-20', type: 'internal', priority: 'medium' },
];

// Mock predictions
const mockPredictions: IntelligenceItem[] = [
  {
    id: 'pred-1',
    domain: 'deals',
    title: 'Deal Closure Probability',
    subtitle: 'Project Alpha',
    description: 'High likelihood of closing within 30 days based on current momentum.',
    severity: 'low',
    confidence: 85,
    predictions: [
      { horizon: '7d', probability: 45 },
      { horizon: '30d', probability: 85 },
      { horizon: '60d', probability: 95 },
    ],
    status: 'acknowledged',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pred-2',
    domain: 'deals',
    title: 'Execution Risk Alert',
    subtitle: 'Project Gamma',
    description: 'Multiple pending items may delay closing timeline.',
    severity: 'high',
    confidence: 72,
    predictions: [
      { horizon: '30d', probability: 35 },
    ],
    factors: [
      { source: 'Documentation', summary: '3 critical items outstanding', impact: 'negative' },
      { source: 'Counterparty', summary: 'Response delays observed', impact: 'negative' },
    ],
    status: 'new',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

export function DealIntelligencePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('market');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  // Stats bar items
  const statsItems = useMemo(() => [
    { id: 'active-deals', label: 'Active Deals', value: '24', change: '+3 this week', changeDirection: 'up' as const },
    { id: 'pipeline', label: 'Pipeline Value', value: '$2.4B', change: '+$150M', changeDirection: 'up' as const },
    { id: 'avg-spread', label: 'Avg. Spread', value: 'S+285bps', change: '-15bps', changeDirection: 'down' as const },
    { id: 'close-rate', label: 'Close Rate', value: '72%', change: '+5%', changeDirection: 'up' as const },
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
              onClick={() => router.push('/deals')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Deal Intelligence</h1>
              <p className="text-sm text-zinc-500">
                Market insights, term analytics, calendar, and deal predictions
              </p>
            </div>
          </div>
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

        {/* Stats Bar */}
        <StatsBar
          domain="deals"
          stats={statsItems}
          variant="horizontal"
          size="md"
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="market" className="text-sm">
              <Activity className="w-4 h-4 mr-1.5" />
              Market
            </TabsTrigger>
            <TabsTrigger value="terms" className="text-sm">
              <Brain className="w-4 h-4 mr-1.5" />
              Terms
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-sm">
              <Calendar className="w-4 h-4 mr-1.5" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-sm">
              <Lightbulb className="w-4 h-4 mr-1.5" />
              Predictions
            </TabsTrigger>
          </TabsList>

          {/* Market Overview Tab */}
          <TabsContent value="market" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Market Metrics */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      Market Conditions
                    </CardTitle>
                    <CardDescription>
                      Real-time market data and trends affecting your deals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-4 rounded-lg border">
                        <p className="text-xs text-zinc-500 mb-1">SOFR (30-day)</p>
                        <p className="text-lg font-semibold text-zinc-900">4.55%</p>
                        <p className="text-xs text-red-600 flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          -25bps expected
                        </p>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <p className="text-xs text-zinc-500 mb-1">BB Spread</p>
                        <p className="text-lg font-semibold text-zinc-900">285bps</p>
                        <p className="text-xs text-red-600 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          +15bps this week
                        </p>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <p className="text-xs text-zinc-500 mb-1">Market Sentiment</p>
                        <p className="text-lg font-semibold text-green-600">Bullish</p>
                        <p className="text-xs text-zinc-400">Based on flows</p>
                      </div>
                    </div>

                    {/* Market Signals */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-zinc-700">Live Market Signals</h4>
                      {mockMarketSignals.map((signal) => (
                        <SignalCard
                          key={signal.id}
                          signal={signal}
                          compact
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Intelligence */}
              <IntelligencePanel
                domain="deals"
                title="Market Alerts"
                insights={[]}
                alerts={[]}
                signals={mockMarketSignals}
                tabs={['signals']}
                compact
              />
            </div>
          </TabsContent>

          {/* Term Analytics Tab */}
          <TabsContent value="terms" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Term Intelligence Insights
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis of deal terms and market comparables
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockTermInsights.map((insight) => (
                    <div key={insight.id} className="p-4 rounded-lg border border-zinc-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-zinc-900">{insight.title}</h4>
                          <p className="text-xs text-zinc-500">{insight.subtitle}</p>
                        </div>
                        <Badge
                          variant={insight.severity === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-600 mb-3">{insight.aiSummary}</p>
                      {insight.factors && (
                        <div className="flex flex-wrap gap-2">
                          {insight.factors.map((factor, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                'text-xs px-2 py-1 rounded',
                                factor.impact === 'positive' ? 'bg-green-100 text-green-700' :
                                factor.impact === 'negative' ? 'bg-red-100 text-red-700' :
                                'bg-zinc-100 text-zinc-600'
                              )}
                            >
                              {factor.summary}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Market Comparables</CardTitle>
                  <CardDescription>
                    How your deals compare to recent market transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-zinc-50 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Your Avg. Spread</span>
                        <span className="text-sm font-semibold">S+310bps</span>
                      </div>
                      <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">65th percentile vs. market</p>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-50 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Avg. Leverage Multiple</span>
                        <span className="text-sm font-semibold">4.8x</span>
                      </div>
                      <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '72%' }} />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">72nd percentile vs. market</p>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-50 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Covenant Tightness</span>
                        <span className="text-sm font-semibold text-green-600">Favorable</span>
                      </div>
                      <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '45%' }} />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">45th percentile (tighter is better)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Deal Calendar
                </CardTitle>
                <CardDescription>
                  Upcoming deadlines, meetings, and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCalendarEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border',
                        event.priority === 'high' && 'border-l-4 border-l-red-500 bg-red-50/30',
                        event.priority === 'medium' && 'border-l-4 border-l-amber-500 bg-amber-50/30',
                        event.priority === 'low' && 'border-l-4 border-l-zinc-300'
                      )}
                    >
                      <div className="p-2 rounded-lg bg-white border">
                        {event.type === 'deadline' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {event.type === 'meeting' && <Calendar className="w-4 h-4 text-blue-500" />}
                        {event.type === 'internal' && <Clock className="w-4 h-4 text-zinc-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{event.title}</p>
                        <p className="text-xs text-zinc-500">{event.date}</p>
                      </div>
                      <Badge
                        variant={
                          event.priority === 'high' ? 'destructive' :
                          event.priority === 'medium' ? 'secondary' :
                          'outline'
                        }
                        className="text-xs capitalize"
                      >
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <IntelligencePanel
              domain="deals"
              title="AI Deal Predictions"
              description="Machine learning-powered deal outcome forecasts"
              insights={mockPredictions}
              alerts={[]}
              signals={[]}
              tabs={['insights']}
              maxItems={10}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
