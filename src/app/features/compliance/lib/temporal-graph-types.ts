/**
 * Temporal Graph Model for Compliance Causality
 *
 * This module defines a temporal graph where:
 * - Nodes are entity states (facility, covenant, obligation, waiver, document)
 * - Edges are time-weighted transitions with causal relationships
 *
 * The graph enables predictive workflows by identifying patterns like:
 * "This facility follows patterns that historically lead to default within 6 months"
 */

import type { CovenantLifecycleState, FacilityStatus, WaiverStatus, ItemStatus } from './types';

// =============================================================================
// Entity Types for Graph Nodes
// =============================================================================

/**
 * All entity types that can be nodes in the temporal graph.
 */
export type TemporalEntityType =
  | 'facility'
  | 'covenant'
  | 'obligation'
  | 'waiver'
  | 'document'
  | 'event';

/**
 * All possible states an entity can be in.
 * Union of all status types across entity types.
 */
export type EntityState =
  | FacilityStatus
  | CovenantLifecycleState
  | WaiverStatus
  | ItemStatus
  | 'draft' | 'pending_review' | 'approved' | 'rejected' | 'executed' | 'expired'
  | 'triggered' | 'acknowledged' | 'resolved';

/**
 * A node in the temporal graph representing an entity at a point in time.
 */
export interface TemporalNode {
  /** Unique node identifier */
  id: string;

  /** The entity type */
  entity_type: TemporalEntityType;

  /** The specific entity ID */
  entity_id: string;

  /** Human-readable entity name */
  entity_name: string;

  /** Current state of the entity */
  state: EntityState;

  /** Timestamp when this state was entered */
  timestamp: string;

  /** Duration in this state (days) */
  duration_days: number;

  /** Parent entity relationships */
  parent_ids: {
    facility_id?: string;
    covenant_id?: string;
    obligation_id?: string;
    waiver_id?: string;
  };

  /** Additional metadata about the node */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Edge Types for Graph Relationships
// =============================================================================

/**
 * Types of causal relationships between nodes.
 */
export type CausalRelationType =
  | 'triggered_by'        // Event A triggered Event B
  | 'preceded_by'         // Event A came before Event B
  | 'caused'              // Event A directly caused Event B
  | 'correlated_with'     // Event A correlates with Event B
  | 'mitigated_by'        // Event A was mitigated by Event B
  | 'escalated_to'        // Event A escalated to Event B
  | 'resolved_by'         // Event A was resolved by Event B
  | 'requires'            // Event A requires Event B
  | 'enables';            // Event A enables Event B

/**
 * An edge in the temporal graph representing a causal relationship.
 */
export interface TemporalEdge {
  /** Unique edge identifier */
  id: string;

  /** Source node ID */
  from_node_id: string;

  /** Target node ID */
  to_node_id: string;

  /** Type of causal relationship */
  relation_type: CausalRelationType;

  /** Time delay between events (days) */
  time_delta_days: number;

  /** Confidence in this causal relationship (0-100) */
  confidence: number;

  /** Weight of this edge based on historical frequency */
  weight: number;

  /** Human-readable description of the relationship */
  description: string;

  /** Timestamp when this edge was created/observed */
  observed_at: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Causal Chain Types
// =============================================================================

/**
 * A causal chain is a sequence of events linked by causality.
 * Example: covenant_at_risk → covenant_breach → waiver_request → waiver_approved
 */
export interface CausalChain {
  /** Unique chain identifier */
  id: string;

  /** Human-readable chain description */
  description: string;

  /** Ordered sequence of node IDs in this chain */
  node_sequence: string[];

  /** Edges connecting the nodes */
  edges: TemporalEdge[];

  /** Total duration of the chain (days) */
  total_duration_days: number;

  /** Number of times this exact chain has been observed */
  occurrence_count: number;

  /** Probability of this chain occurring (0-100) */
  probability: number;

  /** Starting entity type and state */
  entry_point: {
    entity_type: TemporalEntityType;
    state: EntityState;
  };

  /** Ending entity type and state */
  exit_point: {
    entity_type: TemporalEntityType;
    state: EntityState;
  };

  /** Whether this chain typically leads to negative outcomes */
  outcome_type: 'positive' | 'negative' | 'neutral';

  /** Severity if outcome is negative */
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * A pattern represents a recurring causal chain across the portfolio.
 */
export interface CausalPattern {
  /** Unique pattern identifier */
  id: string;

  /** Pattern name for display */
  name: string;

  /** Detailed description of the pattern */
  description: string;

  /** The canonical chain this pattern represents */
  canonical_chain: CausalChain;

  /** All observed instances of this pattern */
  instances: CausalChainInstance[];

  /** Statistical properties of this pattern */
  statistics: PatternStatistics;

  /** Industry sectors where this pattern is most common */
  common_in_sectors?: string[];

  /** Recommended actions when this pattern is detected */
  recommended_actions: string[];

  /** Tags for categorization */
  tags: string[];
}

/**
 * A specific instance of a causal pattern observed in the portfolio.
 */
export interface CausalChainInstance {
  /** Instance identifier */
  id: string;

  /** Facility where this occurred */
  facility_id: string;
  facility_name: string;
  borrower_name: string;

  /** The actual chain of events */
  chain: CausalChain;

  /** Start timestamp */
  started_at: string;

  /** End timestamp (if completed) */
  completed_at?: string;

  /** Whether this instance is still in progress */
  is_active: boolean;

  /** Current position in the chain (if active) */
  current_position?: number;

  /** Outcome if completed */
  outcome?: {
    type: 'positive' | 'negative' | 'neutral';
    description: string;
    financial_impact?: number;
  };
}

/**
 * Statistical properties of a causal pattern.
 */
export interface PatternStatistics {
  /** Total observations */
  total_occurrences: number;

  /** Average duration of the pattern (days) */
  avg_duration_days: number;

  /** Standard deviation of duration */
  std_dev_duration_days: number;

  /** Minimum observed duration */
  min_duration_days: number;

  /** Maximum observed duration */
  max_duration_days: number;

  /** Probability of completion once started (0-100) */
  completion_probability: number;

  /** Average time between pattern steps */
  avg_step_intervals: number[];

  /** Distribution of outcomes */
  outcome_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };

  /** Financial impact statistics (if applicable) */
  financial_impact?: {
    avg_impact: number;
    total_impact: number;
    currency: string;
  };

  /** Last observed timestamp */
  last_observed: string;

  /** First observed timestamp */
  first_observed: string;
}

// =============================================================================
// Predictive Types
// =============================================================================

/**
 * A prediction for a facility based on temporal graph analysis.
 */
export interface FacilityPrediction {
  /** Facility being analyzed */
  facility_id: string;
  facility_name: string;
  borrower_name: string;

  /** Patterns currently detected as starting */
  active_patterns: ActivePatternDetection[];

  /** Predicted future states */
  predicted_states: PredictedState[];

  /** Overall risk assessment */
  risk_assessment: RiskAssessment;

  /** Recommended interventions */
  interventions: RecommendedIntervention[];

  /** Confidence in predictions (0-100) */
  overall_confidence: number;

  /** Analysis timestamp */
  analyzed_at: string;

  /** Time horizon of predictions */
  prediction_horizon_days: number;
}

/**
 * Detection of an active pattern starting to unfold.
 */
export interface ActivePatternDetection {
  /** Pattern being matched */
  pattern_id: string;
  pattern_name: string;

  /** How far along the pattern we are */
  progress: {
    current_step: number;
    total_steps: number;
    percentage: number;
  };

  /** Match confidence (0-100) */
  match_confidence: number;

  /** Nodes matched so far */
  matched_nodes: TemporalNode[];

  /** Predicted remaining nodes */
  predicted_remaining: PredictedNode[];

  /** Expected completion date */
  expected_completion_date?: string;

  /** Expected outcome based on pattern */
  expected_outcome: 'positive' | 'negative' | 'neutral';

  /** Severity if negative outcome expected */
  expected_severity?: 'low' | 'medium' | 'high' | 'critical';

  /** Time remaining before critical point */
  days_until_critical?: number;
}

/**
 * A predicted future node in the graph.
 */
export interface PredictedNode {
  /** Entity type that will be affected */
  entity_type: TemporalEntityType;

  /** Predicted state */
  predicted_state: EntityState;

  /** Probability of this prediction (0-100) */
  probability: number;

  /** Estimated days until this occurs */
  estimated_days: number;

  /** Confidence interval for timing (days) */
  timing_confidence_interval: [number, number];

  /** Description of what this means */
  description: string;
}

/**
 * A predicted future state for an entity.
 */
export interface PredictedState {
  /** Entity being predicted */
  entity_type: TemporalEntityType;
  entity_id: string;
  entity_name: string;

  /** Current state */
  current_state: EntityState;

  /** Predicted next state */
  predicted_state: EntityState;

  /** Probability of transition (0-100) */
  probability: number;

  /** Estimated days until transition */
  estimated_days: number;

  /** Confidence in prediction (0-100) */
  confidence: number;

  /** Pattern(s) this prediction is based on */
  based_on_patterns: string[];

  /** Human-readable reasoning */
  reasoning: string;
}

/**
 * Overall risk assessment for a facility.
 */
export interface RiskAssessment {
  /** Overall risk score (0-100) */
  overall_score: number;

  /** Risk level */
  risk_level: 'low' | 'medium' | 'high' | 'critical';

  /** Risk trajectory */
  trajectory: 'improving' | 'stable' | 'deteriorating';

  /** Probability of default within timeframes */
  default_probability: {
    days_30: number;
    days_90: number;
    days_180: number;
    days_365: number;
  };

  /** Key risk factors */
  risk_factors: RiskFactor[];

  /** Comparison to portfolio */
  portfolio_comparison: {
    percentile: number;
    comparison: 'better' | 'similar' | 'worse';
  };
}

/**
 * A specific risk factor contributing to the assessment.
 */
export interface RiskFactor {
  /** Factor name */
  name: string;

  /** Factor category */
  category: 'covenant' | 'waiver' | 'document' | 'obligation' | 'pattern' | 'external';

  /** Impact score (0-100) */
  impact_score: number;

  /** Whether this factor is increasing or decreasing */
  trend: 'increasing' | 'stable' | 'decreasing';

  /** Description of the risk */
  description: string;

  /** Related entity IDs */
  related_entity_ids: string[];
}

/**
 * A recommended intervention based on predictions.
 */
export interface RecommendedIntervention {
  /** Intervention ID */
  id: string;

  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';

  /** Type of intervention */
  type: 'proactive_outreach' | 'waiver_negotiation' | 'covenant_amendment' |
        'document_request' | 'escalation' | 'monitoring_increase';

  /** Title of the intervention */
  title: string;

  /** Detailed description */
  description: string;

  /** Expected impact if intervention is taken */
  expected_impact: string;

  /** Deadline for intervention to be effective */
  deadline?: string;

  /** Pattern this intervention addresses */
  addresses_pattern?: string;

  /** Entities affected */
  affected_entities: Array<{
    entity_type: TemporalEntityType;
    entity_id: string;
    entity_name: string;
  }>;
}

// =============================================================================
// Graph Analytics Types
// =============================================================================

/**
 * Analytics summary for the temporal graph.
 */
export interface TemporalGraphAnalytics {
  /** Total nodes in the graph */
  total_nodes: number;

  /** Total edges in the graph */
  total_edges: number;

  /** Node counts by entity type */
  nodes_by_type: Record<TemporalEntityType, number>;

  /** Edge counts by relation type */
  edges_by_relation: Record<CausalRelationType, number>;

  /** Most common causal patterns */
  top_patterns: CausalPattern[];

  /** Currently active pattern instances */
  active_instances: CausalChainInstance[];

  /** Facilities with highest risk based on patterns */
  highest_risk_facilities: FacilityPrediction[];

  /** Graph health metrics */
  health_metrics: {
    average_chain_length: number;
    average_prediction_confidence: number;
    pattern_coverage_percentage: number;
    last_updated: string;
  };
}

/**
 * Query parameters for temporal graph searches.
 */
export interface TemporalGraphQuery {
  /** Filter by entity types */
  entity_types?: TemporalEntityType[];

  /** Filter by states */
  states?: EntityState[];

  /** Filter by facility IDs */
  facility_ids?: string[];

  /** Time range start */
  from_date?: string;

  /** Time range end */
  to_date?: string;

  /** Minimum edge confidence */
  min_confidence?: number;

  /** Include only edges of these types */
  relation_types?: CausalRelationType[];

  /** Limit number of results */
  limit?: number;

  /** Include predicted future nodes */
  include_predictions?: boolean;
}

// =============================================================================
// Event Cascade Types
// =============================================================================

/**
 * Represents a cascade of events triggered by an initial event.
 */
export interface EventCascade {
  /** Cascade identifier */
  id: string;

  /** The triggering event */
  trigger_event: TemporalNode;

  /** All events in the cascade */
  cascade_events: TemporalNode[];

  /** The causal graph within this cascade */
  cascade_edges: TemporalEdge[];

  /** Depth of the cascade (longest path from trigger) */
  depth: number;

  /** Breadth of the cascade (max nodes at any level) */
  breadth: number;

  /** Total impact of the cascade */
  total_impact: {
    entities_affected: number;
    states_changed: number;
    duration_days: number;
    financial_impact?: number;
  };

  /** Whether cascade is still propagating */
  is_active: boolean;

  /** Cascade start timestamp */
  started_at: string;

  /** Cascade end timestamp (if complete) */
  completed_at?: string;
}

// =============================================================================
// Helper Type Guards
// =============================================================================

/**
 * Type guard for facility states
 */
export function isFacilityStatus(state: EntityState): state is FacilityStatus {
  return ['active', 'waiver_period', 'default', 'closed'].includes(state as string);
}

/**
 * Type guard for covenant lifecycle states
 */
export function isCovenantLifecycleState(state: EntityState): state is CovenantLifecycleState {
  return ['healthy', 'at_risk', 'breach', 'waived', 'resolved'].includes(state as string);
}

/**
 * Type guard for waiver states
 */
export function isWaiverStatus(state: EntityState): state is WaiverStatus {
  return ['pending', 'approved', 'rejected', 'expired', 'withdrawn'].includes(state as string);
}

// =============================================================================
// Display Helpers
// =============================================================================

/**
 * Get display color for entity type.
 */
export function getEntityTypeColor(type: TemporalEntityType): string {
  switch (type) {
    case 'facility':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'covenant':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'obligation':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'waiver':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'document':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'event':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}

/**
 * Get display label for entity type.
 */
export function getEntityTypeLabel(type: TemporalEntityType): string {
  switch (type) {
    case 'facility':
      return 'Facility';
    case 'covenant':
      return 'Covenant';
    case 'obligation':
      return 'Obligation';
    case 'waiver':
      return 'Waiver';
    case 'document':
      return 'Document';
    case 'event':
      return 'Event';
    default:
      return 'Unknown';
  }
}

/**
 * Get display color for causal relation type.
 */
export function getCausalRelationColor(type: CausalRelationType): string {
  switch (type) {
    case 'triggered_by':
    case 'caused':
      return 'text-red-600';
    case 'preceded_by':
      return 'text-zinc-500';
    case 'correlated_with':
      return 'text-amber-600';
    case 'mitigated_by':
    case 'resolved_by':
      return 'text-green-600';
    case 'escalated_to':
      return 'text-orange-600';
    case 'requires':
    case 'enables':
      return 'text-blue-600';
    default:
      return 'text-zinc-500';
  }
}

/**
 * Get display label for causal relation type.
 */
export function getCausalRelationLabel(type: CausalRelationType): string {
  switch (type) {
    case 'triggered_by':
      return 'Triggered By';
    case 'preceded_by':
      return 'Preceded By';
    case 'caused':
      return 'Caused';
    case 'correlated_with':
      return 'Correlated With';
    case 'mitigated_by':
      return 'Mitigated By';
    case 'escalated_to':
      return 'Escalated To';
    case 'resolved_by':
      return 'Resolved By';
    case 'requires':
      return 'Requires';
    case 'enables':
      return 'Enables';
    default:
      return 'Related To';
  }
}

/**
 * Get display color for risk level.
 */
export function getRiskLevelColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}

/**
 * Get display label for risk level.
 */
export function getRiskLevelLabel(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    case 'critical':
      return 'Critical Risk';
    default:
      return 'Unknown Risk';
  }
}
