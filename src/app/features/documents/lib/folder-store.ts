import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
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

interface FolderState {
  // Data
  folders: DocumentFolder[];
  documentFolderMap: Record<string, string | null>;

  // UI State
  expandedFolderIds: Set<string>;
  selectedFolderId: string | null;
  folderFilter: FolderFilter;

  // Actions
  setFolders: (folders: DocumentFolder[]) => void;
  addFolder: (request: CreateFolderRequest) => DocumentFolder;
  updateFolder: (folderId: string, updates: Partial<DocumentFolder>) => void;
  deleteFolder: (folderId: string) => void;

  // Document-folder mapping
  moveDocumentToFolder: (documentId: string, folderId: string | null) => void;
  bulkMoveDocuments: (documentIds: string[], folderId: string | null) => void;
  getDocumentFolder: (documentId: string) => string | null;

  // UI State actions
  toggleFolderExpanded: (folderId: string) => void;
  setFolderExpanded: (folderId: string, expanded: boolean) => void;
  expandAllFolders: () => void;
  collapseAllFolders: () => void;
  selectFolder: (folderId: string | null) => void;
  setFolderFilter: (filter: FolderFilter) => void;

  // Computed
  getFolderTree: () => FolderTreeNode[];
  getFolderById: (folderId: string) => DocumentFolder | undefined;
  getFolderPath: (folderId: string) => string;
  getChildFolders: (parentId: string | null) => DocumentFolder[];
  getDocumentsInFolder: (folderId: string | null, includeSubfolders?: boolean) => string[];
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set, get) => ({
      // Initial data
      folders: mockFolders,
      documentFolderMap: mockDocumentFolderMap,

      // Initial UI state
      expandedFolderIds: new Set<string>(),
      selectedFolderId: null,
      folderFilter: { type: 'all' },

      // Actions
      setFolders: (folders) => set({ folders }),

      addFolder: (request) => {
        const newFolder: DocumentFolder = {
          id: `folder-${Date.now()}`,
          organizationId: 'org-1', // In real app, get from auth context
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

      // Document-folder mapping
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

      // UI State actions
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

      // Computed
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
    }),
    {
      name: 'document-folders-storage',
      partialize: (state) => ({
        // Only persist certain parts of the state
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

/**
 * Hook to get filtered documents based on folder filter
 */
export function useFilteredDocumentsByFolder<T extends { id: string }>(
  documents: T[],
  folderFilter: FolderFilter
): T[] {
  const { getDocumentsInFolder } = useFolderStore();

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
