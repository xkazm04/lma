'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import type { ExtractionCategory, ExtractionField } from '../../lib/types';

export interface KeyboardNavigationState {
  /** Currently focused field index within all flattened fields */
  focusedIndex: number;
  /** Category index of the focused field */
  focusedCategoryIndex: number;
  /** Field index within the category */
  focusedFieldIndex: number;
  /** Whether keyboard navigation is active */
  isActive: boolean;
  /** Whether help popover is visible */
  showHelp: boolean;
  /** Whether a field is in edit mode */
  isEditing: boolean;
}

export interface KeyboardNavigationActions {
  /** Move focus to the previous field */
  navigateUp: () => void;
  /** Move focus to the next field */
  navigateDown: () => void;
  /** Toggle verification status of focused field */
  toggleVerify: () => void;
  /** Enter edit mode for focused field */
  startEdit: () => void;
  /** Cancel edit mode */
  cancelEdit: () => void;
  /** Toggle help popover visibility */
  toggleHelp: () => void;
  /** Set focus to a specific field */
  setFocus: (categoryIndex: number, fieldIndex: number) => void;
  /** Activate keyboard navigation */
  activate: () => void;
  /** Deactivate keyboard navigation */
  deactivate: () => void;
  /** Set editing state */
  setIsEditing: (editing: boolean) => void;
}

export interface UseKeyboardNavigationOptions {
  categories: ExtractionCategory[];
  onFieldSelect?: (field: ExtractionField, categoryIndex: number, fieldIndex: number) => void;
  onVerify?: (categoryIndex: number, fieldIndex: number) => void;
  onStartEdit?: (categoryIndex: number, fieldIndex: number) => void;
  onCancelEdit?: () => void;
  enabled?: boolean;
}

interface FlattenedField {
  field: ExtractionField;
  categoryIndex: number;
  fieldIndex: number;
  globalIndex: number;
}

/**
 * Custom hook for keyboard navigation in the extraction review page.
 * Supports arrow up/down for navigation, Enter for verify, E for edit, Escape to cancel.
 */
export function useKeyboardNavigation({
  categories,
  onFieldSelect,
  onVerify,
  onStartEdit,
  onCancelEdit,
  enabled = true,
}: UseKeyboardNavigationOptions): [KeyboardNavigationState, KeyboardNavigationActions] {
  const [state, setState] = useState<KeyboardNavigationState>({
    focusedIndex: -1,
    focusedCategoryIndex: -1,
    focusedFieldIndex: -1,
    isActive: false,
    showHelp: false,
    isEditing: false,
  });

  // Flatten all fields for linear navigation
  const flattenedFields = useMemo((): FlattenedField[] => {
    const result: FlattenedField[] = [];
    let globalIndex = 0;

    categories.forEach((category, categoryIndex) => {
      category.fields.forEach((field, fieldIndex) => {
        result.push({
          field,
          categoryIndex,
          fieldIndex,
          globalIndex: globalIndex++,
        });
      });
    });

    return result;
  }, [categories]);

  const totalFields = flattenedFields.length;

  // Get flattened field by category and field index
  const getFlattenedIndex = useCallback((categoryIndex: number, fieldIndex: number): number => {
    const found = flattenedFields.find(
      f => f.categoryIndex === categoryIndex && f.fieldIndex === fieldIndex
    );
    return found ? found.globalIndex : -1;
  }, [flattenedFields]);

  // Navigate to a specific index
  const navigateToIndex = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= totalFields || state.isEditing) return;

    const targetField = flattenedFields[newIndex];
    if (!targetField) return;

    setState(prev => ({
      ...prev,
      focusedIndex: newIndex,
      focusedCategoryIndex: targetField.categoryIndex,
      focusedFieldIndex: targetField.fieldIndex,
      isActive: true,
    }));

    onFieldSelect?.(
      targetField.field,
      targetField.categoryIndex,
      targetField.fieldIndex
    );
  }, [flattenedFields, totalFields, onFieldSelect, state.isEditing]);

  // Navigation actions
  const navigateUp = useCallback(() => {
    if (state.isEditing) return;

    const newIndex = state.focusedIndex <= 0
      ? totalFields - 1 // Wrap to end
      : state.focusedIndex - 1;
    navigateToIndex(newIndex);
  }, [state.focusedIndex, state.isEditing, totalFields, navigateToIndex]);

  const navigateDown = useCallback(() => {
    if (state.isEditing) return;

    const newIndex = state.focusedIndex >= totalFields - 1
      ? 0 // Wrap to beginning
      : state.focusedIndex + 1;
    navigateToIndex(newIndex);
  }, [state.focusedIndex, state.isEditing, totalFields, navigateToIndex]);

  const toggleVerify = useCallback(() => {
    if (state.focusedCategoryIndex < 0 || state.focusedFieldIndex < 0 || state.isEditing) return;
    onVerify?.(state.focusedCategoryIndex, state.focusedFieldIndex);
  }, [state.focusedCategoryIndex, state.focusedFieldIndex, state.isEditing, onVerify]);

  const startEdit = useCallback(() => {
    if (state.focusedCategoryIndex < 0 || state.focusedFieldIndex < 0 || state.isEditing) return;
    setState(prev => ({ ...prev, isEditing: true }));
    onStartEdit?.(state.focusedCategoryIndex, state.focusedFieldIndex);
  }, [state.focusedCategoryIndex, state.focusedFieldIndex, state.isEditing, onStartEdit]);

  const cancelEdit = useCallback(() => {
    setState(prev => ({ ...prev, isEditing: false }));
    onCancelEdit?.();
  }, [onCancelEdit]);

  const toggleHelp = useCallback(() => {
    setState(prev => ({ ...prev, showHelp: !prev.showHelp }));
  }, []);

  const setFocus = useCallback((categoryIndex: number, fieldIndex: number) => {
    const globalIndex = getFlattenedIndex(categoryIndex, fieldIndex);
    if (globalIndex >= 0) {
      navigateToIndex(globalIndex);
    }
  }, [getFlattenedIndex, navigateToIndex]);

  const activate = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
    // If no field is focused, focus the first one
    if (state.focusedIndex < 0 && totalFields > 0) {
      navigateToIndex(0);
    }
  }, [state.focusedIndex, totalFields, navigateToIndex]);

  const deactivate = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  const setIsEditing = useCallback((editing: boolean) => {
    setState(prev => ({ ...prev, isEditing: editing }));
  }, []);

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't capture events when typing in inputs (unless it's Escape)
      const target = event.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.isContentEditable;

      // Allow Escape to work even in inputs
      if (event.key === 'Escape') {
        if (state.isEditing) {
          event.preventDefault();
          cancelEdit();
          return;
        }
        if (state.showHelp) {
          event.preventDefault();
          setState(prev => ({ ...prev, showHelp: false }));
          return;
        }
      }

      // Don't process other keys when in input elements
      if (isInputElement) return;

      // Handle ? for help (Shift + /)
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        toggleHelp();
        return;
      }

      // If help is showing, any key closes it
      if (state.showHelp && event.key !== 'Tab') {
        event.preventDefault();
        setState(prev => ({ ...prev, showHelp: false }));
        return;
      }

      // Arrow keys for navigation
      if (event.key === 'ArrowUp' || event.key === 'k') {
        event.preventDefault();
        if (!state.isActive) {
          activate();
        } else {
          navigateUp();
        }
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'j') {
        event.preventDefault();
        if (!state.isActive) {
          activate();
        } else {
          navigateDown();
        }
        return;
      }

      // Enter to toggle verification
      if (event.key === 'Enter' && state.isActive && !state.isEditing) {
        event.preventDefault();
        toggleVerify();
        return;
      }

      // E to edit
      if ((event.key === 'e' || event.key === 'E') && state.isActive && !state.isEditing) {
        event.preventDefault();
        startEdit();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    state.isActive,
    state.isEditing,
    state.showHelp,
    activate,
    navigateUp,
    navigateDown,
    toggleVerify,
    startEdit,
    cancelEdit,
    toggleHelp,
  ]);

  const actions: KeyboardNavigationActions = {
    navigateUp,
    navigateDown,
    toggleVerify,
    startEdit,
    cancelEdit,
    toggleHelp,
    setFocus,
    activate,
    deactivate,
    setIsEditing,
  };

  return [state, actions];
}
