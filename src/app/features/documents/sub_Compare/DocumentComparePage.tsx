
'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, GitCompare, ArrowRight, AlertTriangle, XCircle, MessageSquare, Files, FileText, Sparkles, History, Target, Loader2, Check, Undo2, Download, Library, Keyboard, FileStack, Network } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DemoCard } from '@/lib/demo-guide';
import {
  ComparisonCategorySection,
  ComparisonStats,
  ComparisonFilters,
  AnnotationPanel,
  AnnotationPanelBackdrop,
  AmendmentDraftModal,
  ComparisonHistoryTimeline,
  ComparisonDiffView,
  HistoryEntryEditModal,
  RiskScoreSummary,
  CompactRiskSummary,
  MarketBenchmarkSection,
  ExportModal,
  ClauseLibraryPanel,
  ClauseMatchBadge,
  ShortcutReferenceCard,
  ShortcutHint,
  FloatingNavigationHint,
  PDFComparisonPanel,
} from './components';
import { DocumentSelector, type DocumentOption } from './components/DocumentSelector';
import { isValidDocumentPair } from './lib/validation';
import { useComparisonFilters, DEFAULT_UNIFIED_FILTERS } from './hooks/useComparisonFilters';
import { useAnnotations, useComparisonHistory, useClauseLibrary, useKeyboardShortcuts, usePDFOverlay } from './hooks';
import { createChangeId } from './lib/mock-data';
import { mockComparisonResult, mockDocuments } from '../lib';
import { generateMockRiskAnalysis } from '@/lib/llm/risk-scoring';
import type { ComparisonResult } from '@/types';
import type { ComparisonChange, ComparisonRiskAnalysis, ChangeRiskScore, ChangeMarketBenchmark, CategoryRiskSummary } from '../lib/types';
import type { ReviewStatus, Mention } from './lib/types';
import type { AmendmentDraft } from './lib/amendment-types';
import type { ComparisonHistoryEntryWithDetails } from './lib/history-types';

function DocumentComparePageContent() {
  const searchParams = useSearchParams();
  const [doc1, setDoc1] = useState<string>('');
  const [doc2, setDoc2] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bulk compare state
  const [bulkDocs, setBulkDocs] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    summary: string;
    commonFields: { field: string; values: { docId: string; docName: string; value: string }[] }[];
    differences: { field: string; variations: { docId: string; docName: string; value: string }[] }[];
  } | null>(null);

  // Initialize from URL query params for bulk compare
  useEffect(() => {
    const docs = searchParams.getAll('docs');
    if (docs.length >= 2) {
      setBulkDocs(docs);
      setIsBulkMode(true);
    } else if (docs.length === 2) {
      setDoc1(docs[0]);
      setDoc2(docs[1]);
      setIsBulkMode(false);
    }
  }, [searchParams]);

  // Annotation state
  const [annotationPanelOpen, setAnnotationPanelOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<{ change: ComparisonChange; changeId: string; categoryName: string } | null>(null);

  // Amendment draft state
  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);
  const [amendmentDraft, setAmendmentDraft] = useState<AmendmentDraft | null>(null);
  const [isGeneratingAmendment, setIsGeneratingAmendment] = useState(false);
  const [amendmentError, setAmendmentError] = useState<string | null>(null);

  // AI Risk Analysis state
  const [riskAnalysis, setRiskAnalysis] = useState<ComparisonRiskAnalysis | null>(null);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);
  const [showRiskDetails, setShowRiskDetails] = useState(true);

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Memoized lens data providers for filtering
  const lensProviders = useMemo(() => ({
    getRiskScore: (changeId: string) => riskAnalysis?.changeScores.find((s) => s.changeId === changeId),
    getMarketBenchmark: (changeId: string) => riskAnalysis?.marketBenchmarks.find((b) => b.changeId === changeId),
  }), [riskAnalysis]);

  // Unified comparison filters hook
  const {
    filters,
    setFilters,
    clearFilters,
    filterCategories,
    hasActiveFilters,
    hasActiveLensFilters,
  } = useComparisonFilters({ providers: lensProviders });

  // Annotations hook
  const {
    annotations,
    getAnnotation,
    createAnnotation,
    updateReviewStatus,
    addComment,
    editComment,
    deleteComment,
    users,
    currentUserId,
    summary: annotationSummary,
  } = useAnnotations();

  // Comparison history hook
  const {
    entries: historyEntries,
    isLoading: isLoadingHistory,
    loadHistory,
    saveComparison,
    updateEntry: updateHistoryEntry,
    deleteEntry: deleteHistoryEntry,
    compareEntries,
    comparisonDiff,
    isComparingEntries,
    clearComparisonDiff,
  } = useComparisonHistory({
    document1Id: doc1 || undefined,
    document2Id: doc2 || undefined,
    autoLoad: false,
  });

  // Clause Library hook
  const {
    config: clauseLibraryConfig,
    getMatch: getClauseMatch,
    hasMatch: hasClauseMatch,
    togglePanel: toggleClauseLibrary,
    matchChanges,
    insertClause,
    setDropTarget,
    draggingClauseId,
  } = useClauseLibrary();

  // PDF Overlay hook
  const {
    isOpen: isPDFOverlayOpen,
    openOverlay: openPDFOverlay,
    closeOverlay: closePDFOverlay,
    toggleOverlay: togglePDFOverlay,
    doc1Info,
    doc2Info,
    changeRegions,
    focusedChangeId: pdfFocusedChangeId,
    setFocusedChangeId: setPDFFocusedChangeId,
    navigateToChange: navigateToPDFChange,
  } = usePDFOverlay({
    doc1Id: doc1,
    doc2Id: doc2,
    comparisonResult: result,
  });

  // Keyboard navigation state
  const [focusedChangeIndex, setFocusedChangeIndex] = useState(-1);
  const [allCategoriesExpanded, setAllCategoriesExpanded] = useState(true);

  // History UI state
  const [showHistory, setShowHistory] = useState(false);
  const [editingHistoryEntry, setEditingHistoryEntry] = useState<ComparisonHistoryEntryWithDetails | null>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<ComparisonHistoryEntryWithDetails | null>(null);
  const [diffEntry1, setDiffEntry1] = useState<ComparisonHistoryEntryWithDetails | null>(null);
  const [diffEntry2, setDiffEntry2] = useState<ComparisonHistoryEntryWithDetails | null>(null);

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'undone'>('idle');
  const [lastSavedEntryId, setLastSavedEntryId] = useState<string | null>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);

  // Load history when documents are selected
  useEffect(() => {
    if (doc1 && doc2) {
      loadHistory();
    }
  }, [doc1, doc2, loadHistory]);

  // Document options for selector - include all documents from mockDocuments
  // Filter to completed/review_required status since only processed documents can be compared
  const documentOptions: DocumentOption[] = useMemo(() => {
    return mockDocuments
      .filter((doc) => doc.processing_status === 'completed' || doc.processing_status === 'review_required')
      .map((doc) => ({
        id: doc.id,
        name: doc.original_filename,
      }));
  }, []);

  // Apply unified filtering
  const { filteredCategories, totalChangesCount, filteredChangesCount } = useMemo(() => {
    if (!result) {
      return { filteredCategories: [], totalChangesCount: 0, filteredChangesCount: 0 };
    }

    const filterResult = filterCategories(result.differences as any);

    return {
      filteredCategories: filterResult.filteredCategories,
      totalChangesCount: filterResult.totalChangesCount,
      filteredChangesCount: filterResult.filteredChangesCount,
    };
  }, [result, filterCategories]);

  // Create flat list of all changes for keyboard navigation
  const allChanges = useMemo(() => {
    if (!result) return [];
    const changes: { change: ComparisonChange; changeId: string; categoryName: string }[] = [];
    filteredCategories.forEach((category) => {
      category.changes?.forEach((change) => {
        const changeId = createChangeId(category.category, change.field);
        changes.push({ change, changeId, categoryName: category.category });
      });
    });
    return changes;
  }, [result, filteredCategories]);

  // Handle viewing history from toast action - opens panel and scrolls to entry
  const handleViewInHistory = useCallback((entryId: string) => {
    setShowHistory(true);
    // Give the panel time to render, then scroll to the entry
    setTimeout(() => {
      const entryElement = document.querySelector(`[data-history-entry-id="${entryId}"]`);
      if (entryElement) {
        entryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        entryElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        setTimeout(() => {
          entryElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 2000);
      }
    }, 150);
  }, []);

  // Undo auto-save
  const handleUndoAutoSave = useCallback(async () => {
    if (!lastSavedEntryId) return;

    const success = await deleteHistoryEntry(lastSavedEntryId);
    if (success) {
      setAutoSaveStatus('undone');
      setLastSavedEntryId(null);
      toast({
        title: 'Comparison removed from history',
        variant: 'default',
      });
    }
  }, [lastSavedEntryId, deleteHistoryEntry]);

  // Auto-save comparison when it completes
  const autoSaveComparison = useCallback(async (comparisonResult: ComparisonResult) => {
    if (!doc1 || !doc2) return;

    setAutoSaveStatus('saving');
    const entryId = await saveComparison(doc1, doc2, comparisonResult);

    if (entryId) {
      setAutoSaveStatus('saved');
      setLastSavedEntryId(entryId);

      // Show success toast with View action
      toast({
        title: 'Comparison saved',
        description: 'Your comparison has been automatically saved to history.',
        variant: 'success',
        action: (
          <ToastAction
            altText="View in history"
            onClick={() => handleViewInHistory(entryId)}
            data-testid="toast-view-history-btn"
          >
            View
          </ToastAction>
        ),
      });
    } else {
      setAutoSaveStatus('idle');
    }
  }, [doc1, doc2, saveComparison, handleViewInHistory]);

  const handleCompare = useCallback(async () => {
    // Clear any previous error and risk analysis
    setError(null);
    setRiskAnalysis(null);
    setAutoSaveStatus('idle');
    setLastSavedEntryId(null);

    if (!doc1 || !doc2) return;

    // Validate using shared helper
    if (!isValidDocumentPair(doc1, doc2)) {
      setError('Cannot compare a document with itself. Please select two different documents.');
      return;
    }

    setIsComparing(true);
    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock 10% chance of failure for demo
      if (Math.random() < 0.1) {
        throw new Error('Comparison service temporarily unavailable');
      }

      setResult(mockComparisonResult);

      // Auto-save the comparison to history
      autoSaveComparison(mockComparisonResult);

      // Automatically run risk analysis after comparison completes
      setIsAnalyzingRisk(true);
      try {
        // Use mock analysis for demo (in production, this would call generateRiskAnalysis)
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate AI processing
        const analysis = generateMockRiskAnalysis(mockComparisonResult);
        setRiskAnalysis(analysis);
      } catch (riskErr) {
        console.error('Risk analysis failed:', riskErr);
        // Don't block the comparison if risk analysis fails
      } finally {
        setIsAnalyzingRisk(false);
      }

      // Run clause matching for document changes
      const changesToMatch = mockComparisonResult.differences.map((diff) => ({
        changeId: `${diff.category}-${diff.field}`.toLowerCase().replace(/\s+/g, '-'),
        text: String(diff.document2Value || diff.document1Value || ''),
      }));
      matchChanges(changesToMatch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during comparison');
      setResult(null);
    } finally {
      setIsComparing(false);
    }
  }, [doc1, doc2, autoSaveComparison, matchChanges]);

  // Handle bulk compare
  const handleBulkCompare = useCallback(async () => {
    if (bulkDocs.length < 2) return;

    setIsComparing(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Get document names for display
      const docsWithNames = bulkDocs.map((docId) => {
        const doc = mockDocuments.find((d) => d.id === docId);
        return {
          docId,
          docName: doc?.original_filename || `Document ${docId}`,
        };
      });

      // Mock bulk comparison result
      const mockBulkResult = {
        summary: `AI analysis of ${bulkDocs.length} documents reveals significant variations in key financial terms and covenants. The documents share common borrower and lender parties but differ in commitment amounts, interest rate margins, and maturity dates.`,
        commonFields: [
          {
            field: 'Borrower',
            values: docsWithNames.map((d) => ({
              ...d,
              value: 'Apollo Credit Fund, LP',
            })),
          },
          {
            field: 'Administrative Agent',
            values: docsWithNames.map((d) => ({
              ...d,
              value: 'Wells Fargo Bank, N.A.',
            })),
          },
          {
            field: 'Governing Law',
            values: docsWithNames.map((d) => ({
              ...d,
              value: 'New York',
            })),
          },
        ],
        differences: [
          {
            field: 'Total Commitments',
            variations: docsWithNames.map((d, i) => ({
              ...d,
              value: `$${(450 + i * 50).toLocaleString()},000,000`,
            })),
          },
          {
            field: 'Initial Margin',
            variations: docsWithNames.map((d, i) => ({
              ...d,
              value: `${3.25 - i * 0.25}%`,
            })),
          },
          {
            field: 'Maturity Date',
            variations: docsWithNames.map((d, i) => ({
              ...d,
              value: `December 31, ${2025 + i}`,
            })),
          },
          {
            field: 'Leverage Ratio Covenant',
            variations: docsWithNames.map((d, i) => ({
              ...d,
              value: `${3.5 + i * 0.25}:1.00`,
            })),
          },
        ],
      };

      setBulkResult(mockBulkResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during bulk comparison');
      setBulkResult(null);
    } finally {
      setIsComparing(false);
    }
  }, [bulkDocs]);

  // Get document name helper
  const getDocName = useCallback((docId: string) => {
    const doc = mockDocuments.find((d) => d.id === docId);
    return doc?.original_filename || `Document ${docId}`;
  }, []);

  // Handle annotation click - opens the panel for the selected change
  // Note: 'change' param here comes from ComparisonCategorySection click
  // We accept ANY shape and map it to ComparisonChange
  const handleAnnotationClick = useCallback((change: any, changeId: string, categoryName: string) => {
    // Create annotation if it doesn't exist
    createAnnotation(changeId, categoryName);

    // Map to ComparisonChange interface expected by AnnotationPanel
    const mappedChange: ComparisonChange = {
      field: change.field || '',
      doc1Value: change.document1Value as string || change.doc1Value || null,
      doc2Value: change.document2Value as string || change.doc2Value || null,
      changeType: change.changeType,
      impact: change.impact || ''
    };

    setSelectedChange({ change: mappedChange, changeId, categoryName });
    setAnnotationPanelOpen(true);
  }, [createAnnotation]);

  // Handle review status change
  const handleStatusChange = useCallback((status: ReviewStatus) => {
    if (selectedChange) {
      updateReviewStatus(selectedChange.changeId, status);
    }
  }, [selectedChange, updateReviewStatus]);

  // Handle add comment
  const handleAddComment = useCallback((content: string, mentions: Mention[]) => {
    if (selectedChange) {
      addComment(selectedChange.changeId, content, mentions);
    }
  }, [selectedChange, addComment]);

  // Handle edit comment
  const handleEditComment = useCallback((commentId: string, newContent: string, mentions: Mention[]) => {
    if (selectedChange) {
      editComment(selectedChange.changeId, commentId, newContent, mentions);
    }
  }, [selectedChange, editComment]);

  // Handle delete comment
  const handleDeleteComment = useCallback((commentId: string) => {
    if (selectedChange) {
      deleteComment(selectedChange.changeId, commentId);
    }
  }, [selectedChange, deleteComment]);

  // Close annotation panel
  const handleClosePanel = useCallback(() => {
    setAnnotationPanelOpen(false);
    setSelectedChange(null);
  }, []);

  // Generate amendment draft
  const handleGenerateAmendment = useCallback(async () => {
    if (!result) return;

    setAmendmentModalOpen(true);
    setIsGeneratingAmendment(true);
    setAmendmentError(null);
    setAmendmentDraft(null);

    try {
      const response = await fetch('/api/documents/amendment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comparisonResult: result,
          options: {
            includeRecitals: true,
            includeGeneralProvisions: true,
            amendmentNumber: 'First',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to generate amendment');
      }

      setAmendmentDraft(data.draft);
    } catch (err) {
      setAmendmentError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGeneratingAmendment(false);
    }
  }, [result]);

  // Close amendment modal
  const handleCloseAmendmentModal = useCallback(() => {
    setAmendmentModalOpen(false);
    // Keep draft in state for potential re-opening
  }, []);

  // View a history entry
  const handleViewHistoryEntry = useCallback((entry: ComparisonHistoryEntryWithDetails) => {
    setSelectedHistoryEntry(entry);
    // Reconstruct the ComparisonResult from the history entry
    const historicalResult: ComparisonResult = {
      document1: entry.document1,
      document2: entry.document2,
      differences: entry.differences,
      impactAnalysis: entry.impactAnalysis,
    };
    setResult(historicalResult);
  }, []);

  // Compare two history entries
  const handleCompareHistoryEntries = useCallback(async (entry1: ComparisonHistoryEntryWithDetails, entry2: ComparisonHistoryEntryWithDetails) => {
    setDiffEntry1(entry1);
    setDiffEntry2(entry2);
    await compareEntries(entry1.id, entry2.id);
  }, [compareEntries]);

  // Close diff view
  const handleCloseDiffView = useCallback(() => {
    setDiffEntry1(null);
    setDiffEntry2(null);
    clearComparisonDiff();
  }, [clearComparisonDiff]);

  // Edit history entry
  const handleEditHistoryEntry = useCallback((entry: ComparisonHistoryEntryWithDetails) => {
    setEditingHistoryEntry(entry);
  }, []);

  // Save history entry edits
  const handleSaveHistoryEntryEdit = useCallback(async (id: string, label: string, notes: string) => {
    await updateHistoryEntry(id, label, notes);
    setEditingHistoryEntry(null);
  }, [updateHistoryEntry]);

  // Delete history entry
  const handleDeleteHistoryEntry = useCallback(async (entry: ComparisonHistoryEntryWithDetails) => {
    if (confirm('Are you sure you want to delete this comparison history entry?')) {
      await deleteHistoryEntry(entry.id);
    }
  }, [deleteHistoryEntry]);

  // Risk score helper functions
  const getRiskScore = useCallback((changeId: string): ChangeRiskScore | undefined => {
    return riskAnalysis?.changeScores.find((score) => score.changeId === changeId);
  }, [riskAnalysis]);

  const getMarketBenchmark = useCallback((changeId: string): ChangeMarketBenchmark | undefined => {
    return riskAnalysis?.marketBenchmarks.find((benchmark) => benchmark.changeId === changeId);
  }, [riskAnalysis]);

  const getCategorySummary = useCallback((categoryName: string): CategoryRiskSummary | undefined => {
    return riskAnalysis?.summary.categorySummaries.find((cat) => cat.category === categoryName);
  }, [riskAnalysis]);

  // ============================================
  // Keyboard Shortcuts Handlers
  // ============================================

  // Navigate to a change by index - scroll into view and highlight
  const navigateToChange = useCallback((index: number) => {
    if (index >= 0 && index < allChanges.length) {
      const change = allChanges[index];
      setFocusedChangeIndex(index);
      // Scroll to the change element
      const element = document.querySelector(`[data-testid="change-item-${change.changeId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add focus highlight
        element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2');
        }, 1500);
      }
    }
  }, [allChanges]);

  // Handle next change navigation
  const handleNextChange = useCallback(() => {
    const nextIndex = focusedChangeIndex < allChanges.length - 1 ? focusedChangeIndex + 1 : 0;
    navigateToChange(nextIndex);
  }, [focusedChangeIndex, allChanges.length, navigateToChange]);

  // Handle previous change navigation
  const handlePreviousChange = useCallback(() => {
    const prevIndex = focusedChangeIndex > 0 ? focusedChangeIndex - 1 : allChanges.length - 1;
    navigateToChange(prevIndex);
  }, [focusedChangeIndex, allChanges.length, navigateToChange]);

  // Open review status for focused change
  const handleOpenReviewStatusShortcut = useCallback(() => {
    if (focusedChangeIndex >= 0 && focusedChangeIndex < allChanges.length) {
      const change = allChanges[focusedChangeIndex];
      // Trigger click on the review status dropdown
      const element = document.querySelector(`[data-testid="change-item-${change.changeId}"] [data-testid="review-status-dropdown-trigger"]`);
      if (element instanceof HTMLElement) {
        element.click();
      }
    }
  }, [focusedChangeIndex, allChanges]);

  // Open annotation panel for focused change
  const handleOpenAnnotationShortcut = useCallback(() => {
    if (focusedChangeIndex >= 0 && focusedChangeIndex < allChanges.length) {
      const change = allChanges[focusedChangeIndex];
      handleAnnotationClick(change.change, change.changeId, change.categoryName);
    }
  }, [focusedChangeIndex, allChanges, handleAnnotationClick]);

  // Toggle severity filter - show high/critical changes
  const handleToggleSeverityFilter = useCallback(() => {
    if (filters.riskLevels.includes('high') || filters.riskLevels.includes('critical')) {
      // Clear risk level filters
      setFilters({ ...filters, riskLevels: [] });
    } else {
      // Enable high and critical filters
      setFilters({ ...filters, riskLevels: ['high', 'critical'] });
    }
  }, [filters, setFilters]);

  // Close all open panels
  const handleClosePanelShortcut = useCallback(() => {
    if (annotationPanelOpen) {
      handleClosePanel();
    } else if (amendmentModalOpen) {
      handleCloseAmendmentModal();
    } else if (exportModalOpen) {
      setExportModalOpen(false);
    }
  }, [annotationPanelOpen, amendmentModalOpen, exportModalOpen, handleClosePanel, handleCloseAmendmentModal]);

  // Toggle expand/collapse all categories
  const handleToggleExpandAll = useCallback(() => {
    setAllCategoriesExpanded((prev) => !prev);
    // Note: Individual category expansion is managed within ComparisonCategorySection
    // This state could be passed down to control all categories
  }, []);

  // Jump to next unreviewed change
  const handleNextUnreviewed = useCallback(() => {
    const nextUnreviewedIndex = allChanges.findIndex((change, idx) => {
      if (idx <= focusedChangeIndex) return false;
      const annotation = getAnnotation(change.changeId);
      return !annotation || annotation.reviewStatus === 'pending';
    });

    if (nextUnreviewedIndex >= 0) {
      navigateToChange(nextUnreviewedIndex);
    } else {
      // Wrap around to start
      const firstUnreviewedIndex = allChanges.findIndex((change) => {
        const annotation = getAnnotation(change.changeId);
        return !annotation || annotation.reviewStatus === 'pending';
      });
      if (firstUnreviewedIndex >= 0) {
        navigateToChange(firstUnreviewedIndex);
      }
    }
  }, [allChanges, focusedChangeIndex, getAnnotation, navigateToChange]);

  // Mark current change as reviewed
  const handleApproveChange = useCallback(() => {
    if (focusedChangeIndex >= 0 && focusedChangeIndex < allChanges.length) {
      const change = allChanges[focusedChangeIndex];
      updateReviewStatus(change.changeId, 'reviewed');
      // Show toast notification
      toast({
        title: 'Change approved',
        description: `"${change.change.field}" marked as reviewed`,
        variant: 'success',
      });
      // Auto-advance to next change
      handleNextChange();
    }
  }, [focusedChangeIndex, allChanges, updateReviewStatus, handleNextChange]);

  // Flag current change for discussion
  const handleFlagChange = useCallback(() => {
    if (focusedChangeIndex >= 0 && focusedChangeIndex < allChanges.length) {
      const change = allChanges[focusedChangeIndex];
      updateReviewStatus(change.changeId, 'flagged');
      toast({
        title: 'Change flagged',
        description: `"${change.change.field}" flagged for discussion`,
        variant: 'default',
      });
    }
  }, [focusedChangeIndex, allChanges, updateReviewStatus]);

  // Check if any modal is open
  const isAnyModalOpen = amendmentModalOpen || exportModalOpen || editingHistoryEntry !== null;

  // Toggle filter by change type
  const handleFilterByChangeType = useCallback((type: 'added' | 'modified' | 'removed') => {
    const newTypes = filters.changeTypes.includes(type)
      ? filters.changeTypes.filter((t) => t !== type)
      : [...filters.changeTypes, type];
    setFilters({ ...filters, changeTypes: newTypes });
  }, [filters, setFilters]);

  // Keyboard shortcuts hook
  const {
    isReferenceOpen,
    toggleReference,
    closeReference,
    shortcuts,
    getShortcutsByCategory,
    config: shortcutConfig,
    getShortcutHint,
  } = useKeyboardShortcuts({
    onNextChange: handleNextChange,
    onPreviousChange: handlePreviousChange,
    onOpenReviewStatus: handleOpenReviewStatusShortcut,
    onOpenAnnotation: handleOpenAnnotationShortcut,
    onToggleSeverityFilter: handleToggleSeverityFilter,
    onClosePanel: handleClosePanelShortcut,
    onToggleExpandAll: handleToggleExpandAll,
    onNextUnreviewed: handleNextUnreviewed,
    onApproveChange: handleApproveChange,
    onFlagChange: handleFlagChange,
    onToggleHistory: () => setShowHistory((prev) => !prev),
    onToggleClauseLibrary: toggleClauseLibrary,
    onFilterByChangeType: handleFilterByChangeType,
    totalChanges: allChanges.length,
    currentChangeIndex: focusedChangeIndex,
    isAnnotationPanelOpen: annotationPanelOpen,
    isModalOpen: isAnyModalOpen,
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
        <Link href="/documents" data-testid="back-to-documents-link">
          <Button variant="ghost" size="icon" className="transition-transform hover:scale-110" data-testid="back-to-documents-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900">
            {isBulkMode ? 'Bulk Document Comparison' : 'Document Comparison'}
          </h1>
          <p className="text-zinc-500">
            {isBulkMode
              ? `Compare ${bulkDocs.length} documents simultaneously to identify variations`
              : 'Compare two documents to identify changes and differences'}
          </p>
        </div>
        {/* Cross-Reference Graph link */}
        <Link href="/documents/cross-reference" data-testid="cross-reference-link">
          <Button
            variant="outline"
            className="transition-transform hover:scale-105 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 hover:from-violet-700 hover:to-indigo-700"
            data-testid="cross-reference-btn"
          >
            <Network className="w-4 h-4 mr-2" />
            Cross-References
          </Button>
        </Link>

        {/* History toggle button */}
        {!isBulkMode && doc1 && doc2 && (
          <Button
            variant={showHistory ? 'default' : 'outline'}
            onClick={() => setShowHistory(!showHistory)}
            className="transition-transform hover:scale-105"
            data-testid="toggle-history-btn"
          >
            <History className="w-4 h-4 mr-2" />
            History
            {historyEntries.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-zinc-100 text-zinc-700">
                {historyEntries.length}
              </Badge>
            )}
            <ShortcutHint shortcutKey="H" show={shortcutConfig.showHints} />
          </Button>
        )}

        {/* PDF Overlay toggle button */}
        {!isBulkMode && result && (
          <Button
            variant={isPDFOverlayOpen ? 'default' : 'outline'}
            onClick={togglePDFOverlay}
            className="transition-transform hover:scale-105 bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 hover:from-blue-700 hover:to-cyan-700"
            data-testid="toggle-pdf-overlay-btn"
          >
            <FileStack className="w-4 h-4 mr-2" />
            View PDFs
            <ShortcutHint shortcutKey="P" show={shortcutConfig.showHints} />
          </Button>
        )}

        {/* Clause Library toggle button */}
        {!isBulkMode && result && (
          <Button
            variant={clauseLibraryConfig.showPanel ? 'default' : 'outline'}
            onClick={toggleClauseLibrary}
            className="transition-transform hover:scale-105 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 hover:from-indigo-700 hover:to-purple-700"
            data-testid="toggle-clause-library-btn"
          >
            <Library className="w-4 h-4 mr-2" />
            Clause Library
            <ShortcutHint shortcutKey="L" show={shortcutConfig.showHints} />
          </Button>
        )}

        {/* Keyboard shortcuts button */}
        {!isBulkMode && result && (
          <Button
            variant="outline"
            onClick={toggleReference}
            className="transition-transform hover:scale-105"
            data-testid="keyboard-shortcuts-btn"
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Shortcuts
            <ShortcutHint shortcutKey="?" show={shortcutConfig.showHints} />
          </Button>
        )}
      </div>

      {/* Bulk Compare Mode */}
      {isBulkMode && (
        <Card className="animate-in fade-in slide-in-from-top-2 duration-300" data-testid="bulk-compare-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Files className="w-5 h-5" />
              Bulk Comparison ({bulkDocs.length} Documents)
            </CardTitle>
            <CardDescription>
              AI will analyze all selected documents and highlight commonalities and differences across key terms, covenants, and dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Document list */}
              <div className="flex flex-wrap gap-2">
                {bulkDocs.map((docId, index) => (
                  <Badge
                    key={docId}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm"
                    data-testid={`bulk-doc-badge-${docId}`}
                  >
                    <span className="text-zinc-400 mr-2">{index + 1}.</span>
                    {getDocName(docId)}
                  </Badge>
                ))}
              </div>

              {/* Compare button */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleBulkCompare}
                  disabled={bulkDocs.length < 2 || isComparing}
                  className="transition-transform hover:scale-105"
                  data-testid="bulk-compare-btn"
                >
                  {isComparing ? (
                    <>
                      <span className="animate-spin mr-2">
                        <GitCompare className="w-4 h-4" />
                      </span>
                      Analyzing {bulkDocs.length} documents...
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-4 h-4 mr-2" />
                      Start Bulk Comparison
                    </>
                  )}
                </Button>
                <Link href="/documents">
                  <Button variant="outline" data-testid="cancel-bulk-compare-btn">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Standard Document Selection (hidden in bulk mode) */}
      {!isBulkMode && (
        <Card className="animate-in fade-in slide-in-from-top-2 duration-300" data-testid="document-selection-card">
          <CardHeader>
            <CardTitle className="text-lg">Select Documents</CardTitle>
            <CardDescription>
              Choose two documents to compare. Typically used to compare an original agreement with an
              amendment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <DocumentSelector
                label="Document 1 (Original)"
                value={doc1}
                onChange={setDoc1}
                documents={documentOptions}
                disabledId={doc2}
                testId="doc1-select"
              />

              <div className="pt-6">
                <ArrowRight className="w-5 h-5 text-zinc-400" />
              </div>

              <DocumentSelector
                label="Document 2 (Amendment)"
                value={doc2}
                onChange={setDoc2}
                documents={documentOptions}
                disabledId={doc1}
                testId="doc2-select"
              />

              <div className="pt-6">
                <Button
                  onClick={handleCompare}
                  disabled={!doc1 || !doc2 || isComparing || !isValidDocumentPair(doc1, doc2)}
                  className="transition-transform hover:scale-105"
                  data-testid="compare-documents-btn"
                >
                  {isComparing ? (
                    <>
                      <span className="animate-spin mr-2">
                        <GitCompare className="w-4 h-4" />
                      </span>
                      Comparing...
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Same Document Error */}
      {error && (
        <Card className="border-red-200 bg-red-50 animate-in fade-in slide-in-from-top-2 duration-300" data-testid="comparison-error">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-900 text-sm font-medium">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800 hover:bg-red-100"
                data-testid="dismiss-error-btn"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Comparison Results */}
      {isBulkMode && bulkResult && (
        <>
          {/* Summary */}
          <Card className="border-blue-200 bg-blue-50 animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid="bulk-summary-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Files className="w-5 h-5 text-blue-600" />
                AI Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-900">{bulkResult.summary}</p>
            </CardContent>
          </Card>

          {/* Common Fields */}
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid="bulk-common-fields-card">
            <CardHeader>
              <CardTitle className="text-lg text-green-700">
                Common Across All Documents ({bulkResult.commonFields.length})
              </CardTitle>
              <CardDescription>
                These fields have the same value across all compared documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bulkResult.commonFields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
                    data-testid={`bulk-common-field-${index}`}
                  >
                    <span className="font-medium text-zinc-700">{field.field}</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {field.values[0].value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Differences */}
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid="bulk-differences-card">
            <CardHeader>
              <CardTitle className="text-lg text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Variations Found ({bulkResult.differences.length})
              </CardTitle>
              <CardDescription>
                These fields have different values across the compared documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {bulkResult.differences.map((field, index) => (
                  <div
                    key={index}
                    className="space-y-2"
                    data-testid={`bulk-difference-field-${index}`}
                  >
                    <h4 className="font-semibold text-zinc-900">{field.field}</h4>
                    <div className="grid gap-2">
                      {field.variations.map((variation, varIndex) => (
                        <div
                          key={varIndex}
                          className="flex items-center justify-between py-2 px-3 bg-zinc-50 rounded-lg"
                          data-testid={`bulk-variation-${index}-${varIndex}`}
                        >
                          <span className="text-sm text-zinc-600 truncate max-w-[200px]">
                            {variation.docName}
                          </span>
                          <Badge
                            variant={varIndex === 0 ? 'default' : 'secondary'}
                            className={varIndex === 0 ? 'bg-blue-600' : ''}
                          >
                            {variation.value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end gap-3">
            <Link href="/documents">
              <Button variant="outline" data-testid="back-to-docs-btn">
                Back to Documents
              </Button>
            </Link>
            <Button
              className="transition-transform hover:scale-105"
              onClick={() => setExportModalOpen(true)}
              data-testid="export-bulk-comparison-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Comparison
            </Button>
          </div>
        </>
      )}

      {/* Comparison Diff View (when comparing two history entries) */}
      {comparisonDiff && diffEntry1 && diffEntry2 && (
        <ComparisonDiffView
          diff={comparisonDiff}
          entry1={diffEntry1}
          entry2={diffEntry2}
          onClose={handleCloseDiffView}
          isLoading={isComparingEntries}
        />
      )}

      {/* Main content area with optional sidebars */}
      <div className={`flex gap-4 ${!isBulkMode && (showHistory || clauseLibraryConfig.showPanel) ? '' : ''}`}>
        {/* Clause Library Panel (Left side) */}
        {!isBulkMode && clauseLibraryConfig.showPanel && clauseLibraryConfig.panelPosition === 'left' && (
          <ClauseLibraryPanel />
        )}

        <div className={`flex-1 ${showHistory && !isBulkMode ? 'grid grid-cols-[1fr_300px] gap-4' : ''}`}>
        <div className="space-y-4">
          {/* Standard Comparison Results */}
          {!isBulkMode && result && (
            <>
              {/* Viewing historical entry indicator */}
              {selectedHistoryEntry && (
                <Card className="border-purple-200 bg-purple-50 animate-in fade-in slide-in-from-top-2 duration-300" data-testid="viewing-history-entry">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-purple-600" />
                        <span className="text-purple-900 font-medium">
                          Viewing historical comparison
                          {selectedHistoryEntry.label && `: ${selectedHistoryEntry.label}`}
                        </span>
                        <span className="text-purple-600 text-sm">
                          ({new Date(selectedHistoryEntry.comparedAt).toLocaleDateString()})
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedHistoryEntry(null);
                          setResult(null);
                        }}
                        data-testid="clear-history-view-btn"
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary Stats */}
              <DemoCard sectionId="comparison-results" fullWidth>
                <ComparisonStats result={result} />
              </DemoCard>

          {/* AI Risk Analysis Loading State */}
          {isAnalyzingRisk && (
            <Card className="border-blue-200 bg-blue-50 animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid="risk-analysis-loading">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-blue-900 font-medium">Analyzing risk scores and market benchmarks...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compact Risk Summary (shown when risk analysis available) */}
          {riskAnalysis && !isAnalyzingRisk && (
            <DemoCard sectionId="ai-risk-analysis" fullWidth>
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-700">AI Risk Analysis</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRiskDetails(!showRiskDetails)}
                    className="text-sm"
                    data-testid="toggle-risk-details-btn"
                  >
                    {showRiskDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>
                <CompactRiskSummary
                  overallScore={riskAnalysis.summary.overallRiskScore}
                  severity={riskAnalysis.summary.overallSeverity}
                  direction={riskAnalysis.summary.overallDirection}
                  highRiskCount={riskAnalysis.summary.highRiskCount}
                  totalChanges={riskAnalysis.summary.totalChangesAnalyzed}
                />
              </div>
            </DemoCard>
          )}

          {/* Full Risk Analysis (expandable) */}
          {riskAnalysis && showRiskDetails && !isAnalyzingRisk && (
            <RiskScoreSummary summary={riskAnalysis.summary} />
          )}

          {/* Market Benchmarks Section */}
          {riskAnalysis && showRiskDetails && riskAnalysis.marketBenchmarks.length > 0 && !isAnalyzingRisk && (
            <MarketBenchmarkSection benchmarks={riskAnalysis.marketBenchmarks} />
          )}

          {/* Impact Analysis */}
          <Card className="border-amber-200 bg-amber-50 animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid="impact-analysis-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-900">{result.impactAnalysis}</p>
            </CardContent>
          </Card>

          {/* Review Progress Summary */}
          {annotationSummary.total > 0 && (
            <Card className="border-blue-200 bg-blue-50 animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid="review-progress-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Review Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-700">{annotationSummary.byStatus.reviewed}</p>
                    <p className="text-sm text-zinc-600">Reviewed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-700">{annotationSummary.byStatus.flagged}</p>
                    <p className="text-sm text-zinc-600">Flagged</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">{annotationSummary.byStatus.requires_legal}</p>
                    <p className="text-sm text-zinc-600">Legal Review</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-zinc-700">{annotationSummary.withComments}</p>
                    <p className="text-sm text-zinc-600">With Comments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Changes by Category */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-900">Detailed Changes</h2>

            {/* Unified Filter Bar - shows lens filters when risk analysis is available */}
            <ComparisonFilters
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={totalChangesCount}
              filteredCount={filteredChangesCount}
              showLensFilters={!!riskAnalysis && !isAnalyzingRisk}
              showPresets={true}
            />

            {/* Filtered Results */}
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, i) => (
                <ComparisonCategorySection
                  key={i}
                  category={category}
                  index={i}
                  doc1Name={doc1 ? getDocName(doc1) : undefined}
                  doc2Name={doc2 ? getDocName(doc2) : undefined}
                  getAnnotation={getAnnotation}
                  onAnnotationClick={(change, changeId) => handleAnnotationClick(change, changeId, category.category)}
                  getRiskScore={getRiskScore}
                  getMarketBenchmark={getMarketBenchmark}
                  categorySummary={getCategorySummary(category.category)}
                  getClauseMatch={getClauseMatch}
                  onClauseMatchClick={(changeId, match) => {
                    // When clicking a clause match, open the clause library panel
                    if (!clauseLibraryConfig.showPanel) {
                      toggleClauseLibrary();
                    }
                  }}
                  onViewInPDF={(changeId) => {
                    // Open PDF overlay and navigate to this change
                    navigateToPDFChange(changeId);
                  }}
                />
              ))
            ) : (
              <Card className="py-8" data-testid="no-filtered-results">
                <CardContent className="text-center">
                  <p className="text-zinc-500">No changes match your current filters</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-4"
                    data-testid="reset-filters-btn"
                  >
                    Reset all filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-3">
            {/* Auto-save status indicator with undo */}
            {!selectedHistoryEntry && autoSaveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-sm text-zinc-500" data-testid="auto-save-saving">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {!selectedHistoryEntry && autoSaveStatus === 'saved' && (
              <div className="flex items-center gap-2" data-testid="auto-save-saved">
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndoAutoSave}
                  className="h-7 px-2 text-zinc-500 hover:text-zinc-700"
                  data-testid="undo-auto-save-btn"
                >
                  <Undo2 className="w-3.5 h-3.5 mr-1" />
                  Undo
                </Button>
              </div>
            )}
            {!selectedHistoryEntry && autoSaveStatus === 'undone' && (
              <div className="flex items-center gap-2 text-sm text-zinc-500" data-testid="auto-save-undone">
                <span>Removed from history</span>
              </div>
            )}
            <Button
              onClick={handleGenerateAmendment}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105"
              data-testid="generate-amendment-btn"
            >
              <FileText className="w-4 h-4 mr-2" />
              <Sparkles className="w-3 h-3 mr-1" />
              Generate Amendment
            </Button>
            <Button
              variant="outline"
              className="transition-transform hover:scale-105"
              onClick={() => setExportModalOpen(true)}
              data-testid="export-comparison-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Comparison
            </Button>
          </div>
            </>
          )}

          {/* Empty State */}
          {!isBulkMode && !result && !isComparing && (
            <Card className="py-12 animate-in fade-in duration-300" data-testid="compare-empty-state">
              <CardContent className="text-center">
                <GitCompare className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">Select two documents to compare</p>
                <p className="text-sm text-zinc-400">
                  The comparison will identify added, removed, and modified terms
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Sidebar */}
        {showHistory && !isBulkMode && (
          <ComparisonHistoryTimeline
            entries={historyEntries}
            isLoading={isLoadingHistory}
            onRefresh={loadHistory}
            onSelect={(entry) => setSelectedHistoryEntry(entry)}
            onView={handleViewHistoryEntry}
            onCompareWith={handleCompareHistoryEntries}
            onEdit={handleEditHistoryEntry}
            onDelete={handleDeleteHistoryEntry}
            selectedEntryId={selectedHistoryEntry?.id}
          />
        )}
        </div>

        {/* Clause Library Panel (Right side) */}
        {!isBulkMode && clauseLibraryConfig.showPanel && clauseLibraryConfig.panelPosition === 'right' && (
          <ClauseLibraryPanel />
        )}
      </div>

      {/* Annotation Panel Backdrop */}
      <AnnotationPanelBackdrop isOpen={annotationPanelOpen} onClose={handleClosePanel} />

      {/* Annotation Panel */}
      <AnnotationPanel
        annotation={selectedChange ? getAnnotation(selectedChange.changeId) || null : null}
        isOpen={annotationPanelOpen}
        onClose={handleClosePanel}
        currentUserId={currentUserId}
        users={users}
        changeField={selectedChange?.change.field || ''}
        changeImpact={selectedChange?.change.impact || ''}
        onStatusChange={handleStatusChange}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
      />

      {/* Amendment Draft Modal */}
      <AmendmentDraftModal
        isOpen={amendmentModalOpen}
        onClose={handleCloseAmendmentModal}
        draft={amendmentDraft}
        isLoading={isGeneratingAmendment}
        error={amendmentError}
      />

      {/* History Entry Edit Modal */}
      <HistoryEntryEditModal
        entry={editingHistoryEntry}
        isOpen={editingHistoryEntry !== null}
        onClose={() => setEditingHistoryEntry(null)}
        onSave={handleSaveHistoryEntryEdit}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        comparisonResult={result}
        annotations={annotations}
        riskAnalysis={riskAnalysis}
        doc1Name={doc1 ? getDocName(doc1) : undefined}
        doc2Name={doc2 ? getDocName(doc2) : undefined}
      />

      {/* Keyboard Shortcuts Reference Card */}
      <ShortcutReferenceCard
        isOpen={isReferenceOpen}
        onClose={closeReference}
        shortcuts={shortcuts}
        getShortcutsByCategory={getShortcutsByCategory}
      />

      {/* Floating Navigation Hint - shows when navigating with keyboard */}
      {!isBulkMode && result && allChanges.length > 0 && (
        <FloatingNavigationHint
          show={focusedChangeIndex >= 0 && shortcutConfig.showHints}
          currentIndex={focusedChangeIndex}
          totalCount={allChanges.length}
        />
      )}

      {/* PDF Comparison Panel - Side-by-side PDF overlay */}
      {!isBulkMode && result && (
        <PDFComparisonPanel
          isOpen={isPDFOverlayOpen}
          onClose={closePDFOverlay}
          doc1Info={doc1Info}
          doc2Info={doc2Info}
          changeRegions={changeRegions}
          focusedChangeId={pdfFocusedChangeId}
          onHighlightClick={(changeId) => {
            // Navigate to the change in the structured comparison view
            const changeIndex = allChanges.findIndex((c) => c.changeId === changeId);
            if (changeIndex >= 0) {
              navigateToChange(changeIndex);
              // Close the PDF overlay to show the structured view
              closePDFOverlay();
            }
          }}
          onFocusChange={(changeId) => {
            if (changeId) {
              setPDFFocusedChangeId(changeId);
              // Also highlight in the structured view
              const changeIndex = allChanges.findIndex((c) => c.changeId === changeId);
              if (changeIndex >= 0) {
                setFocusedChangeIndex(changeIndex);
              }
            }
          }}
        />
      )}
    </div>
  );
}

export function DocumentComparePage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-zinc-100 rounded-lg" />}>
      <DocumentComparePageContent />
    </Suspense>
  );
}
