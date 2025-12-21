/**
 * Entropy-based Covenant Sorting Utilities
 *
 * Provides sorting functions to prioritize covenants based on
 * information entropy metrics rather than just linear headroom.
 */

import type { Covenant } from './types';
import { calculateCovenantEntropyMetrics } from './entropy';

export interface CovenantWithEntropyScore extends Covenant {
  _entropyScore?: number;
  _attentionLevel?: 1 | 2 | 3 | 4 | 5;
  _alertPriority?: number;
}

/**
 * Calculate entropy score for a covenant
 */
function getEntropyScore(covenant: Covenant): {
  score: number;
  attentionLevel: 1 | 2 | 3 | 4 | 5;
  alertPriority: number;
} {
  const testHistory = covenant.test_history && covenant.test_history.length > 0
    ? covenant.test_history
    : [covenant.latest_test];

  const testPoints = testHistory.map(test => ({
    test_date: test.test_date,
    headroom_percentage: test.headroom_percentage,
  }));

  const metrics = calculateCovenantEntropyMetrics(testPoints);

  return {
    score: metrics.alertPriority,
    attentionLevel: metrics.attentionLevel,
    alertPriority: metrics.alertPriority,
  };
}

/**
 * Sort covenants by entropy-based alert priority (descending)
 * Highest priority (most attention required) first
 */
export function sortCovenantsByEntropyPriority(
  covenants: Covenant[]
): CovenantWithEntropyScore[] {
  const covenantsWithScores = covenants.map(covenant => {
    const { score, attentionLevel, alertPriority } = getEntropyScore(covenant);
    return {
      ...covenant,
      _entropyScore: score,
      _attentionLevel: attentionLevel,
      _alertPriority: alertPriority,
    };
  });

  return covenantsWithScores.sort((a, b) => {
    // Primary: Sort by alert priority (descending)
    if (b._alertPriority !== a._alertPriority) {
      return (b._alertPriority ?? 0) - (a._alertPriority ?? 0);
    }

    // Secondary: Sort by attention level (descending)
    if (b._attentionLevel !== a._attentionLevel) {
      return (b._attentionLevel ?? 0) - (a._attentionLevel ?? 0);
    }

    // Tertiary: Sort by current headroom (ascending, low headroom first)
    return a.latest_test.headroom_percentage - b.latest_test.headroom_percentage;
  });
}

/**
 * Sort covenants by attention level, then by entropy velocity
 * Prioritizes rapidly deteriorating covenants
 */
export function sortCovenantsByEntropyVelocity(
  covenants: Covenant[]
): CovenantWithEntropyScore[] {
  const covenantsWithMetrics = covenants.map(covenant => {
    const testHistory = covenant.test_history && covenant.test_history.length > 0
      ? covenant.test_history
      : [covenant.latest_test];

    const testPoints = testHistory.map(test => ({
      test_date: test.test_date,
      headroom_percentage: test.headroom_percentage,
    }));

    const metrics = calculateCovenantEntropyMetrics(testPoints);

    return {
      ...covenant,
      _entropyScore: metrics.alertPriority,
      _attentionLevel: metrics.attentionLevel,
      _alertPriority: metrics.alertPriority,
      _entropyVelocity: metrics.entropyVelocity,
    };
  });

  return covenantsWithMetrics.sort((a, b) => {
    // Primary: Sort by attention level (descending)
    const attentionDiff = (b._attentionLevel ?? 0) - (a._attentionLevel ?? 0);
    if (attentionDiff !== 0) return attentionDiff;

    // Secondary: Sort by entropy velocity (ascending, negative velocity = deteriorating first)
    const velocityDiff = (a._entropyVelocity ?? 0) - (b._entropyVelocity ?? 0);
    if (Math.abs(velocityDiff) > 0.001) return velocityDiff;

    // Tertiary: Sort by alert priority
    return (b._alertPriority ?? 0) - (a._alertPriority ?? 0);
  });
}

/**
 * Filter covenants by minimum attention level
 */
export function filterCovenantsByAttentionLevel(
  covenants: Covenant[],
  minAttentionLevel: 1 | 2 | 3 | 4 | 5
): CovenantWithEntropyScore[] {
  const covenantsWithScores = covenants.map(covenant => {
    const { score, attentionLevel, alertPriority } = getEntropyScore(covenant);
    return {
      ...covenant,
      _entropyScore: score,
      _attentionLevel: attentionLevel,
      _alertPriority: alertPriority,
    };
  });

  return covenantsWithScores.filter(
    covenant => (covenant._attentionLevel ?? 0) >= minAttentionLevel
  );
}

/**
 * Group covenants by attention level
 */
export function groupCovenantsByAttentionLevel(
  covenants: Covenant[]
): Record<1 | 2 | 3 | 4 | 5, CovenantWithEntropyScore[]> {
  const groups: Record<1 | 2 | 3 | 4 | 5, CovenantWithEntropyScore[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };

  covenants.forEach(covenant => {
    const { score, attentionLevel, alertPriority } = getEntropyScore(covenant);
    const covenantWithScore = {
      ...covenant,
      _entropyScore: score,
      _attentionLevel: attentionLevel,
      _alertPriority: alertPriority,
    };

    groups[attentionLevel].push(covenantWithScore);
  });

  // Sort within each group by alert priority
  Object.keys(groups).forEach(level => {
    const key = parseInt(level) as 1 | 2 | 3 | 4 | 5;
    groups[key].sort((a, b) => (b._alertPriority ?? 0) - (a._alertPriority ?? 0));
  });

  return groups;
}

/**
 * Get top N covenants requiring immediate attention
 */
export function getTopPriorityCovenants(
  covenants: Covenant[],
  count: number = 10
): CovenantWithEntropyScore[] {
  const sorted = sortCovenantsByEntropyPriority(covenants);
  return sorted.slice(0, count);
}

/**
 * Calculate aggregate entropy health score for a portfolio of covenants
 * Returns a score from 0-100 where:
 * - 100 = All covenants healthy (high entropy, low risk)
 * - 0 = Critical portfolio stress (low entropy, high risk)
 */
export function calculatePortfolioEntropyHealth(covenants: Covenant[]): {
  healthScore: number;
  avgEntropy: number;
  avgAttentionLevel: number;
  totalAlertPriority: number;
} {
  if (covenants.length === 0) {
    return {
      healthScore: 50,
      avgEntropy: 0.5,
      avgAttentionLevel: 3,
      totalAlertPriority: 0,
    };
  }

  let totalEntropy = 0;
  let totalAttentionLevel = 0;
  let totalAlertPriority = 0;

  covenants.forEach(covenant => {
    const testHistory = covenant.test_history && covenant.test_history.length > 0
      ? covenant.test_history
      : [covenant.latest_test];

    const testPoints = testHistory.map(test => ({
      test_date: test.test_date,
      headroom_percentage: test.headroom_percentage,
    }));

    const metrics = calculateCovenantEntropyMetrics(testPoints);

    totalEntropy += metrics.entropy;
    totalAttentionLevel += metrics.attentionLevel;
    totalAlertPriority += metrics.alertPriority;
  });

  const avgEntropy = totalEntropy / covenants.length;
  const avgAttentionLevel = totalAttentionLevel / covenants.length;

  // Health score: weighted combination of average entropy and inverse of attention level
  // High entropy (0.8-1.0) with low attention (1-2) = high health score (80-100)
  // Low entropy (0.0-0.2) with high attention (4-5) = low health score (0-20)
  const entropyScore = avgEntropy * 100; // 0-100
  const attentionScore = ((5 - avgAttentionLevel) / 4) * 100; // Inverse, 0-100

  const healthScore = (entropyScore * 0.6) + (attentionScore * 0.4);

  return {
    healthScore: Math.round(healthScore),
    avgEntropy,
    avgAttentionLevel,
    totalAlertPriority,
  };
}
