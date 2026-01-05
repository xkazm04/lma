'use client';

import React, { memo, forwardRef } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFHighlightLayer } from './PDFHighlightOverlay';
import type { PDFChangeRegion } from '../lib/pdf-overlay-types';

interface PDFPageViewProps {
  /** Document ID */
  documentId: string;
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Total pages in document */
  totalPages: number;
  /** Document side for labeling */
  documentSide: 'doc1' | 'doc2';
  /** Document filename */
  filename?: string;
  /** Change regions for this page */
  changeRegions: PDFChangeRegion[];
  /** Currently focused change ID */
  focusedChangeId?: string | null;
  /** Whether highlights are visible */
  showHighlights?: boolean;
  /** Zoom level (percentage) */
  zoomLevel?: number;
  /** Callback when a highlight is clicked */
  onHighlightClick?: (changeId: string) => void;
  /** Callback when hovering a highlight */
  onHighlightHover?: (changeId: string | null) => void;
  /** Whether this is loading */
  isLoading?: boolean;
  /** Error message if any */
  error?: string | null;
}

/**
 * Renders a single PDF page with highlight overlays
 * For demo purposes, shows a mock PDF representation
 */
export const PDFPageView = memo(
  forwardRef<HTMLDivElement, PDFPageViewProps>(function PDFPageView(
    {
      documentId,
      pageNumber,
      totalPages,
      documentSide,
      filename = 'Document',
      changeRegions,
      focusedChangeId,
      showHighlights = true,
      zoomLevel = 100,
      onHighlightClick,
      onHighlightHover,
      isLoading = false,
      error = null,
    },
    ref
  ) {
    const scale = zoomLevel / 100;

    // Filter regions for this page
    const pageRegions = changeRegions.filter((region) => {
      const box = documentSide === 'doc1' ? region.doc1Region : region.doc2Region;
      return box?.page === pageNumber;
    });

    // Count changes by type for this page
    const changesByType = {
      added: pageRegions.filter((r) => r.changeType === 'added').length,
      modified: pageRegions.filter((r) => r.changeType === 'modified').length,
      removed: pageRegions.filter((r) => r.changeType === 'removed').length,
    };

    const hasChanges = pageRegions.length > 0;

    if (error) {
      return (
        <div
          ref={ref}
          className="flex flex-col items-center justify-center h-[600px] bg-zinc-100 rounded-lg border border-zinc-200"
          data-testid={`pdf-page-error-${documentSide}-${pageNumber}`}
        >
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-sm text-red-600 font-medium">Failed to load page</p>
          <p className="text-xs text-zinc-500 mt-1">{error}</p>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative bg-white rounded-lg border shadow-sm transition-transform origin-top-left',
          hasChanges && 'ring-1 ring-indigo-100'
        )}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
        data-testid={`pdf-page-${documentSide}-${pageNumber}`}
        data-page-number={pageNumber}
        data-has-changes={hasChanges}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-30 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs text-zinc-500 mt-2">Loading page...</p>
            </div>
          </div>
        )}

        {/* Mock PDF page content - simulates actual PDF display */}
        <div
          className="relative w-[595px] min-h-[842px] bg-white"
          data-testid={`pdf-page-content-${documentSide}-${pageNumber}`}
        >
          {/* Page header with watermark styling */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-xs text-zinc-400 bg-gradient-to-b from-zinc-50/80 to-transparent">
            <span className="font-mono">{filename}</span>
            <span className="font-mono">Page {pageNumber} of {totalPages}</span>
          </div>

          {/* Mock PDF document content - styled like a legal document */}
          <div className="pt-12 px-12 pb-8">
            {/* Document title area */}
            {pageNumber === 1 && (
              <div className="text-center mb-8 border-b border-zinc-200 pb-6">
                <h1 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">
                  {documentSide === 'doc1' ? 'Credit Agreement' : 'First Amendment to Credit Agreement'}
                </h1>
                <p className="text-xs text-zinc-500 mt-2">
                  {documentSide === 'doc1' ? 'Dated as of November 15, 2024' : 'Dated as of December 6, 2024'}
                </p>
              </div>
            )}

            {/* Mock document text lines */}
            <div className="space-y-3">
              {Array.from({ length: 20 }).map((_, i) => {
                // Use deterministic pseudo-random based on index and page
                const seed = (pageNumber * 100 + i) * 9301 + 49297;
                const widthVariation = ((seed % 35) + 60);
                const opacityVariation = (((seed * 7) % 30) / 100) + 0.4;
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex',
                      i % 5 === 0 && 'mt-6'
                    )}
                  >
                    {/* Section number */}
                    {i % 5 === 0 && (
                      <span className="text-xs font-semibold text-zinc-700 w-12 flex-shrink-0">
                        {Math.floor((pageNumber - 1) * 4 + i / 5) + 1}.{(i % 5) + 1}
                      </span>
                    )}
                    {/* Text line - varying lengths for realism */}
                    <div
                      className={cn(
                        'h-3 bg-zinc-200 rounded-sm',
                        i % 5 === 0 && 'ml-0',
                        i % 5 !== 0 && 'ml-12'
                      )}
                      style={{
                        width: `${widthVariation}%`,
                        opacity: opacityVariation,
                      }}
                    />
                  </div>
                );
              })}

              {/* Add some paragraph breaks */}
              <div className="h-6" />

              {Array.from({ length: 15 }).map((_, i) => {
                // Use deterministic pseudo-random based on index and page
                const seed = (pageNumber * 100 + i + 50) * 9301 + 49297;
                const widthVariation = ((seed % 40) + 55);
                const opacityVariation = (((seed * 7) % 30) / 100) + 0.4;
                return (
                  <div
                    key={`p2-${i}`}
                    className={cn(
                      'flex',
                      i % 4 === 0 && 'mt-4'
                    )}
                  >
                    {i % 4 === 0 && (
                      <span className="text-xs font-semibold text-zinc-700 w-12 flex-shrink-0">
                        {Math.floor((pageNumber - 1) * 4 + 4 + i / 4) + 1}.{(i % 4) + 1}
                      </span>
                    )}
                    <div
                      className={cn(
                        'h-3 bg-zinc-200 rounded-sm',
                        i % 4 === 0 && 'ml-0',
                        i % 4 !== 0 && 'ml-12'
                      )}
                      style={{
                        width: `${widthVariation}%`,
                        opacity: opacityVariation,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-zinc-400 border-t border-zinc-100 bg-gradient-to-t from-zinc-50/80 to-transparent">
            <span className="font-mono">CONFIDENTIAL</span>
          </div>

          {/* Highlight overlays */}
          <PDFHighlightLayer
            regions={pageRegions}
            documentSide={documentSide}
            focusedChangeId={focusedChangeId}
            showHighlights={showHighlights}
            onHighlightClick={onHighlightClick}
            onHighlightHover={onHighlightHover}
          />
        </div>

        {/* Change indicator badge */}
        {hasChanges && (
          <div
            className="absolute -top-2 -right-2 flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-md border border-zinc-200 z-20"
            data-testid={`page-changes-badge-${documentSide}-${pageNumber}`}
          >
            {changesByType.added > 0 && (
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center justify-center">
                +{changesByType.added}
              </span>
            )}
            {changesByType.modified > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center">
                ~{changesByType.modified}
              </span>
            )}
            {changesByType.removed > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-medium flex items-center justify-center">
                -{changesByType.removed}
              </span>
            )}
          </div>
        )}
      </div>
    );
  })
);
