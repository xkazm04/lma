'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Scale,
  FileCheck,
  Bell,
  AlertTriangle,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  Upload,
  CheckCircle,
  Calendar,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutomatedCalendarEvent } from '../lib/types';
import {
  getEventPriorityColor,
  getEventPriorityBadgeVariant,
} from '../lib/types';
import {
  getItemTypeColor,
  getItemTypeLabel,
  getItemStatusColor,
  getItemStatusLabel,
} from '../../lib/types';

interface EventCardProps {
  event: AutomatedCalendarEvent;
  index?: number;
  onMarkComplete?: (eventId: string) => void;
  onUploadCertificate?: (eventId: string) => void;
}

export const EventCard = memo(function EventCard({
  event,
  index = 0,
  onMarkComplete,
  onUploadCertificate,
}: EventCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getEventIcon = () => {
    switch (event.event_type) {
      case 'covenant_test':
        return Scale;
      case 'compliance_event':
        return FileCheck;
      case 'notification_due':
        return Bell;
      case 'waiver_expiration':
        return AlertTriangle;
      default:
        return Calendar;
    }
  };

  const getEventIconBg = () => {
    switch (event.event_type) {
      case 'covenant_test':
        return 'bg-purple-100';
      case 'compliance_event':
        return 'bg-blue-100';
      case 'notification_due':
        return 'bg-amber-100';
      case 'waiver_expiration':
        return 'bg-red-100';
      default:
        return 'bg-zinc-100';
    }
  };

  const getEventIconColor = () => {
    switch (event.event_type) {
      case 'covenant_test':
        return 'text-purple-600';
      case 'compliance_event':
        return 'text-blue-600';
      case 'notification_due':
        return 'text-amber-600';
      case 'waiver_expiration':
        return 'text-red-600';
      default:
        return 'text-zinc-600';
    }
  };

  const Icon = getEventIcon();

  const daysUntil = Math.ceil(
    (new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getChannelIcon = (channel: string) => {
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

  return (
    <Card
      className={cn(
        'animate-in fade-in slide-in-from-bottom-2 transition-all hover:shadow-md',
        event.status === 'overdue' && 'border-red-200 bg-red-50/30',
        event.status === 'completed' && 'opacity-60'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`event-card-${event.id}`}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'p-2 rounded-lg transition-transform hover:scale-110',
                getEventIconBg()
              )}
            >
              <Icon className={cn('w-5 h-5', getEventIconColor())} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-zinc-900">{event.title}</h3>
                <Badge
                  className={cn('text-xs', getItemTypeColor(event.event_type))}
                  variant="secondary"
                >
                  {getItemTypeLabel(event.event_type)}
                </Badge>
                <Badge
                  variant={getEventPriorityBadgeVariant(event.priority)}
                  className="text-xs"
                >
                  {event.priority}
                </Badge>
              </div>

              <p className="text-sm text-zinc-500 mt-1">{event.description}</p>

              <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>{event.facility_name}</span>
                </div>
                <span className="text-zinc-300">•</span>
                <span>{event.borrower_name}</span>
                {event.clause_reference && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <span>{event.clause_reference}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Badge
                  className={cn('text-xs', getItemStatusColor(event.status))}
                >
                  {getItemStatusLabel(event.status)}
                </Badge>
                <span className="text-xs text-zinc-500">
                  {formatDate(event.date)}
                </span>
                {event.status !== 'completed' && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      daysUntil < 0
                        ? 'text-red-600'
                        : daysUntil <= 3
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                    )}
                  >
                    {daysUntil < 0
                      ? `${Math.abs(daysUntil)} days overdue`
                      : daysUntil === 0
                        ? 'Due today'
                        : `${daysUntil} days remaining`}
                  </span>
                )}
              </div>

              {/* Reminders summary */}
              {event.reminders.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span className="text-xs text-zinc-500">
                    {event.reminders.filter((r) => r.is_active).length} active
                    reminders
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      new Set(event.reminders.flatMap((r) => r.channels))
                    ).map((channel) => {
                      const ChannelIcon = getChannelIcon(channel);
                      return (
                        <span key={channel} title={channel}>
                          <ChannelIcon className="w-3 h-3 text-zinc-400" />
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {event.status !== 'completed' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUploadCertificate?.(event.id)}
                  data-testid={`upload-certificate-btn-${event.id}`}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onMarkComplete?.(event.id)}
                  data-testid={`mark-complete-btn-${event.id}`}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              data-testid={`expand-event-btn-${event.id}`}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2">
                  Event Details
                </h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Source</dt>
                    <dd className="text-zinc-900">{event.source_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Frequency</dt>
                    <dd className="text-zinc-900 capitalize">
                      {event.frequency.replace(/_/g, ' ')}
                    </dd>
                  </div>
                  {event.next_occurrence && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Next Occurrence</dt>
                      <dd className="text-zinc-900">
                        {formatDate(event.next_occurrence)}
                      </dd>
                    </div>
                  )}
                  {event.recipient_role && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Recipient</dt>
                      <dd className="text-zinc-900">{event.recipient_role}</dd>
                    </div>
                  )}
                  {event.deadline_days_after_period && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Deadline</dt>
                      <dd className="text-zinc-900">
                        {event.deadline_days_after_period} days after period end
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2">
                  Reminders
                </h4>
                {event.reminders.length > 0 ? (
                  <ul className="space-y-2">
                    {event.reminders.map((reminder) => (
                      <li
                        key={reminder.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-zinc-600">
                          {reminder.timing_days} days before
                        </span>
                        <div className="flex items-center gap-1">
                          {reminder.channels.map((channel) => {
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
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500">No reminders set</p>
                )}
              </div>
            </div>

            {event.completed_at && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Completed on {formatDate(event.completed_at)}
                    {event.completed_by && ` by ${event.completed_by}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
