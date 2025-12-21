'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Target,
  Clock,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { severityConfig, domainConfig, trendConfig } from '../config';
import { ConfidenceBadge } from '../primitives/ConfidenceBadge';
import { SeverityIndicator } from '../primitives/SeverityIndicator';
import { TrendIndicator } from '../primitives/TrendIndicator';
import { TimelineProgress } from '../primitives/TimelineProgress';
import type { IntelligenceItem, IntelligenceCardProps } from '../types';

export const IntelligenceCard = memo(function IntelligenceCard({
  item,
  compact = false,
  showMetrics = true,
  showFactors = false,
  showActions = true,
  onClick,
  onAction,
  className,
  testId,
}: IntelligenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sevConfig = severityConfig[item.severity];
  const domConfig = domainConfig[item.domain];

  const isCritical = item.severity === 'critical';
  const isUrgent = item.priority === 'urgent';

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handleAction = useCallback((action: string) => {
    onAction?.(action);
  }, [onAction]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
    [onClick]
  );

  // Compact view
  if (compact) {
    return (
      <div
        className={cn(
          'p-2.5 rounded-lg border transition-all cursor-pointer group',
          'border-l-4',
          sevConfig.borderColor,
          sevConfig.bgColor,
          'hover:shadow-sm',
          className
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        data-testid={testId || `intelligence-card-${item.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <SeverityIndicator
              severity={item.severity}
              variant="icon"
              size="sm"
              animate={isCritical}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-[10px] text-zinc-500 truncate">
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceBadge confidence={item.confidence} size="sm" />
            {item.predictions?.[0] && (
              <span className="text-[10px] text-zinc-500">
                {item.predictions[0].probability}%
              </span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div
      className={cn(
        'rounded-lg border transition-all cursor-pointer group',
        'border-l-4',
        sevConfig.borderColor,
        isCritical && 'ring-1 ring-red-200',
        'hover:shadow-md hover:border-zinc-300',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-testid={testId || `intelligence-card-${item.id}`}
    >
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 min-w-0">
            <SeverityIndicator
              severity={item.severity}
              variant="icon"
              size="md"
              animate={isCritical}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <h4 className="text-sm font-medium text-zinc-900 truncate">
                  {item.title}
                </h4>
                <Badge variant={sevConfig.badgeVariant} className="text-[10px] px-1.5 py-0 capitalize">
                  {item.severity}
                </Badge>
                {isUrgent && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Urgent
                  </Badge>
                )}
              </div>
              {item.subtitle && (
                <p className="text-xs text-zinc-500">{item.subtitle}</p>
              )}
              {item.relatedEntity && (
                <p className="text-[10px] text-zinc-400">
                  {item.relatedEntity.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ConfidenceBadge confidence={item.confidence} size="sm" showLabel />
            <ChevronRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Metrics Row */}
        {showMetrics && item.metrics && item.metrics.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            <TooltipProvider>
              {item.metrics.slice(0, 3).map((metric, idx) => {
                const MetricIcon = metric.icon || Target;
                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="p-2 rounded-lg bg-zinc-50">
                        <div className="flex items-center gap-1 mb-0.5">
                          <MetricIcon className="w-3 h-3 text-zinc-400" />
                          <span className="text-[10px] text-zinc-500 truncate">
                            {metric.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-zinc-900">
                            {metric.value}
                            {metric.unit && (
                              <span className="text-[10px] text-zinc-500 ml-0.5">
                                {metric.unit}
                              </span>
                            )}
                          </span>
                          {metric.trend && (
                            <TrendIndicator trend={metric.trend} size="sm" />
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{metric.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        )}

        {/* Timeline Predictions */}
        {item.predictions && item.predictions.length > 0 && (
          <div className="mb-2">
            <TimelineProgress
              predictions={item.predictions}
              currentValue={item.currentValue}
              targetValue={item.targetValue}
              unit={item.unit}
            />
          </div>
        )}

        {/* AI Summary */}
        {item.aiSummary && (
          <div className={cn(
            'p-2 rounded-lg border',
            `bg-gradient-to-r ${domConfig.gradientFrom}/5 ${domConfig.gradientTo}/5`,
            domConfig.borderLight
          )}>
            <div className="flex items-center gap-1 mb-1">
              <Zap className={cn('w-3 h-3', `text-${domConfig.primaryColor}-600`)} />
              <span className={cn('text-[10px] font-medium', `text-${domConfig.primaryColor}-600`)}>
                AI Analysis
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 line-clamp-2">
              {item.aiSummary}
            </p>
          </div>
        )}

        {/* Top Recommended Action */}
        {showActions && item.recommendedActions && item.recommendedActions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-zinc-100">
            <p className="text-[10px] text-zinc-500 mb-1">Recommended Action:</p>
            <p className="text-xs text-zinc-700 line-clamp-1">
              {item.recommendedActions[0]}
            </p>
          </div>
        )}

        {/* Expand/Collapse for factors */}
        {(showFactors || (item.factors && item.factors.length > 0)) && (
          <button
            type="button"
            className="flex items-center gap-1 mt-2 text-[10px] text-zinc-500 hover:text-zinc-700 transition-colors"
            onClick={handleToggleExpand}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide factors
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show {item.factors?.length || 0} contributing factors
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded Factors */}
      {expanded && item.factors && item.factors.length > 0 && (
        <div className="px-3 pb-3 pt-2 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Contributing Factors
          </p>
          <div className="space-y-1.5">
            {item.factors.map((factor, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg text-xs',
                  factor.impact === 'positive' && 'bg-green-50',
                  factor.impact === 'negative' && 'bg-red-50',
                  factor.impact === 'neutral' && 'bg-zinc-50'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                    factor.impact === 'positive' && 'bg-green-500',
                    factor.impact === 'negative' && 'bg-red-500',
                    factor.impact === 'neutral' && 'bg-zinc-400'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900">{factor.source}</p>
                  <p className="text-zinc-600">{factor.summary}</p>
                </div>
                {factor.weight !== undefined && (
                  <span className="text-[10px] text-zinc-500 flex-shrink-0">
                    {factor.weight}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {showActions && item.recommendedActions && item.recommendedActions.length > 1 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
              <Button
                size="sm"
                variant="default"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('view_details');
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('generate_remediation');
                }}
              >
                Generate Remediation
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
