/**
 * LLM Integration for Predictive Deal Intelligence
 *
 * Uses Claude to generate natural language insights, strategies,
 * and recommendations based on knowledge graph data.
 */

import { generateStructuredOutput, generateCompletion } from './client';
import type {
  DealPrediction,
  MarketInsight,
  NegotiationStrategy,
  StickingPointPrediction,
  CounterpartyInsight,
} from '@/app/features/deals/predictive-intelligence/lib/types';

// ============================================
// Types for LLM Outputs
// ============================================

export interface DealIntelligenceNarrative {
  executiveSummary: string;
  keyFindings: string[];
  strategicRecommendations: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigations: string[];
  };
  timeline: {
    estimatedClose: string;
    criticalMilestones: { milestone: string; target: string }[];
  };
}

export interface NegotiationPlaybook {
  overview: string;
  phases: {
    name: string;
    objective: string;
    tactics: string[];
    expectedOutcome: string;
    duration: string;
  }[];
  redLines: string[];
  fallbackPositions: { term: string; initial: string; fallback: string }[];
  closingStrategy: string;
}

export interface CounterpartyBrief {
  organizationProfile: string;
  negotiationDNA: {
    style: string;
    pacePreference: string;
    decisionMakers: string;
    sensitiveTopics: string[];
  };
  historicalInsights: string[];
  approachRecommendation: string;
  watchOuts: string[];
}

export interface TermOptimizationAdvice {
  termKey: string;
  currentAssessment: string;
  marketPosition: string;
  optimizationPath: {
    aggressive: { value: string; rationale: string; risk: string };
    moderate: { value: string; rationale: string; risk: string };
    conservative: { value: string; rationale: string; risk: string };
  };
  negotiationScript: string;
}

// ============================================
// Intelligence Generation Functions
// ============================================

/**
 * Generate a comprehensive narrative analysis of deal predictions.
 */
export async function generateDealIntelligenceNarrative(
  prediction: DealPrediction,
  dealContext: {
    dealName: string;
    dealType: string;
    totalValue?: number;
    participants: string[];
  }
): Promise<DealIntelligenceNarrative> {
  const systemPrompt = `You are an expert loan syndication advisor with deep knowledge of deal negotiation dynamics.
Generate insightful analysis in professional investment banking language.
Be specific and actionable in recommendations.
Output valid JSON matching the specified structure.`;

  const userPrompt = `Analyze this deal prediction data and generate a comprehensive intelligence narrative.

DEAL CONTEXT:
- Name: ${dealContext.dealName}
- Type: ${dealContext.dealType}
- Value: ${dealContext.totalValue ? `$${(dealContext.totalValue / 1000000).toFixed(1)}M` : 'Not specified'}
- Participants: ${dealContext.participants.join(', ')}

PREDICTION DATA:
- Closing Probability: ${Math.round(prediction.predictions.closingProbability * 100)}%
- Estimated Closing Days: ${prediction.predictions.estimatedClosingDays}
- Estimated Rounds: ${prediction.predictions.estimatedRounds}
- Model Confidence: ${Math.round(prediction.confidence * 100)}%

STICKING POINTS:
${prediction.predictions.likelyStickingPoints.map(sp =>
  `- ${sp.termLabel}: ${Math.round(sp.probability * 100)}% probability, reason: ${sp.reason}`
).join('\n')}

RECOMMENDED STRATEGIES:
${prediction.predictions.recommendedStrategies.map(s =>
  `- ${s.name}: ${s.description} (applicability: ${s.applicability}%)`
).join('\n')}

Generate a JSON response with this exact structure:
{
  "executiveSummary": "2-3 sentence high-level summary of deal prospects",
  "keyFindings": ["finding1", "finding2", ...], // 3-5 key insights
  "strategicRecommendations": ["rec1", "rec2", ...], // 4-6 actionable recommendations
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["risk1", "risk2", ...],
    "mitigations": ["mitigation1", "mitigation2", ...]
  },
  "timeline": {
    "estimatedClose": "human-readable estimate",
    "criticalMilestones": [
      {"milestone": "description", "target": "timeframe"},
      ...
    ]
  }
}`;

  return generateStructuredOutput<DealIntelligenceNarrative>(
    systemPrompt,
    userPrompt,
    { temperature: 0.4, maxTokens: 2000 }
  );
}

/**
 * Generate a detailed negotiation playbook based on predictions.
 */
export async function generateNegotiationPlaybook(
  prediction: DealPrediction,
  dealContext: {
    dealName: string;
    dealType: string;
    priority: 'speed' | 'terms' | 'balanced';
  }
): Promise<NegotiationPlaybook> {
  const systemPrompt = `You are a senior loan syndication negotiator with 20+ years of experience.
Create tactical, specific negotiation guidance based on deal intelligence.
Focus on actionable steps that can be executed immediately.
Output valid JSON matching the specified structure.`;

  const userPrompt = `Create a negotiation playbook for this deal.

DEAL: ${dealContext.dealName}
TYPE: ${dealContext.dealType}
PRIORITY: ${dealContext.priority}

CLOSING PROBABILITY: ${Math.round(prediction.predictions.closingProbability * 100)}%
ESTIMATED ROUNDS: ${prediction.predictions.estimatedRounds}

STICKING POINTS TO ADDRESS:
${prediction.predictions.likelyStickingPoints.slice(0, 5).map(sp =>
  `- ${sp.termLabel} (${Math.round(sp.probability * 100)}% contention): ${sp.suggestedApproach}`
).join('\n')}

AVAILABLE STRATEGIES:
${prediction.predictions.recommendedStrategies.map(s =>
  `- ${s.name}: Expected to ${s.expectedOutcome.closingTimeDelta < 0 ? 'save' : 'add'} ${Math.abs(s.expectedOutcome.closingTimeDelta)} days`
).join('\n')}

OPTIMAL TERM STRUCTURE:
${prediction.predictions.optimalTermStructure.terms.slice(0, 5).map(t =>
  `- ${t.termLabel}: suggested value achieves ${Math.round(t.acceptanceProbability * 100)}% acceptance probability`
).join('\n')}

Generate a JSON response with this exact structure:
{
  "overview": "2-3 sentence playbook summary",
  "phases": [
    {
      "name": "Phase name",
      "objective": "What to achieve",
      "tactics": ["tactic1", "tactic2"],
      "expectedOutcome": "What success looks like",
      "duration": "Expected timeframe"
    }
  ], // 3-4 phases
  "redLines": ["absolute limits we cannot cross"],
  "fallbackPositions": [
    {"term": "term name", "initial": "opening position", "fallback": "acceptable fallback"}
  ],
  "closingStrategy": "How to drive to signature"
}`;

  return generateStructuredOutput<NegotiationPlaybook>(
    systemPrompt,
    userPrompt,
    { temperature: 0.4, maxTokens: 2500 }
  );
}

/**
 * Generate a counterparty intelligence brief.
 */
export async function generateCounterpartyBrief(
  counterpartyInsight: CounterpartyInsight,
  additionalContext?: {
    dealHistory?: number;
    lastInteraction?: string;
    knownPreferences?: string[];
  }
): Promise<CounterpartyBrief> {
  const systemPrompt = `You are a relationship intelligence analyst specializing in financial institution profiling.
Provide actionable intelligence on negotiation counterparties.
Be specific about behavioral patterns and tactical recommendations.
Output valid JSON matching the specified structure.`;

  const userPrompt = `Create an intelligence brief for this counterparty.

COUNTERPARTY: ${counterpartyInsight.counterpartyName}

KNOWN BEHAVIORS:
- Typical rounds to acceptance: ${counterpartyInsight.insights.typicalAcceptanceRounds}
- Negotiation style: ${counterpartyInsight.insights.negotiationStyle}

HISTORICAL PATTERNS:
${counterpartyInsight.insights.historicalPatterns.map(p => `- ${p}`).join('\n')}

PREFERRED TERMS:
${counterpartyInsight.insights.preferredTerms.map(t =>
  `- ${t.termKey}: ${t.preferredRange}`
).join('\n')}

EXISTING RECOMMENDATION: ${counterpartyInsight.recommendation}

${additionalContext ? `
ADDITIONAL CONTEXT:
- Deal history: ${additionalContext.dealHistory || 'Unknown'} previous deals
- Last interaction: ${additionalContext.lastInteraction || 'Unknown'}
- Known preferences: ${additionalContext.knownPreferences?.join(', ') || 'None specified'}
` : ''}

Generate a JSON response with this exact structure:
{
  "organizationProfile": "Brief description of the organization and their market position",
  "negotiationDNA": {
    "style": "Their fundamental negotiation approach",
    "pacePreference": "How they prefer to pace negotiations",
    "decisionMakers": "Who makes final decisions and how",
    "sensitiveTopics": ["topics that require careful handling"]
  },
  "historicalInsights": ["insight1", "insight2"], // 3-4 behavioral patterns
  "approachRecommendation": "Specific tactical approach for this counterparty",
  "watchOuts": ["warning1", "warning2"] // Things to avoid or be careful about
}`;

  return generateStructuredOutput<CounterpartyBrief>(
    systemPrompt,
    userPrompt,
    { temperature: 0.3, maxTokens: 1500 }
  );
}

/**
 * Generate optimization advice for a specific term.
 */
export async function generateTermOptimizationAdvice(
  term: {
    termKey: string;
    currentValue: unknown;
    suggestedValue: unknown;
    marketPercentile: number;
  },
  context: {
    dealType: string;
    counterpartyStyle: string;
    priority: 'aggressive' | 'balanced' | 'conservative';
  }
): Promise<TermOptimizationAdvice> {
  const systemPrompt = `You are a loan structuring expert who optimizes deal terms.
Provide specific value recommendations with clear rationale.
Consider market positioning and counterparty dynamics.
Output valid JSON matching the specified structure.`;

  const userPrompt = `Provide optimization advice for this term.

TERM: ${term.termKey}
CURRENT VALUE: ${JSON.stringify(term.currentValue)}
SUGGESTED VALUE: ${JSON.stringify(term.suggestedValue)}
MARKET PERCENTILE: ${term.marketPercentile}th

CONTEXT:
- Deal type: ${context.dealType}
- Counterparty style: ${context.counterpartyStyle}
- Our priority: ${context.priority}

Generate a JSON response with this exact structure:
{
  "termKey": "${term.termKey}",
  "currentAssessment": "Assessment of current position",
  "marketPosition": "Where this sits vs market",
  "optimizationPath": {
    "aggressive": {
      "value": "Aggressive target value",
      "rationale": "Why this could work",
      "risk": "What could go wrong"
    },
    "moderate": {
      "value": "Balanced target value",
      "rationale": "Why this is optimal",
      "risk": "Potential downsides"
    },
    "conservative": {
      "value": "Safe target value",
      "rationale": "Why this ensures success",
      "risk": "What we leave on the table"
    }
  },
  "negotiationScript": "Suggested language for proposing this term"
}`;

  return generateStructuredOutput<TermOptimizationAdvice>(
    systemPrompt,
    userPrompt,
    { temperature: 0.4, maxTokens: 1200 }
  );
}

/**
 * Generate natural language explanation of market insights.
 */
export async function explainMarketInsight(insight: MarketInsight): Promise<string> {
  const systemPrompt = `You are a market analyst explaining loan market trends to senior bankers.
Be concise, specific, and focus on actionable implications.
Use professional language appropriate for investment banking.`;

  const userPrompt = `Explain this market insight in 2-3 sentences with clear implications:

INSIGHT: ${insight.title}
STATISTIC: ${insight.statistic}
DESCRIPTION: ${insight.description}
IMPACT: ${insight.impact}
CONFIDENCE: ${insight.confidence}%
${insight.suggestedAction ? `SUGGESTED ACTION: ${insight.suggestedAction}` : ''}

Provide a clear, actionable explanation.`;

  return generateCompletion(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 300 });
}

/**
 * Generate a strategy comparison narrative.
 */
export async function compareStrategies(
  strategies: NegotiationStrategy[],
  dealContext: { priority: string; constraints: string[] }
): Promise<string> {
  const systemPrompt = `You are a senior deal strategist comparing negotiation approaches.
Provide clear recommendation with reasoning.
Be specific about trade-offs and optimal sequencing.`;

  const userPrompt = `Compare these negotiation strategies and recommend the best approach.

STRATEGIES:
${strategies.map(s => `
${s.name}:
- ${s.description}
- Time impact: ${s.expectedOutcome.closingTimeDelta > 0 ? '+' : ''}${s.expectedOutcome.closingTimeDelta} days
- Success impact: ${s.expectedOutcome.successProbabilityDelta > 0 ? '+' : ''}${Math.round(s.expectedOutcome.successProbabilityDelta * 100)}%
- Historical success: ${Math.round(s.supportingEvidence.successRate * 100)}% over ${s.supportingEvidence.similarDeals} deals
`).join('\n')}

DEAL CONTEXT:
- Priority: ${dealContext.priority}
- Constraints: ${dealContext.constraints.join(', ')}

Provide a 3-4 sentence comparison and clear recommendation.`;

  return generateCompletion(systemPrompt, userPrompt, { temperature: 0.4, maxTokens: 500 });
}

/**
 * Generate a sticking point resolution script.
 */
export async function generateResolutionScript(
  stickingPoint: StickingPointPrediction,
  context: { counterpartyStyle: string; ourPosition: string }
): Promise<string> {
  const systemPrompt = `You are a skilled negotiation coach creating dialogue scripts.
Provide specific language that can be used in actual negotiations.
Focus on principled negotiation techniques.`;

  const userPrompt = `Create a resolution script for this sticking point.

STICKING POINT: ${stickingPoint.termLabel}
CONTENTION PROBABILITY: ${Math.round(stickingPoint.probability * 100)}%
REASON: ${stickingPoint.reason}
SUGGESTED APPROACH: ${stickingPoint.suggestedApproach}

HISTORICAL RESOLUTION:
- Average rounds: ${stickingPoint.historicalResolution.avgRoundsToResolve}
- Common compromises: ${stickingPoint.historicalResolution.commonCompromises.join(', ')}

CONTEXT:
- Counterparty style: ${context.counterpartyStyle}
- Our position: ${context.ourPosition}

Provide specific opening language, response templates, and closing language.`;

  return generateCompletion(systemPrompt, userPrompt, { temperature: 0.4, maxTokens: 600 });
}

/**
 * Generate deal success probability explanation.
 */
export async function explainSuccessProbability(
  prediction: DealPrediction,
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  }
): Promise<string> {
  const systemPrompt = `You are a deal analytics expert explaining probability assessments.
Provide clear, jargon-free explanations for senior decision makers.
Focus on what drives the probability and what can change it.`;

  const userPrompt = `Explain this deal's success probability assessment.

PROBABILITY: ${Math.round(prediction.predictions.closingProbability * 100)}%
CONFIDENCE: ${Math.round(prediction.confidence * 100)}%
MODEL VERSION: ${prediction.modelVersion}

FACTORS:
Positive: ${factors.positive.join(', ')}
Negative: ${factors.negative.join(', ')}
Neutral: ${factors.neutral.join(', ')}

ESTIMATED TIMELINE: ${prediction.predictions.estimatedClosingDays} days
ESTIMATED ROUNDS: ${prediction.predictions.estimatedRounds}

Provide a 3-4 sentence explanation of what drives this probability and what could improve it.`;

  return generateCompletion(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 400 });
}
