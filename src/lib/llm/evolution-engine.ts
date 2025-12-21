/**
 * Autonomous Document Evolution Engine LLM Module
 *
 * AI-powered analysis for monitoring market conditions, predicting document evolution needs,
 * and generating proactive amendment suggestions.
 */

import { generateStructuredOutput } from './client';
import type {
  AmendmentSuggestion,
  AmendmentSuggestionType,
  AmendmentTrigger,
  SuggestedChange,
  NegotiationPoint,
  MarketConditionsSnapshot,
  CovenantHeadroomAnalysis,
  RegulatoryAnnouncement,
  FacilityEvolutionStatus,
} from '@/app/features/documents/sub_Evolution/lib/types';

// =============================================================================
// System Prompts
// =============================================================================

const MARKET_ANALYSIS_SYSTEM_PROMPT = `You are an expert financial markets analyst specializing in syndicated loan markets, interest rate movements, and credit conditions. Your task is to analyze market data and identify conditions that may warrant loan document amendments.

Consider the following factors:
1. Interest rate environment and trajectory
2. Credit spread movements across rating categories
3. Regulatory developments affecting loan documentation
4. Economic indicators and their impact on borrowers
5. Industry-specific trends and risks

Provide actionable insights that help identify when documents should be proactively amended to avoid problems.

Always respond with valid JSON matching the expected schema.`;

const SUGGESTION_GENERATION_SYSTEM_PROMPT = `You are an expert loan documentation specialist with deep knowledge of syndicated credit facilities, covenant structures, and amendment practices. Your task is to generate proactive amendment suggestions that help financial institutions avoid problems before they occur.

When generating amendment suggestions:
1. Consider market conditions, covenant headroom, and regulatory requirements
2. Draft specific language changes using LSTA best practices
3. Anticipate counterparty concerns and prepare negotiation strategies
4. Assess risks of not acting and provide clear business rationale
5. Prioritize suggestions based on urgency and impact

Your suggestions should be:
- Actionable and specific
- Supported by data and market precedent
- Legally sound and commercially reasonable
- Balanced between lender protection and borrower flexibility

Always respond with valid JSON matching the expected schema.`;

const COVENANT_ANALYSIS_SYSTEM_PROMPT = `You are an expert credit analyst specializing in financial covenant analysis and breach prediction. Your task is to analyze covenant performance, predict potential breaches, and recommend proactive remediation strategies.

Analyze:
1. Current headroom and trend direction
2. Historical test performance patterns
3. External factors affecting covenant metrics
4. Industry benchmarks and peer comparisons
5. Structural features (cure rights, baskets, add-backs)

Identify early warning signs and recommend preemptive actions to maintain compliance.

Always respond with valid JSON matching the expected schema.`;

const COMMUNICATION_DRAFT_SYSTEM_PROMPT = `You are an expert relationship manager specializing in borrower/lender communications in the syndicated loan market. Your task is to draft professional, constructive communications that initiate amendment discussions while maintaining positive relationships.

Draft communications that:
1. Are professional and relationship-preserving
2. Clearly articulate the rationale for proposed changes
3. Highlight mutual benefits
4. Provide flexibility for discussion
5. Follow market conventions and best practices

Tone should be collaborative, not confrontational.

Always respond with valid JSON matching the expected schema.`;

// =============================================================================
// Analysis Functions
// =============================================================================

/**
 * Analyze market conditions and identify amendment triggers
 */
export async function analyzeMarketConditions(
  marketData: MarketConditionsSnapshot,
  facilityContext: {
    facilityName: string;
    borrowerName: string;
    borrowerIndustry: string;
    facilityType: string;
    baseRate: string;
    currentMargin: number;
    maturityDate: string;
    totalCommitment: number;
  }
): Promise<{
  triggers: AmendmentTrigger[];
  riskAssessment: {
    interestRateRisk: 'low' | 'medium' | 'high';
    creditRisk: 'low' | 'medium' | 'high';
    regulatoryRisk: 'low' | 'medium' | 'high';
    overallRisk: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
  summary: string;
}> {
  const userMessage = `Analyze these market conditions for potential amendment triggers:

MARKET CONDITIONS:
${JSON.stringify(marketData, null, 2)}

FACILITY CONTEXT:
- Facility: ${facilityContext.facilityName}
- Borrower: ${facilityContext.borrowerName}
- Industry: ${facilityContext.borrowerIndustry}
- Facility Type: ${facilityContext.facilityType}
- Base Rate: ${facilityContext.baseRate}
- Current Margin: ${facilityContext.currentMargin} bps
- Maturity: ${facilityContext.maturityDate}
- Commitment: $${facilityContext.totalCommitment.toLocaleString()}

Identify:
1. Any market conditions that should trigger amendment discussions
2. Risk assessment for this facility
3. Specific recommendations
4. Summary of key findings

Return JSON:
{
  "triggers": [
    {
      "type": "market_condition" | "regulatory" | "time_based",
      "description": "string",
      "indicator": "string",
      "currentValue": "string or number",
      "threshold": "string or number",
      "source": "string",
      "triggeredAt": "ISO timestamp"
    }
  ],
  "riskAssessment": {
    "interestRateRisk": "low" | "medium" | "high",
    "creditRisk": "low" | "medium" | "high",
    "regulatoryRisk": "low" | "medium" | "high",
    "overallRisk": "low" | "medium" | "high"
  },
  "recommendations": ["string"],
  "summary": "string"
}`;

  return generateStructuredOutput(MARKET_ANALYSIS_SYSTEM_PROMPT, userMessage, {
    temperature: 0.3,
    maxTokens: 4096,
  });
}

/**
 * Analyze covenant headroom and predict risk trajectory
 */
export async function analyzeCovenantRisk(
  covenants: CovenantHeadroomAnalysis[],
  facilityContext: {
    facilityName: string;
    borrowerName: string;
    borrowerIndustry: string;
  },
  marketConditions?: {
    economicOutlook: string;
    industryTrends: string;
  }
): Promise<{
  atRiskCovenants: Array<{
    covenantId: string;
    covenantName: string;
    riskLevel: 'safe' | 'comfortable' | 'tight' | 'at_risk' | 'breached';
    projectedBreachDate: string | null;
    driverAnalysis: string;
    recommendations: string[];
  }>;
  overallCovenantHealth: {
    score: number;
    trend: 'improving' | 'stable' | 'deteriorating';
    summary: string;
  };
  triggers: AmendmentTrigger[];
  prioritizedActions: string[];
}> {
  const userMessage = `Analyze covenant risk for this facility:

COVENANTS:
${JSON.stringify(covenants, null, 2)}

FACILITY CONTEXT:
- Facility: ${facilityContext.facilityName}
- Borrower: ${facilityContext.borrowerName}
- Industry: ${facilityContext.borrowerIndustry}

${marketConditions ? `MARKET CONDITIONS:
- Economic Outlook: ${marketConditions.economicOutlook}
- Industry Trends: ${marketConditions.industryTrends}` : ''}

Analyze each covenant and identify:
1. Covenants at risk with projected breach timing
2. Root cause analysis for deteriorating covenants
3. Overall covenant health assessment
4. Triggers for amendment discussions
5. Prioritized remediation actions

Return JSON:
{
  "atRiskCovenants": [
    {
      "covenantId": "string",
      "covenantName": "string",
      "riskLevel": "safe" | "comfortable" | "tight" | "at_risk" | "breached",
      "projectedBreachDate": "ISO date or null",
      "driverAnalysis": "string",
      "recommendations": ["string"]
    }
  ],
  "overallCovenantHealth": {
    "score": 0-100,
    "trend": "improving" | "stable" | "deteriorating",
    "summary": "string"
  },
  "triggers": [...],
  "prioritizedActions": ["string"]
}`;

  return generateStructuredOutput(COVENANT_ANALYSIS_SYSTEM_PROMPT, userMessage, {
    temperature: 0.3,
    maxTokens: 4096,
  });
}

/**
 * Generate a proactive amendment suggestion
 */
export async function generateAmendmentSuggestion(
  facilityId: string,
  documentId: string,
  suggestionType: AmendmentSuggestionType,
  context: {
    facilityName: string;
    borrowerName: string;
    currentTerms: Record<string, unknown>;
    triggers: AmendmentTrigger[];
    marketConditions?: MarketConditionsSnapshot;
    covenantAnalysis?: CovenantHeadroomAnalysis[];
    additionalContext?: string;
  }
): Promise<Omit<AmendmentSuggestion, 'id' | 'status' | 'createdAt' | 'updatedAt'>> {
  const userMessage = `Generate a proactive amendment suggestion:

SUGGESTION TYPE: ${suggestionType}

FACILITY CONTEXT:
- Facility ID: ${facilityId}
- Document ID: ${documentId}
- Facility Name: ${context.facilityName}
- Borrower: ${context.borrowerName}
- Current Terms: ${JSON.stringify(context.currentTerms, null, 2)}

TRIGGERS:
${JSON.stringify(context.triggers, null, 2)}

${context.marketConditions ? `MARKET CONDITIONS:
${JSON.stringify(context.marketConditions, null, 2)}` : ''}

${context.covenantAnalysis ? `COVENANT ANALYSIS:
${JSON.stringify(context.covenantAnalysis, null, 2)}` : ''}

${context.additionalContext || ''}

Generate a comprehensive amendment suggestion including:
1. Clear title and description
2. Business rationale
3. Specific suggested changes with draft language
4. Negotiation points and strategies
5. Risk assessment if not acted upon
6. Timeline and priority

Return JSON:
{
  "facilityId": "${facilityId}",
  "documentId": "${documentId}",
  "type": "${suggestionType}",
  "priority": "low" | "medium" | "high" | "urgent",
  "title": "string",
  "description": "string",
  "rationale": "string",
  "triggerConditions": [...],
  "suggestedChanges": [
    {
      "field": "string",
      "category": "string",
      "currentValue": "string or number",
      "suggestedValue": "string or number",
      "rationale": "string",
      "impact": {
        "financial": "string",
        "operational": "string",
        "legal": "string"
      },
      "draftLanguage": "string",
      "clauseReference": "string"
    }
  ],
  "negotiationPoints": [
    {
      "title": "string",
      "ourPosition": "string",
      "anticipatedCounterposition": "string",
      "fallbackPosition": "string",
      "priority": "must_have" | "important" | "nice_to_have",
      "supportingArguments": ["string"],
      "marketPrecedent": "string"
    }
  ],
  "riskIfIgnored": {
    "likelihood": "low" | "medium" | "high",
    "impact": "minimal" | "moderate" | "significant" | "severe",
    "description": "string"
  },
  "estimatedTimeline": "string",
  "confidence": 0.0-1.0
}`;

  return generateStructuredOutput(SUGGESTION_GENERATION_SYSTEM_PROMPT, userMessage, {
    temperature: 0.4,
    maxTokens: 8192,
  });
}

/**
 * Analyze regulatory announcements for document impact
 */
export async function analyzeRegulatoryImpact(
  announcement: RegulatoryAnnouncement,
  facilityContext: {
    facilityName: string;
    documentType: string;
    currentDefinitions: Record<string, string>;
    jurisdiction: string;
  }
): Promise<{
  isRelevant: boolean;
  relevanceScore: number;
  affectedClauses: string[];
  requiredChanges: SuggestedChange[];
  complianceDeadline: string | null;
  actionRequired: boolean;
  summary: string;
}> {
  const userMessage = `Analyze this regulatory announcement for document impact:

REGULATORY ANNOUNCEMENT:
${JSON.stringify(announcement, null, 2)}

FACILITY CONTEXT:
- Facility: ${facilityContext.facilityName}
- Document Type: ${facilityContext.documentType}
- Jurisdiction: ${facilityContext.jurisdiction}
- Current Definitions: ${JSON.stringify(facilityContext.currentDefinitions, null, 2)}

Determine:
1. Whether this announcement affects the facility documents
2. Specific clauses that need updating
3. Required changes with draft language
4. Compliance deadline
5. Whether immediate action is required

Return JSON:
{
  "isRelevant": boolean,
  "relevanceScore": 0.0-1.0,
  "affectedClauses": ["string"],
  "requiredChanges": [...],
  "complianceDeadline": "ISO date or null",
  "actionRequired": boolean,
  "summary": "string"
}`;

  return generateStructuredOutput(MARKET_ANALYSIS_SYSTEM_PROMPT, userMessage, {
    temperature: 0.2,
    maxTokens: 4096,
  });
}

/**
 * Draft counterparty communication for amendment discussion
 */
export async function draftCommunication(
  suggestion: AmendmentSuggestion,
  communicationType: 'informal_discussion' | 'formal_proposal' | 'amendment_request',
  context: {
    facilityName: string;
    borrowerName: string;
    senderName: string;
    senderRole: string;
    recipientName: string;
    recipientRole: string;
    relationshipContext?: string;
  }
): Promise<{
  subject: string;
  greeting: string;
  body: string;
  suggestedNextSteps: string[];
  callToAction: string;
  closing: string;
  attachmentSuggestions: string[];
}> {
  const communicationLabels = {
    informal_discussion: 'preliminary discussion invitation',
    formal_proposal: 'formal amendment proposal',
    amendment_request: 'amendment request letter',
  };

  const userMessage = `Draft a ${communicationLabels[communicationType]} for this amendment suggestion:

AMENDMENT SUGGESTION:
${JSON.stringify(suggestion, null, 2)}

CONTEXT:
- Facility: ${context.facilityName}
- Borrower: ${context.borrowerName}
- From: ${context.senderName} (${context.senderRole})
- To: ${context.recipientName} (${context.recipientRole})
${context.relationshipContext ? `- Relationship Context: ${context.relationshipContext}` : ''}

Communication Type: ${communicationType}

Draft a professional ${communicationLabels[communicationType]} that:
1. Is appropriately formal for the communication type
2. Clearly explains the rationale for discussion
3. Highlights mutual benefits
4. Proposes constructive next steps
5. Maintains positive relationship dynamics

Return JSON:
{
  "subject": "string",
  "greeting": "string",
  "body": "string (markdown formatted)",
  "suggestedNextSteps": ["string"],
  "callToAction": "string",
  "closing": "string",
  "attachmentSuggestions": ["string"]
}`;

  return generateStructuredOutput(COMMUNICATION_DRAFT_SYSTEM_PROMPT, userMessage, {
    temperature: 0.5,
    maxTokens: 4096,
  });
}

/**
 * Generate comprehensive facility evolution analysis
 */
export async function generateFacilityEvolutionAnalysis(
  facility: {
    id: string;
    name: string;
    borrowerName: string;
    borrowerIndustry: string;
    facilityType: string;
    totalCommitment: number;
    maturityDate: string;
    baseRate: string;
    currentMargin: number;
    currentTerms: Record<string, unknown>;
  },
  covenants: CovenantHeadroomAnalysis[],
  marketConditions: MarketConditionsSnapshot,
  existingSuggestions: AmendmentSuggestion[]
): Promise<FacilityEvolutionStatus> {
  const userMessage = `Generate a comprehensive evolution status analysis for this facility:

FACILITY:
${JSON.stringify(facility, null, 2)}

COVENANTS:
${JSON.stringify(covenants, null, 2)}

MARKET CONDITIONS:
${JSON.stringify(marketConditions, null, 2)}

EXISTING SUGGESTIONS:
${JSON.stringify(existingSuggestions, null, 2)}

Provide a complete facility evolution status including:
1. Health score (0-100) based on covenant headroom, market conditions, and overall risk
2. Health trend direction
3. Market exposure assessment
4. Recent changes and their impact
5. Maturity analysis and required actions

Return JSON matching FacilityEvolutionStatus type:
{
  "facilityId": "${facility.id}",
  "facilityName": "${facility.name}",
  "borrowerName": "${facility.borrowerName}",
  "healthScore": 0-100,
  "healthTrend": "improving" | "stable" | "deteriorating",
  "activeSuggestions": [...],
  "covenantAnalysis": [...],
  "marketExposure": {
    "interestRateSensitivity": "low" | "medium" | "high",
    "creditSpreadExposure": "minimal" | "moderate" | "significant",
    "regulatoryRisk": "low" | "medium" | "high"
  },
  "recentChanges": [...],
  "maturity": {
    "date": "ISO date",
    "daysUntil": number,
    "actionRequired": boolean
  },
  "lastAnalyzedAt": "ISO timestamp"
}`;

  return generateStructuredOutput(SUGGESTION_GENERATION_SYSTEM_PROMPT, userMessage, {
    temperature: 0.3,
    maxTokens: 8192,
  });
}

// =============================================================================
// Mock Data Generation for Development
// =============================================================================

/**
 * Generate mock market conditions snapshot
 */
export function generateMockMarketConditions(): MarketConditionsSnapshot {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    interestRates: [
      {
        rateType: 'SOFR',
        currentRate: 5.33,
        previousRate: 5.31,
        changeBps: 2,
        direction: 'up',
        asOfDate: now.toISOString(),
        movingAverage30d: 5.28,
        movingAverage90d: 5.15,
      },
      {
        rateType: 'Prime',
        currentRate: 8.50,
        previousRate: 8.50,
        changeBps: 0,
        direction: 'unchanged',
        asOfDate: now.toISOString(),
      },
    ],
    creditSpreads: [
      {
        spreadType: 'Investment Grade',
        rating: 'BBB',
        currentSpread: 175,
        previousSpread: 168,
        changeBps: 7,
        direction: 'widening',
        asOfDate: now.toISOString(),
        historicalPercentile: 65,
      },
      {
        spreadType: 'High Yield',
        rating: 'BB',
        currentSpread: 325,
        previousSpread: 310,
        changeBps: 15,
        direction: 'widening',
        asOfDate: now.toISOString(),
        historicalPercentile: 72,
      },
    ],
    regulatoryAnnouncements: [
      {
        id: 'reg-1',
        regulator: 'Federal Reserve',
        title: 'Updated Guidance on LIBOR Transition Documentation',
        summary: 'New guidance on hardwired fallback provisions for legacy LIBOR loans.',
        categories: ['Interest Rate', 'Documentation'],
        publishedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        effectiveDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        impactLevel: 'high',
        affectedDocumentTypes: ['credit_agreement', 'amendment'],
      },
    ],
    marketSentiment: {
      overall: 'neutral',
      volatilityIndex: 18.5,
      economicOutlook: 'stable',
    },
    dataQuality: {
      completeness: 0.95,
      freshness: 0.98,
      sources: ['Bloomberg', 'Reuters', 'Federal Reserve', 'SEC'],
    },
  };
}

/**
 * Generate mock amendment suggestions
 */
export function generateMockAmendmentSuggestions(): AmendmentSuggestion[] {
  const now = new Date();
  return [
    {
      id: 'sug-1',
      facilityId: 'fac-1',
      documentId: 'doc-1',
      type: 'covenant_reset',
      priority: 'high',
      title: 'Proactive Leverage Covenant Reset',
      description: 'Current leverage headroom has declined to 8.2% over the past two quarters. Market conditions and industry trends suggest further pressure on EBITDA. Recommend proactive covenant reset to avoid potential breach in Q3.',
      rationale: 'Historical analysis shows borrowers in this industry sector experiencing 15-20% EBITDA compression during economic slowdowns. Current market indicators suggest such conditions may materialize within 6 months.',
      triggerConditions: [
        {
          type: 'covenant_headroom',
          description: 'Leverage covenant headroom below 10%',
          indicator: 'Net Debt / EBITDA Headroom',
          currentValue: 8.2,
          threshold: 10,
          source: 'Quarterly covenant calculation',
          triggeredAt: now.toISOString(),
        },
      ],
      suggestedChanges: [
        {
          field: 'Maximum Leverage Ratio',
          category: 'Financial Covenants',
          currentValue: 4.50,
          suggestedValue: 5.00,
          rationale: 'Provides additional 50bps cushion to accommodate potential EBITDA compression',
          impact: {
            financial: 'Slightly increased credit risk; 25bps margin step-up recommended as consideration',
            operational: 'Reduced reporting burden as breach risk diminishes',
            legal: 'Standard amendment; no unusual provisions required',
          },
          draftLanguage: 'Section 7.1(a) is hereby amended by deleting "4.50:1.00" and substituting "5.00:1.00" in lieu thereof.',
          clauseReference: 'Section 7.1(a)',
        },
      ],
      negotiationPoints: [
        {
          title: 'Covenant Level',
          ourPosition: 'Increase to 5.00x with margin step-up',
          anticipatedCounterposition: 'Request 5.25x or higher',
          fallbackPosition: '5.25x with additional 50bps margin step-up',
          priority: 'must_have',
          supportingArguments: [
            'Current 8.2% headroom is thin by market standards',
            'Industry peers average 15%+ headroom',
            'Proactive approach demonstrates prudent risk management',
          ],
          marketPrecedent: 'Similar amendments in sector averaged 0.5x covenant relief with 25-50bps pricing consideration',
        },
      ],
      riskIfIgnored: {
        likelihood: 'high',
        impact: 'significant',
        description: 'Without amendment, 65% probability of covenant breach within 9 months based on current trajectory and market conditions. Breach would trigger cross-defaults, rating agency concerns, and significant borrower relationship damage.',
      },
      estimatedTimeline: '4-6 weeks for negotiation and execution',
      confidence: 0.87,
      status: 'new',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'sug-2',
      facilityId: 'fac-2',
      documentId: 'doc-2',
      type: 'margin_adjustment',
      priority: 'medium',
      title: 'Market Rate Alignment - Margin Adjustment',
      description: 'Current margin of 150bps is below market rates for comparable credits. Credit spreads have widened 50bps over the past quarter. Recommend margin discussion during upcoming annual review.',
      rationale: 'Market analysis indicates comparable BBB-rated facilities are pricing at SOFR + 200-225bps. Current pricing represents approximately 50-75bps discount to market.',
      triggerConditions: [
        {
          type: 'market_condition',
          description: 'Credit spreads widened significantly',
          indicator: 'BBB Credit Spread Index',
          currentValue: 175,
          threshold: 150,
          source: 'Bloomberg',
          triggeredAt: now.toISOString(),
        },
      ],
      suggestedChanges: [
        {
          field: 'Applicable Margin',
          category: 'Pricing',
          currentValue: 150,
          suggestedValue: 200,
          rationale: 'Align with current market conditions',
          impact: {
            financial: 'Additional 50bps annual interest income',
            operational: 'No operational impact',
            legal: 'Simple pricing amendment',
          },
          draftLanguage: 'The definition of "Applicable Margin" in Section 1.01 is hereby amended to read: "Applicable Margin" means, with respect to any Loan, 2.00% per annum.',
          clauseReference: 'Section 1.01',
        },
      ],
      negotiationPoints: [
        {
          title: 'Margin Increase',
          ourPosition: '50bps increase to 200bps',
          anticipatedCounterposition: 'Maintain current pricing or minimal increase',
          fallbackPosition: '35bps increase with performance-based step-down',
          priority: 'important',
          supportingArguments: [
            'Market spreads have widened 50bps since facility inception',
            'Comparable new facilities pricing at 200-225bps',
            'Borrower credit profile unchanged; pure market adjustment',
          ],
          marketPrecedent: 'Annual repricing amendments common in current market',
        },
      ],
      riskIfIgnored: {
        likelihood: 'low',
        impact: 'moderate',
        description: 'No immediate risk, but continued below-market pricing affects portfolio returns and may complicate syndication efforts.',
      },
      estimatedTimeline: '2-4 weeks',
      confidence: 0.72,
      status: 'under_review',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'sug-3',
      facilityId: 'fac-3',
      documentId: 'doc-3',
      type: 'regulatory_compliance',
      priority: 'urgent',
      title: 'LIBOR Fallback Language Update Required',
      description: 'Document contains legacy LIBOR reference provisions that must be updated per regulatory guidance. Hard deadline approaching.',
      rationale: 'Federal Reserve guidance requires all legacy LIBOR provisions to be updated to SOFR-based fallbacks by June 30, 2024.',
      triggerConditions: [
        {
          type: 'regulatory',
          description: 'LIBOR transition compliance deadline',
          indicator: 'LIBOR Fallback Status',
          currentValue: 'Legacy LIBOR language',
          threshold: 'SOFR fallback required',
          source: 'Federal Reserve Guidance',
          triggeredAt: now.toISOString(),
        },
      ],
      suggestedChanges: [
        {
          field: 'Interest Rate Definitions',
          category: 'Definitions',
          currentValue: 'LIBOR-based',
          suggestedValue: 'SOFR-based with hardwired fallback',
          rationale: 'Regulatory compliance requirement',
          impact: {
            financial: 'Minor basis differential; spread adjustment may be needed',
            operational: 'Updated systems required for SOFR calculation',
            legal: 'Mandatory regulatory change',
          },
          draftLanguage: 'The definition of "LIBOR Rate" in Section 1.01 is hereby deleted in its entirety and replaced with the ARRC-recommended SOFR fallback language attached hereto as Exhibit A.',
          clauseReference: 'Section 1.01',
        },
      ],
      negotiationPoints: [
        {
          title: 'SOFR Spread Adjustment',
          ourPosition: 'Standard ARRC spread adjustment',
          anticipatedCounterposition: 'May negotiate spread adjustment formula',
          fallbackPosition: 'Accept reasonable alternative spread calculation',
          priority: 'must_have',
          supportingArguments: [
            'Regulatory mandate - non-negotiable requirement',
            'ARRC-recommended language is market standard',
            'All parties benefit from certainty',
          ],
          marketPrecedent: '95%+ of LIBOR amendments use ARRC spread adjustment',
        },
      ],
      riskIfIgnored: {
        likelihood: 'high',
        impact: 'severe',
        description: 'Failure to update will result in fallback to fixed rate, regulatory non-compliance, and potential documentation invalidity.',
      },
      estimatedTimeline: 'Immediate - 2 weeks',
      confidence: 0.98,
      status: 'new',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

/**
 * Generate mock covenant headroom analysis
 */
export function generateMockCovenantAnalysis(): CovenantHeadroomAnalysis[] {
  return [
    {
      covenantId: 'cov-1',
      covenantName: 'Maximum Net Debt / EBITDA',
      covenantType: 'leverage',
      facilityId: 'fac-1',
      currentHeadroom: 8.2,
      thresholdValue: 4.50,
      currentValue: 4.13,
      thresholdType: 'maximum',
      riskLevel: 'tight',
      trend: 'deteriorating',
      monthsToProjectedBreach: 9,
      testHistory: [
        { date: '2024-12-31', value: 4.13, headroom: 8.2, result: 'pass' },
        { date: '2024-09-30', value: 3.95, headroom: 12.2, result: 'pass' },
        { date: '2024-06-30', value: 3.72, headroom: 17.3, result: 'pass' },
        { date: '2024-03-31', value: 3.65, headroom: 18.9, result: 'pass' },
      ],
    },
    {
      covenantId: 'cov-2',
      covenantName: 'Minimum Interest Coverage',
      covenantType: 'coverage',
      facilityId: 'fac-1',
      currentHeadroom: 42.5,
      thresholdValue: 2.50,
      currentValue: 3.56,
      thresholdType: 'minimum',
      riskLevel: 'comfortable',
      trend: 'stable',
      monthsToProjectedBreach: null,
      testHistory: [
        { date: '2024-12-31', value: 3.56, headroom: 42.5, result: 'pass' },
        { date: '2024-09-30', value: 3.62, headroom: 44.8, result: 'pass' },
        { date: '2024-06-30', value: 3.71, headroom: 48.4, result: 'pass' },
        { date: '2024-03-31', value: 3.68, headroom: 47.2, result: 'pass' },
      ],
    },
    {
      covenantId: 'cov-3',
      covenantName: 'Maximum CapEx',
      covenantType: 'spending',
      facilityId: 'fac-2',
      currentHeadroom: 65.0,
      thresholdValue: 50000000,
      currentValue: 17500000,
      thresholdType: 'maximum',
      riskLevel: 'safe',
      trend: 'stable',
      monthsToProjectedBreach: null,
      testHistory: [
        { date: '2024-12-31', value: 17500000, headroom: 65.0, result: 'pass' },
        { date: '2024-06-30', value: 8200000, headroom: 83.6, result: 'pass' },
      ],
    },
  ];
}
