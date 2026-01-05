'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';

// ============================================
// Shortcut Types
// ============================================

export type ShortcutCategory = 'navigation' | 'actions' | 'filters' | 'panels';

export interface ShortcutDefinition {
  key: string;
  /** Display key for UI (e.g., "J" or "Shift+J") */
  displayKey: string;
  /** Short description for inline hints */
  label: string;
  /** Longer description for reference card */
  description: string;
  category: ShortcutCategory;
  /** Whether shortcut requires meta/ctrl key */
  meta?: boolean;
  /** Whether shortcut requires shift key */
  shift?: boolean;
  /** Whether shortcut requires alt key */
  alt?: boolean;
}

export interface KeyboardShortcutsConfig {
  /** Enable/disable all shortcuts */
  enabled: boolean;
  /** Show inline shortcut hints */
  showHints: boolean;
  /** Custom shortcut overrides (future extensibility) */
  customShortcuts?: Record<string, Partial<ShortcutDefinition>>;
}

export interface UseKeyboardShortcutsOptions {
  /** Callback when navigating to next change (J) */
  onNextChange?: () => void;
  /** Callback when navigating to previous change (K) */
  onPreviousChange?: () => void;
  /** Callback when opening review status dropdown (R) */
  onOpenReviewStatus?: () => void;
  /** Callback when opening annotation panel (A) */
  onOpenAnnotation?: () => void;
  /** Callback when toggling severity filter (S) */
  onToggleSeverityFilter?: () => void;
  /** Callback when closing panels (Esc) */
  onClosePanel?: () => void;
  /** Callback when opening shortcut reference (?) */
  onOpenShortcutReference?: () => void;
  /** Callback when expanding/collapsing all categories (E) */
  onToggleExpandAll?: () => void;
  /** Callback when jumping to next unreviewed change (N) */
  onNextUnreviewed?: () => void;
  /** Callback when approving current change (Enter) */
  onApproveChange?: () => void;
  /** Callback when flagging current change (F) */
  onFlagChange?: () => void;
  /** Callback when toggling history panel (H) */
  onToggleHistory?: () => void;
  /** Callback when toggling clause library (L) */
  onToggleClauseLibrary?: () => void;
  /** Callback when filtering by change type (1, 2, 3) */
  onFilterByChangeType?: (type: 'added' | 'modified' | 'removed') => void;
  /** Total number of changes for navigation */
  totalChanges: number;
  /** Current focused change index */
  currentChangeIndex: number;
  /** Whether annotation panel is open */
  isAnnotationPanelOpen?: boolean;
  /** Whether any modal is open */
  isModalOpen?: boolean;
  /** Initial config */
  initialConfig?: Partial<KeyboardShortcutsConfig>;
}

export interface UseKeyboardShortcutsReturn {
  /** Current focused change index */
  focusedIndex: number;
  /** Set focused change index */
  setFocusedIndex: (index: number) => void;
  /** Whether shortcut reference card is open */
  isReferenceOpen: boolean;
  /** Toggle shortcut reference card */
  toggleReference: () => void;
  /** Close shortcut reference card */
  closeReference: () => void;
  /** All shortcut definitions */
  shortcuts: ShortcutDefinition[];
  /** Get shortcuts by category */
  getShortcutsByCategory: (category: ShortcutCategory) => ShortcutDefinition[];
  /** Current config */
  config: KeyboardShortcutsConfig;
  /** Update config */
  setConfig: (config: Partial<KeyboardShortcutsConfig>) => void;
  /** Get shortcut hint for a specific action */
  getShortcutHint: (key: string) => string | null;
}

// ============================================
// Shortcut Definitions
// ============================================

const SHORTCUTS: ShortcutDefinition[] = [
  // Navigation
  {
    key: 'j',
    displayKey: 'J',
    label: 'Next',
    description: 'Navigate to next change',
    category: 'navigation',
  },
  {
    key: 'k',
    displayKey: 'K',
    label: 'Previous',
    description: 'Navigate to previous change',
    category: 'navigation',
  },
  {
    key: 'n',
    displayKey: 'N',
    label: 'Next unreviewed',
    description: 'Jump to next unreviewed change',
    category: 'navigation',
  },
  {
    key: 'g',
    displayKey: 'G',
    label: 'First',
    description: 'Go to first change',
    category: 'navigation',
    shift: false,
  },
  {
    key: 'g',
    displayKey: 'Shift+G',
    label: 'Last',
    description: 'Go to last change',
    category: 'navigation',
    shift: true,
  },
  // Actions
  {
    key: 'r',
    displayKey: 'R',
    label: 'Review',
    description: 'Open review status dropdown',
    category: 'actions',
  },
  {
    key: 'a',
    displayKey: 'A',
    label: 'Annotate',
    description: 'Open annotation panel for current change',
    category: 'actions',
  },
  {
    key: 'Enter',
    displayKey: 'Enter',
    label: 'Approve',
    description: 'Mark current change as reviewed',
    category: 'actions',
  },
  {
    key: 'f',
    displayKey: 'F',
    label: 'Flag',
    description: 'Flag current change for discussion',
    category: 'actions',
  },
  {
    key: 'e',
    displayKey: 'E',
    label: 'Expand/Collapse',
    description: 'Toggle expand/collapse all categories',
    category: 'actions',
  },
  // Filters
  {
    key: 's',
    displayKey: 'S',
    label: 'Severity',
    description: 'Toggle severity filter panel',
    category: 'filters',
  },
  {
    key: '1',
    displayKey: '1',
    label: 'Added',
    description: 'Filter by added changes',
    category: 'filters',
  },
  {
    key: '2',
    displayKey: '2',
    label: 'Modified',
    description: 'Filter by modified changes',
    category: 'filters',
  },
  {
    key: '3',
    displayKey: '3',
    label: 'Removed',
    description: 'Filter by removed changes',
    category: 'filters',
  },
  // Panels
  {
    key: 'Escape',
    displayKey: 'Esc',
    label: 'Close',
    description: 'Close open panels or modals',
    category: 'panels',
  },
  {
    key: '?',
    displayKey: '?',
    label: 'Shortcuts',
    description: 'Show keyboard shortcuts reference',
    category: 'panels',
    shift: true,
  },
  {
    key: 'h',
    displayKey: 'H',
    label: 'History',
    description: 'Toggle history panel',
    category: 'panels',
  },
  {
    key: 'l',
    displayKey: 'L',
    label: 'Clause Library',
    description: 'Toggle clause library panel',
    category: 'panels',
  },
];

// Category labels for display
export const SHORTCUT_CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  filters: 'Filters',
  panels: 'Panels',
};

// ============================================
// Default Config
// ============================================

const DEFAULT_CONFIG: KeyboardShortcutsConfig = {
  enabled: true,
  showHints: true,
};

// ============================================
// Main Hook
// ============================================

export function useKeyboardShortcuts({
  onNextChange,
  onPreviousChange,
  onOpenReviewStatus,
  onOpenAnnotation,
  onToggleSeverityFilter,
  onClosePanel,
  onOpenShortcutReference,
  onToggleExpandAll,
  onNextUnreviewed,
  onApproveChange,
  onFlagChange,
  onToggleHistory,
  onToggleClauseLibrary,
  onFilterByChangeType,
  totalChanges,
  currentChangeIndex,
  isAnnotationPanelOpen = false,
  isModalOpen = false,
  initialConfig,
}: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
  const [focusedIndex, setFocusedIndex] = useState(currentChangeIndex);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [config, setConfigState] = useState<KeyboardShortcutsConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  // Sync focused index with current change index when it changes externally
  useEffect(() => {
    setFocusedIndex(currentChangeIndex);
  }, [currentChangeIndex]);

  // Update config
  const setConfig = useCallback((newConfig: Partial<KeyboardShortcutsConfig>) => {
    setConfigState((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // Toggle reference card
  const toggleReference = useCallback(() => {
    setIsReferenceOpen((prev) => !prev);
  }, []);

  // Close reference card
  const closeReference = useCallback(() => {
    setIsReferenceOpen(false);
  }, []);

  // Navigate to next change
  const goToNext = useCallback(() => {
    if (focusedIndex < totalChanges - 1) {
      const newIndex = focusedIndex + 1;
      setFocusedIndex(newIndex);
      onNextChange?.();
    }
  }, [focusedIndex, totalChanges, onNextChange]);

  // Navigate to previous change
  const goToPrevious = useCallback(() => {
    if (focusedIndex > 0) {
      const newIndex = focusedIndex - 1;
      setFocusedIndex(newIndex);
      onPreviousChange?.();
    }
  }, [focusedIndex, onPreviousChange]);

  // Go to first change
  const goToFirst = useCallback(() => {
    setFocusedIndex(0);
    onNextChange?.();
  }, [onNextChange]);

  // Go to last change
  const goToLast = useCallback(() => {
    if (totalChanges > 0) {
      setFocusedIndex(totalChanges - 1);
      onNextChange?.();
    }
  }, [totalChanges, onNextChange]);

  // Keyboard event handler
  useEffect(() => {
    if (!config.enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputField) return;

      // Skip if modal is open (except for Escape)
      if (isModalOpen && event.key !== 'Escape') return;

      const key = event.key.toLowerCase();

      // Handle shortcuts
      switch (key) {
        case 'j':
          if (!event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            goToNext();
          }
          break;

        case 'k':
          if (!event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            goToPrevious();
          }
          break;

        case 'g':
          if (!event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            if (event.shiftKey) {
              goToLast();
            } else {
              goToFirst();
            }
          }
          break;

        case 'n':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onNextUnreviewed?.();
          }
          break;

        case 'r':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onOpenReviewStatus?.();
          }
          break;

        case 'a':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onOpenAnnotation?.();
          }
          break;

        case 's':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onToggleSeverityFilter?.();
          }
          break;

        case 'e':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onToggleExpandAll?.();
          }
          break;

        case 'f':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onFlagChange?.();
          }
          break;

        case 'enter':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onApproveChange?.();
          }
          break;

        case 'escape':
          event.preventDefault();
          if (isReferenceOpen) {
            closeReference();
          } else {
            onClosePanel?.();
          }
          break;

        case '?':
          if (event.shiftKey) {
            event.preventDefault();
            toggleReference();
            onOpenShortcutReference?.();
          }
          break;

        case 'h':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onToggleHistory?.();
          }
          break;

        case 'l':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onToggleClauseLibrary?.();
          }
          break;

        case '1':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onFilterByChangeType?.('added');
          }
          break;

        case '2':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onFilterByChangeType?.('modified');
          }
          break;

        case '3':
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            onFilterByChangeType?.('removed');
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    config.enabled,
    isModalOpen,
    isReferenceOpen,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
    onNextUnreviewed,
    onOpenReviewStatus,
    onOpenAnnotation,
    onToggleSeverityFilter,
    onToggleExpandAll,
    onFlagChange,
    onApproveChange,
    onClosePanel,
    onOpenShortcutReference,
    onToggleHistory,
    onToggleClauseLibrary,
    onFilterByChangeType,
    toggleReference,
    closeReference,
  ]);

  // Get shortcuts by category
  const getShortcutsByCategory = useCallback(
    (category: ShortcutCategory): ShortcutDefinition[] => {
      return SHORTCUTS.filter((s) => s.category === category);
    },
    []
  );

  // Get shortcut hint for a specific key
  const getShortcutHint = useCallback(
    (key: string): string | null => {
      if (!config.showHints) return null;
      const shortcut = SHORTCUTS.find((s) => s.key.toLowerCase() === key.toLowerCase());
      return shortcut?.displayKey || null;
    },
    [config.showHints]
  );

  // Memoized shortcuts list
  const shortcuts = useMemo(() => SHORTCUTS, []);

  return {
    focusedIndex,
    setFocusedIndex,
    isReferenceOpen,
    toggleReference,
    closeReference,
    shortcuts,
    getShortcutsByCategory,
    config,
    setConfig,
    getShortcutHint,
  };
}
