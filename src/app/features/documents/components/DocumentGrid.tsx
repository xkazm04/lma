'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, CheckSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CompactDataTable, type ColumnDef } from '@/components/ui/compact-data-table';
import { cn } from '@/lib/utils';
import { CompactDocumentCard } from './CompactDocumentCard';
import { getConfidenceColorClass, getStatusConfig, getDocumentTypeIcon } from '../lib/constants';
import type { LoanDocument } from '@/types';
import type { DocumentPreviewData } from '@/components/documents';

interface DocumentGridProps {
  documents: LoanDocument[];
  viewMode: 'grid' | 'list';
  previewData?: Record<string, DocumentPreviewData>;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
  /** Whether selection mode is enabled */
  selectionMode?: boolean;
  /** Set of selected document IDs */
  selectedIds?: Set<string>;
  /** Callback when a document's selection changes */
  onSelectionChange?: (id: string, selected: boolean) => void;
  /** Callback to toggle selection mode */
  onToggleSelectionMode?: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatBytes = (bytes: number | null | undefined) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};


export const DocumentGrid = memo(function DocumentGrid({
  documents,
  viewMode,
  previewData,
  onDelete,
  onReprocess,
  selectionMode = false,
  selectedIds = new Set(),
  onSelectionChange,
  onToggleSelectionMode,
}: DocumentGridProps) {
  const router = useRouter();

  const handleRowClick = (doc: LoanDocument) => {
    if (!selectionMode) {
      router.push(`/documents/${doc.id}`);
    }
  };

  // Table columns definition
  const columns: ColumnDef<LoanDocument>[] = useMemo(() => [
    ...(selectionMode ? [{
      key: 'select',
      width: '40px',
      render: (doc: LoanDocument) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(doc.id)}
            onCheckedChange={(checked) => {
              if (checked !== 'indeterminate' && onSelectionChange) {
                onSelectionChange(doc.id, checked);
              }
            }}
            aria-label={`Select ${doc.original_filename}`}
          />
        </div>
      ),
    }] : []),
    {
      key: 'type',
      width: '40px',
      render: (doc: LoanDocument) => {
        const Icon = getDocumentTypeIcon(doc.document_type);
        return (
          <div className="p-1.5 rounded bg-zinc-100">
            <Icon className="w-4 h-4 text-zinc-600" />
          </div>
        );
      },
    },
    {
      key: 'name',
      label: 'Document',
      flex: 2,
      render: (doc: LoanDocument) => (
        <div className="min-w-0">
          <p className="font-medium text-sm text-zinc-900 truncate">{doc.original_filename}</p>
          <p className="text-xs text-zinc-500 truncate">{doc.borrower_name || 'No borrower'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (doc: LoanDocument) => {
        const config = getStatusConfig(doc.processing_status);
        const StatusIcon = config.icon;
        return (
          <Badge variant={config.variant} className="text-[10px] px-1.5 py-0 flex items-center gap-1 w-fit">
            <StatusIcon className={cn('w-2.5 h-2.5', doc.processing_status === 'processing' && 'animate-spin')} />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'confidence',
      label: 'Conf.',
      width: '60px',
      align: 'center',
      render: (doc: LoanDocument) => {
        const confidence = (doc as unknown as { extraction_confidence?: number }).extraction_confidence;
        return (
          <div className="flex items-center justify-center">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                getConfidenceColorClass(confidence)
              )}
              title={confidence ? `${Math.round(confidence * 100)}%` : 'N/A'}
            />
          </div>
        );
      },
    },
    {
      key: 'date',
      label: 'Uploaded',
      width: '80px',
      render: (doc: LoanDocument) => (
        <span className="text-xs text-zinc-500">{formatDate(doc.uploaded_at)}</span>
      ),
    },
    {
      key: 'size',
      label: 'Size',
      width: '70px',
      render: (doc: LoanDocument) => (
        <span className="text-xs text-zinc-500">{formatBytes(doc.file_size)}</span>
      ),
    },
  ], [selectionMode, selectedIds, onSelectionChange]);

  if (documents.length === 0) {
    return (
      <Card className="py-12 animate-in fade-in duration-300">
        <CardContent className="text-center">
          <p className="text-zinc-500">No documents found matching your filters.</p>
          <Link href="/documents/upload">
            <Button className="mt-4 transition-transform hover:scale-105">
              <Plus className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const allSelected = documents.length > 0 && documents.every(doc => selectedIds.has(doc.id));
  const someSelected = documents.some(doc => selectedIds.has(doc.id));

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (onSelectionChange && checked !== 'indeterminate') {
      documents.forEach(doc => {
        if (checked !== selectedIds.has(doc.id)) {
          onSelectionChange(doc.id, checked);
        }
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Selection Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectionMode && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={handleSelectAll}
                data-testid="document-grid-select-all"
                aria-label="Select all documents"
              />
              <span className="text-sm text-zinc-600">
                {selectedIds.size > 0
                  ? `${selectedIds.size} of ${documents.length} selected`
                  : 'Select all'}
              </span>
            </div>
          )}
        </div>
        {onToggleSelectionMode && (
          <Button
            variant={selectionMode ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onToggleSelectionMode}
            className="gap-2"
            data-testid="toggle-selection-mode-btn"
          >
            <CheckSquare className="w-4 h-4" />
            {selectionMode ? 'Cancel' : 'Select'}
          </Button>
        )}
      </div>

      {/* Table View (default) */}
      {viewMode === 'list' ? (
        <div className="border rounded-lg bg-white animate-in fade-in duration-300">
          <CompactDataTable
            data={documents}
            columns={columns}
            rowHeight="md"
            stickyHeader
            maxHeight="calc(100vh - 340px)"
            onRowClick={handleRowClick}
            emptyMessage="No documents found"
          />
        </div>
      ) : (
        /* Grid View */
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-300"
          data-testid="document-grid"
        >
          {documents.map((doc, index) => (
            <div
              key={doc.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              data-testid={`document-item-${doc.id}`}
            >
              <CompactDocumentCard
                document={doc}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(doc.id)}
                onSelectionChange={onSelectionChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
