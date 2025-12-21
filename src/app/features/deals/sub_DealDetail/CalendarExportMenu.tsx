'use client';

import React, { memo, useCallback } from 'react';
import { Calendar, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NegotiationTerm } from '../lib/types';
import {
  generateMultipleDeadlinesICS,
  downloadICSFile,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
} from '../lib/deadline-utils';

interface CalendarExportMenuProps {
  terms: Array<Pick<NegotiationTerm, 'id' | 'term_label' | 'deadline'>>;
  dealName: string;
  selectedTermId?: string | null;
}

export const CalendarExportMenu = memo(function CalendarExportMenu({
  terms,
  dealName,
  selectedTermId,
}: CalendarExportMenuProps) {
  const termsWithDeadlines = terms.filter((t) => t.deadline);
  const selectedTerm = selectedTermId
    ? termsWithDeadlines.find((t) => t.id === selectedTermId)
    : null;

  const handleExportAllICS = useCallback(() => {
    const icsContent = generateMultipleDeadlinesICS(termsWithDeadlines, dealName);
    if (icsContent) {
      const filename = `${dealName.replace(/[^a-z0-9]/gi, '_')}_deadlines.ics`;
      downloadICSFile(icsContent, filename);
    }
  }, [termsWithDeadlines, dealName]);

  const handleExportSelectedICS = useCallback(() => {
    if (!selectedTerm) return;
    const icsContent = generateMultipleDeadlinesICS([selectedTerm], dealName);
    if (icsContent) {
      const filename = `${selectedTerm.term_label.replace(/[^a-z0-9]/gi, '_')}_deadline.ics`;
      downloadICSFile(icsContent, filename);
    }
  }, [selectedTerm, dealName]);

  const handleOpenGoogleCalendar = useCallback(() => {
    if (!selectedTerm) return;
    const url = generateGoogleCalendarUrl(selectedTerm, dealName);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [selectedTerm, dealName]);

  const handleOpenOutlookCalendar = useCallback(() => {
    if (!selectedTerm) return;
    const url = generateOutlookCalendarUrl(selectedTerm, dealName);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [selectedTerm, dealName]);

  if (termsWithDeadlines.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="transition-transform hover:scale-105"
          data-testid="calendar-export-btn"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Deadlines</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleExportAllICS}
          data-testid="export-all-ics-btn"
        >
          <Download className="w-4 h-4 mr-2" />
          Export All ({termsWithDeadlines.length}) to ICS
        </DropdownMenuItem>

        {selectedTerm && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-zinc-500">
              Selected: {selectedTerm.term_label}
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={handleExportSelectedICS}
              data-testid="export-selected-ics-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to ICS
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleOpenGoogleCalendar}
              data-testid="add-to-google-calendar-btn"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Add to Google Calendar
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleOpenOutlookCalendar}
              data-testid="add-to-outlook-calendar-btn"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Add to Outlook Calendar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
