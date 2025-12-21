/**
 * Mock correlation data for cross-facility covenant network analysis
 */

import type {
  CorrelationNetwork,
  CorrelationMatrix,
  ContagionRiskAssessment,
  BreachPropagationEdge,
  CorrelationNetworkNode,
  CorrelationNetworkEdge,
} from './correlation-types';
import { categorizeCorrelationStrength, categorizeLeadLagType, getCorrelationStrengthColor } from './correlation-types';

/**
 * Mock breach propagation edges showing how covenants correlate.
 */
export const mockBreachPropagationEdges: BreachPropagationEdge[] = [
  // ABC Holdings internal correlations
  {
    from_covenant_id: '1', // ABC Leverage Ratio
    to_covenant_id: '2', // ABC Interest Coverage
    correlation_coefficient: -0.72,
    p_value: 0.003,
    strength: 'strong',
    direction: 'negative',
    lead_lag_quarters: 1,
    lead_lag_type: 'leading',
    sample_size: 16,
    data_start_date: '2023-01-01',
    data_end_date: '2024-09-30',
    calculated_at: '2024-12-08T08:00:00Z',
    propagation_probability: 68,
    avg_propagation_time_quarters: 1.2,
    co_breach_rate: 45,
    co_breach_count: 2,
  },
  // Cross-facility correlation: ABC Leverage → XYZ Leverage
  {
    from_covenant_id: '1', // ABC Leverage
    to_covenant_id: '3', // XYZ Leverage
    correlation_coefficient: 0.58,
    p_value: 0.012,
    strength: 'moderate',
    direction: 'positive',
    lead_lag_quarters: 0,
    lead_lag_type: 'synchronous',
    sample_size: 16,
    data_start_date: '2023-01-01',
    data_end_date: '2024-09-30',
    calculated_at: '2024-12-08T08:00:00Z',
    propagation_probability: 52,
    avg_propagation_time_quarters: 0.5,
    co_breach_rate: 30,
    co_breach_count: 1,
  },
  // Delta Manufacturing FCCR → ABC Leverage (systemic risk indicator)
  {
    from_covenant_id: '4', // Delta FCCR
    to_covenant_id: '1', // ABC Leverage
    correlation_coefficient: 0.65,
    p_value: 0.008,
    strength: 'strong',
    direction: 'positive',
    lead_lag_quarters: 2,
    lead_lag_type: 'leading',
    sample_size: 14,
    data_start_date: '2023-01-01',
    data_end_date: '2024-09-30',
    calculated_at: '2024-12-08T08:00:00Z',
    propagation_probability: 72,
    avg_propagation_time_quarters: 2.1,
    co_breach_rate: 55,
    co_breach_count: 3,
  },
  // XYZ Leverage → Neptune Liquidity (cross-sector contagion)
  {
    from_covenant_id: '3', // XYZ Leverage
    to_covenant_id: '5', // Neptune Liquidity
    correlation_coefficient: -0.48,
    p_value: 0.045,
    strength: 'moderate',
    direction: 'negative',
    lead_lag_quarters: 1,
    lead_lag_type: 'leading',
    sample_size: 12,
    data_start_date: '2023-01-01',
    data_end_date: '2024-09-30',
    calculated_at: '2024-12-08T08:00:00Z',
    propagation_probability: 42,
    avg_propagation_time_quarters: 1.5,
    co_breach_rate: 25,
    co_breach_count: 1,
  },
  // Sigma Interest Coverage → Delta FCCR (stressed sector correlation)
  {
    from_covenant_id: '6', // Sigma Interest Coverage
    to_covenant_id: '4', // Delta FCCR
    correlation_coefficient: 0.81,
    p_value: 0.001,
    strength: 'very_strong',
    direction: 'positive',
    lead_lag_quarters: 0,
    lead_lag_type: 'synchronous',
    sample_size: 16,
    data_start_date: '2023-01-01',
    data_end_date: '2024-09-30',
    calculated_at: '2024-12-08T08:00:00Z',
    propagation_probability: 85,
    avg_propagation_time_quarters: 0.3,
    co_breach_rate: 75,
    co_breach_count: 4,
  },
  // ABC Interest Coverage → XYZ Leverage
  {
    from_covenant_id: '2', // ABC Interest Coverage
    to_covenant_id: '3', // XYZ Leverage
    correlation_coefficient: -0.55,
    p_value: 0.018,
    strength: 'moderate',
    direction: 'negative',
    lead_lag_quarters: 1,
    lead_lag_type: 'leading',
    sample_size: 16,
    data_start_date: '2023-01-01',
    data_end_date: '2024-09-30',
    calculated_at: '2024-12-08T08:00:00Z',
    propagation_probability: 48,
    avg_propagation_time_quarters: 1.0,
    co_breach_rate: 35,
    co_breach_count: 2,
  },
];

/**
 * Mock network nodes.
 */
export const mockNetworkNodes: CorrelationNetworkNode[] = [
  {
    id: '1',
    type: 'covenant',
    name: 'Leverage Ratio',
    covenant_type: 'leverage_ratio',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    status: 'active',
    current_headroom: 20.0,
    in_degree: 1,
    out_degree: 2,
    centrality: 0.75,
    risk_score: 25,
  },
  {
    id: '2',
    type: 'covenant',
    name: 'Interest Coverage Ratio',
    covenant_type: 'interest_coverage',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    status: 'active',
    current_headroom: 52.0,
    in_degree: 1,
    out_degree: 1,
    centrality: 0.45,
    risk_score: 15,
  },
  {
    id: '3',
    type: 'covenant',
    name: 'Leverage Ratio',
    covenant_type: 'leverage_ratio',
    facility_id: '2',
    facility_name: 'XYZ Corp Revolver',
    borrower_name: 'XYZ Corporation',
    status: 'at_risk',
    current_headroom: 11.4,
    in_degree: 2,
    out_degree: 1,
    centrality: 0.68,
    risk_score: 65,
  },
  {
    id: '4',
    type: 'covenant',
    name: 'Fixed Charge Coverage',
    covenant_type: 'fixed_charge_coverage',
    facility_id: '3',
    facility_name: 'Delta Manufacturing TL',
    borrower_name: 'Delta Manufacturing Co',
    status: 'waived',
    current_headroom: -12.5,
    in_degree: 1,
    out_degree: 1,
    centrality: 0.82,
    risk_score: 88,
  },
  {
    id: '5',
    type: 'covenant',
    name: 'Minimum Liquidity',
    covenant_type: 'minimum_liquidity',
    facility_id: '4',
    facility_name: 'Neptune Holdings TL',
    borrower_name: 'Neptune Holdings Inc',
    status: 'active',
    current_headroom: 68.0,
    in_degree: 1,
    out_degree: 0,
    centrality: 0.22,
    risk_score: 10,
  },
  {
    id: '6',
    type: 'covenant',
    name: 'Interest Coverage',
    covenant_type: 'interest_coverage',
    facility_id: '5',
    facility_name: 'Sigma Holdings ABL',
    borrower_name: 'Sigma Holdings Inc',
    status: 'breached',
    current_headroom: -30.0,
    in_degree: 0,
    out_degree: 1,
    centrality: 0.55,
    risk_score: 95,
  },
];

/**
 * Mock network edges with styling.
 */
export const mockNetworkEdges: CorrelationNetworkEdge[] = mockBreachPropagationEdges.map((edge) => {
  const absCorr = Math.abs(edge.correlation_coefficient);
  return {
    source: edge.from_covenant_id,
    target: edge.to_covenant_id,
    weight: absCorr,
    correlation: edge,
    style: {
      color: getCorrelationStrengthColor(edge.strength),
      thickness: 1 + absCorr * 4, // 1-5px
      dash: edge.p_value > 0.05, // Dash if not statistically significant
    },
  };
});

/**
 * Mock correlation network.
 */
export const mockCorrelationNetwork: CorrelationNetwork = {
  id: 'network-1',
  name: 'Portfolio Covenant Network',
  nodes: mockNetworkNodes,
  edges: mockNetworkEdges,
  stats: {
    total_covenants: 6,
    total_facilities: 5,
    significant_correlations: 6,
    avg_correlation_strength: 0.63,
    network_density: 0.33,
    connected_components: 1,
    most_central_covenant: {
      covenant_id: '4',
      covenant_name: 'Delta Manufacturing - Fixed Charge Coverage',
      centrality: 0.82,
    },
    highest_risk_cluster: {
      covenant_ids: ['4', '6', '3'],
      avg_risk_score: 82.7,
      propagation_potential: 78,
    },
  },
  generated_at: '2024-12-08T08:00:00Z',
};

/**
 * Mock correlation matrix.
 */
export const mockCorrelationMatrix: CorrelationMatrix = {
  row_labels: ['1', '2', '3', '4', '5', '6'],
  row_metadata: [
    {
      covenant_id: '1',
      covenant_name: 'Leverage Ratio',
      covenant_type: 'leverage_ratio',
      facility_name: 'ABC Holdings - Term Loan A',
      borrower_name: 'ABC Holdings LLC',
    },
    {
      covenant_id: '2',
      covenant_name: 'Interest Coverage Ratio',
      covenant_type: 'interest_coverage',
      facility_name: 'ABC Holdings - Term Loan A',
      borrower_name: 'ABC Holdings LLC',
    },
    {
      covenant_id: '3',
      covenant_name: 'Leverage Ratio',
      covenant_type: 'leverage_ratio',
      facility_name: 'XYZ Corp Revolver',
      borrower_name: 'XYZ Corporation',
    },
    {
      covenant_id: '4',
      covenant_name: 'Fixed Charge Coverage',
      covenant_type: 'fixed_charge_coverage',
      facility_name: 'Delta Manufacturing TL',
      borrower_name: 'Delta Manufacturing Co',
    },
    {
      covenant_id: '5',
      covenant_name: 'Minimum Liquidity',
      covenant_type: 'minimum_liquidity',
      facility_name: 'Neptune Holdings TL',
      borrower_name: 'Neptune Holdings Inc',
    },
    {
      covenant_id: '6',
      covenant_name: 'Interest Coverage',
      covenant_type: 'interest_coverage',
      facility_name: 'Sigma Holdings ABL',
      borrower_name: 'Sigma Holdings Inc',
    },
  ],
  col_labels: ['1', '2', '3', '4', '5', '6'],
  col_metadata: [
    {
      covenant_id: '1',
      covenant_name: 'Leverage Ratio',
      covenant_type: 'leverage_ratio',
      facility_name: 'ABC Holdings - Term Loan A',
      borrower_name: 'ABC Holdings LLC',
    },
    {
      covenant_id: '2',
      covenant_name: 'Interest Coverage Ratio',
      covenant_type: 'interest_coverage',
      facility_name: 'ABC Holdings - Term Loan A',
      borrower_name: 'ABC Holdings LLC',
    },
    {
      covenant_id: '3',
      covenant_name: 'Leverage Ratio',
      covenant_type: 'leverage_ratio',
      facility_name: 'XYZ Corp Revolver',
      borrower_name: 'XYZ Corporation',
    },
    {
      covenant_id: '4',
      covenant_name: 'Fixed Charge Coverage',
      covenant_type: 'fixed_charge_coverage',
      facility_name: 'Delta Manufacturing TL',
      borrower_name: 'Delta Manufacturing Co',
    },
    {
      covenant_id: '5',
      covenant_name: 'Minimum Liquidity',
      covenant_type: 'minimum_liquidity',
      facility_name: 'Neptune Holdings TL',
      borrower_name: 'Neptune Holdings Inc',
    },
    {
      covenant_id: '6',
      covenant_name: 'Interest Coverage',
      covenant_type: 'interest_coverage',
      facility_name: 'Sigma Holdings ABL',
      borrower_name: 'Sigma Holdings Inc',
    },
  ],
  values: [
    [1.0, -0.72, 0.58, 0.0, 0.0, 0.0], // Covenant 1
    [0.0, 1.0, -0.55, 0.0, 0.0, 0.0], // Covenant 2
    [0.0, 0.0, 1.0, 0.0, -0.48, 0.0], // Covenant 3
    [0.65, 0.0, 0.0, 1.0, 0.0, 0.0], // Covenant 4
    [0.0, 0.0, 0.0, 0.0, 1.0, 0.0], // Covenant 5
    [0.0, 0.0, 0.0, 0.81, 0.0, 1.0], // Covenant 6
  ],
  p_values: [
    [0.0, 0.003, 0.012, 1.0, 1.0, 1.0],
    [1.0, 0.0, 0.018, 1.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0, 0.045, 1.0],
    [0.008, 1.0, 1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 0.0, 1.0],
    [1.0, 1.0, 1.0, 0.001, 1.0, 0.0],
  ],
  lead_lag_matrix: [
    [0, 1, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
};

/**
 * Mock contagion risk assessment for Delta Manufacturing breach.
 */
export const mockContagionAssessment: ContagionRiskAssessment = {
  source_covenant_id: '4',
  source_covenant_name: 'Delta Manufacturing - Fixed Charge Coverage',
  affected_covenants: [
    {
      covenant_id: '1',
      covenant_name: 'ABC Holdings - Leverage Ratio',
      facility_name: 'ABC Holdings - Term Loan A',
      propagation_probability: 72,
      expected_impact_quarters: 2,
      current_headroom: 20.0,
      post_breach_headroom_estimate: 8.5,
      risk_level: 'high',
    },
    {
      covenant_id: '6',
      covenant_name: 'Sigma Holdings - Interest Coverage',
      facility_name: 'Sigma Holdings ABL',
      propagation_probability: 85,
      expected_impact_quarters: 0,
      current_headroom: -30.0,
      post_breach_headroom_estimate: -42.0,
      risk_level: 'critical',
    },
  ],
  portfolio_impact: {
    total_facilities_at_risk: 3,
    total_covenants_at_risk: 4,
    estimated_breach_cascade_probability: 68,
    expected_contagion_timeline_quarters: 2.5,
  },
  recommendations: [
    'Immediate engagement with ABC Holdings to discuss proactive covenant amendment',
    'Escalate Sigma Holdings breach to workout team - contagion risk is critical',
    'Request enhanced financial reporting from all manufacturing sector borrowers',
    'Consider reducing exposure to Delta Manufacturing through participation sale',
    'Monitor leverage ratios across portfolio for early warning signs of systemic stress',
  ],
  assessed_at: '2024-12-08T08:00:00Z',
};
