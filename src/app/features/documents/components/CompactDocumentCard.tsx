'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getStatusConfig, getDocumentTypeIcon } from '../lib/constants';
import type { LoanDocument } from '@/types';

interface CompactDocumentCardProps {
  document: LoanDocument;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
  onClick?: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const CompactDocumentCard = memo(function CompactDocumentCard({
  document,
  selectionMode = false,
  isSelected = false,
  onSelectionChange,
  onClick,
}: CompactDocumentCardProps) {
  const DocIcon = getDocumentTypeIcon(document.document_type);
  const statusInfo = getStatusConfig(document.processing_status);
  const StatusIcon = statusInfo.icon;

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    if (checked !== 'indeterminate' && onSelectionChange) {
      onSelectionChange(document.id, checked);
    }
  };

  const cardContent = (
    <div
      className={cn(
        'p-3 rounded-lg border bg-white hover:shadow-md transition-all cursor-pointer',
        isSelected && 'ring-2 ring-blue-500 border-blue-200'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {selectionMode && (
          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              aria-label={`Select ${document.original_filename}`}
            />
          </div>
        )}
        <div className="p-2 rounded-lg bg-zinc-100">
          <DocIcon className="w-5 h-5 text-zinc-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{document.original_filename}</p>
          <p className="text-xs text-zinc-500 truncate">{document.borrower_name || 'No borrower'}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0 flex items-center gap-1">
              <StatusIcon className={cn('w-2.5 h-2.5', document.processing_status === 'processing' && 'animate-spin')} />
              {statusInfo.label}
            </Badge>
            <span className="text-xs text-zinc-400">{formatDate(document.uploaded_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (selectionMode) {
    return cardContent;
  }

  return (
    <Link href={`/documents/${document.id}`}>
      {cardContent}
    </Link>
  );
});
