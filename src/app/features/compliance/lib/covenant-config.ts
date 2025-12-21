/**
 * Covenant Configuration
 *
 * This module defines configurable thresholds and constants for covenant risk assessment.
 * Organizations may need to adjust these values based on their risk tolerance, regulatory
 * requirements, or loan portfolio characteristics.
 */

/**
 * Default headroom threshold (percentage) below which a covenant is considered "at risk".
 *
 * Why 15%?
 * - Industry standard: Many financial institutions use 10-20% as the warning zone
 * - Lead time: 15% provides sufficient buffer to take corrective action before breach
 * - Volatility cushion: Accounts for normal quarter-over-quarter fluctuations
 * - Regulatory alignment: Common threshold used in stress testing scenarios
 *
 * Organizations with different risk profiles may want to adjust this:
 * - Conservative (low risk tolerance): 20-25%
 * - Moderate (standard): 15%
 * - Aggressive (high risk tolerance): 10%
 */
export const DEFAULT_AT_RISK_HEADROOM_THRESHOLD = 15;

/**
 * Covenant risk configuration type
 *
 * Allows for facility-level or system-wide configuration of covenant risk thresholds.
 */
export interface CovenantRiskConfig {
  /**
   * Headroom percentage below which a covenant is considered "at risk"
   * Default: 15%
   */
  atRiskHeadroomThreshold: number;

  /**
   * Optional override for critical threshold (typically lower than at_risk)
   * When headroom falls below this, covenant is considered critical
   * Default: 10%
   */
  criticalHeadroomThreshold?: number;

  /**
   * Optional override for safe threshold (above which covenant is fully healthy)
   * Default: 20%
   */
  safeHeadroomThreshold?: number;
}

/**
 * Default covenant risk configuration
 *
 * These values can be overridden at the facility or organization level.
 */
export const DEFAULT_COVENANT_RISK_CONFIG: CovenantRiskConfig = {
  atRiskHeadroomThreshold: DEFAULT_AT_RISK_HEADROOM_THRESHOLD,
  criticalHeadroomThreshold: 10,
  safeHeadroomThreshold: 20,
};

/**
 * Helper function to check if a covenant is at risk based on headroom percentage.
 *
 * @param headroomPercentage - The current headroom percentage
 * @param config - Optional configuration override
 * @returns true if the covenant is at risk (passing but with low headroom)
 */
export function isCovenantAtRisk(
  headroomPercentage: number,
  config: Partial<CovenantRiskConfig> = {}
): boolean {
  const threshold = config.atRiskHeadroomThreshold ?? DEFAULT_AT_RISK_HEADROOM_THRESHOLD;
  return headroomPercentage < threshold && headroomPercentage >= 0;
}

