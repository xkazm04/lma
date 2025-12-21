import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoanDocument } from '@/types';
import type {
  DocumentStatusFilter,
  DocumentTypeFilter,
  DocumentViewMode,
  DocumentFilters,
  DocumentFolder,
  FolderTreeNode,
  FolderFilter,
  CreateFolderRequest,
} from './types';
import {
  mockFolders,
  mockDocumentFolderMap,
  buildFolderTree,
  getFolderPath,
} from './folder-mock-data';

// ============================================
// Unified Document List Store
// ============================================
// Consolidates three state management patterns into one:
// 1. useState for selection/batch processing
// 2. useDocumentFilters hook for filter state
// 3. useFolderStore (Zustand) for folder state
// ============================================

/**
 * Filter state slice - manages search, status, type filters and view mode
 */
interface FilterSlice {
  // Filter state
  searchQuery: string;
  statusFilter: DocumentStatusFilter;
  typeFilter: DocumentTypeFilter;
  viewMode: DocumentViewMode;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: DocumentStatusFilter) => void;
  setTypeFilter: (type: DocumentTypeFilter) => void;
  setViewMode: (mode: DocumentViewMode) => void;
  applyFilters: (filters: DocumentFilters) => void;
  resetFilters: () => void;

  // Filter computed
  getCurrentFilters: () => DocumentFilters;
}

/**
 * Selection state slice - manages document selection and batch operations
 */
interface SelectionSlice {
  // Selection state
  selectionMode: boolean;
  selectedIds: Set<string>;
  isProcessingBatch: boolean;

  // Selection actions
  toggleSelectionMode: () => void;
  setSelectionMode: (enabled: boolean) => void;
  selectDocument: (id: string) => void;
  deselectDocument: (id: string) => void;
  toggleDocumentSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setIsProcessingBatch: (processing: boolean) => void;

  // Selection computed
  getSelectedIds: () => string[];
  isDocumentSelected: (id: string) => boolean;
  getSelectedCount: () => number;
}

/**
 * Folder state slice - manages folder hierarchy and document-folder mapping
 */
interface FolderSlice {
  // Folder data
  folders: DocumentFolder[];
  documentFolderMap: Record<string, string | null>;

  // Folder UI state
  expandedFolderIds: Set<string>;
  selectedFolderId: string | null;
  folderFilter: FolderFilter;

  // Folder actions
  setFolders: (folders: DocumentFolder[]) => void;
  addFolder: (request: CreateFolderRequest) => DocumentFolder;
  updateFolder: (folderId: string, updates: Partial<DocumentFolder>) => void;
  deleteFolder: (folderId: string) => void;

  // Document-folder mapping
  moveDocumentToFolder: (documentId: string, folderId: string | null) => void;
  bulkMoveDocuments: (documentIds: string[], folderId: string | null) => void;
  getDocumentFolder: (documentId: string) => string | null;

  // Folder UI actions
  toggleFolderExpanded: (folderId: string) => void;
  setFolderExpanded: (folderId: string, expanded: boolean) => void;
  expandAllFolders: () => void;
  collapseAllFolders: () => void;
  selectFolder: (folderId: string | null) => void;
  setFolderFilter: (filter: FolderFilter) => void;

  // Folder computed
  getFolderTree: () => FolderTreeNode[];
  getFolderById: (folderId: string) => DocumentFolder | undefined;
  getFolderPath: (folderId: string) => string;
  getChildFolders: (parentId: string | null) => DocumentFolder[];
  getDocumentsInFolder: (folderId: string | null, includeSubfolders?: boolean) => string[];
}

/**
 * UI state slice - manages non-persistent UI state
 */
interface UISlice {
  // Dialog state
  saveDialogOpen: boolean;
  createFolderOpen: boolean;
  createFolderParentId: string | null;

  // UI actions
  setSaveDialogOpen: (open: boolean) => void;
  setCreateFolderOpen: (open: boolean) => void;
  setCreateFolderParentId: (parentId: string | null) => void;
  openCreateFolderModal: (parentId: string | null) => void;
  closeCreateFolderModal: () => void;
}

/**
 * Complete unified document list store
 */
export type DocumentListStore = FilterSlice & SelectionSlice & FolderSlice & UISlice;

// Default filter values
const DEFAULT_FILTERS: DocumentFilters = {
  searchQuery: '',
  statusFilter: 'all',
  typeFilter: 'all',
  viewMode: 'list',
};

/**
 * Unified Document List Store
 *
 * Consolidates all document list state management into a single Zustand store:
 * - Filters: search, status, type, view mode
 * - Selection: document selection for batch operations
 * - Folders: folder hierarchy and document-folder mapping
 * - UI: dialog states and transient UI state
 *
 * This creates one mental model instead of three, making the state machine
 * visible and testable as a single unit.
 */
export const useDocumentListStore = create<DocumentListStore>()(
  persist(
    (set, get) => ({
      // ============================================
      // Filter Slice
      // ============================================
      searchQuery: DEFAULT_FILTERS.searchQuery,
      statusFilter: DEFAULT_FILTERS.statusFilter,
      typeFilter: DEFAULT_FILTERS.typeFilter,
      viewMode: DEFAULT_FILTERS.viewMode,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setTypeFilter: (type) => set({ typeFilter: type }),
      setViewMode: (mode) => set({ viewMode: mode }),

      applyFilters: (filters) =>
        set({
          searchQuery: filters.searchQuery,
          statusFilter: filters.statusFilter,
          typeFilter: filters.typeFilter,
          viewMode: filters.viewMode,
        }),

      resetFilters: () =>
        set({
          searchQuery: DEFAULT_FILTERS.searchQuery,
          statusFilter: DEFAULT_FILTERS.statusFilter,
          typeFilter: DEFAULT_FILTERS.typeFilter,
          viewMode: DEFAULT_FILTERS.viewMode,
        }),

      getCurrentFilters: () => ({
        searchQuery: get().searchQuery,
        statusFilter: get().statusFilter,
        typeFilter: get().typeFilter,
        viewMode: get().viewMode,
      }),

      // ============================================
      // Selection Slice
      // ============================================
      selectionMode: false,
      selectedIds: new Set<string>(),
      isProcessingBatch: false,

      toggleSelectionMode: () => {
        const currentMode = get().selectionMode;
        set({
          selectionMode: !currentMode,
          // Clear selection when exiting selection mode
          selectedIds: currentMode ? new Set<string>() : get().selectedIds,
        });
      },

      setSelectionMode: (enabled) => {
        set({
          selectionMode: enabled,
          // Clear selection when disabling selection mode
          selectedIds: enabled ? get().selectedIds : new Set<string>(),
        });
      },

      selectDocument: (id) => {
        const newIds = new Set(get().selectedIds);
        newIds.add(id);
        set({ selectedIds: newIds });
      },

      deselectDocument: (id) => {
        const newIds = new Set(get().selectedIds);
        newIds.delete(id);
        set({ selectedIds: newIds });
      },

      toggleDocumentSelection: (id) => {
        const currentIds = get().selectedIds;
        const newIds = new Set(currentIds);
        if (newIds.has(id)) {
          newIds.delete(id);
        } else {
          newIds.add(id);
        }
        set({ selectedIds: newIds });
      },

      selectAll: (ids) => {
        set({ selectedIds: new Set(ids) });
      },

      clearSelection: () => {
        set({
          selectedIds: new Set<string>(),
          selectionMode: false,
        });
      },

      setIsProcessingBatch: (processing) => set({ isProcessingBatch: processing }),

      getSelectedIds: () => Array.from(get().selectedIds),

      isDocumentSelected: (id) => get().selectedIds.has(id),

      getSelectedCount: () => get().selectedIds.size,

      // ============================================
      // Folder Slice
      // ============================================
      folders: mockFolders,
      documentFolderMap: mockDocumentFolderMap,
      expandedFolderIds: new Set<string>(),
      selectedFolderId: null,
      folderFilter: { type: 'all' },

      setFolders: (folders) => set({ folders }),

      addFolder: (request) => {
        const newFolder: DocumentFolder = {
          id: `folder-${Date.now()}`,
          organizationId: 'org-1',
          parentId: request.parentId,
          name: request.name,
          description: request.description,
          color: request.color || '#6B7280',
          icon: request.icon || 'folder',
          isSmartFolder: request.isSmartFolder || false,
          classificationRules: request.classificationRules?.map((rule, index) => ({
            ...rule,
            id: `rule-${Date.now()}-${index}`,
          })),
          matchAnyRule: request.matchAnyRule,
          documentCount: 0,
          childFolderCount: 0,
          createdBy: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          displayOrder: get().folders.filter((f) => f.parentId === request.parentId).length + 1,
        };

        set((state) => ({
          folders: [...state.folders, newFolder],
        }));

        // Update parent's child count
        if (request.parentId) {
          get().updateFolder(request.parentId, {
            childFolderCount: get().getChildFolders(request.parentId).length,
          });
        }

        return newFolder;
      },

      updateFolder: (folderId, updates) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === folderId
              ? { ...folder, ...updates, updatedAt: new Date().toISOString() }
              : folder
          ),
        }));
      },

      deleteFolder: (folderId) => {
        const state = get();
        const folder = state.getFolderById(folderId);
        if (!folder) return;

        // Get all descendant folder IDs
        const getDescendantIds = (parentId: string): string[] => {
          const children = state.getChildFolders(parentId);
          return children.reduce(
            (acc, child) => [...acc, child.id, ...getDescendantIds(child.id)],
            [] as string[]
          );
        };

        const descendantIds = getDescendantIds(folderId);
        const allIdsToDelete = [folderId, ...descendantIds];

        // Move all documents in deleted folders to unfiled
        const newDocumentFolderMap = { ...state.documentFolderMap };
        Object.keys(newDocumentFolderMap).forEach((docId) => {
          if (allIdsToDelete.includes(newDocumentFolderMap[docId] || '')) {
            newDocumentFolderMap[docId] = null;
          }
        });

        set((state) => ({
          folders: state.folders.filter((f) => !allIdsToDelete.includes(f.id)),
          documentFolderMap: newDocumentFolderMap,
          selectedFolderId:
            state.selectedFolderId && allIdsToDelete.includes(state.selectedFolderId)
              ? null
              : state.selectedFolderId,
        }));

        // Update parent's child count
        if (folder.parentId) {
          get().updateFolder(folder.parentId, {
            childFolderCount: get().getChildFolders(folder.parentId).length,
          });
        }
      },

      moveDocumentToFolder: (documentId, folderId) => {
        const state = get();
        const oldFolderId = state.documentFolderMap[documentId];

        set((state) => ({
          documentFolderMap: {
            ...state.documentFolderMap,
            [documentId]: folderId,
          },
        }));

        // Update document counts
        if (oldFolderId) {
          const oldFolder = state.getFolderById(oldFolderId);
          if (oldFolder) {
            get().updateFolder(oldFolderId, {
              documentCount: Math.max(0, oldFolder.documentCount - 1),
            });
          }
        }

        if (folderId) {
          const newFolder = state.getFolderById(folderId);
          if (newFolder) {
            get().updateFolder(folderId, {
              documentCount: newFolder.documentCount + 1,
            });
          }
        }
      },

      bulkMoveDocuments: (documentIds, folderId) => {
        documentIds.forEach((docId) => {
          get().moveDocumentToFolder(docId, folderId);
        });
      },

      getDocumentFolder: (documentId) => {
        return get().documentFolderMap[documentId] || null;
      },

      toggleFolderExpanded: (folderId) => {
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds);
          if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
          } else {
            newExpanded.add(folderId);
          }
          return { expandedFolderIds: newExpanded };
        });
      },

      setFolderExpanded: (folderId, expanded) => {
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds);
          if (expanded) {
            newExpanded.add(folderId);
          } else {
            newExpanded.delete(folderId);
          }
          return { expandedFolderIds: newExpanded };
        });
      },

      expandAllFolders: () => {
        set((state) => ({
          expandedFolderIds: new Set(state.folders.map((f) => f.id)),
        }));
      },

      collapseAllFolders: () => {
        set({ expandedFolderIds: new Set() });
      },

      selectFolder: (folderId) => {
        set({ selectedFolderId: folderId });
        if (folderId) {
          set({ folderFilter: { type: 'folder', folderId, includeSubfolders: true } });
        } else {
          set({ folderFilter: { type: 'all' } });
        }
      },

      setFolderFilter: (filter) => {
        set({ folderFilter: filter });
      },

      getFolderTree: () => {
        return buildFolderTree(get().folders);
      },

      getFolderById: (folderId) => {
        return get().folders.find((f) => f.id === folderId);
      },

      getFolderPath: (folderId) => {
        return getFolderPath(folderId, get().folders);
      },

      getChildFolders: (parentId) => {
        return get()
          .folders.filter((f) => f.parentId === parentId)
          .sort((a, b) => a.displayOrder - b.displayOrder);
      },

      getDocumentsInFolder: (folderId, includeSubfolders = false) => {
        const state = get();

        if (folderId === null) {
          // Get unfiled documents
          return Object.entries(state.documentFolderMap)
            .filter(([, folder]) => folder === null)
            .map(([docId]) => docId);
        }

        if (!includeSubfolders) {
          return Object.entries(state.documentFolderMap)
            .filter(([, folder]) => folder === folderId)
            .map(([docId]) => docId);
        }

        // Get all descendant folder IDs
        const getDescendantIds = (parentId: string): string[] => {
          const children = state.getChildFolders(parentId);
          return children.reduce(
            (acc, child) => [...acc, child.id, ...getDescendantIds(child.id)],
            [] as string[]
          );
        };

        const allFolderIds = [folderId, ...getDescendantIds(folderId)];

        return Object.entries(state.documentFolderMap)
          .filter(([, folder]) => folder !== null && allFolderIds.includes(folder))
          .map(([docId]) => docId);
      },

      // ============================================
      // UI Slice
      // ============================================
      saveDialogOpen: false,
      createFolderOpen: false,
      createFolderParentId: null,

      setSaveDialogOpen: (open) => set({ saveDialogOpen: open }),
      setCreateFolderOpen: (open) => set({ createFolderOpen: open }),
      setCreateFolderParentId: (parentId) => set({ createFolderParentId: parentId }),

      openCreateFolderModal: (parentId) =>
        set({
          createFolderOpen: true,
          createFolderParentId: parentId,
        }),

      closeCreateFolderModal: () =>
        set({
          createFolderOpen: false,
          createFolderParentId: null,
        }),
    }),
    {
      name: 'document-list-storage',
      partialize: (state) => ({
        // Persist filter preferences
        viewMode: state.viewMode,
        // Persist folder expansion state
        expandedFolderIds: Array.from(state.expandedFolderIds),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.expandedFolderIds)) {
          state.expandedFolderIds = new Set(state.expandedFolderIds);
        }
      },
    }
  )
);

// ============================================
// Utility Hooks and Selectors
// ============================================

/**
 * Filter documents based on current filter state
 */
export function filterDocuments(
  documents: LoanDocument[],
  filters: DocumentFilters
): LoanDocument[] {
  return documents.filter((doc) => {
    const matchesSearch = doc.original_filename
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase());
    const matchesStatus = filters.statusFilter === 'all' || doc.processing_status === filters.statusFilter;
    const matchesType = filters.typeFilter === 'all' || doc.document_type === filters.typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
}

/**
 * Filter documents based on folder filter
 */
export function filterDocumentsByFolder<T extends { id: string }>(
  documents: T[],
  folderFilter: FolderFilter,
  getDocumentsInFolder: (folderId: string | null, includeSubfolders?: boolean) => string[]
): T[] {
  if (folderFilter.type === 'all') {
    return documents;
  }

  if (folderFilter.type === 'unfiled') {
    const unfiledIds = getDocumentsInFolder(null);
    return documents.filter((doc) => unfiledIds.includes(doc.id));
  }

  if (folderFilter.type === 'folder') {
    const folderDocIds = getDocumentsInFolder(
      folderFilter.folderId,
      folderFilter.includeSubfolders
    );
    return documents.filter((doc) => folderDocIds.includes(doc.id));
  }

  return documents;
}

/**
 * Hook to get filtered documents by folder using the unified store
 */
export function useFilteredDocumentsByFolderUnified<T extends { id: string }>(
  documents: T[],
  folderFilter: FolderFilter
): T[] {
  const { getDocumentsInFolder } = useDocumentListStore();
  return filterDocumentsByFolder(documents, folderFilter, getDocumentsInFolder);
}

/**
 * Hook to get selected documents from a list
 */
export function useSelectedDocuments<T extends { id: string }>(documents: T[]): T[] {
  const selectedIds = useDocumentListStore((state) => state.selectedIds);
  return documents.filter((doc) => selectedIds.has(doc.id));
}

// ============================================
// Shallow Selectors for Performance
// ============================================

/**
 * Selector for filter state only
 */
export const selectFilters = (state: DocumentListStore): DocumentFilters => ({
  searchQuery: state.searchQuery,
  statusFilter: state.statusFilter,
  typeFilter: state.typeFilter,
  viewMode: state.viewMode,
});

/**
 * Selector for selection state only
 */
export const selectSelection = (state: DocumentListStore) => ({
  selectionMode: state.selectionMode,
  selectedIds: state.selectedIds,
  isProcessingBatch: state.isProcessingBatch,
});

/**
 * Selector for folder filter only
 */
export const selectFolderFilter = (state: DocumentListStore) => state.folderFilter;

/**
 * Selector for folder list only
 */
export const selectFolders = (state: DocumentListStore) => state.folders;
