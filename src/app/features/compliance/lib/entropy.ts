/**
 * Covenant Headroom as Information Entropy Metric
 *
 * This module implements information theory to model covenant headroom as entropy.
 * Covenants near thresholds have high information content (low entropy), while distant
 * covenants have low information content (high entropy).
 *
 * Entropy-based metrics provide non-linear risk assessment where rapid entropy loss
 * (headroom compression) signals systemic stress better than absolute levels.
 */

export interface EntropyMetrics {
  /** Current entropy value (0-1, where 0 is maximum risk, 1 is maximum safety) */
  entropy: number;

  /** Rate of entropy change over time (bits per period) */
  entropyVelocity: number;

  /** Acceleration of entropy change (bits per period squared) */
  entropyAcceleration: number;

  /** Information content (inverse of entropy, 0-1) */
  informationContent: number;

  /** Attention level based on entropy metrics (1-5, where 5 is maximum attention) */
  attentionLevel: 1 | 2 | 3 | 4 | 5;

  /** Human-readable interpretation */
  interpretation: string;

  /** Alert priority score (0-100) */
  alertPriority: number;
}

export interface CovenantTestPoint {
  test_date: string;
  headroom_percentage: number;
}

/**
 * Calculate Shannon entropy for covenant headroom
 * Maps headroom to entropy using a sigmoid function to model non-linear risk
 *
 * @param headroom - Headroom percentage (-100 to 100)
 * @returns Entropy value (0 to 1, where 1 is high entropy/low risk)
 */
export function calculateHeadroomEntropy(headroom: number): number {
  // Normalize headroom to handle negative values (breaches)
  // Use sigmoid function to model non-linear perception of risk

  // Shift and scale parameters tuned for covenant headroom
  const k = 0.1; // Steepness of sigmoid curve
  const x0 = 15; // Inflection point (at 15% headroom)

  // Sigmoid function: E = 1 / (1 + e^(-k(x - x0)))
  // This creates high entropy (safety) for large headroom
  // and low entropy (danger) for small/negative headroom
  const entropy = 1 / (1 + Math.exp(-k * (headroom - x0)));

  return Math.max(0, Math.min(1, entropy));
}

/**
 * Calculate information content (inverse of entropy)
 * High information content = low entropy = high risk = requires attention
 *
 * @param entropy - Entropy value (0-1)
 * @returns Information content (0-1)
 */
export function calculateInformationContent(entropy: number): number {
  return 1 - entropy;
}

/**
 * Calculate entropy velocity (rate of change)
 * Measures how quickly entropy is changing over time
 * Negative velocity = entropy decreasing = headroom tightening = increasing risk
 *
 * @param currentEntropy - Current entropy value
 * @param previousEntropy - Previous entropy value
 * @returns Entropy velocity (bits per period)
 */
export function calculateEntropyVelocity(
  currentEntropy: number,
  previousEntropy: number
): number {
  return currentEntropy - previousEntropy;
}

/**
 * Calculate entropy acceleration (rate of velocity change)
 * Measures if the rate of entropy change is itself changing
 * Negative acceleration = entropy loss accelerating = rapid deterioration
 *
 * @param currentVelocity - Current velocity
 * @param previousVelocity - Previous velocity
 * @returns Entropy acceleration (bits per period squared)
 */
export function calculateEntropyAcceleration(
  currentVelocity: number,
  previousVelocity: number
): number {
  return currentVelocity - previousVelocity;
}

/**
 * Determine attention level based on entropy metrics
 * Uses a weighted scoring system considering:
 * - Absolute entropy level
 * - Rate of entropy change (velocity)
 * - Acceleration of entropy change
 *
 * @param entropy - Current entropy
 * @param velocity - Entropy velocity
 * @param acceleration - Entropy acceleration
 * @returns Attention level (1 = minimal, 5 = critical)
 */
export function determineAttentionLevel(
  entropy: number,
  velocity: number,
  acceleration: number
): 1 | 2 | 3 | 4 | 5 {
  // Calculate weighted risk score
  const entropyWeight = 0.5;
  const velocityWeight = 0.3;
  const accelerationWeight = 0.2;

  // Convert metrics to risk scores (0-1, where 1 is high risk)
  const entropyRisk = 1 - entropy; // Low entropy = high risk
  const velocityRisk = velocity < 0 ? Math.min(1, Math.abs(velocity) * 5) : 0; // Negative velocity = risk
  const accelerationRisk = acceleration < 0 ? Math.min(1, Math.abs(acceleration) * 10) : 0; // Negative acceleration = risk

  // Weighted risk score
  const riskScore = (
    entropyRisk * entropyWeight +
    velocityRisk * velocityWeight +
    accelerationRisk * accelerationWeight
  );

  // Map to attention levels
  if (riskScore >= 0.8) return 5; // Critical
  if (riskScore >= 0.6) return 4; // High
  if (riskScore >= 0.4) return 3; // Medium
  if (riskScore >= 0.2) return 2; // Low
  return 1; // Minimal
}

/**
 * Get human-readable interpretation of attention level
 */
export function getAttentionLevelLabel(level: 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 5: return 'Critical Attention Required';
    case 4: return 'High Priority Monitoring';
    case 3: return 'Elevated Monitoring';
    case 2: return 'Standard Monitoring';
    case 1: return 'Low Priority';
    default: return 'Unknown';
  }
}

/**
 * Calculate alert priority score (0-100)
 * Higher scores indicate higher priority for alerts
 */
export function calculateAlertPriority(
  entropy: number,
  velocity: number,
  acceleration: number
): number {
  const attentionLevel = determineAttentionLevel(entropy, velocity, acceleration);

  // Base priority from attention level
  const basePriority = attentionLevel * 20;

  // Adjust based on velocity and acceleration
  const velocityBoost = velocity < 0 ? Math.abs(velocity) * 20 : 0;
  const accelerationBoost = acceleration < 0 ? Math.abs(acceleration) * 30 : 0;

  const priority = basePriority + velocityBoost + accelerationBoost;

  return Math.min(100, Math.max(0, priority));
}

/**
 * Get interpretation text for entropy metrics
 */
export function getEntropyInterpretation(
  entropy: number,
  velocity: number,
  acceleration: number,
  attentionLevel: 1 | 2 | 3 | 4 | 5
): string {
  const informationContent = calculateInformationContent(entropy);

  if (attentionLevel === 5) {
    return `Critical: Information density is extremely high (${(informationContent * 100).toFixed(1)}%), indicating imminent risk. Entropy is ${velocity < 0 ? 'rapidly decreasing' : 'unstable'}.`;
  }

  if (attentionLevel === 4) {
    return `High Alert: Significant information content (${(informationContent * 100).toFixed(1)}%) with ${velocity < 0 ? 'declining' : 'volatile'} entropy. Headroom compression detected.`;
  }

  if (attentionLevel === 3) {
    return `Elevated: Moderate information content (${(informationContent * 100).toFixed(1)}%). Entropy ${velocity < 0 ? 'trending downward' : 'fluctuating'}, requiring closer monitoring.`;
  }

  if (attentionLevel === 2) {
    return `Stable: Low information content (${(informationContent * 100).toFixed(1)}%). Entropy remains ${velocity >= 0 ? 'stable or improving' : 'slightly declining'}.`;
  }

  return `Healthy: Minimal information density (${(informationContent * 100).toFixed(1)}%). High entropy indicates strong safety buffer.`;
}

/**
 * Calculate comprehensive entropy metrics for a covenant
 *
 * @param testHistory - Array of test results ordered chronologically
 * @returns Complete entropy metrics
 */
export function calculateCovenantEntropyMetrics(
  testHistory: CovenantTestPoint[]
): EntropyMetrics {
  if (testHistory.length === 0) {
    return {
      entropy: 0.5,
      entropyVelocity: 0,
      entropyAcceleration: 0,
      informationContent: 0.5,
      attentionLevel: 3,
      interpretation: 'Insufficient data for entropy analysis',
      alertPriority: 50,
    };
  }

  // Calculate entropy for each test point
  const entropyHistory = testHistory.map(test => ({
    date: test.test_date,
    entropy: calculateHeadroomEntropy(test.headroom_percentage),
    headroom: test.headroom_percentage,
  }));

  // Current entropy (most recent)
  const currentEntropy = entropyHistory[entropyHistory.length - 1].entropy;

  // Calculate velocity (if we have at least 2 points)
  let velocity = 0;
  let previousVelocity = 0;

  if (entropyHistory.length >= 2) {
    const previousEntropy = entropyHistory[entropyHistory.length - 2].entropy;
    velocity = calculateEntropyVelocity(currentEntropy, previousEntropy);

    // Calculate previous velocity for acceleration (if we have at least 3 points)
    if (entropyHistory.length >= 3) {
      const beforePreviousEntropy = entropyHistory[entropyHistory.length - 3].entropy;
      previousVelocity = calculateEntropyVelocity(previousEntropy, beforePreviousEntropy);
    }
  }

  // Calculate acceleration
  const acceleration = calculateEntropyAcceleration(velocity, previousVelocity);

  // Calculate derived metrics
  const informationContent = calculateInformationContent(currentEntropy);
  const attentionLevel = determineAttentionLevel(currentEntropy, velocity, acceleration);
  const alertPriority = calculateAlertPriority(currentEntropy, velocity, acceleration);
  const interpretation = getEntropyInterpretation(currentEntropy, velocity, acceleration, attentionLevel);

  return {
    entropy: currentEntropy,
    entropyVelocity: velocity,
    entropyAcceleration: acceleration,
    informationContent,
    attentionLevel,
    interpretation,
    alertPriority,
  };
}

/**
 * Get color class for entropy level (Tailwind CSS)
 */
export function getEntropyColorClass(entropy: number): string {
  if (entropy < 0.2) return 'text-red-600';
  if (entropy < 0.4) return 'text-orange-600';
  if (entropy < 0.6) return 'text-amber-600';
  if (entropy < 0.8) return 'text-blue-600';
  return 'text-green-600';
}

/**
 * Get background color class for attention level
 */
export function getAttentionLevelColorClass(level: 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 5: return 'bg-red-100 text-red-700 border-red-300';
    case 4: return 'bg-orange-100 text-orange-700 border-orange-300';
    case 3: return 'bg-amber-100 text-amber-700 border-amber-300';
    case 2: return 'bg-blue-100 text-blue-700 border-blue-300';
    case 1: return 'bg-green-100 text-green-700 border-green-300';
    default: return 'bg-zinc-100 text-zinc-700 border-zinc-300';
  }
}

/**
 * Get icon name for attention level (lucide-react)
 */
export function getAttentionLevelIcon(level: 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 5: return 'AlertTriangle';
    case 4: return 'AlertCircle';
    case 3: return 'Info';
    case 2: return 'Eye';
    case 1: return 'CheckCircle';
    default: return 'HelpCircle';
  }
}
