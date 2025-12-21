import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createKnowledgeGraph,
  type HistoricalDealData,
} from '@/app/features/deals/predictive-intelligence/lib/graph-engine';
import {
  generateDealPrediction,
  generateMarketInsights,
  identifyNegotiationPatterns,
  type PredictionContext,
} from '@/app/features/deals/predictive-intelligence/lib/prediction-engine';
import {
  mockDealPrediction,
  mockMarketInsights,
  mockNegotiationPatterns,
  mockGraphVisualization,
  mockDashboardData,
  mockHistoricalDeals,
} from '@/app/features/deals/predictive-intelligence/lib/mock-data';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/deals/[id]/predictive-intelligence
 *
 * Returns comprehensive predictive intelligence for a deal including:
 * - Success probability and timeline estimates
 * - Likely sticking points
 * - Recommended negotiation strategies
 * - Optimal term structure
 * - Counterparty insights
 * - Similar deal comparisons
 * - Market insights
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: dealId } = await context.params;

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Fetch deal details
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      // For development, return mock data if deal not found
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          data: {
            dealId,
            dealName: 'Demo Deal',
            prediction: mockDealPrediction,
            insights: mockMarketInsights,
            patterns: mockNegotiationPatterns,
            graphVisualization: mockGraphVisualization,
            historicalComparisons: mockDashboardData.historicalComparisons,
          },
        });
      }

      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } },
        { status: 404 }
      );
    }

    // Type assertion for deal data
    const dealData = deal as {
      id: string;
      organization_id: string;
      deal_name: string;
      [key: string]: unknown;
    };

    // Fetch deal terms
    const { data: termsData } = await supabase
      .from('negotiation_terms')
      .select('*')
      .eq('deal_id', dealId);

    // Type assertion for terms
    const terms = (termsData || []) as Array<{
      id: string;
      term_key: string;
      current_value: unknown;
      negotiation_status: string;
    }>;

    // Fetch deal participants
    const { data: participantsData } = await supabase
      .from('deal_participants')
      .select('*')
      .eq('deal_id', dealId)
      .eq('status', 'active');

    // Type assertion for participants
    const participants = (participantsData || []) as Array<{
      id: string;
      deal_role: string;
      party_type: string;
    }>;

    // In production, fetch historical deals for graph building
    // For now, use mock historical data
    const historicalDeals: HistoricalDealData[] = mockHistoricalDeals;

    // Build knowledge graph
    const graph = createKnowledgeGraph(dealData.organization_id, historicalDeals);

    // Create prediction context
    const predictionContext: PredictionContext = {
      dealId,
      currentTerms: terms.map((t) => ({
        termId: t.id,
        termKey: t.term_key,
        currentValue: t.current_value,
        status: t.negotiation_status,
      })),
      participants: participants.map((p) => ({
        participantId: p.id,
        role: p.deal_role,
        partyType: p.party_type,
      })),
      marketConditions: {
        avgMargin: 2.5,
        volatility: 0.35,
      },
    };

    // Generate predictions
    const prediction = generateDealPrediction(graph, predictionContext);

    // Generate market insights
    const insights = generateMarketInsights(graph, predictionContext);

    // Identify negotiation patterns
    const patterns = identifyNegotiationPatterns(graph);

    // Transform graph for visualization
    const graphVisualization = transformGraphForVisualization(graph, dealId);

    // Get similar deals comparison
    const historicalComparisons = getHistoricalComparisons(graph, dealId, historicalDeals);

    return NextResponse.json({
      success: true,
      data: {
        dealId,
        dealName: dealData.deal_name,
        prediction,
        insights,
        patterns,
        graphVisualization,
        historicalComparisons,
      },
    });
  } catch (error) {
    console.error('Error generating predictive intelligence:', error);

    // Return mock data in development on error
    if (process.env.NODE_ENV === 'development') {
      const { id: dealId } = await context.params;
      return NextResponse.json({
        success: true,
        data: {
          dealId,
          dealName: 'Demo Deal (Fallback)',
          prediction: mockDealPrediction,
          insights: mockMarketInsights,
          patterns: mockNegotiationPatterns,
          graphVisualization: mockGraphVisualization,
          historicalComparisons: mockDashboardData.historicalComparisons,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate predictive intelligence',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deals/[id]/predictive-intelligence
 *
 * Regenerates predictions with updated parameters or context.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: dealId } = await context.params;
    const body = await request.json();

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Extract custom parameters
    const {
      includeAllHistoricalDeals = false,
      priorityTerms = [],
      scenarioOverrides = {},
    } = body;

    // In production, this would regenerate predictions with custom parameters
    // For now, return mock data with modifications

    const prediction = {
      ...mockDealPrediction,
      dealId,
      timestamp: new Date().toISOString(),
    };

    // Apply scenario overrides if provided
    if (scenarioOverrides.closingProbabilityAdjustment) {
      prediction.predictions.closingProbability = Math.max(
        0,
        Math.min(
          1,
          prediction.predictions.closingProbability +
            scenarioOverrides.closingProbabilityAdjustment
        )
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        dealId,
        prediction,
        regeneratedAt: new Date().toISOString(),
        parameters: {
          includeAllHistoricalDeals,
          priorityTerms,
          scenarioOverrides,
        },
      },
    });
  } catch (error) {
    console.error('Error regenerating predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to regenerate predictions',
        },
      },
      { status: 500 }
    );
  }
}

// Helper functions

function transformGraphForVisualization(
  graph: ReturnType<typeof createKnowledgeGraph>,
  currentDealId: string
) {
  const nodeTypeColors: Record<string, string> = {
    deal: '#3b82f6',
    term: '#ec4899',
    participant: '#f59e0b',
    counterparty: '#8b5cf6',
    market_condition: '#6366f1',
    outcome: '#10b981',
  };

  // Limit nodes for visualization
  const relevantNodes = graph.nodes.slice(0, 50);
  const nodeIds = new Set(relevantNodes.map((n) => n.id));
  const relevantEdges = graph.edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  return {
    nodes: relevantNodes.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      size: node.id === `deal-${currentDealId}` ? 30 : 15 + (node.importance || 0) * 20,
      color: nodeTypeColors[node.type] || '#94a3b8',
    })),
    edges: relevantEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
      color: '#94a3b8',
    })),
    layout: 'force' as const,
  };
}

function getHistoricalComparisons(
  _graph: ReturnType<typeof createKnowledgeGraph>,
  _dealId: string,
  historicalDeals: HistoricalDealData[]
) {
  // Get top similar deals
  const similarDeals = historicalDeals
    .filter((d) => d.status === 'closed' || d.status === 'terminated')
    .slice(0, 5)
    .map((d, i) => ({
      dealId: d.id,
      dealName: d.dealName,
      similarity: 0.85 - i * 0.08,
      outcome: d.status,
      closingDays: d.closedAt
        ? Math.ceil(
            (new Date(d.closedAt).getTime() - new Date(d.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    }));

  // Calculate average metrics
  const closedDeals = similarDeals.filter((d) => d.outcome === 'closed');
  const avgMetrics = {
    closingDays:
      closedDeals.length > 0
        ? Math.round(
            closedDeals.reduce((sum, d) => sum + d.closingDays, 0) / closedDeals.length
          )
        : 45,
    rounds: 4,
    successRate: closedDeals.length / similarDeals.length,
  };

  return { similarDeals, avgMetrics };
}
