'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { IntelligencePrediction } from '../types';

export interface TimelineProgressProps {
  /** Prediction points along timeline */
  predictions: IntelligencePrediction[];
  /** Current value (for progress bar) */
  currentValue?: number;
  /** Target value (for progress bar) */
  targetValue?: number;
  /** Unit label */
  unit?: string;
  /** Show probability labels */
  showLabels?: boolean;
  /** Additional className */
  className?: string;
}

export const TimelineProgress = memo(function TimelineProgress({
  predictions,
  currentValue,
  targetValue,
  unit = '%',
  showLabels = true,
  className,
}: TimelineProgressProps) {
  // If we have current/target values, show a progress bar
  if (currentValue !== undefined && targetValue !== undefined) {
    const percentage = Math.min((currentValue / targetValue) * 100, 100);
    const progressColor = percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-red-500';

    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-zinc-500">Progress</span>
          <span className="font-medium text-zinc-700">
            {currentValue}{unit} / {targetValue}{unit}
          </span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={cn('h-full rounded-full transition-all duration-500 ease-out', progressColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Otherwise show timeline predictions
  if (predictions.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={cn('space-y-2', className)}>
        {showLabels && (
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            {predictions.map((p) => (
              <span key={p.horizon}>{p.horizon}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1">
          {predictions.map((prediction, idx) => {
            const probability = prediction.probability;
            const color =
              probability >= 70 ? 'bg-red-500' :
              probability >= 40 ? 'bg-amber-500' :
              'bg-green-500';

            return (
              <Tooltip key={prediction.horizon}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex-1 h-2 rounded-full cursor-help transition-all hover:h-3',
                      color
                    )}
                    style={{ opacity: 0.4 + (probability / 100) * 0.6 }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{prediction.horizon}: {probability}%</p>
                  {prediction.projected && (
                    <p className="text-zinc-400">Projected: {prediction.projected}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {showLabels && (
          <div className="flex items-center justify-between text-[10px] font-medium">
            {predictions.map((p) => (
              <span
                key={p.horizon}
                className={cn(
                  p.probability >= 70 ? 'text-red-600' :
                  p.probability >= 40 ? 'text-amber-600' :
                  'text-green-600'
                )}
              >
                {p.probability}%
              </span>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});
