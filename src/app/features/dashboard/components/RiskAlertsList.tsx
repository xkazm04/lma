'use client';

import React, { memo } from 'react';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Layers,
  Network,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskCorrelationAlert } from '../lib/mocks';
import { getSeverityVariant } from '../lib/mocks';

interface RiskAlertsListProps {
  alerts: RiskCorrelationAlert[];
  onBorrowerClick?: (borrowerId: string) => void;
}

// Get icon for alert type
function getAlertIcon(type: RiskCorrelationAlert['type']) {
  switch (type) {
    case 'concentration':
      return Layers;
    case 'correlation_spike':
      return TrendingUp;
    case 'ripple_risk':
      return Network;
    case 'systemic':
      return Shield;
    default:
      return AlertTriangle;
  }
}

// Get alert type label
function getAlertTypeLabel(type: RiskCorrelationAlert['type']): string {
  switch (type) {
    case 'concentration':
      return 'Concentration Risk';
    case 'correlation_spike':
      return 'Correlation Spike';
    case 'ripple_risk':
      return 'Ripple Risk';
    case 'systemic':
      return 'Systemic Risk';
    default:
      return 'Alert';
  }
}

// Individual alert card
const AlertCard = memo(function AlertCard({
  alert,
  index,
  onBorrowerClick,
}: {
  alert: RiskCorrelationAlert;
  index: number;
  onBorrowerClick?: (borrowerId: string) => void;
}) {
  const Icon = getAlertIcon(alert.type);

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all animate-in fade-in slide-in-from-right-4',
        alert.severity === 'critical'
          ? 'border-red-200 bg-red-50'
          : alert.severity === 'high'
          ? 'border-amber-200 bg-amber-50'
          : alert.severity === 'medium'
          ? 'border-yellow-200 bg-yellow-50'
          : 'border-zinc-200 bg-white'
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
      data-testid={`risk-alert-${alert.id}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            alert.severity === 'critical'
              ? 'bg-red-200'
              : alert.severity === 'high'
              ? 'bg-amber-200'
              : alert.severity === 'medium'
              ? 'bg-yellow-200'
              : 'bg-zinc-200'
          )}
        >
          <Icon
            className={cn(
              'w-4 h-4',
              alert.severity === 'critical'
                ? 'text-red-700'
                : alert.severity === 'high'
                ? 'text-amber-700'
                : alert.severity === 'medium'
                ? 'text-yellow-700'
                : 'text-zinc-700'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-medium text-zinc-900">{alert.title}</h4>
            <Badge variant={getSeverityVariant(alert.severity)} className="text-[10px]">
              {alert.severity}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {getAlertTypeLabel(alert.type)}
            </Badge>
          </div>
          <p className="text-sm text-zinc-600">{alert.description}</p>
        </div>
      </div>

      {/* Affected borrowers */}
      {alert.affectedBorrowers.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">
            Affected Borrowers
          </p>
          <div className="flex flex-wrap gap-1.5">
            {alert.affectedBorrowers.map((borrower, idx) => (
              <button
                key={idx}
                className="px-2 py-1 text-xs bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                onClick={() => onBorrowerClick?.(borrower)}
                data-testid={`alert-borrower-${alert.id}-${idx}`}
              >
                {borrower}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {alert.recommendations.length > 0 && (
        <div className="pt-3 border-t border-zinc-100">
          <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
            Recommended Actions
          </p>
          <ul className="space-y-1.5">
            {alert.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-zinc-700"
              >
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-zinc-400 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-3 pt-2 border-t border-zinc-100">
        <p className="text-xs text-zinc-400">
          {new Date(alert.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
});

// Summary stats
const AlertsSummary = memo(function AlertsSummary({
  alerts,
}: {
  alerts: RiskCorrelationAlert[];
}) {
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const mediumCount = alerts.filter((a) => a.severity === 'medium').length;
  const lowCount = alerts.filter((a) => a.severity === 'low').length;

  return (
    <div
      className="flex items-center gap-4 p-3 bg-zinc-50 rounded-lg mb-4"
      data-testid="alerts-summary"
    >
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-700">
          {alerts.length} Active Alerts
        </span>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        {criticalCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {criticalCount} Critical
          </Badge>
        )}
        {highCount > 0 && (
          <Badge variant="warning" className="text-xs">
            {highCount} High
          </Badge>
        )}
        {mediumCount > 0 && (
          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
            {mediumCount} Medium
          </Badge>
        )}
        {lowCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {lowCount} Low
          </Badge>
        )}
      </div>
    </div>
  );
});

export const RiskAlertsList = memo(function RiskAlertsList({
  alerts,
  onBorrowerClick,
}: RiskAlertsListProps) {
  // Sort by severity
  const sortedAlerts = React.useMemo(() => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...alerts].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }, [alerts]);

  if (alerts.length === 0) {
    return (
      <div
        className="p-8 text-center"
        data-testid="risk-alerts-empty"
      >
        <Shield className="w-12 h-12 mx-auto mb-3 text-green-300" />
        <p className="text-sm font-medium text-zinc-700">No Active Alerts</p>
        <p className="text-xs text-zinc-500 mt-1">
          Portfolio risk correlations are within normal parameters
        </p>
      </div>
    );
  }

  return (
    <div data-testid="risk-alerts-list">
      <AlertsSummary alerts={alerts} />
      <div className="space-y-3">
        {sortedAlerts.map((alert, idx) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            index={idx}
            onBorrowerClick={onBorrowerClick}
          />
        ))}
      </div>
    </div>
  );
});
