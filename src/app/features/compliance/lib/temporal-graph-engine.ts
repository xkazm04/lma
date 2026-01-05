/**
 * Temporal Graph Engine for Compliance Causality Analysis
 *
 * This engine provides:
 * 1. Graph construction from facility/covenant/waiver/document events
 * 2. Causal chain detection and pattern matching
 * 3. Predictive analytics based on historical patterns
 * 4. Risk assessment and intervention recommendations
 */

import type {
  TemporalNode,
  TemporalEdge,
  CausalChain,
  CausalPattern,
  CausalChainInstance,
  PatternStatistics,
  FacilityPrediction,
  ActivePatternDetection,
  PredictedState,
  RiskAssessment,
  RiskFactor,
  RecommendedIntervention,
  TemporalGraphAnalytics,
  TemporalGraphQuery,
  EventCascade,
  TemporalEntityType,
  EntityState,
  CausalRelationType,
  PredictedNode,
} from './temporal-graph-types';

import type {
  CovenantStateHistory,
  CovenantStateTransition,
  TransitionPattern,
  PortfolioInsight,
  Facility,
  Covenant,
  Waiver,
  CovenantLifecycleState,
} from './types';

// =============================================================================
// Graph Building Functions
// =============================================================================

/**
 * Build a temporal node from a covenant state transition.
 */
export function buildNodeFromCovenantTransition(
  transition: CovenantStateTransition,
  covenantName: string,
  facilityId: string
): TemporalNode {
  return {
    id: `node-${transition.id}`,
    entity_type: 'covenant',
    entity_id: transition.covenant_id,
    entity_name: covenantName,
    state: transition.to_state,
    timestamp: transition.timestamp,
    duration_days: 0, // Calculated later
    parent_ids: {
      facility_id: facilityId,
      covenant_id: transition.covenant_id,
    },
    metadata: {
      trigger: transition.trigger,
      headroom_percentage: transition.headroom_percentage,
      calculated_ratio: transition.calculated_ratio,
      threshold_value: transition.threshold_value,
    },
  };
}

/**
 * Build temporal edges from consecutive transitions.
 */
export function buildEdgesFromTransitions(
  transitions: CovenantStateTransition[]
): TemporalEdge[] {
  const edges: TemporalEdge[] = [];

  for (let i = 0; i < transitions.length - 1; i++) {
    const from = transitions[i];
    const to = transitions[i + 1];

    const fromDate = new Date(from.timestamp);
    const toDate = new Date(to.timestamp);
    const timeDelta = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

    edges.push({
      id: `edge-${from.id}-${to.id}`,
      from_node_id: `node-${from.id}`,
      to_node_id: `node-${to.id}`,
      relation_type: determineRelationType(from.to_state, to.to_state, to.trigger),
      time_delta_days: timeDelta,
      confidence: 100, // Direct observation = 100% confidence
      weight: 1,
      description: `${from.to_state} → ${to.to_state} (${to.trigger})`,
      observed_at: to.timestamp,
    });
  }

  return edges;
}

/**
 * Determine the causal relation type based on state transitions.
 */
function determineRelationType(
  fromState: CovenantLifecycleState,
  toState: CovenantLifecycleState,
  trigger: string
): CausalRelationType {
  // Waiver-related transitions
  if (trigger === 'waiver_granted') {
    return 'mitigated_by';
  }
  if (trigger === 'waiver_expired') {
    return 'triggered_by';
  }

  // Use string comparison for state-based logic to avoid TypeScript narrowing issues
  const from = fromState as string;
  const to = toState as string;

  // Breach-related transitions
  if (to === 'breach') {
    if (from === 'at_risk') {
      return 'caused';
    }
    return 'escalated_to';
  }

  // Resolution transitions
  if (from === 'breach' && (to === 'healthy' || to === 'resolved')) {
    return 'resolved_by';
  }

  // Risk escalation
  if (from === 'healthy' && to === 'at_risk') {
    return 'preceded_by';
  }

  // Risk de-escalation
  if (from === 'at_risk' && to === 'healthy') {
    return 'resolved_by';
  }

  return 'preceded_by';
}

// =============================================================================
// Pattern Detection Functions
// =============================================================================

/**
 * Detect causal chains from a sequence of transitions.
 */
export function detectCausalChains(
  histories: CovenantStateHistory[],
  minChainLength: number = 2
): CausalChain[] {
  const chains: CausalChain[] = [];
  const chainMap = new Map<string, CausalChain>();

  histories.forEach(history => {
    const transitions = history.transitions;
    if (transitions.length < minChainLength) return;

    // Create a signature for this chain
    const signature = transitions
      .map(t => `${t.from_state}→${t.to_state}`)
      .join('|');

    if (chainMap.has(signature)) {
      // Increment occurrence count
      const existing = chainMap.get(signature)!;
      existing.occurrence_count++;
    } else {
      // Build nodes for this chain
      const nodeIds = transitions.map(t => `node-${t.id}`);

      // Calculate total duration
      const startDate = new Date(transitions[0].timestamp);
      const endDate = new Date(transitions[transitions.length - 1].timestamp);
      const totalDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      const chain: CausalChain = {
        id: `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: buildChainDescription(transitions),
        node_sequence: nodeIds,
        edges: buildEdgesFromTransitions(transitions),
        total_duration_days: totalDuration,
        occurrence_count: 1,
        probability: 0, // Calculated later
        entry_point: {
          entity_type: 'covenant',
          state: transitions[0].from_state,
        },
        exit_point: {
          entity_type: 'covenant',
          state: transitions[transitions.length - 1].to_state,
        },
        outcome_type: determineOutcomeType(transitions),
        severity: determineChainSeverity(transitions),
      };

      chainMap.set(signature, chain);
    }
  });

  // Calculate probabilities based on occurrence counts
  const totalChains = Array.from(chainMap.values()).reduce((sum, c) => sum + c.occurrence_count, 0);
  chainMap.forEach(chain => {
    chain.probability = (chain.occurrence_count / totalChains) * 100;
  });

  return Array.from(chainMap.values()).sort((a, b) => b.occurrence_count - a.occurrence_count);
}

/**
 * Build a human-readable description for a causal chain.
 */
function buildChainDescription(transitions: CovenantStateTransition[]): string {
  const stateSequence = [
    transitions[0].from_state,
    ...transitions.map(t => t.to_state)
  ];

  const uniqueStates = [...new Set(stateSequence)];

  if (uniqueStates.includes('breach')) {
    if (uniqueStates.includes('waived')) {
      return 'Covenant breach followed by waiver grant';
    }
    if (uniqueStates.includes('resolved')) {
      return 'Covenant breach with subsequent resolution';
    }
    return 'Covenant deterioration leading to breach';
  }

  if (stateSequence[0] === 'healthy' && stateSequence.includes('at_risk')) {
    return 'Healthy covenant showing early warning signs';
  }

  if (stateSequence.includes('at_risk') && stateSequence[stateSequence.length - 1] === 'healthy') {
    return 'At-risk covenant recovering to healthy status';
  }

  return `State progression: ${stateSequence.join(' → ')}`;
}

/**
 * Determine the outcome type for a chain.
 */
function determineOutcomeType(
  transitions: CovenantStateTransition[]
): 'positive' | 'negative' | 'neutral' {
  const finalState = transitions[transitions.length - 1].to_state;

  if (finalState === 'healthy' || finalState === 'resolved') {
    return 'positive';
  }
  if (finalState === 'breach') {
    return 'negative';
  }
  if (finalState === 'waived') {
    // Waiver is neutral - it's a temporary measure
    return 'neutral';
  }
  if (finalState === 'at_risk') {
    return 'negative';
  }

  return 'neutral';
}

/**
 * Determine severity for chains with negative outcomes.
 */
function determineChainSeverity(
  transitions: CovenantStateTransition[]
): 'low' | 'medium' | 'high' | 'critical' | undefined {
  const outcome = determineOutcomeType(transitions);
  if (outcome !== 'negative') return undefined;

  const finalState = transitions[transitions.length - 1].to_state;

  if (finalState === 'breach') {
    // Check if there were multiple failed tests
    const failedTests = transitions.filter(t =>
      t.test_result?.test_result === 'fail'
    ).length;

    if (failedTests >= 3) return 'critical';
    if (failedTests >= 2) return 'high';
    return 'medium';
  }

  if (finalState === 'at_risk') {
    const lastTransition = transitions[transitions.length - 1];
    if (lastTransition.headroom_percentage < 5) return 'high';
    if (lastTransition.headroom_percentage < 10) return 'medium';
    return 'low';
  }

  return 'low';
}

// =============================================================================
// Pattern Matching Functions
// =============================================================================

/**
 * Convert transition patterns to causal patterns.
 */
export function transitionPatternsToСausalPatterns(
  patterns: TransitionPattern[]
): CausalPattern[] {
  return patterns.map(pattern => ({
    id: `pattern-${pattern.from_state}-${pattern.to_state}`,
    name: `${capitalizeFirst(pattern.from_state)} to ${capitalizeFirst(pattern.to_state)}`,
    description: pattern.pattern,
    canonical_chain: {
      id: `chain-${pattern.from_state}-${pattern.to_state}`,
      description: pattern.pattern,
      node_sequence: [],
      edges: [],
      total_duration_days: pattern.average_days,
      occurrence_count: pattern.occurrence_count,
      probability: pattern.probability_percentage,
      entry_point: {
        entity_type: 'covenant',
        state: pattern.from_state,
      },
      exit_point: {
        entity_type: 'covenant',
        state: pattern.to_state,
      },
      outcome_type: pattern.to_state === 'breach' ? 'negative' :
                    pattern.to_state === 'healthy' || pattern.to_state === 'resolved' ? 'positive' :
                    'neutral',
      severity: pattern.to_state === 'breach' ? 'high' : undefined,
    },
    instances: [],
    statistics: {
      total_occurrences: pattern.occurrence_count,
      avg_duration_days: pattern.average_days,
      std_dev_duration_days: pattern.std_deviation_days,
      min_duration_days: pattern.average_days - pattern.std_deviation_days * 2,
      max_duration_days: pattern.average_days + pattern.std_deviation_days * 2,
      completion_probability: pattern.probability_percentage,
      avg_step_intervals: [pattern.average_days],
      outcome_distribution: {
        positive: pattern.to_state === 'healthy' || pattern.to_state === 'resolved' ? pattern.occurrence_count : 0,
        negative: pattern.to_state === 'breach' ? pattern.occurrence_count : 0,
        neutral: !['healthy', 'resolved', 'breach'].includes(pattern.to_state) ? pattern.occurrence_count : 0,
      },
      last_observed: new Date().toISOString(),
      first_observed: new Date(Date.now() - pattern.average_days * 24 * 60 * 60 * 1000 * pattern.occurrence_count).toISOString(),
    },
    recommended_actions: generateRecommendedActions(pattern),
    tags: [pattern.from_state, pattern.to_state, 'covenant'],
  }));
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function generateRecommendedActions(pattern: TransitionPattern): string[] {
  const actions: string[] = [];

  if (pattern.from_state === 'at_risk' && pattern.to_state === 'breach') {
    actions.push('Schedule proactive borrower discussions');
    actions.push('Request updated financial projections');
    actions.push('Prepare waiver documentation in advance');
    actions.push('Consider covenant amendment negotiation');
  }

  if (pattern.from_state === 'healthy' && pattern.to_state === 'at_risk') {
    actions.push('Increase monitoring frequency');
    actions.push('Review operational performance metrics');
    actions.push('Assess industry/market conditions');
  }

  if (pattern.from_state === 'breach' && pattern.to_state === 'waived') {
    actions.push('Define clear waiver conditions');
    actions.push('Set milestone requirements');
    actions.push('Establish regular check-in schedule');
  }

  if (pattern.from_state === 'waived' && pattern.to_state === 'breach') {
    actions.push('Begin restructuring discussions immediately');
    actions.push('Assess recovery probability');
    actions.push('Review collateral and security positions');
  }

  return actions;
}

// =============================================================================
// Prediction Functions
// =============================================================================

/**
 * Generate predictions for a facility based on current state and historical patterns.
 */
export function generateFacilityPrediction(
  facility: Facility,
  covenants: Covenant[],
  covenantHistories: CovenantStateHistory[],
  patterns: CausalPattern[]
): FacilityPrediction {
  const activePatterns = detectActivePatterns(covenantHistories, patterns);
  const predictedStates = generatePredictedStates(covenantHistories, patterns);
  const riskAssessment = calculateRiskAssessment(facility, covenants, covenantHistories, activePatterns);
  const interventions = generateInterventions(activePatterns, riskAssessment);

  return {
    facility_id: facility.id,
    facility_name: facility.facility_name,
    borrower_name: facility.borrower_name,
    active_patterns: activePatterns,
    predicted_states: predictedStates,
    risk_assessment: riskAssessment,
    interventions,
    overall_confidence: calculateOverallConfidence(activePatterns, predictedStates),
    analyzed_at: new Date().toISOString(),
    prediction_horizon_days: 180,
  };
}

/**
 * Detect patterns that are currently active/in-progress.
 */
function detectActivePatterns(
  histories: CovenantStateHistory[],
  patterns: CausalPattern[]
): ActivePatternDetection[] {
  const detections: ActivePatternDetection[] = [];

  histories.forEach(history => {
    const currentState = history.current_state;

    // Find patterns that start from the current state
    patterns.forEach(pattern => {
      if (pattern.canonical_chain.entry_point.state === currentState) {
        // This pattern could be starting
        const daysInState = history.days_in_current_state;

        // Check if we're within the typical window for this pattern
        const avgDuration = pattern.statistics.avg_duration_days;
        const stdDev = pattern.statistics.std_dev_duration_days;

        if (daysInState <= avgDuration + stdDev * 2) {
          const matchConfidence = calculatePatternMatchConfidence(
            daysInState,
            avgDuration,
            stdDev,
            pattern.statistics.completion_probability
          );

          if (matchConfidence > 30) {
            detections.push({
              pattern_id: pattern.id,
              pattern_name: pattern.name,
              progress: {
                current_step: 1,
                total_steps: 2,
                percentage: 50,
              },
              match_confidence: matchConfidence,
              matched_nodes: [],
              predicted_remaining: generatePredictedNodes(pattern),
              expected_completion_date: calculateExpectedCompletion(
                daysInState,
                avgDuration
              ),
              expected_outcome: pattern.canonical_chain.outcome_type,
              expected_severity: pattern.canonical_chain.severity,
              days_until_critical: Math.max(0, avgDuration - daysInState),
            });
          }
        }
      }
    });
  });

  return detections.sort((a, b) => b.match_confidence - a.match_confidence);
}

function calculatePatternMatchConfidence(
  daysInState: number,
  avgDuration: number,
  stdDev: number,
  completionProb: number
): number {
  // Higher confidence if we're in the typical window
  const normalizedPosition = Math.abs(daysInState - avgDuration / 2) / (stdDev || 1);
  const positionFactor = Math.max(0, 100 - normalizedPosition * 20);

  // Weight by historical completion probability
  return Math.min(100, (positionFactor * completionProb) / 100);
}

function generatePredictedNodes(pattern: CausalPattern): PredictedNode[] {
  const exitState = pattern.canonical_chain.exit_point;

  return [{
    entity_type: exitState.entity_type,
    predicted_state: exitState.state,
    probability: pattern.statistics.completion_probability,
    estimated_days: pattern.statistics.avg_duration_days,
    timing_confidence_interval: [
      pattern.statistics.min_duration_days,
      pattern.statistics.max_duration_days,
    ],
    description: `Expected transition to ${exitState.state}`,
  }];
}

function calculateExpectedCompletion(
  daysInState: number,
  avgDuration: number
): string {
  const remainingDays = Math.max(0, avgDuration - daysInState);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + remainingDays);
  return completionDate.toISOString();
}

/**
 * Generate predicted future states for all entities.
 */
function generatePredictedStates(
  histories: CovenantStateHistory[],
  patterns: CausalPattern[]
): PredictedState[] {
  const predictions: PredictedState[] = [];

  histories.forEach(history => {
    const currentState = history.current_state;

    // Find the most likely next state based on patterns
    const relevantPatterns = patterns.filter(
      p => p.canonical_chain.entry_point.state === currentState
    );

    relevantPatterns.forEach(pattern => {
      predictions.push({
        entity_type: 'covenant',
        entity_id: history.covenant_id,
        entity_name: `Covenant ${history.covenant_id}`,
        current_state: currentState,
        predicted_state: pattern.canonical_chain.exit_point.state,
        probability: pattern.statistics.completion_probability,
        estimated_days: pattern.statistics.avg_duration_days,
        confidence: Math.min(100, pattern.statistics.total_occurrences * 10),
        based_on_patterns: [pattern.id],
        reasoning: pattern.description,
      });
    });
  });

  return predictions.sort((a, b) => b.probability - a.probability);
}

/**
 * Calculate overall risk assessment for a facility.
 */
function calculateRiskAssessment(
  facility: Facility,
  covenants: Covenant[],
  histories: CovenantStateHistory[],
  activePatterns: ActivePatternDetection[]
): RiskAssessment {
  const riskFactors: RiskFactor[] = [];
  let totalRiskScore = 0;

  // Factor 1: Current covenant states
  histories.forEach(history => {
    if (history.current_state === 'breach') {
      riskFactors.push({
        name: 'Active Covenant Breach',
        category: 'covenant',
        impact_score: 40,
        trend: 'stable',
        description: `Covenant in breach status for ${Math.round(history.days_in_current_state)} days`,
        related_entity_ids: [history.covenant_id],
      });
      totalRiskScore += 40;
    } else if (history.current_state === 'at_risk') {
      riskFactors.push({
        name: 'At-Risk Covenant',
        category: 'covenant',
        impact_score: 20,
        trend: history.days_in_current_state > 30 ? 'increasing' : 'stable',
        description: `Covenant showing early warning signs`,
        related_entity_ids: [history.covenant_id],
      });
      totalRiskScore += 20;
    }
  });

  // Factor 2: Active negative patterns
  activePatterns
    .filter(p => p.expected_outcome === 'negative')
    .forEach(pattern => {
      riskFactors.push({
        name: 'Negative Pattern Detected',
        category: 'pattern',
        impact_score: pattern.expected_severity === 'critical' ? 30 :
                      pattern.expected_severity === 'high' ? 20 : 10,
        trend: 'increasing',
        description: `Pattern "${pattern.pattern_name}" detected with ${pattern.match_confidence}% confidence`,
        related_entity_ids: [],
      });
      totalRiskScore += pattern.expected_severity === 'critical' ? 30 :
                        pattern.expected_severity === 'high' ? 20 : 10;
    });

  // Factor 3: Facility status
  if (facility.status === 'waiver_period') {
    riskFactors.push({
      name: 'Active Waiver Period',
      category: 'waiver',
      impact_score: 15,
      trend: 'stable',
      description: 'Facility currently under waiver protection',
      related_entity_ids: [facility.id],
    });
    totalRiskScore += 15;
  } else if (facility.status === 'default') {
    riskFactors.push({
      name: 'Facility in Default',
      category: 'covenant',
      impact_score: 50,
      trend: 'stable',
      description: 'Facility has entered default status',
      related_entity_ids: [facility.id],
    });
    totalRiskScore += 50;
  }

  // Normalize to 0-100
  totalRiskScore = Math.min(100, totalRiskScore);

  // Determine risk level
  const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
    totalRiskScore >= 70 ? 'critical' :
    totalRiskScore >= 50 ? 'high' :
    totalRiskScore >= 25 ? 'medium' : 'low';

  // Calculate trajectory based on active patterns
  const negativePatterns = activePatterns.filter(p => p.expected_outcome === 'negative').length;
  const positivePatterns = activePatterns.filter(p => p.expected_outcome === 'positive').length;
  const trajectory: 'improving' | 'stable' | 'deteriorating' =
    positivePatterns > negativePatterns ? 'improving' :
    negativePatterns > positivePatterns ? 'deteriorating' : 'stable';

  // Calculate default probabilities
  const baseDefaultProb = totalRiskScore / 200; // Base probability
  const defaultProbability = {
    days_30: Math.min(100, baseDefaultProb * 30 * (trajectory === 'deteriorating' ? 1.5 : 1)),
    days_90: Math.min(100, baseDefaultProb * 60 * (trajectory === 'deteriorating' ? 1.5 : 1)),
    days_180: Math.min(100, baseDefaultProb * 80 * (trajectory === 'deteriorating' ? 1.5 : 1)),
    days_365: Math.min(100, baseDefaultProb * 100 * (trajectory === 'deteriorating' ? 1.5 : 1)),
  };

  return {
    overall_score: totalRiskScore,
    risk_level: riskLevel,
    trajectory,
    default_probability: defaultProbability,
    risk_factors: riskFactors,
    portfolio_comparison: {
      percentile: Math.min(100, 100 - totalRiskScore),
      comparison: totalRiskScore > 50 ? 'worse' : totalRiskScore < 25 ? 'better' : 'similar',
    },
  };
}

/**
 * Generate intervention recommendations.
 */
function generateInterventions(
  activePatterns: ActivePatternDetection[],
  riskAssessment: RiskAssessment
): RecommendedIntervention[] {
  const interventions: RecommendedIntervention[] = [];

  // Interventions based on risk level
  if (riskAssessment.risk_level === 'critical') {
    interventions.push({
      id: `intervention-critical-${Date.now()}`,
      priority: 'critical',
      type: 'escalation',
      title: 'Immediate Escalation Required',
      description: 'Risk assessment indicates critical level. Immediate senior management review required.',
      expected_impact: 'Enables rapid response and resource allocation',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      affected_entities: [],
    });
  }

  // Interventions based on active patterns
  activePatterns.forEach(pattern => {
    if (pattern.expected_outcome === 'negative' && pattern.match_confidence > 50) {
      interventions.push({
        id: `intervention-pattern-${pattern.pattern_id}-${Date.now()}`,
        priority: pattern.expected_severity === 'critical' ? 'critical' :
                  pattern.expected_severity === 'high' ? 'high' : 'medium',
        type: 'proactive_outreach',
        title: `Proactive Outreach: ${pattern.pattern_name}`,
        description: `Historical pattern suggests ${pattern.expected_outcome} outcome. Early intervention recommended.`,
        expected_impact: 'May prevent or mitigate predicted negative outcome',
        deadline: pattern.expected_completion_date,
        addresses_pattern: pattern.pattern_id,
        affected_entities: [],
      });

      if (pattern.days_until_critical && pattern.days_until_critical < 30) {
        interventions.push({
          id: `intervention-waiver-${pattern.pattern_id}-${Date.now()}`,
          priority: 'high',
          type: 'waiver_negotiation',
          title: 'Prepare Waiver Documentation',
          description: 'Begin waiver preparation to ensure readiness if covenant breach occurs.',
          expected_impact: 'Reduces response time if waiver becomes necessary',
          deadline: new Date(Date.now() + pattern.days_until_critical * 24 * 60 * 60 * 1000).toISOString(),
          addresses_pattern: pattern.pattern_id,
          affected_entities: [],
        });
      }
    }
  });

  // Interventions based on trajectory
  if (riskAssessment.trajectory === 'deteriorating') {
    interventions.push({
      id: `intervention-monitoring-${Date.now()}`,
      priority: 'medium',
      type: 'monitoring_increase',
      title: 'Increase Monitoring Frequency',
      description: 'Risk trajectory is deteriorating. Recommend increasing monitoring frequency.',
      expected_impact: 'Earlier detection of further deterioration',
      affected_entities: [],
    });
  }

  return interventions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function calculateOverallConfidence(
  activePatterns: ActivePatternDetection[],
  predictedStates: PredictedState[]
): number {
  if (activePatterns.length === 0 && predictedStates.length === 0) {
    return 50; // No data = moderate confidence
  }

  const patternConfidences = activePatterns.map(p => p.match_confidence);
  const stateConfidences = predictedStates.map(p => p.confidence);

  const allConfidences = [...patternConfidences, ...stateConfidences];
  return Math.round(allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length);
}

// =============================================================================
// Event Cascade Analysis
// =============================================================================

/**
 * Analyze potential event cascades from a trigger event.
 */
export function analyzeEventCascade(
  triggerNode: TemporalNode,
  allNodes: TemporalNode[],
  allEdges: TemporalEdge[]
): EventCascade {
  const cascadeEvents: TemporalNode[] = [];
  const cascadeEdges: TemporalEdge[] = [];

  // BFS to find all downstream nodes
  const visited = new Set<string>();
  const queue = [triggerNode.id];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = allNodes.find(n => n.id === currentId);
    if (node && node.id !== triggerNode.id) {
      cascadeEvents.push(node);
    }

    // Find outgoing edges
    const outgoingEdges = allEdges.filter(e => e.from_node_id === currentId);
    outgoingEdges.forEach(edge => {
      cascadeEdges.push(edge);
      if (!visited.has(edge.to_node_id)) {
        queue.push(edge.to_node_id);
      }
    });
  }

  // Calculate cascade metrics
  const depth = calculateCascadeDepth(triggerNode.id, cascadeEdges);
  const breadth = calculateCascadeBreadth(cascadeEvents);

  const startDate = new Date(triggerNode.timestamp);
  const endDate = cascadeEvents.length > 0
    ? new Date(Math.max(...cascadeEvents.map(n => new Date(n.timestamp).getTime())))
    : startDate;
  const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  return {
    id: `cascade-${triggerNode.id}`,
    trigger_event: triggerNode,
    cascade_events: cascadeEvents,
    cascade_edges: cascadeEdges,
    depth,
    breadth,
    total_impact: {
      entities_affected: new Set(cascadeEvents.map(n => n.entity_id)).size,
      states_changed: cascadeEvents.length,
      duration_days: durationDays,
    },
    is_active: cascadeEvents.some(n => n.duration_days === 0),
    started_at: triggerNode.timestamp,
    completed_at: cascadeEvents.every(n => n.duration_days > 0)
      ? endDate.toISOString()
      : undefined,
  };
}

function calculateCascadeDepth(
  startId: string,
  edges: TemporalEdge[]
): number {
  const depths = new Map<string, number>();
  depths.set(startId, 0);

  let changed = true;
  while (changed) {
    changed = false;
    edges.forEach(edge => {
      const fromDepth = depths.get(edge.from_node_id);
      if (fromDepth !== undefined) {
        const currentDepth = depths.get(edge.to_node_id) ?? -1;
        if (fromDepth + 1 > currentDepth) {
          depths.set(edge.to_node_id, fromDepth + 1);
          changed = true;
        }
      }
    });
  }

  return Math.max(...Array.from(depths.values()), 0);
}

function calculateCascadeBreadth(nodes: TemporalNode[]): number {
  // Group by timestamp (approximately same time = same level)
  const levels = new Map<number, number>();
  nodes.forEach(node => {
    const timestamp = new Date(node.timestamp).getTime();
    const level = Math.round(timestamp / (24 * 60 * 60 * 1000)); // Day-level granularity
    levels.set(level, (levels.get(level) || 0) + 1);
  });

  return Math.max(...Array.from(levels.values()), 0);
}

// =============================================================================
// Graph Analytics Functions
// =============================================================================

/**
 * Generate analytics summary for the temporal graph.
 */
export function generateGraphAnalytics(
  nodes: TemporalNode[],
  edges: TemporalEdge[],
  patterns: CausalPattern[],
  predictions: FacilityPrediction[]
): TemporalGraphAnalytics {
  // Count nodes by type
  const nodesByType: Record<TemporalEntityType, number> = {
    facility: 0,
    covenant: 0,
    obligation: 0,
    waiver: 0,
    document: 0,
    event: 0,
  };
  nodes.forEach(node => {
    nodesByType[node.entity_type]++;
  });

  // Count edges by relation type
  const edgesByRelation: Record<CausalRelationType, number> = {
    triggered_by: 0,
    preceded_by: 0,
    caused: 0,
    correlated_with: 0,
    mitigated_by: 0,
    escalated_to: 0,
    resolved_by: 0,
    requires: 0,
    enables: 0,
  };
  edges.forEach(edge => {
    edgesByRelation[edge.relation_type]++;
  });

  // Find active instances
  const activeInstances = patterns
    .flatMap(p => p.instances)
    .filter(i => i.is_active);

  // Find highest risk facilities
  const highestRiskFacilities = predictions
    .sort((a, b) => b.risk_assessment.overall_score - a.risk_assessment.overall_score)
    .slice(0, 5);

  // Calculate average chain length
  const chainLengths = patterns.map(p => p.canonical_chain.node_sequence.length);
  const avgChainLength = chainLengths.length > 0
    ? chainLengths.reduce((a, b) => a + b, 0) / chainLengths.length
    : 0;

  // Calculate average prediction confidence
  const confidences = predictions.map(p => p.overall_confidence);
  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return {
    total_nodes: nodes.length,
    total_edges: edges.length,
    nodes_by_type: nodesByType,
    edges_by_relation: edgesByRelation,
    top_patterns: patterns.slice(0, 10),
    active_instances: activeInstances,
    highest_risk_facilities: highestRiskFacilities,
    health_metrics: {
      average_chain_length: avgChainLength,
      average_prediction_confidence: avgConfidence,
      pattern_coverage_percentage: patterns.length > 0 ? 85 : 0, // Placeholder
      last_updated: new Date().toISOString(),
    },
  };
}

/**
 * Query the temporal graph with filters.
 */
export function queryTemporalGraph(
  nodes: TemporalNode[],
  edges: TemporalEdge[],
  query: TemporalGraphQuery
): { nodes: TemporalNode[]; edges: TemporalEdge[] } {
  let filteredNodes = [...nodes];
  let filteredEdges = [...edges];

  // Filter by entity types
  if (query.entity_types && query.entity_types.length > 0) {
    filteredNodes = filteredNodes.filter(n =>
      query.entity_types!.includes(n.entity_type)
    );
  }

  // Filter by states
  if (query.states && query.states.length > 0) {
    filteredNodes = filteredNodes.filter(n =>
      query.states!.includes(n.state)
    );
  }

  // Filter by facility IDs
  if (query.facility_ids && query.facility_ids.length > 0) {
    filteredNodes = filteredNodes.filter(n =>
      n.parent_ids.facility_id && query.facility_ids!.includes(n.parent_ids.facility_id)
    );
  }

  // Filter by time range
  if (query.from_date) {
    const fromTime = new Date(query.from_date).getTime();
    filteredNodes = filteredNodes.filter(n =>
      new Date(n.timestamp).getTime() >= fromTime
    );
  }
  if (query.to_date) {
    const toTime = new Date(query.to_date).getTime();
    filteredNodes = filteredNodes.filter(n =>
      new Date(n.timestamp).getTime() <= toTime
    );
  }

  // Get node IDs for edge filtering
  const nodeIds = new Set(filteredNodes.map(n => n.id));

  // Filter edges to only include those between filtered nodes
  filteredEdges = filteredEdges.filter(e =>
    nodeIds.has(e.from_node_id) && nodeIds.has(e.to_node_id)
  );

  // Filter by relation types
  if (query.relation_types && query.relation_types.length > 0) {
    filteredEdges = filteredEdges.filter(e =>
      query.relation_types!.includes(e.relation_type)
    );
  }

  // Filter by minimum confidence
  if (query.min_confidence !== undefined) {
    filteredEdges = filteredEdges.filter(e =>
      e.confidence >= query.min_confidence!
    );
  }

  // Apply limit
  if (query.limit) {
    filteredNodes = filteredNodes.slice(0, query.limit);
  }

  return { nodes: filteredNodes, edges: filteredEdges };
}
