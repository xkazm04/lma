'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { CategoryWithTerms } from './types';

interface UseTermsKeyboardNavOptions {
  categories: CategoryWithTerms[];
  expandedCategories: string[];
  selectedTerm: string | null;
  onSelectTerm: (termId: string | null) => void;
  onExpandCategory: (categoryId: string) => void;
  onCollapseCategory: (categoryId: string) => void;
  onOpenTermDetail?: (termId: string) => void;
}

interface FlattenedTerm {
  termId: string;
  categoryId: string;
  categoryIndex: number;
  termIndex: number;
}

export function useTermsKeyboardNav({
  categories,
  expandedCategories,
  selectedTerm,
  onSelectTerm,
  onExpandCategory,
  onCollapseCategory,
  onOpenTermDetail,
}: UseTermsKeyboardNavOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedCategoryRef = useRef<string | null>(null);

  // Create a flat list of all visible terms for navigation
  const flattenedTerms = useMemo((): FlattenedTerm[] => {
    const result: FlattenedTerm[] = [];
    categories.forEach((category, categoryIndex) => {
      if (expandedCategories.includes(category.id)) {
        category.terms.forEach((term, termIndex) => {
          result.push({
            termId: term.id,
            categoryId: category.id,
            categoryIndex,
            termIndex,
          });
        });
      }
    });
    return result;
  }, [categories, expandedCategories]);

  // Find current position in flattened list
  const currentIndex = useMemo(() => {
    if (!selectedTerm) return -1;
    return flattenedTerms.findIndex((t) => t.termId === selectedTerm);
  }, [flattenedTerms, selectedTerm]);

  // Get category indices for Tab navigation
  const categoryIndices = useMemo(() => {
    return categories.map((category) => ({
      categoryId: category.id,
      firstTermIndex: flattenedTerms.findIndex((t) => t.categoryId === category.id),
      isExpanded: expandedCategories.includes(category.id),
    }));
  }, [categories, flattenedTerms, expandedCategories]);

  const navigateToPreviousTerm = useCallback(() => {
    if (flattenedTerms.length === 0) return;

    if (currentIndex <= 0) {
      // Wrap to last term or select first if none selected
      const newIndex = currentIndex < 0 ? 0 : flattenedTerms.length - 1;
      onSelectTerm(flattenedTerms[newIndex].termId);
    } else {
      onSelectTerm(flattenedTerms[currentIndex - 1].termId);
    }
  }, [flattenedTerms, currentIndex, onSelectTerm]);

  const navigateToNextTerm = useCallback(() => {
    if (flattenedTerms.length === 0) return;

    if (currentIndex < 0 || currentIndex >= flattenedTerms.length - 1) {
      // Wrap to first term or select first if none selected
      const newIndex = currentIndex < 0 ? 0 : 0;
      onSelectTerm(flattenedTerms[newIndex].termId);
    } else {
      onSelectTerm(flattenedTerms[currentIndex + 1].termId);
    }
  }, [flattenedTerms, currentIndex, onSelectTerm]);

  const navigateToNextCategory = useCallback(() => {
    if (categories.length === 0) return;

    // Find current category
    let currentCategoryIndex = -1;
    if (selectedTerm) {
      const currentTerm = flattenedTerms.find((t) => t.termId === selectedTerm);
      if (currentTerm) {
        currentCategoryIndex = currentTerm.categoryIndex;
      }
    }
    if (currentCategoryIndex === -1 && focusedCategoryRef.current) {
      currentCategoryIndex = categories.findIndex((c) => c.id === focusedCategoryRef.current);
    }

    // Move to next category
    const nextCategoryIndex = (currentCategoryIndex + 1) % categories.length;
    const nextCategory = categories[nextCategoryIndex];
    focusedCategoryRef.current = nextCategory.id;

    // If category is expanded and has terms, select first term
    if (expandedCategories.includes(nextCategory.id) && nextCategory.terms.length > 0) {
      onSelectTerm(nextCategory.terms[0].id);
    } else {
      // Focus category header (expand it)
      onExpandCategory(nextCategory.id);
      if (nextCategory.terms.length > 0) {
        onSelectTerm(nextCategory.terms[0].id);
      }
    }
  }, [categories, expandedCategories, flattenedTerms, selectedTerm, onSelectTerm, onExpandCategory]);

  const navigateToPreviousCategory = useCallback(() => {
    if (categories.length === 0) return;

    // Find current category
    let currentCategoryIndex = -1;
    if (selectedTerm) {
      const currentTerm = flattenedTerms.find((t) => t.termId === selectedTerm);
      if (currentTerm) {
        currentCategoryIndex = currentTerm.categoryIndex;
      }
    }
    if (currentCategoryIndex === -1 && focusedCategoryRef.current) {
      currentCategoryIndex = categories.findIndex((c) => c.id === focusedCategoryRef.current);
    }

    // Move to previous category
    const prevCategoryIndex = currentCategoryIndex <= 0 ? categories.length - 1 : currentCategoryIndex - 1;
    const prevCategory = categories[prevCategoryIndex];
    focusedCategoryRef.current = prevCategory.id;

    // If category is expanded and has terms, select first term
    if (expandedCategories.includes(prevCategory.id) && prevCategory.terms.length > 0) {
      onSelectTerm(prevCategory.terms[0].id);
    } else {
      // Focus category header (expand it)
      onExpandCategory(prevCategory.id);
      if (prevCategory.terms.length > 0) {
        onSelectTerm(prevCategory.terms[0].id);
      }
    }
  }, [categories, expandedCategories, flattenedTerms, selectedTerm, onSelectTerm, onExpandCategory]);

  const toggleCurrentCategory = useCallback(() => {
    if (!selectedTerm) return;

    const currentTerm = flattenedTerms.find((t) => t.termId === selectedTerm);
    if (!currentTerm) return;

    const categoryId = currentTerm.categoryId;
    if (expandedCategories.includes(categoryId)) {
      onCollapseCategory(categoryId);
    } else {
      onExpandCategory(categoryId);
    }
  }, [flattenedTerms, selectedTerm, expandedCategories, onExpandCategory, onCollapseCategory]);

  const openCurrentTermDetail = useCallback(() => {
    if (selectedTerm && onOpenTermDetail) {
      onOpenTermDetail(selectedTerm);
    }
  }, [selectedTerm, onOpenTermDetail]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle keyboard when focus is within the terms container or document body
    const target = event.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (isInputElement) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        navigateToPreviousTerm();
        break;
      case 'ArrowDown':
        event.preventDefault();
        navigateToNextTerm();
        break;
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          navigateToPreviousCategory();
        } else {
          navigateToNextCategory();
        }
        break;
      case 'Enter':
        event.preventDefault();
        openCurrentTermDetail();
        break;
      case 'ArrowLeft':
        // Collapse current category
        event.preventDefault();
        toggleCurrentCategory();
        break;
      case 'ArrowRight':
        // Expand current category
        event.preventDefault();
        toggleCurrentCategory();
        break;
      case 'Escape':
        // Clear selection
        event.preventDefault();
        onSelectTerm(null);
        focusedCategoryRef.current = null;
        break;
      case 'Home':
        // Go to first term
        event.preventDefault();
        if (flattenedTerms.length > 0) {
          onSelectTerm(flattenedTerms[0].termId);
        }
        break;
      case 'End':
        // Go to last term
        event.preventDefault();
        if (flattenedTerms.length > 0) {
          onSelectTerm(flattenedTerms[flattenedTerms.length - 1].termId);
        }
        break;
    }
  }, [
    navigateToPreviousTerm,
    navigateToNextTerm,
    navigateToPreviousCategory,
    navigateToNextCategory,
    openCurrentTermDetail,
    toggleCurrentCategory,
    onSelectTerm,
    flattenedTerms,
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Scroll selected term into view
  useEffect(() => {
    if (selectedTerm) {
      const element = document.querySelector(`[data-term-id="${selectedTerm}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedTerm]);

  return {
    containerRef,
    flattenedTerms,
    currentIndex,
    navigateToPreviousTerm,
    navigateToNextTerm,
    navigateToPreviousCategory,
    navigateToNextCategory,
    openCurrentTermDetail,
  };
}
