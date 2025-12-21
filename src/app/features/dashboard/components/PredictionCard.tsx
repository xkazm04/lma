'use client';

import React, { memo } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendIcon } from '@/components/ui/trend-icon';
import { cn } from '@/lib/utils';
import type { BreachPrediction } from '../lib/mocks';
import { riskLevelConfig, trendConfig, getHeadroomColor } from '../lib/theme';

interface PredictionCardProps {
  prediction: BreachPrediction;
  index?: number;
  compact?: boolean;
  onClick?: () => void;
}

export const PredictionCard = memo(function PredictionCard({
  prediction,
  index = 0,
  compact = false,
  onClick,
}: PredictionCardProps) {
  const config = riskLevelConfig[prediction.riskLevel];
  const isUrgent = prediction.daysUntilBreach <= 30;
  const isCritical = prediction.riskLevel === 'critical';

  if (compact) {
    return (
      <div
        className={cn(
          'p-2.5 rounded-lg border transition-all cursor-pointer group animate-in fade-in slide-in-from-right-2',
          config.borderColor,
          config.bgColor,
          'hover:shadow-sm'
        )}
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        data-testid={`prediction-card-${prediction.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('p-1 rounded', config.bgColor)}>
              <AlertTriangle className={cn('w-3.5 h-3.5', config.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">
                {prediction.borrowerName}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {prediction.covenantName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} className="text-[9px] px-1.5 py-0">
              {prediction.breachProbability}%
            </Badge>
            <span className="text-[10px] text-zinc-500">
              {prediction.daysUntilBreach}d
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2',
        config.borderColor,
        isCritical && 'ring-1 ring-red-200',
        'hover:shadow-md hover:border-zinc-300'
      )}
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      data-testid={`prediction-card-${prediction.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 min-w-0">
          <div
            className={cn(
              'p-1.5 rounded-lg mt-0.5',
              config.bgColor,
              isCritical && 'animate-pulse'
            )}
          >
            <AlertTriangle className={cn('w-4 h-4', config.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className="text-sm font-medium text-zinc-900 truncate">
                {prediction.borrowerName}
              </h4>
              <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                {prediction.riskLevel}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">
              {prediction.covenantName} ({prediction.covenantType})
            </p>
            <p className="text-[10px] text-zinc-400">{prediction.facilityName}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2 rounded-lg bg-zinc-50">
                <div className="flex items-center gap-1 mb-0.5">
                  <Target className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] text-zinc-500">Probability</span>
                </div>
                <span className={cn('text-sm font-semibold', config.color)}>
                  {prediction.breachProbability}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Confidence: {prediction.confidenceScore}% ({prediction.confidence})
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="p-2 rounded-lg bg-zinc-50">
          <div className="flex items-center gap-1 mb-0.5">
            <Clock className={cn('w-3 h-3', isUrgent ? 'text-red-500' : 'text-zinc-400')} />
            <span className="text-[10px] text-zinc-500">Timeline</span>
          </div>
          <span className={cn('text-sm font-semibold', isUrgent && 'text-red-600')}>
            {prediction.daysUntilBreach}d
          </span>
        </div>

        <div className="p-2 rounded-lg bg-zinc-50">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendIcon trend={prediction.trend} className="w-3 h-3" />
            <span className="text-[10px] text-zinc-500">Trend</span>
          </div>
          <span
            className={cn(
              'text-sm font-semibold',
              trendConfig[prediction.trend].color
            )}
          >
            {prediction.trend}
          </span>
        </div>
      </div>

      {/* Headroom Progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-zinc-500">Covenant Headroom</span>
          <span className="text-[10px] font-medium text-zinc-700">
            {prediction.headroomPercent}%
          </span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              getHeadroomColor(prediction.headroomPercent)
            )}
            style={{ width: `${prediction.headroomPercent}%` }}
          />
        </div>
      </div>

      {/* AI Summary */}
      <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="flex items-center gap-1 mb-1">
          <Zap className="w-3 h-3 text-indigo-600" />
          <span className="text-[10px] font-medium text-indigo-600">AI Analysis</span>
        </div>
        <p className="text-[11px] text-zinc-600 line-clamp-2">{prediction.aiSummary}</p>
      </div>

      {/* Top Actions */}
      {prediction.recommendedActions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-zinc-100">
          <p className="text-[10px] text-zinc-500 mb-1">Top Recommended Action:</p>
          <p className="text-xs text-zinc-700 line-clamp-1">
            {prediction.recommendedActions[0]}
          </p>
        </div>
      )}
    </div>
  );
});
