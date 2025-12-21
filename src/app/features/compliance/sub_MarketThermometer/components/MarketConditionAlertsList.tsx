'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketConditionAlert } from '../../lib/types';

interface MarketConditionAlertsListProps {
  alerts: MarketConditionAlert[];
}

export function MarketConditionAlertsList({ alerts }: MarketConditionAlertsListProps) {
  return (
    <div className="space-y-4" data-testid="market-condition-alerts-list">
      <h2 className="text-lg font-semibold">Market Condition Alerts</h2>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={cn(
              'p-6 border-l-4',
              alert.severity === 'critical' && 'border-l-red-500 bg-red-50',
              alert.severity === 'warning' && 'border-l-orange-500 bg-orange-50',
              alert.severity === 'info' && 'border-l-blue-500 bg-blue-50'
            )}
            data-testid={`alert-${alert.id}`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {alert.severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />}
                  {alert.severity === 'warning' && <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />}
                  <div>
                    <h3 className="font-semibold">{alert.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    data-testid={`acknowledge-alert-${alert.id}`}
                    className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>

              <p className="text-sm">{alert.message}</p>

              <div className="bg-white p-3 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Impact:</span> {alert.impact_summary}
                </div>
                <div className="text-xs text-muted-foreground">
                  Affected: {alert.affected_institution_count} institutions, {alert.affected_covenant_count} covenants ({alert.affected_percentage.toFixed(1)}%)
                </div>
              </div>

              {alert.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Recommendations:</div>
                  <ul className="space-y-1">
                    {alert.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                        <span>•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                <div><strong>Historical Context:</strong> {alert.historical_context}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
