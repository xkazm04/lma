'use client';

import React from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { LoanDocument } from '@/types';

interface DocumentCardProps {
  document: LoanDocument;
  onDelete?: (id: string) => void;
  onReprocess?: (id: string) => void;
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

export function DocumentCard({ document, onDelete, onReprocess }: DocumentCardProps) {
  const status = statusConfig[document.processing_status];
  const StatusIcon = status.icon;
  const isProcessing = document.processing_status === 'processing';

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
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
                >
                  {document.original_filename}
                </Link>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {typeLabels[document.document_type]}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/documents/${document.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReprocess?.(document.id)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reprocess
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDelete?.(document.id)}
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
}
