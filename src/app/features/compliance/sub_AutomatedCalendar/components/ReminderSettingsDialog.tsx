'use client';

import React, { memo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  DefaultReminderSettings,
  ReminderChannel,
  ReminderTiming,
  NotificationPreferences,
} from '../lib/types';
import type { ItemType } from '../../lib/types';

interface ReminderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => void;
}

export const ReminderSettingsDialog = memo(function ReminderSettingsDialog({
  open,
  onOpenChange,
  preferences,
  onSave,
}: ReminderSettingsDialogProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [activeTab, setActiveTab] = useState<'channels' | 'reminders'>('channels');

  const channels: { id: ReminderChannel; name: string; icon: typeof Mail }[] = [
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'slack', name: 'Slack', icon: MessageSquare },
    { id: 'in_app', name: 'In-App', icon: Bell },
    { id: 'calendar_push', name: 'Calendar Push', icon: Calendar },
  ];

  const timingOptions: ReminderTiming[] = [1, 3, 7, 14, 30];

  const eventTypes: { type: ItemType; label: string }[] = [
    { type: 'covenant_test', label: 'Covenant Tests' },
    { type: 'compliance_event', label: 'Compliance Events' },
    { type: 'notification_due', label: 'Notification Due' },
    { type: 'waiver_expiration', label: 'Waiver Expirations' },
  ];

  const toggleChannel = (channel: ReminderChannel, enabled: boolean) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [`${channel}_enabled`]: enabled,
    }));
  };

  const updateReminderTimings = (
    eventType: keyof DefaultReminderSettings,
    timings: ReminderTiming[]
  ) => {
    setLocalPrefs((prev) => ({
      ...prev,
      default_reminder_settings: {
        ...prev.default_reminder_settings,
        [eventType]: {
          ...prev.default_reminder_settings[eventType],
          timings,
        },
      },
    }));
  };

  const updateReminderChannels = (
    eventType: keyof DefaultReminderSettings,
    channels: ReminderChannel[]
  ) => {
    setLocalPrefs((prev) => ({
      ...prev,
      default_reminder_settings: {
        ...prev.default_reminder_settings,
        [eventType]: {
          ...prev.default_reminder_settings[eventType],
          channels,
        },
      },
    }));
  };

  const toggleTiming = (eventType: keyof DefaultReminderSettings, timing: ReminderTiming) => {
    const currentTimings = localPrefs.default_reminder_settings[eventType].timings;
    const newTimings = currentTimings.includes(timing)
      ? currentTimings.filter((t) => t !== timing)
      : [...currentTimings, timing].sort((a, b) => b - a);
    updateReminderTimings(eventType, newTimings as ReminderTiming[]);
  };

  const toggleChannelForType = (
    eventType: keyof DefaultReminderSettings,
    channel: ReminderChannel
  ) => {
    const currentChannels = localPrefs.default_reminder_settings[eventType].channels;
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter((c) => c !== channel)
      : [...currentChannels, channel];
    updateReminderChannels(eventType, newChannels as ReminderChannel[]);
  };

  const handleSave = () => {
    onSave(localPrefs);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Reminder Settings
          </DialogTitle>
          <DialogDescription>
            Configure how and when you receive compliance reminders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('channels')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'channels'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              )}
              data-testid="tab-channels"
            >
              Notification Channels
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'reminders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              )}
              data-testid="tab-reminders"
            >
              Default Reminders
            </button>
          </div>

          {activeTab === 'channels' && (
            <div className="space-y-4">
              {/* Email settings */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-zinc-500">
                        Receive reminders via email
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPrefs.email_enabled}
                      onChange={(e) => toggleChannel('email', e.target.checked)}
                      className="sr-only peer"
                      data-testid="toggle-email"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {localPrefs.email_enabled && (
                  <div className="mt-3 pl-12">
                    <input
                      type="email"
                      value={localPrefs.email_address}
                      onChange={(e) =>
                        setLocalPrefs((prev) => ({
                          ...prev,
                          email_address: e.target.value,
                        }))
                      }
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                      data-testid="email-address-input"
                    />
                  </div>
                )}
              </div>

              {/* Slack settings */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Slack Notifications</h4>
                      <p className="text-sm text-zinc-500">
                        Receive reminders in Slack
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPrefs.slack_enabled}
                      onChange={(e) => toggleChannel('slack', e.target.checked)}
                      className="sr-only peer"
                      data-testid="toggle-slack"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {localPrefs.slack_enabled && (
                  <div className="mt-3 pl-12 space-y-2">
                    <input
                      type="text"
                      value={localPrefs.slack_channel || ''}
                      onChange={(e) =>
                        setLocalPrefs((prev) => ({
                          ...prev,
                          slack_channel: e.target.value,
                        }))
                      }
                      placeholder="#channel-name"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                      data-testid="slack-channel-input"
                    />
                    <input
                      type="url"
                      value={localPrefs.slack_webhook_url || ''}
                      onChange={(e) =>
                        setLocalPrefs((prev) => ({
                          ...prev,
                          slack_webhook_url: e.target.value,
                        }))
                      }
                      placeholder="Slack webhook URL"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                      data-testid="slack-webhook-input"
                    />
                  </div>
                )}
              </div>

              {/* In-app settings */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">In-App Notifications</h4>
                      <p className="text-sm text-zinc-500">
                        Receive reminders within LoanOS
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPrefs.in_app_enabled}
                      onChange={(e) => toggleChannel('in_app', e.target.checked)}
                      className="sr-only peer"
                      data-testid="toggle-in-app"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              {/* Quiet hours */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-zinc-100 rounded-lg">
                    <Clock className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Quiet Hours</h4>
                    <p className="text-sm text-zinc-500">
                      Pause notifications during these hours
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pl-12">
                  <div>
                    <label className="text-xs text-zinc-500">From</label>
                    <input
                      type="time"
                      value={localPrefs.quiet_hours_start || '22:00'}
                      onChange={(e) =>
                        setLocalPrefs((prev) => ({
                          ...prev,
                          quiet_hours_start: e.target.value,
                        }))
                      }
                      className="block px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                      data-testid="quiet-hours-start"
                    />
                  </div>
                  <span className="text-zinc-400">to</span>
                  <div>
                    <label className="text-xs text-zinc-500">To</label>
                    <input
                      type="time"
                      value={localPrefs.quiet_hours_end || '07:00'}
                      onChange={(e) =>
                        setLocalPrefs((prev) => ({
                          ...prev,
                          quiet_hours_end: e.target.value,
                        }))
                      }
                      className="block px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                      data-testid="quiet-hours-end"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">
                Configure default reminder timings for each event type. These
                settings will be applied to new events automatically.
              </p>

              {eventTypes.map(({ type, label }) => (
                <div key={type} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">{label}</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-zinc-500 mb-2 block">
                        Reminder timings (days before)
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {timingOptions.map((timing) => (
                          <Badge
                            key={timing}
                            variant={
                              localPrefs.default_reminder_settings[
                                type
                              ].timings.includes(timing)
                                ? 'default'
                                : 'outline'
                            }
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleTiming(type, timing)}
                            data-testid={`timing-${type}-${timing}`}
                          >
                            {timing} day{timing > 1 ? 's' : ''}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-zinc-500 mb-2 block">
                        Notification channels
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {channels.map(({ id, name, icon: Icon }) => (
                          <Badge
                            key={id}
                            variant={
                              localPrefs.default_reminder_settings[
                                type
                              ].channels.includes(id)
                                ? 'default'
                                : 'outline'
                            }
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleChannelForType(type, id)}
                            data-testid={`channel-${type}-${id}`}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="cancel-reminder-settings-btn"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="save-reminder-settings-btn">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
