'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CovenantStateHistory,
  CovenantStateTransition,
  CovenantLifecycleState,
  TransitionTrigger,
} from '../../lib/covenant-state-machine';

interface StateHistoryTimelineProps {
  stateHistory: CovenantStateHistory;
  compact?: boolean;
}

/**
 * Get icon for lifecycle state.
 */
function getStateIcon(state: CovenantLifecycleState) {
  switch (state) {
    case 'healthy':
      return <CheckCircle className="w-4 h-4" />;
    case 'at_risk':
      return <AlertTriangle className="w-4 h-4" />;
    case 'breach':
      return <XCircle className="w-4 h-4" />;
    case 'waived':
      return <Clock className="w-4 h-4" />;
    case 'resolved':
      return <TrendingUp className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}

/**
 * Get color classes for lifecycle state.
 */
function getStateColor(state: CovenantLifecycleState): string {
  switch (state) {
    case 'healthy':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'at_risk':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'breach':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'waived':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'resolved':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}

/**
 * Get human-readable label for state.
 */
function getStateLabel(state: CovenantLifecycleState): string {
  switch (state) {
    case 'healthy':
      return 'Healthy';
    case 'at_risk':
      return 'At Risk';
    case 'breach':
      return 'Breach';
    case 'waived':
      return 'Waived';
    case 'resolved':
      return 'Resolved';
    default:
      return state;
  }
}

/**
 * Get human-readable label for trigger.
 */
function getTriggerLabel(trigger: TransitionTrigger): string {
  switch (trigger) {
    case 'headroom_deterioration':
      return 'Headroom Deteriorated';
    case 'headroom_improvement':
      return 'Headroom Improved';
    case 'test_failure':
      return 'Test Failed';
    case 'test_success':
      return 'Test Passed';
    case 'waiver_granted':
      return 'Waiver Granted';
    case 'waiver_expired':
      return 'Waiver Expired';
    case 'manual_override':
      return 'Manual Override';
    default:
      return trigger;
  }
}

/**
 * Format date for display.
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date with time for display.
 */
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Individual transition item in timeline.
 */
const TransitionItem = memo(function TransitionItem({
  transition,
  isLatest,
}: {
  transition: CovenantStateTransition;
  isLatest: boolean;
}) {
  const stateColor = getStateColor(transition.to_state);
  const icon = getStateIcon(transition.to_state);

  return (
    <div className="relative pl-8 pb-6 last:pb-0" data-testid="state-transition-item">
      {/* Timeline connector line */}
      {!isLatest && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-zinc-200" />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center',
          stateColor,
          isLatest && 'ring-4 ring-offset-2 ring-blue-100'
        )}
      >
        {icon}
      </div>

      {/* Transition content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={cn('text-xs', stateColor)} data-testid="state-badge">
              {getStateLabel(transition.to_state)}
            </Badge>
            <span className="text-xs text-zinc-500">
              {formatDateTime(transition.timestamp)}
            </span>
            {isLatest && (
              <Badge variant="outline" className="text-xs">
                Current
              </Badge>
            )}
          </div>

          <p className="text-sm text-zinc-700 mb-1">{transition.reason}</p>

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>
              Trigger: <span className="font-medium">{getTriggerLabel(transition.trigger)}</span>
            </span>
            {transition.test_result && (
              <>
                <span>•</span>
                <span>
                  Ratio: <span className="font-medium">{transition.calculated_ratio.toFixed(2)}x</span>
                </span>
                <span>•</span>
                <span>
                  Headroom:{' '}
                  <span
                    className={cn(
                      'font-medium',
                      transition.headroom_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {transition.headroom_percentage.toFixed(1)}%
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Statistics panel showing state duration analytics.
 */
const StatisticsPanel = memo(function StatisticsPanel({
  stateHistory,
}: {
  stateHistory: CovenantStateHistory;
}) {
  const { statistics } = stateHistory;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-zinc-200">
      <div>
        <p className="text-xs text-zinc-500 mb-1">Total Transitions</p>
        <p className="text-lg font-semibold text-zinc-900">{statistics.total_transitions}</p>
      </div>

      <div>
        <p className="text-xs text-zinc-500 mb-1">Breach Count</p>
        <p className="text-lg font-semibold text-red-600">{statistics.breach_count}</p>
      </div>

      <div>
        <p className="text-xs text-zinc-500 mb-1">Waiver Count</p>
        <p className="text-lg font-semibold text-purple-600">{statistics.waiver_count}</p>
      </div>

      <div>
        <p className="text-xs text-zinc-500 mb-1">Days in Current State</p>
        <p className="text-lg font-semibold text-zinc-900">
          {Math.round(stateHistory.days_in_current_state)}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500 mb-1">Total Monitoring</p>
        <p className="text-lg font-semibold text-zinc-900">
          {Math.round(statistics.total_monitoring_days)} days
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500 mb-1">Resolution Count</p>
        <p className="text-lg font-semibold text-blue-600">{statistics.resolution_count}</p>
      </div>
    </div>
  );
});

/**
 * Compact view of state history.
 */
const CompactStateHistory = memo(function CompactStateHistory({
  stateHistory,
}: {
  stateHistory: CovenantStateHistory;
}) {
  const currentStateColor = getStateColor(stateHistory.current_state);
  const currentStateIcon = getStateIcon(stateHistory.current_state);

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-50" data-testid="compact-state-history">
      <div className={cn('p-3 rounded-full', currentStateColor)}>{currentStateIcon}</div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-zinc-900">
            {getStateLabel(stateHistory.current_state)}
          </span>
          <Badge variant="outline" className="text-xs">
            Current State
          </Badge>
        </div>
        <p className="text-sm text-zinc-600">
          Since {formatDate(stateHistory.current_state_since)} •{' '}
          {Math.round(stateHistory.days_in_current_state)} days
        </p>
      </div>

      <div className="text-right">
        <p className="text-xs text-zinc-500">Transitions</p>
        <p className="text-lg font-semibold text-zinc-900">
          {stateHistory.statistics.total_transitions}
        </p>
      </div>
    </div>
  );
});

/**
 * Full timeline view of state history.
 */
export const StateHistoryTimeline = memo(function StateHistoryTimeline({
  stateHistory,
  compact = false,
}: StateHistoryTimelineProps) {
  if (compact) {
    return (
      <Card data-testid="state-history-timeline">
        <CardHeader>
          <CardTitle className="text-base">State History</CardTitle>
        </CardHeader>
        <CardContent>
          <CompactStateHistory stateHistory={stateHistory} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="state-history-timeline">
      <CardHeader>
        <CardTitle>Covenant State History</CardTitle>
        <p className="text-sm text-zinc-600 mt-1">
          Temporal timeline showing all state transitions for this covenant
        </p>
      </CardHeader>
      <CardContent>
        {/* Current state summary */}
        <div
          className={cn('p-4 rounded-lg mb-6', getStateColor(stateHistory.current_state))}
          data-testid="current-state-banner"
        >
          <div className="flex items-center gap-3">
            {getStateIcon(stateHistory.current_state)}
            <div>
              <p className="font-semibold">
                Current State: {getStateLabel(stateHistory.current_state)}
              </p>
              <p className="text-sm opacity-90">
                Since {formatDate(stateHistory.current_state_since)} ({Math.round(stateHistory.days_in_current_state)} days)
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {stateHistory.transitions.length > 0 ? (
            stateHistory.transitions
              .slice()
              .reverse()
              .map((transition, index) => (
                <TransitionItem
                  key={transition.id}
                  transition={transition}
                  isLatest={index === 0}
                />
              ))
          ) : (
            <p className="text-sm text-zinc-500 text-center py-8">No transition history available</p>
          )}
        </div>

        {/* Statistics */}
        {stateHistory.transitions.length > 0 && <StatisticsPanel stateHistory={stateHistory} />}
      </CardContent>
    </Card>
  );
});
