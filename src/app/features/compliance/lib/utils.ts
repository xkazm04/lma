import { formatDate } from '@/lib/utils/formatters';
import { DEFAULT_AT_RISK_HEADROOM_THRESHOLD } from './covenant-config';

// =============================================================================
// Shared Date and Formatting Utilities
// =============================================================================

/**
 * Formats a date string with full weekday, month, day, and year.
 * Used in list views for date headers.
 */
export function formatDateLong(dateStr: string): string {
  return formatDate(dateStr, 'long');
}

/**
 * Formats a date string with month, day, and year only.
 * Used in compact displays like cards.
 */
export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, 'short');
}

// =============================================================================
// Headroom Calculation Utilities
// =============================================================================

/**
 * Calculates headroom percentage for a covenant based on threshold type.
 *
 * ## Formula
 *
 * The headroom percentage represents how much "breathing room" exists between
 * the current value and the threshold before a breach occurs.
 *
 * ### For MAXIMUM thresholds (value must be ≤ threshold):
 * ```
 * headroom = ((threshold - value) / threshold) × 100
 * ```
 *
 * **Example:** Leverage Ratio with max threshold of 4.0x
 * - Current value: 3.2x → headroom = ((4.0 - 3.2) / 4.0) × 100 = 20%
 * - Current value: 4.5x → headroom = ((4.0 - 4.5) / 4.0) × 100 = -12.5% (breach)
 *
 * ### For MINIMUM thresholds (value must be ≥ threshold):
 * ```
 * headroom = ((value - threshold) / threshold) × 100
 * ```
 *
 * **Example:** Interest Coverage with min threshold of 2.0x
 * - Current value: 2.6x → headroom = ((2.6 - 2.0) / 2.0) × 100 = 30%
 * - Current value: 1.8x → headroom = ((1.8 - 2.0) / 2.0) × 100 = -10% (breach)
 *
 * ## Interpretation
 *
 * | Headroom    | Status      | Meaning                                    |
 * |-------------|-------------|-------------------------------------------|
 * | > 30%       | Healthy     | Comfortable buffer, low risk              |
 * | 15% - 30%   | Moderate    | Adequate cushion, monitor normally        |
 * | 0% - 15%    | At Risk     | Limited room, increased monitoring needed |
 * | < 0%        | Breached    | Covenant violation, immediate action      |
 *
 * @param value - The current calculated ratio/value
 * @param threshold - The covenant threshold
 * @param thresholdType - Whether the threshold is a 'maximum' or 'minimum'
 * @returns Headroom percentage (positive = compliant, negative = breach)
 *
 * @example
 * // Maximum threshold example (Leverage ≤ 4.0x)
 * calculateHeadroomPercentage(3.2, 4.0, 'maximum') // Returns 20
 *
 * @example
 * // Minimum threshold example (Coverage ≥ 2.0x)
 * calculateHeadroomPercentage(2.6, 2.0, 'minimum') // Returns 30
 *
 * @example
 * // Breach example (value exceeds max threshold)
 * calculateHeadroomPercentage(4.5, 4.0, 'maximum') // Returns -12.5
 */
export function calculateHeadroomPercentage(
  value: number,
  threshold: number,
  thresholdType: 'maximum' | 'minimum'
): number {
  if (threshold === 0) {
    // Avoid division by zero - return 0 if threshold is 0
    return 0;
  }

  if (thresholdType === 'maximum') {
    // For maximum: headroom = (threshold - value) / threshold × 100
    // Positive when value < threshold (compliant)
    // Negative when value > threshold (breach)
    return ((threshold - value) / threshold) * 100;
  } else {
    // For minimum: headroom = (value - threshold) / threshold × 100
    // Positive when value > threshold (compliant)
    // Negative when value < threshold (breach)
    return ((value - threshold) / threshold) * 100;
  }
}

/**
 * Calculates absolute headroom (raw difference) between value and threshold.
 *
 * Unlike headroom percentage, this returns the difference in the same units
 * as the original values. Useful for monetary covenants where the absolute
 * dollar amount of headroom is more intuitive.
 *
 * ## Formula
 *
 * - For MAXIMUM thresholds: `absolute_headroom = threshold - value`
 * - For MINIMUM thresholds: `absolute_headroom = value - threshold`
 *
 * @param value - The current calculated ratio/value
 * @param threshold - The covenant threshold
 * @param thresholdType - Whether the threshold is a 'maximum' or 'minimum'
 * @returns Absolute headroom (positive = compliant, negative = breach)
 *
 * @example
 * // Leverage ratio with 0.8x of headroom
 * calculateHeadroomAbsolute(3.2, 4.0, 'maximum') // Returns 0.8
 *
 * @example
 * // Minimum liquidity with $10M headroom
 * calculateHeadroomAbsolute(60000000, 50000000, 'minimum') // Returns 10000000
 */
export function calculateHeadroomAbsolute(
  value: number,
  threshold: number,
  thresholdType: 'maximum' | 'minimum'
): number {
  if (thresholdType === 'maximum') {
    return threshold - value;
  } else {
    return value - threshold;
  }
}

/**
 * Determines the risk level based on headroom percentage.
 *
 * Uses configurable thresholds from covenant-config.ts:
 * - at_risk: Below DEFAULT_AT_RISK_HEADROOM_THRESHOLD (default: 15%)
 * - moderate: Between at_risk threshold and safe threshold (default: 30%)
 * - healthy: Above safe threshold
 * - breached: Negative headroom (below 0%)
 *
 * @param headroomPercentage - The calculated headroom percentage
 * @returns Risk level string for use in UI styling and alerts
 */
export function getHeadroomRiskLevel(
  headroomPercentage: number
): 'healthy' | 'moderate' | 'at_risk' | 'breached' {
  if (headroomPercentage < 0) return 'breached';
  if (headroomPercentage < DEFAULT_AT_RISK_HEADROOM_THRESHOLD) return 'at_risk';
  // Moderate zone is between at_risk threshold and 2x that threshold (default: 15-30%)
  if (headroomPercentage < DEFAULT_AT_RISK_HEADROOM_THRESHOLD * 2) return 'moderate';
  return 'healthy';
}
