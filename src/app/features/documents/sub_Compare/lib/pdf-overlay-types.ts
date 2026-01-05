// Types for the Side-by-Side PDF Overlay feature

/**
 * Represents a bounding box for a highlighted region on a PDF page.
 * All values are percentages (0-100) relative to page dimensions.
 */
export interface PDFHighlightBox {
  /** Unique identifier for this highlight */
  id: string;
  /** Page number (1-indexed) */
  page: number;
  /** X position as percentage from left edge */
  x: number;
  /** Y position as percentage from top edge */
  y: number;
  /** Width as percentage of page width */
  width: number;
  /** Height as percentage of page height */
  height: number;
}

/**
 * Severity level for change highlighting
 */
export type ChangeHighlightSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Represents a change region on a PDF document
 */
export interface PDFChangeRegion {
  /** Unique identifier for this change (matches comparison changeId) */
  changeId: string;
  /** The field name for this change */
  fieldName: string;
  /** Category of the change (e.g., "Financial Terms") */
  category: string;
  /** Type of change */
  changeType: 'added' | 'modified' | 'removed';
  /** Bounding box on document 1 (null if added) */
  doc1Region: PDFHighlightBox | null;
  /** Bounding box on document 2 (null if removed) */
  doc2Region: PDFHighlightBox | null;
  /** Risk severity for color coding */
  severity?: ChangeHighlightSeverity;
  /** Brief description of the change */
  description?: string;
}

/**
 * PDF document metadata
 */
export interface PDFDocumentInfo {
  /** Document ID */
  id: string;
  /** Original filename */
  filename: string;
  /** Total number of pages */
  totalPages: number;
  /** File size in bytes */
  fileSize?: number;
  /** Date uploaded */
  uploadedAt?: string;
}

/**
 * Scroll position sync state
 */
export interface ScrollSyncState {
  /** Whether sync scrolling is enabled */
  enabled: boolean;
  /** Which panel initiated the scroll (to prevent feedback loops) */
  initiator: 'doc1' | 'doc2' | null;
  /** Current scroll percentage (0-100) */
  scrollPercent: number;
}

/**
 * View mode for the PDF overlay
 */
export type PDFViewMode = 'side-by-side' | 'overlay' | 'single';

/**
 * State for the PDF overlay panel
 */
export interface PDFOverlayState {
  /** Whether the PDF overlay is visible */
  isOpen: boolean;
  /** Current view mode */
  viewMode: PDFViewMode;
  /** Currently active document in single view mode */
  activeDocument: 'doc1' | 'doc2';
  /** Current zoom level (percentage) */
  zoomLevel: number;
  /** Whether highlights are visible */
  showHighlights: boolean;
  /** Currently focused change (for navigation) */
  focusedChangeId: string | null;
  /** Scroll sync state */
  scrollSync: ScrollSyncState;
  /** Current page for doc1 */
  doc1Page: number;
  /** Current page for doc2 */
  doc2Page: number;
}

/**
 * PDF overlay toolbar options
 */
export interface PDFToolbarConfig {
  /** Show zoom controls */
  showZoomControls: boolean;
  /** Show page navigation */
  showPageNavigation: boolean;
  /** Show highlight toggle */
  showHighlightToggle: boolean;
  /** Show sync scroll toggle */
  showSyncScrollToggle: boolean;
  /** Show view mode toggle */
  showViewModeToggle: boolean;
  /** Show fullscreen toggle */
  showFullscreenToggle: boolean;
}

/**
 * Configuration for the PDF overlay component
 */
export interface PDFOverlayConfig {
  /** Default view mode */
  defaultViewMode: PDFViewMode;
  /** Default zoom level */
  defaultZoomLevel: number;
  /** Enable synchronized scrolling by default */
  enableSyncScroll: boolean;
  /** Show highlights by default */
  showHighlights: boolean;
  /** Toolbar configuration */
  toolbar: PDFToolbarConfig;
  /** Minimum zoom level */
  minZoom: number;
  /** Maximum zoom level */
  maxZoom: number;
  /** Zoom step size */
  zoomStep: number;
}

/**
 * Default configuration for PDF overlay
 */
export const DEFAULT_PDF_OVERLAY_CONFIG: PDFOverlayConfig = {
  defaultViewMode: 'side-by-side',
  defaultZoomLevel: 100,
  enableSyncScroll: true,
  showHighlights: true,
  toolbar: {
    showZoomControls: true,
    showPageNavigation: true,
    showHighlightToggle: true,
    showSyncScrollToggle: true,
    showViewModeToggle: true,
    showFullscreenToggle: true,
  },
  minZoom: 50,
  maxZoom: 300,
  zoomStep: 25,
};

/**
 * Color configuration for change highlights
 */
export const CHANGE_HIGHLIGHT_COLORS = {
  added: {
    fill: 'rgba(34, 197, 94, 0.2)', // green-500 with opacity
    stroke: 'rgba(22, 163, 74, 0.8)', // green-600
    hoverFill: 'rgba(34, 197, 94, 0.35)',
  },
  modified: {
    fill: 'rgba(59, 130, 246, 0.2)', // blue-500 with opacity
    stroke: 'rgba(37, 99, 235, 0.8)', // blue-600
    hoverFill: 'rgba(59, 130, 246, 0.35)',
  },
  removed: {
    fill: 'rgba(239, 68, 68, 0.2)', // red-500 with opacity
    stroke: 'rgba(220, 38, 38, 0.8)', // red-600
    hoverFill: 'rgba(239, 68, 68, 0.35)',
  },
} as const;

/**
 * Severity-based highlight intensity
 */
export const SEVERITY_INTENSITY = {
  low: 0.15,
  medium: 0.25,
  high: 0.35,
  critical: 0.45,
} as const;
