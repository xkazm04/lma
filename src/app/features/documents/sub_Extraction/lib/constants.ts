/**
 * Confidence Threshold Configuration for Extraction
 *
 * This module re-exports from the unified constants and provides
 * extraction-specific helper functions for confidence-based field flagging.
 *
 * IMPORTANT: All threshold values come from '@/app/features/documents/lib/constants'
 * which is the single source of truth for confidence thresholds.
 *
 * Threshold Levels:
 * - TRUSTED (>= 85%): High confidence extraction. No flagging required.
 * - REVIEW_OPTIONAL (70-84%): Medium confidence. Review is optional but recommended.
 * - AUTO_FLAG (< 70%): Low confidence. Automatically flagged for mandatory review.
 * - REJECT (< 30%): Too unreliable. Consider marking as "unable to extract".
 */

// Import unified constants for local use
import {
  CONFIDENCE_THRESHOLDS as _CONFIDENCE_THRESHOLDS,
  CONFIDENCE_DISPLAY_THRESHOLDS as _CONFIDENCE_DISPLAY_THRESHOLDS,
  getConfidenceColorClass as _getConfidenceColorClass,
} from '../../lib/constants';

// Re-export unified constants from the single source of truth
export const CONFIDENCE_THRESHOLDS = _CONFIDENCE_THRESHOLDS;
export const CONFIDENCE_DISPLAY_THRESHOLDS = _CONFIDENCE_DISPLAY_THRESHOLDS;
export const getConfidenceColorClass = _getConfidenceColorClass;

/**
 * Flag status for extraction fields
 */
export type FlagStatus = 'auto_flagged' | 'optional_review' | 'trusted';

/**
 * Determines the flagging status for a field based on its confidence score.
 *
 * @param confidence - Confidence score between 0 and 1
 * @returns The flag status based on defined thresholds
 *
 * @example
 * getFlagStatus(0.92) // 'trusted'
 * getFlagStatus(0.78) // 'optional_review'
 * getFlagStatus(0.65) // 'auto_flagged'
 */
export function getFlagStatus(confidence: number): FlagStatus {
  if (confidence >= CONFIDENCE_THRESHOLDS.TRUSTED) {
    return 'trusted';
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.OPTIONAL_REVIEW) {
    return 'optional_review';
  }
  return 'auto_flagged';
}

/**
 * Determines if a field should be automatically flagged for review.
 *
 * Fields with confidence below 70% are auto-flagged.
 *
 * @param confidence - Confidence score between 0 and 1
 * @returns true if the field should be flagged, false otherwise
 *
 * @example
 * shouldAutoFlag(0.65) // true - below 70%
 * shouldAutoFlag(0.72) // false - above 70%
 * shouldAutoFlag(0.70) // false - exactly at threshold (not flagged)
 */
export function shouldAutoFlag(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLDS.AUTO_FLAG;
}

/**
 * Determines if a field is in the optional review range.
 *
 * Fields with confidence between 70% and 85% are in optional review range.
 *
 * @param confidence - Confidence score between 0 and 1
 * @returns true if the field is in optional review range
 *
 * @example
 * isOptionalReview(0.78) // true - between 70% and 85%
 * isOptionalReview(0.65) // false - below 70%
 * isOptionalReview(0.90) // false - above 85%
 */
export function isOptionalReview(confidence: number): boolean {
  return (
    confidence >= CONFIDENCE_THRESHOLDS.OPTIONAL_REVIEW &&
    confidence < CONFIDENCE_THRESHOLDS.TRUSTED
  );
}

/**
 * Determines if a field is trusted (high confidence).
 *
 * Fields with confidence at or above 85% are considered trusted.
 *
 * @param confidence - Confidence score between 0 and 1
 * @returns true if the field is trusted
 *
 * @example
 * isTrusted(0.92) // true
 * isTrusted(0.85) // true - exactly at threshold
 * isTrusted(0.78) // false
 */
export function isTrusted(confidence: number): boolean {
  return confidence >= CONFIDENCE_THRESHOLDS.TRUSTED;
}

/**
 * Determines if a confidence score is too low for reliable extraction.
 *
 * Fields below 30% confidence may be too unreliable to display.
 *
 * @param confidence - Confidence score between 0 and 1
 * @returns true if confidence is below rejection threshold
 */
export function shouldReject(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLDS.REJECT;
}
