'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Link2,
  Link2Off,
  Eye,
  EyeOff,
  Columns,
  Square,
  Maximize2,
  Minimize2,
  FileText,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PDFPageView } from './PDFPageView';
import type { PDFChangeRegion, PDFViewMode, PDFOverlayState, PDFDocumentInfo } from '../lib/pdf-overlay-types';
import { DEFAULT_PDF_OVERLAY_CONFIG } from '../lib/pdf-overlay-types';

interface PDFComparisonPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Document 1 info */
  doc1Info: PDFDocumentInfo;
  /** Document 2 info */
  doc2Info: PDFDocumentInfo;
  /** All change regions */
  changeRegions: PDFChangeRegion[];
  /** Currently focused change ID from structured view */
  focusedChangeId?: string | null;
  /** Callback when a highlight is clicked (navigates to structured data) */
  onHighlightClick?: (changeId: string) => void;
  /** Callback when focus changes */
  onFocusChange?: (changeId: string | null) => void;
}

/**
 * Side-by-side PDF comparison panel with synchronized scrolling
 */
export const PDFComparisonPanel = memo(function PDFComparisonPanel({
  isOpen,
  onClose,
  doc1Info,
  doc2Info,
  changeRegions,
  focusedChangeId: externalFocusedChangeId,
  onHighlightClick,
  onFocusChange,
}: PDFComparisonPanelProps) {
  const config = DEFAULT_PDF_OVERLAY_CONFIG;

  // Panel state
  const [state, setState] = useState<PDFOverlayState>({
    isOpen: false,
    viewMode: config.defaultViewMode,
    activeDocument: 'doc1',
    zoomLevel: config.defaultZoomLevel,
    showHighlights: config.showHighlights,
    focusedChangeId: null,
    scrollSync: {
      enabled: config.enableSyncScroll,
      initiator: null,
      scrollPercent: 0,
    },
    doc1Page: 1,
    doc2Page: 1,
  });

  // Use external focused change if provided
  const focusedChangeId = externalFocusedChangeId ?? state.focusedChangeId;

  // Scroll containers refs
  const doc1ScrollRef = useRef<HTMLDivElement>(null);
  const doc2ScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Hover state for change preview
  const [hoveredChangeId, setHoveredChangeId] = useState<string | null>(null);

  // Get the focused or hovered change for the tooltip
  const activeChange = changeRegions.find(
    (r) => r.changeId === (hoveredChangeId ?? focusedChangeId)
  );

  // Handle synchronized scrolling
  const handleScroll = useCallback(
    (source: 'doc1' | 'doc2') => {
      if (!state.scrollSync.enabled || isScrollingRef.current) return;

      const sourceRef = source === 'doc1' ? doc1ScrollRef : doc2ScrollRef;
      const targetRef = source === 'doc1' ? doc2ScrollRef : doc1ScrollRef;

      if (!sourceRef.current || !targetRef.current) return;

      isScrollingRef.current = true;

      const sourceScroll = sourceRef.current;
      const targetScroll = targetRef.current;

      // Calculate scroll percentage
      const scrollPercent =
        sourceScroll.scrollTop / (sourceScroll.scrollHeight - sourceScroll.clientHeight);

      // Apply to target
      targetScroll.scrollTop =
        scrollPercent * (targetScroll.scrollHeight - targetScroll.clientHeight);

      // Reset flag after animation frame
      requestAnimationFrame(() => {
        isScrollingRef.current = false;
      });
    },
    [state.scrollSync.enabled]
  );

  // Navigate to a specific change
  const navigateToChange = useCallback(
    (changeId: string) => {
      const change = changeRegions.find((r) => r.changeId === changeId);
      if (!change) return;

      // Update page numbers based on the change location
      if (change.doc1Region) {
        setState((s) => ({ ...s, doc1Page: change.doc1Region!.page }));
      }
      if (change.doc2Region) {
        setState((s) => ({ ...s, doc2Page: change.doc2Region!.page }));
      }

      // Set focus
      setState((s) => ({ ...s, focusedChangeId: changeId }));
      onFocusChange?.(changeId);
    },
    [changeRegions, onFocusChange]
  );

  // Navigate to previous/next change
  const navigateChange = useCallback(
    (direction: 'prev' | 'next') => {
      const currentIndex = changeRegions.findIndex((r) => r.changeId === focusedChangeId);
      let newIndex: number;

      if (direction === 'next') {
        newIndex = currentIndex < changeRegions.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : changeRegions.length - 1;
      }

      navigateToChange(changeRegions[newIndex].changeId);
    },
    [changeRegions, focusedChangeId, navigateToChange]
  );

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    setState((s) => ({
      ...s,
      zoomLevel: Math.min(config.maxZoom, Math.max(config.minZoom, s.zoomLevel + delta)),
    }));
  }, [config.maxZoom, config.minZoom]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!panelRef.current) return;

    if (!isFullscreen) {
      panelRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          navigateChange('next');
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          navigateChange('prev');
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoom(config.zoomStep);
          break;
        case '-':
          e.preventDefault();
          handleZoom(-config.zoomStep);
          break;
        case 'h':
          setState((s) => ({ ...s, showHighlights: !s.showHighlights }));
          break;
        case 's':
          setState((s) => ({
            ...s,
            scrollSync: { ...s.scrollSync, enabled: !s.scrollSync.enabled },
          }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose, navigateChange, handleZoom, config.zoomStep]);

  // When focused change changes externally, navigate to it
  useEffect(() => {
    if (externalFocusedChangeId && isOpen) {
      navigateToChange(externalFocusedChangeId);
    }
  }, [externalFocusedChangeId, isOpen, navigateToChange]);

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <div
        ref={panelRef}
        className={cn(
          'fixed inset-0 z-50 bg-zinc-900/95 flex flex-col',
          'animate-in fade-in duration-300'
        )}
        data-testid="pdf-comparison-panel"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
          <div className="flex items-center gap-4">
            {/* Document titles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white font-medium truncate max-w-[200px]">
                  {doc1Info.filename}
                </span>
                <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                  {doc1Info.totalPages} pages
                </Badge>
              </div>
              <span className="text-zinc-500">vs</span>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white font-medium truncate max-w-[200px]">
                  {doc2Info.filename}
                </span>
                <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                  {doc2Info.totalPages} pages
                </Badge>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Change navigation */}
            <div className="flex items-center gap-1 mr-4 bg-zinc-700/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-600"
                    onClick={() => navigateChange('prev')}
                    data-testid="pdf-prev-change-btn"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous change (K)</TooltipContent>
              </Tooltip>

              <span className="text-xs text-zinc-400 px-2">
                {focusedChangeId
                  ? `${changeRegions.findIndex((r) => r.changeId === focusedChangeId) + 1}/${changeRegions.length}`
                  : `${changeRegions.length} changes`}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-600"
                    onClick={() => navigateChange('next')}
                    data-testid="pdf-next-change-btn"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next change (J)</TooltipContent>
              </Tooltip>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-zinc-700/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-600"
                    onClick={() => handleZoom(-config.zoomStep)}
                    disabled={state.zoomLevel <= config.minZoom}
                    data-testid="pdf-zoom-out-btn"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out (-)</TooltipContent>
              </Tooltip>

              <span className="text-xs text-zinc-400 px-2 min-w-[45px] text-center">
                {state.zoomLevel}%
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-600"
                    onClick={() => handleZoom(config.zoomStep)}
                    disabled={state.zoomLevel >= config.maxZoom}
                    data-testid="pdf-zoom-in-btn"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom in (+)</TooltipContent>
              </Tooltip>
            </div>

            {/* Toggle buttons */}
            <div className="flex items-center gap-1 bg-zinc-700/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8',
                      state.scrollSync.enabled
                        ? 'text-green-400 hover:text-green-300'
                        : 'text-zinc-400 hover:text-zinc-300',
                      'hover:bg-zinc-600'
                    )}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        scrollSync: { ...s.scrollSync, enabled: !s.scrollSync.enabled },
                      }))
                    }
                    data-testid="pdf-sync-scroll-btn"
                  >
                    {state.scrollSync.enabled ? (
                      <Link2 className="w-4 h-4" />
                    ) : (
                      <Link2Off className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {state.scrollSync.enabled ? 'Sync scrolling ON' : 'Sync scrolling OFF'} (S)
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8',
                      state.showHighlights
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-zinc-400 hover:text-zinc-300',
                      'hover:bg-zinc-600'
                    )}
                    onClick={() => setState((s) => ({ ...s, showHighlights: !s.showHighlights }))}
                    data-testid="pdf-toggle-highlights-btn"
                  >
                    {state.showHighlights ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {state.showHighlights ? 'Hide highlights' : 'Show highlights'} (H)
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-600"
                    onClick={toggleFullscreen}
                    data-testid="pdf-fullscreen-btn"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
              </Tooltip>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-600 ml-2"
              onClick={onClose}
              data-testid="pdf-close-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document 1 Panel */}
          <div className="flex-1 flex flex-col border-r border-zinc-700">
            <div className="px-4 py-2 bg-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-zinc-300">Original</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-white"
                  onClick={() => setState((s) => ({ ...s, doc1Page: Math.max(1, s.doc1Page - 1) }))}
                  disabled={state.doc1Page <= 1}
                  data-testid="pdf-doc1-prev-page-btn"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-zinc-400">
                  {state.doc1Page} / {doc1Info.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-white"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      doc1Page: Math.min(doc1Info.totalPages, s.doc1Page + 1),
                    }))
                  }
                  disabled={state.doc1Page >= doc1Info.totalPages}
                  data-testid="pdf-doc1-next-page-btn"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div
              ref={doc1ScrollRef}
              className="flex-1 overflow-auto p-6 flex justify-center"
              onScroll={() => handleScroll('doc1')}
              data-testid="pdf-doc1-scroll-container"
            >
              <PDFPageView
                documentId={doc1Info.id}
                pageNumber={state.doc1Page}
                totalPages={doc1Info.totalPages}
                documentSide="doc1"
                filename={doc1Info.filename}
                changeRegions={changeRegions}
                focusedChangeId={focusedChangeId}
                showHighlights={state.showHighlights}
                zoomLevel={state.zoomLevel}
                onHighlightClick={(changeId) => {
                  onHighlightClick?.(changeId);
                  setState((s) => ({ ...s, focusedChangeId: changeId }));
                }}
                onHighlightHover={setHoveredChangeId}
              />
            </div>
          </div>

          {/* Document 2 Panel */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm font-medium text-zinc-300">Amendment</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-white"
                  onClick={() => setState((s) => ({ ...s, doc2Page: Math.max(1, s.doc2Page - 1) }))}
                  disabled={state.doc2Page <= 1}
                  data-testid="pdf-doc2-prev-page-btn"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-zinc-400">
                  {state.doc2Page} / {doc2Info.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-white"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      doc2Page: Math.min(doc2Info.totalPages, s.doc2Page + 1),
                    }))
                  }
                  disabled={state.doc2Page >= doc2Info.totalPages}
                  data-testid="pdf-doc2-next-page-btn"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div
              ref={doc2ScrollRef}
              className="flex-1 overflow-auto p-6 flex justify-center"
              onScroll={() => handleScroll('doc2')}
              data-testid="pdf-doc2-scroll-container"
            >
              <PDFPageView
                documentId={doc2Info.id}
                pageNumber={state.doc2Page}
                totalPages={doc2Info.totalPages}
                documentSide="doc2"
                filename={doc2Info.filename}
                changeRegions={changeRegions}
                focusedChangeId={focusedChangeId}
                showHighlights={state.showHighlights}
                zoomLevel={state.zoomLevel}
                onHighlightClick={(changeId) => {
                  onHighlightClick?.(changeId);
                  setState((s) => ({ ...s, focusedChangeId: changeId }));
                }}
                onHighlightHover={setHoveredChangeId}
              />
            </div>
          </div>
        </div>

        {/* Change info tooltip at bottom */}
        {activeChange && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl px-4 py-3 max-w-md animate-in slide-in-from-bottom-2"
            data-testid="pdf-change-tooltip"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-3 h-3 rounded-full mt-0.5 flex-shrink-0',
                  activeChange.changeType === 'added' && 'bg-green-500',
                  activeChange.changeType === 'modified' && 'bg-blue-500',
                  activeChange.changeType === 'removed' && 'bg-red-500'
                )}
              />
              <div>
                <p className="text-sm font-medium text-white">{activeChange.fieldName}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{activeChange.category}</p>
                {activeChange.description && (
                  <p className="text-xs text-zinc-300 mt-1">{activeChange.description}</p>
                )}
                <p className="text-xs text-zinc-500 mt-2">
                  Click to view in structured comparison →
                </p>
              </div>
              {activeChange.severity && activeChange.severity !== 'low' && (
                <Badge
                  className={cn(
                    'text-xs',
                    activeChange.severity === 'medium' && 'bg-amber-500/20 text-amber-400',
                    activeChange.severity === 'high' && 'bg-orange-500/20 text-orange-400',
                    activeChange.severity === 'critical' && 'bg-red-500/20 text-red-400'
                  )}
                >
                  {activeChange.severity}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-4 right-4 text-xs text-zinc-500">
          Press <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-400">?</kbd> for
          shortcuts
        </div>
      </div>
    </TooltipProvider>
  );
});
