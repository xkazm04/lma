/**
 * Knowledge Graph Engine
 *
 * Builds and manages the knowledge graph connecting deals, terms,
 * participants, market conditions, and outcomes.
 */

import type {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  DealNode,
  TermNode,
  ParticipantNode,
  CounterpartyNode,
  MarketConditionNode,
  OutcomeNode,
  GraphCluster,
  GraphStatistics,
  GraphNodeType,
  GraphEdgeType,
  GNNEmbedding,
} from './types';

// ============================================
// Graph Construction
// ============================================

export function createKnowledgeGraph(
  organizationId: string,
  historicalDeals: HistoricalDealData[]
): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();
  const counterpartyMap = new Map<string, CounterpartyNode>();

  // Process each deal to build the graph
  for (const deal of historicalDeals) {
    // Create deal node
    const dealNode = createDealNode(deal);
    nodes.push(dealNode);
    nodeMap.set(dealNode.id, dealNode);

    // Create term nodes and edges
    for (const term of deal.terms) {
      const termNode = createTermNode(term, deal.id);
      if (!nodeMap.has(termNode.id)) {
        nodes.push(termNode);
        nodeMap.set(termNode.id, termNode);
      }
      edges.push(createEdge(dealNode.id, termNode.id, 'contains', 1.0));
    }

    // Create participant nodes and edges
    for (const participant of deal.participants) {
      const participantNode = createParticipantNode(participant);
      if (!nodeMap.has(participantNode.id)) {
        nodes.push(participantNode);
        nodeMap.set(participantNode.id, participantNode);
      }
      edges.push(createEdge(participantNode.id, dealNode.id, 'participated_in', 1.0));

      // Track counterparty relationships
      if (participant.organizationId) {
        let counterparty = counterpartyMap.get(participant.organizationId);
        if (!counterparty) {
          counterparty = createCounterpartyNode(participant);
          counterpartyMap.set(participant.organizationId, counterparty);
        } else {
          updateCounterpartyStats(counterparty, deal);
        }
      }
    }

    // Create outcome node if deal is closed
    if (deal.status === 'closed' || deal.status === 'terminated') {
      const outcomeNode = createOutcomeNode(deal);
      nodes.push(outcomeNode);
      nodeMap.set(outcomeNode.id, outcomeNode);
      edges.push(createEdge(dealNode.id, outcomeNode.id, 'resulted_in', 1.0));
    }

    // Create market condition node
    if (deal.marketConditions) {
      const marketNode = createMarketConditionNode(deal.marketConditions, deal.createdAt);
      if (!nodeMap.has(marketNode.id)) {
        nodes.push(marketNode);
        nodeMap.set(marketNode.id, marketNode);
      }
      edges.push(createEdge(dealNode.id, marketNode.id, 'influenced_by', 0.8));
    }
  }

  // Add counterparty nodes
  for (const counterparty of counterpartyMap.values()) {
    nodes.push(counterparty);
  }

  // Create similarity edges between deals
  const similarityEdges = computeDealSimilarities(
    nodes.filter((n): n is DealNode => n.type === 'deal')
  );
  edges.push(...similarityEdges);

  // Create negotiation edges between counterparties
  const negotiationEdges = computeCounterpartyRelationships(
    historicalDeals,
    counterpartyMap
  );
  edges.push(...negotiationEdges);

  // Compute clusters and statistics
  const clusters = computeClusters(nodes, edges);
  const statistics = computeGraphStatistics(nodes, edges);

  return {
    id: `kg-${organizationId}-${Date.now()}`,
    organizationId,
    nodes,
    edges,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      clusters,
      statistics,
    },
  };
}

// ============================================
// Node Creation Functions
// ============================================

function createDealNode(deal: HistoricalDealData): DealNode {
  const duration = deal.closedAt
    ? Math.ceil((new Date(deal.closedAt).getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  return {
    id: `deal-${deal.id}`,
    type: 'deal',
    label: deal.dealName,
    properties: {
      dealName: deal.dealName,
      dealType: deal.dealType,
      status: deal.status,
      closedAt: deal.closedAt,
      totalValue: deal.totalValue,
      duration,
      roundCount: deal.negotiationRounds,
      successScore: deal.successScore,
      industry: deal.industry,
      borrowerProfile: deal.borrowerProfile,
    },
  };
}

function createTermNode(term: HistoricalTermData, dealId: string): TermNode {
  return {
    id: `term-${dealId}-${term.termKey}`,
    type: 'term',
    label: term.termLabel,
    properties: {
      termKey: term.termKey,
      termLabel: term.termLabel,
      valueType: term.valueType,
      finalValue: term.finalValue,
      initialValue: term.initialValue,
      negotiationRounds: term.negotiationRounds,
      wasContentious: term.wasContentious,
      category: term.category,
    },
  };
}

function createParticipantNode(participant: HistoricalParticipantData): ParticipantNode {
  return {
    id: `participant-${participant.id}`,
    type: 'participant',
    label: participant.partyName,
    properties: {
      partyName: participant.partyName,
      partyType: participant.partyType,
      dealRole: participant.dealRole,
      organizationId: participant.organizationId,
      totalDeals: 1,
      avgNegotiationTime: undefined,
      acceptanceRate: undefined,
    },
  };
}

function createCounterpartyNode(participant: HistoricalParticipantData): CounterpartyNode {
  return {
    id: `counterparty-${participant.organizationId}`,
    type: 'counterparty',
    label: participant.partyName,
    properties: {
      organizationName: participant.partyName,
      totalDeals: 1,
      avgClosingTime: undefined,
      acceptancePatterns: [],
      preferredTermStructures: [],
      negotiationStyle: 'collaborative',
    },
  };
}

function createMarketConditionNode(
  conditions: MarketConditions,
  timestamp: string
): MarketConditionNode {
  const monthKey = timestamp.slice(0, 7); // YYYY-MM
  return {
    id: `market-${monthKey}`,
    type: 'market_condition',
    label: `Market ${monthKey}`,
    properties: {
      timestamp,
      avgMargin: conditions.avgMargin,
      avgLeverage: conditions.avgLeverage,
      marketVolatility: conditions.marketVolatility,
      dealVolume: conditions.dealVolume,
      economicIndicator: conditions.economicIndicator,
    },
  };
}

function createOutcomeNode(deal: HistoricalDealData): OutcomeNode {
  const closingTime = deal.closedAt
    ? Math.ceil((new Date(deal.closedAt).getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  return {
    id: `outcome-${deal.id}`,
    type: 'outcome',
    label: `Outcome: ${deal.status}`,
    properties: {
      dealId: deal.id,
      outcomeType: deal.status === 'closed' ? 'closed' : 'terminated',
      closingTime,
      finalMargin: deal.finalMargin,
      counterpartyAcceptance: deal.status === 'closed',
      postClosingPerformance: deal.postClosingScore,
    },
  };
}

function createEdge(
  source: string,
  target: string,
  type: GraphEdgeType,
  weight: number,
  properties?: Record<string, unknown>
): GraphEdge {
  return {
    id: `edge-${source}-${target}-${type}`,
    source,
    target,
    type,
    weight,
    properties,
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// Graph Analysis Functions
// ============================================

function updateCounterpartyStats(
  counterparty: CounterpartyNode,
  deal: HistoricalDealData
): void {
  counterparty.properties.totalDeals += 1;

  // Update average closing time
  if (deal.closedAt) {
    const closingDays = Math.ceil(
      (new Date(deal.closedAt).getTime() - new Date(deal.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (counterparty.properties.avgClosingTime) {
      counterparty.properties.avgClosingTime =
        (counterparty.properties.avgClosingTime * (counterparty.properties.totalDeals - 1) +
          closingDays) /
        counterparty.properties.totalDeals;
    } else {
      counterparty.properties.avgClosingTime = closingDays;
    }
  }
}

function computeDealSimilarities(deals: DealNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const SIMILARITY_THRESHOLD = 0.6;

  for (let i = 0; i < deals.length; i++) {
    for (let j = i + 1; j < deals.length; j++) {
      const similarity = computeDealSimilarity(deals[i], deals[j]);
      if (similarity >= SIMILARITY_THRESHOLD) {
        edges.push(createEdge(deals[i].id, deals[j].id, 'similar_to', similarity));
      }
    }
  }

  return edges;
}

function computeDealSimilarity(deal1: DealNode, deal2: DealNode): number {
  let score = 0;
  let factors = 0;

  // Same deal type
  if (deal1.properties.dealType === deal2.properties.dealType) {
    score += 0.3;
  }
  factors += 0.3;

  // Same industry
  if (deal1.properties.industry === deal2.properties.industry) {
    score += 0.25;
  }
  factors += 0.25;

  // Same borrower profile
  if (deal1.properties.borrowerProfile === deal2.properties.borrowerProfile) {
    score += 0.25;
  }
  factors += 0.25;

  // Similar total value (within 30%)
  if (deal1.properties.totalValue && deal2.properties.totalValue) {
    const ratio = Math.min(deal1.properties.totalValue, deal2.properties.totalValue) /
      Math.max(deal1.properties.totalValue, deal2.properties.totalValue);
    if (ratio >= 0.7) {
      score += 0.2 * ratio;
    }
  }
  factors += 0.2;

  return score / factors;
}

function computeCounterpartyRelationships(
  deals: HistoricalDealData[],
  counterpartyMap: Map<string, CounterpartyNode>
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const relationshipMap = new Map<string, {
    dealCount: number;
    totalRounds: number;
    successCount: number;
    totalDays: number;
    stickingPoints: string[];
  }>();

  for (const deal of deals) {
    const counterparties = deal.participants
      .filter((p) => p.organizationId)
      .map((p) => p.organizationId!);

    // Track relationships between counterparties on the same deal
    for (let i = 0; i < counterparties.length; i++) {
      for (let j = i + 1; j < counterparties.length; j++) {
        const key = [counterparties[i], counterparties[j]].sort().join('-');
        let rel = relationshipMap.get(key);
        if (!rel) {
          rel = {
            dealCount: 0,
            totalRounds: 0,
            successCount: 0,
            totalDays: 0,
            stickingPoints: [],
          };
          relationshipMap.set(key, rel);
        }

        rel.dealCount++;
        rel.totalRounds += deal.negotiationRounds || 0;
        if (deal.status === 'closed') {
          rel.successCount++;
          if (deal.closedAt) {
            rel.totalDays += Math.ceil(
              (new Date(deal.closedAt).getTime() - new Date(deal.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
          }
        }
        rel.stickingPoints.push(...(deal.stickingPoints || []));
      }
    }
  }

  // Create edges from relationships
  for (const [key, rel] of relationshipMap.entries()) {
    const [org1, org2] = key.split('-');
    if (counterpartyMap.has(org1) && counterpartyMap.has(org2)) {
      edges.push({
        id: `negotiation-${org1}-${org2}`,
        source: `counterparty-${org1}`,
        target: `counterparty-${org2}`,
        type: 'negotiated_with',
        weight: rel.dealCount / deals.length,
        properties: {
          dealCount: rel.dealCount,
          avgNegotiationRounds: rel.totalRounds / rel.dealCount,
          successRate: rel.successCount / rel.dealCount,
          avgClosingDays: rel.successCount > 0 ? rel.totalDays / rel.successCount : 0,
          commonStickingPoints: [...new Set(rel.stickingPoints)].slice(0, 5),
        },
      });
    }
  }

  return edges;
}

function computeClusters(nodes: GraphNode[], edges: GraphEdge[]): GraphCluster[] {
  // Simple clustering based on node type and properties
  const clusters: GraphCluster[] = [];

  // Cluster deals by type and outcome
  const dealNodes = nodes.filter((n): n is DealNode => n.type === 'deal');
  const dealClusters = new Map<string, DealNode[]>();

  for (const deal of dealNodes) {
    const clusterKey = `${deal.properties.dealType}-${deal.properties.status}`;
    if (!dealClusters.has(clusterKey)) {
      dealClusters.set(clusterKey, []);
    }
    dealClusters.get(clusterKey)!.push(deal);
  }

  for (const [key, clusterDeals] of dealClusters.entries()) {
    const [dealType, status] = key.split('-');
    clusters.push({
      id: `cluster-${key}`,
      label: `${dealType} - ${status}`,
      nodeIds: clusterDeals.map((d) => d.id),
      characteristics: [
        `Deal Type: ${dealType}`,
        `Status: ${status}`,
        `Count: ${clusterDeals.length}`,
      ],
    });
  }

  return clusters;
}

function computeGraphStatistics(nodes: GraphNode[], edges: GraphEdge[]): GraphStatistics {
  // Compute degree for each node
  const degreeMap = new Map<string, number>();
  for (const node of nodes) {
    degreeMap.set(node.id, 0);
  }
  for (const edge of edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  }

  const degrees = Array.from(degreeMap.values());
  const avgDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length;

  // Graph density
  const maxEdges = (nodes.length * (nodes.length - 1)) / 2;
  const density = maxEdges > 0 ? edges.length / maxEdges : 0;

  // Top central nodes (by degree)
  const topCentralNodes = Array.from(degreeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nodeId, degree]) => ({
      nodeId,
      score: degree / (nodes.length - 1),
    }));

  return {
    avgDegree,
    density,
    clusteringCoefficient: computeClusteringCoefficient(nodes, edges, degreeMap),
    avgPathLength: 2.5, // Simplified - would need BFS for accurate calculation
    topCentralNodes,
  };
}

function computeClusteringCoefficient(
  nodes: GraphNode[],
  edges: GraphEdge[],
  degreeMap: Map<string, number>
): number {
  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  let totalCoeff = 0;
  let validNodes = 0;

  for (const node of nodes) {
    const neighbors = adjacency.get(node.id) || new Set();
    const k = neighbors.size;
    if (k < 2) continue;

    let triangles = 0;
    const neighborArray = Array.from(neighbors);
    for (let i = 0; i < neighborArray.length; i++) {
      for (let j = i + 1; j < neighborArray.length; j++) {
        if (adjacency.get(neighborArray[i])?.has(neighborArray[j])) {
          triangles++;
        }
      }
    }

    const maxTriangles = (k * (k - 1)) / 2;
    totalCoeff += triangles / maxTriangles;
    validNodes++;
  }

  return validNodes > 0 ? totalCoeff / validNodes : 0;
}

// ============================================
// Graph Query Functions
// ============================================

export function findSimilarDeals(
  graph: KnowledgeGraph,
  dealId: string,
  limit: number = 10
): { dealId: string; similarity: number }[] {
  const dealNodeId = `deal-${dealId}`;
  const similarDeals: { dealId: string; similarity: number }[] = [];

  for (const edge of graph.edges) {
    if (edge.type === 'similar_to') {
      if (edge.source === dealNodeId) {
        similarDeals.push({
          dealId: edge.target.replace('deal-', ''),
          similarity: edge.weight,
        });
      } else if (edge.target === dealNodeId) {
        similarDeals.push({
          dealId: edge.source.replace('deal-', ''),
          similarity: edge.weight,
        });
      }
    }
  }

  return similarDeals.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

export function getCounterpartyInsights(
  graph: KnowledgeGraph,
  counterpartyId: string
): CounterpartyNode | undefined {
  return graph.nodes.find(
    (n): n is CounterpartyNode =>
      n.type === 'counterparty' && n.id === `counterparty-${counterpartyId}`
  );
}

export function getRelatedNodes(
  graph: KnowledgeGraph,
  nodeId: string,
  depth: number = 1
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const visited = new Set<string>();
  const relatedNodes: GraphNode[] = [];
  const relatedEdges: GraphEdge[] = [];

  function traverse(currentId: string, currentDepth: number) {
    if (currentDepth > depth || visited.has(currentId)) return;
    visited.add(currentId);

    const node = graph.nodes.find((n) => n.id === currentId);
    if (node) relatedNodes.push(node);

    for (const edge of graph.edges) {
      if (edge.source === currentId && !visited.has(edge.target)) {
        relatedEdges.push(edge);
        traverse(edge.target, currentDepth + 1);
      } else if (edge.target === currentId && !visited.has(edge.source)) {
        relatedEdges.push(edge);
        traverse(edge.source, currentDepth + 1);
      }
    }
  }

  traverse(nodeId, 0);
  return { nodes: relatedNodes, edges: relatedEdges };
}

// ============================================
// Helper Types for Graph Construction
// ============================================

export interface HistoricalDealData {
  id: string;
  dealName: string;
  dealType: string;
  status: string;
  createdAt: string;
  closedAt?: string;
  totalValue?: number;
  finalMargin?: number;
  negotiationRounds?: number;
  successScore?: number;
  postClosingScore?: number;
  industry?: string;
  borrowerProfile?: string;
  stickingPoints?: string[];
  terms: HistoricalTermData[];
  participants: HistoricalParticipantData[];
  marketConditions?: MarketConditions;
}

export interface HistoricalTermData {
  termKey: string;
  termLabel: string;
  valueType: string;
  finalValue?: unknown;
  initialValue?: unknown;
  negotiationRounds?: number;
  wasContentious?: boolean;
  category?: string;
}

export interface HistoricalParticipantData {
  id: string;
  partyName: string;
  partyType: string;
  dealRole: string;
  organizationId?: string;
}

export interface MarketConditions {
  avgMargin: number;
  avgLeverage: number;
  marketVolatility: number;
  dealVolume: number;
  economicIndicator?: string;
}
