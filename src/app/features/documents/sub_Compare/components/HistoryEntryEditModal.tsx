'use client';

import React, { memo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Tag, FileText, Clock, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ComparisonHistoryEntryWithDetails } from '../lib/history-types';

interface HistoryEntryEditModalProps {
  entry: ComparisonHistoryEntryWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, label: string, notes: string) => Promise<void>;
}

export const HistoryEntryEditModal = memo(function HistoryEntryEditModal({
  entry,
  isOpen,
  onClose,
  onSave,
}: HistoryEntryEditModalProps) {
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with entry prop
  useEffect(() => {
    if (entry) {
      setLabel(entry.label || '');
      setNotes(entry.notes || '');
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry) return;

    setIsSaving(true);
    try {
      await onSave(entry.id, label, notes);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]" data-testid="history-edit-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Edit Comparison History Entry
          </DialogTitle>
          <DialogDescription>
            Add a label or notes to help identify this comparison snapshot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Entry info */}
          <div className="bg-zinc-50 rounded-md p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-zinc-600">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(entry.comparedAt), 'MMMM d, yyyy h:mm a')}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600">
              <FileText className="w-4 h-4" />
              <span className="truncate">{entry.document1.name}</span>
              <span className="text-zinc-400">vs</span>
              <span className="truncate">{entry.document2.name}</span>
            </div>
            <div className="text-zinc-500">
              {entry.totalChanges} changes ({entry.addedCount} added, {entry.modifiedCount} modified, {entry.removedCount} removed)
            </div>
          </div>

          {/* Label input */}
          <div className="space-y-2">
            <Label htmlFor="history-label">Label</Label>
            <Input
              id="history-label"
              placeholder="e.g., 'Pre-signing review' or 'Amendment 3 analysis'"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              data-testid="history-label-input"
            />
            <p className="text-xs text-zinc-500">
              A short label to identify this comparison snapshot
            </p>
          </div>

          {/* Notes textarea */}
          <div className="space-y-2">
            <Label htmlFor="history-notes">Notes</Label>
            <textarea
              id="history-notes"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add any notes about this comparison..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="history-notes-input"
            />
            <p className="text-xs text-zinc-500">
              Additional context or observations about this comparison
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            data-testid="history-edit-cancel"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            data-testid="history-edit-save"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
