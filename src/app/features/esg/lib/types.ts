/**
 * ESG Facility Types
 *
 * This module defines types for ESG (Environmental, Social, Governance) facility
 * management, including sustainability-linked loans, green loans, and related
 * financial instruments.
 *
 * @module ESGTypes
 */

export type ESGLoanType =
  | 'sustainability_linked'
  | 'green_loan'
  | 'social_loan'
  | 'transition_loan'
  | 'esg_linked_hybrid';

export type PerformanceStatus = 'on_track' | 'at_risk' | 'off_track' | 'pending';
export type TargetStatus = 'achieved' | 'on_track' | 'at_risk' | 'off_track' | 'missed' | 'pending';
export type ReportStatus = 'draft' | 'submitted' | 'verified' | 'overdue';

/**
 * Represents an ESG-linked loan facility.
 *
 * ## Margin Adjustment Calculation Contract
 *
 * The margin adjustment mechanism works as follows:
 *
 * ### Core Invariant
 * ```
 * margin_adjustment_bps = sum(margin_history[*].adjustment_bps)
 * ```
 *
 * Where `margin_history` contains the quarterly adjustment records. The cumulative
 * effect of all periodic adjustments must equal the current `margin_adjustment_bps`.
 *
 * ### Margin Relationships
 * ```
 * current_margin_bps = base_margin_bps + margin_adjustment_bps
 * |margin_adjustment_bps| <= max_margin_adjustment_bps
 * ```
 *
 * ### Calculation Logic
 *
 * 1. **KPI Performance Assessment**: Each KPI has a `weight` (percentage, summing to 100)
 *    that determines its contribution to margin adjustments.
 *
 * 2. **Quarterly Adjustment**: At each measurement period, KPI performance is evaluated
 *    against targets. The adjustment is calculated based on:
 *    - Target achievement status (achieved, on_track, at_risk, off_track, missed)
 *    - KPI weight relative to total facility KPIs
 *    - Maximum adjustment cap (`max_margin_adjustment_bps`)
 *
 * 3. **Direction**:
 *    - **Negative adjustment** (margin reduction): Reward for achieving/exceeding targets
 *    - **Positive adjustment** (margin increase): Penalty for missing targets
 *
 * ### Example
 * ```typescript
 * // Facility with base margin 200 bps, max adjustment ±25 bps
 * // After Q1: Achieved targets → -5 bps adjustment
 * // After Q2: Achieved targets → -5 bps adjustment
 * // After Q3: Missed targets → +3 bps adjustment
 *
 * margin_history = [
 *   { period: 'Q1 2024', adjustment_bps: -5, cumulative_bps: -5 },
 *   { period: 'Q2 2024', adjustment_bps: -5, cumulative_bps: -10 },
 *   { period: 'Q3 2024', adjustment_bps: 3, cumulative_bps: -7 },
 * ];
 *
 * // Invariant: margin_adjustment_bps === -7 (sum of all adjustments)
 * // current_margin_bps === 200 + (-7) === 193 bps
 * ```
 *
 * @see MarginHistory - For tracking individual period adjustments
 * @see ESGKPI - For KPI definitions including weights
 * @see ESGFacilityDetail - For complete facility data with margin history
 */
export interface ESGFacility {
  id: string;
  facility_name: string;
  borrower_name: string;
  borrower_industry: string;
  esg_loan_type: ESGLoanType;
  commitment_amount: number;
  outstanding_amount: number;
  status: 'active' | 'pending' | 'closed';
  effective_date: string;
  maturity_date: string;
  framework_reference: string;
  /**
   * The initial margin rate in basis points before any ESG adjustments.
   * This serves as the reference point for all margin calculations.
   */
  base_margin_bps: number;
  /**
   * The current effective margin rate in basis points.
   *
   * **Invariant**: `current_margin_bps = base_margin_bps + margin_adjustment_bps`
   */
  current_margin_bps: number;
  /**
   * Maximum allowable margin adjustment (positive or negative) in basis points.
   * Defines the cap for both rewards (negative) and penalties (positive).
   *
   * **Constraint**: `|margin_adjustment_bps| <= max_margin_adjustment_bps`
   */
  max_margin_adjustment_bps: number;
  sustainability_coordinator?: string;
  external_verifier?: string;
  kpi_count: number;
  targets_achieved: number;
  targets_total: number;
  overall_performance_status: PerformanceStatus;
  next_reporting_date: string | null;
  /**
   * Cumulative margin adjustment in basis points from ESG performance.
   *
   * **Core Invariant**: This value MUST equal the sum of all `adjustment_bps`
   * values in the associated `margin_history` array.
   *
   * ```
   * margin_adjustment_bps = sum(margin_history[*].adjustment_bps)
   * ```
   *
   * - **Negative values**: Margin reduction (reward for good ESG performance)
   * - **Positive values**: Margin increase (penalty for poor ESG performance)
   * - **Zero**: No net adjustment from ESG performance
   */
  margin_adjustment_bps: number;
  created_at: string;
}

/**
 * Represents a Key Performance Indicator (KPI) for ESG tracking.
 *
 * KPIs are used to measure ESG performance and determine margin adjustments.
 */
export interface ESGKPI {
  id: string;
  kpi_name: string;
  kpi_category: KPICategory;
  unit: string;
  baseline_value: number;
  baseline_year: number;
  current_value: number;
  /**
   * The weight of this KPI in margin adjustment calculations, as a percentage.
   *
   * **Constraint**: The sum of all active KPI weights for a facility should equal 100.
   *
   * This weight determines how much this KPI contributes to the overall margin
   * adjustment. For example, a KPI with weight 35 contributes 35% of the total
   * possible margin adjustment.
   *
   * ### Margin Impact Calculation
   * ```
   * kpi_margin_impact = (weight / 100) * max_margin_adjustment_bps * performance_factor
   * ```
   *
   * Where `performance_factor` is determined by target achievement status.
   *
   * @see ESGFacility.margin_adjustment_bps - For total cumulative adjustment
   * @see ESGFacility.max_margin_adjustment_bps - For adjustment cap
   */
  weight: number;
  is_active: boolean;
  targets: ESGTarget[];
}

export type KPICategory =
  | 'environmental_emissions'
  | 'environmental_energy'
  | 'environmental_water'
  | 'environmental_waste'
  | 'environmental_biodiversity'
  | 'social_workforce'
  | 'social_health_safety'
  | 'social_community'
  | 'social_supply_chain'
  | 'governance_board'
  | 'governance_ethics'
  | 'governance_risk';

export interface KPICategoryConfig {
  label: string;
  colorClass: string;
}

export const KPI_CATEGORIES: Record<KPICategory, KPICategoryConfig> = {
  environmental_emissions: { label: 'Emissions', colorClass: 'bg-green-100 text-green-700' },
  environmental_energy: { label: 'Energy', colorClass: 'bg-green-100 text-green-700' },
  environmental_water: { label: 'Water', colorClass: 'bg-green-100 text-green-700' },
  environmental_waste: { label: 'Waste', colorClass: 'bg-green-100 text-green-700' },
  environmental_biodiversity: { label: 'Biodiversity', colorClass: 'bg-green-100 text-green-700' },
  social_workforce: { label: 'Workforce', colorClass: 'bg-purple-100 text-purple-700' },
  social_health_safety: { label: 'Health & Safety', colorClass: 'bg-purple-100 text-purple-700' },
  social_community: { label: 'Community', colorClass: 'bg-purple-100 text-purple-700' },
  social_supply_chain: { label: 'Supply Chain', colorClass: 'bg-purple-100 text-purple-700' },
  governance_board: { label: 'Board', colorClass: 'bg-blue-100 text-blue-700' },
  governance_ethics: { label: 'Ethics', colorClass: 'bg-blue-100 text-blue-700' },
  governance_risk: { label: 'Risk', colorClass: 'bg-blue-100 text-blue-700' },
};

export interface ESGTarget {
  target_year: number;
  target_value: number;
  target_status: TargetStatus;
  actual_value?: number;
}

export interface ESGRating {
  provider: string;
  rating: string;
  rating_date: string;
  outlook?: string;
}

export interface ESGReport {
  id: string;
  report_type: 'annual' | 'quarterly' | 'semi_annual';
  status: ReportStatus;
  period_end: string;
  submitted_at?: string;
}

/**
 * Tracks periodic margin adjustments for an ESG facility.
 *
 * Each entry represents a measurement period (typically quarterly) where
 * ESG performance is evaluated and margin adjustments are applied.
 *
 * ## Data Integrity Invariants
 *
 * 1. **Cumulative Calculation**:
 *    ```
 *    cumulative_bps[n] = cumulative_bps[n-1] + adjustment_bps[n]
 *    ```
 *    For the first entry: `cumulative_bps[0] = adjustment_bps[0]`
 *
 * 2. **Facility Sync**:
 *    The last entry's `cumulative_bps` MUST equal `ESGFacility.margin_adjustment_bps`:
 *    ```
 *    margin_history[last].cumulative_bps === facility.margin_adjustment_bps
 *    ```
 *
 * 3. **Sum Equivalence**:
 *    ```
 *    facility.margin_adjustment_bps = sum(margin_history[*].adjustment_bps)
 *    ```
 *
 * ## Example
 * ```typescript
 * const margin_history: MarginHistory[] = [
 *   { period: 'Q1 2024', adjustment_bps: -5, cumulative_bps: -5 },   // Met targets
 *   { period: 'Q2 2024', adjustment_bps: -5, cumulative_bps: -10 },  // Met targets
 *   { period: 'Q3 2024', adjustment_bps: 0, cumulative_bps: -10 },   // Neutral performance
 * ];
 *
 * // Sum of adjustments: -5 + -5 + 0 = -10
 * // Last cumulative_bps: -10
 * // facility.margin_adjustment_bps must equal -10
 * ```
 *
 * @see ESGFacility.margin_adjustment_bps - The cumulative total that must match
 */
export interface MarginHistory {
  /**
   * The measurement period identifier (e.g., 'Q1 2024', 'Q2 2024').
   * Periods should be chronologically ordered in the array.
   */
  period: string;
  /**
   * The margin adjustment for this specific period in basis points.
   *
   * - **Negative values**: Margin reduction (reward for meeting/exceeding targets)
   * - **Positive values**: Margin increase (penalty for missing targets)
   * - **Zero**: No adjustment for this period
   */
  adjustment_bps: number;
  /**
   * Running total of all adjustments up to and including this period.
   *
   * **Invariant**: `cumulative_bps = sum(adjustment_bps[0..current])`
   *
   * This value provides a quick reference for the total margin impact without
   * needing to sum all previous entries.
   */
  cumulative_bps: number;
}

/**
 * Extended ESG facility data including KPIs, ratings, reports, and margin history.
 *
 * ## Margin Calculation Invariants
 *
 * When working with this interface, the following invariants MUST be maintained:
 *
 * 1. **Sum Invariant**:
 *    ```
 *    margin_adjustment_bps = sum(margin_history[*].adjustment_bps)
 *    ```
 *
 * 2. **Current Margin**:
 *    ```
 *    current_margin_bps = base_margin_bps + margin_adjustment_bps
 *    ```
 *
 * 3. **Cumulative Consistency**:
 *    ```
 *    margin_history[last].cumulative_bps === margin_adjustment_bps
 *    ```
 *
 * 4. **KPI Weight Total**:
 *    ```
 *    sum(kpis.filter(k => k.is_active).map(k => k.weight)) === 100
 *    ```
 *
 * @see ESGFacility - Base facility interface with margin adjustment documentation
 * @see MarginHistory - Individual period adjustment records
 */
export interface ESGFacilityDetail extends ESGFacility {
  kpis: ESGKPI[];
  ratings: ESGRating[];
  reports: ESGReport[];
  /**
   * Chronological history of margin adjustments.
   *
   * The sum of all `adjustment_bps` values in this array MUST equal
   * the parent `margin_adjustment_bps` field.
   *
   * @see MarginHistory - For individual entry documentation and invariants
   */
  margin_history: MarginHistory[];
}

// Allocation Types
export type EligibleCategory =
  | 'renewable_energy'
  | 'energy_efficiency'
  | 'clean_transportation'
  | 'sustainable_water'
  | 'circular_economy'
  | 'green_buildings'
  | 'affordable_housing'
  | 'healthcare_access'
  | 'education'
  | 'employment_generation';

export interface AllocationProject {
  id: string;
  project_name: string;
  amount: number;
  date: string;
}

export interface AllocationCategory {
  id: string;
  category_name: string;
  eligible_category: EligibleCategory;
  eligible_amount: number;
  total_allocated: number;
  allocation_count: number;
  projects: AllocationProject[];
}

export interface FacilityAllocation {
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  esg_loan_type: ESGLoanType;
  commitment_amount: number;
  categories: AllocationCategory[];
  unallocated_amount: number;
  lookback_period_end: string;
}

// Dashboard Types
export interface DashboardStats {
  total_facilities: number;
  total_commitment: number;
  facilities_by_type: Record<ESGLoanType, number>;
  kpi_summary: {
    total_kpis: number;
    on_track: number;
    at_risk: number;
    off_track: number;
    pending_verification: number;
  };
  target_achievement: {
    total_targets: number;
    achieved: number;
    in_progress: number;
    missed: number;
    achievement_rate: number;
  };
  allocation_summary: {
    total_allocated: number;
    total_eligible: number;
    unallocated: number;
    utilization_rate: number;
  };
  reporting_status: {
    reports_due: number;
    reports_submitted: number;
    reports_overdue: number;
  };
}

export interface UpcomingDeadline {
  type: 'report' | 'target' | 'verification' | 'allocation';
  description: string;
  deadline: string;
  facility_id: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RecentActivity {
  id: string;
  type: 'performance_submitted' | 'target_achieved' | 'rating_updated' | 'allocation_made';
  description: string;
  facility_name: string;
  occurred_at: string;
}

/**
 * Summary of a facility with at-risk KPIs that may trigger margin adjustments.
 */
export interface FacilityAtRisk {
  id: string;
  facility_name: string;
  borrower_name: string;
  esg_loan_type: ESGLoanType;
  at_risk_kpis: number;
  next_deadline: string;
  /**
   * Potential margin impact in basis points if at-risk KPIs fail.
   *
   * Calculated as:
   * ```
   * margin_impact_bps = sum(at_risk_kpis.weight) * max_margin_adjustment_bps / 100
   * ```
   *
   * This represents the worst-case margin increase if all at-risk KPIs miss targets.
   */
  margin_impact_bps: number;
}

// ============================================
// Prediction Types
// ============================================

export type PredictionConfidence = 'high' | 'medium' | 'low';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface KPIPrediction {
  kpi_id: string;
  kpi_name: string;
  kpi_category: KPICategory;
  unit: string;
  current_value: number;
  baseline_value: number;
  target_value: number;
  target_date: string;
  predicted_value: number;
  prediction_date: string;
  confidence: PredictionConfidence;
  confidence_score: number; // 0-100
  trend: TrendDirection;
  will_miss_target: boolean;
  days_until_deadline: number;
  gap_to_target: number;
  gap_percentage: number;
  historical_data: Array<{
    period: string;
    value: number;
  }>;
  prediction_factors: string[];
  seasonal_adjustment?: number;
}

/**
 * Predicts future margin adjustments based on KPI performance forecasts.
 *
 * ## Calculation Logic
 *
 * The predicted margin is calculated by:
 * 1. Forecasting each KPI's performance at the target date
 * 2. Applying KPI weights to determine individual contributions
 * 3. Summing weighted contributions (capped by max_adjustment_bps)
 *
 * ### Margin Prediction Formula
 * ```
 * predicted_margin_bps = base_margin_bps + predicted_adjustment_bps
 * predicted_adjustment_bps = sum(contributing_kpis[*].contribution_bps)
 * |predicted_adjustment_bps| <= max_adjustment_bps
 * ```
 *
 * ### KPI Contribution Calculation
 * ```
 * contribution_bps = kpi.weight * performance_factor * (max_adjustment_bps / 100)
 * ```
 *
 * Where `performance_factor` ranges from -1 (fully achieved) to +1 (fully missed).
 *
 * @see ESGFacility - For current margin adjustment invariants
 * @see ESGKPI.weight - For KPI weighting in calculations
 */
export interface MarginImpactPrediction {
  facility_id: string;
  facility_name: string;
  /**
   * Current effective margin rate in basis points.
   * Should equal `base_margin_bps + current_adjustment` from the facility.
   */
  current_margin_bps: number;
  /**
   * Base margin before any ESG adjustments. Used as reference for predictions.
   */
  base_margin_bps: number;
  /**
   * Predicted future margin rate in basis points.
   *
   * **Invariant**: `predicted_margin_bps = base_margin_bps + predicted_adjustment_bps`
   */
  predicted_margin_bps: number;
  /**
   * Predicted total adjustment from base margin.
   *
   * **Constraint**: `|predicted_adjustment_bps| <= max_adjustment_bps`
   * **Formula**: `sum(contributing_kpis[*].contribution_bps)`
   */
  predicted_adjustment_bps: number;
  /**
   * Maximum allowable adjustment (positive or negative).
   * Prediction adjustments are capped at this value.
   */
  max_adjustment_bps: number;
  financial_impact: {
    annual_interest_cost_change: number;
    outstanding_amount: number;
    percentage_change: number;
  };
  /**
   * Breakdown of margin impact by KPI.
   *
   * **Invariant**: `sum(contributing_kpis[*].contribution_bps) === predicted_adjustment_bps`
   */
  contributing_kpis: Array<{
    kpi_name: string;
    contribution_bps: number;
    will_miss: boolean;
  }>;
  confidence: PredictionConfidence;
  effective_date: string;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  interventions: Intervention[];
  original_prediction: KPIPrediction;
  adjusted_prediction: KPIPrediction;
  margin_impact_change: number;
  financial_benefit: number;
  implementation_cost?: number;
  roi?: number;
  probability_of_success: number;
  time_to_implement: string;
}

export interface Intervention {
  id: string;
  name: string;
  description: string;
  kpi_impact: number;
  kpi_impact_percentage: number;
  cost_estimate?: number;
  time_to_effect: string;
  category: 'operational' | 'capital' | 'strategic' | 'regulatory';
  risk_level: RiskLevel;
  dependencies?: string[];
}

export interface FacilityPrediction {
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  esg_loan_type: ESGLoanType;
  overall_risk_level: RiskLevel;
  prediction_date: string;
  prediction_horizon_days: number;
  kpi_predictions: KPIPrediction[];
  margin_impact: MarginImpactPrediction;
  what_if_scenarios: WhatIfScenario[];
  recommended_actions: RecommendedAction[];
  summary: PredictionSummary;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expected_impact: string;
  kpis_affected: string[];
  deadline?: string;
  estimated_effort: string;
  potential_margin_benefit_bps: number;
}

export interface PredictionSummary {
  total_kpis: number;
  kpis_on_track: number;
  kpis_at_risk: number;
  kpis_off_track: number;
  predicted_margin_change_bps: number;
  financial_exposure: number;
  earliest_deadline: string;
  highest_priority_action: string;
}

export interface PortfolioPrediction {
  generated_at: string;
  prediction_horizon_days: number;
  total_facilities: number;
  facilities_at_risk: number;
  total_financial_exposure: number;
  aggregate_margin_impact_bps: number;
  facility_predictions: FacilityPrediction[];
  portfolio_summary: {
    green_facilities: number;
    amber_facilities: number;
    red_facilities: number;
    total_potential_step_ups: number;
    total_potential_savings: number;
  };
  top_interventions: Intervention[];
}

// ============================================
// Portfolio Optimization Types
// ============================================

export type IndustryCategory =
  | 'manufacturing'
  | 'real_estate'
  | 'energy'
  | 'technology'
  | 'healthcare'
  | 'financial_services'
  | 'consumer_goods'
  | 'utilities'
  | 'transportation'
  | 'construction';

export type ESGRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ConcentrationLevel = 'within_limits' | 'approaching_limit' | 'exceeds_limit';

export interface PortfolioConcentration {
  dimension: 'loan_type' | 'industry' | 'geography' | 'borrower';
  name: string;
  exposure: number;
  percentage: number;
  limit_percentage: number;
  status: ConcentrationLevel;
  facility_count: number;
  avg_esg_score: number;
}

export interface SectorAllocation {
  sector: IndustryCategory;
  label: string;
  exposure: number;
  percentage: number;
  facility_count: number;
  avg_esg_performance: number;
  target_percentage: number;
  variance: number;
  risk_level: ESGRiskLevel;
}

export interface LoanTypeAllocation {
  loan_type: ESGLoanType;
  exposure: number;
  percentage: number;
  facility_count: number;
  avg_margin_bps: number;
  target_percentage: number;
  variance: number;
}

export interface DiversificationOpportunity {
  id: string;
  title: string;
  description: string;
  category: 'sector' | 'loan_type' | 'geography' | 'esg_theme';
  current_exposure_pct: number;
  target_exposure_pct: number;
  gap_amount: number;
  potential_facilities: SyndicationOpportunity[];
  expected_portfolio_impact: {
    esg_score_improvement: number;
    risk_reduction_pct: number;
    yield_impact_bps: number;
  };
  priority: 'high' | 'medium' | 'low';
}

export interface SyndicationOpportunity {
  id: string;
  facility_name: string;
  borrower_name: string;
  borrower_industry: IndustryCategory;
  esg_loan_type: ESGLoanType;
  total_facility_amount: number;
  available_participation: number;
  min_participation: number;
  lead_arranger: string;
  syndication_deadline: string;
  esg_rating: string;
  esg_score: number;
  margin_bps: number;
  maturity_date: string;
  key_kpis: string[];
  framework_alignment: string[];
  match_score: number;
  recommendation_reason: string;
}

export interface DivestmentCandidate {
  id: string;
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  borrower_industry: IndustryCategory;
  esg_loan_type: ESGLoanType;
  current_exposure: number;
  current_margin_bps: number;
  esg_performance: PerformanceStatus;
  esg_score: number;
  reason: string[];
  expected_market_price_pct: number;
  portfolio_impact: {
    exposure_reduction: number;
    esg_score_improvement: number;
    concentration_improvement: number;
  };
  priority: 'high' | 'medium' | 'low';
}

export interface MarketBenchmark {
  metric_name: string;
  metric_category: 'esg_performance' | 'portfolio_composition' | 'yield' | 'risk';
  portfolio_value: number;
  market_average: number;
  top_quartile: number;
  bottom_quartile: number;
  percentile_rank: number;
  unit: string;
  trend: TrendDirection;
}

export interface ESGPortfolioScore {
  overall_score: number;
  environmental_score: number;
  social_score: number;
  governance_score: number;
  methodology: string;
  last_updated: string;
  peer_comparison: {
    rank: number;
    total_peers: number;
    percentile: number;
  };
}

export interface PortfolioOptimizationScenario {
  id: string;
  name: string;
  description: string;
  type: 'aggressive_esg' | 'balanced' | 'yield_focused' | 'risk_minimization' | 'custom';
  target_allocations: {
    loan_type: Record<ESGLoanType, number>;
    sector: Record<IndustryCategory, number>;
  };
  expected_outcomes: {
    portfolio_esg_score: number;
    weighted_avg_yield_bps: number;
    concentration_risk_score: number;
    carbon_intensity_reduction_pct: number;
  };
  required_actions: {
    participate: SyndicationOpportunity[];
    divest: DivestmentCandidate[];
    estimated_execution_period: string;
  };
  feasibility_score: number;
}

export interface InstitutionalESGTarget {
  id: string;
  name: string;
  description: string;
  category: 'emissions' | 'renewable' | 'diversity' | 'allocation' | 'rating';
  target_value: number;
  current_value: number;
  target_date: string;
  unit: string;
  progress_percentage: number;
  status: TargetStatus;
  contributing_facilities: string[];
  gap_analysis: string;
}

export interface PortfolioOptimizationSummary {
  generated_at: string;
  total_portfolio_value: number;
  total_facilities: number;
  portfolio_esg_score: ESGPortfolioScore;
  concentration_analysis: PortfolioConcentration[];
  sector_allocation: SectorAllocation[];
  loan_type_allocation: LoanTypeAllocation[];
  diversification_opportunities: DiversificationOpportunity[];
  syndication_opportunities: SyndicationOpportunity[];
  divestment_candidates: DivestmentCandidate[];
  market_benchmarks: MarketBenchmark[];
  institutional_targets: InstitutionalESGTarget[];
  optimization_scenarios: PortfolioOptimizationScenario[];
  recommended_actions: OptimizationAction[];
}

export interface OptimizationAction {
  id: string;
  title: string;
  description: string;
  action_type: 'participate' | 'divest' | 'rebalance' | 'monitor';
  priority: 'critical' | 'high' | 'medium' | 'low';
  expected_impact: string;
  target_metric: string;
  estimated_value: number;
  deadline?: string;
  related_facilities: string[];
}

// ============================================
// Peer Benchmarking Types
// ============================================

export type PeerPositioning = 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
export type PerformanceTrend = 'improving' | 'stable' | 'declining';

/**
 * Defines a custom peer group for benchmarking
 */
export interface PeerGroupDefinition {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  definition: {
    industry_codes?: string[];
    industries?: string[];
    loan_types?: ESGLoanType[];
    commitment_range?: {
      min?: number;
      max?: number;
    };
    geography?: string[];
    is_custom: boolean;
  };
  member_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * KPI performance data for a single peer
 */
export interface PeerKPIData {
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  borrower_industry: string;
  kpi_id: string;
  kpi_name: string;
  kpi_category: KPICategory;
  unit: string;
  current_value: number;
  baseline_value: number;
  target_value: number;
  improvement_direction: 'increase' | 'decrease';
  performance_percentage: number; // percentage of target achieved
  trend: PerformanceTrend;
}

/**
 * Percentile ranking for a single KPI against peers
 */
export interface KPIPercentileRanking {
  kpi_id: string;
  kpi_name: string;
  kpi_category: KPICategory;
  unit: string;
  facility_value: number;
  percentile: number; // 0-100
  rank: number;
  total_peers: number;
  positioning: PeerPositioning;
  peer_min: number;
  peer_max: number;
  peer_median: number;
  peer_mean: number;
  peer_25th: number;
  peer_75th: number;
  best_in_class: {
    facility_name: string;
    value: number;
  };
  improvement_to_next_quartile: number;
  trajectory?: KPITrajectoryComparison;
}

/**
 * Trajectory comparison over time
 */
export interface KPITrajectoryComparison {
  periods: Array<{
    period: string;
    facility_value: number;
    peer_median: number;
    peer_25th: number;
    peer_75th: number;
    percentile: number;
  }>;
  trend: PerformanceTrend;
  peer_trend: PerformanceTrend;
  relative_improvement: number; // positive means outpacing peers
  forecast_percentile?: number;
}

/**
 * Complete peer ranking result for a facility
 */
export interface FacilityPeerRanking {
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  borrower_industry: string;
  peer_group: {
    id: string;
    name: string;
    member_count: number;
    description?: string;
  };
  overall_percentile: number;
  overall_positioning: PeerPositioning;
  kpi_rankings: KPIPercentileRanking[];
  category_rankings: Array<{
    category: KPICategory;
    percentile: number;
    positioning: PeerPositioning;
    kpi_count: number;
  }>;
  strengths: Array<{
    kpi_name: string;
    percentile: number;
    insight: string;
  }>;
  weaknesses: Array<{
    kpi_name: string;
    percentile: number;
    insight: string;
    improvement_potential: string;
  }>;
  trajectory_summary?: {
    improving_kpis: number;
    stable_kpis: number;
    declining_kpis: number;
    overall_trend: PerformanceTrend;
    peer_comparison: string;
  };
  generated_at: string;
}

/**
 * Peer comparison distribution for a specific KPI
 */
export interface KPIPeerDistribution {
  kpi_id: string;
  kpi_name: string;
  kpi_category: KPICategory;
  unit: string;
  peer_group: {
    id: string;
    name: string;
    member_count: number;
  };
  facility_value: number;
  facility_percentile: number;
  distribution: {
    buckets: Array<{
      range_start: number;
      range_end: number;
      count: number;
      percentage: number;
      includes_facility: boolean;
    }>;
    statistics: {
      min: number;
      max: number;
      mean: number;
      median: number;
      std_dev: number;
      quartiles: [number, number, number];
    };
  };
  top_performers: Array<{
    rank: number;
    facility_name: string;
    borrower_name: string;
    value: number;
  }>;
  bottom_performers: Array<{
    rank: number;
    facility_name: string;
    borrower_name: string;
    value: number;
  }>;
}

/**
 * Portfolio-wide peer benchmarking summary
 */
export interface PortfolioPeerBenchmark {
  organization_id: string;
  generated_at: string;
  peer_group: {
    id: string;
    name: string;
    member_count: number;
  };
  portfolio_summary: {
    total_facilities: number;
    avg_percentile: number;
    median_percentile: number;
    leaders_count: number;
    above_average_count: number;
    average_count: number;
    below_average_count: number;
    laggards_count: number;
  };
  category_performance: Array<{
    category: KPICategory;
    avg_percentile: number;
    positioning: PeerPositioning;
    best_facility: string;
    worst_facility: string;
  }>;
  facility_rankings: Array<{
    facility_id: string;
    facility_name: string;
    borrower_name: string;
    overall_percentile: number;
    positioning: PeerPositioning;
    trend: PerformanceTrend;
  }>;
  improvement_opportunities: Array<{
    facility_id: string;
    facility_name: string;
    kpi_name: string;
    current_percentile: number;
    target_percentile: number;
    required_improvement: number;
    impact_assessment: string;
  }>;
  best_practices: Array<{
    category: KPICategory;
    practice: string;
    adopted_by_leaders: number;
    recommendation: string;
  }>;
}

/**
 * AI-generated peer benchmarking insights
 */
export interface PeerBenchmarkInsights {
  facility_id: string;
  facility_name: string;
  peer_group_name: string;
  executive_summary: string;
  competitive_position: {
    overall_assessment: string;
    key_differentiators: string[];
    areas_of_concern: string[];
  };
  kpi_insights: Array<{
    kpi_name: string;
    kpi_category: KPICategory;
    percentile: number;
    insight: string;
    action_items: string[];
  }>;
  improvement_roadmap: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    kpi_name: string;
    current_percentile: number;
    target_percentile: number;
    actions: string[];
    expected_timeline: string;
    estimated_impact: string;
  }>;
  peer_leader_analysis: {
    leader_name: string;
    leader_percentile: number;
    key_practices: string[];
    applicable_learnings: string[];
  };
  trajectory_forecast: {
    current_trend: PerformanceTrend;
    projected_percentile_6m: number;
    projected_percentile_12m: number;
    risk_factors: string[];
    opportunities: string[];
  };
}
