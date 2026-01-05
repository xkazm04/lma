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
  Clock,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutomatedCalendarEvent, EscalationSnooze } from '../lib/types';

interface SnoozeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: AutomatedCalendarEvent | null;
  onSnooze: (eventId: string, snoozeData: {
    snooze_hours: number;
    reason: string;
  }) => void;
}

const SNOOZE_OPTIONS = [
  { hours: 4, label: '4 hours' },
  { hours: 8, label: '8 hours' },
  { hours: 24, label: '1 day' },
  { hours: 48, label: '2 days' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '1 week' },
];

const REASON_TEMPLATES = [
  'Waiting for updated documents from borrower',
  'Pending internal review/approval',
  'Coordinating with external parties',
  'Awaiting additional information',
  'Holiday/weekend delay - will resume next business day',
  'Escalated internally - awaiting resolution',
];

export const SnoozeDialog = memo(function SnoozeDialog({
  open,
  onOpenChange,
  event,
  onSnooze,
}: SnoozeDialogProps) {
  const [selectedHours, setSelectedHours] = useState<number>(24);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!event || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSnooze(event.id, {
        snooze_hours: selectedHours,
        reason: reason.trim(),
      });
      onOpenChange(false);
      setReason('');
      setSelectedHours(24);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateClick = (template: string) => {
    setReason(template);
  };

  const calculateSnoozeUntil = () => {
    const now = new Date();
    const snoozeUntil = new Date(now.getTime() + selectedHours * 60 * 60 * 1000);
    return snoozeUntil.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!event) return null;

  const daysOverdue = Math.ceil(
    (Date.now() - new Date(event.date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Snooze Escalation
          </DialogTitle>
          <DialogDescription>
            Temporarily pause escalation for this event. A justification is required and will be logged to the audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Event Info */}
          <div className="p-3 bg-zinc-50 rounded-lg">
            <h4 className="font-medium text-zinc-900">{event.title}</h4>
            <p className="text-sm text-zinc-500 mt-1">{event.facility_name}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="destructive"
                className="text-xs"
              >
                {daysOverdue > 0
                  ? `${daysOverdue} days overdue`
                  : 'Due today'}
              </Badge>
              {event.escalation && (
                <Badge variant="secondary" className="text-xs">
                  Level {event.escalation.current_level} Escalation
                </Badge>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Snooze with caution</p>
              <p className="text-amber-700 mt-1">
                Snoozing pauses automatic escalation. This action is logged to the audit trail and visible to compliance officers.
              </p>
            </div>
          </div>

          {/* Snooze Duration */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">
              Snooze Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SNOOZE_OPTIONS.map((option) => (
                <button
                  key={option.hours}
                  type="button"
                  onClick={() => setSelectedHours(option.hours)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                    selectedHours === option.hours
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:border-purple-200 hover:bg-purple-50'
                  )}
                  data-testid={`snooze-${option.hours}h-btn`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
              <Calendar className="w-4 h-4" />
              <span>Will resume escalation on {calculateSnoozeUntil()}</span>
            </div>
          </div>

          {/* Reason (Required) */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">
              Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're snoozing this escalation..."
              rows={3}
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm resize-none',
                reason.trim()
                  ? 'border-zinc-200'
                  : 'border-red-200 bg-red-50/50'
              )}
              data-testid="snooze-reason-input"
            />
            <p className="text-xs text-zinc-500 mt-1">
              <FileText className="w-3 h-3 inline mr-1" />
              This reason will be logged to the audit trail
            </p>
          </div>

          {/* Quick Reason Templates */}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">
              Quick templates
            </label>
            <div className="flex flex-wrap gap-2">
              {REASON_TEMPLATES.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => handleTemplateClick(template)}
                  className="px-2 py-1 text-xs bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200 transition-colors text-left"
                  data-testid={`template-${template.slice(0, 20).replace(/\s/g, '-')}`}
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="cancel-snooze-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="confirm-snooze-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Snoozing...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Snooze for {SNOOZE_OPTIONS.find((o) => o.hours === selectedHours)?.label}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
