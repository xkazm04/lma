'use client';

import React, { memo, useState, useCallback } from 'react';
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
  CheckCircle,
  Upload,
  FileText,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutomatedCalendarEvent, ComplianceCertificateUpload } from '../lib/types';

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: AutomatedCalendarEvent | null;
  onComplete: (eventId: string, certificateFile?: File, notes?: string) => void;
}

export const CompletionDialog = memo(function CompletionDialog({
  open,
  onOpenChange,
  event,
  onComplete,
}: CompletionDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === 'application/pdf' ||
        droppedFile.type.startsWith('image/') ||
        droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!event) return;

    setIsUploading(true);
    try {
      await onComplete(event.id, file || undefined, notes || undefined);
      // Reset state
      setFile(null);
      setNotes('');
      onOpenChange(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setNotes('');
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!event) return null;

  const requiresCertificate =
    event.event_type === 'compliance_event' ||
    event.event_type === 'covenant_test';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Mark as Complete
          </DialogTitle>
          <DialogDescription>
            Complete this compliance deadline and optionally upload supporting
            documentation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event summary */}
          <div className="p-4 bg-zinc-50 rounded-lg">
            <h4 className="font-medium text-zinc-900">{event.title}</h4>
            <p className="text-sm text-zinc-500 mt-1">{event.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {event.facility_name}
              </Badge>
              <span className="text-xs text-zinc-400">
                Due: {new Date(event.date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* File upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">
                Compliance Certificate / Supporting Document
              </label>
              {requiresCertificate && (
                <Badge variant="warning" className="text-xs">
                  Recommended
                </Badge>
              )}
            </div>

            <div
              className={cn(
                'relative border-2 border-dashed rounded-lg p-6 transition-colors',
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-zinc-200 hover:border-zinc-300',
                file && 'border-green-500 bg-green-50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-testid="file-upload-input"
              />

              {file ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">{file.name}</p>
                    <p className="text-sm text-zinc-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    data-testid="remove-file-btn"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-10 h-10 mx-auto text-zinc-400 mb-2" />
                  <p className="text-sm text-zinc-600">
                    Drag and drop a file here, or click to browse
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    PDF, DOCX, PNG, JPG up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this completion..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="completion-notes-input"
            />
          </div>

          {/* Warning for missing certificate */}
          {requiresCertificate && !file && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  No document attached
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Uploading a compliance certificate is recommended for audit
                  purposes. You can still complete without one.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              data-testid="cancel-completion-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
              data-testid="confirm-completion-btn"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
