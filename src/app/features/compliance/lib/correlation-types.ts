/**
 * Cross-Facility Covenant Correlation Network Types
 *
 * Models how covenant breaches propagate across facilities within a borrower portfolio,
 * revealing systemic vulnerabilities and contagion risks.
 */

import type { BenchmarkCovenantType } from './types';

/**
 * Correlation strength between two covenants.
 */
export type CorrelationStrength = 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';

/**
 * Direction of correlation (positive or negative).
 */
export type CorrelationDirection = 'positive' | 'negative';

/**
 * Lead-lag relationship type.
 */
export type LeadLagType = 'leading' | 'lagging' | 'synchronous';

/**
 * Node type in the correlation network.
 */
export type NetworkNodeType = 'covenant' | 'facility' | 'borrower';

/**
 * Statistical correlation metrics between two covenants.
 */
export interface CovenantCorrelation {
  /** Source covenant ID */
  from_covenant_id: string;

  /** Target covenant ID */
  to_covenant_id: string;

  /** Pearson correlation coefficient (-1 to 1) */
  correlation_coefficient: number;

  /** Statistical significance (p-value) */
  p_value: number;

  /** Correlation strength category */
  strength: CorrelationStrength;

  /** Direction of correlation */
  direction: CorrelationDirection;

  /** Lead-lag relationship in quarters (positive = source leads target) */
  lead_lag_quarters: number;

  /** Lead-lag type */
  lead_lag_type: LeadLagType;

  /** Number of data points used in calculation */
  sample_size: number;

  /** Date range of data used */
  data_start_date: string;
  data_end_date: string;

  /** Last calculation timestamp */
  calculated_at: string;
}

/**
 * Extended correlation with breach propagation probability.
 */
export interface BreachPropagationEdge extends CovenantCorrelation {
  /** Probability that a breach in source triggers breach in target (0-100) */
  propagation_probability: number;

  /** Average time to propagation in quarters */
  avg_propagation_time_quarters: number;

  /** Historical breach co-occurrence rate (0-100) */
  co_breach_rate: number;

  /** Number of historical co-breach events observed */
  co_breach_count: number;
}

/**
 * Node in the correlation network graph.
 */
export interface CorrelationNetworkNode {
  /** Unique node ID */
  id: string;

  /** Node type */
  type: NetworkNodeType;

  /** Display name */
  name: string;

  /** Covenant type (if node is a covenant) */
  covenant_type?: BenchmarkCovenantType;

  /** Facility ID (for covenant and facility nodes) */
  facility_id?: string;

  /** Facility name */
  facility_name?: string;

  /** Borrower name */
  borrower_name: string;

  /** Current status */
  status: 'active' | 'waived' | 'breached' | 'at_risk';

  /** Current headroom percentage */
  current_headroom?: number;

  /** Number of inbound correlations */
  in_degree: number;

  /** Number of outbound correlations */
  out_degree: number;

  /** Centrality score (0-1) - importance in network */
  centrality: number;

  /** Risk score (0-100) - combination of status, headroom, and network position */
  risk_score: number;
}

/**
 * Edge in the correlation network graph.
 */
export interface CorrelationNetworkEdge {
  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Edge weight (correlation strength, 0-1) */
  weight: number;

  /** Correlation data */
  correlation: BreachPropagationEdge;

  /** Visual styling hint */
  style: {
    color: string;
    thickness: number;
    dash: boolean;
  };
}

/**
 * Complete correlation network graph.
 */
export interface CorrelationNetwork {
  /** Network ID */
  id: string;

  /** Borrower or portfolio name */
  name: string;

  /** All nodes in the network */
  nodes: CorrelationNetworkNode[];

  /** All edges in the network */
  edges: CorrelationNetworkEdge[];

  /** Network-level statistics */
  stats: CorrelationNetworkStats;

  /** Generation timestamp */
  generated_at: string;
}

/**
 * Network-level statistics.
 */
export interface CorrelationNetworkStats {
  /** Total number of covenants */
  total_covenants: number;

  /** Total number of facilities */
  total_facilities: number;

  /** Number of significant correlations */
  significant_correlations: number;

  /** Average correlation strength */
  avg_correlation_strength: number;

  /** Network density (0-1) */
  network_density: number;

  /** Number of connected components */
  connected_components: number;

  /** Most central covenant (highest risk propagation) */
  most_central_covenant: {
    covenant_id: string;
    covenant_name: string;
    centrality: number;
  } | null;

  /** Highest risk cluster */
  highest_risk_cluster: {
    covenant_ids: string[];
    avg_risk_score: number;
    propagation_potential: number; // 0-100
  } | null;
}

/**
 * Correlation matrix for grid/heatmap visualization.
 */
export interface CorrelationMatrix {
  /** Row labels (covenant IDs) */
  row_labels: string[];

  /** Row metadata */
  row_metadata: Array<{
    covenant_id: string;
    covenant_name: string;
    covenant_type: BenchmarkCovenantType;
    facility_name: string;
    borrower_name: string;
  }>;

  /** Column labels (covenant IDs) */
  col_labels: string[];

  /** Column metadata (same structure as row_metadata) */
  col_metadata: Array<{
    covenant_id: string;
    covenant_name: string;
    covenant_type: BenchmarkCovenantType;
    facility_name: string;
    borrower_name: string;
  }>;

  /** Matrix values (correlation coefficients) */
  values: number[][];

  /** Matrix of p-values for significance */
  p_values: number[][];

  /** Matrix of lead-lag values (in quarters) */
  lead_lag_matrix: number[][];
}

/**
 * Contagion risk assessment for a specific covenant breach scenario.
 */
export interface ContagionRiskAssessment {
  /** Source covenant that breached */
  source_covenant_id: string;
  source_covenant_name: string;

  /** Affected covenants ranked by risk */
  affected_covenants: Array<{
    covenant_id: string;
    covenant_name: string;
    facility_name: string;
    propagation_probability: number;
    expected_impact_quarters: number;
    current_headroom: number;
    post_breach_headroom_estimate: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
  }>;

  /** Portfolio-wide impact estimate */
  portfolio_impact: {
    total_facilities_at_risk: number;
    total_covenants_at_risk: number;
    estimated_breach_cascade_probability: number; // 0-100
    expected_contagion_timeline_quarters: number;
  };

  /** Recommendations */
  recommendations: string[];

  /** Assessment timestamp */
  assessed_at: string;
}

/**
 * Helper function for correlation strength color coding.
 */
export function getCorrelationStrengthColor(strength: CorrelationStrength): string {
  switch (strength) {
    case 'very_strong':
      return 'rgb(220, 38, 38)'; // red-600
    case 'strong':
      return 'rgb(249, 115, 22)'; // orange-500
    case 'moderate':
      return 'rgb(234, 179, 8)'; // yellow-500
    case 'weak':
      return 'rgb(34, 197, 94)'; // green-500
    case 'very_weak':
      return 'rgb(156, 163, 175)'; // gray-400
  }
}

/**
 * Helper function to determine correlation strength from coefficient.
 */
export function categorizeCorrelationStrength(coefficient: number): CorrelationStrength {
  const abs = Math.abs(coefficient);
  if (abs >= 0.8) return 'very_strong';
  if (abs >= 0.6) return 'strong';
  if (abs >= 0.4) return 'moderate';
  if (abs >= 0.2) return 'weak';
  return 'very_weak';
}

/**
 * Helper function to determine lead-lag type from quarters value.
 */
export function categorizeLeadLagType(leadLagQuarters: number): LeadLagType {
  if (leadLagQuarters > 0) return 'leading';
  if (leadLagQuarters < 0) return 'lagging';
  return 'synchronous';
}
