'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, FileText, PanelLeft, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CategorySection,
  StickyExtractionStats,
  DocumentAIChat,
  PDFPreviewPane,
  SplitPaneLayout,
  TemplateSelector,
  TemplateValidationResults,
  KeyboardShortcutsHelp,
  ExtractionSaveSuccessDialog,
} from './components';
import { mockExtractionFields } from './lib/mock-data';
import { getMaxPageNumber, calculateHighlightRegion } from './lib/sourceParser';
import { useExtractionTemplate, useKeyboardNavigation } from './hooks';
import type { ExtractionField } from '../lib/types';
import { mockDocument } from '../sub_DocumentDetail/lib/mock-data';

interface ExtractionReviewPageProps {
  documentId: string;
}

// Mock document text for template detection
const MOCK_DOCUMENT_TEXT = `
This Term Loan Agreement is dated as of November 15, 2024
among Acme Corporation as Borrower,
JPMorgan Chase Bank as Administrative Agent,
and the Lenders party hereto.

RECITALS

The Borrower has requested that the Lenders make term loans
in an aggregate principal amount of $500,000,000.

ARTICLE 1 - DEFINITIONS
"Maturity Date" means November 20, 2029.
"Applicable Margin" means 3.25% per annum.
"Base Rate" means SOFR.

ARTICLE 7 - COVENANTS
Section 7.1 Financial Covenants
(a) Maximum Leverage Ratio: 4.50 to 1.00, tested quarterly
(b) Minimum Interest Coverage Ratio: 3.00 to 1.00
(c) Maximum Capital Expenditures: $50,000,000 per fiscal year

The facility shall amortize in quarterly installments.
Mandatory prepayments required upon asset sales.
`;

export function ExtractionReviewPage({ documentId }: ExtractionReviewPageProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedField, setSelectedField] = useState<ExtractionField | null>(null);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<{
    categoryIndex: number;
    fieldIndex: number;
  } | null>(null);
  const [hoveredField, setHoveredField] = useState<ExtractionField | null>(null);
  const [hoveredFieldIndex, setHoveredFieldIndex] = useState<{
    categoryIndex: number;
    fieldIndex: number;
  } | null>(null);

  // Save success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Template management hook
  const {
    selectedTemplate,
    selectedTemplateId,
    detection,
    validationResult,
    isDetecting,
    selectTemplate,
    runDetection,
  } = useExtractionTemplate({
    documentText: MOCK_DOCUMENT_TEXT,
    fileName: mockDocument.original_filename,
    extractedData: mockExtractionFields,
    autoDetect: true,
  });

  // Global verified fields state: Map<categoryId, Set<fieldIndex>>
  const [verifiedFieldsMap, setVerifiedFieldsMap] = useState<Map<string, Set<number>>>(
    () => new Map()
  );

  // Refs for field elements to enable jumping to flagged fields
  const fieldRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // Scroll container ref for the sticky header
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track which field is in edit mode (for keyboard navigation)
  const [editingFieldIndex, setEditingFieldIndex] = useState<{
    categoryIndex: number;
    fieldIndex: number;
  } | null>(null);

  // Keyboard navigation hook
  const [keyboardState, keyboardActions] = useKeyboardNavigation({
    categories: mockExtractionFields,
    onFieldSelect: (field, categoryIndex, fieldIndex) => {
      setSelectedField(field);
      setSelectedFieldIndex({ categoryIndex, fieldIndex });
      const region = calculateHighlightRegion(field.source, field.name, field.boundingBox);
      setCurrentPage(region.pageNumber);
    },
    onVerify: (categoryIndex, fieldIndex) => {
      const category = mockExtractionFields[categoryIndex];
      if (category) {
        const currentVerified = verifiedFieldsMap.get(category.id) ?? new Set();
        const newVerified = new Set(currentVerified);
        if (newVerified.has(fieldIndex)) {
          newVerified.delete(fieldIndex);
        } else {
          newVerified.add(fieldIndex);
        }
        setVerifiedFieldsMap((prev) => {
          const next = new Map(prev);
          next.set(category.id, newVerified);
          return next;
        });
      }
    },
    onStartEdit: (categoryIndex, fieldIndex) => {
      setEditingFieldIndex({ categoryIndex, fieldIndex });
    },
    onCancelEdit: () => {
      setEditingFieldIndex(null);
    },
    enabled: true,
  });

  // Handle field edit mode changes from FieldRow
  const handleFieldEditModeChange = useCallback(
    (categoryIndex: number, fieldIndex: number, isEditing: boolean) => {
      keyboardActions.setIsEditing(isEditing);
      if (!isEditing) {
        setEditingFieldIndex(null);
      }
    },
    [keyboardActions]
  );

  const flaggedCount = useMemo(
    () =>
      mockExtractionFields.reduce(
        (acc, cat) => acc + cat.fields.filter((f) => f.flagged).length,
        0
      ),
    []
  );

  // Handle verification state changes from category sections
  const handleVerificationChange = useCallback(
    (categoryId: string, verifiedFields: Set<number>) => {
      setVerifiedFieldsMap((prev) => {
        const next = new Map(prev);
        next.set(categoryId, verifiedFields);
        return next;
      });
    },
    []
  );

  // Jump to a specific flagged field
  const handleJumpToField = useCallback((categoryId: string, fieldIndex: number) => {
    const refKey = `${categoryId}-${fieldIndex}`;
    const fieldElement = fieldRefs.current.get(refKey);

    if (fieldElement) {
      // Scroll the field into view
      fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Flash highlight effect
      fieldElement.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2', 'rounded-lg');
      setTimeout(() => {
        fieldElement.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2', 'rounded-lg');
      }, 2000);
    }
  }, []);

  const totalPages = useMemo(
    () => getMaxPageNumber(mockExtractionFields),
    []
  );

  // Use hovered field for highlight if available, otherwise use selected field
  const activeFieldForHighlight = hoveredField || selectedField;

  const highlightRegion = useMemo(() => {
    if (!activeFieldForHighlight) return null;
    return calculateHighlightRegion(
      activeFieldForHighlight.source,
      activeFieldForHighlight.name,
      activeFieldForHighlight.boundingBox
    );
  }, [activeFieldForHighlight]);

  // Determine if highlight is from hover (preview) or click (selected)
  const isHoverHighlight = hoveredField !== null;

  const handleFieldSelect = useCallback(
    (field: ExtractionField, categoryIndex: number, fieldIndex: number) => {
      setSelectedField(field);
      setSelectedFieldIndex({ categoryIndex, fieldIndex });

      // Parse page from source and navigate to it (use bounding box if available)
      const region = calculateHighlightRegion(field.source, field.name, field.boundingBox);
      setCurrentPage(region.pageNumber);
    },
    []
  );

  const handleFieldHover = useCallback(
    (field: ExtractionField | null, categoryIndex: number, fieldIndex: number) => {
      if (field) {
        setHoveredField(field);
        setHoveredFieldIndex({ categoryIndex, fieldIndex });

        // Navigate to the hovered field's page for preview (only if preview is visible)
        if (showPreview) {
          const region = calculateHighlightRegion(field.source, field.name, field.boundingBox);
          setCurrentPage(region.pageNumber);
        }
      } else {
        setHoveredField(null);
        setHoveredFieldIndex(null);
      }
    },
    [showPreview]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleTogglePreview = useCallback(() => {
    setShowPreview((prev) => !prev);
  }, []);

  // Count extracted covenants and obligations for the success dialog
  const extractionCounts = useMemo(() => {
    let covenants = 0;
    let obligations = 0;

    for (const category of mockExtractionFields) {
      const categoryLower = category.category.toLowerCase();
      if (categoryLower.includes('covenant')) {
        covenants += category.fields.length;
      } else if (categoryLower.includes('obligation')) {
        obligations += category.fields.length;
      }
    }

    return { covenants, obligations };
  }, []);

  // Handle save action
  const handleSaveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save extraction data
      // In production, this would call the PUT /api/documents/[id]/extraction endpoint
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Show success dialog after save
      setShowSuccessDialog(true);
    } catch {
      // Error handling would go here
      console.error('Failed to save extraction changes');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Left pane content (extraction fields)
  const leftPaneContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable content area */}
      <div
        className="flex-1 overflow-auto p-6 space-y-6"
        data-extraction-scroll-container
        ref={scrollContainerRef}
      >
        {/* Page Header */}
        <div className="flex items-start justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-start gap-4">
            <Link href={`/documents/${documentId}`} data-testid="back-to-document-link">
              <Button
                variant="ghost"
                size="icon"
                className="transition-transform hover:scale-110"
                data-testid="back-to-document-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Extraction Review</h1>
              <p className="text-zinc-500">
                Review and verify extracted data from {mockDocument.original_filename}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle preview button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePreview}
              className="transition-transform hover:scale-105"
              data-testid="toggle-preview-btn"
            >
              {showPreview ? (
                <>
                  <PanelLeft className="w-4 h-4 mr-2" />
                  Hide Document
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Show Document
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="transition-transform hover:scale-105"
              disabled={isSaving}
              data-testid="discard-changes-btn"
            >
              Discard Changes
            </Button>
            <Button
              className="transition-transform hover:scale-105"
              onClick={handleSaveChanges}
              disabled={isSaving}
              data-testid="save-all-changes-btn"
            >
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>

        {/* Template Selector */}
        <TemplateSelector
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={selectTemplate}
          detection={detection ?? undefined}
          showDetectionBanner={true}
          onRedetect={runDetection}
          isDetecting={isDetecting}
        />

        {/* Template Validation Results */}
        {validationResult && selectedTemplate && (
          <TemplateValidationResults
            results={validationResult}
            templateName={selectedTemplate.name}
          />
        )}

        {/* Sticky Summary Stats with Review Progress and Quick Jump */}
        <StickyExtractionStats
          categories={mockExtractionFields}
          verifiedFieldsMap={verifiedFieldsMap}
          onJumpToField={handleJumpToField}
        />

        {/* Help Banner with tip about clicking fields and keyboard shortcuts */}
        <Card
          className="border-indigo-200 bg-indigo-50 animate-in fade-in slide-in-from-top-2 duration-300"
          data-testid="source-preview-tip-banner"
        >
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="text-sm text-indigo-800">
                <p>
                  <span className="font-medium">Tip:</span> Click any field row or the{' '}
                  <span className="inline-flex items-center gap-0.5 font-medium">
                    <FileText className="w-3.5 h-3.5" /> view
                  </span>{' '}
                  icon to see its source location in the document preview.
                </p>
                <p className="mt-1 flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>
                    Use keyboard shortcuts for faster review: press{' '}
                    <kbd className="mx-0.5 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium border border-indigo-200">?</kbd>{' '}
                    to see all shortcuts.
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flagged Fields Banner */}
        {flaggedCount > 0 && (
          <Card
            className="border-amber-200 bg-amber-50 animate-in fade-in slide-in-from-top-2 duration-300"
            data-testid="flagged-fields-banner"
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">
                    {flaggedCount} field{flaggedCount > 1 ? 's' : ''} need
                    {flaggedCount === 1 ? 's' : ''} your attention
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    These fields have lower confidence scores. Please verify the
                    extracted values against the source document.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Field Categories */}
        <div className="space-y-4" role="grid" aria-label="Extraction fields">
          {mockExtractionFields.map((category, index) => (
            <CategorySection
              key={category.id}
              category={category}
              index={index}
              documentId={documentId}
              selectedFieldIndex={selectedFieldIndex}
              hoveredFieldIndex={hoveredFieldIndex}
              keyboardFocusedFieldIndex={
                keyboardState.isActive
                  ? { categoryIndex: keyboardState.focusedCategoryIndex, fieldIndex: keyboardState.focusedFieldIndex }
                  : null
              }
              editingFieldIndex={editingFieldIndex}
              onFieldEditModeChange={handleFieldEditModeChange}
              onFieldSelect={handleFieldSelect}
              onFieldHover={handleFieldHover}
              externalVerifiedFields={verifiedFieldsMap.get(category.id)}
              onVerificationChange={handleVerificationChange}
              fieldRefs={fieldRefs}
            />
          ))}
        </div>

        {/* Document AI Chat Assistant */}
        <DocumentAIChat documentId={documentId} documentName={mockDocument.original_filename} />

        {/* Bottom Actions */}
        <div
          className="flex items-center justify-between pt-4 border-t animate-in fade-in slide-in-from-bottom-4 duration-500"
          data-testid="bottom-actions"
        >
          <Button
            variant="outline"
            asChild
            className="transition-transform hover:scale-105"
            data-testid="bottom-back-to-document-btn"
          >
            <Link
              href={`/documents/${documentId}`}
              data-testid="bottom-back-to-document-link"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Document
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="transition-transform hover:scale-105"
              disabled={isSaving}
              data-testid="mark-all-verified-btn"
            >
              Mark All as Verified
            </Button>
            <Button
              className="transition-transform hover:scale-105"
              onClick={handleSaveChanges}
              disabled={isSaving}
              data-testid="save-complete-review-btn"
            >
              {isSaving ? 'Saving...' : 'Save & Complete Review'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Right pane content (PDF preview with source context)
  const rightPaneContent = (
    <PDFPreviewPane
      documentId={documentId}
      documentName={mockDocument.original_filename}
      totalPages={totalPages}
      currentPage={currentPage}
      onPageChange={handlePageChange}
      highlightRegion={highlightRegion}
      selectedField={activeFieldForHighlight}
      isHoverHighlight={isHoverHighlight}
      className="h-full"
    />
  );

  return (
    <div className="h-[calc(100vh-4rem)] -m-6" data-testid="extraction-review-page">
      <SplitPaneLayout
        leftPane={leftPaneContent}
        rightPane={rightPaneContent}
        showRightPane={showPreview}
        onToggleRight={handleTogglePreview}
        defaultLeftWidth={55}
        minLeftWidth={35}
        maxLeftWidth={70}
        minRightWidth={350}
        className="h-full"
      />

      {/* Keyboard Shortcuts Help Popover */}
      <KeyboardShortcutsHelp
        isOpen={keyboardState.showHelp}
        onClose={() => keyboardActions.toggleHelp()}
      />

      {/* Floating Keyboard Shortcut Hint Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => keyboardActions.toggleHelp()}
        className="fixed bottom-4 left-4 z-40 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        data-testid="keyboard-shortcuts-hint-btn"
      >
        <Keyboard className="h-4 w-4 mr-2" />
        <span className="text-xs">Press ? for shortcuts</span>
      </Button>

      {/* Post-Save Success Dialog with Compliance Handoff */}
      <ExtractionSaveSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        documentId={documentId}
        documentName={mockDocument.original_filename}
        extractedCovenantsCount={extractionCounts.covenants}
        extractedObligationsCount={extractionCounts.obligations}
      />
    </div>
  );
}
