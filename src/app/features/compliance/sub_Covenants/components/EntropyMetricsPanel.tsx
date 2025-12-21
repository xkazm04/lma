'use client';

import React, { memo, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { EntropyMetrics } from '../../lib/entropy';
import {
  getEntropyColorClass,
  getAttentionLevelColorClass,
  getAttentionLevelLabel,
} from '../../lib/entropy';

interface EntropyMetricsPanelProps {
  metrics: EntropyMetrics;
  compact?: boolean;
  showDetails?: boolean;
}

/**
 * EntropyMetricsPanel - Displays covenant entropy metrics
 * Shows information content, entropy velocity, and attention level
 */
export const EntropyMetricsPanel = memo(function EntropyMetricsPanel({
  metrics,
  compact = false,
  showDetails = true,
}: EntropyMetricsPanelProps) {
  const AttentionIcon = useMemo(() => {
    switch (metrics.attentionLevel) {
      case 5: return AlertTriangle;
      case 4: return AlertCircle;
      case 3: return Info;
      case 2: return Eye;
      case 1: return CheckCircle;
      default: return Info;
    }
  }, [metrics.attentionLevel]);

  const entropyColorClass = getEntropyColorClass(metrics.entropy);
  const attentionColorClass = getAttentionLevelColorClass(metrics.attentionLevel);

  // Visual representation of entropy as a gauge
  const entropyPercentage = metrics.entropy * 100;
  const informationPercentage = metrics.informationContent * 100;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-2 cursor-pointer"
              data-testid="entropy-metrics-compact"
            >
              <Badge
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium transition-all hover:shadow-sm',
                  attentionColorClass
                )}
                data-testid="attention-level-badge"
              >
                <AttentionIcon className="w-3 h-3" />
                <span>Alert Lv {metrics.attentionLevel}</span>
              </Badge>

              <div className="flex items-center gap-1 text-xs">
                <Activity className={cn('w-3 h-3', entropyColorClass)} />
                <span className={cn('font-semibold', entropyColorClass)}>
                  {informationPercentage.toFixed(0)}%
                </span>
                <span className="text-zinc-500">info</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm" data-testid="entropy-tooltip-compact">
            <div className="space-y-2 py-1">
              <div className="font-semibold text-sm border-b border-zinc-200 pb-2">
                Information Entropy Metrics
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Information Content:</span>
                  <span className={cn('font-semibold', entropyColorClass)}>
                    {informationPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Entropy:</span>
                  <span className="font-medium">{entropyPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Alert Priority:</span>
                  <span className="font-semibold">{metrics.alertPriority.toFixed(0)}/100</span>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-200 text-xs text-zinc-600">
                {metrics.interpretation}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3 transition-all',
        attentionColorClass,
        metrics.attentionLevel >= 4 && 'shadow-md'
      )}
      data-testid="entropy-metrics-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <h4 className="font-semibold text-sm">Information Entropy Analysis</h4>
        </div>
        <Badge
          variant="outline"
          className={cn('text-xs font-semibold', attentionColorClass)}
          data-testid="attention-level-badge-full"
        >
          <AttentionIcon className="w-3 h-3 mr-1" />
          {getAttentionLevelLabel(metrics.attentionLevel)}
        </Badge>
      </div>

      {/* Entropy Gauge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600">Information Content (Risk Density)</span>
          <span className={cn('font-bold text-sm', entropyColorClass)}>
            {informationPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="relative">
          {/* Background gradient bar */}
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-green-200 via-amber-200 to-red-200"
            data-testid="entropy-gauge-bg"
          />
          {/* Information content indicator */}
          <div
            className="absolute top-0 left-0 h-2.5 rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 transition-all duration-500"
            style={{ width: `${informationPercentage}%` }}
            data-testid="entropy-gauge-fill"
          />
          {/* Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white border-2 border-zinc-700 rounded-full shadow-md transition-all duration-500"
            style={{ left: `calc(${informationPercentage}% - 2px)` }}
            data-testid="entropy-gauge-marker"
          />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500">
          <span>Low Risk (High Entropy)</span>
          <span>High Risk (Low Entropy)</span>
        </div>
      </div>

      {/* Metrics Grid */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-current/20">
          {/* Entropy Value */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <Activity className="w-3 h-3" />
              <span>Entropy</span>
            </div>
            <div className={cn('text-lg font-bold', entropyColorClass)}>
              {entropyPercentage.toFixed(0)}%
            </div>
          </div>

          {/* Velocity */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              {metrics.entropyVelocity < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-600" />
              ) : (
                <TrendingUp className="w-3 h-3 text-green-600" />
              )}
              <span>Velocity</span>
            </div>
            <div
              className={cn(
                'text-lg font-bold',
                metrics.entropyVelocity < 0 ? 'text-red-600' : 'text-green-600'
              )}
              data-testid="entropy-velocity"
            >
              {metrics.entropyVelocity >= 0 ? '+' : ''}
              {(metrics.entropyVelocity * 100).toFixed(1)}
            </div>
          </div>

          {/* Alert Priority */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <Zap className="w-3 h-3" />
              <span>Priority</span>
            </div>
            <div
              className="text-lg font-bold text-zinc-900"
              data-testid="alert-priority"
            >
              {metrics.alertPriority.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* Interpretation */}
      {showDetails && (
        <div className="pt-2 border-t border-current/20">
          <p className="text-xs text-zinc-700 leading-relaxed" data-testid="entropy-interpretation">
            <span className="font-semibold">Analysis:</span> {metrics.interpretation}
          </p>
        </div>
      )}

      {/* Acceleration indicator (if significant) */}
      {showDetails && Math.abs(metrics.entropyAcceleration) > 0.01 && (
        <div
          className={cn(
            'flex items-center gap-2 text-xs px-3 py-2 rounded-md',
            metrics.entropyAcceleration < 0
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          )}
          data-testid="entropy-acceleration-alert"
        >
          <Zap className="w-3 h-3" />
          <span className="font-medium">
            {metrics.entropyAcceleration < 0 ? 'Accelerating deterioration' : 'Improving acceleration'}:{' '}
            {(metrics.entropyAcceleration * 100).toFixed(2)} bits/period²
          </span>
        </div>
      )}
    </div>
  );
});
