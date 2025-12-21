'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Bell,
  Check,
  ArrowRight,
  Info,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketComparisonAlert } from '../../lib';

interface MarketComparisonAlertCardProps {
  alert: MarketComparisonAlert;
  onAcknowledge?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
  index?: number;
}

function formatValue(value: number, covenantType: string): string {
  if (covenantType === 'minimum_liquidity' || covenantType === 'capex' || covenantType === 'net_worth') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return `${value.toFixed(2)}x`;
}

function getAlertIcon(alertType: string) {
  switch (alertType) {
    case 'unusually_tight':
      return TrendingDown;
    case 'unusually_loose':
      return TrendingUp;
    case 'market_shift':
      return Bell;
    case 'trend_deviation':
      return AlertTriangle;
    default:
      return Info;
  }
}

function getSeverityStyles(severity: string): { bg: string; border: string; icon: string } {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
      };
    case 'info':
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
      };
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>;
    case 'warning':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Warning</Badge>;
    case 'info':
    default:
      return <Badge variant="secondary">Info</Badge>;
  }
}

function getAlertTypeBadge(alertType: string) {
  switch (alertType) {
    case 'unusually_tight':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Tight Covenant</Badge>;
    case 'unusually_loose':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Loose Covenant</Badge>;
    case 'market_shift':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Market Shift</Badge>;
    case 'trend_deviation':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Trend Deviation</Badge>;
    default:
      return <Badge variant="outline">Alert</Badge>;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MarketComparisonAlertCard = memo(function MarketComparisonAlertCard({
  alert,
  onAcknowledge,
  onViewDetails,
  index = 0,
}: MarketComparisonAlertCardProps) {
  const AlertIcon = getAlertIcon(alert.alert_type);
  const severityStyles = getSeverityStyles(alert.severity);

  return (
    <Card
      className={cn(
        'animate-in fade-in slide-in-from-bottom-3 hover:shadow-md transition-all',
        severityStyles.bg,
        severityStyles.border,
        alert.acknowledged && 'opacity-60'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`market-alert-card-${alert.id}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn('p-2 rounded-lg bg-white shadow-sm shrink-0')}>
            <AlertIcon className={cn('w-5 h-5', severityStyles.icon)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-zinc-900">{alert.title}</h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {alert.facility_name} - {alert.borrower_name}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getSeverityBadge(alert.severity)}
                {getAlertTypeBadge(alert.alert_type)}
              </div>
            </div>

            {/* Message */}
            <p className="text-sm text-zinc-700 mt-3 leading-relaxed">
              {alert.message}
            </p>

            {/* Stats Row */}
            <div className="mt-4 grid grid-cols-4 gap-4 p-3 bg-white/60 rounded-lg">
              <div>
                <p className="text-xs text-zinc-500">Your Value</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatValue(alert.borrower_value, alert.covenant_type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Market Median</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatValue(alert.market_median, alert.covenant_type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Market Avg</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatValue(alert.market_average, alert.covenant_type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Percentile</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {alert.percentile_rank}th
                </p>
              </div>
            </div>

            {/* Recommendation */}
            <div className="mt-4 p-3 bg-white/60 rounded-lg border-l-4 border-blue-400">
              <p className="text-xs font-medium text-zinc-500 mb-1">Recommendation</p>
              <p className="text-sm text-zinc-700">{alert.recommendation}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
              <div className="text-xs text-zinc-500">
                Created {formatDate(alert.created_at)}
                {alert.acknowledged && (
                  <span className="ml-2 text-green-600">
                    - Acknowledged by {alert.acknowledged_by?.split('@')[0]} on{' '}
                    {formatDate(alert.acknowledged_at!)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!alert.acknowledged && onAcknowledge && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAcknowledge(alert.id)}
                    data-testid={`acknowledge-alert-${alert.id}-btn`}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Acknowledge
                  </Button>
                )}
                {onViewDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(alert.id)}
                    data-testid={`view-alert-details-${alert.id}-btn`}
                  >
                    View Details
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
