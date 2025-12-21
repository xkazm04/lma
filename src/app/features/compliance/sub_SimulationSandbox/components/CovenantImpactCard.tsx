'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CovenantImpact, ImpactLevel } from '../lib/types';
import { getImpactLevelColor } from '../lib/types';

interface CovenantImpactCardProps {
  impact: CovenantImpact;
  index?: number;
}

function getHeadroomColor(headroom: number): string {
  if (headroom < 0) return 'text-red-600';
  if (headroom < 15) return 'text-amber-600';
  if (headroom < 30) return 'text-yellow-600';
  return 'text-green-600';
}

function getProgressColor(headroom: number): string {
  if (headroom < 0) return 'bg-red-500';
  if (headroom < 15) return 'bg-amber-500';
  if (headroom < 30) return 'bg-yellow-500';
  return 'bg-green-500';
}

function formatValue(value: number, type: string): string {
  if (type === 'minimum_liquidity') {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return value.toFixed(2) + 'x';
}

function getImpactLabel(level: ImpactLevel): string {
  switch (level) {
    case 'none':
      return 'No Impact';
    case 'low':
      return 'Low Impact';
    case 'moderate':
      return 'Moderate Impact';
    case 'high':
      return 'High Impact';
    case 'critical':
      return 'Critical Impact';
  }
}

export const CovenantImpactCard = memo(function CovenantImpactCard({
  impact,
  index = 0,
}: CovenantImpactCardProps) {
  const headroomChange = impact.headroom_change;
  const isImproving = headroomChange > 0;
  const isDeteriorating = headroomChange < 0;
  const projectedHeadroom = Math.max(0, Math.min(100, impact.projected_headroom + 100)) / 2;

  return (
    <Card
      className={cn(
        'animate-in fade-in slide-in-from-bottom-2',
        impact.would_breach && 'border-red-200 bg-red-50/30',
        impact.impact_level === 'critical' && !impact.would_breach && 'border-amber-200 bg-amber-50/30'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`covenant-impact-card-${impact.covenant_id}`}
    >
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-zinc-900 truncate">{impact.covenant_name}</h4>
              <Badge className={cn('shrink-0', getImpactLevelColor(impact.impact_level))}>
                {getImpactLabel(impact.impact_level)}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 truncate">{impact.facility_name}</p>
            <p className="text-xs text-zinc-400 truncate">{impact.borrower_name}</p>
          </div>
          {impact.would_breach ? (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="text-xs font-medium">BREACH</span>
            </div>
          ) : impact.impact_level === 'critical' ? (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs font-medium">AT RISK</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-xs font-medium">SAFE</span>
            </div>
          )}
        </div>

        {/* Current vs Projected Values */}
        <div className="grid grid-cols-3 gap-4 py-2 bg-zinc-50 rounded-lg px-3">
          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-1">Current</p>
            <p className="font-semibold text-zinc-900">
              {formatValue(impact.current_value, impact.covenant_type)}
            </p>
            <p className={cn('text-xs font-medium', getHeadroomColor(impact.current_headroom))}>
              {impact.current_headroom >= 0 ? '+' : ''}{impact.current_headroom.toFixed(1)}%
            </p>
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight className={cn(
              'w-5 h-5',
              isDeteriorating ? 'text-red-400' : isImproving ? 'text-green-400' : 'text-zinc-400'
            )} />
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-1">Projected</p>
            <p className="font-semibold text-zinc-900">
              {formatValue(impact.projected_value, impact.covenant_type)}
            </p>
            <p className={cn('text-xs font-medium', getHeadroomColor(impact.projected_headroom))}>
              {impact.projected_headroom >= 0 ? '+' : ''}{impact.projected_headroom.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Headroom Change */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 w-24">Headroom Change:</span>
          <div className="flex items-center gap-1">
            {isDeteriorating ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : isImproving ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : null}
            <span className={cn(
              'font-semibold',
              isDeteriorating ? 'text-red-600' : isImproving ? 'text-green-600' : 'text-zinc-600'
            )}>
              {headroomChange >= 0 ? '+' : ''}{headroomChange.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Projected Headroom Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Projected Headroom</span>
            <span className={getHeadroomColor(impact.projected_headroom)}>
              {impact.projected_headroom.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                getProgressColor(impact.projected_headroom)
              )}
              style={{ width: `${projectedHeadroom}%` }}
            />
          </div>
        </div>

        {/* Quarterly Projections Mini Chart */}
        {impact.quarterly_projections && impact.quarterly_projections.length > 0 && (
          <div className="pt-2 border-t border-zinc-100">
            <p className="text-xs text-zinc-500 mb-2">Quarterly Projections</p>
            <div className="flex items-end gap-1 h-12">
              {impact.quarterly_projections.map((proj, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={cn(
                      'w-full rounded-t transition-all',
                      proj.projected_headroom < 0 ? 'bg-red-400' :
                      proj.projected_headroom < 15 ? 'bg-amber-400' :
                      'bg-green-400'
                    )}
                    style={{ height: `${Math.max(4, (Math.abs(proj.projected_headroom) / 50) * 40)}px` }}
                  />
                  <span className="text-[10px] text-zinc-400">{proj.quarter.replace('Q', '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
