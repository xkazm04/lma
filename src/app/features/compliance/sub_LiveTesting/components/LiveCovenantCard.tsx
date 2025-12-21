'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  ArrowRight,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LiveCovenant } from '../lib/types';
import { LiveHeadroomChart } from './LiveHeadroomChart';

interface LiveCovenantCardProps {
  covenant: LiveCovenant;
  index?: number;
}

function formatThreshold(value: number, type: string): string {
  if (type === 'minimum_liquidity' || type === 'capex' || type === 'net_worth') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return `${value.toFixed(2)}x`;
}

function formatTimeAgo(isoString: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

function getHeadroomColor(headroom: number): string {
  if (headroom < 0) return 'text-red-600';
  if (headroom < 5) return 'text-red-500';
  if (headroom < 10) return 'text-orange-600';
  if (headroom < 15) return 'text-amber-600';
  return 'text-green-600';
}

function getHeadroomBgColor(headroom: number): string {
  if (headroom < 0) return 'bg-red-50 border-red-300';
  if (headroom < 5) return 'bg-red-50 border-red-200';
  if (headroom < 10) return 'bg-orange-50 border-orange-200';
  if (headroom < 15) return 'bg-amber-50 border-amber-200';
  return 'bg-white border-zinc-200';
}

function getTrendIcon(direction: 'improving' | 'declining' | 'stable') {
  if (direction === 'improving') {
    return <TrendingUp className="w-4 h-4 text-green-600" />;
  }
  if (direction === 'declining') {
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  }
  return <Minus className="w-4 h-4 text-zinc-400" />;
}

function getCovenantTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    leverage_ratio: 'Leverage',
    interest_coverage: 'Interest Coverage',
    fixed_charge_coverage: 'FCCR',
    debt_service_coverage: 'DSCR',
    minimum_liquidity: 'Liquidity',
    capex: 'CapEx',
    net_worth: 'Net Worth',
  };
  return labels[type] || type;
}

export const LiveCovenantCard = memo(function LiveCovenantCard({
  covenant,
  index = 0,
}: LiveCovenantCardProps) {
  const headroomColor = getHeadroomColor(covenant.current_headroom_percentage);
  const headroomBgColor = getHeadroomBgColor(covenant.current_headroom_percentage);
  const isCritical = covenant.current_headroom_percentage < 5;
  const isWarning = covenant.current_headroom_percentage >= 5 && covenant.current_headroom_percentage < 15;

  const changeFrom24h = useMemo(() => {
    if (!covenant.headroom_24h_ago) return null;
    return covenant.current_headroom_percentage - covenant.headroom_24h_ago;
  }, [covenant.current_headroom_percentage, covenant.headroom_24h_ago]);

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2',
        headroomBgColor
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`live-covenant-card-${covenant.id}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-zinc-900">{covenant.name}</h3>

              {isCritical && (
                <Badge
                  className="bg-red-100 text-red-700 hover:bg-red-100 animate-pulse"
                  data-testid="critical-badge"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Critical
                </Badge>
              )}

              {isWarning && (
                <Badge
                  className="bg-amber-100 text-amber-700 hover:bg-amber-100"
                  data-testid="warning-badge"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Warning
                </Badge>
              )}

              <Badge variant="outline">{getCovenantTypeLabel(covenant.covenant_type)}</Badge>

              {covenant.integration_status === 'active' && (
                <Badge
                  className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                  data-testid="live-monitoring-badge"
                >
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Live
                </Badge>
              )}
            </div>

            <Link
              href={`/compliance/facilities/${covenant.facility_id}`}
              className="text-sm text-zinc-500 hover:text-blue-600 transition-colors truncate block"
              data-testid="facility-link"
            >
              {covenant.facility_name} - {covenant.borrower_name}
            </Link>
          </div>

          <div className="flex items-center gap-2 ml-4 shrink-0">
            {getTrendIcon(covenant.trend_direction)}
            <Link href={`/compliance/live-testing/${covenant.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="hover:shadow-sm transition-all"
                data-testid="view-details-btn"
              >
                Details
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-4">
          <div>
            <p className="text-xs text-zinc-500">Threshold</p>
            <p className="text-sm font-semibold text-zinc-900">
              {covenant.threshold_type === 'maximum' ? 'Max' : 'Min'}:{' '}
              {formatThreshold(covenant.current_threshold, covenant.covenant_type)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Current Value</p>
            <p className="text-sm font-semibold text-zinc-900">
              {formatThreshold(covenant.current_value, covenant.covenant_type)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Headroom</p>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-semibold', headroomColor)} data-testid="headroom-value">
                {covenant.current_headroom_percentage.toFixed(1)}%
              </span>
              {changeFrom24h !== null && (
                <span
                  className={cn(
                    'text-xs',
                    changeFrom24h > 0 ? 'text-green-600' : 'text-red-600'
                  )}
                  data-testid="headroom-change"
                >
                  {changeFrom24h > 0 ? '+' : ''}
                  {changeFrom24h.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Updated</p>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-900" data-testid="last-update">
                {formatTimeAgo(covenant.last_calculated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Live Headroom Chart */}
        <div className="mb-4">
          <LiveHeadroomChart covenant={covenant} />
        </div>

        {/* Prediction & Velocity */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Velocity</p>
            <div className="flex items-center gap-1">
              {covenant.velocity_percentage_per_day > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : covenant.velocity_percentage_per_day < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-600" />
              ) : (
                <Minus className="w-3 h-3 text-zinc-400" />
              )}
              <span
                className={cn(
                  'text-sm font-semibold',
                  covenant.velocity_percentage_per_day > 0
                    ? 'text-green-600'
                    : covenant.velocity_percentage_per_day < 0
                    ? 'text-red-600'
                    : 'text-zinc-600'
                )}
                data-testid="velocity"
              >
                {Math.abs(covenant.velocity_percentage_per_day).toFixed(2)}% / day
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-1">7-Day Projection</p>
            <span
              className={cn(
                'text-sm font-semibold',
                covenant.projected_headroom_7d !== null
                  ? covenant.projected_headroom_7d < 0
                    ? 'text-red-600'
                    : covenant.projected_headroom_7d < 10
                    ? 'text-amber-600'
                    : 'text-green-600'
                  : 'text-zinc-400'
              )}
              data-testid="projection-7d"
            >
              {covenant.projected_headroom_7d !== null
                ? `${covenant.projected_headroom_7d.toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-1">30-Day Projection</p>
            <span
              className={cn(
                'text-sm font-semibold',
                covenant.projected_headroom_30d !== null
                  ? covenant.projected_headroom_30d < 0
                    ? 'text-red-600'
                    : covenant.projected_headroom_30d < 10
                    ? 'text-amber-600'
                    : 'text-green-600'
                  : 'text-zinc-400'
              )}
              data-testid="projection-30d"
            >
              {covenant.projected_headroom_30d !== null
                ? `${covenant.projected_headroom_30d.toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Breach Warning */}
        {covenant.estimated_breach_date && (
          <div className="flex items-start gap-2 mt-4 pt-4 border-t border-red-200 bg-red-50 -mx-6 px-6 -mb-6 pb-6 rounded-b-md">
            <Zap className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900" data-testid="breach-warning-title">
                Breach Predicted
              </p>
              <p className="text-sm text-red-700" data-testid="breach-warning-message">
                Based on current trajectory, breach estimated in{' '}
                {Math.ceil(
                  (new Date(covenant.estimated_breach_date).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days
              </p>
            </div>
          </div>
        )}

        {/* Alert Count */}
        {covenant.alert_count_24h > 0 && !covenant.estimated_breach_date && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium" data-testid="alert-count">
                {covenant.alert_count_24h} alert{covenant.alert_count_24h > 1 ? 's' : ''} in last 24h
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700"
              data-testid="view-alerts-btn"
            >
              View Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
