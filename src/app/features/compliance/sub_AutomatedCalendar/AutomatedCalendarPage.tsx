'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Download,
  Bell,
  Settings,
  RefreshCw,
  List,
  Grid,
  Plus,
  Zap,
  ArrowRight,
  ArrowUp,
  Link2,
} from 'lucide-react';
import type { ItemType, ItemStatus } from '../lib/types';
import type { EventPriority, AutomatedCalendarEvent, NotificationPreferences, EscalationChain, EscalationAuditEntry } from './lib/types';
import {
  mockAutomatedEvents,
  mockCalendarStats,
  mockCalendarSyncConfigs,
  mockNotificationPreferences,
  mockEscalationChains,
  mockEscalationAssignees,
  mockEscalationAuditEntries,
} from './lib/mock-data';
import { filterEvents, sortEvents } from './lib/event-generator';
import {
  CalendarStatsBar,
  CalendarFilters,
  EventsList,
  CalendarExportDialog,
  ReminderSettingsDialog,
  CompletionDialog,
  SnoozeDialog,
  EscalationChainDialog,
  EscalationAuditLog,
} from './components';

export const AutomatedCalendarPage = memo(function AutomatedCalendarPage() {
  // View state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ItemType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ItemStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<EventPriority[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);

  // Dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [escalationChainDialogOpen, setEscalationChainDialogOpen] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AutomatedCalendarEvent | null>(null);
  const [selectedChain, setSelectedChain] = useState<EscalationChain | null>(null);

  // Escalation state
  const [escalationChains, setEscalationChains] = useState<EscalationChain[]>(mockEscalationChains);
  const [auditEntries, setAuditEntries] = useState<EscalationAuditEntry[]>(mockEscalationAuditEntries);

  // Notification preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>(mockNotificationPreferences);

  // Events state - in a real app, this would come from API/store
  const [events, setEvents] = useState<AutomatedCalendarEvent[]>(mockAutomatedEvents);

  // Computed values
  const facilities = useMemo(() => {
    return [...new Set(events.map((e) => e.facility_name))].sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = filterEvents(events, {
      eventTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
      facilityIds: selectedFacility !== 'all' ? [selectedFacility] : undefined,
      showCompleted,
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.facility_name.toLowerCase().includes(query) ||
          e.borrower_name.toLowerCase().includes(query)
      );
    }

    return sortEvents(filtered);
  }, [events, selectedTypes, selectedStatuses, selectedPriorities, selectedFacility, showCompleted, searchQuery]);

  // Handlers
  const handleMarkComplete = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setCompletionDialogOpen(true);
    }
  }, [events]);

  const handleUploadCertificate = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setCompletionDialogOpen(true);
    }
  }, [events]);

  const handleCompleteEvent = useCallback(
    async (eventId: string, _certificateFile?: File, notes?: string) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                status: 'completed' as ItemStatus,
                completed_at: new Date().toISOString(),
                completed_by: 'John Smith',
                notes,
              }
            : e
        )
      );
    },
    []
  );

  const handleSavePreferences = useCallback((newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs);
    // In a real app, this would save to the backend
    console.log('Saving preferences:', newPrefs);
  }, []);

  const handleRegenerateEvents = useCallback(() => {
    // In a real app, this would trigger a backend regeneration
    console.log('Regenerating events from covenants and obligations...');
    // For demo, just log the action
  }, []);

  // Escalation handlers
  const handleSnooze = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setSnoozeDialogOpen(true);
    }
  }, [events]);

  const handleSnoozeSubmit = useCallback(
    async (eventId: string, snoozeData: { snooze_hours: number; reason: string }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const snoozeUntil = new Date(Date.now() + snoozeData.snooze_hours * 60 * 60 * 1000).toISOString();

      // Update event with snooze
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                escalation: e.escalation
                  ? {
                      ...e.escalation,
                      is_snoozed: true,
                      snooze_until: snoozeUntil,
                      snooze_reason: snoozeData.reason,
                      status: 'snoozed' as const,
                    }
                  : undefined,
              }
            : e
        )
      );

      // Add audit entry
      const newAuditEntry: EscalationAuditEntry = {
        id: `audit-${Date.now()}`,
        escalation_id: `esc-${eventId}`,
        event_id: eventId,
        action: 'escalation_snoozed',
        performed_by: 'current-user',
        performed_by_name: 'John Smith',
        timestamp: new Date().toISOString(),
        previous_level: events.find((e) => e.id === eventId)?.escalation?.current_level || null,
        new_level: null,
        previous_assignee: events.find((e) => e.id === eventId)?.escalation?.current_assignee_name || null,
        new_assignee: null,
        details: `Escalation snoozed for ${snoozeData.snooze_hours} hours`,
        snooze_reason: snoozeData.reason,
        snooze_duration_hours: snoozeData.snooze_hours,
      };
      setAuditEntries((prev) => [newAuditEntry, ...prev]);

      setSnoozeDialogOpen(false);
      setSelectedEvent(null);
    },
    [events]
  );

  const handleViewEscalation = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowAuditLog(true);
    }
  }, [events]);

  const handleSaveEscalationChain = useCallback((chain: EscalationChain) => {
    setEscalationChains((prev) => {
      const exists = prev.some((c) => c.id === chain.id);
      if (exists) {
        return prev.map((c) => (c.id === chain.id ? chain : c));
      }
      return [...prev, chain];
    });
    setEscalationChainDialogOpen(false);
    setSelectedChain(null);
  }, []);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTypes.length > 0) count += selectedTypes.length;
    if (selectedStatuses.length > 0) count += selectedStatuses.length;
    if (selectedPriorities.length > 0) count += selectedPriorities.length;
    if (selectedFacility !== 'all') count += 1;
    if (searchQuery) count += 1;
    return count;
  }, [selectedTypes, selectedStatuses, selectedPriorities, selectedFacility, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
            <Link href="/compliance" className="hover:text-zinc-900 transition-colors">
              Compliance
            </Link>
            <span>/</span>
            <span className="text-zinc-900">Automated Calendar</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Automated Compliance Calendar</h1>
          <p className="text-zinc-500">
            Auto-generated deadlines from covenants and obligations with smart reminders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRegenerateEvents}
            data-testid="regenerate-events-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Events
          </Button>
          <Button
            variant="outline"
            onClick={() => setSettingsDialogOpen(true)}
            data-testid="reminder-settings-btn"
          >
            <Bell className="w-4 h-4 mr-2" />
            Reminders
          </Button>
          <Button
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
            data-testid="export-calendar-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <CalendarStatsBar stats={mockCalendarStats} />

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          {
            icon: Zap,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            title: 'Auto-Generated',
            description: 'Events from covenants',
          },
          {
            icon: Bell,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            title: 'Smart Reminders',
            description: 'Multi-channel alerts',
          },
          {
            icon: ArrowUp,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            title: 'Escalation Chains',
            description: 'PagerDuty-style escalation',
            onClick: () => setEscalationChainDialogOpen(true),
          },
          {
            icon: Calendar,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            title: 'Calendar Sync',
            description: 'Outlook & Google',
          },
          {
            icon: Plus,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            title: 'Auto-Complete',
            description: 'Certificate upload',
          },
        ].map((feature, idx) => (
          <Card
            key={feature.title}
            className={`animate-in fade-in slide-in-from-bottom-2 ${
              'onClick' in feature ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
            onClick={'onClick' in feature ? feature.onClick : undefined}
            data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${feature.iconBg}`}>
                  <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900">{feature.title}</h3>
                  <p className="text-xs text-zinc-500">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and view toggle */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-zinc-900">Filters</h3>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}
            >
              <TabsList>
                <TabsTrigger value="list" data-testid="view-list-btn">
                  <List className="w-4 h-4 mr-1" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar" data-testid="view-calendar-btn">
                  <Grid className="w-4 h-4 mr-1" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <CalendarFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTypes={selectedTypes}
            onTypesChange={setSelectedTypes}
            selectedStatuses={selectedStatuses}
            onStatusesChange={setSelectedStatuses}
            selectedPriorities={selectedPriorities}
            onPrioritiesChange={setSelectedPriorities}
            selectedFacility={selectedFacility}
            onFacilityChange={setSelectedFacility}
            facilities={facilities}
            showCompleted={showCompleted}
            onShowCompletedChange={setShowCompleted}
          />
        </CardContent>
      </Card>

      {/* Events list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Link href="/compliance/calendar">
              <Button variant="ghost" size="sm" data-testid="view-full-calendar-btn">
                View Full Calendar
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <EventsList
            events={filteredEvents}
            onMarkComplete={handleMarkComplete}
            onUploadCertificate={handleUploadCertificate}
            onSnooze={handleSnooze}
            onViewEscalation={handleViewEscalation}
          />
        </CardContent>
      </Card>

      {/* Connected calendars summary */}
      {mockCalendarSyncConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connected Calendars</CardTitle>
                <CardDescription>
                  Sync status for external calendar integrations
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                data-testid="manage-calendars-btn"
              >
                <Settings className="w-4 h-4 mr-1" />
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockCalendarSyncConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="p-2 bg-zinc-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">
                      {config.calendar_name || config.provider}
                    </p>
                    <p className="text-xs text-zinc-500 capitalize">
                      {config.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={config.sync_status === 'synced' ? 'success' : 'secondary'}
                    >
                      {config.sync_status}
                    </Badge>
                    {config.last_sync_at && (
                      <p className="text-xs text-zinc-400 mt-1">
                        Last sync:{' '}
                        {new Date(config.last_sync_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CalendarExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        events={filteredEvents}
        syncConfigs={mockCalendarSyncConfigs}
      />

      <ReminderSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        preferences={preferences}
        onSave={handleSavePreferences}
      />

      <CompletionDialog
        open={completionDialogOpen}
        onOpenChange={setCompletionDialogOpen}
        event={selectedEvent}
        onComplete={handleCompleteEvent}
      />

      <SnoozeDialog
        open={snoozeDialogOpen}
        onOpenChange={setSnoozeDialogOpen}
        event={selectedEvent}
        onSnooze={handleSnoozeSubmit}
      />

      <EscalationChainDialog
        open={escalationChainDialogOpen}
        onOpenChange={setEscalationChainDialogOpen}
        chain={selectedChain}
        availableAssignees={mockEscalationAssignees}
        onSave={handleSaveEscalationChain}
      />

      {/* Audit Log Panel */}
      {showAuditLog && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Escalation History: {selectedEvent.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAuditLog(false);
                  setSelectedEvent(null);
                }}
                data-testid="close-audit-log-btn"
              >
                Close
              </Button>
            </div>
            <div className="p-4">
              <EscalationAuditLog
                entries={auditEntries}
                eventId={selectedEvent.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
