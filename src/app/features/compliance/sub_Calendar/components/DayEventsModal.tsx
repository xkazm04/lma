'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDot,
  FileText,
  Building2,
  ExternalLink,
  Sparkles,
  PenLine,
  type LucideIcon,
} from 'lucide-react';
import type { CalendarEvent, ItemStatus, ItemType, DocumentTemplateType, DocumentDataSource, SignerConfig } from '../../lib';
import {
  getItemTypeCalendarColor,
  getItemTypeLabel,
  getItemStatusColor,
  getItemStatusLabel,
  formatDateLong,
  EVENT_TYPE_TEMPLATES,
  getMockDocumentsByEvent,
} from '../../lib';
import { getDaysUntil, getRelativeDateLabel } from '@/lib/utils/urgency';

/**
 * Get the appropriate facility detail tab based on event type
 */
function getFacilityTabForEventType(eventType: ItemType): string {
  switch (eventType) {
    case 'covenant_test':
      return 'covenants';
    case 'compliance_event':
    case 'notification_due':
      return 'obligations';
    case 'waiver_expiration':
      return 'covenants';
    default:
      return 'obligations';
  }
}
import { DocumentGenerationModal } from '../../sub_DocumentGeneration/components';

interface DayEventsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  events: CalendarEvent[];
  onStatusChange?: (eventId: string, newStatus: ItemStatus) => void;
}

const STATUS_OPTIONS: { value: ItemStatus; label: string; icon: LucideIcon; color: string }[] = [
  { value: 'upcoming', label: 'Upcoming', icon: Clock, color: 'text-blue-600' },
  { value: 'pending', label: 'Pending', icon: CircleDot, color: 'text-zinc-600' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-600' },
  { value: 'overdue', label: 'Overdue', icon: AlertCircle, color: 'text-red-600' },
];

interface EventItemProps {
  event: CalendarEvent;
  onStatusChange?: (eventId: string, newStatus: ItemStatus) => void;
  onGenerateDocument?: (event: CalendarEvent) => void;
}

const EventItem = memo(function EventItem({ event, onStatusChange, onGenerateDocument }: EventItemProps) {
  const [localStatus, setLocalStatus] = useState<ItemStatus>(event.status);

  const handleStatusChange = useCallback((newStatus: ItemStatus) => {
    setLocalStatus(newStatus);
    onStatusChange?.(event.id, newStatus);
  }, [event.id, onStatusChange]);

  const currentStatusOption = STATUS_OPTIONS.find(opt => opt.value === localStatus);
  const StatusIcon = currentStatusOption?.icon || CircleDot;

  // Check if this event type supports document generation
  const availableTemplates = EVENT_TYPE_TEMPLATES[event.type] || [];
  const hasDocumentSupport = availableTemplates.length > 0;

  // Check if documents already exist for this event
  const existingDocuments = getMockDocumentsByEvent(event.id);
  const hasExistingDocuments = existingDocuments.length > 0;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all hover:shadow-md',
        getItemTypeCalendarColor(event.type)
      )}
      data-testid={`day-event-item-${event.id}`}
    >
      {/* Header Row: Title and Type Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-semibold text-sm leading-tight" title={event.title}>
          {event.title}
        </h4>
        <Badge
          variant="outline"
          className="text-xs font-normal bg-white/50 shrink-0"
        >
          {getItemTypeLabel(event.type)}
        </Badge>
      </div>

      {/* Facility and Borrower Info */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-1.5 text-xs opacity-80">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{event.facility_name}</span>
        </div>
        <p className="text-xs opacity-70 pl-5 truncate">
          {event.borrower_name}
        </p>
      </div>

      {/* Existing Documents Indicator */}
      {hasExistingDocuments && (
        <div className="mb-3 p-2 bg-white/50 rounded border border-current/10">
          <div className="flex items-center gap-2 text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>{existingDocuments.length} document(s) generated</span>
            {existingDocuments.some(d => d.status === 'pending_signature') && (
              <Badge className="text-[10px] bg-blue-100 text-blue-700 h-4">
                <PenLine className="w-2.5 h-2.5 mr-0.5" />
                Awaiting Signature
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Actions Row: Status Dropdown, Document Actions, and Facility Link */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-current/10">
        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-7 px-2 text-xs gap-1.5 bg-white/50 hover:bg-white/80 transition-colors',
                getItemStatusColor(localStatus)
              )}
              data-testid={`day-event-status-btn-${event.id}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {getItemStatusLabel(localStatus)}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel className="text-xs font-medium text-zinc-500">
              Change Status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = option.value === localStatus;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={cn(
                    'text-xs gap-2 cursor-pointer',
                    isSelected && 'bg-zinc-100'
                  )}
                  data-testid={`day-event-status-option-${option.value}-${event.id}`}
                >
                  <Icon className={cn('w-3.5 h-3.5', option.color)} />
                  {option.label}
                  {isSelected && <CheckCircle2 className="w-3 h-3 ml-auto text-green-600" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Generate Document Button */}
          {hasDocumentSupport && onGenerateDocument && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs bg-white/50 hover:bg-white/80"
              onClick={() => onGenerateDocument(event)}
              data-testid={`generate-doc-btn-${event.id}`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Generate
            </Button>
          )}

          {/* View Facility Link */}
          <Link
            href={`/compliance/facilities/${event.facility_id}?tab=${getFacilityTabForEventType(event.type)}`}
            className="inline-flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-opacity px-2"
            data-testid={`day-event-facility-link-${event.id}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
});

export const DayEventsModal = memo(function DayEventsModal({
  open,
  onOpenChange,
  date,
  events,
  onStatusChange,
}: DayEventsModalProps) {
  const [selectedEventForDoc, setSelectedEventForDoc] = useState<CalendarEvent | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const daysUntil = getDaysUntil(date);
  const relativeLabel = getRelativeDateLabel(daysUntil);
  const formattedDate = formatDateLong(date);

  // Group events by type for summary
  const eventsByType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleGenerateDocument = useCallback((event: CalendarEvent) => {
    setSelectedEventForDoc(event);
    setIsDocModalOpen(true);
  }, []);

  const handleDocGenerate = useCallback(async (
    templateType: DocumentTemplateType,
    dataSource: DocumentDataSource,
    signers: SignerConfig[]
  ) => {
    // In a real implementation, this would call the API
    console.log('Generating document:', { templateType, dataSource, signers });
    // After successful generation, close modal
    setIsDocModalOpen(false);
    setSelectedEventForDoc(null);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'sm:max-w-[540px] max-h-[85vh] overflow-hidden flex flex-col',
            // Slide-up animation override
            'data-[state=open]:slide-in-from-bottom-4 data-[state=open]:slide-in-from-left-0',
            'data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:slide-out-to-left-0'
          )}
          data-testid="day-events-modal"
        >
          <DialogHeader className="pb-4 border-b border-zinc-200">
            <DialogTitle className="flex items-center gap-2 text-lg" data-testid="day-events-modal-title">
              {formattedDate}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  daysUntil < 0 ? 'text-red-600' : daysUntil === 0 ? 'text-blue-600' : 'text-zinc-600'
                )}
              >
                {relativeLabel}
              </span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-500">{events.length} event{events.length !== 1 ? 's' : ''}</span>

              {/* Event type summary badges */}
              {Object.entries(eventsByType).length > 1 && (
                <>
                  <span className="text-zinc-400">•</span>
                  <span className="flex flex-wrap gap-1">
                    {Object.entries(eventsByType).map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={cn('text-xs font-normal', getItemTypeCalendarColor(type as CalendarEvent['type']))}
                      >
                        {count} {getItemTypeLabel(type as CalendarEvent['type'])}
                      </Badge>
                    ))}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div
            className="flex-1 overflow-y-auto py-4 space-y-3 -mx-6 px-6"
            data-testid="day-events-modal-list"
          >
            {events.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                No events for this day
              </div>
            ) : (
              events.map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  onStatusChange={onStatusChange}
                  onGenerateDocument={handleGenerateDocument}
                />
              ))
            )}
          </div>

          {/* Footer with quick actions */}
          {events.length > 0 && (
            <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                data-testid="day-events-modal-close-btn"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Generation Modal */}
      {selectedEventForDoc && (
        <DocumentGenerationModal
          open={isDocModalOpen}
          onOpenChange={(open) => {
            setIsDocModalOpen(open);
            if (!open) setSelectedEventForDoc(null);
          }}
          event={selectedEventForDoc}
          facilityId="1"
          facilityName={selectedEventForDoc.facility_name}
          borrowerName={selectedEventForDoc.borrower_name}
          onGenerate={handleDocGenerate}
        />
      )}
    </>
  );
});
