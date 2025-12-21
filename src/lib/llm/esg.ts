import { generateStructuredOutput, withLLMFallback } from './client';
import type {
  ESGAIQueryResult,
  KPIDefinitionAssistance,
  GeneratedESGReport,
} from '@/types';
import type {
  KPIPrediction,
  FacilityPrediction,
  WhatIfScenario,
  Intervention,
  MarginImpactPrediction,
  RecommendedAction,
  PredictionSummary,
  PortfolioPrediction,
  KPICategory,
  ESGLoanType,
  RiskLevel,
  PeerPositioning,
  PerformanceTrend,
  KPIPercentileRanking,
  KPITrajectoryComparison,
  FacilityPeerRanking,
  PeerBenchmarkInsights,
} from '@/app/features/esg/lib/types';

// ============================================
// ESG Q&A - Answer questions about ESG performance
// ============================================

interface ESGQuestionContext {
  question: string;
  facility_context: {
    facility_name: string;
    borrower_name: string;
    esg_loan_type: string;
    framework_reference?: string;
  };
  kpi_context?: Array<{
    kpi_name: string;
    category: string;
    current_value?: number;
    target_value?: number;
    unit: string;
    performance_status?: string;
  }>;
  performance_history?: Array<{
    period: string;
    kpi_name: string;
    value: number;
    target: number;
    achieved: boolean;
  }>;
  allocation_context?: Array<{
    category_name: string;
    allocated_amount: number;
    eligible_amount: number;
    percentage: number;
  }>;
}

const ESG_QUESTION_SYSTEM_PROMPT = `You are an ESG sustainability finance expert specializing in sustainability-linked loans (SLLs), green loans, and ESG performance tracking.

Provide specific, actionable guidance aligned with LMA Sustainability Linked Loan Principles and Green Loan Principles.

Always respond with valid JSON matching the expected schema.`;

/**
 * Answer ESG-related questions using context from facilities, KPIs, and performance data
 */
export async function answerESGQuestion(
  context: ESGQuestionContext
): Promise<ESGAIQueryResult> {
  const facilityContext = `
FACILITY: ${context.facility_context.facility_name}
BORROWER: ${context.facility_context.borrower_name}
ESG LOAN TYPE: ${context.facility_context.esg_loan_type}
${context.facility_context.framework_reference ? `FRAMEWORK: ${context.facility_context.framework_reference}` : ''}`;

  const kpiContext = context.kpi_context?.length
    ? `\n\nKPI SUMMARY:
${context.kpi_context.map((k) => `- ${k.kpi_name} (${k.category}): ${k.current_value ?? 'N/A'} ${k.unit} vs target ${k.target_value ?? 'N/A'} ${k.unit} [${k.performance_status || 'pending'}]`).join('\n')}`
    : '';

  const performanceContext = context.performance_history?.length
    ? `\n\nPERFORMANCE HISTORY:
${context.performance_history.map((p) => `- ${p.period}: ${p.kpi_name} = ${p.value} (target: ${p.target}) - ${p.achieved ? 'ACHIEVED' : 'MISSED'}`).join('\n')}`
    : '';

  const allocationContext = context.allocation_context?.length
    ? `\n\nUSE OF PROCEEDS:
${context.allocation_context.map((a) => `- ${a.category_name}: ${a.allocated_amount.toLocaleString()} / ${a.eligible_amount.toLocaleString()} (${a.percentage.toFixed(1)}%)`).join('\n')}`
    : '';

  const userPrompt = `Answer the following question:

QUESTION: ${context.question}

CONTEXT:${facilityContext}${kpiContext}${performanceContext}${allocationContext}

Respond in JSON format:
{
  "question": "the original question",
  "answer": "detailed, accurate answer based on available context and ESG best practices",
  "sources": [
    {
      "type": "kpi_data" | "performance_data" | "allocation_data" | "framework" | "external",
      "reference": "specific reference",
      "excerpt": "relevant data point if applicable"
    }
  ],
  "confidence": number between 0 and 1,
  "suggested_actions": ["recommended actions if any"],
  "related_kpis": [
    {
      "kpi_name": "KPI name",
      "relevance": "why this KPI is relevant to the question"
    }
  ]
}`;

  return withLLMFallback(
    () => generateStructuredOutput<ESGAIQueryResult>(
      ESG_QUESTION_SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 2000 }
    ),
    context,
    {
      operation: 'answerESGQuestion',
      fallbackFactory: (ctx) => ({
        query_type: 'methodology' as const,
        question: ctx.question,
        answer: 'Unable to process the question. Please consult your ESG advisor or review the facility documentation.',
        sources: [],
        confidence: 0,
        suggested_actions: ['Manual review required'],
      }),
    }
  );
}

// ============================================
// KPI Definition Assistance
// ============================================

interface KPIDefinitionContext {
  borrower_name: string;
  borrower_industry: string;
  esg_loan_type: string;
  existing_kpis?: string[];
  sustainability_goals?: string[];
  materiality_focus?: string[];
}

const KPI_DEFINITION_SYSTEM_PROMPT = `You are an ESG sustainability finance expert. Help define appropriate KPIs for sustainability-linked loans.

Focus on material, ambitious, and measurable KPIs that are core to the borrower's business and aligned with established frameworks like LMA/APLMA Sustainability Linked Loan Principles and Green Loan Principles.

Always respond with valid JSON matching the expected schema.`;

/**
 * Assist with defining appropriate KPIs based on industry and loan type
 */
export async function assistKPIDefinition(
  context: KPIDefinitionContext
): Promise<KPIDefinitionAssistance> {
  const existingKpis = context.existing_kpis?.length
    ? `\n\nEXISTING KPIs: ${context.existing_kpis.join(', ')}`
    : '';

  const goals = context.sustainability_goals?.length
    ? `\n\nSTATED SUSTAINABILITY GOALS: ${context.sustainability_goals.join(', ')}`
    : '';

  const materiality = context.materiality_focus?.length
    ? `\n\nMATERIALITY FOCUS AREAS: ${context.materiality_focus.join(', ')}`
    : '';

  const userPrompt = `Help define appropriate KPIs for a sustainability-linked loan:

BORROWER: ${context.borrower_name}
INDUSTRY: ${context.borrower_industry}
LOAN TYPE: ${context.esg_loan_type}${existingKpis}${goals}${materiality}

Respond in JSON format:
{
  "recommended_kpis": [
    {
      "kpi_name": "specific, measurable KPI name",
      "category": "environmental_emissions" | "environmental_energy" | "environmental_water" | "environmental_waste" | "environmental_biodiversity" | "social_workforce" | "social_health_safety" | "social_community" | "social_supply_chain" | "governance_board" | "governance_ethics" | "governance_risk",
      "description": "what this KPI measures",
      "measurement_methodology": "how to measure and verify this KPI",
      "suggested_unit": "unit of measurement",
      "industry_benchmark": "typical industry benchmark or range if available",
      "ambition_level": "recommended ambition level for target setting",
      "verification_approach": "how verification would typically work",
      "data_sources": ["where to get the data"],
      "relevance_score": number 1-10,
      "rationale": "why this KPI is appropriate for this borrower"
    }
  ],
  "framework_alignment": {
    "llp_principles": "alignment with LMA Sustainability Linked Loan Principles",
    "glp_principles": "alignment with Green Loan Principles if applicable",
    "sdg_alignment": ["relevant UN SDGs"],
    "eu_taxonomy_alignment": "alignment with EU Taxonomy if applicable"
  },
  "implementation_guidance": {
    "baseline_period": "recommended baseline period",
    "reporting_frequency": "recommended reporting frequency",
    "verification_requirements": "verification requirements",
    "escalation_path": "what to do if targets are missed"
  },
  "risks_and_considerations": [
    {
      "risk": "potential risk or challenge",
      "mitigation": "how to mitigate"
    }
  ]
}`;

  return withLLMFallback(
    () => generateStructuredOutput<KPIDefinitionAssistance>(
      KPI_DEFINITION_SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 2500 }
    ),
    context,
    {
      operation: 'assistKPIDefinition',
      fallbackFactory: () => ({
        kpi_name: 'Suggested KPI',
        suggested_category: 'other',
        suggested_unit: 'N/A',
        measurement_guidance: 'Consult ESG advisor for measurement methodology',
        boundary_recommendations: 'Define boundaries in credit agreement',
        baseline_considerations: 'Establish baseline period with lender',
        verification_requirements: 'Third-party verification recommended',
        common_targets: [],
        framework_alignment: [
          { framework: 'LMA/APLMA', alignment_notes: 'Unable to assess - manual review required' },
        ],
      }),
    }
  );
}

// ============================================
// ESG Report Generation
// ============================================

interface ESGReportContext {
  facility: {
    facility_name: string;
    borrower_name: string;
    esg_loan_type: string;
    commitment_amount: number;
    framework_reference?: string;
  };
  report_type: 'annual' | 'quarterly' | 'impact' | 'verification' | 'allocation';
  reporting_period: {
    start_date: string;
    end_date: string;
  };
  kpi_performance: Array<{
    kpi_name: string;
    category: string;
    baseline_value: number;
    target_value: number;
    actual_value: number;
    unit: string;
    achieved: boolean;
    verification_status: string;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  allocations?: Array<{
    category_name: string;
    allocated_amount: number;
    project_count: number;
    impact_metrics?: Record<string, number>;
  }>;
  ratings?: Array<{
    provider: string;
    rating: string;
    rating_date: string;
    outlook?: string;
  }>;
  margin_adjustments?: Array<{
    kpi_name: string;
    adjustment_bps: number;
    effective_date: string;
  }>;
}

const ESG_REPORT_SYSTEM_PROMPT = `You are an ESG sustainability reporting expert. Generate narrative sections for ESG reports.

Write professionally, suitable for lender reporting. Be specific about achievements and honest about challenges.

Always respond with valid JSON matching the expected schema.`;

/**
 * Generate narrative sections for ESG reports
 */
export async function generateESGReport(
  context: ESGReportContext
): Promise<GeneratedESGReport> {
  const kpiSummary = context.kpi_performance
    .map((k) => {
      const achievement = k.achieved ? 'ACHIEVED' : 'MISSED';
      const change = ((k.actual_value - k.baseline_value) / k.baseline_value * 100).toFixed(1);
      return `- ${k.kpi_name}: ${k.actual_value} ${k.unit} (target: ${k.target_value}, baseline: ${k.baseline_value}) - ${achievement} [${change}% from baseline, trend: ${k.trend}]`;
    })
    .join('\n');

  const allocationSummary = context.allocations?.length
    ? `\n\nUSE OF PROCEEDS:
${context.allocations.map((a) => `- ${a.category_name}: ${a.allocated_amount.toLocaleString()} across ${a.project_count} projects`).join('\n')}`
    : '';

  const ratingsSummary = context.ratings?.length
    ? `\n\nESG RATINGS:
${context.ratings.map((r) => `- ${r.provider}: ${r.rating} (${r.rating_date})${r.outlook ? ` - Outlook: ${r.outlook}` : ''}`).join('\n')}`
    : '';

  const marginSummary = context.margin_adjustments?.length
    ? `\n\nMARGIN ADJUSTMENTS:
${context.margin_adjustments.map((m) => `- ${m.kpi_name}: ${m.adjustment_bps > 0 ? '+' : ''}${m.adjustment_bps}bps from ${m.effective_date}`).join('\n')}`
    : '';

  const userPrompt = `Generate narrative sections for a ${context.report_type} ESG report:

FACILITY: ${context.facility.facility_name}
BORROWER: ${context.facility.borrower_name}
LOAN TYPE: ${context.facility.esg_loan_type}
COMMITMENT: ${context.facility.commitment_amount.toLocaleString()}
${context.facility.framework_reference ? `FRAMEWORK: ${context.facility.framework_reference}` : ''}

REPORTING PERIOD: ${context.reporting_period.start_date} to ${context.reporting_period.end_date}

KPI PERFORMANCE:
${kpiSummary}${allocationSummary}${ratingsSummary}${marginSummary}

Respond in JSON format:
{
  "executive_summary": "2-3 paragraph executive summary highlighting key achievements and challenges",
  "performance_narrative": {
    "environmental": "narrative on environmental KPI performance",
    "social": "narrative on social KPI performance if applicable",
    "governance": "narrative on governance KPI performance if applicable"
  },
  "target_analysis": {
    "achieved_targets": ["list of achieved targets with context"],
    "missed_targets": ["list of missed targets with explanation"],
    "near_misses": ["targets that were close"]
  },
  "trend_analysis": "analysis of performance trends over time",
  "impact_highlights": [
    {
      "metric": "specific impact metric",
      "value": "quantified value",
      "context": "explanation of significance"
    }
  ],
  "recommendations": [
    {
      "area": "area for improvement",
      "recommendation": "specific recommendation",
      "priority": "high" | "medium" | "low"
    }
  ],
  "outlook": "forward-looking statement on expected performance",
  "methodology_notes": "notes on measurement and verification methodology"
}`;

  return withLLMFallback(
    () => generateStructuredOutput<GeneratedESGReport>(
      ESG_REPORT_SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 3000 }
    ),
    context,
    {
      operation: 'generateESGReport',
      fallbackFactory: (ctx) => ({
        report_type: ctx.report_type,
        period_start: ctx.reporting_period.start_date,
        period_end: ctx.reporting_period.end_date,
        generated_at: new Date().toISOString(),
        sections: [
          {
            title: 'Executive Summary',
            content: 'Report generation requires manual preparation. Please consult the ESG performance data.',
          },
          {
            title: 'KPI Performance',
            content: 'See facility data for detailed KPI metrics.',
          },
        ],
        summary: {
          key_highlights: ['Report requires manual preparation'],
          areas_of_concern: ['Automated report generation failed'],
          recommendations: ['Prepare report manually with ESG team'],
        },
      }),
    }
  );
}

// ============================================
// Margin Adjustment Calculator
// ============================================

interface MarginCalculationContext {
  facility: {
    facility_name: string;
    base_margin_bps: number;
    max_adjustment_bps: number;
    adjustment_frequency: string;
  };
  kpi_results: Array<{
    kpi_name: string;
    target_value: number;
    actual_value: number;
    weight: number;
    higher_is_better: boolean;
    threshold_1?: number; // Partial achievement threshold
    threshold_2?: number; // Full achievement threshold
    adjustment_per_kpi_bps: number;
  }>;
  previous_adjustments?: Array<{
    period: string;
    adjustment_bps: number;
    cumulative_bps: number;
  }>;
}

interface MarginCalculationResult {
  kpi_assessments: Array<{
    kpi_name: string;
    achievement_level: 'exceeded' | 'met' | 'partial' | 'missed';
    achievement_percentage: number;
    adjustment_bps: number;
    rationale: string;
  }>;
  total_adjustment_bps: number;
  new_margin_bps: number;
  effective_date: string;
  calculation_methodology: string;
  caveats: string[];
}

const MARGIN_CALCULATION_SYSTEM_PROMPT = `You are a sustainability-linked loan specialist. Calculate margin adjustments based on KPI performance.

Apply standard SLL margin ratchet principles. Be precise with calculations.

Always respond with valid JSON matching the expected schema.`;

/**
 * Calculate margin adjustments based on KPI performance
 */
export async function calculateMarginAdjustment(
  context: MarginCalculationContext
): Promise<MarginCalculationResult> {
  const kpiDetails = context.kpi_results
    .map((k) => {
      const achievement = k.higher_is_better
        ? (k.actual_value / k.target_value * 100).toFixed(1)
        : (k.target_value / k.actual_value * 100).toFixed(1);
      return `- ${k.kpi_name}: actual ${k.actual_value} vs target ${k.target_value} (${achievement}% of target), weight: ${k.weight}%, max adjustment: ${k.adjustment_per_kpi_bps}bps`;
    })
    .join('\n');

  const historyContext = context.previous_adjustments?.length
    ? `\n\nPREVIOUS ADJUSTMENTS:
${context.previous_adjustments.map((a) => `- ${a.period}: ${a.adjustment_bps}bps (cumulative: ${a.cumulative_bps}bps)`).join('\n')}`
    : '';

  const userPrompt = `Calculate the margin adjustment based on KPI performance:

FACILITY: ${context.facility.facility_name}
BASE MARGIN: ${context.facility.base_margin_bps}bps
MAX ADJUSTMENT: +/- ${context.facility.max_adjustment_bps}bps
ADJUSTMENT FREQUENCY: ${context.facility.adjustment_frequency}

KPI RESULTS:
${kpiDetails}${historyContext}

Respond in JSON format:
{
  "kpi_assessments": [
    {
      "kpi_name": "KPI name",
      "achievement_level": "exceeded" | "met" | "partial" | "missed",
      "achievement_percentage": number,
      "adjustment_bps": number (positive for discount, negative for increase),
      "rationale": "explanation of calculation"
    }
  ],
  "total_adjustment_bps": number,
  "new_margin_bps": number,
  "effective_date": "when the new margin takes effect",
  "calculation_methodology": "description of calculation approach",
  "caveats": ["any caveats or notes about the calculation"]
}`;

  return withLLMFallback(
    () => generateStructuredOutput<MarginCalculationResult>(
      MARGIN_CALCULATION_SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 2000 }
    ),
    context,
    {
      operation: 'calculateMarginAdjustment',
      fallbackFactory: (ctx) => {
        // Fallback: simple calculation
        const assessments = ctx.kpi_results.map((k) => {
          const achievementPct = k.higher_is_better
            ? (k.actual_value / k.target_value) * 100
            : (k.target_value / k.actual_value) * 100;
          const met = achievementPct >= 100;
          return {
            kpi_name: k.kpi_name,
            achievement_level: met ? 'met' as const : 'missed' as const,
            achievement_percentage: achievementPct,
            adjustment_bps: met ? k.adjustment_per_kpi_bps : 0,
            rationale: met ? 'Target achieved' : 'Target not achieved',
          };
        });

        const totalAdj = assessments.reduce((sum, a) => sum + a.adjustment_bps, 0);

        return {
          kpi_assessments: assessments,
          total_adjustment_bps: Math.min(totalAdj, ctx.facility.max_adjustment_bps),
          new_margin_bps: ctx.facility.base_margin_bps - Math.min(totalAdj, ctx.facility.max_adjustment_bps),
          effective_date: 'Next interest period',
          calculation_methodology: 'Simple target achievement calculation (fallback)',
          caveats: ['Automated calculation - verify against credit agreement terms'],
        };
      },
    }
  );
}

// ============================================
// Gap Analysis
// ============================================

interface GapAnalysisContext {
  facility: {
    facility_name: string;
    borrower_name: string;
    esg_loan_type: string;
  };
  current_kpis: Array<{
    kpi_name: string;
    category: string;
    current_trajectory: number;
    target_value: number;
    target_date: string;
    unit: string;
  }>;
  reporting_status: {
    reports_submitted: number;
    reports_required: number;
    last_report_date?: string;
    verification_status: string;
  };
  allocation_status?: {
    total_allocated: number;
    total_commitment: number;
    unallocated_amount: number;
    lookback_period_end?: string;
  };
}

interface GapAnalysisResult {
  overall_status: 'on_track' | 'at_risk' | 'off_track';
  kpi_gaps: Array<{
    kpi_name: string;
    current_gap: number;
    gap_percentage: number;
    time_remaining: string;
    required_improvement_rate: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  }>;
  reporting_gaps: {
    status: 'compliant' | 'behind' | 'delinquent';
    missing_reports: number;
    next_deadline?: string;
    recommendations: string[];
  };
  allocation_gaps?: {
    status: 'fully_allocated' | 'partially_allocated' | 'under_allocated';
    gap_amount: number;
    gap_percentage: number;
    recommendations: string[];
  };
  priority_actions: Array<{
    action: string;
    urgency: 'immediate' | 'short_term' | 'medium_term';
    impact: 'high' | 'medium' | 'low';
  }>;
  timeline_to_compliance: string;
}

const GAP_ANALYSIS_SYSTEM_PROMPT = `You are an ESG compliance specialist. Perform gap analysis for ESG facilities.

Be specific about gaps and provide actionable recommendations.

Always respond with valid JSON matching the expected schema.`;

/**
 * Analyze gaps between current state and ESG requirements
 */
export async function performGapAnalysis(
  context: GapAnalysisContext
): Promise<GapAnalysisResult> {
  const kpiStatus = context.current_kpis
    .map((k) => {
      const gap = k.target_value - k.current_trajectory;
      const gapPct = (gap / k.target_value * 100).toFixed(1);
      return `- ${k.kpi_name}: current trajectory ${k.current_trajectory} ${k.unit}, target ${k.target_value} ${k.unit} by ${k.target_date} (gap: ${gap} ${k.unit}, ${gapPct}%)`;
    })
    .join('\n');

  const reportingStatus = `
REPORTING: ${context.reporting_status.reports_submitted}/${context.reporting_status.reports_required} reports submitted
Last Report: ${context.reporting_status.last_report_date || 'None'}
Verification: ${context.reporting_status.verification_status}`;

  const allocationStatus = context.allocation_status
    ? `\n\nALLOCATION:
Total Commitment: ${context.allocation_status.total_commitment.toLocaleString()}
Allocated: ${context.allocation_status.total_allocated.toLocaleString()}
Unallocated: ${context.allocation_status.unallocated_amount.toLocaleString()}
${context.allocation_status.lookback_period_end ? `Lookback Deadline: ${context.allocation_status.lookback_period_end}` : ''}`
    : '';

  const userPrompt = `Perform a gap analysis for this facility:

FACILITY: ${context.facility.facility_name}
BORROWER: ${context.facility.borrower_name}
LOAN TYPE: ${context.facility.esg_loan_type}

KPI STATUS:
${kpiStatus}
${reportingStatus}${allocationStatus}

Respond in JSON format:
{
  "overall_status": "on_track" | "at_risk" | "off_track",
  "kpi_gaps": [
    {
      "kpi_name": "KPI name",
      "current_gap": number,
      "gap_percentage": number,
      "time_remaining": "time until target date",
      "required_improvement_rate": "rate of improvement needed",
      "risk_level": "low" | "medium" | "high" | "critical",
      "recommendations": ["specific recommendations"]
    }
  ],
  "reporting_gaps": {
    "status": "compliant" | "behind" | "delinquent",
    "missing_reports": number,
    "next_deadline": "date if applicable",
    "recommendations": ["recommendations"]
  },
  "allocation_gaps": {
    "status": "fully_allocated" | "partially_allocated" | "under_allocated",
    "gap_amount": number,
    "gap_percentage": number,
    "recommendations": ["recommendations"]
  },
  "priority_actions": [
    {
      "action": "specific action",
      "urgency": "immediate" | "short_term" | "medium_term",
      "impact": "high" | "medium" | "low"
    }
  ],
  "timeline_to_compliance": "estimated timeline to close all gaps"
}`;

  return withLLMFallback(
    () => generateStructuredOutput<GapAnalysisResult>(
      GAP_ANALYSIS_SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 2500 }
    ),
    context,
    {
      operation: 'performGapAnalysis',
      fallbackFactory: (ctx) => ({
        overall_status: 'at_risk' as const,
        kpi_gaps: ctx.current_kpis.map((k) => ({
          kpi_name: k.kpi_name,
          current_gap: k.target_value - k.current_trajectory,
          gap_percentage: ((k.target_value - k.current_trajectory) / k.target_value) * 100,
          time_remaining: 'Calculate from target date',
          required_improvement_rate: 'Manual calculation required',
          risk_level: 'medium' as const,
          recommendations: ['Review KPI trajectory', 'Consult with ESG team'],
        })),
        reporting_gaps: {
          status: ctx.reporting_status.reports_submitted < ctx.reporting_status.reports_required ? 'behind' as const : 'compliant' as const,
          missing_reports: ctx.reporting_status.reports_required - ctx.reporting_status.reports_submitted,
          recommendations: ['Submit outstanding reports'],
        },
        allocation_gaps: ctx.allocation_status
          ? {
              status: ctx.allocation_status.unallocated_amount === 0 ? 'fully_allocated' as const : 'partially_allocated' as const,
              gap_amount: ctx.allocation_status.unallocated_amount,
              gap_percentage: (ctx.allocation_status.unallocated_amount / ctx.allocation_status.total_commitment) * 100,
              recommendations: ['Identify eligible projects for allocation'],
            }
          : undefined,
        priority_actions: [
          {
            action: 'Perform detailed manual gap analysis',
            urgency: 'immediate' as const,
            impact: 'high' as const,
          },
        ],
        timeline_to_compliance: 'Requires detailed assessment',
      }),
    }
  );
}

// ============================================
// Benchmark Comparison
// ============================================

interface BenchmarkContext {
  borrower_name: string;
  borrower_industry: string;
  kpi_data: Array<{
    kpi_name: string;
    category: string;
    current_value: number;
    unit: string;
    target_value: number;
  }>;
  peer_data?: Array<{
    company_name: string;
    kpi_name: string;
    value: number;
  }>;
  rating_context?: {
    current_rating?: string;
    rating_provider?: string;
    industry_average_rating?: string;
  };
}

interface BenchmarkResult {
  overall_positioning: 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
  kpi_benchmarks: Array<{
    kpi_name: string;
    borrower_value: number;
    industry_benchmark: number;
    percentile: number;
    positioning: string;
    improvement_potential: string;
  }>;
  peer_comparison: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
  improvement_opportunities: Array<{
    kpi_name: string;
    current_gap_to_leader: number;
    recommended_target: number;
    expected_impact: string;
  }>;
  strategic_recommendations: string[];
}

const BENCHMARK_SYSTEM_PROMPT = `You are an ESG benchmarking specialist. Compare ESG performance against industry benchmarks.

Use industry knowledge to estimate benchmarks. Be specific about positioning and opportunities.

Always respond with valid JSON matching the expected schema.`;

/**
 * Compare ESG performance against industry benchmarks
 */
export async function compareBenchmarks(
  context: BenchmarkContext
): Promise<BenchmarkResult> {
  const kpiData = context.kpi_data
    .map((k) => `- ${k.kpi_name} (${k.category}): ${k.current_value} ${k.unit} (target: ${k.target_value})`)
    .join('\n');

  const peerContext = context.peer_data?.length
    ? `\n\nPEER DATA:
${context.peer_data.map((p) => `- ${p.company_name}: ${p.kpi_name} = ${p.value}`).join('\n')}`
    : '';

  const ratingContext = context.rating_context
    ? `\n\nRATINGS:
Current: ${context.rating_context.current_rating || 'N/A'} (${context.rating_context.rating_provider || 'N/A'})
Industry Average: ${context.rating_context.industry_average_rating || 'N/A'}`
    : '';

  const userPrompt = `Compare this borrower's ESG performance against industry benchmarks:

BORROWER: ${context.borrower_name}
INDUSTRY: ${context.borrower_industry}

KPI DATA:
${kpiData}${peerContext}${ratingContext}

Respond in JSON format:
{
  "overall_positioning": "leader" | "above_average" | "average" | "below_average" | "laggard",
  "kpi_benchmarks": [
    {
      "kpi_name": "KPI name",
      "borrower_value": number,
      "industry_benchmark": number,
      "percentile": number (estimated),
      "positioning": "description of position vs peers",
      "improvement_potential": "potential for improvement"
    }
  ],
  "peer_comparison": {
    "summary": "overall comparison summary",
    "strengths": ["areas where borrower excels"],
    "weaknesses": ["areas needing improvement"]
  },
  "improvement_opportunities": [
    {
      "kpi_name": "KPI with most potential",
      "current_gap_to_leader": number,
      "recommended_target": number,
      "expected_impact": "impact of improvement"
    }
  ],
  "strategic_recommendations": ["strategic recommendations for ESG improvement"]
}`;

  return withLLMFallback(
    () => generateStructuredOutput<BenchmarkResult>(
      BENCHMARK_SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 2000 }
    ),
    context,
    {
      operation: 'compareBenchmarks',
      fallbackFactory: (ctx) => ({
        overall_positioning: 'average' as const,
        kpi_benchmarks: ctx.kpi_data.map((k) => ({
          kpi_name: k.kpi_name,
          borrower_value: k.current_value,
          industry_benchmark: k.target_value,
          percentile: 50,
          positioning: 'Unable to determine positioning',
          improvement_potential: 'Requires industry data',
        })),
        peer_comparison: {
          summary: 'Peer comparison requires additional data',
          strengths: [],
          weaknesses: [],
        },
        improvement_opportunities: [],
        strategic_recommendations: ['Obtain industry benchmark data for detailed comparison'],
      }),
    }
  );
}

// ============================================
// ESG Performance Prediction Engine
// ============================================

interface PredictionContext {
  facility: {
    facility_id: string;
    facility_name: string;
    borrower_name: string;
    borrower_industry: string;
    esg_loan_type: ESGLoanType;
    commitment_amount: number;
    outstanding_amount: number;
    base_margin_bps: number;
    current_margin_bps: number;
    max_margin_adjustment_bps: number;
  };
  kpis: Array<{
    kpi_id: string;
    kpi_name: string;
    kpi_category: KPICategory;
    unit: string;
    baseline_value: number;
    baseline_year: number;
    current_value: number;
    weight: number;
    targets: Array<{
      target_year: number;
      target_value: number;
      target_status: string;
      actual_value?: number;
    }>;
    historical_data: Array<{
      period: string;
      value: number;
    }>;
  }>;
  prediction_horizon_days: number;
  industry_benchmarks?: Record<string, number>;
  seasonal_factors?: Record<string, number>;
}

interface RawPredictionResponse {
  kpi_predictions: KPIPrediction[];
  margin_impact: Omit<MarginImpactPrediction, 'facility_id' | 'facility_name'>;
  what_if_scenarios: WhatIfScenario[];
  recommended_actions: RecommendedAction[];
  overall_risk_level: RiskLevel;
  summary: PredictionSummary;
}

const PREDICTION_SYSTEM_PROMPT = `You are an expert ESG performance analyst with deep knowledge of sustainability-linked loans, KPI forecasting, and margin ratchet mechanisms.

Be precise with predictions. Consider:
1. Historical trends and rate of change
2. Industry seasonality patterns
3. Typical improvement trajectories for each KPI category
4. Margin ratchet mechanics and thresholds
5. Realistic intervention scenarios that could prevent margin step-ups

Provide at least 2-3 what-if scenarios showing how specific interventions could change outcomes.

Always respond with valid JSON matching the expected schema.`;

/**
 * Generate AI-powered predictions for KPI trajectories and margin impacts
 */
export async function generateESGPredictions(
  context: PredictionContext
): Promise<FacilityPrediction> {
  const kpiContext = context.kpis
    .map((k) => {
      const nextTarget = k.targets.find((t) => t.target_status === 'on_track' || t.target_status === 'at_risk' || t.target_status === 'pending');
      const historicalStr = k.historical_data.length > 0
        ? `Historical: ${k.historical_data.map((h) => `${h.period}=${h.value}`).join(', ')}`
        : 'No historical data';
      return `- ${k.kpi_name} (${k.kpi_category}, weight: ${k.weight}%):
    Current: ${k.current_value} ${k.unit}, Baseline: ${k.baseline_value} ${k.unit}
    ${nextTarget ? `Next Target: ${nextTarget.target_value} ${k.unit} by ${nextTarget.target_year}` : 'No pending target'}
    ${historicalStr}`;
    })
    .join('\n');

  const benchmarkContext = context.industry_benchmarks
    ? `\n\nINDUSTRY BENCHMARKS:
${Object.entries(context.industry_benchmarks).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
    : '';

  const seasonalContext = context.seasonal_factors
    ? `\n\nSEASONAL FACTORS:
${Object.entries(context.seasonal_factors).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
    : '';

  const userPrompt = `Analyze the following facility and predict KPI trajectories and margin impacts for the next ${context.prediction_horizon_days} days.

FACILITY: ${context.facility.facility_name}
BORROWER: ${context.facility.borrower_name}
INDUSTRY: ${context.facility.borrower_industry}
LOAN TYPE: ${context.facility.esg_loan_type}
COMMITMENT: ${context.facility.commitment_amount.toLocaleString()}
OUTSTANDING: ${context.facility.outstanding_amount.toLocaleString()}
BASE MARGIN: ${context.facility.base_margin_bps}bps
CURRENT MARGIN: ${context.facility.current_margin_bps}bps
MAX ADJUSTMENT: +/- ${context.facility.max_margin_adjustment_bps}bps

KPIs:
${kpiContext}${benchmarkContext}${seasonalContext}

Respond in JSON format with detailed predictions:
{
  "kpi_predictions": [
    {
      "kpi_id": "string",
      "kpi_name": "string",
      "kpi_category": "string",
      "unit": "string",
      "current_value": number,
      "baseline_value": number,
      "target_value": number,
      "target_date": "YYYY-MM-DD",
      "predicted_value": number,
      "confidence": "high" | "medium" | "low",
      "confidence_score": number (0-100),
      "trend": "improving" | "stable" | "declining",
      "will_miss_target": boolean,
      "days_until_deadline": number,
      "gap_to_target": number,
      "gap_percentage": number,
      "prediction_factors": ["factor1", "factor2"],
      "seasonal_adjustment": number (optional)
    }
  ],
  "margin_impact": {
    "current_margin_bps": number,
    "base_margin_bps": number,
    "predicted_margin_bps": number,
    "predicted_adjustment_bps": number,
    "max_adjustment_bps": number,
    "financial_impact": {
      "annual_interest_cost_change": number,
      "outstanding_amount": number,
      "percentage_change": number
    },
    "contributing_kpis": [
      {
        "kpi_name": "string",
        "contribution_bps": number,
        "will_miss": boolean
      }
    ],
    "confidence": "high" | "medium" | "low",
    "effective_date": "YYYY-MM-DD"
  },
  "what_if_scenarios": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "interventions": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "kpi_impact": number,
          "kpi_impact_percentage": number,
          "cost_estimate": number,
          "time_to_effect": "string",
          "category": "operational" | "capital" | "strategic" | "regulatory",
          "risk_level": "low" | "medium" | "high" | "critical"
        }
      ],
      "margin_impact_change": number,
      "financial_benefit": number,
      "implementation_cost": number,
      "roi": number,
      "probability_of_success": number (0-100),
      "time_to_implement": "string"
    }
  ],
  "recommended_actions": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "priority": "critical" | "high" | "medium" | "low",
      "expected_impact": "string",
      "kpis_affected": ["kpi_name1"],
      "deadline": "YYYY-MM-DD",
      "estimated_effort": "string",
      "potential_margin_benefit_bps": number
    }
  ],
  "overall_risk_level": "low" | "medium" | "high" | "critical",
  "summary": {
    "total_kpis": number,
    "kpis_on_track": number,
    "kpis_at_risk": number,
    "kpis_off_track": number,
    "predicted_margin_change_bps": number,
    "financial_exposure": number,
    "earliest_deadline": "YYYY-MM-DD",
    "highest_priority_action": "string"
  }
}`;

  return withLLMFallback(
    async () => {
      const parsed = await generateStructuredOutput<RawPredictionResponse>(
        PREDICTION_SYSTEM_PROMPT,
        userPrompt,
        { maxTokens: 4000 }
      );

      // Ensure proper typing and add historical data
      const kpiPredictions: KPIPrediction[] = (parsed.kpi_predictions || []).map((kp: KPIPrediction, idx: number) => ({
        ...kp,
        prediction_date: new Date().toISOString().split('T')[0],
        historical_data: context.kpis[idx]?.historical_data || [],
      }));

      return {
        facility_id: context.facility.facility_id,
        facility_name: context.facility.facility_name,
        borrower_name: context.facility.borrower_name,
        esg_loan_type: context.facility.esg_loan_type,
        overall_risk_level: parsed.overall_risk_level || 'medium',
        prediction_date: new Date().toISOString(),
        prediction_horizon_days: context.prediction_horizon_days,
        kpi_predictions: kpiPredictions,
        margin_impact: {
          facility_id: context.facility.facility_id,
          facility_name: context.facility.facility_name,
          ...parsed.margin_impact,
        },
        what_if_scenarios: parsed.what_if_scenarios || [],
        recommended_actions: parsed.recommended_actions || [],
        summary: parsed.summary || {
          total_kpis: context.kpis.length,
          kpis_on_track: 0,
          kpis_at_risk: 0,
          kpis_off_track: 0,
          predicted_margin_change_bps: 0,
          financial_exposure: 0,
          earliest_deadline: '',
          highest_priority_action: 'Review KPIs',
        },
      };
    },
    context,
    {
      operation: 'generateESGPredictions',
      fallbackFactory: (ctx) => generateFallbackPrediction(ctx),
    }
  );
}

// ============================================
// What-If Scenario Generation
// ============================================

interface WhatIfScenarioContext {
  facility_name: string;
  kpi: {
    kpi_name: string;
    current_value: number;
    target_value: number;
    unit: string;
    days_until_deadline: number;
  };
  proposed_intervention: string;
  current_margin_bps: number;
  max_adjustment_bps: number;
  outstanding_amount: number;
}

interface RawWhatIfResponse {
  scenario_name: string;
  description: string;
  interventions: Intervention[];
  predicted_kpi_value: number;
  will_achieve_target: boolean;
  margin_impact_change: number;
  financial_benefit: number;
  implementation_cost?: number;
  roi: number;
  probability_of_success: number;
  time_to_implement: string;
}

const WHAT_IF_SYSTEM_PROMPT = `Analyze what-if scenarios for ESG KPI improvement.

Be realistic about implementation timelines and costs.

Always respond with valid JSON matching the expected schema.`;

/**
 * Generate what-if scenario analysis for specific interventions
 */
export async function generateWhatIfScenario(
  context: WhatIfScenarioContext
): Promise<WhatIfScenario> {
  const userPrompt = `Analyze a what-if scenario for ESG KPI improvement:

FACILITY: ${context.facility_name}
KPI: ${context.kpi.kpi_name}
Current Value: ${context.kpi.current_value} ${context.kpi.unit}
Target Value: ${context.kpi.target_value} ${context.kpi.unit}
Days Until Deadline: ${context.kpi.days_until_deadline}
Current Margin: ${context.current_margin_bps}bps
Max Adjustment: ${context.max_adjustment_bps}bps
Outstanding Amount: ${context.outstanding_amount.toLocaleString()}

PROPOSED INTERVENTION: ${context.proposed_intervention}

Respond in JSON format:
{
  "scenario_name": "string",
  "description": "string",
  "interventions": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "kpi_impact": number,
      "kpi_impact_percentage": number,
      "cost_estimate": number,
      "time_to_effect": "string",
      "category": "operational" | "capital" | "strategic" | "regulatory",
      "risk_level": "low" | "medium" | "high" | "critical",
      "dependencies": ["string"]
    }
  ],
  "predicted_kpi_value": number,
  "will_achieve_target": boolean,
  "margin_impact_change": number,
  "financial_benefit": number,
  "implementation_cost": number,
  "roi": number,
  "probability_of_success": number (0-100),
  "time_to_implement": "string",
  "risks": ["string"],
  "success_factors": ["string"]
}`;

  return withLLMFallback(
    async () => {
      const parsed = await generateStructuredOutput<RawWhatIfResponse>(
        WHAT_IF_SYSTEM_PROMPT,
        userPrompt,
        { maxTokens: 2000 }
      );

      const originalPrediction: KPIPrediction = {
        kpi_id: 'original',
        kpi_name: context.kpi.kpi_name,
        kpi_category: 'environmental_emissions',
        unit: context.kpi.unit,
        current_value: context.kpi.current_value,
        baseline_value: context.kpi.current_value,
        target_value: context.kpi.target_value,
        target_date: new Date(Date.now() + context.kpi.days_until_deadline * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted_value: context.kpi.current_value,
        prediction_date: new Date().toISOString().split('T')[0],
        confidence: 'medium',
        confidence_score: 70,
        trend: 'stable',
        will_miss_target: true,
        days_until_deadline: context.kpi.days_until_deadline,
        gap_to_target: context.kpi.target_value - context.kpi.current_value,
        gap_percentage: ((context.kpi.target_value - context.kpi.current_value) / context.kpi.target_value) * 100,
        historical_data: [],
        prediction_factors: ['Current trajectory'],
      };

      const adjustedPrediction: KPIPrediction = {
        ...originalPrediction,
        kpi_id: 'adjusted',
        predicted_value: parsed.predicted_kpi_value,
        will_miss_target: !parsed.will_achieve_target,
        confidence: 'medium',
        prediction_factors: parsed.interventions?.map((i: Intervention) => i.name) || [],
      };

      return {
        id: `scenario-${Date.now()}`,
        name: parsed.scenario_name,
        description: parsed.description,
        interventions: parsed.interventions || [],
        original_prediction: originalPrediction,
        adjusted_prediction: adjustedPrediction,
        margin_impact_change: parsed.margin_impact_change,
        financial_benefit: parsed.financial_benefit,
        implementation_cost: parsed.implementation_cost,
        roi: parsed.roi,
        probability_of_success: parsed.probability_of_success,
        time_to_implement: parsed.time_to_implement,
      };
    },
    context,
    {
      operation: 'generateWhatIfScenario',
      fallbackFactory: (ctx) => ({
        id: `scenario-${Date.now()}`,
        name: 'Manual Analysis Required',
        description: 'Unable to generate automated scenario. Please consult ESG team.',
        interventions: [],
        original_prediction: {
          kpi_id: 'original',
          kpi_name: ctx.kpi.kpi_name,
          kpi_category: 'environmental_emissions' as const,
          unit: ctx.kpi.unit,
          current_value: ctx.kpi.current_value,
          baseline_value: ctx.kpi.current_value,
          target_value: ctx.kpi.target_value,
          target_date: '',
          predicted_value: ctx.kpi.current_value,
          prediction_date: new Date().toISOString().split('T')[0],
          confidence: 'low' as const,
          confidence_score: 30,
          trend: 'stable' as const,
          will_miss_target: true,
          days_until_deadline: ctx.kpi.days_until_deadline,
          gap_to_target: ctx.kpi.target_value - ctx.kpi.current_value,
          gap_percentage: 0,
          historical_data: [],
          prediction_factors: [],
        },
        adjusted_prediction: {
          kpi_id: 'adjusted',
          kpi_name: ctx.kpi.kpi_name,
          kpi_category: 'environmental_emissions' as const,
          unit: ctx.kpi.unit,
          current_value: ctx.kpi.current_value,
          baseline_value: ctx.kpi.current_value,
          target_value: ctx.kpi.target_value,
          target_date: '',
          predicted_value: ctx.kpi.current_value,
          prediction_date: new Date().toISOString().split('T')[0],
          confidence: 'low' as const,
          confidence_score: 30,
          trend: 'stable' as const,
          will_miss_target: true,
          days_until_deadline: ctx.kpi.days_until_deadline,
          gap_to_target: ctx.kpi.target_value - ctx.kpi.current_value,
          gap_percentage: 0,
          historical_data: [],
          prediction_factors: [],
        },
        margin_impact_change: 0,
        financial_benefit: 0,
        implementation_cost: 0,
        roi: 0,
        probability_of_success: 0,
        time_to_implement: 'Unknown',
      }),
    }
  );
}

/**
 * Generate portfolio-wide predictions
 */
export async function generatePortfolioPredictions(
  facilities: PredictionContext[]
): Promise<PortfolioPrediction> {
  const facilityPredictions: FacilityPrediction[] = [];

  for (const facility of facilities) {
    const prediction = await generateESGPredictions(facility);
    facilityPredictions.push(prediction);
  }

  const facilitiesAtRisk = facilityPredictions.filter(
    (f) => f.overall_risk_level === 'high' || f.overall_risk_level === 'critical'
  ).length;

  const totalFinancialExposure = facilityPredictions.reduce(
    (sum, f) => sum + (f.summary?.financial_exposure || 0),
    0
  );

  const aggregateMarginImpact = facilityPredictions.reduce(
    (sum, f) => sum + (f.margin_impact?.predicted_adjustment_bps || 0),
    0
  ) / facilityPredictions.length;

  const allInterventions = facilityPredictions.flatMap(
    (f) => f.what_if_scenarios?.flatMap((s: WhatIfScenario) => s.interventions) || []
  );

  const topInterventions = allInterventions
    .sort((a, b) => (b.kpi_impact_percentage || 0) - (a.kpi_impact_percentage || 0))
    .slice(0, 5);

  return {
    generated_at: new Date().toISOString(),
    prediction_horizon_days: facilities[0]?.prediction_horizon_days || 90,
    total_facilities: facilityPredictions.length,
    facilities_at_risk: facilitiesAtRisk,
    total_financial_exposure: totalFinancialExposure,
    aggregate_margin_impact_bps: aggregateMarginImpact,
    facility_predictions: facilityPredictions,
    portfolio_summary: {
      green_facilities: facilityPredictions.filter((f) => f.overall_risk_level === 'low').length,
      amber_facilities: facilityPredictions.filter((f) => f.overall_risk_level === 'medium').length,
      red_facilities: facilityPredictions.filter(
        (f) => f.overall_risk_level === 'high' || f.overall_risk_level === 'critical'
      ).length,
      total_potential_step_ups: facilityPredictions.reduce(
        (sum, f) => sum + (f.margin_impact?.predicted_adjustment_bps > 0 ? f.margin_impact.predicted_adjustment_bps : 0),
        0
      ),
      total_potential_savings: facilityPredictions.reduce(
        (sum, f) => {
          const scenarios = f.what_if_scenarios || [];
          return sum + scenarios.reduce((s: number, sc: WhatIfScenario) => s + (sc.financial_benefit || 0), 0);
        },
        0
      ),
    },
    top_interventions: topInterventions,
  };
}

// ============================================
// Peer Benchmarking Functions
// ============================================

interface PeerBenchmarkContext {
  facility: {
    facility_id: string;
    facility_name: string;
    borrower_name: string;
    borrower_industry: string;
    esg_loan_type: ESGLoanType;
  };
  peer_group: {
    id: string;
    name: string;
    description?: string;
    member_count: number;
  };
  facility_kpis: Array<{
    kpi_id: string;
    kpi_name: string;
    kpi_category: KPICategory;
    unit: string;
    current_value: number;
    baseline_value: number;
    target_value: number;
    improvement_direction: 'increase' | 'decrease';
  }>;
  peer_kpi_data: Array<{
    kpi_name: string;
    kpi_category: KPICategory;
    values: number[];
    min: number;
    max: number;
    mean: number;
    median: number;
    p25: number;
    p75: number;
  }>;
  historical_performance?: Array<{
    period: string;
    kpi_name: string;
    facility_value: number;
    peer_median: number;
  }>;
}

const PEER_BENCHMARK_SYSTEM_PROMPT = `You are an ESG peer benchmarking specialist with expertise in sustainability-linked loan performance analysis.

Analyze the facility's KPI performance against industry peers and provide actionable insights.

Focus on:
1. Identifying competitive positioning (leader, above average, average, below average, laggard)
2. Highlighting strengths and weaknesses relative to peers
3. Providing trajectory analysis and forecasts
4. Recommending specific improvement actions

Always respond with valid JSON matching the expected schema.`;

/**
 * Calculate percentile ranking for a value in a distribution
 */
function calculatePercentile(value: number, values: number[], higherIsBetter: boolean): number {
  if (values.length === 0) return 50;

  const sorted = [...values].sort((a, b) => a - b);
  const belowCount = sorted.filter(v => v < value).length;
  const equalCount = sorted.filter(v => v === value).length;

  // Calculate percentile using average rank for ties
  const percentile = ((belowCount + equalCount / 2) / sorted.length) * 100;

  // If higher is better, higher values should have higher percentiles
  // If lower is better (e.g., emissions), lower values should have higher percentiles
  return higherIsBetter ? percentile : 100 - percentile;
}

/**
 * Determine positioning based on percentile
 */
function getPositioning(percentile: number): PeerPositioning {
  if (percentile >= 80) return 'leader';
  if (percentile >= 60) return 'above_average';
  if (percentile >= 40) return 'average';
  if (percentile >= 20) return 'below_average';
  return 'laggard';
}

/**
 * Determine trend from historical data
 */
function calculateTrend(values: number[], higherIsBetter: boolean): PerformanceTrend {
  if (values.length < 2) return 'stable';

  const recentValues = values.slice(-3);
  if (recentValues.length < 2) return 'stable';

  const first = recentValues[0];
  const last = recentValues[recentValues.length - 1];
  const changePercent = ((last - first) / Math.abs(first)) * 100;

  const isImproving = higherIsBetter ? changePercent > 5 : changePercent < -5;
  const isDeclining = higherIsBetter ? changePercent < -5 : changePercent > 5;

  if (isImproving) return 'improving';
  if (isDeclining) return 'declining';
  return 'stable';
}

/**
 * Calculate KPI percentile rankings against peer group
 */
export function calculateKPIPercentileRankings(
  context: PeerBenchmarkContext
): KPIPercentileRanking[] {
  return context.facility_kpis.map(kpi => {
    const peerData = context.peer_kpi_data.find(p => p.kpi_name === kpi.kpi_name);

    if (!peerData || peerData.values.length === 0) {
      // No peer data available
      return {
        kpi_id: kpi.kpi_id,
        kpi_name: kpi.kpi_name,
        kpi_category: kpi.kpi_category,
        unit: kpi.unit,
        facility_value: kpi.current_value,
        percentile: 50,
        rank: 1,
        total_peers: 1,
        positioning: 'average' as PeerPositioning,
        peer_min: kpi.current_value,
        peer_max: kpi.current_value,
        peer_median: kpi.current_value,
        peer_mean: kpi.current_value,
        peer_25th: kpi.current_value,
        peer_75th: kpi.current_value,
        best_in_class: {
          facility_name: context.facility.facility_name,
          value: kpi.current_value,
        },
        improvement_to_next_quartile: 0,
      };
    }

    const higherIsBetter = kpi.improvement_direction === 'increase';
    const percentile = calculatePercentile(kpi.current_value, peerData.values, higherIsBetter);
    const positioning = getPositioning(percentile);

    // Calculate rank
    const sortedValues = [...peerData.values, kpi.current_value].sort((a, b) =>
      higherIsBetter ? b - a : a - b
    );
    const rank = sortedValues.indexOf(kpi.current_value) + 1;

    // Calculate improvement needed for next quartile
    let improvementToNextQuartile = 0;
    if (percentile < 25) {
      improvementToNextQuartile = higherIsBetter
        ? peerData.p25 - kpi.current_value
        : kpi.current_value - peerData.p25;
    } else if (percentile < 50) {
      improvementToNextQuartile = higherIsBetter
        ? peerData.median - kpi.current_value
        : kpi.current_value - peerData.median;
    } else if (percentile < 75) {
      improvementToNextQuartile = higherIsBetter
        ? peerData.p75 - kpi.current_value
        : kpi.current_value - peerData.p75;
    }

    // Best in class
    const bestValue = higherIsBetter ? peerData.max : peerData.min;

    // Calculate trajectory if historical data is available
    let trajectory: KPITrajectoryComparison | undefined;
    const kpiHistory = context.historical_performance?.filter(h => h.kpi_name === kpi.kpi_name);
    if (kpiHistory && kpiHistory.length >= 2) {
      const facilityValues = kpiHistory.map(h => h.facility_value);
      const facilityTrend = calculateTrend(facilityValues, higherIsBetter);
      const peerMedianValues = kpiHistory.map(h => h.peer_median);
      const peerTrend = calculateTrend(peerMedianValues, higherIsBetter);

      // Calculate relative improvement
      const facilityChange = facilityValues[facilityValues.length - 1] - facilityValues[0];
      const peerChange = peerMedianValues[peerMedianValues.length - 1] - peerMedianValues[0];
      const relativeImprovement = higherIsBetter
        ? facilityChange - peerChange
        : peerChange - facilityChange;

      trajectory = {
        periods: kpiHistory.map(h => ({
          period: h.period,
          facility_value: h.facility_value,
          peer_median: h.peer_median,
          peer_25th: peerData.p25,
          peer_75th: peerData.p75,
          percentile: calculatePercentile(h.facility_value, peerData.values, higherIsBetter),
        })),
        trend: facilityTrend,
        peer_trend: peerTrend,
        relative_improvement: relativeImprovement,
      };
    }

    return {
      kpi_id: kpi.kpi_id,
      kpi_name: kpi.kpi_name,
      kpi_category: kpi.kpi_category,
      unit: kpi.unit,
      facility_value: kpi.current_value,
      percentile: Math.round(percentile),
      rank,
      total_peers: peerData.values.length + 1,
      positioning,
      peer_min: peerData.min,
      peer_max: peerData.max,
      peer_median: peerData.median,
      peer_mean: peerData.mean,
      peer_25th: peerData.p25,
      peer_75th: peerData.p75,
      best_in_class: {
        facility_name: 'Industry Leader',
        value: bestValue,
      },
      improvement_to_next_quartile: Math.abs(improvementToNextQuartile),
      trajectory,
    };
  });
}

/**
 * Generate complete facility peer ranking with AI insights
 */
export async function generateFacilityPeerRanking(
  context: PeerBenchmarkContext
): Promise<FacilityPeerRanking> {
  // Calculate statistical rankings
  const kpiRankings = calculateKPIPercentileRankings(context);

  // Calculate overall percentile (weighted average)
  const overallPercentile = kpiRankings.length > 0
    ? Math.round(kpiRankings.reduce((sum, r) => sum + r.percentile, 0) / kpiRankings.length)
    : 50;

  // Group by category
  const categoryMap = new Map<KPICategory, KPIPercentileRanking[]>();
  for (const ranking of kpiRankings) {
    const existing = categoryMap.get(ranking.kpi_category) || [];
    existing.push(ranking);
    categoryMap.set(ranking.kpi_category, existing);
  }

  const categoryRankings = Array.from(categoryMap.entries()).map(([category, rankings]) => {
    const avgPercentile = Math.round(rankings.reduce((sum, r) => sum + r.percentile, 0) / rankings.length);
    return {
      category,
      percentile: avgPercentile,
      positioning: getPositioning(avgPercentile),
      kpi_count: rankings.length,
    };
  });

  // Identify strengths (top 3 KPIs by percentile)
  const sortedByPercentile = [...kpiRankings].sort((a, b) => b.percentile - a.percentile);
  const strengths = sortedByPercentile.slice(0, 3).filter(k => k.percentile >= 60).map(k => ({
    kpi_name: k.kpi_name,
    percentile: k.percentile,
    insight: `Performing in the ${k.positioning.replace('_', ' ')} tier for ${k.kpi_name}`,
  }));

  // Identify weaknesses (bottom 3 KPIs by percentile)
  const weaknesses = sortedByPercentile.slice(-3).filter(k => k.percentile < 40).map(k => ({
    kpi_name: k.kpi_name,
    percentile: k.percentile,
    insight: `Below average performance on ${k.kpi_name}`,
    improvement_potential: `Improve by ${k.improvement_to_next_quartile.toFixed(2)} ${k.unit} to reach next quartile`,
  }));

  // Calculate trajectory summary
  const kpisWithTrajectory = kpiRankings.filter(k => k.trajectory);
  let trajectorySummary = undefined;
  if (kpisWithTrajectory.length > 0) {
    const improving = kpisWithTrajectory.filter(k => k.trajectory?.trend === 'improving').length;
    const stable = kpisWithTrajectory.filter(k => k.trajectory?.trend === 'stable').length;
    const declining = kpisWithTrajectory.filter(k => k.trajectory?.trend === 'declining').length;

    const overallTrend: PerformanceTrend = improving > declining ? 'improving' :
                                            declining > improving ? 'declining' : 'stable';

    trajectorySummary = {
      improving_kpis: improving,
      stable_kpis: stable,
      declining_kpis: declining,
      overall_trend: overallTrend,
      peer_comparison: improving > declining
        ? 'Outpacing peer improvement rate'
        : declining > improving
          ? 'Falling behind peer improvement rate'
          : 'Keeping pace with peers',
    };
  }

  return {
    facility_id: context.facility.facility_id,
    facility_name: context.facility.facility_name,
    borrower_name: context.facility.borrower_name,
    borrower_industry: context.facility.borrower_industry,
    peer_group: context.peer_group,
    overall_percentile: overallPercentile,
    overall_positioning: getPositioning(overallPercentile),
    kpi_rankings: kpiRankings,
    category_rankings: categoryRankings,
    strengths,
    weaknesses,
    trajectory_summary: trajectorySummary,
    generated_at: new Date().toISOString(),
  };
}

interface PeerInsightsContext {
  facility_ranking: FacilityPeerRanking;
  peer_leaders: Array<{
    facility_name: string;
    borrower_name: string;
    overall_percentile: number;
    top_kpis: string[];
  }>;
}

interface RawPeerInsightsResponse {
  executive_summary: string;
  competitive_position: {
    overall_assessment: string;
    key_differentiators: string[];
    areas_of_concern: string[];
  };
  kpi_insights: Array<{
    kpi_name: string;
    kpi_category: string;
    percentile: number;
    insight: string;
    action_items: string[];
  }>;
  improvement_roadmap: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    kpi_name: string;
    current_percentile: number;
    target_percentile: number;
    actions: string[];
    expected_timeline: string;
    estimated_impact: string;
  }>;
  peer_leader_analysis: {
    leader_name: string;
    leader_percentile: number;
    key_practices: string[];
    applicable_learnings: string[];
  };
  trajectory_forecast: {
    current_trend: 'improving' | 'stable' | 'declining';
    projected_percentile_6m: number;
    projected_percentile_12m: number;
    risk_factors: string[];
    opportunities: string[];
  };
}

/**
 * Generate AI-powered peer benchmarking insights
 */
export async function generatePeerBenchmarkInsights(
  context: PeerInsightsContext
): Promise<PeerBenchmarkInsights> {
  const kpiSummary = context.facility_ranking.kpi_rankings
    .map(k => `- ${k.kpi_name} (${k.kpi_category}): ${k.facility_value} ${k.unit}, percentile: ${k.percentile}, positioning: ${k.positioning}`)
    .join('\n');

  const strengthsSummary = context.facility_ranking.strengths
    .map(s => `- ${s.kpi_name}: ${s.percentile}th percentile - ${s.insight}`)
    .join('\n');

  const weaknessesSummary = context.facility_ranking.weaknesses
    .map(w => `- ${w.kpi_name}: ${w.percentile}th percentile - ${w.insight}`)
    .join('\n');

  const leadersSummary = context.peer_leaders.slice(0, 3)
    .map(l => `- ${l.facility_name} (${l.borrower_name}): ${l.overall_percentile}th percentile, excels in: ${l.top_kpis.join(', ')}`)
    .join('\n');

  const trajectorySummary = context.facility_ranking.trajectory_summary
    ? `Trajectory: ${context.facility_ranking.trajectory_summary.overall_trend} (${context.facility_ranking.trajectory_summary.improving_kpis} improving, ${context.facility_ranking.trajectory_summary.declining_kpis} declining)`
    : 'No trajectory data available';

  const userPrompt = `Analyze the ESG peer benchmarking data and provide strategic insights:

FACILITY: ${context.facility_ranking.facility_name}
BORROWER: ${context.facility_ranking.borrower_name}
INDUSTRY: ${context.facility_ranking.borrower_industry}

PEER GROUP: ${context.facility_ranking.peer_group.name}
PEER COUNT: ${context.facility_ranking.peer_group.member_count}

OVERALL PERFORMANCE:
- Percentile: ${context.facility_ranking.overall_percentile}
- Positioning: ${context.facility_ranking.overall_positioning}

KPI RANKINGS:
${kpiSummary}

STRENGTHS:
${strengthsSummary || 'None identified'}

WEAKNESSES:
${weaknessesSummary || 'None identified'}

PEER LEADERS:
${leadersSummary || 'No leader data available'}

${trajectorySummary}

Respond in JSON format:
{
  "executive_summary": "2-3 sentence summary of competitive position and key takeaways",
  "competitive_position": {
    "overall_assessment": "detailed assessment of competitive standing",
    "key_differentiators": ["what sets this facility apart positively"],
    "areas_of_concern": ["areas requiring attention"]
  },
  "kpi_insights": [
    {
      "kpi_name": "KPI name",
      "kpi_category": "category",
      "percentile": number,
      "insight": "specific insight about this KPI's performance",
      "action_items": ["specific actions to improve"]
    }
  ],
  "improvement_roadmap": [
    {
      "priority": "critical" | "high" | "medium" | "low",
      "kpi_name": "KPI to improve",
      "current_percentile": number,
      "target_percentile": number,
      "actions": ["specific improvement actions"],
      "expected_timeline": "realistic timeline",
      "estimated_impact": "expected impact on overall positioning"
    }
  ],
  "peer_leader_analysis": {
    "leader_name": "name of top peer",
    "leader_percentile": number,
    "key_practices": ["what makes them successful"],
    "applicable_learnings": ["practices that could be adopted"]
  },
  "trajectory_forecast": {
    "current_trend": "improving" | "stable" | "declining",
    "projected_percentile_6m": number,
    "projected_percentile_12m": number,
    "risk_factors": ["factors that could worsen position"],
    "opportunities": ["opportunities to improve position"]
  }
}`;

  return withLLMFallback(
    async () => {
      const parsed = await generateStructuredOutput<RawPeerInsightsResponse>(
        PEER_BENCHMARK_SYSTEM_PROMPT,
        userPrompt,
        { maxTokens: 3000 }
      );

      return {
        facility_id: context.facility_ranking.facility_id,
        facility_name: context.facility_ranking.facility_name,
        peer_group_name: context.facility_ranking.peer_group.name,
        executive_summary: parsed.executive_summary,
        competitive_position: parsed.competitive_position,
        kpi_insights: parsed.kpi_insights.map(k => ({
          ...k,
          kpi_category: k.kpi_category as KPICategory,
        })),
        improvement_roadmap: parsed.improvement_roadmap,
        peer_leader_analysis: parsed.peer_leader_analysis,
        trajectory_forecast: {
          ...parsed.trajectory_forecast,
          current_trend: parsed.trajectory_forecast.current_trend as PerformanceTrend,
        },
      };
    },
    context,
    {
      operation: 'generatePeerBenchmarkInsights',
      fallbackFactory: (ctx) => ({
        facility_id: ctx.facility_ranking.facility_id,
        facility_name: ctx.facility_ranking.facility_name,
        peer_group_name: ctx.facility_ranking.peer_group.name,
        executive_summary: `${ctx.facility_ranking.facility_name} is positioned at the ${ctx.facility_ranking.overall_percentile}th percentile among peers, classified as ${ctx.facility_ranking.overall_positioning.replace('_', ' ')}.`,
        competitive_position: {
          overall_assessment: 'Manual analysis required for detailed competitive assessment.',
          key_differentiators: ctx.facility_ranking.strengths.map(s => s.kpi_name),
          areas_of_concern: ctx.facility_ranking.weaknesses.map(w => w.kpi_name),
        },
        kpi_insights: ctx.facility_ranking.kpi_rankings.slice(0, 5).map(k => ({
          kpi_name: k.kpi_name,
          kpi_category: k.kpi_category,
          percentile: k.percentile,
          insight: `Performing at the ${k.percentile}th percentile for ${k.kpi_name}`,
          action_items: k.percentile < 50 ? ['Review improvement opportunities'] : ['Maintain current performance'],
        })),
        improvement_roadmap: ctx.facility_ranking.weaknesses.map((w, i) => ({
          priority: (i === 0 ? 'high' : 'medium') as 'high' | 'medium',
          kpi_name: w.kpi_name,
          current_percentile: w.percentile,
          target_percentile: Math.min(w.percentile + 25, 75),
          actions: ['Conduct detailed analysis', 'Develop improvement plan'],
          expected_timeline: '6-12 months',
          estimated_impact: 'Moderate improvement in overall positioning',
        })),
        peer_leader_analysis: ctx.peer_leaders.length > 0 ? {
          leader_name: ctx.peer_leaders[0].facility_name,
          leader_percentile: ctx.peer_leaders[0].overall_percentile,
          key_practices: ['Industry-leading ESG practices'],
          applicable_learnings: ['Review leader approaches for adoption'],
        } : {
          leader_name: 'Unknown',
          leader_percentile: 95,
          key_practices: ['Data not available'],
          applicable_learnings: ['Gather peer leader data for analysis'],
        },
        trajectory_forecast: {
          current_trend: ctx.facility_ranking.trajectory_summary?.overall_trend || 'stable',
          projected_percentile_6m: ctx.facility_ranking.overall_percentile,
          projected_percentile_12m: ctx.facility_ranking.overall_percentile,
          risk_factors: ['Market conditions', 'Regulatory changes'],
          opportunities: ['Technology adoption', 'Process optimization'],
        },
      }),
    }
  );
}

/**
 * Fallback prediction when AI fails
 */
function generateFallbackPrediction(context: PredictionContext): FacilityPrediction {
  const kpiPredictions: KPIPrediction[] = context.kpis.map((kpi) => {
    const nextTarget = kpi.targets.find(
      (t) => t.target_status === 'on_track' || t.target_status === 'at_risk' || t.target_status === 'pending'
    );
    const targetValue = nextTarget?.target_value || kpi.current_value;
    const targetDate = nextTarget ? `${nextTarget.target_year}-12-31` : new Date().toISOString().split('T')[0];
    const gap = targetValue - kpi.current_value;
    const gapPercentage = (gap / targetValue) * 100;
    const daysUntilDeadline = Math.max(
      0,
      Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    // Simple trend calculation
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (kpi.historical_data.length >= 2) {
      const last = kpi.historical_data[kpi.historical_data.length - 1]?.value || 0;
      const prev = kpi.historical_data[kpi.historical_data.length - 2]?.value || 0;
      if (last > prev) trend = 'improving';
      else if (last < prev) trend = 'declining';
    }

    const willMiss = kpi.current_value < targetValue * 0.95;

    return {
      kpi_id: kpi.kpi_id,
      kpi_name: kpi.kpi_name,
      kpi_category: kpi.kpi_category,
      unit: kpi.unit,
      current_value: kpi.current_value,
      baseline_value: kpi.baseline_value,
      target_value: targetValue,
      target_date: targetDate,
      predicted_value: kpi.current_value * 1.02, // Simple 2% improvement assumption
      prediction_date: new Date().toISOString().split('T')[0],
      confidence: 'low' as const,
      confidence_score: 40,
      trend,
      will_miss_target: willMiss,
      days_until_deadline: daysUntilDeadline,
      gap_to_target: gap,
      gap_percentage: gapPercentage,
      historical_data: kpi.historical_data,
      prediction_factors: ['Historical trend extrapolation'],
    };
  });

  const kpisAtRisk = kpiPredictions.filter((k) => k.will_miss_target).length;
  const riskLevel: RiskLevel = kpisAtRisk === 0 ? 'low' : kpisAtRisk === 1 ? 'medium' : kpisAtRisk >= 2 ? 'high' : 'critical';

  const marginImpact: MarginImpactPrediction = {
    facility_id: context.facility.facility_id,
    facility_name: context.facility.facility_name,
    current_margin_bps: context.facility.current_margin_bps,
    base_margin_bps: context.facility.base_margin_bps,
    predicted_margin_bps: context.facility.current_margin_bps + kpisAtRisk * 5,
    predicted_adjustment_bps: kpisAtRisk * 5,
    max_adjustment_bps: context.facility.max_margin_adjustment_bps,
    financial_impact: {
      annual_interest_cost_change: (kpisAtRisk * 5 / 10000) * context.facility.outstanding_amount,
      outstanding_amount: context.facility.outstanding_amount,
      percentage_change: (kpisAtRisk * 5) / context.facility.base_margin_bps * 100,
    },
    contributing_kpis: kpiPredictions.map((k) => ({
      kpi_name: k.kpi_name,
      contribution_bps: k.will_miss_target ? 5 : 0,
      will_miss: k.will_miss_target,
    })),
    confidence: 'low',
    effective_date: kpiPredictions[0]?.target_date || new Date().toISOString().split('T')[0],
  };

  return {
    facility_id: context.facility.facility_id,
    facility_name: context.facility.facility_name,
    borrower_name: context.facility.borrower_name,
    esg_loan_type: context.facility.esg_loan_type,
    overall_risk_level: riskLevel,
    prediction_date: new Date().toISOString(),
    prediction_horizon_days: context.prediction_horizon_days,
    kpi_predictions: kpiPredictions,
    margin_impact: marginImpact,
    what_if_scenarios: [],
    recommended_actions: [
      {
        id: 'action-1',
        title: 'Review KPI Performance',
        description: 'Conduct detailed review of KPI trajectories and identify improvement opportunities',
        priority: kpisAtRisk >= 2 ? 'high' : 'medium',
        expected_impact: 'Improved visibility into performance gaps',
        kpis_affected: kpiPredictions.filter((k) => k.will_miss_target).map((k) => k.kpi_name),
        estimated_effort: '1-2 weeks',
        potential_margin_benefit_bps: kpisAtRisk * 3,
      },
    ],
    summary: {
      total_kpis: kpiPredictions.length,
      kpis_on_track: kpiPredictions.filter((k) => !k.will_miss_target).length,
      kpis_at_risk: kpisAtRisk,
      kpis_off_track: kpiPredictions.filter((k) => k.will_miss_target && k.gap_percentage > 20).length,
      predicted_margin_change_bps: kpisAtRisk * 5,
      financial_exposure: marginImpact.financial_impact.annual_interest_cost_change,
      earliest_deadline: kpiPredictions.sort((a, b) => a.days_until_deadline - b.days_until_deadline)[0]?.target_date || '',
      highest_priority_action: 'Review KPI Performance',
    },
  };
}
