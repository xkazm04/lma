'use client';

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import type { PerformanceStatus, TargetStatus } from '../lib';

interface StatusBadgeProps {
  status: PerformanceStatus | TargetStatus;
  showIcon?: boolean;
}

export const StatusBadge = memo(function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const getLabel = (stat: string): string => {
    switch (stat) {
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'off_track':
        return 'Off Track';
      case 'achieved':
        return 'Achieved';
      case 'missed':
        return 'Missed';
      case 'pending':
        return 'Pending';
      default:
        return stat;
    }
  };

  const getVariant = (stat: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (stat) {
      case 'on_track':
      case 'achieved':
        return 'default';
      case 'at_risk':
        return 'secondary';
      case 'off_track':
      case 'missed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getIconAriaLabel = (stat: string): string => {
    switch (stat) {
      case 'on_track':
        return 'Status indicator: on track';
      case 'achieved':
        return 'Status indicator: achieved';
      case 'at_risk':
        return 'Status indicator: at risk';
      case 'off_track':
        return 'Status indicator: off track';
      case 'missed':
        return 'Status indicator: missed';
      case 'pending':
        return 'Status indicator: pending';
      default:
        return `Status indicator: ${stat}`;
    }
  };

  const getIcon = (stat: string) => {
    const ariaLabel = getIconAriaLabel(stat);
    switch (stat) {
      case 'on_track':
        return <CheckCircle className="w-3 h-3" aria-label={ariaLabel} role="img" />;
      case 'achieved':
        return <CheckCircle className="w-3 h-3" aria-label={ariaLabel} role="img" />;
      case 'at_risk':
        return <AlertTriangle className="w-3 h-3" aria-label={ariaLabel} role="img" />;
      case 'off_track':
      case 'missed':
        return <TrendingDown className="w-3 h-3" aria-label={ariaLabel} role="img" />;
      default:
        return <Clock className="w-3 h-3" aria-label={ariaLabel} role="img" />;
    }
  };

  return (
    <Badge
      variant={getVariant(status)}
      className="transition-all hover:scale-105"
      data-testid={`status-badge-${status}`}
    >
      {showIcon && <span className="mr-1">{getIcon(status)}</span>}
      {getLabel(status)}
    </Badge>
  );
});
