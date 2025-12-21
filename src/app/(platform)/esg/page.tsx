'use client';

import React from 'react';
import Link from 'next/link';
import {
  Leaf,
  Building2,
  Target,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus,
  DollarSign,
  Sparkles,
  CheckCircle,
  Clock,
  BarChart3,
  GitCompareArrows,
  Brain,
  Zap,
  Layers,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  KPICard,
  LoanTypeBadge,
  ExportButton,
  formatCurrency,
  mockDashboardStats,
  mockUpcomingDeadlines,
  mockRecentActivity,
  mockFacilitiesAtRisk,
  mockFacilityPrediction,
  exportDashboardPDF,
  exportDashboardExcel,
  type ExportFormat,
} from '@/app/features/esg';

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

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  sustainability_linked: 'SLL',
  green_loan: 'Green',
  social_loan: 'Social',
  transition_loan: 'Transition',
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  performance_submitted: <TrendingUp className="w-4 h-4 text-blue-600" />,
  target_achieved: <CheckCircle className="w-4 h-4 text-green-600" />,
  rating_updated: <BarChart3 className="w-4 h-4 text-purple-600" />,
  allocation_made: <DollarSign className="w-4 h-4 text-green-600" />,
};

const PRIORITY_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  high: 'destructive',
  medium: 'secondary',
};

const DEFAULT_ACTIVITY_ICON = <Clock className="w-4 h-4 text-zinc-400" />;

export default function ESGDashboardPage() {
  const handleExport = (format: ExportFormat) => {
    const config = { title: 'ESG Portfolio Dashboard' };
    if (format === 'pdf') {
      exportDashboardPDF(
        mockDashboardStats,
        mockUpcomingDeadlines,
        mockRecentActivity,
        mockFacilitiesAtRisk,
        config
      );
    } else {
      exportDashboardExcel(
        mockDashboardStats,
        mockUpcomingDeadlines,
        mockRecentActivity,
        mockFacilitiesAtRisk,
        config
      );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">ESG Dashboard</h1>
          <p className="text-zinc-500">Monitor sustainability performance across your portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton onExport={handleExport} label="Export Report" />
          <Link href="/esg/facilities">
            <Button variant="outline" className="transition-transform hover:scale-105" data-testid="view-facilities-btn">
              <Building2 className="w-4 h-4 mr-2" />
              View Facilities
            </Button>
          </Link>
          <Link href="/esg/facilities/new">
            <Button className="transition-transform hover:scale-105" data-testid="new-facility-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Facility
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="ESG Portfolio"
          value={formatCurrency(mockDashboardStats.total_commitment)}
          subtitle={`${mockDashboardStats.total_facilities} facilities`}
          icon={<Leaf className="w-5 h-5 text-green-600" />}
        />
        <KPICard
          title="KPI Status"
          value={`${mockDashboardStats.kpi_summary.on_track}/${mockDashboardStats.kpi_summary.total_kpis}`}
          subtitle={`${mockDashboardStats.kpi_summary.on_track} on track`}
          variant="success"
          icon={<Target className="w-5 h-5 text-green-700" />}
        />
        <KPICard
          title="Target Achievement"
          value={`${mockDashboardStats.target_achievement.achievement_rate.toFixed(0)}%`}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        />
        <KPICard
          title="Proceeds Allocated"
          value={`${mockDashboardStats.allocation_summary.utilization_rate.toFixed(0)}%`}
          subtitle={`${formatCurrency(mockDashboardStats.allocation_summary.total_allocated)} of ${formatCurrency(
            mockDashboardStats.allocation_summary.total_eligible
          )}`}
          icon={<DollarSign className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Reporting Alert */}
      {mockDashboardStats.reporting_status.reports_overdue > 0 && (
        <Card className="border-red-200 bg-red-50/50 animate-in slide-in-from-top-4 duration-500 delay-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Overdue Reports</h3>
                <p className="text-sm text-red-700">
                  {mockDashboardStats.reporting_status.reports_overdue} report(s) past due date.
                </p>
              </div>
              <Link href="/esg/reports">
                <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                  View Reports
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Facilities at Risk */}
      {mockFacilitiesAtRisk.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 animate-in slide-in-from-top-4 duration-500 delay-300" data-testid="facilities-at-risk-section">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Facilities At Risk
            </CardTitle>
            <CardDescription className="text-amber-700">
              These facilities have KPIs at risk of missing targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="facilities-at-risk-list">
              {mockFacilitiesAtRisk.map((facility) => (
                <Link key={facility.id} href={`/esg/facilities/${facility.id}?tab=kpis&filter=at_risk`} className="block" data-testid={`facility-at-risk-link-${facility.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 hover:bg-white transition-all hover:scale-[1.02]" data-testid={`facility-at-risk-item-${facility.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-900" data-testid={`facility-at-risk-name-${facility.id}`}>{facility.facility_name}</p>
                        <LoanTypeBadge type={facility.esg_loan_type} />
                      </div>
                      <p className="text-sm text-zinc-500">{facility.borrower_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-amber-700" data-testid={`facility-at-risk-kpis-${facility.id}`}>
                        {facility.at_risk_kpis} KPI{facility.at_risk_kpis > 1 ? 's' : ''} at risk
                      </p>
                      <p className="text-xs text-zinc-500">Next deadline: {formatDate(facility.next_deadline)}</p>
                      {facility.margin_impact_bps > 0 && (
                        <p className="text-xs text-red-600">Potential +{facility.margin_impact_bps}bps margin</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Predictions Preview */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-white animate-in slide-in-from-top-4 duration-500 delay-350">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <CardTitle>AI Performance Predictions</CardTitle>
            </div>
            <Link href="/esg/predictions">
              <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50" data-testid="view-predictions-btn">
                View Full Predictions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <CardDescription>90-day forecast based on AI analysis of KPI trajectories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-xs text-zinc-500">KPIs On Track</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {mockFacilityPrediction.summary.kpis_on_track}/{mockFacilityPrediction.summary.total_kpis}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-zinc-500">At Risk</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">
                {mockFacilityPrediction.summary.kpis_at_risk}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <span className="text-xs text-zinc-500">Predicted Margin Impact</span>
              </div>
              <p className="text-2xl font-bold text-red-700">
                +{mockFacilityPrediction.summary.predicted_margin_change_bps}bps
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-zinc-600" />
                <span className="text-xs text-zinc-500">Financial Exposure</span>
              </div>
              <p className="text-2xl font-bold text-zinc-700">
                {formatCurrency(mockFacilityPrediction.summary.financial_exposure)}
              </p>
            </div>
          </div>
          {/* Quick Action */}
          {mockFacilityPrediction.summary.kpis_at_risk > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  <strong>Recommended:</strong> {mockFacilityPrediction.summary.highest_priority_action}
                </span>
              </div>
              <Link href="/esg/predictions">
                <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-100" data-testid="take-action-btn">
                  Take Action
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio Composition */}
        <Card className="animate-in slide-in-from-left-4 duration-500 delay-400">
          <CardHeader>
            <CardTitle>Portfolio Composition</CardTitle>
            <CardDescription>Facilities by ESG loan type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(mockDashboardStats.facilities_by_type).map(([type, count]) =>
                count > 0 ? (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700">{LOAN_TYPE_LABELS[type] || type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">{count}</span>
                      <span className="text-xs text-zinc-500">
                        ({((count / mockDashboardStats.total_facilities) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="lg:col-span-2 animate-in slide-in-from-right-4 duration-500 delay-400">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockUpcomingDeadlines.map((deadline, idx) => {
                const daysUntil = getDaysUntil(deadline.deadline);
                return (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-zinc-50 transition-all hover:bg-zinc-100">
                    <div className="flex flex-col items-center w-12 py-1 px-2 bg-white rounded text-center border">
                      <span className="text-xs text-zinc-500">
                        {new Date(deadline.deadline).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-zinc-900">{new Date(deadline.deadline).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900">{deadline.description}</p>
                        <Badge variant={PRIORITY_BADGE_VARIANTS[deadline.priority] || 'default'}>{deadline.priority}</Badge>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {daysUntil === 0 ? 'Due today' : daysUntil === 1 ? 'Due tomorrow' : `Due in ${daysUntil} days`}
                      </p>
                    </div>
                    <Badge variant="outline">{deadline.type}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="animate-in slide-in-from-bottom-4 duration-500 delay-500">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest ESG updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 transition-all hover:bg-zinc-100">
                {ACTIVITY_ICONS[activity.type] || DEFAULT_ACTIVITY_ICON}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 line-clamp-2">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500 truncate">{activity.facility_name}</span>
                    <span className="text-xs text-zinc-400">{formatTimeAgo(activity.occurred_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3" role="navigation" aria-label="Quick actions">
        <Link href="/esg/governance" data-testid="quick-action-governance-link" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-md transition-all cursor-pointer group border-purple-200 bg-gradient-to-br from-purple-50/50 to-white animate-in slide-in-from-bottom-4 duration-500 delay-525 group-focus-visible:ring-2 group-focus-visible:ring-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors" aria-hidden="true">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Governance</h3>
                  <p className="text-sm text-zinc-500">Proxy voting signals</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/esg/portfolio-optimization" data-testid="quick-action-portfolio-optimization-link" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-md transition-all cursor-pointer group border-amber-200 bg-gradient-to-br from-amber-50/50 to-white animate-in slide-in-from-bottom-4 duration-500 delay-550 group-focus-visible:ring-2 group-focus-visible:ring-amber-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors" aria-hidden="true">
                  <Layers className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Portfolio Optimizer</h3>
                  <p className="text-sm text-zinc-500">Optimize ESG mix</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/esg/predictions" data-testid="quick-action-predictions-link" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-md transition-all cursor-pointer group border-purple-200 bg-gradient-to-br from-purple-50/50 to-white animate-in slide-in-from-bottom-4 duration-500 delay-600 group-focus-visible:ring-2 group-focus-visible:ring-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors" aria-hidden="true">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">AI Predictor</h3>
                  <p className="text-sm text-zinc-500">Forecast KPIs & margins</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/esg/facilities" data-testid="quick-action-facilities-link" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-md transition-all cursor-pointer group animate-in slide-in-from-bottom-4 duration-500 delay-650 group-focus-visible:ring-2 group-focus-visible:ring-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors" aria-hidden="true">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">ESG Facilities</h3>
                  <p className="text-sm text-zinc-500">Manage facilities and KPIs</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/esg/compare" data-testid="quick-action-compare-link" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-md transition-all cursor-pointer group animate-in slide-in-from-bottom-4 duration-500 delay-700 group-focus-visible:ring-2 group-focus-visible:ring-indigo-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors" aria-hidden="true">
                  <GitCompareArrows className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Compare Facilities</h3>
                  <p className="text-sm text-zinc-500">Side-by-side analysis</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/esg/allocations" data-testid="quick-action-allocations-link" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-md transition-all cursor-pointer group animate-in slide-in-from-bottom-4 duration-500 delay-[750ms] group-focus-visible:ring-2 group-focus-visible:ring-teal-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-teal-100 group-hover:bg-teal-200 transition-colors" aria-hidden="true">
                  <DollarSign className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Use of Proceeds</h3>
                  <p className="text-sm text-zinc-500">Track allocations</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/esg/ai" data-testid="quick-action-ai-assistant-link" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-md transition-all cursor-pointer group border-blue-200 animate-in slide-in-from-bottom-4 duration-500 delay-[800ms] group-focus-visible:ring-2 group-focus-visible:ring-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors" aria-hidden="true">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">ESG Assistant</h3>
                  <p className="text-sm text-zinc-500">AI-powered insights</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
