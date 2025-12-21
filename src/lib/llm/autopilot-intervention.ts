/**
 * Autopilot Intervention Engine
 *
 * AI-powered system for generating intelligent interventions based on
 * breach predictions and portfolio risk analysis.
 */

import { generateStructuredOutput } from './client';
import type {
  BreachPrediction,
  Intervention,
  InterventionType,
  InterventionActionDetails,
} from '@/app/features/dashboard/lib/mocks';

// =============================================================================
// Types
// =============================================================================

export interface InterventionGenerationInput {
  prediction: BreachPrediction;
  portfolioContext: {
    totalExposure: number;
    relationshipLength: number; // years
    previousWaivers: number;
    creditRating: string;
    lenderSentiment: 'positive' | 'neutral' | 'negative';
  };
  constraints?: {
    maxInterventions?: number;
    excludeTypes?: InterventionType[];
    urgencyOverride?: 'low' | 'medium' | 'high' | 'urgent';
  };
}

export interface InterventionPlan {
  primaryIntervention: GeneratedIntervention;
  alternativeInterventions: GeneratedIntervention[];
  rationale: string;
  sequencing: string;
  riskAssessment: string;
  successProbability: number;
}

export interface GeneratedIntervention {
  type: InterventionType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  suggestedAction: string;
  actionDetails: InterventionActionDetails;
  optimalTiming: string;
  deadlineDays: number;
  expectedOutcome: string;
  successProbability: number;
  risks: string[];
}

export interface EscalationAnalysis {
  shouldEscalate: boolean;
  currentLevel: 'monitoring' | 'engagement' | 'restructuring' | 'workout';
  recommendedLevel: 'monitoring' | 'engagement' | 'restructuring' | 'workout';
  escalationTriggers: string[];
  timeToEscalation: number; // days
  escalationActions: string[];
}

// =============================================================================
// System Prompts
// =============================================================================

const INTERVENTION_SYSTEM_PROMPT = `You are an expert loan portfolio manager specializing in proactive covenant management and borrower engagement strategies. Your task is to generate intelligent, actionable interventions based on breach predictions.

When generating interventions, consider:
1. The severity and timing of the predicted breach
2. The borrower's relationship history and credit profile
3. Market conditions and lender appetite
4. Practical implementation constraints
5. Optimal sequencing of multiple interventions

Your interventions should be:
- Specific and actionable with clear next steps
- Appropriately timed to maximize effectiveness
- Proportionate to the risk level
- Respectful of stakeholder relationships
- Compliant with credit facility documentation

Available intervention types:
- borrower_call: Direct engagement to discuss situation and options
- amendment_draft: Formal modification to credit agreement terms
- counterparty_alert: Notification to syndicate members or other stakeholders
- compliance_reminder: Proactive reminder of upcoming obligations
- esg_action: Sustainability-related intervention
- risk_escalation: Escalation to senior management or credit committee
- waiver_request: Formal request for covenant relief
- document_request: Request for additional information or documents`;

const ESCALATION_SYSTEM_PROMPT = `You are a senior credit risk analyst responsible for determining appropriate escalation levels for portfolio risks. Analyze the provided breach prediction and portfolio context to determine if escalation is warranted.

Escalation levels:
1. MONITORING: Standard surveillance, no special action required
2. ENGAGEMENT: Active borrower dialogue, enhanced monitoring
3. RESTRUCTURING: Formal workout discussions, significant amendment negotiations
4. WORKOUT: Active default management, legal/recovery considerations

Consider:
- Probability and timing of breach
- Historical borrower behavior
- Market conditions and alternatives
- Relationship value and strategic importance
- Downside protection and recovery prospects`;

// =============================================================================
// Functions
// =============================================================================

/**
 * Generate an intervention plan based on a breach prediction
 */
export async function generateInterventionPlan(
  input: InterventionGenerationInput
): Promise<InterventionPlan> {
  const userMessage = buildInterventionPrompt(input);

  return generateStructuredOutput<InterventionPlan>(
    INTERVENTION_SYSTEM_PROMPT,
    userMessage,
    { temperature: 0.4 }
  );
}

/**
 * Analyze whether escalation is needed for a prediction
 */
export async function analyzeEscalationNeed(
  prediction: BreachPrediction,
  currentEscalationLevel: 'monitoring' | 'engagement' | 'restructuring' | 'workout'
): Promise<EscalationAnalysis> {
  const userMessage = `Analyze escalation needs for this situation:

PREDICTION:
- Borrower: ${prediction.borrowerName}
- Covenant: ${prediction.covenantName}
- Breach Probability: ${prediction.breachProbability}%
- Days Until Breach: ${prediction.daysUntilBreach}
- Risk Level: ${prediction.riskLevel}
- Trend: ${prediction.trend}
- Cascade Risk: ${prediction.cascadeRisk ? 'Yes' : 'No'}

CURRENT ESCALATION LEVEL: ${currentEscalationLevel}

AI SUMMARY: ${prediction.aiSummary}

CONTRIBUTING FACTORS:
${prediction.contributingFactors.map((f) => `- ${f.factor}: ${f.description} (${f.impact} impact, ${Math.round(f.weight * 100)}% weight)`).join('\n')}

Return a JSON object with:
{
  "shouldEscalate": boolean,
  "currentLevel": "monitoring" | "engagement" | "restructuring" | "workout",
  "recommendedLevel": "monitoring" | "engagement" | "restructuring" | "workout",
  "escalationTriggers": string[],
  "timeToEscalation": number (days until escalation would be warranted if conditions persist),
  "escalationActions": string[]
}`;

  return generateStructuredOutput<EscalationAnalysis>(
    ESCALATION_SYSTEM_PROMPT,
    userMessage,
    { temperature: 0.2 }
  );
}

/**
 * Generate notification content for stakeholders
 */
export async function generateStakeholderNotification(
  prediction: BreachPrediction,
  intervention: Intervention,
  recipientType: 'internal' | 'syndicate' | 'borrower'
): Promise<{
  subject: string;
  summary: string;
  body: string;
  callToAction: string;
  urgency: 'informational' | 'action_required' | 'urgent';
}> {
  const systemPrompt = `You are a professional credit communication specialist. Generate clear, appropriate stakeholder notifications that are:
- Professional and relationship-appropriate
- Clear about the situation and required actions
- Compliant with confidentiality requirements
- Appropriately urgent without being alarmist`;

  const userMessage = `Generate a ${recipientType} notification for:

SITUATION:
- Borrower: ${prediction.borrowerName}
- Facility: ${prediction.facilityName}
- Risk: ${prediction.covenantName} - ${prediction.breachProbability}% breach probability in ${prediction.daysUntilBreach} days

INTERVENTION PLANNED:
- Type: ${intervention.type}
- Title: ${intervention.title}
- Description: ${intervention.description}

Return a JSON object with:
{
  "subject": string (email subject line),
  "summary": string (1-2 sentence executive summary),
  "body": string (detailed notification body, 2-3 paragraphs),
  "callToAction": string (specific next step requested),
  "urgency": "informational" | "action_required" | "urgent"
}`;

  return generateStructuredOutput(systemPrompt, userMessage, { temperature: 0.3 });
}

/**
 * Score and prioritize multiple interventions
 */
export async function prioritizeInterventions(
  interventions: GeneratedIntervention[],
  constraints: {
    maxSimultaneous: number;
    availableResources: 'limited' | 'moderate' | 'ample';
    urgencyBias: number; // 0-1, higher = favor urgent interventions
  }
): Promise<{
  prioritized: Array<{
    intervention: GeneratedIntervention;
    score: number;
    rank: number;
    reasoning: string;
  }>;
  excluded: Array<{
    intervention: GeneratedIntervention;
    reason: string;
  }>;
  sequencing: string;
}> {
  const systemPrompt = `You are an expert at portfolio management resource allocation. Prioritize and sequence interventions to maximize effectiveness within resource constraints.`;

  const userMessage = `Prioritize these interventions:

INTERVENTIONS:
${interventions.map((i, idx) => `
${idx + 1}. ${i.title}
   Type: ${i.type}
   Priority: ${i.priority}
   Success Probability: ${i.successProbability}%
   Deadline: ${i.deadlineDays} days
   Expected Outcome: ${i.expectedOutcome}
`).join('\n')}

CONSTRAINTS:
- Max Simultaneous: ${constraints.maxSimultaneous}
- Available Resources: ${constraints.availableResources}
- Urgency Bias: ${constraints.urgencyBias}

Return a JSON object with:
{
  "prioritized": [{ "intervention": GeneratedIntervention, "score": number, "rank": number, "reasoning": string }],
  "excluded": [{ "intervention": GeneratedIntervention, "reason": string }],
  "sequencing": string (recommended order and timing)
}`;

  return generateStructuredOutput(systemPrompt, userMessage, { temperature: 0.2 });
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildInterventionPrompt(input: InterventionGenerationInput): string {
  const { prediction, portfolioContext, constraints } = input;

  return `Generate an intervention plan for this breach prediction:

PREDICTION:
- ID: ${prediction.id}
- Covenant: ${prediction.covenantName} (${prediction.covenantType})
- Borrower: ${prediction.borrowerName}
- Facility: ${prediction.facilityName}

BREACH ANALYSIS:
- Breach Probability: ${prediction.breachProbability}%
- Days Until Breach: ${prediction.daysUntilBreach}
- Current Value: ${prediction.currentValue}
- Threshold: ${prediction.threshold}
- Headroom: ${prediction.headroomPercent}%
- Trend: ${prediction.trend} (rate: ${prediction.trendRate}/month)
- Risk Level: ${prediction.riskLevel}
- Impact Severity: ${prediction.impactSeverity}
- Cascade Risk: ${prediction.cascadeRisk ? 'Yes - may trigger other breaches' : 'No'}

CONTRIBUTING FACTORS:
${prediction.contributingFactors.map((f) => `- ${f.factor} (${f.category}): ${f.description} [${f.impact} impact, ${Math.round(f.weight * 100)}% weight]`).join('\n')}

LEADING INDICATORS:
${prediction.leadingIndicators.map((i) => `- ${i.name}: ${i.status} (value: ${i.value}, threshold: ${i.threshold}) - ${i.description}`).join('\n')}

AI ANALYSIS:
${prediction.aiSummary}

RECOMMENDED ACTIONS (from prediction):
${prediction.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

PORTFOLIO CONTEXT:
- Total Exposure: $${portfolioContext.totalExposure.toLocaleString()}
- Relationship Length: ${portfolioContext.relationshipLength} years
- Previous Waivers: ${portfolioContext.previousWaivers}
- Credit Rating: ${portfolioContext.creditRating}
- Lender Sentiment: ${portfolioContext.lenderSentiment}

${constraints ? `CONSTRAINTS:
- Max Interventions: ${constraints.maxInterventions || 'No limit'}
- Excluded Types: ${constraints.excludeTypes?.join(', ') || 'None'}
- Urgency Override: ${constraints.urgencyOverride || 'None'}` : ''}

Generate an intervention plan as a JSON object with:
{
  "primaryIntervention": GeneratedIntervention,
  "alternativeInterventions": GeneratedIntervention[],
  "rationale": string (why this primary intervention was chosen),
  "sequencing": string (how interventions should be sequenced),
  "riskAssessment": string (risks of the intervention plan),
  "successProbability": number (0-100)
}

Each GeneratedIntervention should have:
{
  "type": InterventionType,
  "priority": "low" | "medium" | "high" | "urgent",
  "title": string,
  "description": string,
  "rationale": string,
  "suggestedAction": string,
  "actionDetails": InterventionActionDetails (populated based on type),
  "optimalTiming": string,
  "deadlineDays": number,
  "expectedOutcome": string,
  "successProbability": number,
  "risks": string[]
}`;
}

/**
 * Convert a generated intervention to the full Intervention type
 */
export function createInterventionFromGenerated(
  generated: GeneratedIntervention,
  prediction: BreachPrediction
): Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date();
  const deadlineDate = new Date(now);
  deadlineDate.setDate(deadlineDate.getDate() + generated.deadlineDays);

  return {
    predictionId: prediction.id,
    type: generated.type,
    status: 'pending',
    priority: generated.priority,
    title: generated.title,
    description: generated.description,
    rationale: generated.rationale,
    borrowerId: prediction.borrowerId,
    borrowerName: prediction.borrowerName,
    facilityId: prediction.facilityId,
    facilityName: prediction.facilityName,
    suggestedAction: generated.suggestedAction,
    actionDetails: generated.actionDetails,
    optimalTiming: generated.optimalTiming,
    deadlineDate: deadlineDate.toISOString().split('T')[0],
    requiresApproval: generated.priority === 'urgent' || generated.type === 'amendment_draft' || generated.type === 'waiver_request',
    expectedOutcome: generated.expectedOutcome,
  };
}
