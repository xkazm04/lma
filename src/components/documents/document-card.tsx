'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import {
  FileText,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDate, formatFileSize } from '@/lib/utils';
import { DocumentCardPreview, type DocumentPreviewData } from './document-card-preview';
import { cn } from '@/lib/utils';
import type { LoanDocument } from '@/types';

interface DocumentCardProps {
  document: LoanDocument;
  previewData?: DocumentPreviewData;
  onDelete?: (id: string) => void;
  onReprocess?: (id: string) => void;
  /** Whether selection mode is enabled */
  selectionMode?: boolean;
  /** Whether this document is selected */
  isSelected?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (id: string, selected: boolean) => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    variant: 'warning' as const,
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    variant: 'success' as const,
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    variant: 'destructive' as const,
  },
  review_required: {
    label: 'Review Required',
    icon: AlertCircle,
    variant: 'warning' as const,
  },
};

const typeLabels = {
  facility_agreement: 'Facility Agreement',
  amendment: 'Amendment',
  consent: 'Consent',
  assignment: 'Assignment',
  other: 'Other',
};

function arePropsEqual(prevProps: DocumentCardProps, nextProps: DocumentCardProps): boolean {
  // Check primitive props first (fast path)
  if (
    prevProps.selectionMode !== nextProps.selectionMode ||
    prevProps.isSelected !== nextProps.isSelected
  ) {
    return false;
  }

  // Check if callback references changed (these should be stable if using useCallback)
  if (
    prevProps.onDelete !== nextProps.onDelete ||
    prevProps.onReprocess !== nextProps.onReprocess ||
    prevProps.onSelectionChange !== nextProps.onSelectionChange
  ) {
    return false;
  }

  // Deep compare document object - compare relevant fields
  const prevDoc = prevProps.document;
  const nextDoc = nextProps.document;
  if (
    prevDoc.id !== nextDoc.id ||
    prevDoc.original_filename !== nextDoc.original_filename ||
    prevDoc.document_type !== nextDoc.document_type ||
    prevDoc.processing_status !== nextDoc.processing_status ||
    prevDoc.uploaded_at !== nextDoc.uploaded_at ||
    prevDoc.file_size !== nextDoc.file_size ||
    prevDoc.page_count !== nextDoc.page_count ||
    prevDoc.error_message !== nextDoc.error_message
  ) {
    return false;
  }

  // Compare previewData if provided
  const prevPreview = prevProps.previewData;
  const nextPreview = nextProps.previewData;
  if (prevPreview !== nextPreview) {
    // Both must be undefined or same reference to be equal
    if (!prevPreview || !nextPreview) {
      return false;
    }
    // Compare preview data fields
    if (
      prevPreview.facilityName !== nextPreview.facilityName ||
      prevPreview.totalCommitment !== nextPreview.totalCommitment ||
      prevPreview.currency !== nextPreview.currency ||
      prevPreview.maturityDate !== nextPreview.maturityDate ||
      prevPreview.confidenceScore !== nextPreview.confidenceScore
    ) {
      return false;
    }
  }

  return true;
}

export const DocumentCard = memo(function DocumentCard({
  document,
  previewData,
  onDelete,
  onReprocess,
  selectionMode = false,
  isSelected = false,
  onSelectionChange,
}: DocumentCardProps) {
  const status = statusConfig[document.processing_status];
  const StatusIcon = status.icon;
  const isProcessing = document.processing_status === 'processing';
  const isCompleted = document.processing_status === 'completed';
  const showPreview = isCompleted && previewData;

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    if (onSelectionChange && checked !== 'indeterminate') {
      onSelectionChange(document.id, checked);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If in selection mode and clicking on the card (not on interactive elements), toggle selection
    if (selectionMode && onSelectionChange) {
      const target = e.target as HTMLElement;
      // Don't toggle if clicking on links, buttons, or the checkbox itself
      if (!target.closest('a') && !target.closest('button') && !target.closest('[role="checkbox"]')) {
        e.preventDefault();
        onSelectionChange(document.id, !isSelected);
      }
    }
  };

  const cardContent = (
    <Card
      className={cn(
        'group hover:shadow-md transition-all',
        selectionMode && 'cursor-pointer',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50/50'
      )}
      data-testid={`document-card-${document.id}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox - shown in selection mode */}
          {selectionMode && (
            <div
              className="shrink-0 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                data-testid={`document-checkbox-${document.id}`}
                aria-label={`Select ${document.original_filename}`}
              />
            </div>
          )}

          {/* Icon */}
          <div className="p-3 rounded-lg bg-zinc-100 shrink-0">
            <FileText className="w-6 h-6 text-zinc-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/documents/${document.id}`}
                  className="font-medium text-zinc-900 hover:text-blue-600 transition-colors line-clamp-1"
                  data-testid={`document-card-link-${document.id}`}
                >
                  {document.original_filename}
                </Link>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {typeLabels[document.document_type]}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`document-card-menu-${document.id}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/documents/${document.id}`}
                      data-testid={`document-card-view-${document.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid={`document-card-download-${document.id}`}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onReprocess?.(document.id)}
                    data-testid={`document-card-reprocess-${document.id}`}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reprocess
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDelete?.(document.id)}
                    data-testid={`document-card-delete-${document.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
              <span>{formatDate(document.uploaded_at)}</span>
              {document.file_size && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span>{formatFileSize(document.file_size)}</span>
                </>
              )}
              {document.page_count && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span>{document.page_count} pages</span>
                </>
              )}
            </div>

            {/* Status */}
            <div className="mt-3">
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                {status.label}
              </Badge>
              {document.error_message && (
                <p className="text-xs text-red-600 mt-1">{document.error_message}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (showPreview) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <div data-testid={`document-card-tooltip-trigger-${document.id}`}>
              {cardContent}
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="start"
            className="max-w-[320px] p-0"
            data-testid={`document-card-tooltip-${document.id}`}
          >
            <DocumentCardPreview data={previewData} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}, arePropsEqual);
