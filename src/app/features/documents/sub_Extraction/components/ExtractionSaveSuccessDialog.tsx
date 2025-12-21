'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, FileText, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ExtractionSaveSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  extractedCovenantsCount: number;
  extractedObligationsCount: number;
}

export function ExtractionSaveSuccessDialog({
  open,
  onOpenChange,
  documentId,
  documentName,
  extractedCovenantsCount,
  extractedObligationsCount,
}: ExtractionSaveSuccessDialogProps) {
  const totalExtracted = extractedCovenantsCount + extractedObligationsCount;
  const complianceUrl = `/compliance?documentId=${documentId}&source=extraction`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="extraction-save-success-dialog"
      >
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center" data-testid="success-dialog-title">
            Extraction Saved Successfully
          </DialogTitle>
          <DialogDescription className="text-center" data-testid="success-dialog-description">
            Your reviewed extraction data has been saved for{' '}
            <span className="font-medium text-zinc-700">{documentName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Summary of what was extracted */}
        <div className="my-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-zinc-700">Extraction Summary</h4>
          <div className="space-y-2">
            {extractedCovenantsCount > 0 && (
              <div
                className="flex items-center gap-2 text-sm text-zinc-600"
                data-testid="covenants-count-summary"
              >
                <ClipboardCheck className="h-4 w-4 text-indigo-500" />
                <span>
                  <span className="font-medium">{extractedCovenantsCount}</span> covenant
                  {extractedCovenantsCount !== 1 ? 's' : ''} extracted
                </span>
              </div>
            )}
            {extractedObligationsCount > 0 && (
              <div
                className="flex items-center gap-2 text-sm text-zinc-600"
                data-testid="obligations-count-summary"
              >
                <FileText className="h-4 w-4 text-amber-500" />
                <span>
                  <span className="font-medium">{extractedObligationsCount}</span> obligation
                  {extractedObligationsCount !== 1 ? 's' : ''} extracted
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Next steps guidance */}
        {totalExtracted > 0 && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-indigo-900">Next Steps</h4>
            <p className="text-sm text-indigo-700">
              Your extracted covenants and obligations are now available in the Compliance
              Tracker. View them to set up monitoring, deadlines, and alerts.
            </p>
          </div>
        )}

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
            data-testid="stay-on-page-btn"
          >
            Stay on This Page
          </Button>
          {totalExtracted > 0 && (
            <Button asChild className="w-full sm:w-auto" data-testid="view-in-compliance-btn">
              <Link href={complianceUrl}>
                View in Compliance Tracker
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
