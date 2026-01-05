'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { Bell, Mail, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SettlementReminder, CalendarSettlement, ReminderInterval } from '../../lib/types';

interface ReminderPanelProps {
  reminders: SettlementReminder[];
  settlements: CalendarSettlement[];
  onDismissReminder?: (reminderId: string) => void;
  onViewSettlement?: (tradeId: string) => void;
}

const channelIcons = {
  email: Mail,
  slack: MessageSquare,
  in_app: Bell,
};

const intervalLabels: Record<ReminderInterval, string> = {
  7: 'T-7 Days',
  3: 'T-3 Days',
  1: 'T-1 Day',
};

export const ReminderPanel: React.FC<ReminderPanelProps> = ({
  reminders,
  settlements,
  onDismissReminder,
  onViewSettlement,
}) => {
  // Get settlement details for each reminder
  const remindersWithDetails = reminders.map((reminder) => {
    const settlement = settlements.find(
      (s) => s.trade_id === reminder.settlement_id
    );
    return { reminder, settlement };
  });

  if (reminders.length === 0) {
    return (
      <div
        className="p-4 bg-zinc-50 rounded-lg border border-zinc-200"
        data-testid="reminder-panel-empty"
      >
        <div className="flex items-center gap-2 text-zinc-500">
          <Bell className="w-4 h-4" />
          <span className="text-sm">No upcoming reminders</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-zinc-200 overflow-hidden"
      data-testid="reminder-panel"
    >
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-zinc-600" />
            <span className="font-semibold text-sm text-zinc-900">
              Upcoming Reminders
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {reminders.length}
          </Badge>
        </div>
      </div>

      <div className="divide-y divide-zinc-100 max-h-[300px] overflow-auto">
        {remindersWithDetails.map(({ reminder, settlement }) => {
          const ChannelIcon = channelIcons[reminder.channel];
          const reminderDate = parseISO(reminder.scheduled_date);
          const isToday = format(reminderDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <div
              key={reminder.id}
              className="px-4 py-3 hover:bg-zinc-50 transition-colors"
              data-testid={`reminder-item-${reminder.id}`}
            >
              <div className="flex items-start gap-3">
                {/* Channel icon */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    isToday ? 'bg-blue-100' : 'bg-zinc-100'
                  )}
                >
                  <ChannelIcon
                    className={cn(
                      'w-4 h-4',
                      isToday ? 'text-blue-600' : 'text-zinc-500'
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">
                      {intervalLabels[reminder.days_before]} Reminder
                    </span>
                    {isToday && (
                      <Badge variant="info" className="text-[10px] px-1.5">
                        Today
                      </Badge>
                    )}
                  </div>

                  {settlement && (
                    <div className="text-xs text-zinc-500 mt-0.5 truncate">
                      {settlement.counterparty} • {settlement.trade_reference}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(reminderDate, 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {onViewSettlement && settlement && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onViewSettlement(settlement.trade_id)}
                      data-testid={`reminder-view-btn-${reminder.id}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Reminders scheduled at T-7, T-3, T-1 days</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            data-testid="reminder-configure-btn"
          >
            Configure
          </Button>
        </div>
      </div>
    </div>
  );
};

ReminderPanel.displayName = 'ReminderPanel';
