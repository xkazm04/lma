'use client';

import React, { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { RiskAlertCard } from './RiskAlertCard';
import type { RiskAlert, RiskAlertStatus } from '../../lib/types';

interface RiskAlertsListProps {
  alerts: RiskAlert[];
  onStatusChange?: (alertId: string, status: RiskAlertStatus) => void;
  onViewDocument?: (documentId: string) => void;
  isLoading?: boolean;
}

export const RiskAlertsList = memo(function RiskAlertsList({
  alerts,
  onStatusChange,
  onViewDocument,
  isLoading,
}: RiskAlertsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="risk-alerts-loading">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-zinc-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        data-testid="risk-alerts-empty"
      >
        <div className="p-4 rounded-full bg-green-100 mb-4">
          <AlertTriangle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 mb-1">
          No Risk Alerts Found
        </h3>
        <p className="text-sm text-zinc-500 max-w-md">
          No risk alerts match your current filters, or all documents have passed
          the risk scan without issues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="risk-alerts-list">
      {alerts.map((alert, index) => (
        <div
          key={alert.id}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
        >
          <RiskAlertCard
            alert={alert}
            onStatusChange={onStatusChange}
            onViewDocument={onViewDocument}
          />
        </div>
      ))}
    </div>
  );
});
