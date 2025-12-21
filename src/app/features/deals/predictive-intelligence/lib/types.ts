/**
 * Predictive Deal Intelligence - Knowledge Graph Types
 *
 * This module defines the data structures for building a knowledge graph
 * connecting deals, terms, participants, market conditions, and outcomes.
 */

// ============================================
// Graph Node Types
// ============================================

export type GraphNodeType =
  | 'deal'
  | 'term'
  | 'participant'
  | 'counterparty'
  | 'market_condition'
  | 'outcome'
  | 'term_structure'
  | 'negotiation_pattern';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  properties: Record<string, unknown>;
  embedding?: number[]; // Vector embedding for GNN
  cluster?: string;
  importance?: number; // Node centrality score
}

export interface DealNode extends GraphNode {
  type: 'deal';
  properties: {
    dealName: string;
    dealType: string;
    status: string;
    closedAt?: string;
    totalValue?: number;
    duration?: number; // Days from start to close
    roundCount?: number;
    successScore?: number;
    industry?: string;
    borrowerProfile?: string;
  };
}

export interface TermNode extends GraphNode {
  type: 'term';
  properties: {
    termKey: string;
    termLabel: string;
    valueType: string;
    finalValue?: unknown;
    initialValue?: unknown;
    negotiationRounds?: number;
    wasContentious?: boolean;
    category?: string;
  };
}

export interface ParticipantNode extends GraphNode {
  type: 'participant';
  properties: {
    partyName: string;
    partyType: string;
    dealRole: string;
    organizationId?: string;
    totalDeals?: number;
    avgNegotiationTime?: number;
    acceptanceRate?: number;
  };
}

export interface CounterpartyNode extends GraphNode {
  type: 'counterparty';
  properties: {
    organizationName: string;
    totalDeals: number;
    avgClosingTime?: number;
    acceptancePatterns?: AcceptancePattern[];
    preferredTermStructures?: string[];
    negotiationStyle?: 'aggressive' | 'collaborative' | 'cautious';
  };
}

export interface MarketConditionNode extends GraphNode {
  type: 'market_condition';
  properties: {
    timestamp: string;
    avgMargin: number;
    avgLeverage: number;
    marketVolatility: number;
    dealVolume: number;
    economicIndicator?: string;
  };
}

export interface OutcomeNode extends GraphNode {
  type: 'outcome';
  properties: {
    dealId: string;
    outcomeType: 'closed' | 'terminated' | 'paused' | 'restructured';
    closingTime?: number; // Days
    finalMargin?: number;
    counterpartyAcceptance?: boolean;
    postClosingPerformance?: number; // 0-100 score
  };
}

// ============================================
// Graph Edge Types
// ============================================

export type GraphEdgeType =
  | 'contains' // Deal -> Term
  | 'participated_in' // Participant -> Deal
  | 'negotiated_with' // Counterparty -> Counterparty
  | 'influenced_by' // Deal -> Market Condition
  | 'resulted_in' // Deal -> Outcome
  | 'similar_to' // Deal -> Deal, Term -> Term
  | 'depends_on' // Term -> Term
  | 'leads_to' // Negotiation Pattern -> Outcome
  | 'prefers'; // Counterparty -> Term Structure

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  weight: number;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

export interface NegotiationEdge extends GraphEdge {
  type: 'negotiated_with';
  properties: {
    dealCount: number;
    avgNegotiationRounds: number;
    successRate: number;
    avgClosingDays: number;
    commonStickingPoints: string[];
  };
}

// ============================================
// Knowledge Graph Structure
// ============================================

export interface KnowledgeGraph {
  id: string;
  organizationId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    nodeCount: number;
    edgeCount: number;
    clusters: GraphCluster[];
    statistics: GraphStatistics;
  };
}

export interface GraphCluster {
  id: string;
  label: string;
  nodeIds: string[];
  centroidEmbedding?: number[];
  characteristics: string[];
}

export interface GraphStatistics {
  avgDegree: number;
  density: number;
  clusteringCoefficient: number;
  avgPathLength: number;
  topCentralNodes: { nodeId: string; score: number }[];
}

// ============================================
// Prediction Types
// ============================================

export interface DealPrediction {
  dealId: string;
  timestamp: string;
  predictions: {
    closingProbability: number;
    estimatedClosingDays: number;
    estimatedRounds: number;
    likelyStickingPoints: StickingPointPrediction[];
    recommendedStrategies: NegotiationStrategy[];
    optimalTermStructure: OptimalTermStructure;
    counterpartyInsights: CounterpartyInsight[];
  };
  confidence: number;
  modelVersion: string;
}

export interface StickingPointPrediction {
  termId: string;
  termLabel: string;
  probability: number;
  reason: string;
  suggestedApproach: string;
  historicalResolution: {
    avgRoundsToResolve: number;
    commonCompromises: string[];
  };
}

export interface NegotiationStrategy {
  id: string;
  name: string;
  description: string;
  applicability: number; // 0-100
  expectedOutcome: {
    closingTimeDelta: number; // Days saved/added
    successProbabilityDelta: number;
  };
  steps: string[];
  supportingEvidence: {
    similarDeals: number;
    successRate: number;
  };
}

export interface OptimalTermStructure {
  terms: {
    termKey: string;
    termLabel: string;
    suggestedValue: unknown;
    reasoning: string;
    marketPercentile: number;
    acceptanceProbability: number;
  }[];
  overallAcceptanceProb: number;
  closingTimeEstimate: number;
}

export interface CounterpartyInsight {
  counterpartyId: string;
  counterpartyName: string;
  insights: {
    typicalAcceptanceRounds: number;
    preferredTerms: { termKey: string; preferredRange: string }[];
    negotiationStyle: string;
    historicalPatterns: string[];
  };
  recommendation: string;
}

// ============================================
// Pattern Recognition Types
// ============================================

export interface NegotiationPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  successRate: number;
  avgClosingTime: number;
  characteristics: {
    termSequence: string[];
    roundPattern: number[];
    concessionPattern: string;
  };
  applicableContexts: string[];
}

export interface AcceptancePattern {
  termCategory: string;
  initialPosition: string;
  typicalConcession: number; // Percentage
  roundsToAcceptance: number;
  conditions: string[];
}

export interface MarketInsight {
  id: string;
  type: 'term_structure' | 'timing' | 'counterparty' | 'market_trend';
  title: string;
  description: string;
  statistic: string;
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  actionable: boolean;
  suggestedAction?: string;
  supportingData: {
    sampleSize: number;
    timeRange: string;
    relevantDeals: string[];
  };
}

// ============================================
// Graph Neural Network Types
// ============================================

export interface GNNModelConfig {
  embeddingDim: number;
  hiddenDim: number;
  numLayers: number;
  dropout: number;
  aggregationType: 'mean' | 'attention' | 'sum';
}

export interface GNNPredictionInput {
  dealId: string;
  currentTerms: {
    termId: string;
    currentValue: unknown;
    status: string;
  }[];
  participants: {
    participantId: string;
    role: string;
  }[];
  marketConditions: {
    avgMargin: number;
    marketVolatility: number;
  };
}

export interface GNNEmbedding {
  nodeId: string;
  nodeType: GraphNodeType;
  embedding: number[];
  similarNodes: { nodeId: string; similarity: number }[];
}

// ============================================
// Historical Analysis Types
// ============================================

export interface HistoricalDealAnalysis {
  dealId: string;
  summary: {
    totalDuration: number;
    negotiationRounds: number;
    termsNegotiated: number;
    stickingPoints: string[];
    finalOutcome: string;
  };
  timeline: {
    date: string;
    event: string;
    impact: string;
  }[];
  learnings: string[];
}

export interface AggregatedPatterns {
  byTermType: Record<string, {
    avgNegotiationRounds: number;
    acceptanceRate: number;
    commonValues: { value: string; frequency: number }[];
  }>;
  byCounterparty: Record<string, {
    avgClosingDays: number;
    preferredTerms: string[];
    negotiationStyle: string;
  }>;
  byMarketCondition: {
    lowVolatility: { avgMargin: number; avgClosingDays: number };
    highVolatility: { avgMargin: number; avgClosingDays: number };
  };
}

// ============================================
// Dashboard and Display Types
// ============================================

export interface PredictiveIntelligenceDashboardData {
  dealId: string;
  dealName: string;
  prediction: DealPrediction;
  graphSnapshot: {
    relevantNodes: GraphNode[];
    relevantEdges: GraphEdge[];
    clusters: GraphCluster[];
  };
  insights: MarketInsight[];
  patterns: NegotiationPattern[];
  historicalComparisons: {
    similarDeals: {
      dealId: string;
      dealName: string;
      similarity: number;
      outcome: string;
      closingDays: number;
    }[];
    avgMetrics: {
      closingDays: number;
      rounds: number;
      successRate: number;
    };
  };
}

export interface GraphVisualizationData {
  nodes: {
    id: string;
    label: string;
    type: GraphNodeType;
    size: number;
    color: string;
    x?: number;
    y?: number;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label?: string;
    weight: number;
    color?: string;
  }[];
  layout: 'force' | 'circular' | 'hierarchical';
}
