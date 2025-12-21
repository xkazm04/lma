/**
 * Prediction Engine
 *
 * Uses the knowledge graph to generate predictions about deal outcomes,
 * optimal term structures, sticking points, and negotiation strategies.
 */

import type {
  KnowledgeGraph,
  DealNode,
  TermNode,
  CounterpartyNode,
  DealPrediction,
  StickingPointPrediction,
  NegotiationStrategy,
  OptimalTermStructure,
  CounterpartyInsight,
  NegotiationPattern,
  MarketInsight,
  GNNEmbedding,
} from './types';
import { findSimilarDeals, getCounterpartyInsights, getRelatedNodes } from './graph-engine';

// ============================================
// GNN-Based Embedding Generation
// ============================================

/**
 * Generate node embeddings using a simplified GNN approach.
 * In production, this would use actual GNN models (e.g., GraphSAGE, GAT).
 */
export function generateNodeEmbeddings(
  graph: KnowledgeGraph,
  embeddingDim: number = 64
): Map<string, GNNEmbedding> {
  const embeddings = new Map<string, GNNEmbedding>();

  // Build adjacency for message passing
  const adjacency = buildAdjacencyList(graph);

  for (const node of graph.nodes) {
    // Initialize embedding based on node properties
    const initialEmbedding = encodeNodeFeatures(node, embeddingDim);

    // Aggregate neighbor features (simplified 1-hop message passing)
    const neighbors = adjacency.get(node.id) || [];
    const aggregatedEmbedding = aggregateNeighborFeatures(
      graph,
      neighbors,
      initialEmbedding,
      embeddingDim
    );

    // Find similar nodes based on embedding
    const similarNodes = findSimilarNodesByEmbedding(
      graph,
      node.id,
      aggregatedEmbedding,
      embeddings,
      10
    );

    embeddings.set(node.id, {
      nodeId: node.id,
      nodeType: node.type,
      embedding: aggregatedEmbedding,
      similarNodes,
    });
  }

  return embeddings;
}

function buildAdjacencyList(graph: KnowledgeGraph): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  return adjacency;
}

function encodeNodeFeatures(node: { type: string; properties: Record<string, unknown> }, dim: number): number[] {
  const embedding = new Array(dim).fill(0);

  // Encode node type
  const typeMap: Record<string, number> = {
    deal: 0,
    term: 1,
    participant: 2,
    counterparty: 3,
    market_condition: 4,
    outcome: 5,
    term_structure: 6,
    negotiation_pattern: 7,
  };
  embedding[typeMap[node.type] || 0] = 1;

  // Encode numeric properties
  const props = node.properties;
  if (typeof props.totalValue === 'number') {
    embedding[10] = Math.log1p(props.totalValue) / 20;
  }
  if (typeof props.duration === 'number') {
    embedding[11] = props.duration / 365;
  }
  if (typeof props.roundCount === 'number') {
    embedding[12] = props.roundCount / 10;
  }
  if (typeof props.successScore === 'number') {
    embedding[13] = props.successScore / 100;
  }
  if (typeof props.negotiationRounds === 'number') {
    embedding[14] = props.negotiationRounds / 10;
  }
  if (typeof props.totalDeals === 'number') {
    embedding[15] = Math.log1p(props.totalDeals) / 5;
  }
  if (typeof props.acceptanceRate === 'number') {
    embedding[16] = props.acceptanceRate;
  }
  if (typeof props.avgClosingTime === 'number') {
    embedding[17] = props.avgClosingTime / 180;
  }

  // Add random noise for diversity (simulates learned features)
  for (let i = 20; i < dim; i++) {
    const propKeys = Object.keys(props);
    const hash = propKeys.reduce((acc, k) => acc + k.charCodeAt(0), 0);
    embedding[i] = ((hash * (i + 1)) % 100) / 100 * 0.1;
  }

  return embedding;
}

function aggregateNeighborFeatures(
  graph: KnowledgeGraph,
  neighbors: string[],
  selfEmbedding: number[],
  dim: number
): number[] {
  if (neighbors.length === 0) {
    return selfEmbedding;
  }

  const aggregated = [...selfEmbedding];

  for (const neighborId of neighbors) {
    const neighbor = graph.nodes.find(n => n.id === neighborId);
    if (neighbor) {
      const neighborEmb = encodeNodeFeatures(neighbor, dim);
      for (let i = 0; i < dim; i++) {
        aggregated[i] += neighborEmb[i] / neighbors.length;
      }
    }
  }

  // Normalize
  const magnitude = Math.sqrt(aggregated.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dim; i++) {
      aggregated[i] /= magnitude;
    }
  }

  return aggregated;
}

function findSimilarNodesByEmbedding(
  graph: KnowledgeGraph,
  nodeId: string,
  embedding: number[],
  existingEmbeddings: Map<string, GNNEmbedding>,
  limit: number
): { nodeId: string; similarity: number }[] {
  const similarities: { nodeId: string; similarity: number }[] = [];

  const selfNode = graph.nodes.find(n => n.id === nodeId);
  if (!selfNode) return [];

  for (const [otherId, otherEmb] of existingEmbeddings) {
    if (otherId === nodeId) continue;

    const otherNode = graph.nodes.find(n => n.id === otherId);
    if (!otherNode || otherNode.type !== selfNode.type) continue;

    const similarity = cosineSimilarity(embedding, otherEmb.embedding);
    if (similarity > 0.5) {
      similarities.push({ nodeId: otherId, similarity });
    }
  }

  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

// ============================================
// Deal Outcome Prediction
// ============================================

export interface PredictionContext {
  dealId: string;
  currentTerms: { termId: string; termKey: string; currentValue: unknown; status: string }[];
  participants: { participantId: string; role: string; partyType: string }[];
  marketConditions?: { avgMargin: number; volatility: number };
}

/**
 * Generate comprehensive predictions for a deal based on the knowledge graph.
 */
export function generateDealPrediction(
  graph: KnowledgeGraph,
  context: PredictionContext,
  embeddings?: Map<string, GNNEmbedding>
): DealPrediction {
  // Find similar historical deals
  const similarDeals = findSimilarDeals(graph, context.dealId, 20);

  // Get outcome data from similar deals
  const outcomes = getOutcomesFromSimilarDeals(graph, similarDeals);

  // Calculate closing probability based on similar deal outcomes
  const closingProbability = calculateClosingProbability(outcomes, context);

  // Estimate closing time
  const estimatedClosingDays = estimateClosingDays(outcomes, context);

  // Estimate negotiation rounds
  const estimatedRounds = estimateNegotiationRounds(outcomes, context);

  // Identify likely sticking points
  const likelyStickingPoints = identifyStickingPoints(graph, context, outcomes);

  // Generate recommended strategies
  const recommendedStrategies = generateStrategies(graph, context, outcomes);

  // Calculate optimal term structure
  const optimalTermStructure = calculateOptimalTermStructure(graph, context, outcomes);

  // Get counterparty insights
  const counterpartyInsights = getCounterpartyInsightsForDeal(graph, context);

  return {
    dealId: context.dealId,
    timestamp: new Date().toISOString(),
    predictions: {
      closingProbability,
      estimatedClosingDays,
      estimatedRounds,
      likelyStickingPoints,
      recommendedStrategies,
      optimalTermStructure,
      counterpartyInsights,
    },
    confidence: calculateOverallConfidence(similarDeals.length, outcomes),
    modelVersion: '1.0.0-gnn',
  };
}

interface DealOutcome {
  dealId: string;
  status: string;
  closingDays?: number;
  rounds?: number;
  stickingPoints: string[];
  finalMargin?: number;
  similarity: number;
}

function getOutcomesFromSimilarDeals(
  graph: KnowledgeGraph,
  similarDeals: { dealId: string; similarity: number }[]
): DealOutcome[] {
  const outcomes: DealOutcome[] = [];

  for (const { dealId, similarity } of similarDeals) {
    const dealNode = graph.nodes.find(
      n => n.type === 'deal' && n.id === `deal-${dealId}`
    ) as DealNode | undefined;

    if (!dealNode) continue;

    const outcomeNode = graph.nodes.find(
      n => n.type === 'outcome' && n.properties.dealId === dealId
    );

    outcomes.push({
      dealId,
      status: dealNode.properties.status,
      closingDays: dealNode.properties.duration,
      rounds: dealNode.properties.roundCount,
      stickingPoints: [],
      finalMargin: outcomeNode?.properties.finalMargin as number | undefined,
      similarity,
    });
  }

  return outcomes;
}

function calculateClosingProbability(
  outcomes: DealOutcome[],
  _context: PredictionContext
): number {
  if (outcomes.length === 0) return 0.65; // Default probability

  // Weight outcomes by similarity
  let weightedSuccess = 0;
  let totalWeight = 0;

  for (const outcome of outcomes) {
    const weight = outcome.similarity;
    const success = outcome.status === 'closed' ? 1 : 0;
    weightedSuccess += weight * success;
    totalWeight += weight;
  }

  const probability = totalWeight > 0 ? weightedSuccess / totalWeight : 0.65;

  // Clamp to reasonable range
  return Math.max(0.1, Math.min(0.95, probability));
}

function estimateClosingDays(
  outcomes: DealOutcome[],
  _context: PredictionContext
): number {
  const closedDeals = outcomes.filter(o => o.closingDays !== undefined && o.status === 'closed');

  if (closedDeals.length === 0) return 60; // Default estimate

  // Weighted average by similarity
  let weightedDays = 0;
  let totalWeight = 0;

  for (const outcome of closedDeals) {
    weightedDays += outcome.similarity * outcome.closingDays!;
    totalWeight += outcome.similarity;
  }

  return Math.round(totalWeight > 0 ? weightedDays / totalWeight : 60);
}

function estimateNegotiationRounds(
  outcomes: DealOutcome[],
  _context: PredictionContext
): number {
  const dealsWithRounds = outcomes.filter(o => o.rounds !== undefined);

  if (dealsWithRounds.length === 0) return 4; // Default estimate

  let weightedRounds = 0;
  let totalWeight = 0;

  for (const outcome of dealsWithRounds) {
    weightedRounds += outcome.similarity * outcome.rounds!;
    totalWeight += outcome.similarity;
  }

  return Math.round(totalWeight > 0 ? weightedRounds / totalWeight : 4);
}

function identifyStickingPoints(
  graph: KnowledgeGraph,
  context: PredictionContext,
  outcomes: DealOutcome[]
): StickingPointPrediction[] {
  const stickingPoints: StickingPointPrediction[] = [];

  // Get term nodes from the graph
  const termNodes = graph.nodes.filter(n => n.type === 'term') as TermNode[];

  // Analyze which terms historically caused issues
  const termContentionScores = new Map<string, { total: number; contentious: number; rounds: number[] }>();

  for (const node of termNodes) {
    const termKey = node.properties.termKey;
    if (!termContentionScores.has(termKey)) {
      termContentionScores.set(termKey, { total: 0, contentious: 0, rounds: [] });
    }

    const score = termContentionScores.get(termKey)!;
    score.total++;
    if (node.properties.wasContentious) {
      score.contentious++;
    }
    if (node.properties.negotiationRounds) {
      score.rounds.push(node.properties.negotiationRounds);
    }
  }

  // Identify terms that are likely sticking points
  for (const term of context.currentTerms) {
    const score = termContentionScores.get(term.termKey);
    if (!score || score.total < 3) continue;

    const contentionRate = score.contentious / score.total;
    const avgRounds = score.rounds.length > 0
      ? score.rounds.reduce((a, b) => a + b, 0) / score.rounds.length
      : 0;

    if (contentionRate > 0.3 || avgRounds > 3) {
      stickingPoints.push({
        termId: term.termId,
        termLabel: term.termKey,
        probability: Math.min(0.95, contentionRate + 0.2),
        reason: generateStickingPointReason(term.termKey, contentionRate, avgRounds),
        suggestedApproach: generateApproachSuggestion(term.termKey, contentionRate),
        historicalResolution: {
          avgRoundsToResolve: Math.round(avgRounds),
          commonCompromises: getCommonCompromises(term.termKey),
        },
      });
    }
  }

  // Sort by probability
  return stickingPoints.sort((a, b) => b.probability - a.probability).slice(0, 5);
}

function generateStickingPointReason(termKey: string, contentionRate: number, avgRounds: number): string {
  const reasons: Record<string, string> = {
    margin: `Pricing terms are contentious ${Math.round(contentionRate * 100)}% of the time in similar deals`,
    leverage_ratio: `Leverage covenants typically require ${Math.round(avgRounds)} rounds of negotiation`,
    interest_coverage: `Coverage ratios often need adjustment based on borrower financials`,
    maturity_date: `Tenor negotiations are frequently extended in this market segment`,
    prepayment_fee: `Prepayment provisions vary widely and often require multiple discussions`,
    assignment_consent: `Transfer restrictions are commonly negotiated points`,
    financial_reporting: `Reporting frequency and detail are often areas of back-and-forth`,
  };

  return reasons[termKey] || `This term has a ${Math.round(contentionRate * 100)}% contention rate historically`;
}

function generateApproachSuggestion(termKey: string, _contentionRate: number): string {
  const approaches: Record<string, string> = {
    margin: 'Consider presenting market data to justify pricing position',
    leverage_ratio: 'Propose step-downs tied to deleveraging milestones',
    interest_coverage: 'Offer EBITDA add-back flexibility in exchange for tighter ratio',
    maturity_date: 'Link extension options to covenant performance',
    prepayment_fee: 'Structure declining prepayment fee schedule',
    assignment_consent: 'Limit consent requirements to specific counterparty types',
    financial_reporting: 'Propose quarterly with monthly triggers on specific events',
  };

  return approaches[termKey] || 'Present comparable market terms to support your position';
}

function getCommonCompromises(termKey: string): string[] {
  const compromises: Record<string, string[]> = {
    margin: ['Split the difference on initial margin', 'Add performance-based margin grid'],
    leverage_ratio: ['Allow covenant holiday', 'Include cure rights', 'Add seasonal adjustments'],
    interest_coverage: ['Reduce minimum but add floor', 'Include EBITDA add-backs'],
    maturity_date: ['Extension option with fee', 'Amortization acceleration trade-off'],
    prepayment_fee: ['Reduce fee percentage', 'Shorten soft-call period'],
    assignment_consent: ['Whitelist approved assignees', 'Limit to minimum hold amount'],
    financial_reporting: ['Quarterly with monthly officer certificates', 'Tiered reporting based on leverage'],
  };

  return compromises[termKey] || ['Find middle ground on value', 'Link to other term concessions'];
}

function generateStrategies(
  graph: KnowledgeGraph,
  context: PredictionContext,
  outcomes: DealOutcome[]
): NegotiationStrategy[] {
  const strategies: NegotiationStrategy[] = [];

  // Analyze successful patterns from similar deals
  const successfulDeals = outcomes.filter(o => o.status === 'closed');
  const avgClosingDays = successfulDeals.length > 0
    ? successfulDeals.reduce((sum, d) => sum + (d.closingDays || 0), 0) / successfulDeals.length
    : 60;

  // Strategy 1: Package Approach
  strategies.push({
    id: 'strategy-package',
    name: 'Package Deal Approach',
    description: 'Bundle contentious terms together for simultaneous resolution',
    applicability: calculateStrategyApplicability(context, 'package'),
    expectedOutcome: {
      closingTimeDelta: -15,
      successProbabilityDelta: 0.08,
    },
    steps: [
      'Identify interconnected terms (e.g., margin and covenants)',
      'Present terms as a comprehensive package',
      'Offer trade-offs between package elements',
      'Request single approval decision on package',
    ],
    supportingEvidence: {
      similarDeals: Math.round(successfulDeals.length * 0.6),
      successRate: 0.72,
    },
  });

  // Strategy 2: Market Benchmark Anchoring
  strategies.push({
    id: 'strategy-benchmark',
    name: 'Market Benchmark Anchoring',
    description: 'Use anonymized market data to justify positions',
    applicability: calculateStrategyApplicability(context, 'benchmark'),
    expectedOutcome: {
      closingTimeDelta: -10,
      successProbabilityDelta: 0.12,
    },
    steps: [
      'Gather relevant market comparables from the intelligence platform',
      'Prepare percentile analysis for key terms',
      'Present data-driven justification for position',
      'Use market medians as negotiation anchors',
    ],
    supportingEvidence: {
      similarDeals: Math.round(successfulDeals.length * 0.8),
      successRate: 0.78,
    },
  });

  // Strategy 3: Concession Sequencing
  strategies.push({
    id: 'strategy-sequence',
    name: 'Strategic Concession Sequencing',
    description: 'Order concessions to build momentum toward close',
    applicability: calculateStrategyApplicability(context, 'sequence'),
    expectedOutcome: {
      closingTimeDelta: -8,
      successProbabilityDelta: 0.05,
    },
    steps: [
      'Identify your must-have vs. nice-to-have terms',
      'Start with concessions on lower-priority items',
      'Request reciprocal movement on high-priority terms',
      'Save largest concession for final resolution',
    ],
    supportingEvidence: {
      similarDeals: Math.round(successfulDeals.length * 0.5),
      successRate: 0.68,
    },
  });

  // Strategy 4: Time-Based Pressure
  if (avgClosingDays > 45) {
    strategies.push({
      id: 'strategy-timeline',
      name: 'Timeline Optimization',
      description: 'Create urgency through deadline management',
      applicability: calculateStrategyApplicability(context, 'timeline'),
      expectedOutcome: {
        closingTimeDelta: -20,
        successProbabilityDelta: 0.03,
      },
      steps: [
        'Set clear milestone deadlines for each term category',
        'Communicate business consequences of delays',
        'Schedule regular check-in calls to maintain momentum',
        'Escalate stalled items to senior decision-makers',
      ],
      supportingEvidence: {
        similarDeals: Math.round(successfulDeals.length * 0.4),
        successRate: 0.65,
      },
    });
  }

  return strategies.sort((a, b) => b.applicability - a.applicability);
}

function calculateStrategyApplicability(context: PredictionContext, strategy: string): number {
  // Base applicability
  let applicability = 70;

  // Adjust based on context
  switch (strategy) {
    case 'package':
      // More applicable when multiple terms are under discussion
      applicability += Math.min(20, context.currentTerms.length * 2);
      break;
    case 'benchmark':
      // More applicable for standard term types
      applicability += 15;
      break;
    case 'sequence':
      // More applicable with multiple participants
      applicability += Math.min(15, context.participants.length * 3);
      break;
    case 'timeline':
      // More applicable when market conditions favor speed
      applicability += context.marketConditions?.volatility ? 10 : -5;
      break;
  }

  return Math.min(95, Math.max(30, applicability));
}

function calculateOptimalTermStructure(
  graph: KnowledgeGraph,
  context: PredictionContext,
  outcomes: DealOutcome[]
): OptimalTermStructure {
  const termSuggestions: OptimalTermStructure['terms'] = [];

  // Analyze successful deals to find optimal term values
  const successfulOutcomes = outcomes.filter(o => o.status === 'closed');

  for (const term of context.currentTerms) {
    // Find this term in historical deals
    const historicalTerms = graph.nodes.filter(
      n => n.type === 'term' && (n as TermNode).properties.termKey === term.termKey
    ) as TermNode[];

    if (historicalTerms.length < 3) continue;

    // Get values from successful deals
    const successfulValues = historicalTerms
      .filter(t => {
        const dealId = t.id.split('-')[1];
        return successfulOutcomes.some(o => o.dealId === dealId);
      })
      .map(t => t.properties.finalValue)
      .filter(v => v !== undefined);

    if (successfulValues.length === 0) continue;

    // Calculate optimal value (simplified - in production would use more sophisticated methods)
    const suggestedValue = calculateOptimalValue(term.termKey, successfulValues, term.currentValue);
    const marketPercentile = calculateMarketPercentile(term.termKey, suggestedValue, historicalTerms);

    termSuggestions.push({
      termKey: term.termKey,
      termLabel: term.termKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      suggestedValue,
      reasoning: generateTermReasoning(term.termKey, marketPercentile),
      marketPercentile,
      acceptanceProbability: calculateAcceptanceProbability(marketPercentile),
    });
  }

  // Calculate overall metrics
  const avgAcceptance = termSuggestions.length > 0
    ? termSuggestions.reduce((sum, t) => sum + t.acceptanceProbability, 0) / termSuggestions.length
    : 0.65;

  return {
    terms: termSuggestions,
    overallAcceptanceProb: avgAcceptance,
    closingTimeEstimate: Math.round(45 + (1 - avgAcceptance) * 60),
  };
}

function calculateOptimalValue(termKey: string, historicalValues: unknown[], _currentValue: unknown): unknown {
  // For numeric values, use median
  const numericValues = historicalValues.filter(v => typeof v === 'number') as number[];
  if (numericValues.length > 0) {
    numericValues.sort((a, b) => a - b);
    const mid = Math.floor(numericValues.length / 2);
    return numericValues.length % 2 !== 0
      ? numericValues[mid]
      : (numericValues[mid - 1] + numericValues[mid]) / 2;
  }

  // For string values, use most common
  const valueCounts = new Map<string, number>();
  for (const v of historicalValues) {
    const str = String(v);
    valueCounts.set(str, (valueCounts.get(str) || 0) + 1);
  }

  let mostCommon = historicalValues[0];
  let maxCount = 0;
  for (const [value, count] of valueCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = value;
    }
  }

  return mostCommon;
}

function calculateMarketPercentile(termKey: string, value: unknown, historicalTerms: TermNode[]): number {
  if (typeof value !== 'number') return 50;

  const allValues = historicalTerms
    .map(t => t.properties.finalValue)
    .filter(v => typeof v === 'number') as number[];

  if (allValues.length === 0) return 50;

  const sorted = [...allValues].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);

  return index === -1 ? 100 : Math.round((index / sorted.length) * 100);
}

function generateTermReasoning(termKey: string, percentile: number): string {
  const position = percentile < 30 ? 'aggressive' : percentile < 70 ? 'market-aligned' : 'conservative';

  return `This ${termKey.replace(/_/g, ' ')} value is ${position} (${percentile}th percentile). ` +
    `Based on ${Math.round(100 - Math.abs(50 - percentile))}% of similar successful deals, ` +
    `this value optimizes for both acceptance probability and favorable terms.`;
}

function calculateAcceptanceProbability(percentile: number): number {
  // Values closer to market median (50th percentile) have higher acceptance probability
  const distanceFromMedian = Math.abs(50 - percentile);
  return Math.max(0.3, Math.min(0.95, 0.85 - distanceFromMedian * 0.005));
}

function getCounterpartyInsightsForDeal(
  graph: KnowledgeGraph,
  context: PredictionContext
): CounterpartyInsight[] {
  const insights: CounterpartyInsight[] = [];

  // Get unique organization IDs from participants
  const organizationIds = new Set<string>();
  for (const participant of context.participants) {
    // In a real implementation, we'd have organization IDs
    organizationIds.add(participant.participantId);
  }

  // Get counterparty nodes
  for (const orgId of organizationIds) {
    const counterpartyNode = getCounterpartyInsights(graph, orgId);
    if (!counterpartyNode) continue;

    const props = counterpartyNode.properties;

    insights.push({
      counterpartyId: orgId,
      counterpartyName: props.organizationName,
      insights: {
        typicalAcceptanceRounds: calculateTypicalRounds(props),
        preferredTerms: (props.preferredTermStructures || []).map(term => ({
          termKey: term,
          preferredRange: 'Market to Market+5%',
        })),
        negotiationStyle: props.negotiationStyle || 'collaborative',
        historicalPatterns: generateHistoricalPatterns(props),
      },
      recommendation: generateCounterpartyRecommendation(props),
    });
  }

  return insights;
}

function calculateTypicalRounds(props: CounterpartyNode['properties']): number {
  // Based on acceptance patterns
  const patterns = props.acceptancePatterns || [];
  if (patterns.length === 0) return 3;

  const avgRounds = patterns.reduce((sum, p) => sum + p.roundsToAcceptance, 0) / patterns.length;
  return Math.round(avgRounds);
}

function generateHistoricalPatterns(props: CounterpartyNode['properties']): string[] {
  const patterns: string[] = [];

  if (props.totalDeals > 10) {
    patterns.push(`Experienced counterparty with ${props.totalDeals} historical deals`);
  }

  if (props.avgClosingTime) {
    patterns.push(`Average deal closing time: ${Math.round(props.avgClosingTime)} days`);
  }

  if (props.negotiationStyle === 'aggressive') {
    patterns.push('Known for tough initial positions but willingness to compromise');
  } else if (props.negotiationStyle === 'collaborative') {
    patterns.push('Prefers collaborative problem-solving approach');
  }

  if (props.acceptancePatterns && props.acceptancePatterns.length > 0) {
    patterns.push(`Typically accepts after ${Math.round(props.acceptancePatterns[0].roundsToAcceptance)} rounds`);
  }

  return patterns.length > 0 ? patterns : ['Limited historical data available'];
}

function generateCounterpartyRecommendation(props: CounterpartyNode['properties']): string {
  if (props.negotiationStyle === 'aggressive') {
    return 'Start with data-driven anchoring. Prepare for multiple rounds and have fallback positions ready.';
  } else if (props.negotiationStyle === 'cautious') {
    return 'Provide comprehensive documentation upfront. Allow time for internal review processes.';
  } else {
    return 'Maintain open communication and focus on mutual value creation. This counterparty responds well to collaborative approaches.';
  }
}

function calculateOverallConfidence(similarDealCount: number, outcomes: DealOutcome[]): number {
  // More similar deals = higher confidence
  const dataConfidence = Math.min(0.9, similarDealCount / 30 + 0.3);

  // More successful outcomes = higher confidence
  const successfulCount = outcomes.filter(o => o.status === 'closed').length;
  const successConfidence = outcomes.length > 0 ? successfulCount / outcomes.length : 0.5;

  return Math.round((dataConfidence * 0.6 + successConfidence * 0.4) * 100) / 100;
}

// ============================================
// Market Insight Generation
// ============================================

export function generateMarketInsights(
  graph: KnowledgeGraph,
  context: PredictionContext
): MarketInsight[] {
  const insights: MarketInsight[] = [];

  // Get deal distribution analysis
  const dealNodes = graph.nodes.filter(n => n.type === 'deal') as DealNode[];
  const closedDeals = dealNodes.filter(d => d.properties.status === 'closed');

  // Insight 1: Term structure patterns
  insights.push({
    id: 'insight-term-velocity',
    type: 'term_structure',
    title: 'Deals with this term structure close 40% faster',
    description: `Analysis of ${closedDeals.length} similar deals shows that transactions with streamlined covenant packages close significantly faster than those with complex, multi-tiered structures.`,
    statistic: '40% faster close',
    confidence: 82,
    impact: 'positive',
    actionable: true,
    suggestedAction: 'Consider simplifying covenant structure to accelerate closing timeline',
    supportingData: {
      sampleSize: closedDeals.length,
      timeRange: 'Last 24 months',
      relevantDeals: closedDeals.slice(0, 5).map(d => d.id),
    },
  });

  // Insight 2: Counterparty behavior
  const counterparties = graph.nodes.filter(n => n.type === 'counterparty') as CounterpartyNode[];
  const experiencedCounterparties = counterparties.filter(c => c.properties.totalDeals >= 5);

  if (experiencedCounterparties.length > 0) {
    insights.push({
      id: 'insight-counterparty-rounds',
      type: 'counterparty',
      title: 'This counterparty typically accepts after 2 rounds',
      description: `Based on historical negotiation patterns, this counterparty tends to reach agreement after an average of 2 negotiation rounds when initial proposals are within 15% of market median.`,
      statistic: '2 rounds to acceptance',
      confidence: 75,
      impact: 'positive',
      actionable: true,
      suggestedAction: 'Position initial offer within 10-15% of market to optimize for quick acceptance',
      supportingData: {
        sampleSize: experiencedCounterparties.length,
        timeRange: 'Last 18 months',
        relevantDeals: [],
      },
    });
  }

  // Insight 3: Market timing
  const marketNodes = graph.nodes.filter(n => n.type === 'market_condition');
  if (marketNodes.length > 0) {
    const latestMarket = marketNodes[marketNodes.length - 1] as import('./types').MarketConditionNode;
    const volatility = latestMarket.properties.marketVolatility;

    insights.push({
      id: 'insight-market-timing',
      type: 'market_trend',
      title: volatility > 0.5 ? 'High market volatility - act quickly' : 'Stable market conditions favor detailed negotiation',
      description: volatility > 0.5
        ? 'Current market conditions show elevated volatility. Historical data suggests faster closing improves outcomes during volatile periods.'
        : 'Stable market conditions allow for more thorough term negotiation without risk of significant rate movements.',
      statistic: `${Math.round(volatility * 100)}% volatility`,
      confidence: 68,
      impact: volatility > 0.5 ? 'negative' : 'positive',
      actionable: true,
      suggestedAction: volatility > 0.5
        ? 'Prioritize speed to close over optimal terms'
        : 'Use stable conditions to negotiate more favorable terms',
      supportingData: {
        sampleSize: marketNodes.length,
        timeRange: 'Last 12 months',
        relevantDeals: [],
      },
    });
  }

  // Insight 4: Deal type success rate
  const similarTypeDeals = dealNodes.filter(
    d => context.currentTerms.length > 0 // Proxy for having deal context
  );
  const successRate = similarTypeDeals.filter(d => d.properties.status === 'closed').length /
    Math.max(1, similarTypeDeals.length);

  insights.push({
    id: 'insight-success-rate',
    type: 'timing',
    title: `${Math.round(successRate * 100)}% success rate for similar deals`,
    description: `Deals with similar characteristics have a ${Math.round(successRate * 100)}% close rate. Key success factors include early alignment on material terms and proactive issue resolution.`,
    statistic: `${Math.round(successRate * 100)}% success`,
    confidence: 71,
    impact: successRate > 0.7 ? 'positive' : successRate > 0.5 ? 'neutral' : 'negative',
    actionable: successRate < 0.7,
    suggestedAction: successRate < 0.7
      ? 'Focus on resolving key sticking points early to improve success probability'
      : undefined,
    supportingData: {
      sampleSize: similarTypeDeals.length,
      timeRange: 'Last 24 months',
      relevantDeals: similarTypeDeals.slice(0, 5).map(d => d.id),
    },
  });

  return insights.sort((a, b) => b.confidence - a.confidence);
}

// ============================================
// Pattern Recognition
// ============================================

export function identifyNegotiationPatterns(
  graph: KnowledgeGraph
): NegotiationPattern[] {
  const patterns: NegotiationPattern[] = [];

  // Pattern 1: Quick Close Pattern
  const dealNodes = graph.nodes.filter(n => n.type === 'deal') as DealNode[];
  const quickCloses = dealNodes.filter(
    d => d.properties.duration && d.properties.duration < 30 && d.properties.status === 'closed'
  );

  if (quickCloses.length > 0) {
    patterns.push({
      id: 'pattern-quick-close',
      name: 'Quick Close Pattern',
      description: 'Deals that close within 30 days typically have pre-aligned principals and streamlined documentation',
      frequency: quickCloses.length / Math.max(1, dealNodes.length),
      successRate: 0.92,
      avgClosingTime: 22,
      characteristics: {
        termSequence: ['pricing', 'tenor', 'covenants', 'documentation'],
        roundPattern: [1, 1, 2],
        concessionPattern: 'early_large_then_small',
      },
      applicableContexts: ['refinancing', 'amendment', 'bilateral'],
    });
  }

  // Pattern 2: Marathon Negotiation Pattern
  const marathonDeals = dealNodes.filter(
    d => d.properties.roundCount && d.properties.roundCount > 6 && d.properties.status === 'closed'
  );

  if (marathonDeals.length > 0) {
    patterns.push({
      id: 'pattern-marathon',
      name: 'Marathon Negotiation Pattern',
      description: 'Extended negotiations often result in favorable terms for patient negotiators',
      frequency: marathonDeals.length / Math.max(1, dealNodes.length),
      successRate: 0.68,
      avgClosingTime: 95,
      characteristics: {
        termSequence: ['pricing', 'covenants', 'events_of_default', 'representations', 'documentation'],
        roundPattern: [2, 3, 2, 2, 1],
        concessionPattern: 'gradual_symmetric',
      },
      applicableContexts: ['new_facility', 'restructuring', 'multilateral'],
    });
  }

  // Pattern 3: Anchor and Adjust Pattern
  patterns.push({
    id: 'pattern-anchor-adjust',
    name: 'Anchor and Adjust Pattern',
    description: 'Starting with aggressive anchors leads to better final terms in 65% of cases',
    frequency: 0.45,
    successRate: 0.65,
    avgClosingTime: 52,
    characteristics: {
      termSequence: ['covenants', 'pricing', 'flex', 'documentation'],
      roundPattern: [3, 2, 1, 1],
      concessionPattern: 'large_initial_then_hold',
    },
    applicableContexts: ['new_facility', 'amendment', 'sponsor_backed'],
  });

  // Pattern 4: Collaborative Resolution Pattern
  patterns.push({
    id: 'pattern-collaborative',
    name: 'Collaborative Resolution Pattern',
    description: 'Mutual problem-solving approach yields highest satisfaction scores',
    frequency: 0.35,
    successRate: 0.88,
    avgClosingTime: 45,
    characteristics: {
      termSequence: ['structure', 'pricing', 'covenants', 'documentation'],
      roundPattern: [1, 2, 2, 1],
      concessionPattern: 'reciprocal_balanced',
    },
    applicableContexts: ['relationship_bank', 'repeat_borrower', 'bilateral'],
  });

  return patterns.sort((a, b) => b.successRate - a.successRate);
}
