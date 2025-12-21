'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIndustrySectorLabel } from '../../lib/types';
import type { IndustryHealthMetrics } from '../../lib/types';

interface IndustryHealthGridProps {
  healthMetrics: IndustryHealthMetrics[];
}

export function IndustryHealthGrid({ healthMetrics }: IndustryHealthGridProps) {
  return (
    <div className="space-y-4" data-testid="industry-health-grid">
      <div>
        <h2 className="text-lg font-semibold mb-2">Industry Health Metrics</h2>
        <p className="text-sm text-muted-foreground">
          Independent industry health assessments across the network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {healthMetrics.map((industry) => (
          <Card
            key={industry.industry}
            className={cn(
              'p-6 border-2',
              industry.stress_level === 'high' && 'border-red-200 bg-red-50',
              industry.stress_level === 'elevated' && 'border-orange-200 bg-orange-50'
            )}
            data-testid={`industry-health-${industry.industry}`}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{getIndustrySectorLabel(industry.industry)}</h3>
                  <Badge
                    variant={industry.stress_level === 'high' || industry.stress_level === 'elevated' ? 'destructive' : 'secondary'}
                    className="mt-1 text-xs"
                  >
                    {industry.stress_level} stress
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {industry.overall_health_score}
                  </div>
                  <div className="text-xs text-muted-foreground">health score</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Headroom</span>
                  <span className={cn(
                    'font-medium',
                    industry.average_headroom_all_covenants < 15 && 'text-red-600'
                  )}>
                    {industry.average_headroom_all_covenants.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">At-Risk</span>
                  <span className="font-medium text-red-600">
                    {industry.covenants_at_risk_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Breached</span>
                  <span className="font-medium">
                    {industry.covenants_breached_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Trend */}
              <div className={cn(
                'p-3 rounded-lg',
                industry.headroom_trend_3m === 'declining' && 'bg-red-100',
                industry.headroom_trend_3m === 'improving' && 'bg-green-100',
                industry.headroom_trend_3m === 'stable' && 'bg-gray-100'
              )}>
                <div className="flex items-center gap-2">
                  {industry.headroom_trend_3m === 'declining' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  {industry.headroom_trend_3m === 'improving' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  <span className="text-xs font-medium">
                    3M Trend: {industry.headroom_change_3m_percentage > 0 ? '+' : ''}
                    {industry.headroom_change_3m_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Early Warning Signals */}
              {industry.early_warning_signals.length > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-semibold">Early Warnings</span>
                  </div>
                  <ul className="space-y-1">
                    {industry.early_warning_signals.slice(0, 2).map((signal, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        • {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
