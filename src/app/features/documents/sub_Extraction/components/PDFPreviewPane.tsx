'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Maximize2, Minimize2, PanelRightClose, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SourceContextPanel } from './SourceContextPanel';
import type { ExtractionField } from '../../lib/types';

interface HighlightRegion {
  pageNumber: number;
  text?: string;
  // Bounding box coordinates as percentages (0-100) of the page
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface PDFPreviewPaneProps {
  documentId: string;
  documentName: string;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  highlightRegion?: HighlightRegion | null;
  /** The currently selected field to display source context for */
  selectedField?: ExtractionField | null;
  /** Whether the current highlight is from hover (preview) vs click (selection) */
  isHoverHighlight?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

/**
 * PDF Preview Pane component for displaying source document alongside extracted fields.
 * Supports page navigation, zoom controls, and synchronized highlighting.
 */
export const PDFPreviewPane = memo(function PDFPreviewPane({
  documentId: _documentId, // Reserved for future PDF rendering integration
  documentName,
  totalPages,
  currentPage,
  onPageChange,
  highlightRegion,
  selectedField,
  isHoverHighlight = false,
  isExpanded = false,
  onToggleExpand,
  className,
}: PDFPreviewPaneProps) {
  // _documentId will be used when integrating with actual PDF rendering service
  void _documentId;
  const [zoom, setZoom] = useState(100);
  const [pageInputValue, setPageInputValue] = useState(String(currentPage));
  const [showContextPanel, setShowContextPanel] = useState(true);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Toggle context panel visibility
  const handleToggleContextPanel = useCallback(() => {
    setShowContextPanel((prev) => !prev);
  }, []);

  // Sync page input with current page
  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  // Auto-scroll to highlight region when it changes
  useEffect(() => {
    if (highlightRegion && highlightRef.current && pageContainerRef.current) {
      // If highlight is on a different page, navigate to that page first
      if (highlightRegion.pageNumber !== currentPage) {
        onPageChange(highlightRegion.pageNumber);
      }

      // Scroll the highlight into view after a brief delay for rendering
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
      }, 100);
    }
  }, [highlightRegion, currentPage, onPageChange]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  }, []);

  const handlePageInputBlur = useCallback(() => {
    const pageNum = parseInt(pageInputValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setPageInputValue(String(currentPage));
    }
  }, [pageInputValue, totalPages, currentPage, onPageChange]);

  const handlePageInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  }, [handlePageInputBlur]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 50));
  }, []);

  // Render inline excerpt highlight when there's a selected/hovered field with source excerpt
  const renderInlineExcerpt = () => {
    if (!selectedField?.sourceExcerpt || !highlightRegion || highlightRegion.pageNumber !== currentPage) {
      return null;
    }

    // Try to find and highlight the extracted value within the source excerpt
    const excerpt = selectedField.sourceExcerpt;
    const value = selectedField.value;
    const valueIndex = excerpt.toLowerCase().indexOf(value.toLowerCase());

    if (valueIndex === -1) {
      return (
        <div
          className={cn(
            'absolute left-4 right-4 p-3 rounded-lg shadow-lg border-2 transition-all duration-200 z-10',
            isHoverHighlight
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-amber-50 border-amber-300'
          )}
          style={{
            top: `${(highlightRegion.y ?? 20) + (highlightRegion.height ?? 10) + 2}%`,
          }}
          data-testid="pdf-source-excerpt"
        >
          <p className="text-xs font-semibold text-zinc-500 mb-1">Source Excerpt:</p>
          <p className="text-xs text-zinc-700 leading-relaxed italic">&ldquo;{excerpt}&rdquo;</p>
        </div>
      );
    }

    // Split the excerpt to highlight the value
    const before = excerpt.slice(0, valueIndex);
    const match = excerpt.slice(valueIndex, valueIndex + value.length);
    const after = excerpt.slice(valueIndex + value.length);

    return (
      <div
        className={cn(
          'absolute left-4 right-4 p-3 rounded-lg shadow-lg border-2 transition-all duration-200 z-10',
          isHoverHighlight
            ? 'bg-indigo-50 border-indigo-300'
            : 'bg-amber-50 border-amber-300'
        )}
        style={{
          top: `${(highlightRegion.y ?? 20) + (highlightRegion.height ?? 10) + 2}%`,
        }}
        data-testid="pdf-source-excerpt"
      >
        <p className="text-xs font-semibold text-zinc-500 mb-1">Source Excerpt:</p>
        <p className="text-xs text-zinc-700 leading-relaxed">
          <span className="italic">&ldquo;{before}</span>
          <mark
            className={cn(
              'px-0.5 rounded font-semibold not-italic',
              isHoverHighlight
                ? 'bg-indigo-200 text-indigo-900'
                : 'bg-amber-200 text-amber-900'
            )}
            data-testid="pdf-excerpt-highlight"
          >
            {match}
          </mark>
          <span className="italic">{after}&rdquo;</span>
        </p>
      </div>
    );
  };

  // Mock PDF page content - in production this would render actual PDF
  // This simulates a document page with placeholder content
  const renderPageContent = () => {
    return (
      <div
        className="relative bg-white shadow-lg mx-auto"
        style={{
          width: `${(8.5 * zoom) / 100 * 72}px`, // 8.5 inches at 72 DPI base
          minHeight: `${(11 * zoom) / 100 * 72}px`, // 11 inches at 72 DPI base
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Simulated page content with text lines */}
        <div className="p-8 space-y-4">
          {/* Page header */}
          <div className="text-center border-b pb-4 mb-6">
            <p className="text-sm text-zinc-400">Page {currentPage} of {totalPages}</p>
            <p className="font-semibold text-zinc-700">{documentName}</p>
          </div>

          {/* Simulated document content based on page */}
          {currentPage === 1 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-center text-zinc-800">SENIOR SECURED TERM LOAN FACILITY AGREEMENT</h2>
              <p className="text-sm text-zinc-600">dated as of November 15, 2024</p>
              <p className="text-sm text-zinc-600">among</p>
              <p className="text-sm font-medium text-zinc-700">APOLLO HOLDINGS, LLC</p>
              <p className="text-sm text-zinc-600">as Borrower</p>
              <div className="mt-4 text-xs text-zinc-500 space-y-2">
                <p><span className="font-medium">Facility Name:</span> Project Apollo Senior Secured Term Loan Facility</p>
                <p><span className="font-medium">Facility Type:</span> Term Loan</p>
              </div>
            </div>
          )}

          {currentPage === 5 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-800">SECTION 3.1 - COMMITMENTS</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Subject to the terms and conditions set forth herein, each Lender agrees to make a Term Loan to the Borrower on the Closing Date in a principal amount not to exceed such Lender&apos;s Term Loan Commitment.
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                <span className="font-medium">Total Commitments:</span> $500,000,000 (Five Hundred Million Dollars)
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                <span className="font-medium">Currency:</span> United States Dollars (USD)
              </p>
            </div>
          )}

          {currentPage === 12 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-800">SECTION 4.2 - INTEREST RATES</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                The Term Loans shall bear interest at a rate per annum equal to the Applicable Rate plus the Base Rate.
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                <span className="font-medium">Base Rate:</span> Term SOFR (Secured Overnight Financing Rate)
              </p>
              <h3 className="text-base font-semibold text-zinc-800 mt-4">SECTION 4.3 - MARGIN</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                <span className="font-medium">Initial Margin:</span> 3.25% per annum
              </p>
            </div>
          )}

          {currentPage === 15 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-800">SECTION 4.5 - COMMITMENT FEE</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                The Borrower agrees to pay to each Lender, through the Administrative Agent, a commitment fee in Dollars computed at a rate equal to the Commitment Fee Rate on the average daily unused portion of such Lender&apos;s Commitment.
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                <span className="font-medium">Commitment Fee Rate:</span> 0.50% per annum
              </p>
            </div>
          )}

          {currentPage === 78 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-800">SECTION 7.1 - FINANCIAL COVENANTS</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                The Borrower shall maintain the following financial covenants, tested quarterly:
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                <span className="font-medium">(a) Maximum Leverage Ratio:</span> The ratio of Total Debt to Consolidated EBITDA shall not exceed 4.50 to 1.00.
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                <span className="font-medium">(b) Minimum Interest Coverage Ratio:</span> The ratio of Consolidated EBITDA to Interest Expense shall not be less than 3.00 to 1.00.
              </p>
            </div>
          )}

          {currentPage === 82 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-800">SECTION 7.2 - CAPITAL EXPENDITURES</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                The Borrower shall not make or commit to make Capital Expenditures in any fiscal year in an aggregate amount exceeding:
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                <span className="font-medium">Maximum CapEx:</span> $50,000,000 (Fifty Million Dollars)
              </p>
            </div>
          )}

          {currentPage === 145 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-800">SECTION 12.1 - GOVERNING LAW</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                THIS AGREEMENT AND THE OTHER LOAN DOCUMENTS AND ANY CLAIMS, CONTROVERSY, DISPUTE OR CAUSE OF ACTION (WHETHER IN CONTRACT OR TORT OR OTHERWISE) BASED UPON, ARISING OUT OF OR RELATING TO THIS AGREEMENT SHALL BE GOVERNED BY, AND CONSTRUED IN ACCORDANCE WITH, THE LAW OF THE STATE OF NEW YORK.
              </p>
            </div>
          )}

          {/* Generic content for other pages */}
          {![1, 5, 12, 15, 78, 82, 145].includes(currentPage) && (
            <div className="space-y-3">
              <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-100 rounded w-full"></div>
              <div className="h-4 bg-zinc-100 rounded w-5/6"></div>
              <div className="h-4 bg-zinc-100 rounded w-2/3"></div>
              <div className="h-4 bg-zinc-100 rounded w-full"></div>
              <div className="h-4 bg-zinc-100 rounded w-4/5"></div>
            </div>
          )}
        </div>

        {/* Highlight overlay - shown when a region is highlighted on this page */}
        {highlightRegion && highlightRegion.pageNumber === currentPage && (
          <div
            ref={highlightRef}
            className={cn(
              'absolute pointer-events-none rounded transition-all duration-200',
              isHoverHighlight
                ? 'bg-indigo-200/50 border-2 border-indigo-400 border-dashed'
                : 'bg-amber-300/40 border-2 border-amber-500 animate-pulse'
            )}
            style={{
              left: `${highlightRegion.x ?? 5}%`,
              top: `${highlightRegion.y ?? 20}%`,
              width: `${highlightRegion.width ?? 90}%`,
              height: `${highlightRegion.height ?? 10}%`,
            }}
            data-testid="pdf-highlight-region"
            data-highlight-type={isHoverHighlight ? 'hover' : 'selected'}
          />
        )}

        {/* Hover indicator badge - shows field name on hover */}
        {highlightRegion && highlightRegion.pageNumber === currentPage && isHoverHighlight && highlightRegion.text && (
          <div
            className="absolute bg-indigo-600 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              left: `${highlightRegion.x ?? 5}%`,
              top: `${Math.max(0, (highlightRegion.y ?? 20) - 8)}%`,
            }}
            data-testid="pdf-hover-badge"
          >
            {highlightRegion.text}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex bg-zinc-100 border-l border-zinc-200',
        isExpanded ? 'w-full' : 'min-w-[350px]',
        className
      )}
      data-testid="pdf-preview-pane"
    >
      {/* PDF Viewer Section */}
      <div className={cn(
        'flex flex-col transition-all duration-300',
        showContextPanel ? 'flex-1 min-w-[280px]' : 'flex-1'
      )}>
        {/* Header with controls */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-zinc-200">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="text-sm font-medium text-zinc-700 truncate" title={documentName}>
              {documentName}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Zoom controls */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="h-8 w-8"
              data-testid="pdf-zoom-out-btn"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-zinc-500 w-10 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="h-8 w-8"
              data-testid="pdf-zoom-in-btn"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            {/* Context panel toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleContextPanel}
              className={cn(
                'h-8 w-8 ml-1',
                showContextPanel && 'bg-indigo-50 text-indigo-600'
              )}
              title={showContextPanel ? 'Hide source context' : 'Show source context'}
              data-testid="pdf-context-toggle-btn"
            >
              {showContextPanel ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRight className="w-4 h-4" />
              )}
            </Button>

            {/* Expand/collapse toggle */}
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExpand}
                className="h-8 w-8 ml-1"
                data-testid="pdf-expand-toggle-btn"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Page content area */}
        <div
          ref={pageContainerRef}
          className="flex-1 overflow-auto p-4 relative"
          data-testid="pdf-page-container"
        >
          {renderPageContent()}
          {renderInlineExcerpt()}
        </div>

        {/* Page navigation footer */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-t border-zinc-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            className="h-8 w-8"
            data-testid="pdf-prev-page-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            <Input
              value={pageInputValue}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="w-12 h-8 text-center text-sm px-1"
              data-testid="pdf-page-input"
            />
            <span className="text-sm text-zinc-500">of {totalPages}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="h-8 w-8"
            data-testid="pdf-next-page-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Source Context Panel - shows AI reasoning when field is selected */}
      {showContextPanel && (
        <div
          className="w-[280px] min-w-[250px] border-l border-zinc-200 bg-white flex flex-col animate-in slide-in-from-right-2 duration-300"
          data-testid="source-context-sidebar"
        >
          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-200">
            <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Source Context
            </h3>
          </div>
          <SourceContextPanel
            field={selectedField ?? null}
            className="flex-1 overflow-auto"
          />
        </div>
      )}
    </div>
  );
});
