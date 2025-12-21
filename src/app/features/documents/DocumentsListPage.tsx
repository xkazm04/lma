'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, GitCompare, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DocumentFiltersBar,
  DocumentStatsBar,
  DocumentGrid,
  GlobalDropzone,
  SavedViewsSidebar,
  SaveViewDialog,
  FolderTree,
  FolderCreateModal,
  BatchActionsToolbar,
} from './components';
import {
  mockDocuments,
  mockDocumentPreviewData,
  useDocumentListStore,
  filterDocuments,
  filterDocumentsByFolder,
} from './lib';
import type { SavedView } from './lib/types';

export function DocumentsListPage() {
  const router = useRouter();

  // Get all state and actions from unified store
  const {
    // Filter state
    searchQuery,
    statusFilter,
    typeFilter,
    viewMode,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setViewMode,
    getCurrentFilters,
    applyFilters,

    // Selection state
    selectionMode,
    selectedIds,
    isProcessingBatch,
    toggleSelectionMode,
    toggleDocumentSelection,
    selectAll,
    clearSelection,
    setIsProcessingBatch,

    // Folder state
    folderFilter,
    folders,
    setFolderExpanded,
    getDocumentsInFolder,

    // UI state
    saveDialogOpen,
    setSaveDialogOpen,
    createFolderOpen,
    setCreateFolderOpen,
    createFolderParentId,
    openCreateFolderModal,
    closeCreateFolderModal,
    getFolderById,
  } = useDocumentListStore();

  // Handle view selection from sidebar
  const handleViewSelect = useCallback(
    (view: SavedView) => {
      applyFilters(view.filters);
    },
    [applyFilters]
  );

  // Handle saving current filters
  const handleSaveCurrentFilters = useCallback(() => {
    setSaveDialogOpen(true);
  }, [setSaveDialogOpen]);

  // First filter by folder, then apply other filters
  const folderFilteredDocuments = useMemo(() => {
    return filterDocumentsByFolder(mockDocuments, folderFilter, getDocumentsInFolder);
  }, [folderFilter, getDocumentsInFolder]);

  // Compute filtered documents using filter function
  const filteredDocuments = useMemo(() => {
    const filters = getCurrentFilters();
    return filterDocuments(folderFilteredDocuments, filters);
  }, [folderFilteredDocuments, getCurrentFilters]);

  const handleDelete = useCallback((id: string) => {
    console.log('Delete document:', id);
  }, []);

  const handleReprocess = useCallback((id: string) => {
    console.log('Reprocess document:', id);
  }, []);

  const handleUploadComplete = useCallback((files: unknown[]) => {
    console.log('Upload complete:', files);
    // In a real implementation, this would refresh the document list
  }, []);

  // Selection handlers for batch operations
  const handleToggleSelectionMode = useCallback(() => {
    toggleSelectionMode();
  }, [toggleSelectionMode]);

  const handleSelectionChange = useCallback(
    (id: string, selected: boolean) => {
      toggleDocumentSelection(id);
    },
    [toggleDocumentSelection]
  );

  const handleClearSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleSelectAll = useCallback(() => {
    selectAll(filteredDocuments.map((d) => d.id));
  }, [filteredDocuments, selectAll]);

  // Batch action handlers
  const handleBatchDelete = useCallback(
    (ids: string[]) => {
      setIsProcessingBatch(true);
      console.log('Batch delete documents:', ids);
      // Simulate API call
      setTimeout(() => {
        setIsProcessingBatch(false);
        clearSelection();
      }, 1000);
    },
    [setIsProcessingBatch, clearSelection]
  );

  const handleBatchReprocess = useCallback(
    (ids: string[]) => {
      setIsProcessingBatch(true);
      console.log('Batch reprocess documents:', ids);
      // Simulate API call
      setTimeout(() => {
        setIsProcessingBatch(false);
      }, 1000);
    },
    [setIsProcessingBatch]
  );

  const handleBatchMoveToFolder = useCallback(
    (ids: string[], folderId: string | null) => {
      setIsProcessingBatch(true);
      console.log('Batch move documents:', ids, 'to folder:', folderId);
      // Simulate API call
      setTimeout(() => {
        setIsProcessingBatch(false);
        clearSelection();
      }, 1000);
    },
    [setIsProcessingBatch, clearSelection]
  );

  const handleBatchExport = useCallback((ids: string[]) => {
    console.log('Batch export documents:', ids);
    // In a real implementation, this would trigger file download
  }, []);

  const handleBatchTag = useCallback(
    (ids: string[], tags: string[]) => {
      setIsProcessingBatch(true);
      console.log('Batch tag documents:', ids, 'with tags:', tags);
      // Simulate API call
      setTimeout(() => {
        setIsProcessingBatch(false);
      }, 1000);
    },
    [setIsProcessingBatch]
  );

  const handleBulkCompare = useCallback(
    (ids: string[]) => {
      console.log('Bulk compare documents:', ids);
      // Navigate to compare page with selected document IDs
      const queryParams = new URLSearchParams();
      ids.forEach((id) => queryParams.append('docs', id));
      router.push(`/documents/compare?${queryParams.toString()}`);
    },
    [router]
  );

  // Get selected documents for batch toolbar
  const selectedDocuments = useMemo(() => {
    return filteredDocuments.filter((doc) => selectedIds.has(doc.id));
  }, [filteredDocuments, selectedIds]);

  // Get flattened folder list for move-to-folder dropdown
  const flatFolderList = useMemo(() => {
    return folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
    }));
  }, [folders]);

  // Folder creation handlers
  const handleCreateFolder = useCallback(
    (parentId: string | null) => {
      openCreateFolderModal(parentId);
    },
    [openCreateFolderModal]
  );

  const handleFolderCreated = useCallback(() => {
    // Expand the parent folder to show the new folder
    if (createFolderParentId) {
      setFolderExpanded(createFolderParentId, true);
    }
    closeCreateFolderModal();
  }, [createFolderParentId, setFolderExpanded, closeCreateFolderModal]);

  // Get folder context for display
  const folderContextLabel = useMemo(() => {
    if (folderFilter.type === 'all') return null;
    if (folderFilter.type === 'unfiled') return 'Unfiled Documents';
    if (folderFilter.type === 'folder') {
      const folder = getFolderById(folderFilter.folderId);
      return folder ? folder.name : null;
    }
    return null;
  }, [folderFilter, getFolderById]);

  // Get current filters for save dialog
  const currentFilters = useMemo(() => getCurrentFilters(), [getCurrentFilters]);

  return (
    <>
      {/* Global Dropzone for drag-and-drop anywhere */}
      <GlobalDropzone onUploadComplete={handleUploadComplete} />

      {/* Save View Dialog */}
      <SaveViewDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        filters={currentFilters}
      />

      {/* Create Folder Modal */}
      <FolderCreateModal
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentId={createFolderParentId}
        onFolderCreated={handleFolderCreated}
      />

      <div className="space-y-4">
        {/* Row 1: Folders and Saved Views */}
        <div className="flex gap-4">
          {/* Folder Tree Sidebar - Expanded width */}
          <div className="w-80">
            <FolderTree onCreateFolder={handleCreateFolder} />
          </div>

          {/* Saved Views Sidebar */}
          <div className="w-64">
            <SavedViewsSidebar
              onViewSelect={handleViewSelect}
              onSaveCurrentFilters={handleSaveCurrentFilters}
            />
          </div>
        </div>

        {/* Row 2: Document Hub - Full Width */}
        <div className="flex-1">
          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <Link href="/documents/risk-detection">
              <Button
                variant="outline"
                className="transition-transform hover:scale-105 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                data-testid="documents-risk-detection-btn"
              >
                <Shield className="w-4 h-4 mr-2" />
                Risk Detection
              </Button>
            </Link>
            <Link href="/documents/portfolio">
              <Button
                variant="outline"
                className="transition-transform hover:scale-105"
                data-testid="documents-portfolio-btn"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Portfolio Intelligence
              </Button>
            </Link>
            <Link href="/documents/compare">
              <Button
                variant="outline"
                className="transition-transform hover:scale-105"
                data-testid="documents-compare-btn"
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
              </Button>
            </Link>
            <Link href="/documents/upload">
              <Button className="transition-transform hover:scale-105" data-testid="documents-upload-btn">
                <Plus className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </Link>
          </div>

          {/* Filters Bar */}
          <DocumentFiltersBar
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            viewMode={viewMode}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            onViewModeChange={setViewMode}
          />

          {/* Document Stats */}
          <DocumentStatsBar documents={folderFilteredDocuments} />

          {/* Document Grid/List */}
          <DocumentGrid
            documents={filteredDocuments}
            viewMode={viewMode}
            previewData={mockDocumentPreviewData}
            onDelete={handleDelete}
            onReprocess={handleReprocess}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            onToggleSelectionMode={handleToggleSelectionMode}
          />
        </div>
      </div>

      {/* Batch Actions Toolbar - shows when documents are selected */}
      <BatchActionsToolbar
        selectedDocuments={selectedDocuments}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        totalDocuments={filteredDocuments.length}
        onDelete={handleBatchDelete}
        onReprocess={handleBatchReprocess}
        onMoveToFolder={handleBatchMoveToFolder}
        onExport={handleBatchExport}
        onTag={handleBatchTag}
        onBulkCompare={handleBulkCompare}
        folders={flatFolderList}
        isProcessing={isProcessingBatch}
      />
    </>
  );
}
