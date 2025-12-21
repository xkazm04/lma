// =============================================================================
// Compliance Simulation Sandbox Types
// =============================================================================

import type { Covenant, CovenantStatus, IndustrySector, BenchmarkCovenantType } from '../../lib/types';

// =============================================================================
// Scenario Types
// =============================================================================

/**
 * Types of scenarios that can be simulated
 */
export type ScenarioType =
  | 'rate_change'           // Interest rate changes
  | 'ebitda_fluctuation'    // EBITDA changes
  | 'ma_event'              // M&A events (acquisition, divestiture)
  | 'industry_downturn'     // Sector-wide economic stress
  | 'custom';               // User-defined scenarios

/**
 * Severity levels for stress scenarios
 */
export type StressSeverity = 'mild' | 'moderate' | 'severe' | 'extreme';

/**
 * Status of a simulation run
 */
export type SimulationStatus = 'draft' | 'running' | 'completed' | 'failed';

/**
 * Impact level for covenant effects
 */
export type ImpactLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical';

/**
 * Helper function for impact level color styling
 */
export function getImpactLevelColor(level: ImpactLevel): string {
  switch (level) {
    case 'none':
      return 'bg-zinc-100 text-zinc-600';
    case 'low':
      return 'bg-green-100 text-green-700';
    case 'moderate':
      return 'bg-amber-100 text-amber-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'critical':
      return 'bg-red-100 text-red-700';
  }
}

/**
 * Helper function for stress severity color styling
 */
export function getStressSeverityColor(severity: StressSeverity): string {
  switch (severity) {
    case 'mild':
      return 'bg-green-100 text-green-700';
    case 'moderate':
      return 'bg-amber-100 text-amber-700';
    case 'severe':
      return 'bg-orange-100 text-orange-700';
    case 'extreme':
      return 'bg-red-100 text-red-700';
  }
}

/**
 * Helper function for scenario type label
 */
export function getScenarioTypeLabel(type: ScenarioType): string {
  switch (type) {
    case 'rate_change':
      return 'Interest Rate Change';
    case 'ebitda_fluctuation':
      return 'EBITDA Fluctuation';
    case 'ma_event':
      return 'M&A Event';
    case 'industry_downturn':
      return 'Industry Downturn';
    case 'custom':
      return 'Custom Scenario';
  }
}

/**
 * Helper function for scenario type icon color
 */
export function getScenarioTypeIconColor(type: ScenarioType): string {
  switch (type) {
    case 'rate_change':
      return 'text-blue-600';
    case 'ebitda_fluctuation':
      return 'text-purple-600';
    case 'ma_event':
      return 'text-green-600';
    case 'industry_downturn':
      return 'text-orange-600';
    case 'custom':
      return 'text-zinc-600';
  }
}

// =============================================================================
// Scenario Parameter Types
// =============================================================================

/**
 * Base interface for scenario parameters
 */
export interface BaseScenarioParams {
  /** Unique identifier for the parameter set */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the scenario */
  description: string;
  /** Type of scenario */
  type: ScenarioType;
  /** Stress severity level */
  severity: StressSeverity;
  /** Time horizon in quarters */
  time_horizon_quarters: number;
}

/**
 * Rate change scenario parameters
 */
export interface RateChangeParams extends BaseScenarioParams {
  type: 'rate_change';
  /** Basis points change (+/-) */
  basis_points_change: number;
  /** Whether change is gradual or immediate */
  change_type: 'immediate' | 'gradual';
  /** If gradual, number of quarters to reach full effect */
  ramp_quarters?: number;
}

/**
 * EBITDA fluctuation scenario parameters
 */
export interface EbitdaFluctuationParams extends BaseScenarioParams {
  type: 'ebitda_fluctuation';
  /** Percentage change in EBITDA (+/-) */
  ebitda_change_percentage: number;
  /** Specific quarters affected (optional) */
  affected_quarters?: number[];
  /** Whether impact is permanent or temporary */
  impact_duration: 'permanent' | 'temporary';
  /** If temporary, recovery period in quarters */
  recovery_quarters?: number;
}

/**
 * M&A event scenario parameters
 */
export interface MAEventParams extends BaseScenarioParams {
  type: 'ma_event';
  /** Type of M&A event */
  event_type: 'acquisition' | 'divestiture' | 'merger';
  /** Transaction value as percentage of current enterprise value */
  transaction_value_percentage: number;
  /** Debt assumed or paid down */
  debt_change_percentage: number;
  /** EBITDA impact from synergies or lost business */
  ebitda_synergy_percentage: number;
  /** Quarters until synergies are realized */
  synergy_realization_quarters: number;
}

/**
 * Industry downturn scenario parameters
 */
export interface IndustryDownturnParams extends BaseScenarioParams {
  type: 'industry_downturn';
  /** Affected industry sector */
  affected_industry: IndustrySector;
  /** Revenue decline percentage */
  revenue_decline_percentage: number;
  /** Margin compression in basis points */
  margin_compression_bps: number;
  /** Duration of downturn in quarters */
  downturn_duration_quarters: number;
  /** Shape of recovery */
  recovery_shape: 'v' | 'u' | 'w' | 'l';
}

/**
 * Custom scenario parameters
 */
export interface CustomScenarioParams extends BaseScenarioParams {
  type: 'custom';
  /** Custom financial impacts */
  impacts: {
    revenue_change_percentage?: number;
    ebitda_change_percentage?: number;
    interest_rate_change_bps?: number;
    debt_change_percentage?: number;
    cash_change_percentage?: number;
    capex_change_percentage?: number;
  };
}

/**
 * Union type for all scenario parameters
 */
export type ScenarioParams =
  | RateChangeParams
  | EbitdaFluctuationParams
  | MAEventParams
  | IndustryDownturnParams
  | CustomScenarioParams;

// =============================================================================
// Monte Carlo Simulation Types
// =============================================================================

/**
 * Distribution types for Monte Carlo simulation
 */
export type DistributionType = 'normal' | 'uniform' | 'triangular' | 'lognormal';

/**
 * A single variable in the Monte Carlo simulation
 */
export interface SimulationVariable {
  /** Variable identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Base/expected value */
  base_value: number;
  /** Distribution type */
  distribution: DistributionType;
  /** Standard deviation (for normal/lognormal) */
  std_dev?: number;
  /** Min value (for uniform/triangular) */
  min_value?: number;
  /** Max value (for uniform/triangular) */
  max_value?: number;
  /** Most likely value (for triangular) */
  mode_value?: number;
  /** Correlation with other variables */
  correlations?: Record<string, number>;
}

/**
 * Monte Carlo simulation configuration
 */
export interface MonteCarloConfig {
  /** Number of simulation iterations */
  iterations: number;
  /** Confidence levels to calculate (e.g., [0.05, 0.25, 0.5, 0.75, 0.95]) */
  confidence_levels: number[];
  /** Random seed for reproducibility */
  random_seed?: number;
  /** Variables to simulate */
  variables: SimulationVariable[];
}

/**
 * Result of a single Monte Carlo iteration
 */
export interface MonteCarloIteration {
  /** Iteration number */
  iteration: number;
  /** Variable values for this iteration */
  variable_values: Record<string, number>;
  /** Calculated covenant ratios */
  covenant_ratios: Record<string, number>;
  /** Calculated headroom percentages */
  headroom_values: Record<string, number>;
  /** Whether any covenant breached */
  any_breach: boolean;
  /** List of breached covenants */
  breached_covenants: string[];
}

/**
 * Probability distribution for a covenant metric
 */
export interface ProbabilityDistribution {
  /** Covenant identifier */
  covenant_id: string;
  /** Metric name (e.g., 'ratio', 'headroom') */
  metric: string;
  /** Mean value */
  mean: number;
  /** Standard deviation */
  std_dev: number;
  /** Minimum observed value */
  min: number;
  /** Maximum observed value */
  max: number;
  /** Percentile values */
  percentiles: Record<number, number>;
  /** Probability of breach */
  breach_probability: number;
}

/**
 * Complete Monte Carlo simulation result
 */
export interface MonteCarloResult {
  /** Unique result identifier */
  id: string;
  /** Configuration used */
  config: MonteCarloConfig;
  /** When simulation was run */
  run_at: string;
  /** Total runtime in milliseconds */
  runtime_ms: number;
  /** Number of successful iterations */
  successful_iterations: number;
  /** Probability distributions for each covenant */
  distributions: Record<string, ProbabilityDistribution>;
  /** Overall portfolio breach probability */
  portfolio_breach_probability: number;
  /** Expected number of breaches */
  expected_breaches: number;
  /** Worst case scenario summary */
  worst_case: {
    breach_count: number;
    affected_covenants: string[];
    total_exposure: number;
  };
  /** Summary statistics */
  summary: {
    mean_portfolio_headroom: number;
    std_dev_portfolio_headroom: number;
    var_95: number; // Value at Risk at 95%
    var_99: number; // Value at Risk at 99%
  };
}

// =============================================================================
// Stress Testing Templates
// =============================================================================

/**
 * Regulatory stress test type
 */
export type RegulatoryTestType =
  | 'fed_ccar'          // Federal Reserve CCAR
  | 'fed_dfast'         // Federal Reserve DFAST
  | 'eba_stress'        // European Banking Authority
  | 'pra_stress'        // UK Prudential Regulation Authority
  | 'custom';

/**
 * A predefined stress testing template
 */
export interface StressTestTemplate {
  /** Template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Description */
  description: string;
  /** Regulatory test type */
  regulatory_type: RegulatoryTestType;
  /** Is this a built-in template */
  is_builtin: boolean;
  /** Created by user */
  created_by?: string;
  /** Created at */
  created_at: string;
  /** Last updated */
  updated_at: string;
  /** Scenario parameters */
  scenarios: ScenarioParams[];
  /** Default Monte Carlo configuration */
  monte_carlo_config?: MonteCarloConfig;
  /** Tags for categorization */
  tags: string[];
}

// =============================================================================
// Simulation Session Types
// =============================================================================

/**
 * A saved simulation scenario with version control
 */
export interface SimulationScenario {
  /** Unique scenario identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** Version number */
  version: number;
  /** Parent scenario ID (for version history) */
  parent_id?: string;
  /** Created by user */
  created_by: string;
  /** Created at */
  created_at: string;
  /** Last modified */
  modified_at: string;
  /** Status */
  status: SimulationStatus;
  /** Scenario parameters */
  params: ScenarioParams[];
  /** Monte Carlo configuration */
  monte_carlo_config?: MonteCarloConfig;
  /** Selected covenants to simulate */
  selected_covenant_ids: string[];
  /** Selected facility IDs */
  selected_facility_ids: string[];
  /** Tags */
  tags: string[];
  /** Is this scenario shared with team */
  is_shared: boolean;
  /** Collaborators */
  collaborators: string[];
  /** Notes/comments */
  notes?: string;
}

/**
 * A comment on a simulation scenario
 */
export interface ScenarioComment {
  /** Comment identifier */
  id: string;
  /** Scenario ID */
  scenario_id: string;
  /** Author */
  author: string;
  /** Comment text */
  text: string;
  /** Created at */
  created_at: string;
  /** Parent comment ID (for replies) */
  parent_id?: string;
  /** Is resolved */
  is_resolved: boolean;
}

// =============================================================================
// Simulation Results
// =============================================================================

/**
 * Impact on a single covenant
 */
export interface CovenantImpact {
  /** Covenant ID */
  covenant_id: string;
  /** Covenant name */
  covenant_name: string;
  /** Facility name */
  facility_name: string;
  /** Borrower name */
  borrower_name: string;
  /** Covenant type */
  covenant_type: string;
  /** Current ratio/value */
  current_value: number;
  /** Current threshold */
  current_threshold: number;
  /** Current headroom percentage */
  current_headroom: number;
  /** Projected value after scenario */
  projected_value: number;
  /** Projected headroom */
  projected_headroom: number;
  /** Headroom change */
  headroom_change: number;
  /** Would breach occur */
  would_breach: boolean;
  /** Current status */
  current_status: CovenantStatus;
  /** Projected status */
  projected_status: CovenantStatus;
  /** Impact level */
  impact_level: ImpactLevel;
  /** Quarterly projections */
  quarterly_projections: QuarterlyProjection[];
}

/**
 * Quarterly projection for a covenant
 */
export interface QuarterlyProjection {
  /** Quarter label (e.g., "Q1 2025") */
  quarter: string;
  /** Projected ratio/value */
  projected_value: number;
  /** Projected headroom percentage */
  projected_headroom: number;
  /** Breach probability (if Monte Carlo) */
  breach_probability?: number;
  /** Confidence interval (if Monte Carlo) */
  confidence_interval?: {
    lower: number;
    upper: number;
    confidence_level: number;
  };
}

/**
 * Cascade effect when multiple covenants are affected
 */
export interface CascadeEffect {
  /** Primary affected covenant */
  primary_covenant_id: string;
  /** Secondary affected covenants */
  affected_covenants: {
    covenant_id: string;
    relationship: 'cross_default' | 'acceleration' | 'correlation';
    impact_delay_quarters: number;
    impact_probability: number;
  }[];
  /** Total exposure at risk */
  total_exposure_at_risk: number;
  /** Description of cascade */
  description: string;
}

/**
 * Complete simulation result
 */
export interface SimulationResult {
  /** Result identifier */
  id: string;
  /** Associated scenario ID */
  scenario_id: string;
  /** Scenario name */
  scenario_name: string;
  /** When simulation was run */
  run_at: string;
  /** Runtime in milliseconds */
  runtime_ms: number;
  /** Status */
  status: 'completed' | 'failed';
  /** Error message if failed */
  error?: string;
  /** Scenario parameters used */
  params: ScenarioParams[];
  /** Individual covenant impacts */
  covenant_impacts: CovenantImpact[];
  /** Cascade effects */
  cascade_effects: CascadeEffect[];
  /** Monte Carlo results (if applicable) */
  monte_carlo_result?: MonteCarloResult;
  /** Summary statistics */
  summary: {
    total_covenants_analyzed: number;
    covenants_at_risk_before: number;
    covenants_at_risk_after: number;
    covenants_breached_before: number;
    covenants_breached_after: number;
    new_breaches: number;
    worst_affected_covenant: string;
    worst_headroom_change: number;
    total_exposure_at_risk: number;
  };
  /** AI-generated insights */
  insights: string[];
  /** Recommended actions */
  recommendations: string[];
}

// =============================================================================
// Comparison Types
// =============================================================================

/**
 * Comparison between two scenarios
 */
export interface ScenarioComparison {
  /** Comparison identifier */
  id: string;
  /** Scenario A */
  scenario_a: SimulationScenario;
  /** Scenario B */
  scenario_b: SimulationScenario;
  /** Result A */
  result_a: SimulationResult;
  /** Result B */
  result_b: SimulationResult;
  /** Differences */
  differences: {
    covenant_id: string;
    metric: string;
    value_a: number;
    value_b: number;
    difference: number;
    difference_percentage: number;
  }[];
  /** Summary */
  summary: string;
  /** Created at */
  created_at: string;
}

// =============================================================================
// Dashboard Stats
// =============================================================================

/**
 * Simulation sandbox dashboard statistics
 */
export interface SimulationDashboardStats {
  /** Total saved scenarios */
  total_scenarios: number;
  /** Scenarios run this month */
  runs_this_month: number;
  /** Average covenants at risk across all scenarios */
  avg_at_risk_covenants: number;
  /** Most common scenario type */
  most_common_scenario_type: ScenarioType;
  /** Last simulation run date */
  last_run_at: string;
  /** Total simulations run */
  total_runs: number;
  /** Available stress test templates */
  available_templates: number;
  /** Team members with access */
  team_members_with_access: number;
}

// =============================================================================
// Filter Types
// =============================================================================

/**
 * Filter options for simulation scenarios
 */
export interface SimulationFilters {
  /** Search query */
  search: string;
  /** Scenario type filter */
  type: ScenarioType | 'all';
  /** Status filter */
  status: SimulationStatus | 'all';
  /** Severity filter */
  severity: StressSeverity | 'all';
  /** Date range filter */
  date_range: 'all' | 'today' | 'week' | 'month' | 'quarter';
  /** Created by filter */
  created_by: string | 'all';
  /** Tags filter */
  tags: string[];
}
