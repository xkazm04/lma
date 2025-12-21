'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedView, SavedViewsPreferences, DocumentFilters } from './types';

const STORAGE_KEY = 'loanOS_savedViews';

// Default filters for creating new views
const DEFAULT_FILTERS: DocumentFilters = {
  searchQuery: '',
  statusFilter: 'all',
  typeFilter: 'all',
  viewMode: 'grid',
};

// Preset views that come with the application
const PRESET_VIEWS: SavedView[] = [
  {
    id: 'preset-all-documents',
    name: 'All Documents',
    filters: { ...DEFAULT_FILTERS },
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isShared: true,
    isDefault: false,
    icon: 'files',
  },
  {
    id: 'preset-my-review-queue',
    name: 'My Review Queue',
    filters: {
      searchQuery: '',
      statusFilter: 'review_required',
      typeFilter: 'all',
      viewMode: 'list',
    },
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isShared: true,
    isDefault: false,
    icon: 'eye',
  },
  {
    id: 'preset-failed-this-week',
    name: 'Failed This Week',
    filters: {
      searchQuery: '',
      statusFilter: 'failed',
      typeFilter: 'all',
      viewMode: 'list',
    },
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isShared: true,
    isDefault: false,
    icon: 'alert-triangle',
  },
  {
    id: 'preset-facility-agreements',
    name: 'Facility Agreements',
    filters: {
      searchQuery: '',
      statusFilter: 'all',
      typeFilter: 'facility_agreement',
      viewMode: 'grid',
    },
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isShared: true,
    isDefault: false,
    icon: 'file-text',
  },
];

interface SavedViewsState {
  // State
  views: SavedView[];
  activeViewId: string | null;
  preferences: SavedViewsPreferences;

  // Actions
  createView: (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>) => SavedView;
  updateView: (id: string, updates: Partial<Omit<SavedView, 'id' | 'createdAt' | 'createdBy'>>) => void;
  deleteView: (id: string) => void;
  setActiveView: (id: string | null) => void;
  setDefaultView: (id: string | null) => void;
  toggleViewSharing: (id: string) => void;
  duplicateView: (id: string, newName: string) => SavedView | null;

  // Selectors
  getViewById: (id: string) => SavedView | undefined;
  getMyViews: (userId: string) => SavedView[];
  getSharedViews: () => SavedView[];
  getActiveView: () => SavedView | undefined;
  getDefaultView: () => SavedView | undefined;
}

export const useSavedViewsStore = create<SavedViewsState>()(
  persist(
    (set, get) => ({
      // Initial state
      views: [...PRESET_VIEWS],
      activeViewId: null,
      preferences: {
        defaultViewId: null,
        showSharedViews: true,
      },

      // Actions
      createView: (viewData) => {
        const newView: SavedView = {
          ...viewData,
          id: `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          views: [...state.views, newView],
        }));

        return newView;
      },

      updateView: (id, updates) => {
        set((state) => ({
          views: state.views.map((view) =>
            view.id === id
              ? { ...view, ...updates, updatedAt: new Date().toISOString() }
              : view
          ),
        }));
      },

      deleteView: (id) => {
        // Prevent deleting preset views
        if (id.startsWith('preset-')) return;

        set((state) => ({
          views: state.views.filter((view) => view.id !== id),
          activeViewId: state.activeViewId === id ? null : state.activeViewId,
          preferences: {
            ...state.preferences,
            defaultViewId: state.preferences.defaultViewId === id ? null : state.preferences.defaultViewId,
          },
        }));
      },

      setActiveView: (id) => {
        set({ activeViewId: id });
      },

      setDefaultView: (id) => {
        set((state) => ({
          views: state.views.map((view) => ({
            ...view,
            isDefault: view.id === id,
          })),
          preferences: {
            ...state.preferences,
            defaultViewId: id,
          },
        }));
      },

      toggleViewSharing: (id) => {
        // Prevent changing preset views
        if (id.startsWith('preset-')) return;

        set((state) => ({
          views: state.views.map((view) =>
            view.id === id
              ? { ...view, isShared: !view.isShared, updatedAt: new Date().toISOString() }
              : view
          ),
        }));
      },

      duplicateView: (id, newName) => {
        const state = get();
        const sourceView = state.views.find((v) => v.id === id);
        if (!sourceView) return null;

        const newView: SavedView = {
          ...sourceView,
          id: `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: newName,
          isDefault: false,
          isShared: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          views: [...state.views, newView],
        }));

        return newView;
      },

      // Selectors
      getViewById: (id) => {
        return get().views.find((v) => v.id === id);
      },

      getMyViews: (userId) => {
        return get().views.filter(
          (v) => v.createdBy === userId || v.createdBy === 'system'
        );
      },

      getSharedViews: () => {
        const state = get();
        if (!state.preferences.showSharedViews) return [];
        return state.views.filter((v) => v.isShared);
      },

      getActiveView: () => {
        const state = get();
        if (!state.activeViewId) return undefined;
        return state.views.find((v) => v.id === state.activeViewId);
      },

      getDefaultView: () => {
        const state = get();
        if (!state.preferences.defaultViewId) return undefined;
        return state.views.find((v) => v.id === state.preferences.defaultViewId);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        views: state.views.filter((v) => !v.id.startsWith('preset-')),
        preferences: state.preferences,
        activeViewId: state.activeViewId,
      }),
      merge: (persistedState: unknown, currentState) => {
        const persisted = persistedState as Partial<SavedViewsState>;
        return {
          ...currentState,
          views: [...PRESET_VIEWS, ...(persisted.views || [])],
          preferences: persisted.preferences || currentState.preferences,
          activeViewId: persisted.activeViewId ?? null,
        };
      },
    }
  )
);

// Utility hook to get filters from active view or defaults
export function useActiveFilters() {
  const activeView = useSavedViewsStore((state) => state.getActiveView());
  return activeView?.filters ?? DEFAULT_FILTERS;
}

// Export default filters for external use
export { DEFAULT_FILTERS };
