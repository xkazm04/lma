'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface UnsavedChangesDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Called when user confirms leaving (discarding changes)
   */
  onConfirm: () => void;
  /**
   * Called when user cancels (staying on page)
   */
  onCancel: () => void;
  /**
   * Title for the dialog
   */
  title?: string;
  /**
   * Description/message for the dialog
   */
  description?: string;
}

/**
 * Dialog component shown when user tries to navigate away with unsaved changes.
 */
export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Unsaved Changes',
  description = 'You have unsaved changes in your deal setup. If you leave now, all your progress will be lost. Are you sure you want to leave?',
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent data-testid="unsaved-changes-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="unsaved-changes-stay-btn"
          >
            Stay on Page
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            data-testid="unsaved-changes-leave-btn"
          >
            Leave Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
