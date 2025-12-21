'use client';

import React, { memo, useMemo } from 'react';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { HealthScoreComponent, HealthScoreDrilldownItem } from '../lib/mocks';
import { healthScoreDrilldownData } from '../lib/mocks';

interface HealthScoreDrilldownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: HealthScoreComponent | null;
}

const StatusIcon = memo(function StatusIcon({
  status,
  className,
}: {
  status: 'good' | 'warning' | 'critical';
  className?: string;
}) {
  if (status === 'good') {
    return <CheckCircle className={cn('w-4 h-4 text-green-500', className)} />;
  }
  if (status === 'warning') {
    return <AlertCircle className={cn('w-4 h-4 text-amber-500', className)} />;
  }
  return <XCircle className={cn('w-4 h-4 text-red-500', className)} />;
});

const TrendIcon = memo(function TrendIcon({
  trend,
  className,
}: {
  trend: 'up' | 'down' | 'stable';
  className?: string;
}) {
  if (trend === 'up') return <TrendingUp className={cn('w-4 h-4', className)} />;
  if (trend === 'down') return <TrendingDown className={cn('w-4 h-4', className)} />;
  return <Minus className={cn('w-4 h-4', className)} />;
});

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBadgeVariant(score: number): 'success' | 'warning' | 'destructive' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'destructive';
}

const DrilldownItemRow = memo(function DrilldownItemRow({
  item,
  index,
}: {
  item: HealthScoreDrilldownItem;
  index: number;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`drilldown-item-${item.id}`}
    >
      <div className="flex items-center gap-3">
        <StatusIcon status={item.status} />
        <div>
          <p className="font-medium text-zinc-900 text-sm">{item.name}</p>
          <p className="text-xs text-zinc-500">{item.detail}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <Badge variant={getScoreBadgeVariant(item.score)}>
            {item.score}
          </Badge>
        </div>
        <div className="text-xs text-zinc-400 min-w-[80px] text-right">{item.lastChecked}</div>
      </div>
    </div>
  );
});

export const HealthScoreDrilldownModal = memo(function HealthScoreDrilldownModal({
  open,
  onOpenChange,
  component,
}: HealthScoreDrilldownModalProps) {
  const drilldownItems = useMemo(() => {
    if (!component) return [];
    return healthScoreDrilldownData[component.id] || [];
  }, [component]);

  const statusCounts = useMemo(() => {
    return drilldownItems.reduce(
      (acc, item) => {
        acc[item.status]++;
        return acc;
      },
      { good: 0, warning: 0, critical: 0 }
    );
  }, [drilldownItems]);

  if (!component) return null;

  const isAboveBenchmark = component.score >= component.benchmark;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        data-testid="health-drilldown-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {component.name}
            <Badge variant="secondary" className="ml-2">
              Weight: {component.weight}%
            </Badge>
          </DialogTitle>
          <DialogDescription>{component.description}</DialogDescription>
        </DialogHeader>

        {/* Score Summary */}
        <div className="flex items-center gap-6 p-4 bg-zinc-50 rounded-lg">
          <div className="text-center">
            <p className={cn('text-4xl font-bold', getScoreColor(component.score))}>
              {component.score}
            </p>
            <p className="text-xs text-zinc-500">Current Score</p>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendIcon
                  trend={component.trend}
                  className={cn(
                    component.trend === 'up' && 'text-green-600',
                    component.trend === 'down' && 'text-red-600',
                    component.trend === 'stable' && 'text-zinc-500'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    component.trend === 'up' && 'text-green-600',
                    component.trend === 'down' && 'text-red-600',
                    component.trend === 'stable' && 'text-zinc-500'
                  )}
                >
                  {component.change > 0 ? '+' : ''}
                  {component.change.toFixed(1)}% from last month
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500">Industry avg:</span>
                <span className="font-medium">{component.benchmark}</span>
                <Badge
                  variant={isAboveBenchmark ? 'success' : 'warning'}
                  className="ml-1"
                >
                  {isAboveBenchmark ? '+' : ''}
                  {component.score - component.benchmark} pts
                </Badge>
              </div>
            </div>
            <Progress value={component.score} className="h-2" animate animationDelay={100} />
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex items-center gap-4 py-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">
              <span className="font-medium text-green-600">{statusCounts.good}</span> Good
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm">
              <span className="font-medium text-amber-600">{statusCounts.warning}</span> Warning
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm">
              <span className="font-medium text-red-600">{statusCounts.critical}</span> Critical
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {drilldownItems.length > 0 ? (
            drilldownItems.map((item, index) => (
              <DrilldownItemRow key={item.id} item={item} index={index} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Info className="w-8 h-8 mb-2" />
              <p>No detailed data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 text-sm text-zinc-500">
          <span>Showing {drilldownItems.length} items</span>
        </div>
      </DialogContent>
    </Dialog>
  );
});
