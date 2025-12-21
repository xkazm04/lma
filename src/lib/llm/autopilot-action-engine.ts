/**
 * Autopilot Action Engine
 *
 * AI-powered system for generating portfolio actions, calculating confidence scores,
 * and determining auto-approval eligibility. This transforms the dashboard from
 * passive monitoring to autonomous proactive management.
 */

import { generateStructuredOutput } from './client';
import type {
  BreachPrediction,
  GeneratedAction,
  ConfidenceFactor,
  ActionQueueItem,
  InterventionType,
  AutoApprovalThresholds,
} from '@/app/features/dashboard/lib/mocks';

// =============================================================================
// Types
// =============================================================================

export interface ActionGenerationContext {
  prediction: BreachPrediction;
  portfolioContext: {
    totalExposure: number;
    relationshipLength: number;
    previousWaivers: number;
    creditRating: string;
    lenderSentiment: 'positive' | 'neutral' | 'negative';
  };
  marketContext?: {
    rateEnvironment: 'rising' | 'stable' | 'falling';
    creditConditions: 'tight' | 'neutral' | 'loose';
    sectorOutlook: 'positive' | 'neutral' | 'negative';
  };
  constraints?: {
    maxActions?: number;
    excludeTypes?: InterventionType[];
    urgencyFilter?: 'all' | 'urgent_only' | 'non_urgent';
  };
}

export interface ConfidenceEvaluationInput {
  action: GeneratedAction;
  historicalData?: {
    similarActionsCount: number;
    successRate: number;
    avgEffectivenessScore: number;
  };
  ruleBasedFactors?: {
    timingAppropriate: boolean;
    resourcesAvailable: boolean;
    noConflicts: boolean;
  };
}

export interface AutoApprovalDecision {
  isEligible: boolean;
  effectiveThreshold: number;
  confidenceScore: number;
  blockers: string[];
  recommendation: 'auto_approve' | 'require_review' | 'escalate';
  reasoning: string;
}

// =============================================================================
// System Prompts
// =============================================================================

const ACTION_GENERATION_SYSTEM_PROMPT = `You are an expert loan portfolio manager specializing in proactive risk management. Your task is to generate intelligent, actionable interventions based on covenant breach predictions.

When generating actions, consider:
1. The severity and urgency of the predicted breach
2. The borrower's relationship history and profile
3. Market conditions and lender sentiment
4. Practical implementation constraints
5. Optimal timing for maximum effectiveness

Generate actions that are:
- Specific and immediately actionable
- Appropriately timed
- Proportionate to the risk level
- Relationship-preserving
- Compliant with credit facility terms

Available action types:
- borrower_call: Direct engagement with borrower management
- amendment_draft: Formal credit agreement modification
- counterparty_alert: Notification to syndicate members
- compliance_reminder: Proactive compliance obligation reminder
- esg_action: Sustainability-related intervention
- risk_escalation: Escalation to senior management
- waiver_request: Formal covenant relief request
- document_request: Request for additional borrower documentation`;

const CONFIDENCE_SCORING_SYSTEM_PROMPT = `You are an expert at assessing the reliability and appropriateness of automated portfolio management actions. Your task is to evaluate confidence factors for proposed interventions.

Consider these dimensions:
1. Historical success rate of similar actions
2. Timing appropriateness for the specific situation
3. Resource availability and capacity constraints
4. Relationship dynamics and borrower receptivity
5. Market conditions and external factors
6. Regulatory and compliance considerations

Provide a weighted confidence score based on:
- Model-based predictions (AI analysis)
- Historical data patterns
- Rule-based business logic
- User feedback from similar actions

Output confidence factors with scores (0-100), weights (0-1), and clear explanations.`;

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Generate portfolio actions based on a breach prediction
 */
export async function generatePortfolioActions(
  context: ActionGenerationContext
): Promise<GeneratedAction[]> {
  const { prediction, portfolioContext, marketContext, constraints } = context;

  const userMessage = buildActionGenerationPrompt(prediction, portfolioContext, marketContext, constraints);

  const result = await generateStructuredOutput<{ actions: GeneratedAction[] }>(
    ACTION_GENERATION_SYSTEM_PROMPT,
    userMessage,
    { temperature: 0.4 }
  );

  return result.actions;
}

/**
 * Calculate confidence score for a generated action
 */
export async function calculateConfidenceScore(
  input: ConfidenceEvaluationInput
): Promise<{ confidenceScore: number; factors: ConfidenceFactor[] }> {
  const { action, historicalData, ruleBasedFactors } = input;

  const userMessage = buildConfidenceScoringPrompt(action, historicalData, ruleBasedFactors);

  const result = await generateStructuredOutput<{
    overallScore: number;
    factors: Array<{
      factor: string;
      score: number;
      weight: number;
      explanation: string;
      source: 'model' | 'historical' | 'rule' | 'user_feedback';
    }>;
  }>(CONFIDENCE_SCORING_SYSTEM_PROMPT, userMessage, { temperature: 0.2 });

  return {
    confidenceScore: result.overallScore,
    factors: result.factors,
  };
}

/**
 * Evaluate if an action should be auto-approved based on confidence thresholds
 */
export function evaluateAutoApproval(
  action: GeneratedAction,
  confidenceScore: number,
  thresholds: AutoApprovalThresholds
): AutoApprovalDecision {
  const blockers: string[] = [];

  // Check if type always requires approval
  if (thresholds.riskFactors.alwaysRequireApproval.includes(action.type)) {
    blockers.push(`${action.type} interventions always require manual approval`);
  }

  // Get applicable thresholds
  const typeThreshold = thresholds.typeThresholds[action.type] || thresholds.globalThreshold;
  const urgencyImpactMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    immediate: 'critical',
    today: 'high',
    this_week: 'medium',
    this_month: 'low',
  };
  const impactLevel = urgencyImpactMap[action.urgency] || 'medium';
  const impactThreshold = thresholds.impactThresholds[impactLevel];
  const effectiveThreshold = Math.max(typeThreshold, impactThreshold);

  // Check confidence against thresholds
  if (confidenceScore < typeThreshold) {
    blockers.push(`Confidence (${confidenceScore}%) below type threshold (${typeThreshold}%)`);
  }
  if (confidenceScore < impactThreshold) {
    blockers.push(`Confidence (${confidenceScore}%) below impact threshold (${impactThreshold}%)`);
  }

  // Check if type requires legal/compliance review
  if (thresholds.riskFactors.requiresLegalReview.includes(action.type)) {
    blockers.push(`${action.type} requires legal review before execution`);
  }
  if (thresholds.riskFactors.requiresComplianceReview.includes(action.type)) {
    blockers.push(`${action.type} requires compliance review before execution`);
  }

  // Determine eligibility and recommendation
  const isEligible = blockers.length === 0 && confidenceScore >= effectiveThreshold;

  let recommendation: 'auto_approve' | 'require_review' | 'escalate';
  if (isEligible) {
    recommendation = 'auto_approve';
  } else if (confidenceScore < 50 || action.urgency === 'immediate') {
    recommendation = 'escalate';
  } else {
    recommendation = 'require_review';
  }

  // Build reasoning
  const reasoning = isEligible
    ? `Action meets auto-approval criteria: confidence (${confidenceScore}%) exceeds threshold (${effectiveThreshold}%) with no blocking factors.`
    : `Action requires review due to: ${blockers.join('; ')}`;

  return {
    isEligible,
    effectiveThreshold,
    confidenceScore,
    blockers,
    recommendation,
    reasoning,
  };
}

/**
 * Create a queue item from a generated action
 */
export function createQueueItem(
  action: GeneratedAction,
  confidenceScore: number,
  confidenceFactors: ConfidenceFactor[],
  autoApprovalDecision: AutoApprovalDecision
): Omit<ActionQueueItem, 'id' | 'intervention'> {
  const now = new Date();

  // Calculate queue priority based on urgency and confidence
  const urgencyMultiplier: Record<string, number> = {
    immediate: 1.0,
    today: 0.8,
    this_week: 0.6,
    this_month: 0.4,
  };
  const baseScore = confidenceScore * (urgencyMultiplier[action.urgency] || 0.5);
  const queuePriority = Math.min(100, Math.max(1, Math.round(baseScore)));

  // Determine execution mode
  let executionMode: 'auto' | 'manual' | 'hybrid';
  if (autoApprovalDecision.isEligible) {
    executionMode = 'auto';
  } else if (autoApprovalDecision.recommendation === 'escalate') {
    executionMode = 'manual';
  } else {
    executionMode = 'hybrid';
  }

  // Map urgency to impact
  const impactMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    immediate: 'critical',
    today: 'high',
    this_week: 'medium',
    this_month: 'low',
  };

  return {
    interventionId: '', // Will be set when intervention is created
    confidenceScore,
    confidenceFactors,
    status: autoApprovalDecision.isEligible ? 'auto_approved' : 'pending_review',
    executionMode,
    requiresHumanReview: !autoApprovalDecision.isEligible,
    autoApprovalEligible: autoApprovalDecision.isEligible,
    autoApprovalReason: autoApprovalDecision.isEligible ? autoApprovalDecision.reasoning : undefined,
    autoApprovalBlockers: autoApprovalDecision.blockers.length > 0 ? autoApprovalDecision.blockers : undefined,
    queuedAt: now.toISOString(),
    scheduledExecutionTime: autoApprovalDecision.isEligible
      ? new Date(now.getTime() + 5 * 60 * 1000).toISOString() // 5 minutes from now
      : undefined,
    queuePriority,
    estimatedImpact: impactMap[action.urgency] || 'medium',
  };
}

/**
 * Prioritize and sequence multiple actions
 */
export async function prioritizeActions(
  actions: GeneratedAction[],
  constraints: {
    maxSimultaneous: number;
    availableResources: 'limited' | 'moderate' | 'ample';
    urgencyBias: number;
  }
): Promise<{
  prioritized: Array<{ action: GeneratedAction; score: number; rank: number; reasoning: string }>;
  excluded: Array<{ action: GeneratedAction; reason: string }>;
  sequencing: string;
}> {
  const systemPrompt = `You are an expert at portfolio management resource allocation. Prioritize and sequence interventions to maximize effectiveness within resource constraints.`;

  const userMessage = `Prioritize these portfolio actions:

ACTIONS:
${actions.map((a, idx) => `
${idx + 1}. ${a.title}
   Type: ${a.type}
   Urgency: ${a.urgency}
   Confidence: ${a.confidenceScore}%
   Success Probability: ${a.successProbability}%
   Expected Outcome: ${a.expectedOutcome}
`).join('\n')}

CONSTRAINTS:
- Max Simultaneous Actions: ${constraints.maxSimultaneous}
- Available Resources: ${constraints.availableResources}
- Urgency Bias: ${constraints.urgencyBias} (0-1, higher = favor urgent)

Return a JSON object with:
{
  "prioritized": [{ "actionIndex": number, "score": number, "rank": number, "reasoning": string }],
  "excludedIndices": [{ "index": number, "reason": string }],
  "sequencing": string (recommended order and timing)
}`;

  const result = await generateStructuredOutput<{
    prioritized: Array<{ actionIndex: number; score: number; rank: number; reasoning: string }>;
    excludedIndices: Array<{ index: number; reason: string }>;
    sequencing: string;
  }>(systemPrompt, userMessage, { temperature: 0.2 });

  return {
    prioritized: result.prioritized.map((p) => ({
      action: actions[p.actionIndex],
      score: p.score,
      rank: p.rank,
      reasoning: p.reasoning,
    })),
    excluded: result.excludedIndices.map((e) => ({
      action: actions[e.index],
      reason: e.reason,
    })),
    sequencing: result.sequencing,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildActionGenerationPrompt(
  prediction: BreachPrediction,
  portfolioContext: ActionGenerationContext['portfolioContext'],
  marketContext?: ActionGenerationContext['marketContext'],
  constraints?: ActionGenerationContext['constraints']
): string {
  return `Generate portfolio management actions for this breach prediction:

PREDICTION DETAILS:
- Borrower: ${prediction.borrowerName}
- Covenant: ${prediction.covenantName} (${prediction.covenantType})
- Facility: ${prediction.facilityName}
- Breach Probability: ${prediction.breachProbability}%
- Days Until Breach: ${prediction.daysUntilBreach}
- Risk Level: ${prediction.riskLevel}
- Impact Severity: ${prediction.impactSeverity}
- Trend: ${prediction.trend} (rate: ${prediction.trendRate}/month)
- Current Value: ${prediction.currentValue}
- Threshold: ${prediction.threshold}
- Headroom: ${prediction.headroomPercent}%

AI ANALYSIS:
${prediction.aiSummary}

CONTRIBUTING FACTORS:
${prediction.contributingFactors.map((f) => `- ${f.factor} (${f.category}): ${f.description} [${f.impact} impact]`).join('\n')}

RECOMMENDED ACTIONS (from prediction):
${prediction.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

PORTFOLIO CONTEXT:
- Total Exposure: $${portfolioContext.totalExposure.toLocaleString()}
- Relationship Length: ${portfolioContext.relationshipLength} years
- Previous Waivers: ${portfolioContext.previousWaivers}
- Credit Rating: ${portfolioContext.creditRating}
- Lender Sentiment: ${portfolioContext.lenderSentiment}

${marketContext ? `MARKET CONTEXT:
- Rate Environment: ${marketContext.rateEnvironment}
- Credit Conditions: ${marketContext.creditConditions}
- Sector Outlook: ${marketContext.sectorOutlook}` : ''}

${constraints ? `CONSTRAINTS:
- Max Actions: ${constraints.maxActions || 'No limit'}
- Excluded Types: ${constraints.excludeTypes?.join(', ') || 'None'}
- Urgency Filter: ${constraints.urgencyFilter || 'all'}` : ''}

Generate 2-4 portfolio actions as a JSON object:
{
  "actions": [
    {
      "type": InterventionType,
      "title": string,
      "description": string,
      "rationale": string,
      "suggestedAction": string,
      "actionDetails": object (populated based on type),
      "confidenceScore": number (0-100),
      "confidenceFactors": ConfidenceFactor[],
      "optimalTiming": string,
      "urgency": "immediate" | "today" | "this_week" | "this_month",
      "deadlineDays": number,
      "borrowerId": "${prediction.borrowerId}",
      "borrowerName": "${prediction.borrowerName}",
      "facilityId": "${prediction.facilityId}",
      "facilityName": "${prediction.facilityName}",
      "expectedOutcome": string,
      "successProbability": number (0-100),
      "potentialRisks": string[],
      "prerequisites": string[],
      "followUpActions": string[]
    }
  ]
}`;
}

function buildConfidenceScoringPrompt(
  action: GeneratedAction,
  historicalData?: ConfidenceEvaluationInput['historicalData'],
  ruleBasedFactors?: ConfidenceEvaluationInput['ruleBasedFactors']
): string {
  return `Evaluate the confidence score for this portfolio action:

ACTION:
- Type: ${action.type}
- Title: ${action.title}
- Description: ${action.description}
- Urgency: ${action.urgency}
- Expected Outcome: ${action.expectedOutcome}
- Potential Risks: ${action.potentialRisks.join(', ')}

${historicalData ? `HISTORICAL DATA:
- Similar Actions Count: ${historicalData.similarActionsCount}
- Historical Success Rate: ${historicalData.successRate}%
- Average Effectiveness Score: ${historicalData.avgEffectivenessScore}` : ''}

${ruleBasedFactors ? `RULE-BASED FACTORS:
- Timing Appropriate: ${ruleBasedFactors.timingAppropriate}
- Resources Available: ${ruleBasedFactors.resourcesAvailable}
- No Conflicts: ${ruleBasedFactors.noConflicts}` : ''}

Return a JSON object with:
{
  "overallScore": number (0-100, weighted average of factors),
  "factors": [
    {
      "factor": string (factor name),
      "score": number (0-100),
      "weight": number (0-1, must sum to 1),
      "explanation": string (why this score),
      "source": "model" | "historical" | "rule" | "user_feedback"
    }
  ]
}

Include 3-5 confidence factors covering:
- Historical success of similar actions
- Timing appropriateness
- Resource availability
- Relationship/borrower factors
- Market/external factors`;
}
