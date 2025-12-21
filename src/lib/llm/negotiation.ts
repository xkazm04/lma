import { generateStructuredOutput } from './client';
import type { ImpactAnalysisResult, MarketSuggestion, NegotiationTerm } from '@/types';

const MARKET_SUGGESTION_SYSTEM_PROMPT = `You are an expert in syndicated loan markets and term negotiation. Your role is to provide market-based suggestions for loan terms based on current market conditions and historical precedent.

When providing suggestions:
1. Reference market benchmarks and comparable transactions
2. Consider the specific context (deal size, borrower profile, facility type)
3. Provide actionable ranges rather than single values
4. Explain the rationale behind each suggestion
5. Note any market trends that may affect the term

Always respond with valid JSON in the specified format.`;

const IMPACT_ANALYSIS_SYSTEM_PROMPT = `You are an expert financial analyst specializing in loan structures and covenant analysis. Your role is to analyze the impact of proposed term changes on the overall deal structure.

When analyzing impacts:
1. Consider financial implications (cost to borrower, risk to lender)
2. Identify related terms that may be affected
3. Assess compliance complexity
4. Evaluate market positioning
5. Note any potential issues or considerations

Always respond with valid JSON in the specified format.`;

const COUNTER_SUGGESTION_SYSTEM_PROMPT = `You are an expert negotiation advisor for syndicated loans. Your role is to suggest potential counter-proposals that balance the interests of both parties.

When suggesting counters:
1. Find middle ground between current and proposed values
2. Suggest alternative structures that achieve similar goals
3. Identify trade-offs that could make the proposal more acceptable
4. Consider the negotiation dynamics and party relationships
5. Provide rationale that could be used in discussions

Always respond with valid JSON in the specified format.`;

export interface MarketSuggestionRequest {
  term: NegotiationTerm;
  dealContext: {
    dealType: string;
    dealSize?: number;
    currency?: string;
    borrowerType?: string;
    facilityType?: string;
  };
}

export async function getMarketSuggestions(
  request: MarketSuggestionRequest
): Promise<MarketSuggestion[]> {
  const userMessage = `
Provide market suggestions for the following loan term:

Term: ${request.term.term_label}
Type: ${request.term.value_type}
Current Value: ${JSON.stringify(request.term.current_value)}

Deal Context:
- Deal Type: ${request.dealContext.dealType}
- Deal Size: ${request.dealContext.dealSize ? `${request.dealContext.currency || 'USD'} ${request.dealContext.dealSize.toLocaleString()}` : 'Not specified'}
- Borrower Type: ${request.dealContext.borrowerType || 'Not specified'}
- Facility Type: ${request.dealContext.facilityType || 'Not specified'}

Please provide 2-3 market-based suggestions in the following JSON format:
{
  "suggestions": [
    {
      "suggested_value": <the suggested value>,
      "suggested_value_text": "<human-readable version>",
      "rationale": "<explanation of why this is appropriate>",
      "confidence": "high" | "medium" | "low",
      "source": "<market benchmark or precedent>",
      "market_percentile": <0-100, where the suggestion falls in market distribution>
    }
  ]
}
`;

  const response = await generateStructuredOutput<{ suggestions: MarketSuggestion[] }>(
    MARKET_SUGGESTION_SYSTEM_PROMPT,
    userMessage,
    { temperature: 0.4 }
  );

  return response.suggestions;
}

export interface ImpactAnalysisRequest {
  term: NegotiationTerm;
  proposedValue: unknown;
  relatedTerms: NegotiationTerm[];
  dealContext: {
    dealType: string;
    dealSize?: number;
    currency?: string;
  };
}

export async function analyzeTermImpact(
  request: ImpactAnalysisRequest
): Promise<ImpactAnalysisResult> {
  const userMessage = `
Analyze the impact of the following proposed term change:

Term: ${request.term.term_label}
Type: ${request.term.value_type}
Current Value: ${JSON.stringify(request.term.current_value)}
Proposed Value: ${JSON.stringify(request.proposedValue)}

Related Terms in the Deal:
${request.relatedTerms.map(t => `- ${t.term_label}: ${JSON.stringify(t.current_value)}`).join('\n')}

Deal Context:
- Deal Type: ${request.dealContext.dealType}
- Deal Size: ${request.dealContext.dealSize ? `${request.dealContext.currency || 'USD'} ${request.dealContext.dealSize.toLocaleString()}` : 'Not specified'}

Please analyze the impact and respond in the following JSON format:
{
  "summary": "<brief summary of the overall impact>",
  "risk_level": "low" | "medium" | "high",
  "financial_impact": {
    "borrower_cost_change": "<description of cost impact>",
    "lender_risk_change": "<description of risk impact>",
    "estimated_basis_points": <number if applicable, null otherwise>
  },
  "affected_terms": [
    {
      "term_id": "<id of affected term>",
      "term_label": "<name of affected term>",
      "impact_description": "<how it's affected>"
    }
  ],
  "compliance_considerations": [
    "<any regulatory or compliance issues>"
  ],
  "recommendations": [
    "<suggested actions or considerations>"
  ]
}
`;

  const response = await generateStructuredOutput<ImpactAnalysisResult>(
    IMPACT_ANALYSIS_SYSTEM_PROMPT,
    userMessage,
    { temperature: 0.3 }
  );

  return response;
}

export interface CounterSuggestionRequest {
  term: NegotiationTerm;
  proposedValue: unknown;
  proposerParty: string;
  responderParty: string;
}

export interface CounterSuggestion {
  counter_value: unknown;
  counter_value_text: string;
  rationale: string;
  compromise_type: 'middle_ground' | 'alternative_structure' | 'conditional' | 'phased';
  acceptability_score: number; // 1-10
}

export async function suggestCounterProposals(
  request: CounterSuggestionRequest
): Promise<CounterSuggestion[]> {
  const userMessage = `
Suggest counter-proposals for the following negotiation:

Term: ${request.term.term_label}
Type: ${request.term.value_type}
Current Value: ${JSON.stringify(request.term.current_value)}
Proposed Value: ${JSON.stringify(request.proposedValue)}

Proposing Party: ${request.proposerParty}
Responding Party: ${request.responderParty}

Please suggest 2-3 potential counter-proposals in the following JSON format:
{
  "counters": [
    {
      "counter_value": <the counter value>,
      "counter_value_text": "<human-readable version>",
      "rationale": "<explanation of the compromise>",
      "compromise_type": "middle_ground" | "alternative_structure" | "conditional" | "phased",
      "acceptability_score": <1-10, likelihood of being accepted>
    }
  ]
}
`;

  const response = await generateStructuredOutput<{ counters: CounterSuggestion[] }>(
    COUNTER_SUGGESTION_SYSTEM_PROMPT,
    userMessage,
    { temperature: 0.5 }
  );

  return response.counters;
}

export interface NegotiationSummaryRequest {
  terms: NegotiationTerm[];
  history: Array<{
    termLabel: string;
    changes: Array<{
      from: unknown;
      to: unknown;
      party: string;
      date: string;
    }>;
  }>;
}

export interface NegotiationSummary {
  overall_status: string;
  key_sticking_points: Array<{
    term: string;
    issue: string;
    parties_positions: Record<string, string>;
  }>;
  progress_metrics: {
    terms_agreed: number;
    terms_in_discussion: number;
    terms_pending: number;
  };
  recommendations: string[];
}

export async function summarizeNegotiation(
  request: NegotiationSummaryRequest
): Promise<NegotiationSummary> {
  const userMessage = `
Summarize the current state of this loan negotiation:

Terms Overview:
${request.terms.map(t => `- ${t.term_label}: ${t.negotiation_status} (${JSON.stringify(t.current_value)})`).join('\n')}

Negotiation History:
${request.history.map(h => `
${h.termLabel}:
${h.changes.map(c => `  - ${c.party} changed from ${JSON.stringify(c.from)} to ${JSON.stringify(c.to)} on ${c.date}`).join('\n')}
`).join('\n')}

Please provide a summary in the following JSON format:
{
  "overall_status": "<brief assessment of negotiation progress>",
  "key_sticking_points": [
    {
      "term": "<term name>",
      "issue": "<what's being disputed>",
      "parties_positions": {
        "<party1>": "<their position>",
        "<party2>": "<their position>"
      }
    }
  ],
  "progress_metrics": {
    "terms_agreed": <number>,
    "terms_in_discussion": <number>,
    "terms_pending": <number>
  },
  "recommendations": [
    "<suggested next steps>"
  ]
}
`;

  const response = await generateStructuredOutput<NegotiationSummary>(
    `You are an expert negotiation analyst for syndicated loans. Provide objective assessments of negotiation progress and actionable recommendations.`,
    userMessage,
    { temperature: 0.3 }
  );

  return response;
}
