'use client';

import React, { useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, GitCompare, Shield, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/layout';
import { DemoCard } from '@/lib/demo-guide';
import {
  DocumentFiltersBar,
  DocumentStatsBar,
  DocumentGrid,
  GlobalDropzone,
  SavedViewsBar,
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
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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
      setTimeout(() => {
        setIsProcessingBatch(false);
        clearSelection();
      }, 1000);
    },
    [setIsProcessingBatch, clearSelection]
  );

  const handleBatchExport = useCallback((ids: string[]) => {
    console.log('Batch export documents:', ids);
  }, []);

  const handleBatchTag = useCallback(
    (ids: string[], tags: string[]) => {
      setIsProcessingBatch(true);
      console.log('Batch tag documents:', ids, 'with tags:', tags);
      setTimeout(() => {
        setIsProcessingBatch(false);
      }, 1000);
    },
    [setIsProcessingBatch]
  );

  const handleBulkCompare = useCallback(
    (ids: string[]) => {
      console.log('Bulk compare documents:', ids);
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
    if (createFolderParentId) {
      setFolderExpanded(createFolderParentId, true);
    }
    closeCreateFolderModal();
  }, [createFolderParentId, setFolderExpanded, closeCreateFolderModal]);

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

      <PageContainer>
        <div className="space-y-3">
          {/* Header */}
          <PageHeader
            title="Document Hub"
            subtitle="Upload, analyze, and manage loan documents"
            compact
            actions={
              <Link href="/documents/upload">
                <Button size="sm" className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Upload
                </Button>
              </Link>
            }
          />

          {/* Stats Bar */}
          <DocumentStatsBar documents={folderFilteredDocuments} />

          {/* Row 2: Saved Views Bar + Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg overflow-hidden border border-zinc-200">
              <SavedViewsBar
                onViewSelect={handleViewSelect}
                onSaveCurrentFilters={handleSaveCurrentFilters}
              />
            </div>

            {/* Compact Action Buttons */}
            <div className="flex items-center gap-1.5">
              <Link href="/documents/risk-detection">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  data-testid="documents-risk-detection-btn"
                >
                  <Shield className="w-3.5 h-3.5 mr-1" />
                  Risk
                </Button>
              </Link>
              <Link href="/documents/compare">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  data-testid="documents-compare-btn"
                >
                  <GitCompare className="w-3.5 h-3.5 mr-1" />
                  Compare
                </Button>
              </Link>
              <Link href="/documents/upload">
                <Button size="sm" className="h-8 text-xs" data-testid="documents-upload-btn">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Upload
                </Button>
              </Link>
            </div>
          </div>

          {/* Row 3: Main Content - Folder Sidebar + Document Area */}
          <div className="flex rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 240px)' }}>
            {/* Folder Sidebar - Expandable - Explorable Section */}
            <DemoCard sectionId="documents-folder-tree">
              <div
                className={`flex-shrink-0 transition-all duration-300 ease-in-out border-r border-zinc-100 relative bg-zinc-50/50 ${
                  sidebarExpanded ? 'w-[40rem]' : 'w-[28rem]'
                }`}
                style={{ height: '100%' }}
              >
                <FolderTree onCreateFolder={handleCreateFolder} />
                {/* Expand/Collapse Toggle */}
                <button
                  onClick={() => setSidebarExpanded(!sidebarExpanded)}
                  className="absolute top-2 right-2 p-1 rounded-md hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700 transition-colors z-10"
                  title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {sidebarExpanded ? (
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  ) : (
                    <PanelLeft className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </DemoCard>

            {/* Document Area - Explorable Section */}
            <DemoCard sectionId="documents-list" className="flex-1 min-w-0">
              <div className="flex flex-col h-full">
                {/* Filters Bar - Integrated into table header */}
                <div className="border-b border-zinc-100 bg-white">
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
                </div>

                {/* Document Grid/List */}
                <div className="flex-1 overflow-auto">
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
            </DemoCard>
          </div>
        </div>
      </PageContainer>

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
