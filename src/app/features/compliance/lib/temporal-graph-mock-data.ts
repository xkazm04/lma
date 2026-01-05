/**
 * Mock data for the Temporal Graph Model
 *
 * Demonstrates predictive patterns like:
 * - "This facility follows patterns that historically lead to default within 6 months"
 * - "41.7% of at-risk covenants breach within 67 days"
 */

import type {
  CausalPattern,
  CausalChainInstance,
  FacilityPrediction,
  ActivePatternDetection,
  RiskAssessment,
  RecommendedIntervention,
  TemporalGraphAnalytics,
  EventCascade,
  TemporalNode,
  TemporalEdge,
} from './temporal-graph-types';

import {
  transitionPatternsToСausalPatterns,
  generateFacilityPrediction,
} from './temporal-graph-engine';

import { mockTransitionPatterns, generateMockStateHistories } from './mock-state-data';
import { mockFacilities, mockCovenants } from './mock-data';

// =============================================================================
// Pre-defined Causal Patterns (Full Entity Graph)
// =============================================================================

/**
 * Extended causal patterns that go beyond covenant-to-covenant transitions
 * to include the full entity graph: facility → covenants → obligations → waivers → documents
 */
export const extendedCausalPatterns: CausalPattern[] = [
  {
    id: 'pattern-covenant-breach-cascade',
    name: 'Covenant Breach Cascade',
    description: 'Covenant breach triggers waiver request, which requires document submission, leading to approval workflow',
    canonical_chain: {
      id: 'chain-breach-cascade',
      description: 'covenant_breach → waiver_request → document_upload → waiver_review → waiver_approval',
      node_sequence: ['node-cov-breach', 'node-waiver-request', 'node-doc-upload', 'node-waiver-review', 'node-waiver-approved'],
      edges: [],
      total_duration_days: 21,
      occurrence_count: 8,
      probability: 75,
      entry_point: { entity_type: 'covenant', state: 'breach' },
      exit_point: { entity_type: 'waiver', state: 'approved' },
      outcome_type: 'neutral',
    },
    instances: [],
    statistics: {
      total_occurrences: 8,
      avg_duration_days: 21,
      std_dev_duration_days: 7,
      min_duration_days: 10,
      max_duration_days: 35,
      completion_probability: 75,
      avg_step_intervals: [2, 5, 7, 7],
      outcome_distribution: { positive: 0, negative: 0, neutral: 8 },
      last_observed: '2024-11-15T00:00:00Z',
      first_observed: '2023-06-01T00:00:00Z',
    },
    recommended_actions: [
      'Pre-stage waiver documentation templates',
      'Alert legal team when covenant enters at-risk status',
      'Maintain open communication with borrower',
    ],
    tags: ['covenant', 'waiver', 'document', 'workflow'],
  },
  {
    id: 'pattern-default-trajectory',
    name: 'Default Trajectory',
    description: 'Multi-covenant deterioration pattern that historically leads to facility default within 6 months',
    canonical_chain: {
      id: 'chain-default-trajectory',
      description: 'multiple_at_risk → first_breach → waiver_granted → second_breach → waiver_rejected → default',
      node_sequence: ['node-multi-risk', 'node-first-breach', 'node-waiver-1', 'node-second-breach', 'node-waiver-rejected', 'node-default'],
      edges: [],
      total_duration_days: 180,
      occurrence_count: 3,
      probability: 65,
      entry_point: { entity_type: 'facility', state: 'active' },
      exit_point: { entity_type: 'facility', state: 'default' },
      outcome_type: 'negative',
      severity: 'critical',
    },
    instances: [
      {
        id: 'instance-sigma-default',
        facility_id: '5',
        facility_name: 'Sigma Holdings - ABL',
        borrower_name: 'Sigma Holdings Inc',
        chain: {
          id: 'chain-sigma-default',
          description: 'Sigma Holdings followed the default trajectory pattern',
          node_sequence: [],
          edges: [],
          total_duration_days: 165,
          occurrence_count: 1,
          probability: 100,
          entry_point: { entity_type: 'facility', state: 'active' },
          exit_point: { entity_type: 'facility', state: 'default' },
          outcome_type: 'negative',
          severity: 'critical',
        },
        started_at: '2023-07-01T00:00:00Z',
        completed_at: '2023-12-13T00:00:00Z',
        is_active: false,
        outcome: {
          type: 'negative',
          description: 'Facility entered default after multiple covenant breaches',
          financial_impact: 50000000,
        },
      },
    ],
    statistics: {
      total_occurrences: 3,
      avg_duration_days: 180,
      std_dev_duration_days: 30,
      min_duration_days: 120,
      max_duration_days: 210,
      completion_probability: 65,
      avg_step_intervals: [30, 30, 45, 45, 30],
      outcome_distribution: { positive: 0, negative: 3, neutral: 0 },
      financial_impact: {
        avg_impact: 45000000,
        total_impact: 135000000,
        currency: 'USD',
      },
      last_observed: '2023-12-13T00:00:00Z',
      first_observed: '2022-03-15T00:00:00Z',
    },
    recommended_actions: [
      'Immediate escalation to senior credit committee',
      'Engage restructuring advisors',
      'Review collateral position and security',
      'Consider early workout discussions',
      'Prepare default notice documentation',
    ],
    tags: ['facility', 'default', 'critical', 'multi-covenant'],
  },
  {
    id: 'pattern-waiver-cycle',
    name: 'Waiver Cycle Pattern',
    description: 'Facilities that receive multiple waivers often fall into a cycle requiring restructuring',
    canonical_chain: {
      id: 'chain-waiver-cycle',
      description: 'breach → waiver → breach → waiver → restructuring_discussion',
      node_sequence: ['node-breach-1', 'node-waiver-1', 'node-breach-2', 'node-waiver-2', 'node-restructure'],
      edges: [],
      total_duration_days: 270,
      occurrence_count: 5,
      probability: 55,
      entry_point: { entity_type: 'covenant', state: 'breach' },
      exit_point: { entity_type: 'facility', state: 'active' },
      outcome_type: 'neutral',
    },
    instances: [],
    statistics: {
      total_occurrences: 5,
      avg_duration_days: 270,
      std_dev_duration_days: 45,
      min_duration_days: 180,
      max_duration_days: 360,
      completion_probability: 55,
      avg_step_intervals: [90, 90, 90],
      outcome_distribution: { positive: 2, negative: 1, neutral: 2 },
      last_observed: '2024-09-01T00:00:00Z',
      first_observed: '2022-01-15T00:00:00Z',
    },
    recommended_actions: [
      'After first waiver, assess need for covenant reset',
      'Consider amendment to provide sustainable headroom',
      'Review business plan viability',
    ],
    tags: ['waiver', 'cycle', 'restructuring'],
  },
  {
    id: 'pattern-recovery-path',
    name: 'Recovery Path',
    description: 'Positive pattern where early intervention leads to covenant recovery',
    canonical_chain: {
      id: 'chain-recovery-path',
      description: 'at_risk → proactive_outreach → operational_improvement → healthy',
      node_sequence: ['node-at-risk', 'node-outreach', 'node-improvement', 'node-healthy'],
      edges: [],
      total_duration_days: 90,
      occurrence_count: 12,
      probability: 70,
      entry_point: { entity_type: 'covenant', state: 'at_risk' },
      exit_point: { entity_type: 'covenant', state: 'healthy' },
      outcome_type: 'positive',
    },
    instances: [],
    statistics: {
      total_occurrences: 12,
      avg_duration_days: 90,
      std_dev_duration_days: 25,
      min_duration_days: 45,
      max_duration_days: 150,
      completion_probability: 70,
      avg_step_intervals: [15, 45, 30],
      outcome_distribution: { positive: 12, negative: 0, neutral: 0 },
      last_observed: '2024-11-01T00:00:00Z',
      first_observed: '2022-06-01T00:00:00Z',
    },
    recommended_actions: [
      'Early warning monitoring already in place',
      'Continue current intervention practices',
      'Document successful interventions for best practices',
    ],
    tags: ['recovery', 'positive', 'intervention', 'best-practice'],
  },
  {
    id: 'pattern-seasonal-stress',
    name: 'Seasonal Q4 Stress Pattern',
    description: 'Manufacturing covenants consistently show stress in Q4 due to working capital pressure',
    canonical_chain: {
      id: 'chain-seasonal-stress',
      description: 'healthy_q3 → at_risk_q4 → temporary_waiver → healthy_q1',
      node_sequence: ['node-healthy-q3', 'node-at-risk-q4', 'node-temp-waiver', 'node-healthy-q1'],
      edges: [],
      total_duration_days: 120,
      occurrence_count: 8,
      probability: 80,
      entry_point: { entity_type: 'covenant', state: 'healthy' },
      exit_point: { entity_type: 'covenant', state: 'healthy' },
      outcome_type: 'positive',
    },
    instances: [],
    statistics: {
      total_occurrences: 8,
      avg_duration_days: 120,
      std_dev_duration_days: 15,
      min_duration_days: 90,
      max_duration_days: 150,
      completion_probability: 80,
      avg_step_intervals: [45, 30, 45],
      outcome_distribution: { positive: 7, negative: 0, neutral: 1 },
      last_observed: '2024-01-15T00:00:00Z',
      first_observed: '2021-01-15T00:00:00Z',
    },
    recommended_actions: [
      'Anticipate Q4 stress for manufacturing sector',
      'Pre-arrange seasonal waiver framework',
      'Adjust monitoring thresholds for Q4',
    ],
    common_in_sectors: ['manufacturing'],
    tags: ['seasonal', 'manufacturing', 'q4', 'predictable'],
  },
];

/**
 * Get all causal patterns including converted transition patterns.
 */
export function getAllCausalPatterns(): CausalPattern[] {
  const transitionBasedPatterns = transitionPatternsToСausalPatterns(mockTransitionPatterns);
  return [...transitionBasedPatterns, ...extendedCausalPatterns];
}

// =============================================================================
// Pre-generated Facility Predictions
// =============================================================================

/**
 * Generate predictions for all mock facilities.
 */
export function generateAllFacilityPredictions(): FacilityPrediction[] {
  const stateHistories = generateMockStateHistories();
  const patterns = getAllCausalPatterns();

  return mockFacilities.map(facility => {
    const facilityCovenants = mockCovenants.filter(c => c.facility_id === facility.id);
    const facilityHistories = facilityCovenants
      .map(c => stateHistories[c.id])
      .filter(Boolean);

    return generateFacilityPrediction(
      facility,
      facilityCovenants,
      facilityHistories,
      patterns
    );
  });
}

/**
 * Get prediction for a specific facility.
 */
export function getFacilityPrediction(facilityId: string): FacilityPrediction | undefined {
  const predictions = generateAllFacilityPredictions();
  return predictions.find(p => p.facility_id === facilityId);
}

// =============================================================================
// Pre-defined Mock Predictions for Demo
// =============================================================================

/**
 * Detailed mock predictions showcasing the temporal graph capabilities.
 */
export const mockFacilityPredictions: FacilityPrediction[] = [
  {
    facility_id: '3',
    facility_name: 'Delta Manufacturing - Term Loan',
    borrower_name: 'Delta Manufacturing Co',
    active_patterns: [
      {
        pattern_id: 'pattern-waiver-cycle',
        pattern_name: 'Waiver Cycle Pattern',
        progress: {
          current_step: 2,
          total_steps: 5,
          percentage: 40,
        },
        match_confidence: 72,
        matched_nodes: [],
        predicted_remaining: [
          {
            entity_type: 'covenant',
            predicted_state: 'breach',
            probability: 55,
            estimated_days: 90,
            timing_confidence_interval: [60, 120],
            description: 'Expected second breach after waiver expiration',
          },
          {
            entity_type: 'facility',
            predicted_state: 'active',
            probability: 45,
            estimated_days: 180,
            timing_confidence_interval: [150, 210],
            description: 'Potential restructuring discussion required',
          },
        ],
        expected_completion_date: '2025-06-30T00:00:00Z',
        expected_outcome: 'neutral',
        days_until_critical: 90,
      },
      {
        pattern_id: 'pattern-seasonal-stress',
        pattern_name: 'Seasonal Q4 Stress Pattern',
        progress: {
          current_step: 2,
          total_steps: 4,
          percentage: 50,
        },
        match_confidence: 85,
        matched_nodes: [],
        predicted_remaining: [
          {
            entity_type: 'waiver',
            predicted_state: 'approved',
            probability: 80,
            estimated_days: 30,
            timing_confidence_interval: [20, 45],
            description: 'Seasonal waiver likely to be approved',
          },
        ],
        expected_completion_date: '2025-01-15T00:00:00Z',
        expected_outcome: 'positive',
      },
    ],
    predicted_states: [
      {
        entity_type: 'covenant',
        entity_id: '4',
        entity_name: 'Fixed Charge Coverage',
        current_state: 'waived',
        predicted_state: 'breach',
        probability: 50,
        estimated_days: 90,
        confidence: 65,
        based_on_patterns: ['pattern-waiver-cycle'],
        reasoning: 'Historical pattern shows 50% of waived covenants return to breach after waiver expiration',
      },
      {
        entity_type: 'facility',
        entity_id: '3',
        entity_name: 'Delta Manufacturing - Term Loan',
        current_state: 'waiver_period',
        predicted_state: 'active',
        probability: 70,
        estimated_days: 150,
        confidence: 55,
        based_on_patterns: ['pattern-seasonal-stress', 'pattern-recovery-path'],
        reasoning: 'Seasonal pattern suggests recovery in Q1, supported by industry trends',
      },
    ],
    risk_assessment: {
      overall_score: 58,
      risk_level: 'high',
      trajectory: 'deteriorating',
      default_probability: {
        days_30: 5,
        days_90: 15,
        days_180: 28,
        days_365: 42,
      },
      risk_factors: [
        {
          name: 'Active Covenant Breach',
          category: 'covenant',
          impact_score: 35,
          trend: 'stable',
          description: 'Fixed Charge Coverage covenant currently under waiver due to breach',
          related_entity_ids: ['4'],
        },
        {
          name: 'Waiver Cycle Pattern Detected',
          category: 'pattern',
          impact_score: 20,
          trend: 'increasing',
          description: 'Facility matches historical pattern of repeated waivers leading to restructuring',
          related_entity_ids: ['3', '4'],
        },
        {
          name: 'Industry Sector Stress',
          category: 'external',
          impact_score: 15,
          trend: 'stable',
          description: 'Manufacturing sector showing elevated stress in current quarter',
          related_entity_ids: [],
        },
      ],
      portfolio_comparison: {
        percentile: 25,
        comparison: 'worse',
      },
    },
    interventions: [
      {
        id: 'int-delta-1',
        priority: 'high',
        type: 'proactive_outreach',
        title: 'Schedule Borrower Review Meeting',
        description: 'Pattern analysis indicates elevated risk. Recommend immediate borrower discussion to review operational performance and path to compliance.',
        expected_impact: 'Early intervention has 70% success rate in preventing escalation',
        deadline: '2025-01-15T00:00:00Z',
        addresses_pattern: 'pattern-waiver-cycle',
        affected_entities: [
          { entity_type: 'facility', entity_id: '3', entity_name: 'Delta Manufacturing - Term Loan' },
          { entity_type: 'covenant', entity_id: '4', entity_name: 'Fixed Charge Coverage' },
        ],
      },
      {
        id: 'int-delta-2',
        priority: 'medium',
        type: 'covenant_amendment',
        title: 'Evaluate Covenant Reset',
        description: 'Given waiver cycle pattern, consider negotiating covenant reset to sustainable levels rather than repeated waivers.',
        expected_impact: 'Breaks waiver cycle pattern, provides sustainable path forward',
        deadline: '2025-03-31T00:00:00Z',
        addresses_pattern: 'pattern-waiver-cycle',
        affected_entities: [
          { entity_type: 'covenant', entity_id: '4', entity_name: 'Fixed Charge Coverage' },
        ],
      },
      {
        id: 'int-delta-3',
        priority: 'low',
        type: 'monitoring_increase',
        title: 'Increase Monitoring Frequency',
        description: 'Recommend monthly financial reviews instead of quarterly during waiver period.',
        expected_impact: 'Earlier detection of further deterioration',
        affected_entities: [
          { entity_type: 'facility', entity_id: '3', entity_name: 'Delta Manufacturing - Term Loan' },
        ],
      },
    ],
    overall_confidence: 68,
    analyzed_at: new Date().toISOString(),
    prediction_horizon_days: 180,
  },
  {
    facility_id: '5',
    facility_name: 'Sigma Holdings - ABL',
    borrower_name: 'Sigma Holdings Inc',
    active_patterns: [
      {
        pattern_id: 'pattern-default-trajectory',
        pattern_name: 'Default Trajectory',
        progress: {
          current_step: 6,
          total_steps: 6,
          percentage: 100,
        },
        match_confidence: 100,
        matched_nodes: [],
        predicted_remaining: [],
        expected_completion_date: '2023-12-13T00:00:00Z',
        expected_outcome: 'negative',
        expected_severity: 'critical',
      },
    ],
    predicted_states: [],
    risk_assessment: {
      overall_score: 95,
      risk_level: 'critical',
      trajectory: 'stable', // Already in default, not deteriorating further
      default_probability: {
        days_30: 100,
        days_90: 100,
        days_180: 100,
        days_365: 100,
      },
      risk_factors: [
        {
          name: 'Facility in Default',
          category: 'covenant',
          impact_score: 50,
          trend: 'stable',
          description: 'Facility has entered default status',
          related_entity_ids: ['5'],
        },
        {
          name: 'Pattern Fully Matched',
          category: 'pattern',
          impact_score: 30,
          trend: 'stable',
          description: 'Default trajectory pattern completed - facility followed historical path to default',
          related_entity_ids: ['5'],
        },
      ],
      portfolio_comparison: {
        percentile: 5,
        comparison: 'worse',
      },
    },
    interventions: [
      {
        id: 'int-sigma-1',
        priority: 'critical',
        type: 'escalation',
        title: 'Workout Process Initiated',
        description: 'Facility is in default. Workout process and recovery actions are primary focus.',
        expected_impact: 'Maximize recovery value',
        affected_entities: [
          { entity_type: 'facility', entity_id: '5', entity_name: 'Sigma Holdings - ABL' },
        ],
      },
    ],
    overall_confidence: 95,
    analyzed_at: new Date().toISOString(),
    prediction_horizon_days: 180,
  },
];

// =============================================================================
// Mock Event Cascades
// =============================================================================

export const mockEventCascades: EventCascade[] = [
  {
    id: 'cascade-delta-breach',
    trigger_event: {
      id: 'node-delta-trigger',
      entity_type: 'covenant',
      entity_id: '4',
      entity_name: 'Fixed Charge Coverage',
      state: 'breach',
      timestamp: '2024-06-30T00:00:00Z',
      duration_days: 180,
      parent_ids: { facility_id: '3', covenant_id: '4' },
    },
    cascade_events: [
      {
        id: 'node-delta-waiver-request',
        entity_type: 'waiver',
        entity_id: 'waiver-delta-1',
        entity_name: 'FCC Waiver Request',
        state: 'pending',
        timestamp: '2024-07-02T00:00:00Z',
        duration_days: 12,
        parent_ids: { facility_id: '3', covenant_id: '4' },
      },
      {
        id: 'node-delta-doc-upload',
        entity_type: 'document',
        entity_id: 'doc-delta-1',
        entity_name: 'Waiver Support Package',
        state: 'pending_review',
        timestamp: '2024-07-05T00:00:00Z',
        duration_days: 9,
        parent_ids: { facility_id: '3', covenant_id: '4', waiver_id: 'waiver-delta-1' },
      },
      {
        id: 'node-delta-waiver-approved',
        entity_type: 'waiver',
        entity_id: 'waiver-delta-1',
        entity_name: 'FCC Waiver Request',
        state: 'approved',
        timestamp: '2024-07-14T00:00:00Z',
        duration_days: 0,
        parent_ids: { facility_id: '3', covenant_id: '4' },
      },
      {
        id: 'node-delta-facility-waiver',
        entity_type: 'facility',
        entity_id: '3',
        entity_name: 'Delta Manufacturing - Term Loan',
        state: 'waiver_period',
        timestamp: '2024-07-14T00:00:00Z',
        duration_days: 0,
        parent_ids: { facility_id: '3' },
      },
    ],
    cascade_edges: [
      {
        id: 'edge-breach-waiver',
        from_node_id: 'node-delta-trigger',
        to_node_id: 'node-delta-waiver-request',
        relation_type: 'triggered_by',
        time_delta_days: 2,
        confidence: 100,
        weight: 1,
        description: 'Breach triggered waiver request',
        observed_at: '2024-07-02T00:00:00Z',
      },
      {
        id: 'edge-waiver-doc',
        from_node_id: 'node-delta-waiver-request',
        to_node_id: 'node-delta-doc-upload',
        relation_type: 'requires',
        time_delta_days: 3,
        confidence: 100,
        weight: 1,
        description: 'Waiver request requires supporting documentation',
        observed_at: '2024-07-05T00:00:00Z',
      },
      {
        id: 'edge-doc-approval',
        from_node_id: 'node-delta-doc-upload',
        to_node_id: 'node-delta-waiver-approved',
        relation_type: 'enables',
        time_delta_days: 9,
        confidence: 100,
        weight: 1,
        description: 'Documentation enables waiver approval',
        observed_at: '2024-07-14T00:00:00Z',
      },
      {
        id: 'edge-approval-facility',
        from_node_id: 'node-delta-waiver-approved',
        to_node_id: 'node-delta-facility-waiver',
        relation_type: 'caused',
        time_delta_days: 0,
        confidence: 100,
        weight: 1,
        description: 'Waiver approval transitions facility status',
        observed_at: '2024-07-14T00:00:00Z',
      },
    ],
    depth: 4,
    breadth: 1,
    total_impact: {
      entities_affected: 3,
      states_changed: 4,
      duration_days: 14,
    },
    is_active: false,
    started_at: '2024-06-30T00:00:00Z',
    completed_at: '2024-07-14T00:00:00Z',
  },
];

// =============================================================================
// Mock Graph Analytics
// =============================================================================

export const mockGraphAnalytics: TemporalGraphAnalytics = {
  total_nodes: 127,
  total_edges: 89,
  nodes_by_type: {
    facility: 5,
    covenant: 15,
    obligation: 45,
    waiver: 12,
    document: 35,
    event: 15,
  },
  edges_by_relation: {
    triggered_by: 23,
    preceded_by: 18,
    caused: 12,
    correlated_with: 8,
    mitigated_by: 7,
    escalated_to: 6,
    resolved_by: 5,
    requires: 5,
    enables: 5,
  },
  top_patterns: getAllCausalPatterns().slice(0, 5),
  active_instances: [
    {
      id: 'instance-delta-active',
      facility_id: '3',
      facility_name: 'Delta Manufacturing - Term Loan',
      borrower_name: 'Delta Manufacturing Co',
      chain: {
        id: 'chain-delta-active',
        description: 'Waiver cycle in progress',
        node_sequence: [],
        edges: [],
        total_duration_days: 120,
        occurrence_count: 1,
        probability: 55,
        entry_point: { entity_type: 'covenant', state: 'breach' },
        exit_point: { entity_type: 'facility', state: 'active' },
        outcome_type: 'neutral',
      },
      started_at: '2024-06-30T00:00:00Z',
      is_active: true,
      current_position: 2,
    },
  ],
  highest_risk_facilities: mockFacilityPredictions,
  health_metrics: {
    average_chain_length: 3.2,
    average_prediction_confidence: 72,
    pattern_coverage_percentage: 85,
    last_updated: new Date().toISOString(),
  },
};

// =============================================================================
// Portfolio-Level Insights from Temporal Graph
// =============================================================================

export interface TemporalPortfolioInsight {
  id: string;
  category: 'prediction' | 'pattern' | 'cascade' | 'trend';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affected_facilities: string[];
  pattern_id?: string;
  probability?: number;
  time_horizon_days?: number;
  recommended_actions: string[];
}

export const mockTemporalInsights: TemporalPortfolioInsight[] = [
  {
    id: 'insight-default-pattern',
    category: 'pattern',
    severity: 'critical',
    title: 'Default Trajectory Pattern Detected',
    description: 'One facility (Sigma Holdings) has completed the default trajectory pattern. This pattern shows 65% probability of default when multi-covenant deterioration occurs. Early warning: Delta Manufacturing shows early signs of this pattern.',
    affected_facilities: ['5', '3'],
    pattern_id: 'pattern-default-trajectory',
    probability: 65,
    time_horizon_days: 180,
    recommended_actions: [
      'Review Delta Manufacturing for pattern similarity',
      'Implement enhanced monitoring for facilities with multiple at-risk covenants',
      'Document lessons learned from Sigma Holdings default',
    ],
  },
  {
    id: 'insight-seasonal',
    category: 'trend',
    severity: 'warning',
    title: 'Q4 Seasonal Stress Approaching',
    description: 'Historical analysis shows 80% of manufacturing covenants experience headroom compression in Q4. Three facilities in portfolio are in manufacturing sector.',
    affected_facilities: ['3'],
    pattern_id: 'pattern-seasonal-stress',
    probability: 80,
    time_horizon_days: 60,
    recommended_actions: [
      'Pre-position for potential Q4 waiver requests',
      'Adjust covenant monitoring thresholds for manufacturing facilities',
      'Schedule proactive Q3 reviews with manufacturing borrowers',
    ],
  },
  {
    id: 'insight-cascade-efficiency',
    category: 'cascade',
    severity: 'info',
    title: 'Waiver Processing Time Analysis',
    description: 'Average cascade from breach to waiver approval is 14 days. This is improving from 21 days average in prior year. Document preparation is the longest step (9 days average).',
    affected_facilities: [],
    time_horizon_days: 14,
    recommended_actions: [
      'Continue current waiver process improvements',
      'Consider document template automation to reduce prep time',
      'Benchmark against industry standards',
    ],
  },
  {
    id: 'insight-recovery-success',
    category: 'prediction',
    severity: 'info',
    title: 'High Recovery Rate from At-Risk Status',
    description: 'Temporal analysis confirms 70% recovery rate when proactive outreach is initiated within 15 days of entering at-risk status. Portfolio is currently outperforming this benchmark.',
    affected_facilities: ['1', '2', '4'],
    pattern_id: 'pattern-recovery-path',
    probability: 70,
    time_horizon_days: 90,
    recommended_actions: [
      'Maintain current early warning protocols',
      'Document intervention success stories',
      'Consider sharing best practices across portfolio',
    ],
  },
];
