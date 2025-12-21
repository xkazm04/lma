'use client';

import React, { useState, memo } from 'react';
import {
  Trash2,
  RefreshCw,
  FolderInput,
  Download,
  Tag,
  GitCompare,
  X,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { LoanDocument } from '@/types';

export interface BatchActionsToolbarProps {
  selectedDocuments: LoanDocument[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalDocuments: number;
  onDelete: (ids: string[]) => void;
  onReprocess: (ids: string[]) => void;
  onMoveToFolder: (ids: string[], folderId: string | null) => void;
  onExport: (ids: string[]) => void;
  onTag: (ids: string[], tags: string[]) => void;
  onBulkCompare: (ids: string[]) => void;
  folders?: Array<{ id: string; name: string }>;
  availableTags?: string[];
  isProcessing?: boolean;
}

export const BatchActionsToolbar = memo(function BatchActionsToolbar({
  selectedDocuments,
  onClearSelection,
  onSelectAll,
  totalDocuments,
  onDelete,
  onReprocess,
  onMoveToFolder,
  onExport,
  onTag,
  onBulkCompare,
  folders = [],
  availableTags = [],
  isProcessing = false,
}: BatchActionsToolbarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  const selectedCount = selectedDocuments.length;
  const isAllSelected = selectedCount === totalDocuments && totalDocuments > 0;
  const selectedIds = selectedDocuments.map((d) => d.id);

  const handleDelete = () => {
    onDelete(selectedIds);
    setDeleteDialogOpen(false);
    onClearSelection();
  };

  const handleReprocess = () => {
    onReprocess(selectedIds);
    onClearSelection();
  };

  const handleExport = () => {
    onExport(selectedIds);
  };

  const handleMoveToFolder = (folderId: string | null) => {
    onMoveToFolder(selectedIds, folderId);
    onClearSelection();
  };

  const handleTag = (tag: string) => {
    onTag(selectedIds, [tag]);
  };

  const handleBulkCompare = () => {
    if (selectedCount >= 2) {
      setCompareDialogOpen(true);
    }
  };

  const confirmBulkCompare = () => {
    onBulkCompare(selectedIds);
    setCompareDialogOpen(false);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      {/* Batch Actions Toolbar */}
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'bg-zinc-900 text-white rounded-lg shadow-xl',
          'flex items-center gap-2 px-4 py-3',
          'animate-in slide-in-from-bottom-4 fade-in duration-300'
        )}
        data-testid="batch-actions-toolbar"
      >
        {/* Selection Info */}
        <div className="flex items-center gap-3 pr-3 border-r border-zinc-700">
          <CheckSquare className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium" data-testid="batch-selection-count">
            {selectedCount} selected
          </span>
          {!isAllSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 h-7 px-2"
              data-testid="batch-select-all-btn"
            >
              Select all {totalDocuments}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
            data-testid="batch-clear-selection-btn"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isProcessing}
            className="text-red-400 hover:text-red-300 hover:bg-red-950 gap-2"
            data-testid="batch-delete-btn"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>

          {/* Reprocess */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReprocess}
            disabled={isProcessing}
            className="hover:bg-zinc-800 gap-2"
            data-testid="batch-reprocess-btn"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Reprocess</span>
          </Button>

          {/* Move to Folder */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isProcessing}
                className="hover:bg-zinc-800 gap-2"
                data-testid="batch-move-folder-btn"
              >
                <FolderInput className="w-4 h-4" />
                <span className="hidden sm:inline">Move</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => handleMoveToFolder(null)}
                data-testid="batch-move-unfiled"
              >
                Unfiled
              </DropdownMenuItem>
              {folders.length > 0 && <DropdownMenuSeparator />}
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => handleMoveToFolder(folder.id)}
                  data-testid={`batch-move-folder-${folder.id}`}
                >
                  {folder.name}
                </DropdownMenuItem>
              ))}
              {folders.length === 0 && (
                <DropdownMenuItem disabled className="text-zinc-500">
                  No folders available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={isProcessing}
            className="hover:bg-zinc-800 gap-2"
            data-testid="batch-export-btn"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* Tag */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isProcessing}
                className="hover:bg-zinc-800 gap-2"
                data-testid="batch-tag-btn"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Tag</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {availableTags.length > 0 ? (
                availableTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag}
                    onClick={() => handleTag(tag)}
                    data-testid={`batch-tag-${tag}`}
                  >
                    {tag}
                  </DropdownMenuItem>
                ))
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => handleTag('Important')}
                    data-testid="batch-tag-important"
                  >
                    Important
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleTag('Review Required')}
                    data-testid="batch-tag-review"
                  >
                    Review Required
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleTag('Archived')}
                    data-testid="batch-tag-archived"
                  >
                    Archived
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Compare - Only show when 2+ documents selected */}
          {selectedCount >= 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkCompare}
              disabled={isProcessing}
              className="hover:bg-zinc-800 gap-2 text-blue-400 hover:text-blue-300"
              data-testid="batch-bulk-compare-btn"
            >
              <GitCompare className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Compare</span>
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="batch-delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} document{selectedCount !== 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected documents will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="text-sm text-zinc-600 space-y-1 max-h-40 overflow-y-auto">
              {selectedDocuments.slice(0, 5).map((doc) => (
                <li key={doc.id} className="truncate">
                  • {doc.original_filename}
                </li>
              ))}
              {selectedCount > 5 && (
                <li className="text-zinc-400">
                  ... and {selectedCount - 5} more
                </li>
              )}
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              data-testid="batch-delete-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-testid="batch-delete-confirm-btn"
            >
              Delete {selectedCount} document{selectedCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Compare Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent data-testid="batch-compare-dialog">
          <DialogHeader>
            <DialogTitle>
              Bulk Compare {selectedCount} Documents
            </DialogTitle>
            <DialogDescription>
              AI will analyze and compare all selected documents simultaneously, highlighting differences across financial terms, covenants, dates, and parties.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-600 mb-2">Documents to compare:</p>
            <ul className="text-sm text-zinc-600 space-y-1 max-h-40 overflow-y-auto">
              {selectedDocuments.map((doc, index) => (
                <li key={doc.id} className="truncate flex items-center gap-2">
                  <span className="text-zinc-400 font-mono text-xs">{index + 1}.</span>
                  {doc.original_filename}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompareDialogOpen(false)}
              data-testid="batch-compare-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkCompare}
              className="gap-2"
              data-testid="batch-compare-confirm-btn"
            >
              <GitCompare className="w-4 h-4" />
              Start Bulk Compare
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
