'use client';

import React, { memo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signalTypeConfig, signalDirectionConfig } from '../config';
import type { SignalItem, SignalCardProps } from '../types';

export const SignalCard = memo(function SignalCard({
  signal,
  compact = false,
  onClick,
  className,
  testId,
}: SignalCardProps) {
  const typeConfig = signalTypeConfig[signal.type];
  const directionConfig = signalDirectionConfig[signal.direction];
  const TypeIcon = typeConfig.icon;
  const DirectionIcon = directionConfig.icon;

  const bgClass =
    signal.direction === 'positive' ? typeConfig.bgPositive :
    signal.direction === 'negative' ? typeConfig.bgNegative :
    typeConfig.bgNeutral;

  const textClass =
    signal.direction === 'positive' ? typeConfig.textPositive :
    signal.direction === 'negative' ? typeConfig.textNegative :
    typeConfig.textNeutral;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  // Compact view
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg transition-all',
          bgClass,
          onClick && 'cursor-pointer hover:shadow-sm',
          className
        )}
        onClick={onClick}
        data-testid={testId || `signal-card-${signal.id}`}
      >
        <TypeIcon className={cn('w-3.5 h-3.5 flex-shrink-0', textClass)} />
        <p className="text-xs text-zinc-700 flex-1 truncate">{signal.title}</p>
        <DirectionIcon className={cn('w-3 h-3 flex-shrink-0', directionConfig.color)} />
        {signal.changeValue !== undefined && (
          <span className={cn('text-[10px] font-medium flex-shrink-0', directionConfig.color)}>
            {signal.changeValue > 0 ? '+' : ''}{signal.changeValue}{signal.changeUnit || '%'}
          </span>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all',
        bgClass,
        onClick && 'cursor-pointer hover:shadow-sm',
        className
      )}
      onClick={onClick}
      data-testid={testId || `signal-card-${signal.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg bg-white/60')}>
          <TypeIcon className={cn('w-4 h-4', textClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={cn('text-[10px] font-medium uppercase tracking-wide', textClass)}>
              {typeConfig.label}
            </span>
            <div className="flex items-center gap-1.5">
              <DirectionIcon className={cn('w-3.5 h-3.5', directionConfig.color)} />
              {signal.changeValue !== undefined && (
                <span className={cn('text-xs font-semibold', directionConfig.color)}>
                  {signal.changeValue > 0 ? '+' : ''}{signal.changeValue}{signal.changeUnit || '%'}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm font-medium text-zinc-900 mb-1">{signal.title}</p>
          <p className="text-xs text-zinc-600 line-clamp-2">{signal.summary}</p>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/40">
            <div className="flex items-center gap-2">
              {signal.source && (
                <span className="text-[10px] text-zinc-500">{signal.source}</span>
              )}
              {signal.confidence !== undefined && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded',
                  signal.confidence >= 80 ? 'bg-green-100/80 text-green-700' :
                  signal.confidence >= 60 ? 'bg-amber-100/80 text-amber-700' :
                  'bg-zinc-100/80 text-zinc-600'
                )}>
                  {signal.confidence}% conf
                </span>
              )}
              {signal.signalStrength && (
                <span className={cn(
                  'text-[10px] capitalize',
                  signal.signalStrength === 'strong' ? textClass :
                  signal.signalStrength === 'moderate' ? 'text-zinc-600' :
                  'text-zinc-400'
                )}>
                  {signal.signalStrength}
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {formatTimestamp(signal.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
