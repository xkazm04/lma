'use client';

import React, { memo, useState } from 'react';
import {
  Zap,
  Bot,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  ChevronRight,
  Activity,
  TrendingUp,
  AlertTriangle,
  Loader2,
  RefreshCw,
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
import { ActionQueueItemComponent } from './ActionQueueItem';
import type {
  ActionQueueDashboardData,
  ActionQueueItem,
  ActionQueueMetrics,
} from '../lib/mocks';

interface ActionQueuePanelProps {
  data: ActionQueueDashboardData;
  onActionApprove?: (item: ActionQueueItem) => void;
  onActionReject?: (item: ActionQueueItem) => void;
  onActionExecute?: (item: ActionQueueItem) => void;
  onActionCancel?: (item: ActionQueueItem) => void;
  onActionClick?: (item: ActionQueueItem) => void;
  onSettingsClick?: () => void;
  onRefresh?: () => void;
  onViewAllQueued?: () => void;
  onViewAllPending?: () => void;
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

// Queue Summary Bar
const QueueSummaryBar = memo(function QueueSummaryBar({
  metrics,
}: {
  metrics: ActionQueueMetrics;
}) {
  const total = metrics.totalQueued + metrics.pendingReview;
  const autoApprovedPercent = total > 0 ? (metrics.autoApprovedToday / Math.max(metrics.autoApprovedToday + metrics.pendingReview, 1)) * 100 : 0;

  return (
    <div className="p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-medium text-indigo-700">Auto-Execution Rate</span>
        </div>
        <span className="text-sm font-bold text-indigo-600">{Math.round(autoApprovedPercent)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={autoApprovedPercent} className="h-2 flex-1" />
        <span className="text-[10px] text-zinc-500 whitespace-nowrap">
          {metrics.autoApprovedToday} auto / {metrics.pendingReview} review
        </span>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-indigo-500" />
          <span className="text-[10px] text-indigo-600">
            Processing: {metrics.queueProcessingRate}/hr
          </span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-green-600">
            Success: {metrics.successRate}%
          </span>
        </div>
      </div>
    </div>
  );
});

export const ActionQueuePanel = memo(function ActionQueuePanel({
  data,
  onActionApprove,
  onActionReject,
  onActionExecute,
  onActionCancel,
  onActionClick,
  onSettingsClick,
  onRefresh,
  onViewAllQueued,
  onViewAllPending,
}: ActionQueuePanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { queuedActions, pendingReviewActions, executingActions, recentlyCompletedActions, queueMetrics } = data;

  const urgentPending = pendingReviewActions.filter((a) => a.estimatedImpact === 'critical' || a.estimatedImpact === 'high');

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      data-testid="action-queue-panel"
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 shadow-lg shadow-teal-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Action Queue</CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {queueMetrics.totalQueued + queueMetrics.pendingReview} pending
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-500">
                Confidence-weighted execution • High confidence = auto-execute
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {urgentPending.length > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                {urgentPending.length} urgent
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
                    data-testid="action-queue-refresh-btn"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh Queue</TooltipContent>
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
                    data-testid="action-queue-settings-btn"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Queue Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <MetricCard
            icon={Bot}
            label="Auto-Approved Today"
            value={queueMetrics.autoApprovedToday}
            color="bg-green-500"
            index={0}
            testId="metric-auto-approved"
          />
          <MetricCard
            icon={User}
            label="Pending Review"
            value={queueMetrics.pendingReview}
            color="bg-amber-500"
            index={1}
            testId="metric-pending-review"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Executed Today"
            value={queueMetrics.executedToday}
            trend="up"
            color="bg-blue-500"
            index={2}
            testId="metric-executed"
          />
          <MetricCard
            icon={Activity}
            label="Avg Confidence"
            value={`${queueMetrics.avgConfidenceScore}%`}
            color="bg-indigo-500"
            index={3}
            testId="metric-avg-confidence"
          />
        </div>

        {/* Queue Summary */}
        <QueueSummaryBar metrics={queueMetrics} />

        {/* Urgent Review Banner */}
        {urgentPending.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="text-sm font-semibold text-red-700">
                {urgentPending.length} Action{urgentPending.length > 1 ? 's' : ''} Need Immediate Review
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {urgentPending.slice(0, 3).map((item) => (
                <Badge
                  key={item.id}
                  variant="destructive"
                  className="text-[10px] cursor-pointer hover:bg-red-700"
                  onClick={() => onActionClick?.(item)}
                  data-testid={`urgent-action-badge-${item.id}`}
                >
                  {item.intervention.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="w-full grid grid-cols-4 mb-3 h-8">
            <TabsTrigger value="overview" data-testid="queue-tab-overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="queue-tab-pending" className="text-xs">
              Needs Review
              {pendingReviewActions.length > 0 && (
                <span className="ml-1 px-1 py-0.5 text-[9px] rounded-full bg-amber-500 text-white">
                  {pendingReviewActions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="queued" data-testid="queue-tab-queued" className="text-xs">
              Queued
              {queuedActions.length > 0 && (
                <span className="ml-1 px-1 py-0.5 text-[9px] rounded-full bg-green-500 text-white">
                  {queuedActions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="executing" data-testid="queue-tab-executing" className="text-xs">
              Executing
              {executingActions.length > 0 && (
                <span className="ml-1 px-1 py-0.5 text-[9px] rounded-full bg-blue-500 text-white">
                  {executingActions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pending Review */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <h4 className="text-xs font-medium text-zinc-700">Needs Your Review</h4>
                  </div>
                  <button
                    onClick={onViewAllPending}
                    className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-0.5"
                    data-testid="view-all-pending-btn"
                  >
                    View all
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {pendingReviewActions.length > 0 ? (
                    pendingReviewActions.slice(0, 3).map((item, idx) => (
                      <ActionQueueItemComponent
                        key={item.id}
                        item={item}
                        index={idx}
                        compact
                        onClick={() => onActionClick?.(item)}
                        onApprove={() => onActionApprove?.(item)}
                        onReject={() => onActionReject?.(item)}
                      />
                    ))
                  ) : (
                    <div className="py-6 text-center text-zinc-500">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-300" />
                      <p className="text-xs">No actions pending review</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-Approved Queue */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-green-600" />
                    <h4 className="text-xs font-medium text-zinc-700">Auto-Approved Queue</h4>
                  </div>
                  <button
                    onClick={onViewAllQueued}
                    className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-0.5"
                    data-testid="view-all-queued-btn"
                  >
                    View all
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {queuedActions.length > 0 ? (
                    queuedActions.slice(0, 3).map((item, idx) => (
                      <ActionQueueItemComponent
                        key={item.id}
                        item={item}
                        index={idx}
                        compact
                        onClick={() => onActionClick?.(item)}
                        onExecute={() => onActionExecute?.(item)}
                        onCancel={() => onActionCancel?.(item)}
                      />
                    ))
                  ) : (
                    <div className="py-6 text-center text-zinc-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                      <p className="text-xs">No actions in queue</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recently Completed */}
            {recentlyCompletedActions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <h4 className="text-xs font-medium text-zinc-700 mb-2">Recently Completed</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {recentlyCompletedActions.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 p-2 rounded-lg bg-zinc-50 border border-zinc-100 min-w-[180px] max-w-[220px]"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.executionResult?.success ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        <span className="text-[10px] font-medium text-zinc-700 truncate">
                          {item.intervention.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1">
                        {item.executionResult?.outcome}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Pending Review Tab */}
          <TabsContent value="pending" className="mt-0">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {pendingReviewActions.length > 0 ? (
                pendingReviewActions.map((item, idx) => (
                  <ActionQueueItemComponent
                    key={item.id}
                    item={item}
                    index={idx}
                    onClick={() => onActionClick?.(item)}
                    onApprove={() => onActionApprove?.(item)}
                    onReject={() => onActionReject?.(item)}
                    onExecute={() => onActionExecute?.(item)}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-300" />
                  <p className="text-sm">All caught up!</p>
                  <p className="text-xs text-zinc-400">No actions need your review</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Queued Tab */}
          <TabsContent value="queued" className="mt-0">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {queuedActions.length > 0 ? (
                queuedActions.map((item, idx) => (
                  <ActionQueueItemComponent
                    key={item.id}
                    item={item}
                    index={idx}
                    onClick={() => onActionClick?.(item)}
                    onExecute={() => onActionExecute?.(item)}
                    onCancel={() => onActionCancel?.(item)}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm">Queue is empty</p>
                  <p className="text-xs text-zinc-400">Auto-approved actions will appear here</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Executing Tab */}
          <TabsContent value="executing" className="mt-0">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {executingActions.length > 0 ? (
                executingActions.map((item, idx) => (
                  <ActionQueueItemComponent
                    key={item.id}
                    item={item}
                    index={idx}
                    onClick={() => onActionClick?.(item)}
                    onCancel={() => onActionCancel?.(item)}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <Loader2 className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm">No actions executing</p>
                  <p className="text-xs text-zinc-400">Executing actions will appear here</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
