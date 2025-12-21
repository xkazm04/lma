/**
 * Shared constants for documents feature
 */

import { FileText, FileType, File, CheckCircle, AlertTriangle, Loader2, Clock, XCircle, type LucideIcon } from 'lucide-react';
import type { DocumentStatusFilter, DocumentTypeFilter } from './types';

/**
 * Document status configuration - single source of truth for status display
 */
export interface DocumentStatusConfig {
    variant: 'success' | 'default' | 'warning' | 'destructive' | 'secondary';
    icon: LucideIcon;
    label: string;
    color: string;
}

export const DOCUMENT_STATUS_CONFIG: Record<string, DocumentStatusConfig> = {
    completed: { variant: 'success', icon: CheckCircle, label: 'Completed', color: 'text-green-600' },
    processing: { variant: 'default', icon: Loader2, label: 'Processing', color: 'text-blue-600' },
    review_required: { variant: 'warning', icon: AlertTriangle, label: 'Review', color: 'text-orange-600' },
    failed: { variant: 'destructive', icon: XCircle, label: 'Failed', color: 'text-red-600' },
    pending: { variant: 'secondary', icon: Clock, label: 'Pending', color: 'text-zinc-600' },
} as const;

/**
 * Returns status configuration for a given status string
 * @param status - Document processing status
 */
export function getStatusConfig(status: string): DocumentStatusConfig {
    return DOCUMENT_STATUS_CONFIG[status] ?? DOCUMENT_STATUS_CONFIG.pending;
}

/**
 * Document type icon mapping - single source of truth for document type icons
 */
export const DOCUMENT_TYPE_ICONS: Record<string, LucideIcon> = {
    facility_agreement: FileText,
    amendment: FileType,
} as const;

const DEFAULT_DOCUMENT_ICON = File;

/**
 * Returns the icon component for a given document type
 * @param type - Document type string
 */
export function getDocumentTypeIcon(type: string): LucideIcon {
    return DOCUMENT_TYPE_ICONS[type] ?? DEFAULT_DOCUMENT_ICON;
}

export const DOCUMENT_STATUS_OPTIONS: { label: string; value: DocumentStatusFilter }[] = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' },
    { label: 'Review Required', value: 'review_required' },
];

export const DOCUMENT_TYPE_OPTIONS: { label: string; value: DocumentTypeFilter }[] = [
    { label: 'All Types', value: 'all' },
    { label: 'Facility Agreement', value: 'facility_agreement' },
    { label: 'Amendment', value: 'amendment' },
    { label: 'Consent', value: 'consent' },
    { label: 'Assignment', value: 'assignment' },
    { label: 'Other', value: 'other' },
];

/**
 * Unified Confidence Threshold Configuration
 *
 * Single source of truth for confidence-based field flagging.
 * All components should import from this file for consistent behavior.
 *
 * Threshold Levels (decimal values 0-1):
 * - TRUSTED (>= 0.85): High confidence. No flagging required.
 * - REVIEW_OPTIONAL (0.70-0.84): Medium confidence. Review recommended but optional.
 * - AUTO_FLAG (< 0.70): Low confidence. Automatically flagged for mandatory review.
 * - REJECT (< 0.30): Too unreliable. Consider marking as "unable to extract".
 */
export const CONFIDENCE_THRESHOLDS = {
    /** Fields at or above 85% are trusted and don't require flagging */
    TRUSTED: 0.85,
    /** Fields between 70-85% may benefit from optional review */
    REVIEW_OPTIONAL: 0.70,
    /** @deprecated Use REVIEW_OPTIONAL instead */
    OPTIONAL_REVIEW: 0.70,
    /** Fields below 70% are auto-flagged for mandatory review */
    AUTO_FLAG: 0.70,
    /** Fields below 30% may be too unreliable to display */
    REJECT: 0.30,
} as const;

/**
 * Display thresholds for visual confidence indicators (percentage values 0-100)
 * Used by UI components for color coding (green/amber/red)
 */
export const CONFIDENCE_DISPLAY_THRESHOLDS = {
    /** High confidence visual threshold (>= 85%) - Green display */
    HIGH: 85,
    /** Medium confidence visual threshold (>= 70%) - Amber display */
    MEDIUM: 70,
} as const;

/**
 * Returns CSS color class based on confidence level
 * @param confidence - Confidence score between 0 and 1
 */
export function getConfidenceColorClass(confidence: number | null | undefined): string {
    if (confidence === null || confidence === undefined) return 'bg-zinc-200';
    const percentage = confidence * 100;
    if (percentage >= CONFIDENCE_DISPLAY_THRESHOLDS.HIGH) return 'bg-green-500';
    if (percentage >= CONFIDENCE_DISPLAY_THRESHOLDS.MEDIUM) return 'bg-amber-500';
    return 'bg-red-500';
}
