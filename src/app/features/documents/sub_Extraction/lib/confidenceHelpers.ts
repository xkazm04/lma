import {
  CONFIDENCE_THRESHOLDS,
  CONFIDENCE_DISPLAY_THRESHOLDS,
  shouldAutoFlag,
  getFlagStatus,
  type FlagStatus,
} from './constants';

/**
 * Confidence level for visual display purposes.
 * - 'high': >= 90% - Green styling
 * - 'medium': 70-89% - Amber styling
 * - 'low': < 70% - Red styling (auto-flagged for review)
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Returns the confidence level for visual display based on the score.
 *
 * This uses the DISPLAY thresholds (90%/70%) for UI styling,
 * which differ from the FLAGGING thresholds (85%/70%).
 *
 * @param score - Confidence score between 0 and 1
 * @returns 'high' | 'medium' | 'low'
 *
 * @example
 * getConfidenceLevel(0.95) // 'high' - green display
 * getConfidenceLevel(0.85) // 'medium' - amber display
 * getConfidenceLevel(0.65) // 'low' - red display
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  const percent = score * 100;
  if (percent >= CONFIDENCE_DISPLAY_THRESHOLDS.HIGH) return 'high';
  if (percent >= CONFIDENCE_DISPLAY_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Determines if a field should be flagged for mandatory review.
 *
 * Uses the AUTO_FLAG threshold (< 70%) from centralized constants.
 * Fields below this threshold are automatically flagged.
 *
 * @param score - Confidence score between 0 and 1
 * @returns true if the field should be flagged
 *
 * @example
 * shouldFlagForReview(0.65) // true - auto-flagged
 * shouldFlagForReview(0.72) // false - above threshold
 */
export function shouldFlagForReview(score: number): boolean {
  return shouldAutoFlag(score);
}

/**
 * Formats a confidence score as a percentage string.
 *
 * @param score - Confidence score between 0 and 1
 * @returns Formatted percentage string like "85%"
 */
export function formatConfidenceScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Returns detailed flag status for a field.
 *
 * - 'trusted' (>= 85%): No flagging required
 * - 'optional_review' (70-84%): Review is optional but recommended
 * - 'auto_flagged' (< 70%): Automatically flagged for mandatory review
 *
 * @param score - Confidence score between 0 and 1
 * @returns FlagStatus indicating the review requirement
 */
export function getFieldFlagStatus(score: number): FlagStatus {
  return getFlagStatus(score);
}

/**
 * Determines if a field is in the optional review range (70-84%).
 *
 * These fields are not auto-flagged but may benefit from verification.
 *
 * @param score - Confidence score between 0 and 1
 * @returns true if field is in optional review range
 */
export function isInOptionalReviewRange(score: number): boolean {
  return (
    score >= CONFIDENCE_THRESHOLDS.OPTIONAL_REVIEW &&
    score < CONFIDENCE_THRESHOLDS.TRUSTED
  );
}

// Re-export types and functions for convenience
export { type FlagStatus } from './constants';
export {
  shouldAutoFlag,
  isOptionalReview,
  isTrusted,
  shouldReject,
  CONFIDENCE_THRESHOLDS,
  CONFIDENCE_DISPLAY_THRESHOLDS,
} from './constants';
