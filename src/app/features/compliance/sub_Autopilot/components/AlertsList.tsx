'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check } from 'lucide-react';
import type { AutopilotAlert } from '../lib/types';
import { UnifiedAlertCard } from '../../components/UnifiedAlertCard';
import { normalizeAutopilotAlert } from '../../lib/unified-alert-types';

interface AlertsListProps {
  alerts: AutopilotAlert[];
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onViewPrediction?: (predictionId: string) => void;
}

/**
 * AlertsList for the Autopilot module.
 * Displays a list of alerts using the unified UnifiedAlertCard component.
 */
export const AlertsList = memo(function AlertsList({
  alerts,
  onAcknowledge,
  onDismiss,
  onViewPrediction,
}: AlertsListProps) {
  // Separate acknowledged and unacknowledged alerts
  const { unacknowledged, acknowledged } = useMemo(() => {
    const unack = alerts.filter((a) => !a.acknowledged);
    const ack = alerts.filter((a) => a.acknowledged);
    return { unacknowledged: unack, acknowledged: ack };
  }, [alerts]);

  const criticalCount = useMemo(
    () => unacknowledged.filter((a) => a.priority === 'critical').length,
    [unacknowledged]
  );

  // Normalize alerts to unified format
  const unacknowledgedNormalized = useMemo(
    () => unacknowledged.map(normalizeAutopilotAlert),
    [unacknowledged]
  );

  const acknowledgedNormalized = useMemo(
    () => acknowledged.map(normalizeAutopilotAlert),
    [acknowledged]
  );

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
            {unacknowledgedNormalized.map((alert) => (
              <UnifiedAlertCard
                key={alert.id}
                alert={alert}
                compact={false}
                showAcknowledgeActions={true}
                showTimestamp={true}
                onAcknowledge={onAcknowledge}
                onDismiss={onDismiss}
                onViewDetails={onViewPrediction}
              />
            ))}

            {acknowledged.length > 0 && (
              <div className="pt-4 border-t border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
                  Recently Acknowledged
                </p>
                {acknowledgedNormalized.slice(0, 3).map((alert) => (
                  <UnifiedAlertCard
                    key={alert.id}
                    alert={alert}
                    compact={false}
                    showAcknowledgeActions={false}
                    showTimestamp={true}
                    onViewDetails={onViewPrediction}
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
