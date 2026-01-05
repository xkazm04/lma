'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import type { PDFChangeRegion, PDFHighlightBox } from '../lib/pdf-overlay-types';
import { CHANGE_HIGHLIGHT_COLORS, SEVERITY_INTENSITY } from '../lib/pdf-overlay-types';

interface PDFHighlightOverlayProps {
  /** The change region to highlight */
  region: PDFChangeRegion;
  /** Which document side this is for */
  documentSide: 'doc1' | 'doc2';
  /** Whether this highlight is currently focused */
  isFocused?: boolean;
  /** Whether highlights should be visible */
  showHighlights?: boolean;
  /** Callback when highlight is clicked */
  onClick?: (changeId: string) => void;
  /** Callback when mouse enters highlight */
  onMouseEnter?: (changeId: string) => void;
  /** Callback when mouse leaves highlight */
  onMouseLeave?: () => void;
}

/**
 * Renders a colored highlight overlay on a PDF page region
 */
export const PDFHighlightOverlay = memo(function PDFHighlightOverlay({
  region,
  documentSide,
  isFocused = false,
  showHighlights = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: PDFHighlightOverlayProps) {
  const box: PDFHighlightBox | null = documentSide === 'doc1' ? region.doc1Region : region.doc2Region;

  if (!box || !showHighlights) {
    return null;
  }

  const colors = CHANGE_HIGHLIGHT_COLORS[region.changeType];
  const severityIntensity = region.severity ? SEVERITY_INTENSITY[region.severity] : 0.2;

  // Calculate fill color with severity-based intensity
  const getFillColor = () => {
    if (isFocused) {
      return colors.hoverFill;
    }
    // Adjust opacity based on severity
    const baseColor = colors.fill;
    // Parse and adjust opacity
    const match = baseColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${severityIntensity})`;
    }
    return colors.fill;
  };

  return (
    <div
      className={cn(
        'absolute cursor-pointer transition-all duration-200 rounded-sm',
        'hover:shadow-md hover:z-10',
        isFocused && 'ring-2 ring-offset-1 z-20 animate-pulse',
        region.changeType === 'added' && isFocused && 'ring-green-500',
        region.changeType === 'modified' && isFocused && 'ring-blue-500',
        region.changeType === 'removed' && isFocused && 'ring-red-500'
      )}
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
        backgroundColor: getFillColor(),
        borderLeft: `3px solid ${colors.stroke}`,
        borderTop: `1px solid ${colors.stroke}`,
        borderBottom: `1px solid ${colors.stroke}`,
        borderRight: `1px solid ${colors.stroke}`,
      }}
      onClick={() => onClick?.(region.changeId)}
      onMouseEnter={() => onMouseEnter?.(region.changeId)}
      onMouseLeave={onMouseLeave}
      data-testid={`pdf-highlight-${region.changeId}-${documentSide}`}
      data-change-id={region.changeId}
      data-change-type={region.changeType}
      data-severity={region.severity}
      role="button"
      aria-label={`${region.changeType} change: ${region.fieldName}. ${region.description || ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(region.changeId);
        }
      }}
    >
      {/* Severity indicator dot */}
      {region.severity && region.severity !== 'low' && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm',
            region.severity === 'medium' && 'bg-amber-500',
            region.severity === 'high' && 'bg-orange-500',
            region.severity === 'critical' && 'bg-red-500'
          )}
          data-testid={`severity-indicator-${region.changeId}`}
        />
      )}
    </div>
  );
});

interface PDFHighlightLayerProps {
  /** All change regions for this page */
  regions: PDFChangeRegion[];
  /** Which document side this layer is for */
  documentSide: 'doc1' | 'doc2';
  /** Currently focused change ID */
  focusedChangeId?: string | null;
  /** Whether highlights are visible */
  showHighlights?: boolean;
  /** Callback when a highlight is clicked */
  onHighlightClick?: (changeId: string) => void;
  /** Callback when hovering a highlight */
  onHighlightHover?: (changeId: string | null) => void;
}

/**
 * Renders all highlight overlays for a single PDF page
 */
export const PDFHighlightLayer = memo(function PDFHighlightLayer({
  regions,
  documentSide,
  focusedChangeId,
  showHighlights = true,
  onHighlightClick,
  onHighlightHover,
}: PDFHighlightLayerProps) {
  if (!showHighlights || regions.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      data-testid={`pdf-highlight-layer-${documentSide}`}
    >
      {regions.map((region) => (
        <div key={region.changeId} className="pointer-events-auto">
          <PDFHighlightOverlay
            region={region}
            documentSide={documentSide}
            isFocused={focusedChangeId === region.changeId}
            showHighlights={showHighlights}
            onClick={onHighlightClick}
            onMouseEnter={(changeId) => onHighlightHover?.(changeId)}
            onMouseLeave={() => onHighlightHover?.(null)}
          />
        </div>
      ))}
    </div>
  );
});
