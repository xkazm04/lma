import { useState, useCallback, useMemo } from 'react';
import type { PDFChangeRegion, PDFDocumentInfo, PDFViewMode } from '../lib/pdf-overlay-types';
import { mockPDFDocuments, mockChangeRegions } from '../lib/pdf-overlay-mock-data';
import { createChangeId } from '../lib/mock-data';
import type { ComparisonResult } from '@/types';

interface UsePDFOverlayOptions {
  /** Document 1 ID */
  doc1Id?: string;
  /** Document 2 ID */
  doc2Id?: string;
  /** Comparison result for mapping changes */
  comparisonResult?: ComparisonResult | null;
}

interface UsePDFOverlayReturn {
  /** Whether the PDF overlay is open */
  isOpen: boolean;
  /** Open the PDF overlay */
  openOverlay: () => void;
  /** Close the PDF overlay */
  closeOverlay: () => void;
  /** Toggle the PDF overlay */
  toggleOverlay: () => void;
  /** Document 1 info */
  doc1Info: PDFDocumentInfo;
  /** Document 2 info */
  doc2Info: PDFDocumentInfo;
  /** Change regions mapped to PDF coordinates */
  changeRegions: PDFChangeRegion[];
  /** Currently focused change ID */
  focusedChangeId: string | null;
  /** Set the focused change (for bidirectional navigation) */
  setFocusedChangeId: (changeId: string | null) => void;
  /** Navigate to a specific change by ID */
  navigateToChange: (changeId: string) => void;
  /** Navigate to next change */
  navigateToNextChange: () => void;
  /** Navigate to previous change */
  navigateToPrevChange: () => void;
  /** Get page numbers for a change */
  getPageNumbersForChange: (changeId: string) => { doc1Page: number | null; doc2Page: number | null };
  /** View mode */
  viewMode: PDFViewMode;
  /** Set view mode */
  setViewMode: (mode: PDFViewMode) => void;
}

/**
 * Hook to manage PDF overlay state and bidirectional navigation
 */
export function usePDFOverlay({
  doc1Id,
  doc2Id,
  comparisonResult,
}: UsePDFOverlayOptions = {}): UsePDFOverlayReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedChangeId, setFocusedChangeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<PDFViewMode>('side-by-side');

  // Get document info from mock data (in production, this would come from API)
  const doc1Info: PDFDocumentInfo = useMemo(() => {
    if (doc1Id && mockPDFDocuments[doc1Id]) {
      return mockPDFDocuments[doc1Id];
    }
    // Return default for demo
    return {
      id: doc1Id || 'doc-1',
      filename: 'Original_Agreement.pdf',
      totalPages: 45,
    };
  }, [doc1Id]);

  const doc2Info: PDFDocumentInfo = useMemo(() => {
    if (doc2Id && mockPDFDocuments[doc2Id]) {
      return mockPDFDocuments[doc2Id];
    }
    // Return default for demo
    return {
      id: doc2Id || 'doc-2',
      filename: 'Amendment.pdf',
      totalPages: 12,
    };
  }, [doc2Id]);

  // Map comparison changes to PDF regions
  const changeRegions: PDFChangeRegion[] = useMemo(() => {
    if (!comparisonResult) {
      // Return mock data for demo
      return mockChangeRegions;
    }

    // In production, map comparison changes to PDF regions from extraction
    // For now, use mock regions but match them to actual comparison changes
    const mappedRegions: PDFChangeRegion[] = [];

    comparisonResult.differences.forEach((diff: any) => {
      const changeId = createChangeId(diff.category, diff.field);

      // Find matching mock region or create placeholder
      const mockRegion = mockChangeRegions.find((r) => r.changeId === changeId);

      if (mockRegion) {
        mappedRegions.push(mockRegion);
      } else {
        // Create a placeholder region for changes without PDF mapping
        mappedRegions.push({
          changeId,
          fieldName: diff.field,
          category: diff.category,
          changeType: diff.changeType,
          doc1Region: diff.changeType !== 'added' ? {
            id: `auto-${changeId}-doc1`,
            page: 1,
            x: 10,
            y: 20 + (mappedRegions.length * 10) % 70,
            width: 80,
            height: 5,
          } : null,
          doc2Region: diff.changeType !== 'removed' ? {
            id: `auto-${changeId}-doc2`,
            page: 1,
            x: 10,
            y: 20 + (mappedRegions.length * 10) % 70,
            width: 80,
            height: 5,
          } : null,
          severity: 'medium',
          description: diff.impact,
        });
      }
    });

    return mappedRegions.length > 0 ? mappedRegions : mockChangeRegions;
  }, [comparisonResult]);

  // Open/close handlers
  const openOverlay = useCallback(() => setIsOpen(true), []);
  const closeOverlay = useCallback(() => setIsOpen(false), []);
  const toggleOverlay = useCallback(() => setIsOpen((prev) => !prev), []);

  // Navigate to a specific change
  const navigateToChange = useCallback((changeId: string) => {
    setFocusedChangeId(changeId);
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  // Navigate to next/prev change
  const navigateToNextChange = useCallback(() => {
    if (changeRegions.length === 0) return;

    const currentIndex = focusedChangeId
      ? changeRegions.findIndex((r) => r.changeId === focusedChangeId)
      : -1;

    const nextIndex = currentIndex < changeRegions.length - 1 ? currentIndex + 1 : 0;
    setFocusedChangeId(changeRegions[nextIndex].changeId);
  }, [changeRegions, focusedChangeId]);

  const navigateToPrevChange = useCallback(() => {
    if (changeRegions.length === 0) return;

    const currentIndex = focusedChangeId
      ? changeRegions.findIndex((r) => r.changeId === focusedChangeId)
      : 0;

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : changeRegions.length - 1;
    setFocusedChangeId(changeRegions[prevIndex].changeId);
  }, [changeRegions, focusedChangeId]);

  // Get page numbers for a change
  const getPageNumbersForChange = useCallback((changeId: string): { doc1Page: number | null; doc2Page: number | null } => {
    const region = changeRegions.find((r) => r.changeId === changeId);
    if (!region) {
      return { doc1Page: null, doc2Page: null };
    }
    return {
      doc1Page: region.doc1Region?.page ?? null,
      doc2Page: region.doc2Region?.page ?? null,
    };
  }, [changeRegions]);

  return {
    isOpen,
    openOverlay,
    closeOverlay,
    toggleOverlay,
    doc1Info,
    doc2Info,
    changeRegions,
    focusedChangeId,
    setFocusedChangeId,
    navigateToChange,
    navigateToNextChange,
    navigateToPrevChange,
    getPageNumbersForChange,
    viewMode,
    setViewMode,
  };
}
