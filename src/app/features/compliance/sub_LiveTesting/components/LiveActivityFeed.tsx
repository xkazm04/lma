'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, Zap, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeadroomAlert } from '../lib/types';
import { getAlertSeverityColor } from '../lib/types';

interface LiveActivityFeedProps {
  alerts: HeadroomAlert[];
}

function formatTimeAgo(isoString: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function getAlertIcon(alertType: string) {
  switch (alertType) {
    case 'threshold_crossed':
      return AlertTriangle;
    case 'rapid_decline':
      return TrendingDown;
    case 'breach_imminent':
      return Zap;
    case 'data_stale':
      return Clock;
    default:
      return AlertTriangle;
  }
}

export const LiveActivityFeed = memo(function LiveActivityFeed({
  alerts,
}: LiveActivityFeedProps) {
  return (
    <Card className="sticky top-4" data-testid="activity-feed">
      <CardHeader>
        <CardTitle className="text-base">Recent Alerts</CardTitle>
        <CardDescription>Live breach detection activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {alerts.length > 0 ? (
            alerts.map((alert, idx) => {
              const Icon = getAlertIcon(alert.alert_type);

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-lg border transition-all animate-in fade-in slide-in-from-right-2',
                    getAlertSeverityColor(alert.severity),
                    alert.acknowledged && 'opacity-60'
                  )}
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                  data-testid={`alert-item-${alert.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-md shrink-0',
                        alert.severity === 'critical' && 'bg-red-200',
                        alert.severity === 'high' && 'bg-orange-200',
                        alert.severity === 'medium' && 'bg-amber-200',
                        alert.severity === 'low' && 'bg-blue-200'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          alert.severity === 'critical' && 'text-red-700',
                          alert.severity === 'high' && 'text-orange-700',
                          alert.severity === 'medium' && 'text-amber-700',
                          alert.severity === 'low' && 'text-blue-700'
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={cn(
                            'text-sm font-semibold',
                            alert.severity === 'critical' && 'text-red-900',
                            alert.severity === 'high' && 'text-orange-900',
                            alert.severity === 'medium' && 'text-amber-900',
                            alert.severity === 'low' && 'text-blue-900'
                          )}
                        >
                          {alert.title}
                        </h4>
                        {alert.acknowledged && (
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-zinc-600 mb-1">{alert.covenant_name}</p>
                      <p className="text-xs text-zinc-500 mb-2">{alert.message}</p>

                      {alert.current_headroom !== null && (
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <Badge
                            variant="outline"
                            className="text-xs"
                            data-testid={`alert-headroom-${alert.id}`}
                          >
                            {alert.current_headroom.toFixed(1)}% headroom
                          </Badge>
                          {alert.change_percentage !== null && (
                            <span
                              className={cn(
                                'font-medium',
                                alert.change_percentage < 0 ? 'text-red-700' : 'text-green-700'
                              )}
                            >
                              {alert.change_percentage > 0 ? '+' : ''}
                              {alert.change_percentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>{formatTimeAgo(alert.triggered_at)}</span>
                        {!alert.acknowledged && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            data-testid={`acknowledge-btn-${alert.id}`}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>

                      {alert.recommendation && !alert.acknowledged && (
                        <div className="mt-2 pt-2 border-t border-current/10">
                          <p className="text-xs font-medium text-zinc-700 mb-1">Recommendation:</p>
                          <p className="text-xs text-zinc-600">{alert.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <p className="text-sm text-zinc-500">No recent alerts</p>
              <p className="text-xs text-zinc-400 mt-1">All covenants within safe thresholds</p>
            </div>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-200">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              data-testid="view-all-alerts-btn"
            >
              View All Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
