import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  stressTestTemplates,
  savedScenarios,
  simulationResults,
  simulationDashboardStats,
} from '@/app/features/compliance/sub_SimulationSandbox/lib';

// =============================================================================
// Validation Schemas
// =============================================================================

const scenarioTypeSchema = z.enum([
  'rate_change',
  'ebitda_fluctuation',
  'ma_event',
  'industry_downturn',
  'custom',
]);

const severitySchema = z.enum(['mild', 'moderate', 'severe', 'extreme']);

const baseScenarioParamsSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: scenarioTypeSchema,
  severity: severitySchema,
  time_horizon_quarters: z.number().int().min(1).max(12),
});

const rateChangeParamsSchema = baseScenarioParamsSchema.extend({
  type: z.literal('rate_change'),
  basis_points_change: z.number(),
  change_type: z.enum(['immediate', 'gradual']),
  ramp_quarters: z.number().int().optional(),
});

const ebitdaFluctuationParamsSchema = baseScenarioParamsSchema.extend({
  type: z.literal('ebitda_fluctuation'),
  ebitda_change_percentage: z.number(),
  impact_duration: z.enum(['permanent', 'temporary']),
  recovery_quarters: z.number().int().optional(),
  affected_quarters: z.array(z.number()).optional(),
});

const scenarioParamsSchema = z.discriminatedUnion('type', [
  rateChangeParamsSchema,
  ebitdaFluctuationParamsSchema,
  baseScenarioParamsSchema.extend({ type: z.literal('ma_event') }),
  baseScenarioParamsSchema.extend({ type: z.literal('industry_downturn') }),
  baseScenarioParamsSchema.extend({ type: z.literal('custom') }),
]);

const monteCarloConfigSchema = z.object({
  iterations: z.number().int().min(100).max(100000),
  confidence_levels: z.array(z.number().min(0).max(1)),
  random_seed: z.number().int().optional(),
  variables: z.array(z.object({
    id: z.string(),
    name: z.string(),
    base_value: z.number(),
    distribution: z.enum(['normal', 'uniform', 'triangular', 'lognormal']),
    std_dev: z.number().optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    mode_value: z.number().optional(),
    correlations: z.record(z.string(), z.number()).optional(),
  })),
});

const createScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  params: z.array(scenarioParamsSchema),
  monte_carlo_config: monteCarloConfigSchema.optional(),
  selected_covenant_ids: z.array(z.string()),
  selected_facility_ids: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  is_shared: z.boolean().optional(),
  collaborators: z.array(z.string()).optional(),
});

const runSimulationSchema = z.object({
  scenario_id: z.string().optional(),
  params: z.array(scenarioParamsSchema).optional(),
  monte_carlo_config: monteCarloConfigSchema.optional(),
  selected_covenant_ids: z.array(z.string()).optional(),
  selected_facility_ids: z.array(z.string()).optional(),
});

// =============================================================================
// GET - List scenarios, templates, or results
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'dashboard';

    switch (type) {
      case 'dashboard':
        return NextResponse.json({
          success: true,
          data: {
            stats: simulationDashboardStats,
            recentScenarios: savedScenarios.slice(0, 5),
            templates: stressTestTemplates.slice(0, 4),
          },
        });

      case 'templates':
        const tag = searchParams.get('tag');
        const filteredTemplates = tag
          ? stressTestTemplates.filter(t => t.tags.includes(tag))
          : stressTestTemplates;
        return NextResponse.json({
          success: true,
          data: filteredTemplates,
        });

      case 'scenarios':
        const status = searchParams.get('status');
        const filteredScenarios = status && status !== 'all'
          ? savedScenarios.filter(s => s.status === status)
          : savedScenarios;
        return NextResponse.json({
          success: true,
          data: filteredScenarios,
        });

      case 'results':
        const scenarioId = searchParams.get('scenario_id');
        const results = scenarioId
          ? simulationResults.filter(r => r.scenario_id === scenarioId)
          : simulationResults;
        return NextResponse.json({
          success: true,
          data: results,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching simulation data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch simulation data' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create scenario or run simulation
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'run';
    const body = await request.json();

    switch (action) {
      case 'create':
        return handleCreateScenario(body);

      case 'run':
        return handleRunSimulation(body);

      case 'analyze':
        return handleAnalyzeScenario(body);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing simulation request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Handler Functions
// =============================================================================

async function handleCreateScenario(body: unknown) {
  const parsed = createScenarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid scenario data', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const newScenario = {
    id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: data.name,
    description: data.description ?? '',
    version: 1,
    created_by: 'current.user@example.com', // Would come from auth
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    status: 'draft' as const,
    params: data.params,
    monte_carlo_config: data.monte_carlo_config,
    selected_covenant_ids: data.selected_covenant_ids,
    selected_facility_ids: data.selected_facility_ids,
    tags: data.tags ?? [],
    is_shared: data.is_shared ?? false,
    collaborators: data.collaborators ?? [],
  };

  // In production, save to database
  return NextResponse.json({
    success: true,
    data: newScenario,
  });
}

async function handleRunSimulation(body: unknown) {
  const parsed = runSimulationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid simulation parameters', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const startTime = performance.now();

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));

  // For demo, return mock results
  // In production, this would run the actual simulation engine
  const mockResult = simulationResults[0];
  const runtime = Math.round(performance.now() - startTime);

  return NextResponse.json({
    success: true,
    data: {
      ...mockResult,
      id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      run_at: new Date().toISOString(),
      runtime_ms: runtime,
      scenario_id: data.scenario_id,
    },
  });
}

async function handleAnalyzeScenario(body: unknown) {
  const { params } = body as { params: unknown[]; context: string };

  // Mock analysis responses based on scenario type
  const mockAnalyses: Record<string, {
    key_risks: string[];
    cascade_effects: string[];
    recommendations: string[];
    severity_assessment: string;
  }> = {
    rate_change: {
      key_risks: [
        'Interest rate exposure on floating rate facilities',
        'EBITDA sensitivity to increased debt service costs',
        'Cash flow adequacy for covenant compliance',
        'Cross-default triggers from margin compression',
      ],
      cascade_effects: [
        'Potential rating downgrades across correlated borrowers',
        'Increased monitoring requirements for watchlist facilities',
        'Repricing pressure on new deal pipeline',
        'Lender appetite reduction for sector',
      ],
      recommendations: [
        'Review interest coverage headroom for all affected facilities',
        'Engage borrowers proactively on hedging strategies',
        'Update pricing models to reflect higher rate environment',
        'Consider covenant reset negotiations where headroom <15%',
      ],
      severity_assessment: 'High - immediate action required for 3 facilities',
    },
    ebitda_fluctuation: {
      key_risks: [
        'Leverage ratio breaches across manufacturing sector',
        'EBITDA decline impact on debt service coverage',
        'Asset coverage deterioration on secured facilities',
        'Working capital strain affecting liquidity ratios',
      ],
      cascade_effects: [
        'Multiple covenant test failures in Q2/Q3',
        'Waiver request volume increase by 40%',
        'Portfolio risk rating migration to watchlist',
        'Syndicate relationship strain from amendment fatigue',
      ],
      recommendations: [
        'Prioritize borrower engagement for top 5 at-risk facilities',
        'Prepare waiver documentation templates in advance',
        'Model covenant reset scenarios with borrowers',
        'Increase financial reporting frequency to monthly',
      ],
      severity_assessment: 'Critical - 5 facilities projected to breach within 2 quarters',
    },
    ma_event: {
      key_risks: [
        'Change of control trigger provisions',
        'Mandatory prepayment obligations',
        'Assignment consent requirements',
        'Post-merger integration execution risk',
      ],
      cascade_effects: [
        'Cash sweep to retiring facilities',
        'Syndicate voting delays on consents',
        'Documentation renegotiation requirements',
        'Rating agency review and potential downgrade',
      ],
      recommendations: [
        'Review change of control definitions across all facilities',
        'Map mandatory prepayment triggers and amounts',
        'Prepare consent solicitation materials',
        'Engage legal counsel for documentation review',
      ],
      severity_assessment: 'Moderate - dependent on transaction structure',
    },
    industry_downturn: {
      key_risks: [
        'Sector-wide revenue decline impact',
        'Collateral value deterioration',
        'Counterparty credit risk concentration',
        'Market liquidity constraints for secondary trades',
      ],
      cascade_effects: [
        'Portfolio-wide covenant pressure',
        'Increased provision requirements',
        'Regulatory scrutiny on concentration',
        'Limited workout capacity from volume',
      ],
      recommendations: [
        'Conduct sector-specific portfolio review',
        'Update collateral valuations and monitoring',
        'Diversification analysis for new commitments',
        'Enhance early warning indicators for sector',
      ],
      severity_assessment: 'High - systemic sector risk requires portfolio-level response',
    },
    custom: {
      key_risks: [
        'Scenario-specific risk factors identified',
        'Cross-portfolio correlation effects',
        'Timing and magnitude uncertainty',
        'Model assumption sensitivity',
      ],
      cascade_effects: [
        'Downstream covenant test impacts',
        'Interconnected borrower effects',
        'Market sentiment contagion',
        'Operational capacity constraints',
      ],
      recommendations: [
        'Validate scenario assumptions with market data',
        'Run sensitivity analysis on key variables',
        'Prepare contingency plans for adverse outcomes',
        'Document analysis for audit trail',
      ],
      severity_assessment: 'Moderate - requires further analysis based on specific parameters',
    },
  };

  // Determine scenario type from params
  let scenarioType = 'custom';
  if (Array.isArray(params) && params.length > 0) {
    const firstParam = params[0] as { type?: string };
    if (firstParam.type && mockAnalyses[firstParam.type]) {
      scenarioType = firstParam.type;
    }
  }

  return NextResponse.json({
    success: true,
    data: mockAnalyses[scenarioType],
  });
}
