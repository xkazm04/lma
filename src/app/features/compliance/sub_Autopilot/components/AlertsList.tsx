'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  Bell,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutopilotAlert } from '../lib/types';
import { getNotificationPriorityColor } from '../lib/types';

interface AlertsListProps {
  alerts: AutopilotAlert[];
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onViewPrediction?: (predictionId: string) => void;
}

function getAlertIcon(alertType: AutopilotAlert['alert_type']) {
  switch (alertType) {
    case 'breach_imminent':
      return AlertTriangle;
    case 'risk_escalation':
      return TrendingUp;
    case 'new_signal':
      return Activity;
    case 'remediation_due':
      return Clock;
    default:
      return Bell;
  }
}

function getAlertIconColor(alertType: AutopilotAlert['alert_type']) {
  switch (alertType) {
    case 'breach_imminent':
      return 'text-red-600 bg-red-100';
    case 'risk_escalation':
      return 'text-orange-600 bg-orange-100';
    case 'new_signal':
      return 'text-blue-600 bg-blue-100';
    case 'remediation_due':
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-zinc-600 bg-zinc-100';
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const AlertItem = memo(function AlertItem({
  alert,
  onAcknowledge,
  onDismiss,
  onViewPrediction,
}: {
  alert: AutopilotAlert;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onViewPrediction?: (predictionId: string) => void;
}) {
  const Icon = getAlertIcon(alert.alert_type);
  const iconColorClass = getAlertIconColor(alert.alert_type);

  const isCritical = alert.priority === 'critical';
  const isHigh = alert.priority === 'high';

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all hover:shadow-sm',
        alert.acknowledged
          ? 'bg-zinc-50 border-zinc-200 opacity-75'
          : isCritical
            ? 'bg-red-50 border-red-200'
            : isHigh
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-zinc-200'
      )}
      data-testid={`alert-item-${alert.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg shrink-0', iconColorClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-zinc-900">
              {alert.title}
            </span>
            <Badge className={cn('text-xs', getNotificationPriorityColor(alert.priority))}>
              {alert.priority}
            </Badge>
            {alert.acknowledged && (
              <Badge className="text-xs bg-green-100 text-green-700">
                Acknowledged
              </Badge>
            )}
          </div>

          {alert.borrower_name && (
            <p className="text-xs text-zinc-500 mt-0.5">
              {alert.borrower_name}
            </p>
          )}

          <p className="text-sm text-zinc-700 mt-2 line-clamp-2">
            {alert.message}
          </p>

          {/* Suggested Actions */}
          {alert.suggested_actions.length > 0 && !alert.acknowledged && (
            <div className="mt-3 space-y-1">
              {alert.suggested_actions.slice(0, 2).map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-zinc-600"
                >
                  <ChevronRight className="w-3 h-3 text-purple-500" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-zinc-500">
              {formatTimeAgo(alert.created_at)}
              {alert.acknowledged_by && (
                <span className="ml-2">
                  by {alert.acknowledged_by.split('@')[0]}
                </span>
              )}
            </span>

            {!alert.acknowledged && (
              <div className="flex items-center gap-2">
                {alert.prediction_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPrediction?.(alert.prediction_id!)}
                    className="h-7 text-xs"
                    data-testid={`view-prediction-btn-${alert.id}`}
                  >
                    View Details
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDismiss?.(alert.id)}
                  className="h-7 text-xs"
                  data-testid={`dismiss-alert-btn-${alert.id}`}
                >
                  <X className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAcknowledge?.(alert.id)}
                  className="h-7 text-xs bg-green-600 hover:bg-green-700"
                  data-testid={`acknowledge-alert-btn-${alert.id}`}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Acknowledge
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const AlertsList = memo(function AlertsList({
  alerts,
  onAcknowledge,
  onDismiss,
  onViewPrediction,
}: AlertsListProps) {
  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  const acknowledged = alerts.filter((a) => a.acknowledged);

  const criticalCount = unacknowledged.filter(
    (a) => a.priority === 'critical'
  ).length;

  return (
    <Card data-testid="alerts-list">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              Autopilot Alerts
              {unacknowledged.length > 0 && (
                <Badge className="bg-red-100 text-red-700">
                  {unacknowledged.length} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {criticalCount > 0
                ? `${criticalCount} critical alert${criticalCount > 1 ? 's' : ''} require attention`
                : 'AI-generated alerts from predictive analysis'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
        {unacknowledged.length === 0 && acknowledged.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-zinc-500">No active alerts</p>
          </div>
        ) : (
          <>
            {unacknowledged.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onAcknowledge={onAcknowledge}
                onDismiss={onDismiss}
                onViewPrediction={onViewPrediction}
              />
            ))}

            {acknowledged.length > 0 && (
              <div className="pt-4 border-t border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
                  Recently Acknowledged
                </p>
                {acknowledged.slice(0, 3).map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onViewPrediction={onViewPrediction}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default AlertsList;
