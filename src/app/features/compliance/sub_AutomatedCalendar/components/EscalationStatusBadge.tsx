'use client';

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowUp,
  Clock,
  User,
  Pause,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutomatedCalendarEvent, EscalationStatus, EscalationLevel } from '../lib/types';
import {
  getEscalationStatusColor,
  getEscalationStatusLabel,
  getEscalationLevelLabel,
  getEscalationLevelColor,
} from '../lib/types';

interface EscalationStatusBadgeProps {
  event: AutomatedCalendarEvent;
  onSnooze?: () => void;
  onViewAudit?: () => void;
  compact?: boolean;
}

export const EscalationStatusBadge = memo(function EscalationStatusBadge({
  event,
  onSnooze,
  onViewAudit,
  compact = false,
}: EscalationStatusBadgeProps) {
  const escalation = event.escalation;

  if (!escalation) {
    return null;
  }

  const getStatusIcon = () => {
    if (escalation.is_snoozed) {
      return Pause;
    }
    switch (escalation.status) {
      case 'resolved':
        return CheckCircle;
      case 'not_escalated':
        return Clock;
      default:
        return ArrowUp;
    }
  };

  const Icon = getStatusIcon();

  const formatSnoozeUntil = (snoozeUntil: string) => {
    return new Date(snoozeUntil).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={cn(
                'cursor-pointer transition-all hover:scale-105',
                getEscalationStatusColor(escalation.status)
              )}
              data-testid={`escalation-badge-${event.id}`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {escalation.is_snoozed
                ? 'Snoozed'
                : escalation.current_level
                  ? `L${escalation.current_level}`
                  : 'Not Escalated'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">
                {getEscalationStatusLabel(escalation.status)}
              </p>
              {escalation.current_assignee_name && (
                <p className="text-xs text-zinc-400">
                  Assigned to: {escalation.current_assignee_name}
                </p>
              )}
              {escalation.is_snoozed && escalation.snooze_until && (
                <p className="text-xs text-purple-400">
                  Until: {formatSnoozeUntil(escalation.snooze_until)}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg border animate-in fade-in',
        escalation.is_snoozed
          ? 'bg-purple-50 border-purple-200'
          : escalation.current_level === 4
            ? 'bg-red-50 border-red-200'
            : escalation.current_level === 3
              ? 'bg-orange-50 border-orange-200'
              : escalation.current_level === 2
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
      )}
      data-testid={`escalation-panel-${event.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-2 rounded-lg',
              escalation.is_snoozed
                ? 'bg-purple-100'
                : escalation.current_level === 4
                  ? 'bg-red-100'
                  : escalation.current_level === 3
                    ? 'bg-orange-100'
                    : escalation.current_level === 2
                      ? 'bg-amber-100'
                      : 'bg-blue-100'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4',
                escalation.is_snoozed
                  ? 'text-purple-600'
                  : escalation.current_level === 4
                    ? 'text-red-600'
                    : escalation.current_level === 3
                      ? 'text-orange-600'
                      : escalation.current_level === 2
                        ? 'text-amber-600'
                        : 'text-blue-600'
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge className={getEscalationStatusColor(escalation.status)}>
                {escalation.is_snoozed ? (
                  <>
                    <Pause className="w-3 h-3 mr-1" />
                    Snoozed
                  </>
                ) : escalation.current_level ? (
                  <>
                    <ArrowUp className="w-3 h-3 mr-1" />
                    Level {escalation.current_level} - {getEscalationLevelLabel(escalation.current_level)}
                  </>
                ) : (
                  'Not Escalated'
                )}
              </Badge>
            </div>
            {escalation.current_assignee_name && (
              <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                <User className="w-3 h-3" />
                <span>Assigned to {escalation.current_assignee_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!escalation.is_snoozed &&
            escalation.status !== 'resolved' &&
            onSnooze && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSnooze}
                className="text-xs"
                data-testid={`snooze-btn-${event.id}`}
              >
                <Pause className="w-3 h-3 mr-1" />
                Snooze
              </Button>
            )}
          {onViewAudit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAudit}
              className="text-xs"
              data-testid={`view-audit-btn-${event.id}`}
            >
              View History
            </Button>
          )}
        </div>
      </div>

      {/* Snooze info */}
      {escalation.is_snoozed && escalation.snooze_until && (
        <div className="mt-3 p-2 bg-white/50 rounded border border-purple-100">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-purple-800">
              Snoozed until {formatSnoozeUntil(escalation.snooze_until)}
            </span>
          </div>
          {escalation.snooze_reason && (
            <p className="mt-1 text-xs text-purple-600 italic">
              "{escalation.snooze_reason}"
            </p>
          )}
        </div>
      )}

      {/* Escalation warning for high levels */}
      {!escalation.is_snoozed && escalation.current_level && escalation.current_level >= 3 && (
        <div className="mt-3 flex items-start gap-2 p-2 bg-white/50 rounded border border-orange-100">
          <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-orange-800">
            <p className="font-medium">High priority escalation</p>
            <p>
              This item has been escalated to {getEscalationLevelLabel(escalation.current_level)} level.
              Immediate attention required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
