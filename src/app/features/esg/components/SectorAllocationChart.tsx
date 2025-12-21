'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SectorAllocation, ESGRiskLevel } from '../lib';
import { formatCurrency } from '../lib';

interface SectorAllocationChartProps {
  data: SectorAllocation[];
  title?: string;
  description?: string;
}

function getRiskBadgeVariant(risk: ESGRiskLevel): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (risk) {
    case 'low':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'high':
    case 'critical':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getRiskLabel(risk: ESGRiskLevel): string {
  return risk.charAt(0).toUpperCase() + risk.slice(1) + ' Risk';
}

function getVarianceIcon(variance: number) {
  if (variance > 2) return <TrendingUp className="w-3 h-3 text-red-600" />;
  if (variance < -2) return <TrendingDown className="w-3 h-3 text-amber-600" />;
  return <Minus className="w-3 h-3 text-green-600" />;
}

function getVarianceColor(variance: number): string {
  if (variance > 2) return 'text-red-600';
  if (variance < -2) return 'text-amber-600';
  return 'text-green-600';
}

const SECTOR_COLORS: Record<string, string> = {
  energy: 'bg-amber-500',
  real_estate: 'bg-blue-500',
  manufacturing: 'bg-purple-500',
  technology: 'bg-cyan-500',
  healthcare: 'bg-green-500',
  financial_services: 'bg-indigo-500',
  consumer_goods: 'bg-pink-500',
  utilities: 'bg-yellow-500',
  transportation: 'bg-orange-500',
  construction: 'bg-slate-500',
};

export const SectorAllocationChart = memo(function SectorAllocationChart({
  data,
  title = 'Sector Allocation',
  description = 'Portfolio distribution by industry sector',
}: SectorAllocationChartProps) {
  const totalExposure = data.reduce((sum, item) => sum + item.exposure, 0);

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="sector-allocation-chart">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Visual Bar Chart */}
        <div className="flex h-8 rounded-lg overflow-hidden mb-6" data-testid="sector-bar-chart">
          {data.map((sector) => (
            <div
              key={sector.sector}
              className={`${SECTOR_COLORS[sector.sector] || 'bg-zinc-400'} transition-all hover:opacity-80`}
              style={{ width: `${sector.percentage}%` }}
              title={`${sector.label}: ${sector.percentage.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Legend and Details */}
        <div className="space-y-3">
          {data.map((sector) => (
            <div
              key={sector.sector}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
              data-testid={`sector-item-${sector.sector}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${SECTOR_COLORS[sector.sector] || 'bg-zinc-400'}`} />
                <div>
                  <span className="font-medium text-zinc-900">{sector.label}</span>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{sector.facility_count} facilities</span>
                    <span>|</span>
                    <span>ESG: {sector.avg_esg_performance}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-zinc-900">{sector.percentage.toFixed(1)}%</div>
                  <div className="text-xs text-zinc-500">{formatCurrency(sector.exposure)}</div>
                </div>

                <div className="flex items-center gap-2 min-w-[100px]">
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Target: {sector.target_percentage}%</div>
                    <div className={`flex items-center gap-1 text-xs ${getVarianceColor(sector.variance)}`}>
                      {getVarianceIcon(sector.variance)}
                      <span>{sector.variance > 0 ? '+' : ''}{sector.variance.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <Badge variant={getRiskBadgeVariant(sector.risk_level)} className="text-xs">
                  {getRiskLabel(sector.risk_level)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-zinc-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Total Portfolio Exposure</span>
            <span className="font-semibold text-zinc-900">{formatCurrency(totalExposure)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
