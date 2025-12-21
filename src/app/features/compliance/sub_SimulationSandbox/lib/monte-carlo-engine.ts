// =============================================================================
// Monte Carlo Simulation Engine
// =============================================================================

import type {
  MonteCarloConfig,
  MonteCarloIteration,
  MonteCarloResult,
  ProbabilityDistribution,
  SimulationVariable,
  DistributionType,
} from './types';

// =============================================================================
// Random Number Generation with Seeding
// =============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
  }

  // Linear congruential generator
  private next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  // Standard uniform [0, 1)
  uniform(): number {
    return this.next();
  }

  // Box-Muller transform for normal distribution
  normal(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z;
  }

  // Uniform distribution with range
  uniformRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Triangular distribution
  triangular(min: number, max: number, mode: number): number {
    const u = this.next();
    const fc = (mode - min) / (max - min);

    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  // Lognormal distribution
  lognormal(mean: number, stdDev: number): number {
    const normalValue = this.normal(0, 1);
    const sigma = Math.sqrt(Math.log(1 + (stdDev * stdDev) / (mean * mean)));
    const mu = Math.log(mean) - 0.5 * sigma * sigma;
    return Math.exp(mu + sigma * normalValue);
  }
}

// =============================================================================
// Correlation Matrix Handling
// =============================================================================

/**
 * Generate correlated random variables using Cholesky decomposition
 */
function generateCorrelatedVariables(
  rng: SeededRandom,
  variables: SimulationVariable[],
  correlationMatrix: number[][]
): Record<string, number> {
  const n = variables.length;
  const result: Record<string, number> = {};

  // Cholesky decomposition of correlation matrix
  const L = choleskyDecomposition(correlationMatrix);

  // Generate independent standard normals
  const z: number[] = Array(n).fill(0).map(() => rng.normal(0, 1));

  // Transform to correlated normals
  const correlatedNormals: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      correlatedNormals[i] += L[i][j] * z[j];
    }
  }

  // Transform back to original distributions
  for (let i = 0; i < n; i++) {
    const variable = variables[i];
    const u = normalCDF(correlatedNormals[i]); // Transform to uniform

    switch (variable.distribution) {
      case 'normal':
        result[variable.id] = variable.base_value +
          (variable.std_dev ?? 0) * correlatedNormals[i];
        break;
      case 'uniform':
        result[variable.id] = (variable.min_value ?? 0) +
          u * ((variable.max_value ?? 1) - (variable.min_value ?? 0));
        break;
      case 'triangular':
        result[variable.id] = inverseTri(
          u,
          variable.min_value ?? 0,
          variable.max_value ?? 1,
          variable.mode_value ?? variable.base_value
        );
        break;
      case 'lognormal':
        const sigma = Math.sqrt(Math.log(1 + Math.pow((variable.std_dev ?? 0.1) / variable.base_value, 2)));
        const mu = Math.log(variable.base_value) - 0.5 * sigma * sigma;
        result[variable.id] = Math.exp(mu + sigma * correlatedNormals[i]);
        break;
    }
  }

  return result;
}

/**
 * Cholesky decomposition for correlation matrix
 */
function choleskyDecomposition(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(0, matrix[i][i] - sum));
      } else {
        L[i][j] = (matrix[i][j] - sum) / (L[j][j] || 1);
      }
    }
  }

  return L;
}

/**
 * Standard normal CDF approximation
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse triangular distribution
 */
function inverseTri(u: number, min: number, max: number, mode: number): number {
  const fc = (mode - min) / (max - min);
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

// =============================================================================
// Covenant Calculation Functions
// =============================================================================

/**
 * Calculate leverage ratio from simulated values
 */
function calculateLeverageRatio(
  totalDebt: number,
  ebitda: number
): number {
  if (ebitda <= 0) return Infinity;
  return totalDebt / ebitda;
}

/**
 * Calculate interest coverage ratio
 */
function calculateInterestCoverage(
  ebitda: number,
  interestExpense: number
): number {
  if (interestExpense <= 0) return Infinity;
  return ebitda / interestExpense;
}

/**
 * Calculate fixed charge coverage ratio
 */
function calculateFixedChargeCoverage(
  ebitda: number,
  fixedCharges: number
): number {
  if (fixedCharges <= 0) return Infinity;
  return ebitda / fixedCharges;
}

/**
 * Calculate debt service coverage ratio
 */
function calculateDSCR(
  netOperatingIncome: number,
  totalDebtService: number
): number {
  if (totalDebtService <= 0) return Infinity;
  return netOperatingIncome / totalDebtService;
}

// =============================================================================
// Monte Carlo Simulation Engine
// =============================================================================

export interface SimulationContext {
  /** Covenant thresholds */
  covenantThresholds: Record<string, {
    threshold: number;
    type: 'maximum' | 'minimum';
  }>;
  /** Base financial metrics */
  baseMetrics: {
    totalDebt: number;
    ebitda: number;
    interestExpense: number;
    fixedCharges: number;
    netOperatingIncome: number;
    totalDebtService: number;
    liquidity: number;
  };
}

/**
 * Run Monte Carlo simulation
 */
export function runMonteCarloSimulation(
  config: MonteCarloConfig,
  context: SimulationContext
): MonteCarloResult {
  const startTime = performance.now();
  const rng = new SeededRandom(config.random_seed);

  // Build correlation matrix from variables
  const correlationMatrix = buildCorrelationMatrix(config.variables);

  // Store all iteration results
  const iterations: MonteCarloIteration[] = [];
  const covenantResults: Record<string, number[]> = {};
  const headroomResults: Record<string, number[]> = {};
  let totalBreaches = 0;
  let portfolioBreachCount = 0;

  // Run simulation iterations
  for (let i = 0; i < config.iterations; i++) {
    // Generate correlated variable values
    const variableValues = generateCorrelatedVariables(
      rng,
      config.variables,
      correlationMatrix
    );

    // Calculate financial metrics based on simulated variables
    const metrics = calculateMetricsFromVariables(
      variableValues,
      context.baseMetrics
    );

    // Calculate covenant ratios
    const covenantRatios: Record<string, number> = {};
    const headroomValues: Record<string, number> = {};
    const breachedCovenants: string[] = [];

    // Leverage Ratio
    if (context.covenantThresholds['leverage_ratio']) {
      const ratio = calculateLeverageRatio(metrics.totalDebt, metrics.ebitda);
      covenantRatios['leverage_ratio'] = ratio;
      const threshold = context.covenantThresholds['leverage_ratio'];
      const headroom = threshold.type === 'maximum'
        ? ((threshold.threshold - ratio) / threshold.threshold) * 100
        : ((ratio - threshold.threshold) / threshold.threshold) * 100;
      headroomValues['leverage_ratio'] = headroom;

      if (headroom < 0) {
        breachedCovenants.push('leverage_ratio');
        totalBreaches++;
      }

      if (!covenantResults['leverage_ratio']) {
        covenantResults['leverage_ratio'] = [];
        headroomResults['leverage_ratio'] = [];
      }
      covenantResults['leverage_ratio'].push(ratio);
      headroomResults['leverage_ratio'].push(headroom);
    }

    // Interest Coverage
    if (context.covenantThresholds['interest_coverage']) {
      const ratio = calculateInterestCoverage(metrics.ebitda, metrics.interestExpense);
      covenantRatios['interest_coverage'] = ratio;
      const threshold = context.covenantThresholds['interest_coverage'];
      const headroom = threshold.type === 'minimum'
        ? ((ratio - threshold.threshold) / threshold.threshold) * 100
        : ((threshold.threshold - ratio) / threshold.threshold) * 100;
      headroomValues['interest_coverage'] = headroom;

      if (headroom < 0) {
        breachedCovenants.push('interest_coverage');
        totalBreaches++;
      }

      if (!covenantResults['interest_coverage']) {
        covenantResults['interest_coverage'] = [];
        headroomResults['interest_coverage'] = [];
      }
      covenantResults['interest_coverage'].push(ratio);
      headroomResults['interest_coverage'].push(headroom);
    }

    // Fixed Charge Coverage
    if (context.covenantThresholds['fixed_charge_coverage']) {
      const ratio = calculateFixedChargeCoverage(metrics.ebitda, metrics.fixedCharges);
      covenantRatios['fixed_charge_coverage'] = ratio;
      const threshold = context.covenantThresholds['fixed_charge_coverage'];
      const headroom = threshold.type === 'minimum'
        ? ((ratio - threshold.threshold) / threshold.threshold) * 100
        : ((threshold.threshold - ratio) / threshold.threshold) * 100;
      headroomValues['fixed_charge_coverage'] = headroom;

      if (headroom < 0) {
        breachedCovenants.push('fixed_charge_coverage');
        totalBreaches++;
      }

      if (!covenantResults['fixed_charge_coverage']) {
        covenantResults['fixed_charge_coverage'] = [];
        headroomResults['fixed_charge_coverage'] = [];
      }
      covenantResults['fixed_charge_coverage'].push(ratio);
      headroomResults['fixed_charge_coverage'].push(headroom);
    }

    // DSCR
    if (context.covenantThresholds['debt_service_coverage']) {
      const ratio = calculateDSCR(metrics.netOperatingIncome, metrics.totalDebtService);
      covenantRatios['debt_service_coverage'] = ratio;
      const threshold = context.covenantThresholds['debt_service_coverage'];
      const headroom = threshold.type === 'minimum'
        ? ((ratio - threshold.threshold) / threshold.threshold) * 100
        : ((threshold.threshold - ratio) / threshold.threshold) * 100;
      headroomValues['debt_service_coverage'] = headroom;

      if (headroom < 0) {
        breachedCovenants.push('debt_service_coverage');
        totalBreaches++;
      }

      if (!covenantResults['debt_service_coverage']) {
        covenantResults['debt_service_coverage'] = [];
        headroomResults['debt_service_coverage'] = [];
      }
      covenantResults['debt_service_coverage'].push(ratio);
      headroomResults['debt_service_coverage'].push(headroom);
    }

    // Minimum Liquidity
    if (context.covenantThresholds['minimum_liquidity']) {
      const value = metrics.liquidity;
      covenantRatios['minimum_liquidity'] = value;
      const threshold = context.covenantThresholds['minimum_liquidity'];
      const headroom = ((value - threshold.threshold) / threshold.threshold) * 100;
      headroomValues['minimum_liquidity'] = headroom;

      if (headroom < 0) {
        breachedCovenants.push('minimum_liquidity');
        totalBreaches++;
      }

      if (!covenantResults['minimum_liquidity']) {
        covenantResults['minimum_liquidity'] = [];
        headroomResults['minimum_liquidity'] = [];
      }
      covenantResults['minimum_liquidity'].push(value);
      headroomResults['minimum_liquidity'].push(headroom);
    }

    const anyBreach = breachedCovenants.length > 0;
    if (anyBreach) {
      portfolioBreachCount++;
    }

    iterations.push({
      iteration: i,
      variable_values: variableValues,
      covenant_ratios: covenantRatios,
      headroom_values: headroomValues,
      any_breach: anyBreach,
      breached_covenants: breachedCovenants,
    });
  }

  // Calculate probability distributions
  const distributions: Record<string, ProbabilityDistribution> = {};

  for (const covenantId of Object.keys(covenantResults)) {
    const ratios = covenantResults[covenantId];
    const headrooms = headroomResults[covenantId];

    const breachCount = headrooms.filter(h => h < 0).length;

    distributions[covenantId] = {
      covenant_id: covenantId,
      metric: 'ratio',
      mean: calculateMean(ratios),
      std_dev: calculateStdDev(ratios),
      min: Math.min(...ratios.filter(r => isFinite(r))),
      max: Math.max(...ratios.filter(r => isFinite(r))),
      percentiles: calculatePercentiles(ratios, config.confidence_levels),
      breach_probability: (breachCount / config.iterations) * 100,
    };
  }

  // Calculate portfolio-level metrics
  const allHeadrooms = Object.values(headroomResults).flat();
  const portfolioHeadroomMean = calculateMean(allHeadrooms);
  const portfolioHeadroomStdDev = calculateStdDev(allHeadrooms);

  // Find worst case
  let worstIteration = iterations[0];
  for (const iter of iterations) {
    if (iter.breached_covenants.length > worstIteration.breached_covenants.length) {
      worstIteration = iter;
    }
  }

  const endTime = performance.now();

  return {
    id: `mc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    config,
    run_at: new Date().toISOString(),
    runtime_ms: Math.round(endTime - startTime),
    successful_iterations: iterations.length,
    distributions,
    portfolio_breach_probability: (portfolioBreachCount / config.iterations) * 100,
    expected_breaches: totalBreaches / config.iterations,
    worst_case: {
      breach_count: worstIteration.breached_covenants.length,
      affected_covenants: worstIteration.breached_covenants,
      total_exposure: 0, // Would calculate based on actual covenant exposures
    },
    summary: {
      mean_portfolio_headroom: portfolioHeadroomMean,
      std_dev_portfolio_headroom: portfolioHeadroomStdDev,
      var_95: calculatePercentile(allHeadrooms, 0.05),
      var_99: calculatePercentile(allHeadrooms, 0.01),
    },
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build correlation matrix from variable definitions
 */
function buildCorrelationMatrix(variables: SimulationVariable[]): number[][] {
  const n = variables.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

  // Set diagonal to 1
  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1;
  }

  // Fill in correlations from variable definitions
  for (let i = 0; i < n; i++) {
    const correlations = variables[i].correlations ?? {};
    for (let j = 0; j < n; j++) {
      if (i !== j && correlations[variables[j].id] !== undefined) {
        const corr = correlations[variables[j].id];
        matrix[i][j] = corr;
        matrix[j][i] = corr; // Symmetric
      }
    }
  }

  return matrix;
}

/**
 * Calculate financial metrics from simulated variable values
 */
function calculateMetricsFromVariables(
  variableValues: Record<string, number>,
  baseMetrics: SimulationContext['baseMetrics']
): SimulationContext['baseMetrics'] {
  return {
    totalDebt: baseMetrics.totalDebt * (1 + (variableValues['debt_change'] ?? 0)),
    ebitda: baseMetrics.ebitda * (1 + (variableValues['ebitda_change'] ?? 0)),
    interestExpense: baseMetrics.interestExpense * (1 + (variableValues['rate_change'] ?? 0)),
    fixedCharges: baseMetrics.fixedCharges * (1 + (variableValues['fixed_charge_change'] ?? 0)),
    netOperatingIncome: baseMetrics.netOperatingIncome * (1 + (variableValues['noi_change'] ?? 0)),
    totalDebtService: baseMetrics.totalDebtService * (1 + (variableValues['debt_service_change'] ?? 0)),
    liquidity: baseMetrics.liquidity * (1 + (variableValues['liquidity_change'] ?? 0)),
  };
}

/**
 * Calculate mean of an array
 */
function calculateMean(values: number[]): number {
  const finiteValues = values.filter(v => isFinite(v));
  if (finiteValues.length === 0) return 0;
  return finiteValues.reduce((a, b) => a + b, 0) / finiteValues.length;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  const finiteValues = values.filter(v => isFinite(v));
  if (finiteValues.length === 0) return 0;
  const mean = calculateMean(finiteValues);
  const squaredDiffs = finiteValues.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / finiteValues.length);
}

/**
 * Calculate a single percentile
 */
function calculatePercentile(values: number[], percentile: number): number {
  const finiteValues = values.filter(v => isFinite(v)).sort((a, b) => a - b);
  if (finiteValues.length === 0) return 0;
  const index = Math.floor(percentile * finiteValues.length);
  return finiteValues[Math.min(index, finiteValues.length - 1)];
}

/**
 * Calculate multiple percentiles
 */
function calculatePercentiles(
  values: number[],
  percentiles: number[]
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const p of percentiles) {
    result[p * 100] = calculatePercentile(values, p);
  }
  return result;
}

// =============================================================================
// Scenario Impact Calculation
// =============================================================================

export interface ScenarioImpactParams {
  /** EBITDA change percentage */
  ebitdaChange: number;
  /** Interest rate change in basis points */
  rateChangeBps: number;
  /** Debt change percentage */
  debtChange: number;
  /** Revenue change percentage */
  revenueChange: number;
}

/**
 * Calculate deterministic scenario impact (single point estimate)
 */
export function calculateScenarioImpact(
  params: ScenarioImpactParams,
  context: SimulationContext
): Record<string, { ratio: number; headroom: number }> {
  const results: Record<string, { ratio: number; headroom: number }> = {};

  // Apply changes to metrics
  const metrics = {
    totalDebt: context.baseMetrics.totalDebt * (1 + params.debtChange / 100),
    ebitda: context.baseMetrics.ebitda * (1 + params.ebitdaChange / 100),
    interestExpense: context.baseMetrics.interestExpense * (1 + params.rateChangeBps / 10000),
    fixedCharges: context.baseMetrics.fixedCharges * (1 + params.rateChangeBps / 10000),
    netOperatingIncome: context.baseMetrics.netOperatingIncome * (1 + params.ebitdaChange / 100),
    totalDebtService: context.baseMetrics.totalDebtService,
    liquidity: context.baseMetrics.liquidity * (1 + params.revenueChange / 100 * 0.3), // Assume 30% flow-through
  };

  // Calculate each covenant
  for (const [covenantId, threshold] of Object.entries(context.covenantThresholds)) {
    let ratio: number;
    let headroom: number;

    switch (covenantId) {
      case 'leverage_ratio':
        ratio = calculateLeverageRatio(metrics.totalDebt, metrics.ebitda);
        headroom = ((threshold.threshold - ratio) / threshold.threshold) * 100;
        break;
      case 'interest_coverage':
        ratio = calculateInterestCoverage(metrics.ebitda, metrics.interestExpense);
        headroom = ((ratio - threshold.threshold) / threshold.threshold) * 100;
        break;
      case 'fixed_charge_coverage':
        ratio = calculateFixedChargeCoverage(metrics.ebitda, metrics.fixedCharges);
        headroom = ((ratio - threshold.threshold) / threshold.threshold) * 100;
        break;
      case 'debt_service_coverage':
        ratio = calculateDSCR(metrics.netOperatingIncome, metrics.totalDebtService);
        headroom = ((ratio - threshold.threshold) / threshold.threshold) * 100;
        break;
      case 'minimum_liquidity':
        ratio = metrics.liquidity;
        headroom = ((ratio - threshold.threshold) / threshold.threshold) * 100;
        break;
      default:
        continue;
    }

    results[covenantId] = { ratio, headroom };
  }

  return results;
}
