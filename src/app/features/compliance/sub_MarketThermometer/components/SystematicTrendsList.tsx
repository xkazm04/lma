'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystematicTrend } from '../../lib/types';

interface SystematicTrendsListProps {
  trends: SystematicTrend[];
}

export function SystematicTrendsList({ trends }: SystematicTrendsListProps) {
  return (
    <div className="space-y-4" data-testid="systematic-trends-list">
      <div>
        <h2 className="text-lg font-semibold mb-2">Systematic Trends</h2>
        <p className="text-sm text-muted-foreground">
          Covenant tightening/loosening patterns across the network
        </p>
      </div>

      <div className="space-y-4">
        {trends.map((trend) => (
          <Card
            key={trend.id}
            className="p-6"
            data-testid={`trend-${trend.id}`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      {trend.covenant_type.replace(/_/g, ' ')} - {trend.industry}
                    </h3>
                    {trend.trend_direction === 'tightening' && <TrendingDown className="h-5 w-5 text-red-500" />}
                    {trend.trend_direction === 'loosening' && <TrendingUp className="h-5 w-5 text-green-500" />}
                    {trend.trend_direction === 'stable' && <Minus className="h-5 w-5 text-gray-500" />}
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={trend.trend_direction === 'tightening' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {trend.trend_direction}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {trend.trend_strength} intensity
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Period</div>
                  <div className="text-sm font-medium">{trend.quarters_analyzed}Q analysis</div>
                </div>
              </div>

              <p className="text-sm">{trend.summary}</p>

              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground">Threshold Change</div>
                  <div className={cn(
                    'text-lg font-bold',
                    trend.threshold_change_percentage < 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    {trend.threshold_change_percentage > 0 ? '+' : ''}
                    {trend.threshold_change_percentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Headroom Change</div>
                  <div className={cn(
                    'text-lg font-bold',
                    trend.headroom_change_percentage < 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    {trend.headroom_change_percentage > 0 ? '+' : ''}
                    {trend.headroom_change_percentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">At-Risk Delta</div>
                  <div className={cn(
                    'text-lg font-bold',
                    trend.at_risk_delta > 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    {trend.at_risk_delta > 0 ? '+' : ''}
                    {trend.at_risk_delta.toFixed(1)}pp
                  </div>
                </div>
              </div>

              {trend.contributing_factors.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Contributing Factors:</div>
                  <ul className="space-y-1">
                    {trend.contributing_factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                        <span>•</span>
                        <span>{factor}</span>
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
