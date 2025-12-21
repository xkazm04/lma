'use client';

import React, { memo, useState } from 'react';
import { AlertTriangle, X, Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PredictionAlert } from '../../lib/types';
import { getPredictionRiskColor } from '../../lib/types';

interface PredictionAlertBannerProps {
  alerts: PredictionAlert[];
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alert: PredictionAlert) => void;
  maxVisible?: number;
}

function getAlertIcon(alertType: PredictionAlert['alert_type']) {
  switch (alertType) {
    case 'critical_risk':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'high_risk':
      return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    case 'threshold_crossed':
      return <Bell className="w-5 h-5 text-amber-600" />;
  }
}

function getAlertBgColor(alertType: PredictionAlert['alert_type']): string {
  switch (alertType) {
    case 'critical_risk':
      return 'bg-red-50 border-red-200';
    case 'high_risk':
      return 'bg-orange-50 border-orange-200';
    case 'threshold_crossed':
      return 'bg-amber-50 border-amber-200';
  }
}

const AlertItem = memo(function AlertItem({
  alert,
  onDismiss,
  onViewDetails,
}: {
  alert: PredictionAlert;
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alert: PredictionAlert) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border animate-in slide-in-from-top-2',
        getAlertBgColor(alert.alert_type)
      )}
      data-testid={`prediction-alert-${alert.id}`}
    >
      <div className="shrink-0 mt-0.5">{getAlertIcon(alert.alert_type)}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-900">
            {alert.covenant_name}
          </span>
          <Badge className={getPredictionRiskColor(alert.current_risk_level)}>
            {Math.round(alert.breach_probability)}% breach risk
          </Badge>
        </div>

        <p className="text-sm text-zinc-700 mt-0.5">{alert.message}</p>

        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
          <span>{alert.facility_name}</span>
          <span>•</span>
          <span>{alert.borrower_name}</span>
          <span>•</span>
          <span>{new Date(alert.created_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(alert)}
            className="h-7 px-2"
            data-testid={`alert-view-details-${alert.id}`}
          >
            <span className="text-xs">View</span>
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(alert.id)}
            className="h-7 w-7 p-0"
            data-testid={`alert-dismiss-${alert.id}`}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

export const PredictionAlertBanner = memo(function PredictionAlertBanner({
  alerts,
  onDismiss,
  onViewDetails,
  maxVisible = 3,
}: PredictionAlertBannerProps) {
  const [showAll, setShowAll] = useState(false);

  // Filter unacknowledged alerts and sort by severity
  const activeAlerts = alerts
    .filter((a) => !a.acknowledged)
    .sort((a, b) => {
      const severityOrder = { critical_risk: 0, high_risk: 1, threshold_crossed: 2 };
      return severityOrder[a.alert_type] - severityOrder[b.alert_type];
    });

  if (activeAlerts.length === 0) {
    return null;
  }

  const visibleAlerts = showAll ? activeAlerts : activeAlerts.slice(0, maxVisible);
  const hiddenCount = activeAlerts.length - maxVisible;

  return (
    <div className="space-y-2" data-testid="prediction-alert-banner">
      {visibleAlerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          onViewDetails={onViewDetails}
        />
      ))}

      {!showAll && hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-zinc-600 hover:text-zinc-900"
          data-testid="show-more-alerts-btn"
        >
          Show {hiddenCount} more alert{hiddenCount !== 1 ? 's' : ''}
        </Button>
      )}

      {showAll && activeAlerts.length > maxVisible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(false)}
          className="w-full text-zinc-600 hover:text-zinc-900"
          data-testid="show-less-alerts-btn"
        >
          Show less
        </Button>
      )}
    </div>
  );
});

export default PredictionAlertBanner;
