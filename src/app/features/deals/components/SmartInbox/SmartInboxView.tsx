'use client';

import React, { memo, useCallback, useEffect, useState } from 'react';
import { Inbox, Keyboard, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { InboxStatsHeader } from './InboxStatsHeader';
import { PriorityDealCard } from './PriorityDealCard';
import type { PrioritizedDeal, TriageAction } from '../../lib/priority-calculation';
import { getInboxStats } from '../../lib/priority-calculation';

interface InboxViewData {
  critical: PrioritizedDeal[];
  high: PrioritizedDeal[];
  medium: PrioritizedDeal[];
  low: PrioritizedDeal[];
}

interface SmartInboxViewProps {
  data: InboxViewData;
  onTriageAction: (dealId: string, action: TriageAction) => void;
}

const KEYBOARD_SHORTCUTS = [
  { key: 'j', description: 'Next deal' },
  { key: 'k', description: 'Previous deal' },
  { key: 'r', description: 'Respond to proposals' },
  { key: 'f', description: 'Schedule follow-up' },
  { key: 'd', description: 'Mark as reviewed' },
  { key: 's', description: 'Snooze 24h' },
  { key: 'w', description: 'Snooze 7 days' },
  { key: 'e', description: 'Escalate' },
  { key: 'x', description: 'Request extension' },
  { key: 'Enter', description: 'Open deal' },
  { key: '?', description: 'Show shortcuts' },
];

export const SmartInboxView = memo(function SmartInboxView({
  data,
  onTriageAction,
}: SmartInboxViewProps) {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    high: true,
    medium: true,
    low: false,
  });

  // Data is already grouped by the view transformer
  const groupedDeals = data;

  // Flatten all deals for stats calculation
  const allDeals = [
    ...groupedDeals.critical,
    ...groupedDeals.high,
    ...groupedDeals.medium,
    ...groupedDeals.low,
  ];

  const stats = getInboxStats(allDeals);

  // Apply priority filter
  const filteredGroupedDeals = {
    critical:
      priorityFilter === 'all' || priorityFilter === 'critical'
        ? groupedDeals.critical
        : priorityFilter === 'proposals'
        ? groupedDeals.critical.filter(d => (d.stats?.pending_proposals || 0) > 0)
        : [],
    high:
      priorityFilter === 'all' || priorityFilter === 'high'
        ? groupedDeals.high
        : priorityFilter === 'proposals'
        ? groupedDeals.high.filter(d => (d.stats?.pending_proposals || 0) > 0)
        : [],
    medium:
      priorityFilter === 'all' || priorityFilter === 'low'
        ? groupedDeals.medium
        : priorityFilter === 'proposals'
        ? groupedDeals.medium.filter(d => (d.stats?.pending_proposals || 0) > 0)
        : [],
    low:
      priorityFilter === 'all' || priorityFilter === 'low'
        ? groupedDeals.low
        : priorityFilter === 'proposals'
        ? groupedDeals.low.filter(d => (d.stats?.pending_proposals || 0) > 0)
        : [],
  };

  // Get flat list for keyboard navigation
  const flatDealsList = [
    ...filteredGroupedDeals.critical,
    ...filteredGroupedDeals.high,
    ...filteredGroupedDeals.medium,
    ...filteredGroupedDeals.low,
  ];

  const selectedDealIndex = selectedDealId
    ? flatDealsList.findIndex(d => d.id === selectedDealId)
    : -1;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      switch (key) {
        case 'j': // Next deal
          e.preventDefault();
          if (flatDealsList.length > 0) {
            const nextIndex = Math.min(selectedDealIndex + 1, flatDealsList.length - 1);
            setSelectedDealId(flatDealsList[nextIndex >= 0 ? nextIndex : 0].id);
          }
          break;

        case 'k': // Previous deal
          e.preventDefault();
          if (flatDealsList.length > 0) {
            const prevIndex = Math.max(selectedDealIndex - 1, 0);
            setSelectedDealId(flatDealsList[prevIndex].id);
          }
          break;

        case 'r': // Respond to proposals
          e.preventDefault();
          if (selectedDealId) {
            onTriageAction(selectedDealId, 'respond_proposals');
          }
          break;

        case 'f': // Schedule follow-up
          e.preventDefault();
          if (selectedDealId) {
            onTriageAction(selectedDealId, 'schedule_followup');
          }
          break;

        case 'd': // Mark as reviewed
          e.preventDefault();
          if (selectedDealId) {
            onTriageAction(selectedDealId, 'mark_reviewed');
          }
          break;

        case 's': // Snooze 24h
          e.preventDefault();
          if (selectedDealId) {
            onTriageAction(selectedDealId, 'snooze_24h');
          }
          break;

        case 'w': // Snooze 7 days
          e.preventDefault();
          if (selectedDealId) {
            onTriageAction(selectedDealId, 'snooze_7d');
          }
          break;

        case 'e': // Escalate
          e.preventDefault();
          if (selectedDealId) {
            onTriageAction(selectedDealId, 'escalate');
          }
          break;

        case 'x': // Request extension
          e.preventDefault();
          if (selectedDealId) {
            onTriageAction(selectedDealId, 'request_extension');
          }
          break;

        case 'enter': // Open deal
          e.preventDefault();
          if (selectedDealId) {
            window.location.href = `/deals/${selectedDealId}`;
          }
          break;

        case '?': // Show shortcuts
          e.preventDefault();
          setShowKeyboardHelp(prev => !prev);
          break;

        case 'escape':
          e.preventDefault();
          setShowKeyboardHelp(false);
          setSelectedDealId(null);
          break;
      }
    },
    [flatDealsList, selectedDealIndex, selectedDealId, onTriageAction]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Select first deal by default
  useEffect(() => {
    if (!selectedDealId && flatDealsList.length > 0) {
      setSelectedDealId(flatDealsList[0].id);
    }
  }, [flatDealsList, selectedDealId]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSection = (
    level: keyof typeof filteredGroupedDeals,
    label: string,
    colorClass: string
  ) => {
    const sectionDeals = filteredGroupedDeals[level];
    if (sectionDeals.length === 0) return null;

    const isExpanded = expandedSections[level];

    return (
      <div className="mb-4" key={level}>
        <button
          onClick={() => toggleSection(level)}
          className={cn(
            'w-full flex items-center justify-between p-2 rounded-lg',
            'hover:bg-zinc-50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
          data-testid={`inbox-section-${level}-toggle`}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            )}
            <span className={cn('font-medium text-sm', colorClass)}>{label}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {sectionDeals.length}
            </Badge>
          </div>
        </button>

        {isExpanded && (
          <div className="space-y-1.5 mt-1.5 ml-2">
            {sectionDeals.map((deal, index) => (
              <PriorityDealCard
                key={deal.id}
                deal={deal}
                index={index}
                isSelected={deal.id === selectedDealId}
                onSelect={setSelectedDealId}
                onTriageAction={onTriageAction}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Stats Header */}
      <InboxStatsHeader
        stats={stats}
        selectedFilter={priorityFilter}
        onFilterChange={setPriorityFilter}
      />

      {/* Main Inbox */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-zinc-600" />
              <CardTitle className="text-lg">Priority Inbox</CardTitle>
              {stats.requiresAction > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.requiresAction} require action
                </Badge>
              )}
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKeyboardHelp(prev => !prev)}
                    className={cn(showKeyboardHelp && 'bg-zinc-100')}
                    data-testid="inbox-keyboard-help-btn"
                  >
                    <Keyboard className="w-4 h-4 mr-1" />
                    <span className="text-xs">Shortcuts</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Press ? for keyboard shortcuts</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Keyboard Shortcuts Panel */}
          {showKeyboardHelp && (
            <Card className="mt-3 bg-zinc-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-zinc-600 mb-2">Keyboard Shortcuts</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {KEYBOARD_SHORTCUTS.map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center gap-2 text-xs">
                      <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-mono min-w-[24px] text-center">
                        {shortcut.key}
                      </kbd>
                      <span className="text-zinc-600">{shortcut.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardHeader>

        <CardContent className="pt-2">
          {flatDealsList.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-500">No deals match the current filter</p>
              <Button
                variant="link"
                onClick={() => setPriorityFilter('all')}
                className="mt-2"
                data-testid="inbox-clear-filter-btn"
              >
                Clear filter
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {renderSection('critical', 'Critical - Immediate Action Required', 'text-red-600')}
              {renderSection('high', 'High Priority', 'text-amber-600')}
              {renderSection('medium', 'Medium Priority', 'text-blue-600')}
              {renderSection('low', 'On Track', 'text-green-600')}
            </div>
          )}

          {/* Navigation hint */}
          <div className="mt-4 pt-3 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-400">
              Use <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[10px]">j</kbd> / <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[10px]">k</kbd> to navigate,{' '}
              <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[10px]">Enter</kbd> to open deal
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
