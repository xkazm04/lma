'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Users,
  AlertTriangle,
  TrendingUp,
  Check,
  X,
  Clock,
  Building2,
  BarChart3,
  ArrowRight,
  ExternalLink,
  Bell,
  FileText,
  Gavel,
  UserCheck,
  Scale,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Mock data for governance signals
const mockGovernanceMetrics = {
  borrower_name: 'GreenEnergy Corp',
  as_of_date: '2025-01-15',
  board_size: 11,
  independent_directors: 8,
  female_directors: 4,
  minority_directors: 3,
  average_board_tenure: 5.2,
  esg_expertise_on_board: true,
  separate_chair_ceo: true,
  has_sustainability_committee: true,
  has_audit_committee: true,
  has_risk_committee: true,
  has_compensation_committee: true,
  ceo_comp_esg_linked: true,
  ceo_comp_esg_percentage: 25,
  exec_comp_esg_metrics: ['emissions_reduction', 'diversity_targets', 'safety_metrics'],
  shareholder_support_rate: 94.2,
  esg_resolutions_passed: 3,
  esg_resolutions_total: 4,
};

const mockGovernanceScore = {
  overall_score: 78,
  score_category: 'above_average' as const,
  component_scores: {
    board_composition: 82,
    board_diversity: 75,
    independence: 85,
    sustainability_oversight: 80,
    executive_compensation: 72,
    shareholder_engagement: 76,
  },
};

const mockGovernanceAlerts = [
  {
    id: 'alert-1',
    alert_type: 'board_change',
    severity: 'warning' as const,
    title: 'CFO Resignation Announced',
    description: 'Chief Financial Officer announced resignation effective March 31, 2025. Search for replacement in progress.',
    created_at: '2025-01-12T14:30:00Z',
    acknowledged: false,
    covenant_impact: [
      {
        covenant_name: 'Financial Reporting Covenant',
        impact_description: 'May affect timely delivery of Q1 financials',
        risk_level: 'medium' as const,
      },
    ],
    recommended_actions: ['Monitor transition timeline', 'Confirm interim arrangements', 'Review reporting procedures'],
  },
  {
    id: 'alert-2',
    alert_type: 'shareholder_resolution',
    severity: 'info' as const,
    title: 'Climate Disclosure Resolution Filed',
    description: 'Shareholder resolution requesting enhanced climate risk disclosure scheduled for 2025 AGM.',
    created_at: '2025-01-10T09:00:00Z',
    acknowledged: true,
    covenant_impact: [],
    recommended_actions: ['Review resolution text', 'Assess management response', 'Prepare voting recommendation'],
  },
  {
    id: 'alert-3',
    alert_type: 'executive_compensation',
    severity: 'critical' as const,
    title: 'Say-on-Pay Vote Failed',
    description: 'Annual say-on-pay vote received only 42% support, below 50% threshold.',
    created_at: '2025-01-08T16:00:00Z',
    acknowledged: false,
    covenant_impact: [
      {
        covenant_name: 'ESG Margin Adjustment',
        impact_description: 'Governance score may trigger margin step-up',
        risk_level: 'high' as const,
      },
    ],
    recommended_actions: ['Engage with board compensation committee', 'Review executive pay structure', 'Monitor investor sentiment'],
  },
];

const mockRecentResolutions = [
  {
    id: 'res-1',
    resolution_type: 'Climate Risk Disclosure',
    resolution_category: 'climate',
    meeting_date: '2025-01-15',
    sponsor_type: 'shareholder',
    iss_recommendation: 'for',
    management_recommendation: 'for',
    vote_result: 'passed',
    support_percentage: 78,
  },
  {
    id: 'res-2',
    resolution_type: 'Board Diversity Policy',
    resolution_category: 'diversity',
    meeting_date: '2025-01-15',
    sponsor_type: 'management',
    iss_recommendation: 'for',
    management_recommendation: 'for',
    vote_result: 'passed',
    support_percentage: 92,
  },
  {
    id: 'res-3',
    resolution_type: 'Executive Compensation Plan',
    resolution_category: 'compensation',
    meeting_date: '2025-01-15',
    sponsor_type: 'management',
    iss_recommendation: 'against',
    management_recommendation: 'for',
    vote_result: 'failed',
    support_percentage: 42,
  },
  {
    id: 'res-4',
    resolution_type: 'Political Spending Disclosure',
    resolution_category: 'lobbying',
    meeting_date: '2025-01-15',
    sponsor_type: 'shareholder',
    iss_recommendation: 'for',
    management_recommendation: 'against',
    vote_result: 'pending',
    support_percentage: undefined,
  },
];

const mockRecentEvents = [
  {
    id: 'event-1',
    event_type: 'board_change',
    title: 'New Independent Director Appointed',
    event_date: '2025-01-14',
    severity: 'info',
  },
  {
    id: 'event-2',
    event_type: 'policy_change',
    title: 'Updated ESG Compensation Policy',
    event_date: '2025-01-10',
    severity: 'info',
  },
  {
    id: 'event-3',
    event_type: 'regulatory_action',
    title: 'SEC Climate Disclosure Inquiry',
    event_date: '2025-01-08',
    severity: 'warning',
  },
];

const SCORE_CATEGORIES = {
  leader: { label: 'Leader', color: 'text-green-700', bg: 'bg-green-100' },
  above_average: { label: 'Above Average', color: 'text-blue-700', bg: 'bg-blue-100' },
  average: { label: 'Average', color: 'text-zinc-700', bg: 'bg-zinc-100' },
  below_average: { label: 'Below Average', color: 'text-amber-700', bg: 'bg-amber-100' },
  laggard: { label: 'Laggard', color: 'text-red-700', bg: 'bg-red-100' },
};

const SEVERITY_STYLES = {
  info: { badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-600' },
  warning: { badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-600' },
  critical: { badge: 'bg-red-100 text-red-700', icon: 'text-red-600' },
};

const VOTE_ICONS = {
  for: <Check className="w-3 h-3 text-green-600" />,
  against: <X className="w-3 h-3 text-red-600" />,
  abstain: <Clock className="w-3 h-3 text-zinc-400" />,
  withhold: <X className="w-3 h-3 text-amber-600" />,
};

const RESULT_STYLES = {
  passed: { badge: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { badge: 'bg-red-100 text-red-700', icon: XCircle },
  pending: { badge: 'bg-zinc-100 text-zinc-700', icon: Clock },
  withdrawn: { badge: 'bg-zinc-100 text-zinc-700', icon: X },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Just now';
}

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const metrics = mockGovernanceMetrics;
  const score = mockGovernanceScore;
  const alerts = mockGovernanceAlerts;

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Governance Signals
          </h1>
          <p className="text-zinc-500">ISS-style proxy voting and governance monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="transition-transform hover:scale-105" data-testid="refresh-governance-btn">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button className="transition-transform hover:scale-105" data-testid="generate-alerts-btn">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Alerts
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 animate-in slide-in-from-top-4 duration-500 delay-100" data-testid="critical-alerts-banner">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Critical Governance Alerts</h3>
                <p className="text-sm text-red-700">
                  {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} require immediate attention
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100" data-testid="view-critical-alerts-btn">
                View Alerts
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Governance Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 animate-in slide-in-from-left-4 duration-500 delay-200" data-testid="governance-score-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Governance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    className="text-zinc-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                  />
                  <circle
                    className="text-purple-600"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * score.overall_score) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-zinc-900">{score.overall_score}</span>
                </div>
              </div>
              <Badge className={`mt-2 ${SCORE_CATEGORIES[score.score_category].bg} ${SCORE_CATEGORIES[score.score_category].color}`}>
                {SCORE_CATEGORIES[score.score_category].label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 animate-in slide-in-from-right-4 duration-500 delay-200" data-testid="governance-metrics-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(score.component_scores).map(([key, value]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                const getColor = (v: number) => {
                  if (v >= 80) return 'bg-green-500';
                  if (v >= 60) return 'bg-blue-500';
                  if (v >= 40) return 'bg-amber-500';
                  return 'bg-red-500';
                };
                return (
                  <div key={key} className="space-y-1" data-testid={`score-component-${key}`}>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                    <Progress value={value} className={`h-2 ${getColor(value)}`} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-in slide-in-from-bottom-4 duration-500 delay-300">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <Bell className="w-4 h-4 mr-2" />
            Alerts
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolutions" data-testid="tab-resolutions">
            <Gavel className="w-4 h-4 mr-2" />
            Resolutions
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">
            <FileText className="w-4 h-4 mr-2" />
            Events
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Board Composition */}
            <Card data-testid="board-composition-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Board Composition
                </CardTitle>
                <CardDescription>As of {formatDate(metrics.as_of_date)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-zinc-50">
                    <p className="text-sm text-zinc-500">Board Size</p>
                    <p className="text-2xl font-bold">{metrics.board_size}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50">
                    <p className="text-sm text-zinc-500">Independent</p>
                    <p className="text-2xl font-bold">
                      {metrics.independent_directors}
                      <span className="text-sm font-normal text-zinc-500 ml-1">
                        ({Math.round((metrics.independent_directors / metrics.board_size) * 100)}%)
                      </span>
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50">
                    <p className="text-sm text-zinc-500">Female Directors</p>
                    <p className="text-2xl font-bold">
                      {metrics.female_directors}
                      <span className="text-sm font-normal text-zinc-500 ml-1">
                        ({Math.round((metrics.female_directors / metrics.board_size) * 100)}%)
                      </span>
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50">
                    <p className="text-sm text-zinc-500">Avg Tenure</p>
                    <p className="text-2xl font-bold">{metrics.average_board_tenure} yrs</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-zinc-700">Governance Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {metrics.separate_chair_ceo && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                        <Check className="w-3 h-3 mr-1" /> Separate Chair/CEO
                      </Badge>
                    )}
                    {metrics.has_sustainability_committee && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                        <Check className="w-3 h-3 mr-1" /> Sustainability Committee
                      </Badge>
                    )}
                    {metrics.esg_expertise_on_board && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                        <Check className="w-3 h-3 mr-1" /> ESG Expertise
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Executive Compensation */}
            <Card data-testid="compensation-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  ESG-Linked Compensation
                </CardTitle>
                <CardDescription>Executive incentive alignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-zinc-500 mb-1">CEO ESG-Linked Pay</p>
                    <div className="flex items-center gap-2">
                      <Progress value={metrics.ceo_comp_esg_percentage} className="flex-1 h-3" />
                      <span className="text-lg font-bold">{metrics.ceo_comp_esg_percentage}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-700 mb-2">Linked ESG Metrics</h4>
                  <div className="flex flex-wrap gap-2">
                    {metrics.exec_comp_esg_metrics.map((metric) => (
                      <Badge key={metric} variant="outline" className="capitalize">
                        {metric.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-500">Shareholder Support Rate</p>
                      <p className="text-2xl font-bold">{metrics.shareholder_support_rate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-500">ESG Resolutions</p>
                      <p className="text-lg font-semibold">
                        {metrics.esg_resolutions_passed}/{metrics.esg_resolutions_total} passed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <Card data-testid="alerts-list-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Governance Alerts</span>
                <Badge variant="outline">{alerts.length} total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      !alert.acknowledged ? 'bg-white' : 'bg-zinc-50'
                    } ${alert.severity === 'critical' ? 'border-red-200' : 'border-zinc-200'}`}
                    data-testid={`alert-item-${alert.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${SEVERITY_STYLES[alert.severity].icon}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-zinc-900">{alert.title}</h4>
                          <Badge className={SEVERITY_STYLES[alert.severity].badge}>
                            {alert.severity}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                              <Eye className="w-3 h-3 mr-1" /> Acknowledged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600 mb-2">{alert.description}</p>

                        {alert.covenant_impact.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-zinc-500 mb-1">Covenant Impact:</p>
                            {alert.covenant_impact.map((impact, idx) => (
                              <div key={idx} className="text-sm text-amber-700 flex items-center gap-1">
                                <Scale className="w-3 h-3" />
                                {impact.covenant_name}: {impact.impact_description}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-zinc-400">{formatTimeAgo(alert.created_at)}</span>
                          {!alert.acknowledged && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" data-testid={`acknowledge-alert-${alert.id}`}>
                                Acknowledge
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" data-testid={`dismiss-alert-${alert.id}`}>
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resolutions Tab */}
        <TabsContent value="resolutions" className="space-y-4 mt-4">
          <Card data-testid="resolutions-list-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Shareholder Resolutions</span>
                <Badge variant="outline">{mockRecentResolutions.length} resolutions</Badge>
              </CardTitle>
              <CardDescription>Proxy voting recommendations and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecentResolutions.map((resolution) => {
                  const ResultIcon = RESULT_STYLES[resolution.vote_result as keyof typeof RESULT_STYLES]?.icon || Clock;
                  return (
                    <div
                      key={resolution.id}
                      className="p-4 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
                      data-testid={`resolution-item-${resolution.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-zinc-900">{resolution.resolution_type}</h4>
                            <Badge variant="outline" className="capitalize text-xs">
                              {resolution.resolution_category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {resolution.sponsor_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-500 mb-2">Meeting: {formatDate(resolution.meeting_date)}</p>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500">ISS:</span>
                              {resolution.iss_recommendation && VOTE_ICONS[resolution.iss_recommendation as keyof typeof VOTE_ICONS]}
                              <span className="capitalize">{resolution.iss_recommendation}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500">Mgmt:</span>
                              {resolution.management_recommendation && VOTE_ICONS[resolution.management_recommendation as keyof typeof VOTE_ICONS]}
                              <span className="capitalize">{resolution.management_recommendation}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge className={RESULT_STYLES[resolution.vote_result as keyof typeof RESULT_STYLES]?.badge || 'bg-zinc-100'}>
                            <ResultIcon className="w-3 h-3 mr-1" />
                            {resolution.vote_result}
                          </Badge>
                          {resolution.support_percentage !== undefined && (
                            <p className="text-sm font-medium text-zinc-700 mt-1">
                              {resolution.support_percentage}% support
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4 mt-4">
          <Card data-testid="events-list-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Governance Events</span>
                <Badge variant="outline">{mockRecentEvents.length} events</Badge>
              </CardTitle>
              <CardDescription>Recent governance-related events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
                    data-testid={`event-item-${event.id}`}
                  >
                    <div className={`p-2 rounded-lg ${SEVERITY_STYLES[event.severity as keyof typeof SEVERITY_STYLES]?.badge || 'bg-zinc-100'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-900">{event.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span className="capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{formatDate(event.event_date)}</span>
                      </div>
                    </div>
                    <Badge className={SEVERITY_STYLES[event.severity as keyof typeof SEVERITY_STYLES]?.badge || 'bg-zinc-100'}>
                      {event.severity}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-400">
        <Link href="/esg/governance/analysis" className="block">
          <Card className="hover:shadow-md transition-all cursor-pointer group" data-testid="governance-analysis-link">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">AI Governance Analysis</h3>
                  <p className="text-sm text-zinc-500">Get AI-powered insights</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/esg/governance/benchmarks" className="block">
          <Card className="hover:shadow-md transition-all cursor-pointer group" data-testid="governance-benchmarks-link">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Peer Benchmarks</h3>
                  <p className="text-sm text-zinc-500">Compare to industry peers</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/esg" className="block">
          <Card className="hover:shadow-md transition-all cursor-pointer group" data-testid="back-to-esg-link">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">ESG Dashboard</h3>
                  <p className="text-sm text-zinc-500">Return to main ESG view</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
