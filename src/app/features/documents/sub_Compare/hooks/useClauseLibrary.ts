// ============================================
// Clause Library Store and Hook
// ============================================

import { create } from 'zustand';
import { useMemo, useCallback } from 'react';
import type {
  ClauseTemplate,
  ClauseVariant,
  ClauseLibraryFilters,
  ClauseLibraryConfig,
  ClauseCategory,
  ClauseFavor,
  ClauseSource,
  ChangeClauseMatch,
  ClauseMatchResult,
  MatchStrength,
} from '../lib/clause-library-types';
import {
  DEFAULT_CLAUSE_FILTERS,
  DEFAULT_CLAUSE_LIBRARY_CONFIG,
} from '../lib/clause-library-types';
import {
  mockClauseTemplates,
  mockClauseVariants,
  getClauseById,
  getClauseVariants,
  calculateTextSimilarity,
  findMatchingClauses,
} from '../lib/clause-library-mock-data';

// ============================================
// Store Interface
// ============================================

interface ClauseLibraryState {
  // Data
  clauses: ClauseTemplate[];
  variants: ClauseVariant[];

  // UI State
  config: ClauseLibraryConfig;
  filters: ClauseLibraryFilters;
  selectedClauseId: string | null;
  expandedCategories: ClauseCategory[];

  // Matching State
  changeMatches: Map<string, ChangeClauseMatch>;
  isMatching: boolean;

  // Drag and Drop State
  draggingClauseId: string | null;
  dropTargetChangeId: string | null;

  // Actions
  setConfig: (config: Partial<ClauseLibraryConfig>) => void;
  setFilters: (filters: Partial<ClauseLibraryFilters>) => void;
  clearFilters: () => void;
  selectClause: (clauseId: string | null) => void;
  toggleCategory: (category: ClauseCategory) => void;
  setExpandedCategories: (categories: ClauseCategory[]) => void;
  togglePanel: () => void;

  // Matching Actions
  matchChanges: (changes: Array<{ changeId: string; text: string }>) => void;
  clearMatches: () => void;

  // Drag and Drop Actions
  startDragging: (clauseId: string) => void;
  stopDragging: () => void;
  setDropTarget: (changeId: string | null) => void;

  // Clause Actions
  insertClause: (clauseId: string, targetChangeId: string) => void;
}

// ============================================
// Store Implementation
// ============================================

export const useClauseLibraryStore = create<ClauseLibraryState>((set, get) => ({
  // Initial Data
  clauses: mockClauseTemplates,
  variants: mockClauseVariants,

  // Initial UI State
  config: DEFAULT_CLAUSE_LIBRARY_CONFIG,
  filters: DEFAULT_CLAUSE_FILTERS,
  selectedClauseId: null,
  expandedCategories: [],

  // Initial Matching State
  changeMatches: new Map(),
  isMatching: false,

  // Initial Drag State
  draggingClauseId: null,
  dropTargetChangeId: null,

  // Config Actions
  setConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig },
  })),

  // Filter Actions
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),

  clearFilters: () => set({ filters: DEFAULT_CLAUSE_FILTERS }),

  // Selection Actions
  selectClause: (clauseId) => set({ selectedClauseId: clauseId }),

  // Category Actions
  toggleCategory: (category) => set((state) => ({
    expandedCategories: state.expandedCategories.includes(category)
      ? state.expandedCategories.filter((c) => c !== category)
      : [...state.expandedCategories, category],
  })),

  setExpandedCategories: (categories) => set({ expandedCategories: categories }),

  // Panel Toggle
  togglePanel: () => set((state) => ({
    config: { ...state.config, showPanel: !state.config.showPanel },
  })),

  // Matching Actions
  matchChanges: (changes) => {
    set({ isMatching: true });

    const { config, clauses } = get();
    const matches = new Map<string, ChangeClauseMatch>();

    for (const change of changes) {
      const matchResult = matchTextToLibrary(change.text, clauses, config.matchThreshold);

      if (matchResult) {
        matches.set(change.changeId, {
          changeId: change.changeId,
          doc1Match: null, // Will be populated separately if needed
          doc2Match: matchResult,
          changeAnalysis: {
            direction: 'neutral_change',
            favorChange: { from: null, to: matchResult.matchedClause?.favor || null },
            summary: matchResult.analysis,
          },
        });
      }
    }

    set({ changeMatches: matches, isMatching: false });
  },

  clearMatches: () => set({ changeMatches: new Map() }),

  // Drag and Drop Actions
  startDragging: (clauseId) => set({ draggingClauseId: clauseId }),
  stopDragging: () => set({ draggingClauseId: null, dropTargetChangeId: null }),
  setDropTarget: (changeId) => set({ dropTargetChangeId: changeId }),

  // Insert Clause
  insertClause: (clauseId, targetChangeId) => {
    const clause = getClauseById(clauseId);
    if (!clause) return;

    // In a real implementation, this would integrate with the document editing system
    console.log(`Inserting clause ${clauseId} at change ${targetChangeId}`);

    // Reset drag state
    set({ draggingClauseId: null, dropTargetChangeId: null });
  },
}));

// ============================================
// Helper Functions
// ============================================

/**
 * Match text to the clause library
 */
function matchTextToLibrary(
  text: string,
  clauses: ClauseTemplate[],
  minSimilarity: number
): ClauseMatchResult | null {
  if (!text || text.trim().length < 20) return null;

  let bestMatch: { clause: ClauseTemplate; similarity: number } | null = null;

  for (const clause of clauses) {
    const similarity = calculateTextSimilarity(text, clause.text);
    if (similarity >= minSimilarity && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { clause, similarity };
    }
  }

  if (!bestMatch) return null;

  const matchStrength = getMatchStrength(bestMatch.similarity);

  return {
    matchedClause: bestMatch.clause,
    matchedVariant: null,
    matchStrength,
    similarityScore: bestMatch.similarity,
    documentText: text,
    differences: identifyDifferences(text, bestMatch.clause.text),
    isDeviation: matchStrength === 'deviation' || matchStrength === 'partial',
    analysis: generateMatchAnalysis(bestMatch.clause, bestMatch.similarity, matchStrength),
    suggestedAlternatives: findAlternatives(bestMatch.clause, clauses),
  };
}

/**
 * Convert similarity score to match strength
 */
function getMatchStrength(similarity: number): MatchStrength {
  if (similarity >= 0.95) return 'exact';
  if (similarity >= 0.8) return 'similar';
  if (similarity >= 0.6) return 'partial';
  if (similarity >= 0.4) return 'deviation';
  return 'none';
}

/**
 * Identify key differences between two texts
 */
function identifyDifferences(text1: string, text2: string): string[] {
  const differences: string[] = [];

  // Simple word-level comparison
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  // Find significant words in text1 not in text2
  const onlyInText1 = [...words1].filter(w => !words2.has(w) && w.length > 4);
  if (onlyInText1.length > 0) {
    differences.push(`Document contains: ${onlyInText1.slice(0, 3).join(', ')}`);
  }

  // Find significant words in text2 not in text1
  const onlyInText2 = [...words2].filter(w => !words1.has(w) && w.length > 4);
  if (onlyInText2.length > 0) {
    differences.push(`Standard includes: ${onlyInText2.slice(0, 3).join(', ')}`);
  }

  return differences;
}

/**
 * Generate analysis text for a match
 */
function generateMatchAnalysis(
  clause: ClauseTemplate,
  similarity: number,
  strength: MatchStrength
): string {
  const favorText = clause.favor === 'lender'
    ? 'lender-favorable'
    : clause.favor === 'borrower'
    ? 'borrower-favorable'
    : 'neutral';

  switch (strength) {
    case 'exact':
      return `This language matches the ${favorText} "${clause.name}" clause from ${clause.source.replace('_', ' ')} exactly.`;
    case 'similar':
      return `This language is substantially similar to the ${favorText} "${clause.name}" clause (${Math.round(similarity * 100)}% match).`;
    case 'partial':
      return `This language partially matches the ${favorText} "${clause.name}" clause with some deviations.`;
    case 'deviation':
      return `This language deviates significantly from the standard "${clause.name}" clause. Review recommended.`;
    default:
      return 'No matching clause found in the library.';
  }
}

/**
 * Find alternative clauses for a given clause
 */
function findAlternatives(clause: ClauseTemplate, allClauses: ClauseTemplate[]): ClauseTemplate[] {
  // Get explicitly linked alternatives
  const linkedAlternatives = (clause.alternativeClauseIds || [])
    .map(id => allClauses.find(c => c.id === id))
    .filter((c): c is ClauseTemplate => c !== undefined);

  // Find other clauses in the same category with different favor
  const sameCategoryDifferentFavor = allClauses.filter(
    c => c.category === clause.category && c.favor !== clause.favor && c.id !== clause.id
  );

  return [...linkedAlternatives, ...sameCategoryDifferentFavor].slice(0, 3);
}

// ============================================
// Custom Hook for Filtered Clauses
// ============================================

export interface UseClauseLibraryReturn {
  // State
  clauses: ClauseTemplate[];
  filteredClauses: ClauseTemplate[];
  clausesByCategory: Map<ClauseCategory, ClauseTemplate[]>;
  selectedClause: ClauseTemplate | null;
  config: ClauseLibraryConfig;
  filters: ClauseLibraryFilters;
  expandedCategories: ClauseCategory[];
  isMatching: boolean;
  draggingClauseId: string | null;

  // Getters
  getClause: (id: string) => ClauseTemplate | undefined;
  getVariants: (clauseId: string) => ClauseVariant[];
  getMatch: (changeId: string) => ChangeClauseMatch | undefined;
  hasMatch: (changeId: string) => boolean;

  // Actions
  setConfig: (config: Partial<ClauseLibraryConfig>) => void;
  setFilters: (filters: Partial<ClauseLibraryFilters>) => void;
  clearFilters: () => void;
  selectClause: (clauseId: string | null) => void;
  toggleCategory: (category: ClauseCategory) => void;
  togglePanel: () => void;
  matchChanges: (changes: Array<{ changeId: string; text: string }>) => void;
  clearMatches: () => void;
  startDragging: (clauseId: string) => void;
  stopDragging: () => void;
  setDropTarget: (changeId: string | null) => void;
  insertClause: (clauseId: string, targetChangeId: string) => void;
}

export function useClauseLibrary(): UseClauseLibraryReturn {
  const store = useClauseLibraryStore();

  // Filter clauses based on current filters
  const filteredClauses = useMemo(() => {
    let result = store.clauses;

    // Search query
    if (store.filters.searchQuery) {
      const query = store.filters.searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.text.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (store.filters.categories.length > 0) {
      result = result.filter(c => store.filters.categories.includes(c.category));
    }

    // Favor filter
    if (store.filters.favor.length > 0) {
      result = result.filter(c => store.filters.favor.includes(c.favor));
    }

    // Source filter
    if (store.filters.sources.length > 0) {
      result = result.filter(c => store.filters.sources.includes(c.source));
    }

    // Approved only
    if (store.filters.approvedOnly) {
      result = result.filter(c => c.isApproved);
    }

    // Tags filter
    if (store.filters.tags.length > 0) {
      result = result.filter(c =>
        store.filters.tags.some(t => c.tags.includes(t))
      );
    }

    return result;
  }, [store.clauses, store.filters]);

  // Group clauses by category
  const clausesByCategory = useMemo(() => {
    const map = new Map<ClauseCategory, ClauseTemplate[]>();

    for (const clause of filteredClauses) {
      const existing = map.get(clause.category) || [];
      map.set(clause.category, [...existing, clause]);
    }

    return map;
  }, [filteredClauses]);

  // Selected clause
  const selectedClause = useMemo(() => {
    if (!store.selectedClauseId) return null;
    return store.clauses.find(c => c.id === store.selectedClauseId) || null;
  }, [store.clauses, store.selectedClauseId]);

  // Getters
  const getClause = useCallback((id: string) => {
    return store.clauses.find(c => c.id === id);
  }, [store.clauses]);

  const getVariants = useCallback((clauseId: string) => {
    return store.variants.filter(v => v.parentClauseId === clauseId);
  }, [store.variants]);

  const getMatch = useCallback((changeId: string) => {
    return store.changeMatches.get(changeId);
  }, [store.changeMatches]);

  const hasMatch = useCallback((changeId: string) => {
    return store.changeMatches.has(changeId);
  }, [store.changeMatches]);

  return {
    // State
    clauses: store.clauses,
    filteredClauses,
    clausesByCategory,
    selectedClause,
    config: store.config,
    filters: store.filters,
    expandedCategories: store.expandedCategories,
    isMatching: store.isMatching,
    draggingClauseId: store.draggingClauseId,

    // Getters
    getClause,
    getVariants,
    getMatch,
    hasMatch,

    // Actions
    setConfig: store.setConfig,
    setFilters: store.setFilters,
    clearFilters: store.clearFilters,
    selectClause: store.selectClause,
    toggleCategory: store.toggleCategory,
    togglePanel: store.togglePanel,
    matchChanges: store.matchChanges,
    clearMatches: store.clearMatches,
    startDragging: store.startDragging,
    stopDragging: store.stopDragging,
    setDropTarget: store.setDropTarget,
    insertClause: store.insertClause,
  };
}
