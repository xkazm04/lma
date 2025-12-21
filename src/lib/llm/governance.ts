import { generateStructuredOutput, withLLMFallback } from './client';
import type {
  GovernanceEventType,
  GovernanceAlertSeverity,
  GovernanceMetrics,
  ShareholderResolution,
  GovernanceEvent,
  BoardMember,
  CompensationLinkType,
} from '@/lib/validations/esg';

// ============================================
// Types for Governance Analysis
// ============================================

export interface GovernanceAssessmentContext {
  borrower_name: string;
  borrower_industry: string;
  governance_metrics?: GovernanceMetrics;
  resolutions?: ShareholderResolution[];
  events?: GovernanceEvent[];
  existing_covenants?: Array<{
    covenant_id: string;
    covenant_name: string;
    covenant_type: string;
    threshold_value?: number;
  }>;
  esg_kpis?: Array<{
    kpi_id: string;
    kpi_name: string;
    kpi_category: string;
    current_value?: number;
    target_value?: number;
  }>;
}

export interface GovernanceAssessmentResult {
  overall_score: number;
  score_category: 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
  component_scores: {
    board_composition: number;
    board_diversity: number;
    independence: number;
    sustainability_oversight: number;
    executive_compensation: number;
    shareholder_engagement: number;
  };
  strengths: string[];
  weaknesses: string[];
  red_flags: Array<{
    flag_type: GovernanceEventType;
    severity: GovernanceAlertSeverity;
    description: string;
    covenant_implications: string[];
  }>;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    area: string;
    recommendation: string;
    expected_impact: string;
  }>;
  peer_comparison?: {
    industry_percentile: number;
    comparison_notes: string;
  };
}

export interface CovenantCorrelationContext {
  governance_events: GovernanceEvent[];
  governance_metrics: GovernanceMetrics;
  covenants: Array<{
    covenant_id: string;
    covenant_name: string;
    covenant_type: string;
    description?: string;
    threshold_value?: number;
    current_headroom?: number;
  }>;
  historical_breaches?: Array<{
    covenant_name: string;
    breach_date: string;
    governance_events_around_breach?: string[];
  }>;
}

export interface CovenantCorrelationResult {
  correlations: Array<{
    governance_event_type: GovernanceEventType;
    affected_covenants: Array<{
      covenant_name: string;
      correlation_strength: 'high' | 'medium' | 'low';
      lag_days: number;
      impact_direction: 'positive' | 'negative' | 'neutral';
      reasoning: string;
    }>;
  }>;
  high_risk_patterns: Array<{
    pattern: string;
    covenants_at_risk: string[];
    recommended_monitoring: string;
  }>;
  predictive_signals: Array<{
    signal: string;
    lead_time_days: number;
    covenants_affected: string[];
    confidence: number;
  }>;
  summary: string;
}

export interface RedFlagAnalysisContext {
  borrower_name: string;
  governance_metrics: GovernanceMetrics;
  recent_events: GovernanceEvent[];
  board_changes?: Array<{
    member_name: string;
    change_type: 'appointed' | 'resigned' | 'terminated' | 'role_change';
    date: string;
    reason?: string;
  }>;
  proxy_voting_history?: Array<{
    resolution_type: string;
    management_recommendation: string;
    iss_recommendation: string;
    vote_result: string;
    support_percentage: number;
  }>;
}

export interface RedFlagAnalysisResult {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  flags: Array<{
    id: string;
    flag_type: GovernanceEventType;
    severity: GovernanceAlertSeverity;
    title: string;
    description: string;
    source_data: string;
    covenant_implications: string[];
    kpi_implications: string[];
    recommended_actions: string[];
    monitoring_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  }>;
  watchlist_items: Array<{
    item: string;
    reason: string;
    escalation_trigger: string;
  }>;
  immediate_actions_required: string[];
  summary: string;
}

export interface CompensationAnalysisContext {
  borrower_name: string;
  ceo_compensation?: {
    base_salary: number;
    bonus: number;
    equity_awards: number;
    total_compensation: number;
    esg_linked_percentage?: number;
    esg_metrics_used?: CompensationLinkType[];
  };
  other_executives?: Array<{
    role: string;
    total_compensation: number;
    esg_linked_percentage?: number;
  }>;
  industry_benchmarks?: {
    avg_ceo_compensation: number;
    avg_esg_link_percentage: number;
  };
  esg_kpis?: Array<{
    kpi_name: string;
    kpi_category: string;
    target_value: number;
    achievement_status: string;
  }>;
}

export interface CompensationAnalysisResult {
  esg_alignment_score: number;
  alignment_category: 'strong' | 'moderate' | 'weak' | 'none';
  compensation_breakdown: {
    total_at_risk_for_esg: number;
    percentage_esg_linked: number;
    esg_metrics_coverage: string[];
    missing_material_metrics: string[];
  };
  effectiveness_assessment: {
    metrics_achievable: boolean;
    targets_ambitious: boolean;
    timeframes_appropriate: boolean;
    verification_adequate: boolean;
  };
  peer_comparison: {
    percentile: number;
    industry_leader_practices: string[];
    gaps_to_leaders: string[];
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    metric_to_add: string;
    rationale: string;
    suggested_weighting: number;
  }>;
  covenant_implications: string[];
  summary: string;
}

export interface BoardDiversityBenchmarkContext {
  borrower_name: string;
  borrower_industry: string;
  current_board: BoardMember[];
  industry_benchmarks?: {
    avg_board_size: number;
    avg_female_percentage: number;
    avg_minority_percentage: number;
    avg_independence_percentage: number;
    avg_esg_expertise_percentage: number;
  };
  regulatory_requirements?: Array<{
    jurisdiction: string;
    requirement: string;
    deadline?: string;
  }>;
}

export interface BoardDiversityBenchmarkResult {
  diversity_score: number;
  score_category: 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
  metrics: {
    board_size: number;
    female_percentage: number;
    minority_percentage: number;
    independence_percentage: number;
    esg_expertise_percentage: number;
    avg_tenure_years: number;
    avg_age?: number;
  };
  vs_benchmarks: {
    female_gap: number;
    minority_gap: number;
    independence_gap: number;
    esg_expertise_gap: number;
  };
  regulatory_compliance: Array<{
    requirement: string;
    status: 'compliant' | 'at_risk' | 'non_compliant';
    gap?: string;
    deadline?: string;
  }>;
  skill_gaps: string[];
  succession_risks: Array<{
    risk: string;
    affected_roles: string[];
    urgency: 'immediate' | 'near_term' | 'medium_term';
  }>;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    timeline: string;
    expected_impact: string;
  }>;
  covenant_implications: string[];
  summary: string;
}

export interface ProxyVoteImpactContext {
  borrower_name: string;
  resolution: ShareholderResolution;
  historical_resolutions?: ShareholderResolution[];
  governance_metrics?: GovernanceMetrics;
  related_covenants?: Array<{
    covenant_name: string;
    description: string;
  }>;
  related_kpis?: Array<{
    kpi_name: string;
    kpi_category: string;
    current_status: string;
  }>;
}

export interface ProxyVoteImpactResult {
  resolution_summary: string;
  esg_materiality: 'high' | 'medium' | 'low';
  expected_outcome: 'pass' | 'fail' | 'uncertain';
  if_passed_impact: {
    governance_impact: string;
    operational_impact: string;
    financial_impact: string;
    covenant_implications: Array<{
      covenant_name: string;
      impact: string;
      risk_change: 'increase' | 'decrease' | 'neutral';
    }>;
    kpi_implications: Array<{
      kpi_name: string;
      impact: string;
      direction: 'positive' | 'negative' | 'neutral';
    }>;
  };
  if_failed_impact: {
    governance_impact: string;
    reputation_risk: string;
    investor_sentiment: string;
  };
  voting_recommendation: {
    recommendation: 'for' | 'against' | 'abstain';
    rationale: string;
    alignment_with_esg_strategy: string;
  };
  monitoring_actions: string[];
  summary: string;
}

// ============================================
// System Prompts
// ============================================

const GOVERNANCE_ASSESSMENT_PROMPT = `You are an ISS-style governance analyst specializing in ESG governance assessments for sustainability-linked loans.

Analyze governance structures with focus on:
1. Board composition and diversity
2. Sustainability committee effectiveness
3. Executive compensation ESG linkage
4. Shareholder engagement patterns
5. Governance red flags that may affect covenant compliance

Be specific about covenant implications and provide actionable recommendations.

Always respond with valid JSON matching the expected schema.`;

const COVENANT_CORRELATION_PROMPT = `You are a governance risk analyst specializing in correlating governance events with covenant compliance.

Identify patterns between:
1. Board changes and financial covenant stress
2. Executive departures and reporting delays
3. Shareholder activism and ESG KPI achievement
4. Regulatory actions and compliance failures

Provide predictive signals and monitoring recommendations.

Always respond with valid JSON matching the expected schema.`;

const RED_FLAG_ANALYSIS_PROMPT = `You are a governance risk specialist focused on identifying red flags in borrower governance that may indicate ESG or credit risks.

Analyze for red flags including:
1. Sudden board changes or resignations
2. Failed shareholder resolutions with high support
3. Executive compensation disconnects
4. Audit committee concerns
5. Regulatory or legal issues
6. Whistleblower incidents
7. Ethics violations

Provide severity assessments and immediate action recommendations.

Always respond with valid JSON matching the expected schema.`;

const COMPENSATION_ANALYSIS_PROMPT = `You are an executive compensation and ESG alignment specialist.

Analyze compensation structures for:
1. ESG metric linkage and materiality
2. Target achievability and ambition
3. Verification and accountability
4. Peer comparison and best practices
5. Covenant and KPI alignment

Provide specific recommendations for strengthening ESG-compensation linkage.

Always respond with valid JSON matching the expected schema.`;

const BOARD_DIVERSITY_PROMPT = `You are a board governance and diversity specialist.

Assess board composition for:
1. Gender and ethnic diversity
2. Independence and skill mix
3. ESG expertise and oversight
4. Succession planning risks
5. Regulatory compliance
6. Industry benchmark comparison

Provide specific recommendations with timelines.

Always respond with valid JSON matching the expected schema.`;

const PROXY_VOTE_IMPACT_PROMPT = `You are a proxy voting and shareholder engagement analyst.

Analyze resolutions for:
1. ESG materiality and strategic importance
2. Expected voting outcome
3. Impact on governance structure
4. Covenant and KPI implications
5. Investor sentiment signals
6. Recommended voting position

Consider both pass and fail scenarios.

Always respond with valid JSON matching the expected schema.`;

// ============================================
// LLM Functions
// ============================================

/**
 * Generate comprehensive governance assessment for a borrower
 */
export async function assessGovernance(
  context: GovernanceAssessmentContext
): Promise<GovernanceAssessmentResult> {
  const metricsContext = context.governance_metrics
    ? `
GOVERNANCE METRICS (as of ${context.governance_metrics.as_of_date}):
- Board Size: ${context.governance_metrics.board_size || 'N/A'}
- Independent Directors: ${context.governance_metrics.independent_directors || 'N/A'}
- Female Directors: ${context.governance_metrics.female_directors || 'N/A'}
- ESG Expertise on Board: ${context.governance_metrics.esg_expertise_on_board ? 'Yes' : 'No'}
- Separate Chair/CEO: ${context.governance_metrics.separate_chair_ceo ? 'Yes' : 'No'}
- Sustainability Committee: ${context.governance_metrics.has_sustainability_committee ? 'Yes' : 'No'}
- CEO Comp ESG Linked: ${context.governance_metrics.ceo_comp_esg_linked ? 'Yes' : 'No'} (${context.governance_metrics.ceo_comp_esg_percentage || 0}%)
- ESG Metrics Used: ${context.governance_metrics.exec_comp_esg_metrics?.join(', ') || 'None'}
- Shareholder Support Rate: ${context.governance_metrics.shareholder_support_rate || 'N/A'}%`
    : '';

  const resolutionsContext = context.resolutions?.length
    ? `\n\nRECENT SHAREHOLDER RESOLUTIONS:
${context.resolutions.map((r) => `- ${r.resolution_type} (${r.meeting_date}): ${r.vote_result || 'Pending'}, ${r.support_percentage || 'N/A'}% support, ISS: ${r.iss_recommendation || 'N/A'}`).join('\n')}`
    : '';

  const eventsContext = context.events?.length
    ? `\n\nRECENT GOVERNANCE EVENTS:
${context.events.map((e) => `- ${e.event_date}: ${e.title} (${e.event_type}, ${e.severity})`).join('\n')}`
    : '';

  const covenantsContext = context.existing_covenants?.length
    ? `\n\nEXISTING COVENANTS:
${context.existing_covenants.map((c) => `- ${c.covenant_name} (${c.covenant_type}): threshold ${c.threshold_value || 'N/A'}`).join('\n')}`
    : '';

  const userPrompt = `Assess the governance quality for this borrower:

BORROWER: ${context.borrower_name}
INDUSTRY: ${context.borrower_industry}
${metricsContext}${resolutionsContext}${eventsContext}${covenantsContext}

Respond in JSON format:
{
  "overall_score": number (0-100),
  "score_category": "leader" | "above_average" | "average" | "below_average" | "laggard",
  "component_scores": {
    "board_composition": number (0-100),
    "board_diversity": number (0-100),
    "independence": number (0-100),
    "sustainability_oversight": number (0-100),
    "executive_compensation": number (0-100),
    "shareholder_engagement": number (0-100)
  },
  "strengths": ["governance strengths"],
  "weaknesses": ["governance weaknesses"],
  "red_flags": [
    {
      "flag_type": "board_change" | "executive_compensation" | etc.,
      "severity": "info" | "warning" | "critical",
      "description": "description of the red flag",
      "covenant_implications": ["how this affects covenants"]
    }
  ],
  "recommendations": [
    {
      "priority": "critical" | "high" | "medium" | "low",
      "area": "area to improve",
      "recommendation": "specific action",
      "expected_impact": "expected outcome"
    }
  ],
  "peer_comparison": {
    "industry_percentile": number,
    "comparison_notes": "how borrower compares to peers"
  }
}`;

  return withLLMFallback(
    () => generateStructuredOutput<GovernanceAssessmentResult>(
      GOVERNANCE_ASSESSMENT_PROMPT,
      userPrompt,
      { maxTokens: 3000 }
    ),
    context,
    {
      operation: 'assessGovernance',
      fallbackFactory: () => ({
        overall_score: 50,
        score_category: 'average' as const,
        component_scores: {
          board_composition: 50,
          board_diversity: 50,
          independence: 50,
          sustainability_oversight: 50,
          executive_compensation: 50,
          shareholder_engagement: 50,
        },
        strengths: ['Unable to assess - manual review required'],
        weaknesses: ['Unable to assess - manual review required'],
        red_flags: [],
        recommendations: [{
          priority: 'high' as const,
          area: 'Assessment',
          recommendation: 'Conduct manual governance review',
          expected_impact: 'Complete governance picture',
        }],
      }),
    }
  );
}

/**
 * Analyze correlation between governance events and covenant compliance
 */
export async function analyzeCovenantCorrelation(
  context: CovenantCorrelationContext
): Promise<CovenantCorrelationResult> {
  const eventsContext = `GOVERNANCE EVENTS:
${context.governance_events.map((e) => `- ${e.event_date}: ${e.event_type} - ${e.title} (${e.severity})`).join('\n')}`;

  const metricsContext = `
GOVERNANCE METRICS:
- Board Size: ${context.governance_metrics.board_size || 'N/A'}
- Independence: ${context.governance_metrics.independent_directors || 'N/A'} directors
- CEO Comp ESG Link: ${context.governance_metrics.ceo_comp_esg_percentage || 0}%`;

  const covenantsContext = `
COVENANTS:
${context.covenants.map((c) => `- ${c.covenant_name} (${c.covenant_type}): headroom ${c.current_headroom || 'N/A'}%`).join('\n')}`;

  const breachesContext = context.historical_breaches?.length
    ? `\n\nHISTORICAL BREACHES:
${context.historical_breaches.map((b) => `- ${b.breach_date}: ${b.covenant_name}, nearby events: ${b.governance_events_around_breach?.join(', ') || 'None'}`).join('\n')}`
    : '';

  const userPrompt = `Analyze correlations between governance events and covenant compliance:

${eventsContext}
${metricsContext}
${covenantsContext}${breachesContext}

Respond in JSON format:
{
  "correlations": [
    {
      "governance_event_type": "board_change" | "executive_compensation" | etc.,
      "affected_covenants": [
        {
          "covenant_name": "covenant name",
          "correlation_strength": "high" | "medium" | "low",
          "lag_days": number (days between event and covenant impact),
          "impact_direction": "positive" | "negative" | "neutral",
          "reasoning": "explanation of correlation"
        }
      ]
    }
  ],
  "high_risk_patterns": [
    {
      "pattern": "description of risky pattern",
      "covenants_at_risk": ["covenant names"],
      "recommended_monitoring": "monitoring approach"
    }
  ],
  "predictive_signals": [
    {
      "signal": "early warning signal",
      "lead_time_days": number,
      "covenants_affected": ["covenant names"],
      "confidence": number (0-100)
    }
  ],
  "summary": "overall correlation analysis summary"
}`;

  return withLLMFallback(
    () => generateStructuredOutput<CovenantCorrelationResult>(
      COVENANT_CORRELATION_PROMPT,
      userPrompt,
      { maxTokens: 2500 }
    ),
    context,
    {
      operation: 'analyzeCovenantCorrelation',
      fallbackFactory: () => ({
        correlations: [],
        high_risk_patterns: [],
        predictive_signals: [],
        summary: 'Correlation analysis requires additional data. Manual review recommended.',
      }),
    }
  );
}

/**
 * Identify governance red flags that may indicate ESG or credit risks
 */
export async function analyzeRedFlags(
  context: RedFlagAnalysisContext
): Promise<RedFlagAnalysisResult> {
  const metricsContext = `GOVERNANCE METRICS:
- Board Size: ${context.governance_metrics.board_size || 'N/A'}
- Independence: ${context.governance_metrics.independent_directors || 'N/A'} directors
- Female Directors: ${context.governance_metrics.female_directors || 'N/A'}
- Sustainability Committee: ${context.governance_metrics.has_sustainability_committee ? 'Yes' : 'No'}
- CEO Comp ESG Linked: ${context.governance_metrics.ceo_comp_esg_linked ? 'Yes' : 'No'}`;

  const eventsContext = context.recent_events.length
    ? `\n\nRECENT EVENTS:
${context.recent_events.map((e) => `- ${e.event_date}: ${e.event_type} - ${e.title} (${e.severity})\n  ${e.description || ''}`).join('\n')}`
    : '';

  const boardChangesContext = context.board_changes?.length
    ? `\n\nBOARD CHANGES:
${context.board_changes.map((c) => `- ${c.date}: ${c.member_name} - ${c.change_type}${c.reason ? ` (${c.reason})` : ''}`).join('\n')}`
    : '';

  const votingContext = context.proxy_voting_history?.length
    ? `\n\nPROXY VOTING HISTORY:
${context.proxy_voting_history.map((v) => `- ${v.resolution_type}: Mgmt ${v.management_recommendation}, ISS ${v.iss_recommendation}, Result: ${v.vote_result} (${v.support_percentage}%)`).join('\n')}`
    : '';

  const userPrompt = `Analyze governance red flags for this borrower:

BORROWER: ${context.borrower_name}
${metricsContext}${eventsContext}${boardChangesContext}${votingContext}

Respond in JSON format:
{
  "risk_level": "low" | "medium" | "high" | "critical",
  "flags": [
    {
      "id": "unique-id",
      "flag_type": "board_change" | "executive_compensation" | etc.,
      "severity": "info" | "warning" | "critical",
      "title": "short title",
      "description": "detailed description",
      "source_data": "what data triggered this flag",
      "covenant_implications": ["covenant-related concerns"],
      "kpi_implications": ["KPI-related concerns"],
      "recommended_actions": ["specific actions"],
      "monitoring_frequency": "daily" | "weekly" | "monthly" | "quarterly"
    }
  ],
  "watchlist_items": [
    {
      "item": "what to watch",
      "reason": "why important",
      "escalation_trigger": "when to escalate"
    }
  ],
  "immediate_actions_required": ["urgent actions if any"],
  "summary": "overall risk summary"
}`;

  return withLLMFallback(
    () => generateStructuredOutput<RedFlagAnalysisResult>(
      RED_FLAG_ANALYSIS_PROMPT,
      userPrompt,
      { maxTokens: 3000 }
    ),
    context,
    {
      operation: 'analyzeRedFlags',
      fallbackFactory: () => ({
        risk_level: 'medium' as const,
        flags: [],
        watchlist_items: [{
          item: 'Complete governance data',
          reason: 'Insufficient data for automated analysis',
          escalation_trigger: 'Upon receipt of additional data',
        }],
        immediate_actions_required: ['Gather complete governance data for analysis'],
        summary: 'Red flag analysis incomplete due to insufficient data. Manual review required.',
      }),
    }
  );
}

/**
 * Analyze executive compensation ESG alignment
 */
export async function analyzeCompensation(
  context: CompensationAnalysisContext
): Promise<CompensationAnalysisResult> {
  const ceoContext = context.ceo_compensation
    ? `CEO COMPENSATION:
- Base Salary: ${context.ceo_compensation.base_salary.toLocaleString()}
- Bonus: ${context.ceo_compensation.bonus.toLocaleString()}
- Equity Awards: ${context.ceo_compensation.equity_awards.toLocaleString()}
- Total: ${context.ceo_compensation.total_compensation.toLocaleString()}
- ESG Linked: ${context.ceo_compensation.esg_linked_percentage || 0}%
- ESG Metrics: ${context.ceo_compensation.esg_metrics_used?.join(', ') || 'None'}`
    : 'CEO compensation data not available';

  const execsContext = context.other_executives?.length
    ? `\n\nOTHER EXECUTIVES:
${context.other_executives.map((e) => `- ${e.role}: ${e.total_compensation.toLocaleString()} (${e.esg_linked_percentage || 0}% ESG-linked)`).join('\n')}`
    : '';

  const benchmarkContext = context.industry_benchmarks
    ? `\n\nINDUSTRY BENCHMARKS:
- Avg CEO Compensation: ${context.industry_benchmarks.avg_ceo_compensation.toLocaleString()}
- Avg ESG Link %: ${context.industry_benchmarks.avg_esg_link_percentage}%`
    : '';

  const kpiContext = context.esg_kpis?.length
    ? `\n\nESG KPIs:
${context.esg_kpis.map((k) => `- ${k.kpi_name} (${k.kpi_category}): ${k.achievement_status}`).join('\n')}`
    : '';

  const userPrompt = `Analyze executive compensation ESG alignment:

BORROWER: ${context.borrower_name}

${ceoContext}${execsContext}${benchmarkContext}${kpiContext}

Respond in JSON format:
{
  "esg_alignment_score": number (0-100),
  "alignment_category": "strong" | "moderate" | "weak" | "none",
  "compensation_breakdown": {
    "total_at_risk_for_esg": number,
    "percentage_esg_linked": number,
    "esg_metrics_coverage": ["metrics currently linked"],
    "missing_material_metrics": ["material metrics not linked"]
  },
  "effectiveness_assessment": {
    "metrics_achievable": boolean,
    "targets_ambitious": boolean,
    "timeframes_appropriate": boolean,
    "verification_adequate": boolean
  },
  "peer_comparison": {
    "percentile": number,
    "industry_leader_practices": ["best practices from leaders"],
    "gaps_to_leaders": ["gaps compared to leaders"]
  },
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "metric_to_add": "ESG metric to add",
      "rationale": "why this metric",
      "suggested_weighting": number (percentage)
    }
  ],
  "covenant_implications": ["how compensation structure affects covenants"],
  "summary": "overall assessment summary"
}`;

  return withLLMFallback(
    () => generateStructuredOutput<CompensationAnalysisResult>(
      COMPENSATION_ANALYSIS_PROMPT,
      userPrompt,
      { maxTokens: 2500 }
    ),
    context,
    {
      operation: 'analyzeCompensation',
      fallbackFactory: () => ({
        esg_alignment_score: 0,
        alignment_category: 'none' as const,
        compensation_breakdown: {
          total_at_risk_for_esg: 0,
          percentage_esg_linked: 0,
          esg_metrics_coverage: [],
          missing_material_metrics: ['Analysis requires compensation data'],
        },
        effectiveness_assessment: {
          metrics_achievable: false,
          targets_ambitious: false,
          timeframes_appropriate: false,
          verification_adequate: false,
        },
        peer_comparison: {
          percentile: 0,
          industry_leader_practices: [],
          gaps_to_leaders: ['Insufficient data for comparison'],
        },
        recommendations: [],
        covenant_implications: [],
        summary: 'Compensation analysis requires additional data.',
      }),
    }
  );
}

/**
 * Benchmark board diversity against peers and regulations
 */
export async function benchmarkBoardDiversity(
  context: BoardDiversityBenchmarkContext
): Promise<BoardDiversityBenchmarkResult> {
  const boardContext = context.current_board.length
    ? `CURRENT BOARD (${context.current_board.length} members):
${context.current_board.map((m) => `- ${m.name} (${m.role}): Independent: ${m.is_independent ? 'Yes' : 'No'}, Tenure: ${m.tenure_years || 'N/A'} years, ESG Expertise: ${m.esg_expertise ? 'Yes' : 'No'}, Diversity: ${m.diversity_categories?.join(', ') || 'None specified'}`).join('\n')}`
    : 'Board composition data not available';

  const benchmarkContext = context.industry_benchmarks
    ? `\n\nINDUSTRY BENCHMARKS:
- Avg Board Size: ${context.industry_benchmarks.avg_board_size}
- Female %: ${context.industry_benchmarks.avg_female_percentage}%
- Minority %: ${context.industry_benchmarks.avg_minority_percentage}%
- Independence %: ${context.industry_benchmarks.avg_independence_percentage}%
- ESG Expertise %: ${context.industry_benchmarks.avg_esg_expertise_percentage}%`
    : '';

  const regulatoryContext = context.regulatory_requirements?.length
    ? `\n\nREGULATORY REQUIREMENTS:
${context.regulatory_requirements.map((r) => `- ${r.jurisdiction}: ${r.requirement}${r.deadline ? ` (by ${r.deadline})` : ''}`).join('\n')}`
    : '';

  const userPrompt = `Benchmark board diversity for this borrower:

BORROWER: ${context.borrower_name}
INDUSTRY: ${context.borrower_industry}

${boardContext}${benchmarkContext}${regulatoryContext}

Respond in JSON format:
{
  "diversity_score": number (0-100),
  "score_category": "leader" | "above_average" | "average" | "below_average" | "laggard",
  "metrics": {
    "board_size": number,
    "female_percentage": number,
    "minority_percentage": number,
    "independence_percentage": number,
    "esg_expertise_percentage": number,
    "avg_tenure_years": number
  },
  "vs_benchmarks": {
    "female_gap": number (positive = above benchmark),
    "minority_gap": number,
    "independence_gap": number,
    "esg_expertise_gap": number
  },
  "regulatory_compliance": [
    {
      "requirement": "requirement description",
      "status": "compliant" | "at_risk" | "non_compliant",
      "gap": "gap to compliance if any",
      "deadline": "deadline if any"
    }
  ],
  "skill_gaps": ["skills missing from board"],
  "succession_risks": [
    {
      "risk": "succession risk description",
      "affected_roles": ["roles affected"],
      "urgency": "immediate" | "near_term" | "medium_term"
    }
  ],
  "recommendations": [
    {
      "priority": "critical" | "high" | "medium" | "low",
      "action": "recommended action",
      "timeline": "suggested timeline",
      "expected_impact": "expected outcome"
    }
  ],
  "covenant_implications": ["how diversity affects covenants"],
  "summary": "overall assessment summary"
}`;

  return withLLMFallback(
    () => generateStructuredOutput<BoardDiversityBenchmarkResult>(
      BOARD_DIVERSITY_PROMPT,
      userPrompt,
      { maxTokens: 2500 }
    ),
    context,
    {
      operation: 'benchmarkBoardDiversity',
      fallbackFactory: () => {
        const boardSize = context.current_board.length;
        const females = context.current_board.filter((m) =>
          m.diversity_categories?.includes('gender')
        ).length;
        const independents = context.current_board.filter((m) => m.is_independent).length;
        const esgExperts = context.current_board.filter((m) => m.esg_expertise).length;

        return {
          diversity_score: 50,
          score_category: 'average' as const,
          metrics: {
            board_size: boardSize,
            female_percentage: boardSize > 0 ? (females / boardSize) * 100 : 0,
            minority_percentage: 0,
            independence_percentage: boardSize > 0 ? (independents / boardSize) * 100 : 0,
            esg_expertise_percentage: boardSize > 0 ? (esgExperts / boardSize) * 100 : 0,
            avg_tenure_years: 0,
          },
          vs_benchmarks: {
            female_gap: 0,
            minority_gap: 0,
            independence_gap: 0,
            esg_expertise_gap: 0,
          },
          regulatory_compliance: [],
          skill_gaps: ['Analysis requires additional data'],
          succession_risks: [],
          recommendations: [{
            priority: 'medium' as const,
            action: 'Conduct detailed board skills assessment',
            timeline: '90 days',
            expected_impact: 'Identified skill gaps and succession risks',
          }],
          covenant_implications: [],
          summary: 'Basic metrics calculated. Detailed analysis requires additional data.',
        };
      },
    }
  );
}

/**
 * Analyze the impact of a shareholder resolution on governance and covenants
 */
export async function analyzeProxyVoteImpact(
  context: ProxyVoteImpactContext
): Promise<ProxyVoteImpactResult> {
  const resolutionContext = `RESOLUTION:
- Type: ${context.resolution.resolution_type}
- Category: ${context.resolution.resolution_category}
- Meeting Date: ${context.resolution.meeting_date}
- Sponsor: ${context.resolution.sponsor || 'N/A'} (${context.resolution.sponsor_type})
- Description: ${context.resolution.description || 'N/A'}
- ISS Recommendation: ${context.resolution.iss_recommendation || 'N/A'}
- Glass Lewis Recommendation: ${context.resolution.glass_lewis_recommendation || 'N/A'}
- Management Recommendation: ${context.resolution.management_recommendation || 'N/A'}
- Current Support: ${context.resolution.support_percentage || 'N/A'}%`;

  const historyContext = context.historical_resolutions?.length
    ? `\n\nHISTORICAL SIMILAR RESOLUTIONS:
${context.historical_resolutions.map((r) => `- ${r.meeting_date}: ${r.resolution_type} - ${r.vote_result || 'Pending'} (${r.support_percentage || 'N/A'}%)`).join('\n')}`
    : '';

  const metricsContext = context.governance_metrics
    ? `\n\nCURRENT GOVERNANCE:
- Board Size: ${context.governance_metrics.board_size || 'N/A'}
- CEO Comp ESG Link: ${context.governance_metrics.ceo_comp_esg_percentage || 0}%`
    : '';

  const covenantsContext = context.related_covenants?.length
    ? `\n\nRELATED COVENANTS:
${context.related_covenants.map((c) => `- ${c.covenant_name}: ${c.description || 'N/A'}`).join('\n')}`
    : '';

  const kpisContext = context.related_kpis?.length
    ? `\n\nRELATED KPIs:
${context.related_kpis.map((k) => `- ${k.kpi_name} (${k.kpi_category}): ${k.current_status}`).join('\n')}`
    : '';

  const userPrompt = `Analyze the impact of this shareholder resolution:

BORROWER: ${context.borrower_name}

${resolutionContext}${historyContext}${metricsContext}${covenantsContext}${kpisContext}

Respond in JSON format:
{
  "resolution_summary": "concise summary of the resolution",
  "esg_materiality": "high" | "medium" | "low",
  "expected_outcome": "pass" | "fail" | "uncertain",
  "if_passed_impact": {
    "governance_impact": "impact on governance structure",
    "operational_impact": "operational implications",
    "financial_impact": "financial implications",
    "covenant_implications": [
      {
        "covenant_name": "covenant name",
        "impact": "how covenant is affected",
        "risk_change": "increase" | "decrease" | "neutral"
      }
    ],
    "kpi_implications": [
      {
        "kpi_name": "KPI name",
        "impact": "how KPI is affected",
        "direction": "positive" | "negative" | "neutral"
      }
    ]
  },
  "if_failed_impact": {
    "governance_impact": "governance implications if failed",
    "reputation_risk": "reputation risk assessment",
    "investor_sentiment": "impact on investor sentiment"
  },
  "voting_recommendation": {
    "recommendation": "for" | "against" | "abstain",
    "rationale": "reasoning for recommendation",
    "alignment_with_esg_strategy": "how aligns with ESG strategy"
  },
  "monitoring_actions": ["actions to monitor post-vote"],
  "summary": "overall impact assessment"
}`;

  return withLLMFallback(
    () => generateStructuredOutput<ProxyVoteImpactResult>(
      PROXY_VOTE_IMPACT_PROMPT,
      userPrompt,
      { maxTokens: 2500 }
    ),
    context,
    {
      operation: 'analyzeProxyVoteImpact',
      fallbackFactory: (ctx) => ({
        resolution_summary: ctx.resolution.resolution_type,
        esg_materiality: 'medium' as const,
        expected_outcome: 'uncertain' as const,
        if_passed_impact: {
          governance_impact: 'Analysis requires additional context',
          operational_impact: 'Unable to assess',
          financial_impact: 'Unable to assess',
          covenant_implications: [],
          kpi_implications: [],
        },
        if_failed_impact: {
          governance_impact: 'Analysis requires additional context',
          reputation_risk: 'Unable to assess',
          investor_sentiment: 'Unable to assess',
        },
        voting_recommendation: {
          recommendation: 'abstain' as const,
          rationale: 'Insufficient data for recommendation',
          alignment_with_esg_strategy: 'Manual review required',
        },
        monitoring_actions: ['Monitor vote outcome', 'Review implications post-meeting'],
        summary: 'Proxy vote impact analysis requires manual review due to insufficient data.',
      }),
    }
  );
}

/**
 * Generate governance alerts based on events and metrics
 */
export async function generateGovernanceAlerts(
  borrower_name: string,
  events: GovernanceEvent[],
  metrics: GovernanceMetrics,
  existing_covenants: Array<{ covenant_name: string; covenant_type: string }>
): Promise<Array<{
  alert_type: GovernanceEventType;
  severity: GovernanceAlertSeverity;
  title: string;
  description: string;
  covenant_impact: Array<{
    covenant_name: string;
    impact_description: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommended_actions: string[];
}>> {
  const redFlagResult = await analyzeRedFlags({
    borrower_name,
    governance_metrics: metrics,
    recent_events: events,
  });

  return redFlagResult.flags.map((flag) => ({
    alert_type: flag.flag_type,
    severity: flag.severity,
    title: flag.title,
    description: flag.description,
    covenant_impact: flag.covenant_implications.map((impl) => {
      const matchedCovenant = existing_covenants.find((c) =>
        impl.toLowerCase().includes(c.covenant_name.toLowerCase())
      );
      return {
        covenant_name: matchedCovenant?.covenant_name || 'General',
        impact_description: impl,
        risk_level: flag.severity === 'critical' ? 'critical' as const :
                    flag.severity === 'warning' ? 'medium' as const : 'low' as const,
      };
    }),
    recommended_actions: flag.recommended_actions,
  }));
}
