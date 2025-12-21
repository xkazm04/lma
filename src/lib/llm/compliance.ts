import Anthropic from '@anthropic-ai/sdk';
import type { EventAnalysisResult, NotificationDraft } from '@/types';
import type {
  BreachPrediction,
  PredictionRiskLevel,
  RiskThresholdConfig,
  PredictionAlert,
  CovenantTestResult,
} from '@/app/features/compliance/lib/types';
import { DEFAULT_RISK_THRESHOLDS } from '@/app/features/compliance/lib/types';

const anthropic = new Anthropic();

interface NotificationRequirementContext {
  id: string;
  facility_id: string;
  facility_name: string;
  event_type: string;
  name: string;
  trigger_description: string | null;
  notification_deadline: string | null;
  notification_deadline_days: number | null;
  required_content: string | null;
}

/**
 * Analyze a business event to determine which notification requirements are triggered
 */
export async function analyzeBusinessEvent(
  eventDescription: string,
  notificationRequirements: NotificationRequirementContext[]
): Promise<EventAnalysisResult> {
  if (notificationRequirements.length === 0) {
    return {
      triggered_notifications: [],
      suggested_actions: ['No notification requirements configured for the selected facilities.'],
      risk_assessment: 'Unable to assess - no notification requirements available.',
    };
  }

  const requirementsContext = notificationRequirements
    .map((r) => `
- Requirement ID: ${r.id}
  Facility: ${r.facility_name} (${r.facility_id})
  Event Type: ${r.event_type}
  Name: ${r.name}
  Trigger: ${r.trigger_description || 'Not specified'}
  Deadline: ${r.notification_deadline || (r.notification_deadline_days ? `${r.notification_deadline_days} days` : 'Not specified')}
  Required Content: ${r.required_content || 'Not specified'}`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a loan compliance expert. Analyze the following business event and determine which notification requirements are triggered.

EVENT DESCRIPTION:
${eventDescription}

NOTIFICATION REQUIREMENTS:
${requirementsContext}

Respond in JSON format with the following structure:
{
  "triggered_notifications": [
    {
      "requirement_id": "uuid",
      "requirement_name": "string",
      "facility_id": "uuid",
      "facility_name": "string",
      "deadline_days": number or null,
      "confidence": number between 0 and 1,
      "reasoning": "brief explanation of why this is triggered"
    }
  ],
  "suggested_actions": ["action 1", "action 2"],
  "risk_assessment": "overall assessment of the situation and urgency"
}

Only include notifications that are clearly or likely triggered by the event. Be conservative but thorough.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as EventAnalysisResult;
  } catch {
    return {
      triggered_notifications: [],
      suggested_actions: ['Error parsing analysis results. Please review manually.'],
      risk_assessment: 'Unable to complete automated analysis.',
    };
  }
}

interface NotificationContext {
  event_type: string;
  event_description: string;
  facility_name: string;
  borrower_name: string;
  requirement_name: string;
  trigger_description: string | null;
  required_content: string | null;
  recipient_roles: string[];
}

/**
 * Draft a notification letter based on event and requirements
 */
export async function draftNotificationLetter(
  context: NotificationContext
): Promise<NotificationDraft> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a loan compliance expert drafting formal notification letters. Create a professional notification letter based on the following:

EVENT TYPE: ${context.event_type}
EVENT DESCRIPTION: ${context.event_description}
FACILITY: ${context.facility_name}
BORROWER: ${context.borrower_name}
REQUIREMENT: ${context.requirement_name}
TRIGGER DESCRIPTION: ${context.trigger_description || 'Not specified'}
REQUIRED CONTENT: ${context.required_content || 'Standard notification content'}
RECIPIENTS: ${context.recipient_roles.join(', ')}

Respond in JSON format:
{
  "subject": "email/letter subject line",
  "content": "full notification letter content with proper formal structure",
  "recipients": ["list of suggested recipient roles"],
  "suggested_attachments": ["list of documents that should be attached"]
}

The letter should be formal, clear, and comply with typical loan agreement notification requirements.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as NotificationDraft;
  } catch {
    return {
      subject: `Notification: ${context.event_type} - ${context.facility_name}`,
      content: 'Error generating notification content. Please draft manually.',
      recipients: context.recipient_roles,
      suggested_attachments: [],
    };
  }
}

interface CovenantContext {
  covenant_name: string;
  covenant_type: string;
  numerator_definition: string | null;
  denominator_definition: string | null;
  formula_description: string | null;
  threshold_type: string;
  current_threshold: number;
}

interface CovenantInterpretation {
  calculation_steps: string[];
  key_considerations: string[];
  common_adjustments: string[];
  potential_issues: string[];
}

/**
 * Interpret covenant calculation requirements
 */
export async function interpretCovenant(
  context: CovenantContext,
  financialScenario?: string
): Promise<CovenantInterpretation> {
  const scenarioText = financialScenario
    ? `\n\nFINANCIAL SCENARIO:\n${financialScenario}`
    : '';

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a loan compliance expert. Interpret the following covenant calculation requirements:

COVENANT: ${context.covenant_name}
TYPE: ${context.covenant_type}
NUMERATOR: ${context.numerator_definition || 'Not specified'}
DENOMINATOR: ${context.denominator_definition || 'Not specified'}
FORMULA: ${context.formula_description || 'Not specified'}
THRESHOLD TYPE: ${context.threshold_type}
CURRENT THRESHOLD: ${context.current_threshold}${scenarioText}

Respond in JSON format:
{
  "calculation_steps": ["step 1", "step 2", ...],
  "key_considerations": ["consideration 1", "consideration 2", ...],
  "common_adjustments": ["adjustment 1", "adjustment 2", ...],
  "potential_issues": ["issue 1", "issue 2", ...]
}

Provide practical guidance for calculating this covenant correctly.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as CovenantInterpretation;
  } catch {
    return {
      calculation_steps: ['Error interpreting covenant. Please review documentation.'],
      key_considerations: [],
      common_adjustments: [],
      potential_issues: [],
    };
  }
}

interface ComplianceQuestion {
  question: string;
  facility_context?: string;
  document_excerpts?: string[];
}

interface ComplianceAnswer {
  answer: string;
  confidence: number;
  sources: string[];
  follow_up_questions: string[];
}

/**
 * Answer compliance-related questions using RAG
 */
export async function answerComplianceQuestion(
  input: ComplianceQuestion
): Promise<ComplianceAnswer> {
  const contextText = input.facility_context
    ? `\n\nFACILITY CONTEXT:\n${input.facility_context}`
    : '';

  const excerptText = input.document_excerpts?.length
    ? `\n\nRELEVANT DOCUMENT EXCERPTS:\n${input.document_excerpts.join('\n\n---\n\n')}`
    : '';

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a loan compliance expert. Answer the following question about compliance requirements:

QUESTION: ${input.question}${contextText}${excerptText}

Respond in JSON format:
{
  "answer": "detailed answer to the question",
  "confidence": number between 0 and 1,
  "sources": ["relevant sources or clause references"],
  "follow_up_questions": ["suggested follow-up questions for clarity"]
}

Be precise and reference specific requirements where possible.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as ComplianceAnswer;
  } catch {
    return {
      answer: 'Unable to process the question. Please try rephrasing or contact support.',
      confidence: 0,
      sources: [],
      follow_up_questions: [],
    };
  }
}

interface HeadroomAnalysis {
  current_headroom_percentage: number;
  trend: 'improving' | 'stable' | 'declining';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  projected_breach_quarter: string | null;
  recommendations: string[];
}

/**
 * Analyze covenant headroom trends and project potential breaches
 */
export async function analyzeCovenantHeadroom(
  covenantName: string,
  covenantType: string,
  thresholdType: string,
  threshold: number,
  historicalTests: Array<{
    test_date: string;
    calculated_ratio: number | null;
    headroom_percentage: number | null;
  }>
): Promise<HeadroomAnalysis> {
  if (historicalTests.length === 0) {
    return {
      current_headroom_percentage: 0,
      trend: 'stable',
      risk_level: 'medium',
      projected_breach_quarter: null,
      recommendations: ['No historical test data available. Submit covenant tests to enable trend analysis.'],
    };
  }

  const testHistory = historicalTests
    .map((t) => `${t.test_date}: ratio=${t.calculated_ratio}, headroom=${t.headroom_percentage}%`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `You are a loan compliance analyst. Analyze the covenant headroom trend:

COVENANT: ${covenantName}
TYPE: ${covenantType}
THRESHOLD TYPE: ${thresholdType}
CURRENT THRESHOLD: ${threshold}

HISTORICAL TEST RESULTS:
${testHistory}

Respond in JSON format:
{
  "current_headroom_percentage": number,
  "trend": "improving" | "stable" | "declining",
  "risk_level": "low" | "medium" | "high" | "critical",
  "projected_breach_quarter": "Q1 2025" or null if no breach projected,
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

Analyze the trend and provide actionable recommendations.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as HeadroomAnalysis;
  } catch {
    const latestTest = historicalTests[historicalTests.length - 1];
    return {
      current_headroom_percentage: latestTest.headroom_percentage || 0,
      trend: 'stable',
      risk_level: 'medium',
      projected_breach_quarter: null,
      recommendations: ['Error analyzing trends. Manual review recommended.'],
    };
  }
}

// =============================================================================
// Covenant Breach Prediction
// =============================================================================

interface CovenantPredictionContext {
  covenant_id: string;
  covenant_name: string;
  covenant_type: string;
  facility_name: string;
  borrower_name: string;
  threshold_type: 'maximum' | 'minimum';
  current_threshold: number;
  test_frequency: 'monthly' | 'quarterly' | 'annually';
  test_history: CovenantTestResult[];
  borrower_financials?: BorrowerFinancialContext;
  industry_context?: string;
}

interface BorrowerFinancialContext {
  revenue_trend?: 'growing' | 'stable' | 'declining';
  margin_trend?: 'improving' | 'stable' | 'declining';
  debt_level_trend?: 'increasing' | 'stable' | 'decreasing';
  recent_events?: string[];
  industry_outlook?: 'positive' | 'neutral' | 'negative';
}

/**
 * Generate AI-powered breach prediction for a covenant.
 * Analyzes historical test results, seasonal patterns, and borrower financials
 * to predict likelihood of breach 2-3 quarters out.
 */
export async function predictCovenantBreach(
  context: CovenantPredictionContext
): Promise<BreachPrediction> {
  const today = new Date().toISOString().split('T')[0];

  if (context.test_history.length < 2) {
    return createDefaultPrediction(context.covenant_id, today, 'Insufficient historical data for prediction.');
  }

  const testHistory = context.test_history
    .map((t) => `${t.test_date}: ratio=${t.calculated_ratio}, headroom=${t.headroom_percentage}%, result=${t.test_result}`)
    .join('\n');

  const financialContext = context.borrower_financials
    ? `
BORROWER FINANCIAL CONTEXT:
- Revenue Trend: ${context.borrower_financials.revenue_trend || 'Unknown'}
- Margin Trend: ${context.borrower_financials.margin_trend || 'Unknown'}
- Debt Level Trend: ${context.borrower_financials.debt_level_trend || 'Unknown'}
- Industry Outlook: ${context.borrower_financials.industry_outlook || 'Unknown'}
${context.borrower_financials.recent_events?.length ? '- Recent Events: ' + context.borrower_financials.recent_events.join(', ') : ''}`
    : '';

  const currentQuarter = getCurrentQuarter();
  const nextQuarters = getNextQuarters(3);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `You are a senior credit analyst specializing in covenant compliance prediction. Analyze the following covenant data and predict the likelihood of a breach over the next 2-3 quarters.

COVENANT DETAILS:
- Name: ${context.covenant_name}
- Type: ${context.covenant_type}
- Facility: ${context.facility_name}
- Borrower: ${context.borrower_name}
- Threshold Type: ${context.threshold_type}
- Current Threshold: ${context.current_threshold}
- Test Frequency: ${context.test_frequency}

HISTORICAL TEST RESULTS (oldest to newest):
${testHistory}
${financialContext}

CURRENT QUARTER: ${currentQuarter}
PROJECTION QUARTERS: ${nextQuarters.join(', ')}

Analyze the data considering:
1. Historical trend direction and velocity
2. Seasonal patterns (Q4 typically shows different performance than Q2, etc.)
3. Headroom cushion and erosion rate
4. Any concerning patterns in the test results
5. Financial context if provided

Respond in JSON format:
{
  "breach_probability_2q": <number 0-100, probability of breach in 2 quarters>,
  "breach_probability_3q": <number 0-100, probability of breach in 3 quarters>,
  "overall_risk_level": "<low|medium|high|critical>",
  "confidence_score": <number 0-100, your confidence in this prediction>,
  "projected_breach_quarter": "<quarter like Q2 2025>" or null if no breach projected,
  "contributing_factors": [
    {
      "factor": "<factor name>",
      "impact": "<positive|negative|neutral>",
      "description": "<explanation>",
      "weight": <number 0-100>
    }
  ],
  "quarterly_projections": [
    {
      "quarter": "<Q1 2025>",
      "projected_ratio": <number>,
      "breach_probability": <number 0-100>,
      "confidence": <number 0-100>
    }
  ],
  "seasonal_patterns": [
    {
      "quarter": "<Q1|Q2|Q3|Q4>",
      "typical_impact": "<positive|negative|neutral>",
      "description": "<explanation>"
    }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "summary": "<2-3 sentence executive summary of the prediction>"
}

Be conservative but thorough. Provide actionable recommendations.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      covenant_id: context.covenant_id,
      prediction_date: today,
      breach_probability_2q: parsed.breach_probability_2q || 0,
      breach_probability_3q: parsed.breach_probability_3q || 0,
      overall_risk_level: parsed.overall_risk_level || 'medium',
      confidence_score: parsed.confidence_score || 50,
      projected_breach_quarter: parsed.projected_breach_quarter || null,
      contributing_factors: parsed.contributing_factors || [],
      quarterly_projections: parsed.quarterly_projections || [],
      seasonal_patterns: parsed.seasonal_patterns || [],
      recommendations: parsed.recommendations || [],
      summary: parsed.summary || 'Unable to generate summary.',
    };
  } catch {
    return createDefaultPrediction(context.covenant_id, today, 'Error generating prediction. Manual review recommended.');
  }
}

/**
 * Create a default prediction when analysis cannot be completed.
 */
function createDefaultPrediction(covenantId: string, date: string, summary: string): BreachPrediction {
  return {
    covenant_id: covenantId,
    prediction_date: date,
    breach_probability_2q: 0,
    breach_probability_3q: 0,
    overall_risk_level: 'low',
    confidence_score: 0,
    projected_breach_quarter: null,
    contributing_factors: [],
    quarterly_projections: [],
    seasonal_patterns: [],
    recommendations: ['Collect more historical data to enable accurate predictions.'],
    summary,
  };
}

/**
 * Determine risk level based on breach probability and thresholds.
 */
export function determineRiskLevel(
  breachProbability: number,
  thresholds: RiskThresholdConfig = DEFAULT_RISK_THRESHOLDS
): PredictionRiskLevel {
  if (breachProbability >= thresholds.high_threshold) {
    return 'critical';
  }
  if (breachProbability >= thresholds.medium_threshold) {
    return 'high';
  }
  if (breachProbability >= thresholds.low_threshold) {
    return 'medium';
  }
  return 'low';
}

/**
 * Check if an alert should be generated based on prediction and thresholds.
 */
export function shouldGenerateAlert(
  prediction: BreachPrediction,
  previousRiskLevel: PredictionRiskLevel | null,
  thresholds: RiskThresholdConfig = DEFAULT_RISK_THRESHOLDS
): { shouldAlert: boolean; alertType: 'high_risk' | 'critical_risk' | 'threshold_crossed' | null } {
  const currentRiskLevel = prediction.overall_risk_level;

  // Check for critical risk
  if (currentRiskLevel === 'critical' && thresholds.alert_on_critical_risk) {
    return { shouldAlert: true, alertType: 'critical_risk' };
  }

  // Check for high risk
  if (currentRiskLevel === 'high' && thresholds.alert_on_high_risk) {
    return { shouldAlert: true, alertType: 'high_risk' };
  }

  // Check for threshold crossing (risk level increased)
  if (previousRiskLevel && thresholds.alert_on_threshold_crossed) {
    const riskOrder: PredictionRiskLevel[] = ['low', 'medium', 'high', 'critical'];
    const previousIndex = riskOrder.indexOf(previousRiskLevel);
    const currentIndex = riskOrder.indexOf(currentRiskLevel);

    if (currentIndex > previousIndex) {
      return { shouldAlert: true, alertType: 'threshold_crossed' };
    }
  }

  return { shouldAlert: false, alertType: null };
}

/**
 * Generate an alert for a prediction that crossed thresholds.
 */
export function generatePredictionAlert(
  prediction: BreachPrediction,
  covenantName: string,
  facilityName: string,
  borrowerName: string,
  previousRiskLevel: PredictionRiskLevel | null,
  alertType: 'high_risk' | 'critical_risk' | 'threshold_crossed'
): PredictionAlert {
  const messages: Record<string, string> = {
    high_risk: `High breach risk detected for ${covenantName}. ${Math.round(prediction.breach_probability_2q)}% chance of breach within 2 quarters.`,
    critical_risk: `CRITICAL: ${covenantName} shows ${Math.round(prediction.breach_probability_2q)}% breach probability. Immediate attention required.`,
    threshold_crossed: `Risk level increased from ${previousRiskLevel} to ${prediction.overall_risk_level} for ${covenantName}.`,
  };

  return {
    id: `alert-${prediction.covenant_id}-${Date.now()}`,
    covenant_id: prediction.covenant_id,
    covenant_name: covenantName,
    facility_name: facilityName,
    borrower_name: borrowerName,
    alert_type: alertType,
    previous_risk_level: previousRiskLevel,
    current_risk_level: prediction.overall_risk_level,
    breach_probability: prediction.breach_probability_2q,
    message: messages[alertType],
    created_at: new Date().toISOString(),
    acknowledged: false,
  };
}

/**
 * Batch predict breaches for multiple covenants.
 */
export async function batchPredictBreaches(
  covenants: CovenantPredictionContext[]
): Promise<Map<string, BreachPrediction>> {
  const predictions = new Map<string, BreachPrediction>();

  // Process in parallel with concurrency limit
  const concurrencyLimit = 3;
  for (let i = 0; i < covenants.length; i += concurrencyLimit) {
    const batch = covenants.slice(i, i + concurrencyLimit);
    const results = await Promise.all(
      batch.map((covenant) => predictCovenantBreach(covenant))
    );

    results.forEach((prediction, idx) => {
      predictions.set(batch[idx].covenant_id, prediction);
    });
  }

  return predictions;
}

// Helper functions for date/quarter calculations

function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${quarter} ${now.getFullYear()}`;
}

function getNextQuarters(count: number): string[] {
  const quarters: string[] = [];
  const now = new Date();
  let currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  let currentYear = now.getFullYear();

  for (let i = 0; i < count; i++) {
    currentQuarter++;
    if (currentQuarter > 4) {
      currentQuarter = 1;
      currentYear++;
    }
    quarters.push(`Q${currentQuarter} ${currentYear}`);
  }

  return quarters;
}
