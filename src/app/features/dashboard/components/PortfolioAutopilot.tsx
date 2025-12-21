'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  Zap,
  Brain,
  Target,
  Shield,
  Clock,
  TrendingUp,
  ChevronRight,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  BarChart3,
  Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AutopilotStatusBadge } from './AutopilotStatusBadge';
import { PredictionCard } from './PredictionCard';
import { InterventionCard } from './InterventionCard';
import { AutopilotAlertItem } from './AutopilotAlertItem';
import type {
  AutopilotDashboardData,
  BreachPrediction,
  Intervention,
  AutopilotAlert,
  PerformanceDataPoint,
} from '../lib/mocks';

interface PortfolioAutopilotProps {
  data: AutopilotDashboardData;
  onPredictionClick?: (prediction: BreachPrediction) => void;
  onInterventionClick?: (intervention: Intervention) => void;
  onInterventionApprove?: (intervention: Intervention) => void;
  onInterventionReject?: (intervention: Intervention) => void;
  onInterventionExecute?: (intervention: Intervention) => void;
  onAlertClick?: (alert: AutopilotAlert) => void;
  onAlertMarkRead?: (alert: AutopilotAlert) => void;
  onSettingsClick?: () => void;
  onRefresh?: () => void;
  onViewAllPredictions?: () => void;
  onViewAllInterventions?: () => void;
}

// Metric Card Component
const MetricCard = memo(function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color,
  index,
  testId,
}: {
  icon: typeof Zap;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down';
  color: string;
  index: number;
  testId: string;
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border border-zinc-100 bg-white hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={testId}
    >
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded-lg', color)}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-zinc-500 truncate">{label}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-semibold text-zinc-900">{value}</span>
            {subValue && <span className="text-[10px] text-zinc-400">{subValue}</span>}
            {trend && (
              <TrendingUp
                className={cn(
                  'w-3 h-3',
                  trend === 'up' ? 'text-green-500' : 'text-red-500 rotate-180'
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Performance Chart (Simple Bar Visualization)
const PerformanceChart = memo(function PerformanceChart({
  data,
}: {
  data: PerformanceDataPoint[];
}) {
  const maxPrevented = Math.max(...data.map((d) => d.breachesPrevented));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>Breaches Prevented (6mo)</span>
        <span className="font-medium text-green-600">
          {data.reduce((sum, d) => sum + d.breachesPrevented, 0)} total
        </span>
      </div>
      <div className="flex items-end gap-1 h-16">
        {data.map((point, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                    style={{
                      height: `${(point.breachesPrevented / maxPrevented) * 100}%`,
                      minHeight: 4,
                    }}
                  />
                  <span className="text-[9px] text-zinc-400">{point.date.slice(0, 3)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-medium">{point.date}</p>
                  <p>Prevented: {point.breachesPrevented}</p>
                  <p>Accuracy: {point.accuracy}%</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
});

export const PortfolioAutopilot = memo(function PortfolioAutopilot({
  data,
  onPredictionClick,
  onInterventionClick,
  onInterventionApprove,
  onInterventionReject,
  onInterventionExecute,
  onAlertClick,
  onAlertMarkRead,
  onSettingsClick,
  onRefresh,
  onViewAllPredictions,
  onViewAllInterventions,
}: PortfolioAutopilotProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { settings, metrics, activePredictions, pendingInterventions, alertQueue, performanceHistory, recentActions } =
    data;

  const unreadAlerts = alertQueue.filter((a) => !a.read);
  const criticalPredictions = activePredictions.filter((p) => p.riskLevel === 'critical');
  const urgentInterventions = pendingInterventions.filter((i) => i.priority === 'urgent');

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      data-testid="portfolio-autopilot"
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-lg shadow-purple-500/25">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Portfolio Autopilot</CardTitle>
                <AutopilotStatusBadge status={settings.status} size="sm" />
              </div>
              <p className="text-[10px] text-zinc-500">
                AI-powered predictive management • {metrics.covenantsMonitored} covenants monitored
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadAlerts.length > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                <Bell className="w-2.5 h-2.5 mr-0.5" />
                {unreadAlerts.length}
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    className="h-7 w-7 p-0"
                    data-testid="autopilot-refresh-btn"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run Analysis</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSettingsClick}
                    className="h-7 w-7 p-0"
                    data-testid="autopilot-settings-btn"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Autopilot Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
          <MetricCard
            icon={Target}
            label="Active Predictions"
            value={metrics.activePredictionsCount}
            subValue={`${metrics.criticalCount} critical`}
            color="bg-purple-500"
            index={0}
            testId="metric-active-predictions"
          />
          <MetricCard
            icon={AlertTriangle}
            label="High Risk"
            value={metrics.highRiskCount}
            color="bg-orange-500"
            index={1}
            testId="metric-high-risk"
          />
          <MetricCard
            icon={Clock}
            label="Pending Actions"
            value={metrics.pendingInterventionsCount}
            color="bg-amber-500"
            index={2}
            testId="metric-pending-actions"
          />
          <MetricCard
            icon={Shield}
            label="Breaches Prevented"
            value={metrics.breachesPrevented}
            trend="up"
            color="bg-green-500"
            index={3}
            testId="metric-breaches-prevented"
          />
          <MetricCard
            icon={Activity}
            label="Prediction Accuracy"
            value={`${metrics.predictionAccuracy}%`}
            color="bg-blue-500"
            index={4}
            testId="metric-prediction-accuracy"
          />
          <MetricCard
            icon={TrendingUp}
            label="Avg Lead Time"
            value={`${metrics.averageLeadTime}d`}
            subValue="ahead"
            color="bg-indigo-500"
            index={5}
            testId="metric-avg-lead-time"
          />
        </div>

        {/* Critical Alerts Banner */}
        {(criticalPredictions.length > 0 || urgentInterventions.length > 0) && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="text-sm font-semibold text-red-700">Immediate Attention Required</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {criticalPredictions.slice(0, 2).map((p) => (
                <Badge
                  key={p.id}
                  variant="destructive"
                  className="text-[10px] cursor-pointer hover:bg-red-700"
                  onClick={() => onPredictionClick?.(p)}
                  data-testid={`critical-prediction-badge-${p.id}`}
                >
                  {p.borrowerName}: {p.covenantName} ({p.daysUntilBreach}d)
                </Badge>
              ))}
              {urgentInterventions.slice(0, 2).map((i) => (
                <Badge
                  key={i.id}
                  variant="destructive"
                  className="text-[10px] cursor-pointer hover:bg-red-700"
                  onClick={() => onInterventionClick?.(i)}
                  data-testid={`urgent-intervention-badge-${i.id}`}
                >
                  Action: {i.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-3 h-8">
            <TabsTrigger value="overview" data-testid="autopilot-tab-overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="predictions" data-testid="autopilot-tab-predictions" className="text-xs">
              Predictions
              {metrics.criticalCount > 0 && (
                <span className="ml-1 px-1 py-0.5 text-[9px] rounded-full bg-red-500 text-white">
                  {metrics.criticalCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="interventions" data-testid="autopilot-tab-interventions" className="text-xs">
              Interventions
              {metrics.pendingInterventionsCount > 0 && (
                <span className="ml-1 px-1 py-0.5 text-[9px] rounded-full bg-amber-500 text-white">
                  {metrics.pendingInterventionsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts" data-testid="autopilot-tab-alerts" className="text-xs">
              Alerts
              {unreadAlerts.length > 0 && (
                <span className="ml-1 px-1 py-0.5 text-[9px] rounded-full bg-blue-500 text-white">
                  {unreadAlerts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Performance Summary */}
              <div className="p-3 rounded-lg border border-zinc-100 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <h4 className="text-xs font-medium text-zinc-700">Performance</h4>
                </div>
                <PerformanceChart data={performanceHistory} />
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-100">
                  <div>
                    <p className="text-[10px] text-zinc-500">Success Rate</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-green-600">
                        {metrics.successRate}%
                      </span>
                      <Progress value={metrics.successRate} className="h-1 flex-1" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500">Coverage</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-blue-600">
                        {metrics.portfolioCoverage}%
                      </span>
                      <Progress value={metrics.portfolioCoverage} className="h-1 flex-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Predictions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-zinc-700">Top Risk Predictions</h4>
                  <button
                    onClick={onViewAllPredictions}
                    className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-0.5"
                    data-testid="view-all-predictions-btn"
                  >
                    View all
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {activePredictions.slice(0, 3).map((prediction, idx) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      index={idx}
                      compact
                      onClick={() => onPredictionClick?.(prediction)}
                    />
                  ))}
                </div>
              </div>

              {/* Pending Interventions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-zinc-700">Pending Interventions</h4>
                  <button
                    onClick={onViewAllInterventions}
                    className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-0.5"
                    data-testid="view-all-interventions-btn"
                  >
                    View all
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {pendingInterventions.slice(0, 3).map((intervention, idx) => (
                    <InterventionCard
                      key={intervention.id}
                      intervention={intervention}
                      index={idx}
                      compact
                      onClick={() => onInterventionClick?.(intervention)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <h4 className="text-xs font-medium text-zinc-700 mb-2">Recent Autopilot Activity</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recentActions.slice(0, 5).map((action, idx) => (
                  <div
                    key={action.id}
                    className="flex-shrink-0 p-2 rounded-lg bg-zinc-50 border border-zinc-100 min-w-[200px] max-w-[250px]"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {action.outcome === 'success' ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-500" />
                      )}
                      <span className="text-[10px] font-medium text-zinc-700 truncate">
                        {action.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-2">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="mt-0">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {activePredictions.length > 0 ? (
                activePredictions.map((prediction, idx) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    index={idx}
                    onClick={() => onPredictionClick?.(prediction)}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm">No active breach predictions</p>
                  <p className="text-xs text-zinc-400">Portfolio health is optimal</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Interventions Tab */}
          <TabsContent value="interventions" className="mt-0">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {pendingInterventions.length > 0 ? (
                pendingInterventions.map((intervention, idx) => (
                  <InterventionCard
                    key={intervention.id}
                    intervention={intervention}
                    index={idx}
                    onClick={() => onInterventionClick?.(intervention)}
                    onApprove={() => onInterventionApprove?.(intervention)}
                    onReject={() => onInterventionReject?.(intervention)}
                    onExecute={() => onInterventionExecute?.(intervention)}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm">No pending interventions</p>
                  <p className="text-xs text-zinc-400">All actions are up to date</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-0">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {alertQueue.length > 0 ? (
                alertQueue.map((alert, idx) => (
                  <AutopilotAlertItem
                    key={alert.id}
                    alert={alert}
                    index={idx}
                    onClick={() => onAlertClick?.(alert)}
                    onMarkRead={() => onAlertMarkRead?.(alert)}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm">No alerts</p>
                  <p className="text-xs text-zinc-400">You're all caught up</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
