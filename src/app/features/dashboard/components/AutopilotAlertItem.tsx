'use client';

import React, { memo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AutopilotAlert } from '../lib/mocks';

interface AutopilotAlertItemProps {
  alert: AutopilotAlert;
  index?: number;
  onClick?: () => void;
  onMarkRead?: () => void;
}

const alertTypeConfig: Record<
  AutopilotAlert['type'],
  {
    icon: typeof AlertTriangle;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  new_prediction: {
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'New Prediction',
  },
  risk_escalation: {
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Risk Escalation',
  },
  intervention_due: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Intervention Due',
  },
  breach_imminent: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Breach Imminent',
  },
  action_required: {
    icon: CheckCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Action Required',
  },
};

const priorityConfig = {
  low: { color: 'text-zinc-500', borderColor: 'border-zinc-200' },
  medium: { color: 'text-blue-600', borderColor: 'border-blue-200' },
  high: { color: 'text-orange-600', borderColor: 'border-orange-200' },
  critical: { color: 'text-red-600', borderColor: 'border-red-200' },
};

export const AutopilotAlertItem = memo(function AutopilotAlertItem({
  alert,
  index = 0,
  onClick,
  onMarkRead,
}: AutopilotAlertItemProps) {
  const typeConfig = alertTypeConfig[alert.type];
  const priConfig = priorityConfig[alert.priority];
  const Icon = typeConfig.icon;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div
      className={cn(
        'p-2.5 rounded-lg border transition-all cursor-pointer group animate-in fade-in slide-in-from-right-2',
        alert.read ? 'bg-white border-zinc-100' : 'bg-blue-50/50 border-blue-200',
        !alert.read && priConfig.borderColor,
        'hover:shadow-sm hover:border-zinc-300'
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
      data-testid={`autopilot-alert-${alert.id}`}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'p-1.5 rounded-lg mt-0.5 flex-shrink-0',
            typeConfig.bgColor,
            alert.priority === 'critical' && 'animate-pulse'
          )}
        >
          <Icon className={cn('w-3.5 h-3.5', typeConfig.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className={cn('text-xs font-medium truncate', alert.read ? 'text-zinc-700' : 'text-zinc-900')}>
              {alert.title}
            </h4>
            {!alert.read && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className={cn('text-[11px] line-clamp-2 mb-1', alert.read ? 'text-zinc-500' : 'text-zinc-600')}>
            {alert.message}
          </p>
          <div className="flex items-center gap-2">
            <Badge
              variant={alert.priority === 'critical' ? 'destructive' : 'secondary'}
              className="text-[9px] px-1.5 py-0"
            >
              {alert.priority}
            </Badge>
            <span className="text-[10px] text-zinc-400">
              {formatTimestamp(alert.timestamp)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!alert.read && onMarkRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead();
              }}
              className="p-1 rounded hover:bg-zinc-100 transition-colors"
              aria-label="Mark as read"
              data-testid={`mark-read-${alert.id}`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-green-500" />
            </button>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
});
