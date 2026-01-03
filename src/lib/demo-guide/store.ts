'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DemoContent, DemoGuideStore, ModuleContent, DemoSection } from './types';

const STORAGE_KEY = 'loanOS_demoGuide';

export const useDemoGuideStore = create<DemoGuideStore>()(
  persist(
    (set, get) => ({
      // State
      isExploreMode: false,
      activeModule: null,
      activeSection: null,
      activeDemo: null,
      viewedDemos: new Set<string>(),

      // Actions
      toggleExploreMode: () => {
        set((state) => ({
          isExploreMode: !state.isExploreMode,
          // Reset state when toggling off
          activeModule: state.isExploreMode ? null : state.activeModule,
          activeSection: state.isExploreMode ? null : state.activeSection,
          activeDemo: state.isExploreMode ? null : state.activeDemo,
        }));
      },

      enableExploreMode: () => {
        set({ isExploreMode: true });
      },

      disableExploreMode: () => {
        set({
          isExploreMode: false,
          activeModule: null,
          activeSection: null,
          activeDemo: null
        });
      },

      setActiveModule: (module: ModuleContent | null) => {
        set({ activeModule: module, activeSection: null });
      },

      setActiveSection: (section: DemoSection | null) => {
        set({ activeSection: section });
        if (section) {
          get().markAsViewed(section.id);
        }
      },

      showDemo: (demo: DemoContent) => {
        set({ activeDemo: demo });
        // Mark as viewed when shown
        get().markAsViewed(demo.id);
      },

      hideDemo: () => {
        set({ activeDemo: null });
      },

      markAsViewed: (demoId: string) => {
        set((state) => ({
          viewedDemos: new Set([...state.viewedDemos, demoId]),
        }));
      },

      hasViewed: (demoId: string) => {
        return get().viewedDemos.has(demoId);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        // Only persist viewed demos, not the mode state
        viewedDemos: Array.from(state.viewedDemos),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { viewedDemos?: string[] };
        return {
          ...currentState,
          viewedDemos: new Set(persisted.viewedDemos || []),
        };
      },
    }
  )
);
