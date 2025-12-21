'use client';

import * as React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  Info,
  TrendingUp,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EvolutionAlert } from '../lib/types';

interface EvolutionAlertsListProps {
  alerts: EvolutionAlert[];
  onMarkRead?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onViewRelated?: (alert: EvolutionAlert) => void;
}

const alertIcons = {
  market_movement: TrendingUp,
  covenant_risk: AlertTriangle,
  regulatory_change: AlertCircle,
  suggestion_generated: Bell,
  action_required: Clock,
};

const severityStyles = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    text: 'text-amber-700',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    text: 'text-red-700',
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function EvolutionAlertsList({
  alerts,
  onMarkRead,
  onDismiss,
  onViewRelated,
}: EvolutionAlertsListProps) {
  const visibleAlerts = alerts.filter(a => !a.isDismissed);
  const unreadCount = visibleAlerts.filter(a => !a.isRead).length;

  if (visibleAlerts.length === 0) {
    return (
      <Card data-testid="evolution-alerts-empty">
        <CardContent className="py-8 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
          <p className="text-sm text-zinc-600">No active alerts</p>
          <p className="text-xs text-zinc-500">All systems operating normally</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="evolution-alerts-list">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-900 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Alerts
            {unreadCount > 0 && (
              <span className="rounded-full bg-blue-500 text-white text-[10px] px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {visibleAlerts.map((alert) => {
            const Icon = alertIcons[alert.type];
            const styles = severityStyles[alert.severity];

            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-md border p-3 transition-colors',
                  styles.bg,
                  styles.border,
                  !alert.isRead && 'ring-1 ring-inset ring-blue-300'
                )}
                data-testid={`alert-item-${alert.id}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', styles.icon)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn('text-sm font-medium', styles.text)}>
                          {alert.title}
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-600"
                            onClick={() => onMarkRead?.(alert.id)}
                            title="Mark as read"
                            data-testid={`alert-mark-read-${alert.id}`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-600"
                          onClick={() => onDismiss?.(alert.id)}
                          title="Dismiss"
                          data-testid={`alert-dismiss-${alert.id}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-zinc-500">
                        {formatTimeAgo(alert.createdAt)}
                      </span>
                      {alert.relatedEntity && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] px-1.5 text-blue-600"
                          onClick={() => onViewRelated?.(alert)}
                          data-testid={`alert-view-related-${alert.id}`}
                        >
                          View {alert.relatedEntity.type}
                          <ChevronRight className="ml-0.5 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
