'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  ArrowUp,
  User,
  Bell,
  Play,
  Pause,
  CheckCircle,
  Mail,
  MessageSquare,
  Calendar,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  EscalationAuditEntry,
  EscalationAuditAction,
  ReminderChannel,
  EscalationLevel,
} from '../lib/types';
import { getEscalationLevelLabel, getEscalationLevelColor } from '../lib/types';

interface EscalationAuditLogProps {
  entries: EscalationAuditEntry[];
  eventId?: string;
  maxEntries?: number;
  showEventInfo?: boolean;
}

const getActionIcon = (action: EscalationAuditAction) => {
  switch (action) {
    case 'escalation_started':
      return Play;
    case 'escalation_level_increased':
      return ArrowUp;
    case 'escalation_assigned':
      return User;
    case 'escalation_snoozed':
      return Pause;
    case 'snooze_expired':
      return Clock;
    case 'escalation_resolved':
      return CheckCircle;
    case 'escalation_acknowledged':
      return FileText;
    case 'notification_sent':
      return Bell;
    default:
      return AlertTriangle;
  }
};

const getActionColor = (action: EscalationAuditAction): string => {
  switch (action) {
    case 'escalation_started':
      return 'text-blue-600 bg-blue-100';
    case 'escalation_level_increased':
      return 'text-orange-600 bg-orange-100';
    case 'escalation_assigned':
      return 'text-indigo-600 bg-indigo-100';
    case 'escalation_snoozed':
      return 'text-purple-600 bg-purple-100';
    case 'snooze_expired':
      return 'text-amber-600 bg-amber-100';
    case 'escalation_resolved':
      return 'text-green-600 bg-green-100';
    case 'escalation_acknowledged':
      return 'text-teal-600 bg-teal-100';
    case 'notification_sent':
      return 'text-cyan-600 bg-cyan-100';
    default:
      return 'text-zinc-600 bg-zinc-100';
  }
};

const getActionLabel = (action: EscalationAuditAction): string => {
  switch (action) {
    case 'escalation_started':
      return 'Escalation Started';
    case 'escalation_level_increased':
      return 'Level Increased';
    case 'escalation_assigned':
      return 'Assigned';
    case 'escalation_snoozed':
      return 'Snoozed';
    case 'snooze_expired':
      return 'Snooze Expired';
    case 'escalation_resolved':
      return 'Resolved';
    case 'escalation_acknowledged':
      return 'Acknowledged';
    case 'notification_sent':
      return 'Notification Sent';
    default:
      return action;
  }
};

const getChannelIcon = (channel: ReminderChannel) => {
  switch (channel) {
    case 'email':
      return Mail;
    case 'slack':
      return MessageSquare;
    case 'in_app':
      return Bell;
    case 'calendar_push':
      return Calendar;
    default:
      return Bell;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes > 0 ? `${minutes}m ago` : 'Just now';
  }
};

const formatFullTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const EscalationAuditLog = memo(function EscalationAuditLog({
  entries,
  eventId,
  maxEntries = 50,
  showEventInfo = false,
}: EscalationAuditLogProps) {
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (eventId) {
      result = entries.filter((e) => e.event_id === eventId);
    }
    return result.slice(0, maxEntries);
  }, [entries, eventId, maxEntries]);

  if (filteredEntries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-zinc-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No audit entries</p>
            <p className="text-sm">
              Escalation activity will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-zinc-600" />
          Escalation Audit Trail
          <Badge variant="secondary" className="ml-2">
            {filteredEntries.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-zinc-200" />

          <div className="space-y-4">
            {filteredEntries.map((entry, idx) => {
              const Icon = getActionIcon(entry.action);
              const colorClass = getActionColor(entry.action);

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'relative pl-12 animate-in fade-in slide-in-from-left-2',
                    idx === 0 && 'pt-0'
                  )}
                  style={{
                    animationDelay: `${idx * 30}ms`,
                    animationFillMode: 'both',
                  }}
                  data-testid={`audit-entry-${entry.id}`}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute left-2.5 w-5 h-5 rounded-full flex items-center justify-center',
                      colorClass
                    )}
                  >
                    <Icon className="w-3 h-3" />
                  </div>

                  <div className="bg-zinc-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge
                          className={cn('text-xs', colorClass)}
                          variant="secondary"
                        >
                          {getActionLabel(entry.action)}
                        </Badge>
                        <span className="text-xs text-zinc-400 ml-2">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <span
                        className="text-xs text-zinc-400"
                        title={formatFullTimestamp(entry.timestamp)}
                      >
                        {formatFullTimestamp(entry.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-700 mt-2">{entry.details}</p>

                    {/* Level change info */}
                    {entry.previous_level !== null && entry.new_level !== null && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            getEscalationLevelColor(entry.previous_level)
                          )}
                        >
                          Level {entry.previous_level}
                        </Badge>
                        <ArrowUp className="w-3 h-3 text-zinc-400 rotate-90" />
                        <Badge
                          className={cn(
                            'text-xs',
                            getEscalationLevelColor(entry.new_level)
                          )}
                        >
                          Level {entry.new_level} - {getEscalationLevelLabel(entry.new_level)}
                        </Badge>
                      </div>
                    )}

                    {/* Assignee change */}
                    {(entry.previous_assignee || entry.new_assignee) && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                        <User className="w-3 h-3" />
                        {entry.previous_assignee && entry.new_assignee ? (
                          <span>
                            {entry.previous_assignee} → {entry.new_assignee}
                          </span>
                        ) : entry.new_assignee ? (
                          <span>Assigned to {entry.new_assignee}</span>
                        ) : (
                          <span>Unassigned from {entry.previous_assignee}</span>
                        )}
                      </div>
                    )}

                    {/* Snooze reason */}
                    {entry.snooze_reason && (
                      <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-100">
                        <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
                          <Pause className="w-3 h-3" />
                          <span className="font-medium">
                            Snooze reason ({entry.snooze_duration_hours}h)
                          </span>
                        </div>
                        <p className="text-sm text-purple-800">
                          "{entry.snooze_reason}"
                        </p>
                      </div>
                    )}

                    {/* Notification channels */}
                    {entry.notification_channels &&
                      entry.notification_channels.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-zinc-500">via</span>
                          {entry.notification_channels.map((channel) => {
                            const ChannelIcon = getChannelIcon(channel);
                            return (
                              <Badge
                                key={channel}
                                variant="outline"
                                className="text-xs"
                              >
                                <ChannelIcon className="w-3 h-3 mr-1" />
                                {channel}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                    {/* Performed by */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                      <User className="w-3 h-3" />
                      <span>{entry.performed_by_name || 'System'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
