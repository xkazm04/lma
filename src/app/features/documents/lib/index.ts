export * from './types';
export * from './mock-data';
export * from './saved-views-store';
export * from './folder-mock-data';
export * from './useDocumentLifecycle';

// Unified document list store - consolidates filter, selection, folder, and UI state
export * from './document-list-store';

// Legacy exports for backwards compatibility - prefer using useDocumentListStore
// These are re-exported from the old files but new code should use the unified store
export { useFolderStore, useFilteredDocumentsByFolder } from './folder-store';
