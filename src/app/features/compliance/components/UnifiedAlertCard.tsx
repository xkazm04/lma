'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Bell,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { cn, formatTimeAgo } from '@/lib/utils';
import type {
  UnifiedAlert,
  UnifiedAlertSeverity,
} from '../lib/unified-alert-types';
import { getUnifiedAlertColors, getUnifiedAlertLabel } from '../lib/unified-alert-types';

// =============================================================================
// Severity Icon Component
// =============================================================================

interface SeverityIconProps {
  severity: UnifiedAlertSeverity;
  className?: string;
}

const SeverityIcon = memo(function SeverityIcon({ severity, className }: SeverityIconProps) {
  switch (severity) {
    case 'critical':
      return <AlertOctagon className={className} />;
    case 'high':
      return <AlertTriangle className={className} />;
    case 'warning':
      return <AlertTriangle className={className} />;
    case 'info':
      return <Info className={className} />;
    default:
      return <Bell className={className} />;
  }
});

// =============================================================================
// Component Props
// =============================================================================

export interface UnifiedAlertCardProps {
  /** The unified alert to display */
  alert: UnifiedAlert;
  /** Whether to show compact view (for sidebars) */
  compact?: boolean;
  /** Callback when action button is clicked */
  onAction?: (alert: UnifiedAlert) => void;
  /** Callback when acknowledge button is clicked */
  onAcknowledge?: (id: string) => void;
  /** Callback when dismiss button is clicked */
  onDismiss?: (id: string) => void;
  /** Callback when view details is clicked (for linked predictions) */
  onViewDetails?: (predictionId: string) => void;
  /** Whether to show acknowledgment actions */
  showAcknowledgeActions?: boolean;
  /** Whether to show timestamp */
  showTimestamp?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export const UnifiedAlertCard = memo(function UnifiedAlertCard({
  alert,
  compact = false,
  onAction,
  onAcknowledge,
  onDismiss,
  onViewDetails,
  showAcknowledgeActions = false,
  showTimestamp = false,
}: UnifiedAlertCardProps) {
  const colors = getUnifiedAlertColors(alert.severity);
  const isCriticalOrHigh = alert.severity === 'critical' || alert.severity === 'high';

  // Compact mode: for sidebars and tight spaces
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          colors.border,
          colors.bg
        )}
        data-testid={`unified-alert-card-${alert.id}`}
      >
        <SeverityIcon severity={alert.severity} className={cn('w-4 h-4 flex-shrink-0', colors.icon)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', colors.text)}>
            {alert.title}
          </p>
          {alert.affectedFacilities && alert.affectedFacilities.length > 0 && (
            <p className="text-xs text-zinc-500 truncate">
              {alert.affectedFacilities.join(', ')}
            </p>
          )}
          {alert.borrowerName && (
            <p className="text-xs text-zinc-500 truncate">{alert.borrowerName}</p>
          )}
        </div>
        {alert.requiresEscalation && (
          <Badge variant="destructive" className="text-xs flex-shrink-0">
            Escalate
          </Badge>
        )}
        {alert.acknowledged && (
          <Badge className="text-xs bg-green-100 text-green-700 flex-shrink-0">
            Ack
          </Badge>
        )}
      </div>
    );
  }

  // Full mode: detailed card view
  return (
    <Card
      className={cn(
        'border overflow-hidden transition-all hover:shadow-sm',
        alert.acknowledged ? 'opacity-75' : '',
        colors.border
      )}
      data-testid={`unified-alert-card-${alert.id}`}
    >
      {/* Header */}
      <div className={cn('px-4 py-2 border-b', colors.bg, colors.border)}>
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', colors.iconBg)}>
            <SeverityIcon severity={alert.severity} className={cn('w-4 h-4', colors.icon)} />
          </div>
          <span className={cn('text-sm font-semibold', colors.text)}>
            {getUnifiedAlertLabel(alert.severity)} Alert
          </span>
          <Badge className={cn('text-xs ml-1', colors.bg, colors.text)}>
            {alert.severity}
          </Badge>
          {alert.requiresEscalation && (
            <Badge variant="destructive" className="text-xs ml-auto">
              Requires Escalation
            </Badge>
          )}
          {alert.acknowledged && (
            <Badge className="text-xs bg-green-100 text-green-700 ml-auto">
              Acknowledged
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title and Message */}
        <div>
          <h4 className="font-medium text-zinc-900">{alert.title}</h4>
          <p className="text-sm text-zinc-600 mt-1 line-clamp-2">{alert.message}</p>
        </div>

        {/* Borrower Name */}
        {alert.borrowerName && (
          <p className="text-xs text-zinc-500">{alert.borrowerName}</p>
        )}

        {/* Affected Facilities */}
        {alert.affectedFacilities && alert.affectedFacilities.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">
              Affected Facilities
            </p>
            <div className="flex flex-wrap gap-1">
              {alert.affectedFacilities.map((facility, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {facility}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Actions */}
        {alert.suggestedActions.length > 0 && !alert.acknowledged && (
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">
              Recommended Actions
            </p>
            <ul className="text-sm text-zinc-600 space-y-1">
              {alert.suggestedActions.slice(0, 3).map((action, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-1 text-purple-500 flex-shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          {/* Timestamp */}
          {showTimestamp && (
            <span className="text-xs text-zinc-500">
              {formatTimeAgo(alert.createdAt)}
              {alert.acknowledgedBy && (
                <span className="ml-2">
                  by {alert.acknowledgedBy.split('@')[0]}
                </span>
              )}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* View Details */}
            {alert.predictionId && onViewDetails && !alert.acknowledged && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(alert.predictionId!)}
                className="h-7 text-xs"
                data-testid={`view-details-btn-${alert.id}`}
              >
                View Details
              </Button>
            )}

            {/* Acknowledge Actions */}
            {showAcknowledgeActions && !alert.acknowledged && (
              <>
                {onDismiss && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDismiss(alert.id)}
                    className="h-7 text-xs"
                    data-testid={`dismiss-alert-btn-${alert.id}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
                {onAcknowledge && (
                  <Button
                    size="sm"
                    onClick={() => onAcknowledge(alert.id)}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    data-testid={`acknowledge-alert-btn-${alert.id}`}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Acknowledge
                  </Button>
                )}
              </>
            )}

            {/* Simple Action Button */}
            {onAction && !showAcknowledgeActions && (
              <Button
                size="sm"
                variant={isCriticalOrHigh ? 'destructive' : 'outline'}
                onClick={() => onAction(alert)}
                className="w-full"
                data-testid={`alert-action-btn-${alert.id}`}
              >
                {alert.requiresEscalation ? 'Escalate Now' : 'Take Action'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default UnifiedAlertCard;
