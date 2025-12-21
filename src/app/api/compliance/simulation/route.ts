import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateStructuredOutput } from '@/lib/llm';
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
  const { params, context } = body as { params: unknown[]; context: string };

  try {
    // Use LLM to generate insights about the scenario
    const systemPrompt = `You are a financial analyst specializing in loan covenant analysis and stress testing.
Analyze the given stress scenario parameters and provide:
1. Key risk factors to monitor
2. Likely cascade effects
3. Recommended mitigation strategies

Be specific and actionable in your recommendations.`;

    const userPrompt = `Analyze this stress scenario for a loan portfolio:

Scenario Parameters:
${JSON.stringify(params, null, 2)}

Portfolio Context:
${context}

Provide your analysis with specific insights and recommendations.

IMPORTANT: Respond ONLY with a valid JSON object containing these fields:
- key_risks: array of strings describing key risk factors to monitor
- cascade_effects: array of strings describing potential cascade effects
- recommendations: array of strings with mitigation recommendations
- severity_assessment: string with overall severity assessment`;

    const analysis = await generateStructuredOutput<{
      key_risks: string[];
      cascade_effects: string[];
      recommendations: string[];
      severity_assessment: string;
    }>(
      systemPrompt,
      userPrompt
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing scenario:', error);
    // Fallback to basic analysis
    return NextResponse.json({
      success: true,
      data: {
        key_risks: ['Interest rate exposure', 'EBITDA sensitivity', 'Cross-default triggers'],
        cascade_effects: ['Potential rating downgrades', 'Increased monitoring requirements'],
        recommendations: ['Review covenant headroom', 'Engage borrower proactively', 'Update stress testing models'],
        severity_assessment: 'Moderate - requires monitoring',
      },
    });
  }
}
