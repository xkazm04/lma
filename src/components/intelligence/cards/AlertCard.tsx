'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { severityConfig, domainConfig } from '../config';
import { SeverityIndicator } from '../primitives/SeverityIndicator';
import type { AlertItem, AlertCardProps } from '../types';

export const AlertCard = memo(function AlertCard({
  alert,
  compact = false,
  onStatusChange,
  onAction,
  className,
  testId,
}: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sevConfig = severityConfig[alert.severity];
  const domConfig = domainConfig[alert.domain];

  const isCritical = alert.severity === 'critical' || alert.priority === 'critical';

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  const handleAcknowledge = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStatusChange?.(alert.id, 'acknowledged');
    },
    [alert.id, onStatusChange]
  );

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStatusChange?.(alert.id, 'dismissed');
    },
    [alert.id, onStatusChange]
  );

  const handleAction = useCallback(
    (action: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      onAction?.(alert.id, action);
    },
    [alert.id, onAction]
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  // Compact view
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg border transition-all',
          'border-l-4',
          sevConfig.borderColor,
          alert.isRead ? 'bg-white' : sevConfig.bgColor,
          'hover:shadow-sm cursor-pointer',
          className
        )}
        onClick={handleToggleExpand}
        data-testid={testId || `alert-card-${alert.id}`}
      >
        <SeverityIndicator
          severity={alert.severity}
          variant="dot"
          size="md"
          animate={isCritical && !alert.isRead}
        />
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs truncate',
            alert.isRead ? 'text-zinc-600' : 'font-medium text-zinc-900'
          )}>
            {alert.title}
          </p>
        </div>
        <span className="text-[10px] text-zinc-400 flex-shrink-0">
          {formatTimestamp(alert.timestamp)}
        </span>
        {!alert.isRead && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={handleAcknowledge}
          >
            <Check className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        'border-l-4',
        sevConfig.borderColor,
        alert.isRead ? 'bg-white' : sevConfig.bgColor,
        isCritical && !alert.isRead && 'ring-1 ring-red-200',
        className
      )}
      data-testid={testId || `alert-card-${alert.id}`}
    >
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <SeverityIndicator
              severity={alert.severity}
              variant="icon"
              size="md"
              animate={isCritical && !alert.isRead}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <h4 className={cn(
                  'text-sm truncate',
                  alert.isRead ? 'text-zinc-600' : 'font-medium text-zinc-900'
                )}>
                  {alert.title}
                </h4>
                <Badge variant={sevConfig.badgeVariant} className="text-[10px] px-1.5 py-0 capitalize">
                  {alert.severity}
                </Badge>
                {!alert.isRead && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    New
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="capitalize">{alert.type.replace(/_/g, ' ')}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!alert.isRead && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleAcknowledge}
                title="Acknowledge"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-600"
              onClick={handleDismiss}
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={handleToggleExpand}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Message Preview (always visible) */}
        <p className={cn(
          'mt-2 text-xs',
          expanded ? 'text-zinc-700' : 'text-zinc-600 line-clamp-2'
        )}>
          {alert.message}
        </p>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Related Entity */}
          {alert.relatedEntity && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                Related
              </p>
              <p className="text-xs text-zinc-700">
                {alert.relatedEntity.type}: {alert.relatedEntity.name}
              </p>
            </div>
          )}

          {/* Recommendation */}
          {alert.recommendation && (
            <div className="mb-3 p-2 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">
                Recommendation
              </p>
              <p className="text-xs text-blue-800">{alert.recommendation}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
            {alert.actions?.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.action}
                  size="sm"
                  variant={action.variant || 'outline'}
                  className="text-xs"
                  onClick={handleAction(action.action)}
                >
                  {ActionIcon && <ActionIcon className="w-3 h-3 mr-1" />}
                  {action.label}
                </Button>
              );
            })}
            {alert.relatedEntity && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs ml-auto"
                onClick={handleAction('view_entity')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View {alert.relatedEntity.type}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
