'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import type { PortfolioConcentration, ConcentrationLevel } from '../lib';
import { formatCurrency } from '../lib';

interface ConcentrationChartProps {
  data: PortfolioConcentration[];
  title?: string;
  description?: string;
  filterDimension?: 'loan_type' | 'industry' | 'geography' | 'borrower';
}

function getStatusColor(status: ConcentrationLevel): string {
  switch (status) {
    case 'within_limits':
      return 'text-green-600';
    case 'approaching_limit':
      return 'text-amber-600';
    case 'exceeds_limit':
      return 'text-red-600';
    default:
      return 'text-zinc-600';
  }
}

function getStatusBadgeVariant(status: ConcentrationLevel): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'within_limits':
      return 'default';
    case 'approaching_limit':
      return 'secondary';
    case 'exceeds_limit':
      return 'destructive';
    default:
      return 'default';
  }
}

function getStatusIcon(status: ConcentrationLevel) {
  switch (status) {
    case 'within_limits':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'approaching_limit':
      return <AlertCircle className="w-4 h-4 text-amber-600" />;
    case 'exceeds_limit':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    default:
      return null;
  }
}

function getStatusLabel(status: ConcentrationLevel): string {
  switch (status) {
    case 'within_limits':
      return 'Within Limits';
    case 'approaching_limit':
      return 'Approaching';
    case 'exceeds_limit':
      return 'Exceeds Limit';
    default:
      return status;
  }
}

function getProgressColor(status: ConcentrationLevel): string {
  switch (status) {
    case 'within_limits':
      return 'bg-green-500';
    case 'approaching_limit':
      return 'bg-amber-500';
    case 'exceeds_limit':
      return 'bg-red-500';
    default:
      return 'bg-zinc-500';
  }
}

export const ConcentrationChart = memo(function ConcentrationChart({
  data,
  title = 'Concentration Analysis',
  description = 'Portfolio exposure vs limits by dimension',
  filterDimension,
}: ConcentrationChartProps) {
  const filteredData = filterDimension
    ? data.filter(item => item.dimension === filterDimension)
    : data;

  const exceedsCount = filteredData.filter(d => d.status === 'exceeds_limit').length;
  const approachingCount = filteredData.filter(d => d.status === 'approaching_limit').length;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="concentration-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {exceedsCount > 0 && (
              <Badge variant="destructive" data-testid="exceeds-limit-badge">
                {exceedsCount} Exceeds
              </Badge>
            )}
            {approachingCount > 0 && (
              <Badge variant="secondary" data-testid="approaching-limit-badge">
                {approachingCount} Approaching
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredData.map((item, index) => {
            const progressValue = Math.min((item.percentage / item.limit_percentage) * 100, 100);
            const overLimit = item.percentage > item.limit_percentage;

            return (
              <div
                key={`${item.dimension}-${item.name}-${index}`}
                className="space-y-2"
                data-testid={`concentration-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium text-zinc-900">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.facility_count} facilities
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${getStatusColor(item.status)}`}>
                      {item.percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-zinc-500">
                      / {item.limit_percentage}% limit
                    </span>
                    <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </div>

                <div className="relative">
                  <Progress
                    value={progressValue}
                    className="h-2 bg-zinc-100"
                  />
                  <div
                    className={`absolute top-0 h-2 rounded-full transition-all ${getProgressColor(item.status)}`}
                    style={{ width: `${progressValue}%` }}
                  />
                  {/* Limit marker */}
                  <div
                    className="absolute top-0 w-0.5 h-4 -mt-1 bg-zinc-400"
                    style={{ left: '100%' }}
                  />
                  {overLimit && (
                    <div
                      className="absolute top-0 h-2 rounded-r-full bg-red-300 opacity-50"
                      style={{
                        left: '100%',
                        width: `${((item.percentage - item.limit_percentage) / item.limit_percentage) * 100}%`,
                        maxWidth: '30%'
                      }}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{formatCurrency(item.exposure)}</span>
                  <span>ESG Score: {item.avg_esg_score}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
