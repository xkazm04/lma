import Anthropic from '@anthropic-ai/sdk';
import type {
  Covenant,
  BreachPrediction,
  DashboardStats,
  FacilityAtRisk,
  UpcomingItem,
  CalendarEvent,
  Facility,
} from '@/app/features/compliance/lib/types';

const anthropic = new Anthropic();

// =============================================================================
// Compliance Agent Types
// =============================================================================

export type AgentIntentType =
  | 'covenant_risk_query'
  | 'waiver_request'
  | 'compliance_certificate'
  | 'facility_status'
  | 'deadline_query'
  | 'market_analysis'
  | 'anomaly_escalation'
  | 'general_compliance'
  | 'document_generation'
  | 'monitoring_status'
  | 'borrower_communication';

export interface AgentIntent {
  intent: AgentIntentType;
  confidence: number;
  entities: {
    facility_names?: string[];
    covenant_types?: string[];
    borrower_names?: string[];
    date_range?: { start?: string; end?: string };
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
    document_type?: string;
  };
  follow_up_questions?: string[];
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    intent?: AgentIntentType;
    sources?: string[];
    actions_taken?: string[];
    escalation_required?: boolean;
  };
}

export interface AgentContext {
  facilities: Facility[];
  covenants: Covenant[];
  predictions: Record<string, BreachPrediction>;
  dashboardStats: DashboardStats;
  facilitiesAtRisk: FacilityAtRisk[];
  upcomingItems: UpcomingItem[];
  calendarEvents: CalendarEvent[];
}

export interface AgentResponse {
  response: string;
  intent: AgentIntent;
  actions: AgentAction[];
  sources: string[];
  escalation_required: boolean;
  follow_up_suggestions: string[];
}

export interface AgentAction {
  type: 'generate_document' | 'schedule_reminder' | 'escalate' | 'update_status' | 'send_communication';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  data?: Record<string, unknown>;
}

export interface WaiverDraft {
  subject: string;
  content: string;
  facility_name: string;
  borrower_name: string;
  covenant_name: string;
  waiver_type: string;
  requested_period: {
    start: string;
    end: string;
  };
  justification: string;
  conditions: string[];
  precedent_references: string[];
}

export interface ComplianceCertificate {
  facility_name: string;
  borrower_name: string;
  period: string;
  certification_date: string;
  covenant_results: Array<{
    covenant_name: string;
    required_threshold: number;
    actual_value: number;
    status: 'pass' | 'fail';
    headroom_percentage: number;
  }>;
  officer_certification: string;
  additional_disclosures: string[];
}

export interface MonitoringAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affected_facilities: string[];
  recommended_actions: string[];
  requires_escalation: boolean;
  created_at: string;
}

// =============================================================================
// Intent Classification
// =============================================================================

/**
 * Classify user intent from natural language query
 */
export async function classifyIntent(
  userQuery: string,
  conversationHistory: AgentMessage[]
): Promise<AgentIntent> {
  const historyContext = conversationHistory
    .slice(-5) // Last 5 messages for context
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `You are a compliance intent classifier for a loan management system. Analyze the user query and classify the intent.

CONVERSATION HISTORY:
${historyContext || 'No prior context'}

CURRENT USER QUERY:
${userQuery}

AVAILABLE INTENT TYPES:
- covenant_risk_query: Questions about covenant breaches, risks, oil prices affecting covenants, market conditions impact
- waiver_request: Requests to draft waivers, review waiver precedents, extend waivers
- compliance_certificate: Generate or review compliance certificates
- facility_status: Questions about specific facility status, performance
- deadline_query: Questions about upcoming deadlines, calendar events
- market_analysis: Questions about market trends, benchmarks, industry comparisons
- anomaly_escalation: Reporting or handling compliance anomalies
- general_compliance: General compliance questions or guidance
- document_generation: Requests to generate compliance documents
- monitoring_status: Questions about monitoring status, routine checks
- borrower_communication: Draft communications to borrowers

Respond in JSON format:
{
  "intent": "<intent_type>",
  "confidence": <0-100>,
  "entities": {
    "facility_names": ["list of mentioned facilities"],
    "covenant_types": ["leverage_ratio", "interest_coverage", etc.],
    "borrower_names": ["list of mentioned borrowers"],
    "date_range": { "start": "ISO date or null", "end": "ISO date or null" },
    "risk_level": "low|medium|high|critical or null",
    "document_type": "type of document if applicable"
  },
  "follow_up_questions": ["questions to clarify if confidence < 70"]
}`,
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
    return JSON.parse(jsonMatch[0]) as AgentIntent;
  } catch {
    return {
      intent: 'general_compliance',
      confidence: 50,
      entities: {},
      follow_up_questions: ['Could you please clarify your question?'],
    };
  }
}

// =============================================================================
// Agent Query Processing
// =============================================================================

/**
 * Process a natural language query and generate a response with actions
 */
export async function processAgentQuery(
  userQuery: string,
  context: AgentContext,
  conversationHistory: AgentMessage[]
): Promise<AgentResponse> {
  // First, classify the intent
  const intent = await classifyIntent(userQuery, conversationHistory);

  // Build context string based on intent
  const contextString = buildContextForIntent(intent, context);

  const historyContext = conversationHistory
    .slice(-10)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are an autonomous compliance agent for LoanOS, acting as a tireless compliance officer. You help users manage loan compliance through natural language queries.

CONVERSATION HISTORY:
${historyContext || 'Start of conversation'}

USER QUERY:
${userQuery}

DETECTED INTENT: ${intent.intent} (confidence: ${intent.confidence}%)
EXTRACTED ENTITIES: ${JSON.stringify(intent.entities)}

RELEVANT CONTEXT:
${contextString}

YOUR CAPABILITIES:
1. Answer questions about covenant risks given market conditions (oil prices, interest rates, etc.)
2. Draft waiver requests based on similar past approvals
3. Generate compliance certificates automatically
4. Monitor for anomalies and escalate true issues
5. Schedule borrower communications
6. Provide market analysis and benchmarks
7. Track deadlines and obligations

RESPONSE GUIDELINES:
- Be specific and cite data from the context
- Recommend concrete actions when appropriate
- Escalate truly critical issues (>75% breach probability, active breaches)
- Reference specific facilities, covenants, and numbers
- Suggest follow-up actions the user might want to take

Respond in JSON format:
{
  "response": "<your detailed natural language response to the user>",
  "actions": [
    {
      "type": "generate_document|schedule_reminder|escalate|update_status|send_communication",
      "description": "<what this action does>",
      "status": "pending",
      "data": { <relevant data for the action> }
    }
  ],
  "sources": ["<list of data sources used: facility names, covenant IDs, etc.>"],
  "escalation_required": <true if this needs immediate management attention>,
  "follow_up_suggestions": ["<suggested follow-up questions or actions>"]
}`,
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
      response: parsed.response || 'I apologize, but I could not process your request.',
      intent,
      actions: parsed.actions || [],
      sources: parsed.sources || [],
      escalation_required: parsed.escalation_required || false,
      follow_up_suggestions: parsed.follow_up_suggestions || [],
    };
  } catch {
    return {
      response: 'I encountered an issue processing your request. Please try rephrasing your question.',
      intent,
      actions: [],
      sources: [],
      escalation_required: false,
      follow_up_suggestions: ['Could you please rephrase your question?'],
    };
  }
}

/**
 * Build context string based on the detected intent
 */
function buildContextForIntent(intent: AgentIntent, context: AgentContext): string {
  const parts: string[] = [];

  // Always include dashboard stats
  parts.push(`DASHBOARD OVERVIEW:
- Total Facilities: ${context.dashboardStats.total_facilities}
- In Compliance: ${context.dashboardStats.facilities_in_compliance}
- In Waiver: ${context.dashboardStats.facilities_in_waiver}
- In Default: ${context.dashboardStats.facilities_in_default}
- Upcoming Deadlines (7 days): ${context.dashboardStats.upcoming_deadlines_7_days}
- Upcoming Deadlines (30 days): ${context.dashboardStats.upcoming_deadlines_30_days}
- Overdue Items: ${context.dashboardStats.overdue_items}
- Pending Waivers: ${context.dashboardStats.pending_waivers}`);

  // Include facilities at risk for risk-related intents
  if (['covenant_risk_query', 'anomaly_escalation', 'monitoring_status', 'facility_status'].includes(intent.intent)) {
    parts.push(`\nFACILITIES AT RISK:
${context.facilitiesAtRisk.map((f) => `- ${f.facility_name} (${f.borrower_name}): ${f.risk_reason}, ${f.covenant_name}, headroom: ${f.headroom_percentage !== null ? f.headroom_percentage + '%' : 'N/A'}`).join('\n')}`);
  }

  // Include covenant details for covenant-related intents
  if (['covenant_risk_query', 'waiver_request', 'compliance_certificate'].includes(intent.intent)) {
    // Filter covenants based on entities
    let relevantCovenants = context.covenants;
    if (intent.entities.facility_names?.length) {
      relevantCovenants = relevantCovenants.filter((c) =>
        intent.entities.facility_names?.some((fn) =>
          c.facility_name.toLowerCase().includes(fn.toLowerCase())
        )
      );
    }
    if (intent.entities.covenant_types?.length) {
      relevantCovenants = relevantCovenants.filter((c) =>
        intent.entities.covenant_types?.includes(c.covenant_type)
      );
    }

    parts.push(`\nCOVENANT DETAILS:
${relevantCovenants.map((c) => {
      const prediction = context.predictions[c.id];
      return `- ${c.name} (${c.facility_name}):
  Type: ${c.covenant_type}, Threshold: ${c.threshold_type} ${c.current_threshold}
  Status: ${c.status}, Latest Test: ${c.latest_test.test_result} (${c.latest_test.calculated_ratio})
  Headroom: ${c.latest_test.headroom_percentage}%
  ${prediction ? `Risk: ${prediction.overall_risk_level} (${prediction.breach_probability_2q}% breach prob 2Q)` : ''}`;
    }).join('\n')}`);
  }

  // Include deadlines for deadline-related intents
  if (['deadline_query', 'monitoring_status'].includes(intent.intent)) {
    parts.push(`\nUPCOMING DEADLINES:
${context.upcomingItems.map((item) => `- ${item.date}: ${item.title} (${item.facility_name}) - ${item.status}`).join('\n')}`);
  }

  // Include facility list for facility queries
  if (intent.intent === 'facility_status') {
    const filteredFacilities = intent.entities.facility_names?.length
      ? context.facilities.filter((f) =>
          intent.entities.facility_names?.some((fn) =>
            f.facility_name.toLowerCase().includes(fn.toLowerCase())
          )
        )
      : context.facilities;

    parts.push(`\nFACILITY DETAILS:
${filteredFacilities.map((f) => `- ${f.facility_name} (${f.borrower_name}):
  Type: ${f.facility_type}, Status: ${f.status}
  Commitment: ${formatCurrency(f.commitment_amount)} ${f.currency}
  Maturity: ${f.maturity_date}
  Stats: ${f.stats.total_obligations} obligations, ${f.stats.upcoming_30_days} upcoming, ${f.stats.overdue} overdue
  Covenants: ${f.stats.total_covenants} total, ${f.stats.covenants_at_risk} at risk`).join('\n')}`);
  }

  return parts.join('\n\n');
}

// =============================================================================
// Document Generation
// =============================================================================

/**
 * Generate a waiver request draft based on context and similar past approvals
 */
export async function generateWaiverDraft(
  facilityName: string,
  covenantName: string,
  context: AgentContext,
  additionalContext?: string
): Promise<WaiverDraft> {
  // Find the relevant covenant and facility
  const covenant = context.covenants.find(
    (c) => c.facility_name.toLowerCase().includes(facilityName.toLowerCase()) &&
           c.name.toLowerCase().includes(covenantName.toLowerCase())
  );

  const facility = context.facilities.find(
    (f) => f.facility_name.toLowerCase().includes(facilityName.toLowerCase())
  );

  if (!covenant || !facility) {
    throw new Error(`Could not find covenant "${covenantName}" for facility "${facilityName}"`);
  }

  const prediction = context.predictions[covenant.id];

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `You are a compliance expert drafting a waiver request for a loan covenant breach.

FACILITY DETAILS:
- Name: ${facility.facility_name}
- Borrower: ${facility.borrower_name}
- Type: ${facility.facility_type}
- Commitment: ${formatCurrency(facility.commitment_amount)} ${facility.currency}
- Maturity: ${facility.maturity_date}

COVENANT DETAILS:
- Name: ${covenant.name}
- Type: ${covenant.covenant_type}
- Threshold: ${covenant.threshold_type} ${covenant.current_threshold}
- Current Value: ${covenant.latest_test.calculated_ratio}
- Headroom: ${covenant.latest_test.headroom_percentage}%
- Status: ${covenant.status}

${prediction ? `RISK ASSESSMENT:
- Risk Level: ${prediction.overall_risk_level}
- 2Q Breach Probability: ${prediction.breach_probability_2q}%
- Contributing Factors: ${prediction.contributing_factors.map((f) => f.factor).join(', ')}
- Summary: ${prediction.summary}` : ''}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}` : ''}

Generate a professional waiver request. Respond in JSON format:
{
  "subject": "<email subject line>",
  "content": "<full waiver request letter content>",
  "facility_name": "${facility.facility_name}",
  "borrower_name": "${facility.borrower_name}",
  "covenant_name": "${covenant.name}",
  "waiver_type": "<covenant_waiver|deadline_extension|consent|amendment>",
  "requested_period": {
    "start": "<start date ISO>",
    "end": "<end date ISO>"
  },
  "justification": "<brief justification for the waiver>",
  "conditions": ["<list of suggested conditions for approval>"],
  "precedent_references": ["<reference to similar past waivers if known>"]
}`,
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
    return JSON.parse(jsonMatch[0]) as WaiverDraft;
  } catch {
    throw new Error('Failed to generate waiver draft');
  }
}

/**
 * Generate a compliance certificate
 */
export async function generateComplianceCertificate(
  facilityName: string,
  period: string,
  context: AgentContext
): Promise<ComplianceCertificate> {
  const facility = context.facilities.find(
    (f) => f.facility_name.toLowerCase().includes(facilityName.toLowerCase())
  );

  if (!facility) {
    throw new Error(`Could not find facility "${facilityName}"`);
  }

  const facilityCovenants = context.covenants.filter(
    (c) => c.facility_id === facility.id
  );

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages: [
      {
        role: 'user',
        content: `Generate a compliance certificate for the following facility:

FACILITY: ${facility.facility_name}
BORROWER: ${facility.borrower_name}
PERIOD: ${period}
CERTIFICATION DATE: ${new Date().toISOString().split('T')[0]}

COVENANT TEST RESULTS:
${facilityCovenants.map((c) => `- ${c.name}: Required ${c.threshold_type} ${c.current_threshold}, Actual ${c.latest_test.calculated_ratio}, ${c.latest_test.test_result.toUpperCase()}, Headroom ${c.latest_test.headroom_percentage}%`).join('\n')}

Generate a formal compliance certificate. Respond in JSON format:
{
  "facility_name": "${facility.facility_name}",
  "borrower_name": "${facility.borrower_name}",
  "period": "${period}",
  "certification_date": "<ISO date>",
  "covenant_results": [
    {
      "covenant_name": "<name>",
      "required_threshold": <number>,
      "actual_value": <number>,
      "status": "pass|fail",
      "headroom_percentage": <number>
    }
  ],
  "officer_certification": "<formal certification statement>",
  "additional_disclosures": ["<any required disclosures>"]
}`,
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
    return JSON.parse(jsonMatch[0]) as ComplianceCertificate;
  } catch {
    throw new Error('Failed to generate compliance certificate');
  }
}

// =============================================================================
// Monitoring & Escalation
// =============================================================================

/**
 * Analyze current state and generate monitoring alerts
 */
export async function analyzeAndGenerateAlerts(
  context: AgentContext
): Promise<MonitoringAlert[]> {
  const alerts: MonitoringAlert[] = [];

  // Check for critical predictions
  for (const covenant of context.covenants) {
    const prediction = context.predictions[covenant.id];
    if (prediction) {
      if (prediction.overall_risk_level === 'critical' || prediction.breach_probability_2q > 75) {
        alerts.push({
          id: `alert-${covenant.id}-${Date.now()}`,
          severity: 'critical',
          title: `Critical Risk: ${covenant.name}`,
          description: prediction.summary,
          affected_facilities: [covenant.facility_name],
          recommended_actions: prediction.recommendations,
          requires_escalation: true,
          created_at: new Date().toISOString(),
        });
      } else if (prediction.overall_risk_level === 'high' || prediction.breach_probability_2q > 50) {
        alerts.push({
          id: `alert-${covenant.id}-${Date.now()}`,
          severity: 'warning',
          title: `High Risk: ${covenant.name}`,
          description: prediction.summary,
          affected_facilities: [covenant.facility_name],
          recommended_actions: prediction.recommendations,
          requires_escalation: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  // Check for facilities at risk
  for (const facility of context.facilitiesAtRisk) {
    if (facility.headroom_percentage !== null && facility.headroom_percentage < 10) {
      alerts.push({
        id: `alert-facility-${facility.facility_id}-${Date.now()}`,
        severity: 'warning',
        title: `Low Headroom: ${facility.facility_name}`,
        description: `${facility.covenant_name} has only ${facility.headroom_percentage}% headroom. Reason: ${facility.risk_reason}`,
        affected_facilities: [facility.facility_name],
        recommended_actions: [
          'Review borrower financials',
          'Schedule call with relationship manager',
          'Prepare contingency plans',
        ],
        requires_escalation: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Check for overdue items
  if (context.dashboardStats.overdue_items > 0) {
    alerts.push({
      id: `alert-overdue-${Date.now()}`,
      severity: 'warning',
      title: `${context.dashboardStats.overdue_items} Overdue Compliance Items`,
      description: `There are ${context.dashboardStats.overdue_items} overdue compliance items that require immediate attention.`,
      affected_facilities: context.upcomingItems
        .filter((i) => i.status === 'overdue')
        .map((i) => i.facility_name),
      recommended_actions: [
        'Review overdue items in calendar',
        'Contact borrowers for missing submissions',
        'Consider escalation if items remain overdue',
      ],
      requires_escalation: context.dashboardStats.overdue_items > 3,
      created_at: new Date().toISOString(),
    });
  }

  return alerts;
}

/**
 * Generate a borrower communication draft
 */
export async function draftBorrowerCommunication(
  facilityName: string,
  purpose: string,
  context: AgentContext
): Promise<{ subject: string; content: string; recipients: string[] }> {
  const facility = context.facilities.find(
    (f) => f.facility_name.toLowerCase().includes(facilityName.toLowerCase())
  );

  if (!facility) {
    throw new Error(`Could not find facility "${facilityName}"`);
  }

  const facilityCovenants = context.covenants.filter((c) => c.facility_id === facility.id);
  const facilityAtRisk = context.facilitiesAtRisk.find((f) => f.facility_id === facility.id);
  const upcomingDeadlines = context.upcomingItems.filter(
    (i) => i.facility_name.toLowerCase().includes(facilityName.toLowerCase())
  );

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Draft a professional communication to a borrower.

PURPOSE: ${purpose}

FACILITY: ${facility.facility_name}
BORROWER: ${facility.borrower_name}
STATUS: ${facility.status}

COVENANT STATUS:
${facilityCovenants.map((c) => `- ${c.name}: ${c.status}, Headroom: ${c.latest_test.headroom_percentage}%`).join('\n')}

${facilityAtRisk ? `AT RISK: ${facilityAtRisk.risk_reason}` : ''}

UPCOMING DEADLINES:
${upcomingDeadlines.map((d) => `- ${d.date}: ${d.title}`).join('\n') || 'None in the next 14 days'}

Generate a professional, clear communication. Respond in JSON format:
{
  "subject": "<email subject>",
  "content": "<full email content>",
  "recipients": ["<list of suggested recipient roles>"]
}`,
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
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Failed to draft communication');
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * Get example queries for the agent
 */
export function getExampleQueries(): string[] {
  return [
    'Which facilities have covenants that might trip given current oil prices?',
    'Draft a waiver request for Delta Manufacturing based on similar past approvals',
    'What are the upcoming compliance deadlines for the next 7 days?',
    'Show me all facilities at risk of covenant breach',
    'Generate a compliance certificate for ABC Holdings for Q4 2024',
    'Which borrowers should I schedule communications with this week?',
    'Analyze the leverage ratio trends across my portfolio',
    'Are there any critical issues that need immediate escalation?',
    'Draft a communication to XYZ Corporation about their upcoming covenant test',
    'What is the breach probability for the Sigma Holdings interest coverage covenant?',
  ];
}
