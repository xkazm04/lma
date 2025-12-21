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
  Download,
  Calendar,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarProvider, CalendarSyncConfig } from '../lib/types';
import type { AutomatedCalendarEvent } from '../lib/types';
import { generateICalCalendar } from '../lib/event-generator';

interface CalendarExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: AutomatedCalendarEvent[];
  syncConfigs?: CalendarSyncConfig[];
}

export const CalendarExportDialog = memo(function CalendarExportDialog({
  open,
  onOpenChange,
  events,
  syncConfigs = [],
}: CalendarExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<CalendarProvider>('ical');

  const providers: {
    id: CalendarProvider;
    name: string;
    icon: string;
    description: string;
  }[] = [
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      icon: '📧',
      description: 'Sync with Outlook calendar',
    },
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      description: 'Sync with Google Calendar',
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      icon: '🍎',
      description: 'Sync with Apple Calendar',
    },
    {
      id: 'ical',
      name: 'iCal File',
      icon: '📄',
      description: 'Download .ics file',
    },
  ];

  const handleExportIcal = () => {
    const icalContent = generateICalCalendar(events);
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loanos-compliance-calendar-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySubscriptionUrl = () => {
    // In a real app, this would be the actual subscription URL
    const subscriptionUrl = `webcal://app.loanos.com/api/calendar/subscribe?token=xxx`;
    navigator.clipboard.writeText(subscriptionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectProvider = (provider: CalendarProvider) => {
    // In a real app, this would initiate OAuth flow
    console.log(`Connecting to ${provider}...`);
    // For demo purposes, just show the selection
    setExportFormat(provider);
  };

  const getProviderSyncStatus = (provider: CalendarProvider) => {
    return syncConfigs.find((c) => c.provider === provider);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Export & Sync Calendar
          </DialogTitle>
          <DialogDescription>
            Export your compliance calendar or sync with external calendars
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Calendar providers */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-700">
              Calendar Providers
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {providers.map((provider) => {
                const syncStatus = getProviderSyncStatus(provider.id);
                const isConnected = syncStatus?.sync_status === 'synced';

                return (
                  <button
                    key={provider.id}
                    onClick={() =>
                      provider.id === 'ical'
                        ? handleExportIcal()
                        : handleConnectProvider(provider.id)
                    }
                    className={cn(
                      'flex flex-col items-start p-3 border rounded-lg transition-all hover:shadow-md text-left',
                      exportFormat === provider.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-zinc-200 hover:border-zinc-300',
                      isConnected && 'border-green-500 bg-green-50'
                    )}
                    data-testid={`export-provider-${provider.id}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{provider.icon}</span>
                      {isConnected && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <span className="text-sm font-medium mt-2">
                      {provider.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {provider.description}
                    </span>
                    {isConnected && syncStatus && (
                      <Badge variant="success" className="mt-2 text-xs">
                        Synced{' '}
                        {new Date(syncStatus.last_sync_at!).toLocaleDateString()}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subscription URL */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-700">
              Calendar Subscription URL
            </h4>
            <p className="text-xs text-zinc-500">
              Use this URL to subscribe to your compliance calendar in any
              calendar app that supports iCal subscriptions.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-zinc-100 rounded-lg text-xs text-zinc-600 font-mono truncate">
                webcal://app.loanos.com/api/calendar/subscribe?token=xxx
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySubscriptionUrl}
                data-testid="copy-subscription-url-btn"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Export summary */}
          <div className="p-3 bg-zinc-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Events to export:</span>
              <Badge variant="secondary">{events.length} events</Badge>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-zinc-600">Date range:</span>
              <span className="text-zinc-900 text-xs">
                {events.length > 0
                  ? `${new Date(events[0].date).toLocaleDateString()} - ${new Date(events[events.length - 1].date).toLocaleDateString()}`
                  : 'No events'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="close-export-dialog-btn"
            >
              Close
            </Button>
            <Button
              onClick={handleExportIcal}
              data-testid="download-ical-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Download iCal File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
