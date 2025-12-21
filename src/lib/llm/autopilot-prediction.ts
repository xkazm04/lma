import { generateStructuredOutput } from './client';

/**
 * Autopilot Predictive Compliance Analysis Module
 *
 * Uses multi-signal intelligence to predict covenant breaches 6-12 months ahead
 * by integrating market data, transaction patterns, news sentiment, and benchmarks.
 */

// =============================================================================
// Types
// =============================================================================

export interface PredictionInput {
  covenant: {
    id: string;
    name: string;
    type: string;
    threshold: number;
    threshold_type: 'maximum' | 'minimum';
    current_value: number;
    headroom_percentage: number;
    test_history: Array<{
      date: string;
      value: number;
      result: 'pass' | 'fail';
    }>;
  };
  facility: {
    id: string;
    name: string;
    type: string;
    commitment: number;
    maturity_date: string;
  };
  borrower: {
    id: string;
    name: string;
    industry: string;
  };
  signals: {
    market_data?: MarketDataSignal[];
    transaction_patterns?: TransactionPatternInput[];
    news_sentiment?: NewsSentimentInput[];
    benchmark_comparison?: BenchmarkInput;
  };
}

export interface MarketDataSignal {
  indicator: string;
  current_value: number;
  change: number;
  impact_direction: 'positive' | 'negative' | 'neutral';
}

export interface TransactionPatternInput {
  pattern_type: string;
  trend_direction: 'improving' | 'stable' | 'declining';
  change_rate: number;
  values: Array<{ period: string; value: number }>;
}

export interface NewsSentimentInput {
  headline: string;
  sentiment_score: number;
  credit_relevance: number;
}

export interface BenchmarkInput {
  industry_median: number;
  percentile_rank: number;
  market_trend: 'tightening' | 'stable' | 'loosening';
}

export interface PredictionOutput {
  breach_probability_6m: number;
  breach_probability_9m: number;
  breach_probability_12m: number;
  overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  projected_breach_quarter: string | null;
  contributing_factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }>;
  quarterly_projections: Array<{
    quarter: string;
    projected_value: number;
    breach_probability: number;
    key_drivers: string[];
  }>;
  leading_indicators: Array<{
    name: string;
    status: 'normal' | 'warning' | 'critical';
    description: string;
  }>;
  root_causes: Array<{
    cause: string;
    contribution: number;
    addressable: boolean;
    recommended_action?: string;
  }>;
  summary: string;
  key_risks: string[];
  immediate_actions: string[];
}

export interface RemediationStrategyOutput {
  strategy_type: string;
  title: string;
  description: string;
  effectiveness: number;
  difficulty: 'low' | 'medium' | 'high';
  time_to_implement: string;
  projected_improvement: number;
  steps: Array<{
    title: string;
    description: string;
    responsible_party: string;
    documents_required: string[];
  }>;
  risks: string[];
  estimated_cost: {
    total: number;
    breakdown: Array<{ category: string; amount: number }>;
  };
}

// =============================================================================
// Prompts
// =============================================================================

const PREDICTION_SYSTEM_PROMPT = `You are an expert credit risk analyst specializing in predictive covenant compliance analysis. Your task is to analyze multi-signal intelligence data and predict the likelihood of covenant breaches over a 6-12 month horizon.

You must provide accurate, well-reasoned predictions based on:
1. Historical covenant test performance and trends
2. Market data signals (interest rates, sector indices, credit spreads)
3. Borrower transaction patterns (cash flow, receivables, inventory)
4. News sentiment and industry developments
5. Industry benchmark comparisons

Your analysis should:
- Quantify breach probabilities with appropriate confidence levels
- Identify the key contributing factors to risk
- Project quarterly covenant values with scenarios
- Flag leading indicators that precede breaches
- Determine root causes that can be addressed
- Provide actionable recommendations

Output your analysis as a JSON object matching the specified schema.`;

const REMEDIATION_SYSTEM_PROMPT = `You are an expert restructuring and workout advisor specializing in covenant compliance remediation strategies. Your task is to generate practical, implementable remediation strategies for covenants at risk of breach.

Consider the following strategy types:
- Covenant amendment negotiations
- Waiver requests with milestones
- Operational improvements (working capital, cost reduction)
- Debt restructuring options
- Asset sales
- Equity injections
- Refinancing alternatives
- Stakeholder negotiations

Your strategies should:
- Be practical and achievable within the timeframe
- Include specific implementation steps
- Identify responsible parties and approvals needed
- Estimate costs and effectiveness
- Address key implementation risks
- Consider stakeholder dynamics

Output your strategies as a JSON array matching the specified schema.`;

// =============================================================================
// Functions
// =============================================================================

/**
 * Generate predictive breach analysis using multi-signal intelligence
 */
export async function generateBreachPrediction(
  input: PredictionInput
): Promise<PredictionOutput> {
  const userMessage = buildPredictionUserMessage(input);

  return generateStructuredOutput<PredictionOutput>(
    PREDICTION_SYSTEM_PROMPT,
    userMessage,
    { temperature: 0.3 }
  );
}

/**
 * Generate remediation strategies for at-risk covenants
 */
export async function generateRemediationStrategies(
  input: PredictionInput,
  prediction: PredictionOutput
): Promise<RemediationStrategyOutput[]> {
  const userMessage = buildRemediationUserMessage(input, prediction);

  return generateStructuredOutput<RemediationStrategyOutput[]>(
    REMEDIATION_SYSTEM_PROMPT,
    userMessage,
    { temperature: 0.4 }
  );
}

/**
 * Analyze multiple signals to identify correlated risk factors
 */
export async function analyzeSignalCorrelation(
  signals: PredictionInput['signals']
): Promise<{
  correlation_score: number;
  correlated_factors: string[];
  divergent_signals: string[];
  interpretation: string;
}> {
  const systemPrompt = `You are an expert in signal analysis and correlation detection. Analyze the provided signals from multiple sources and identify correlations that strengthen or weaken the overall risk assessment.`;

  const userMessage = `Analyze these signals for correlation:
${JSON.stringify(signals, null, 2)}

Return a JSON object with:
- correlation_score: 0-1 indicating how correlated the signals are (higher = more aligned)
- correlated_factors: array of factors that reinforce each other
- divergent_signals: array of signals that contradict the main trend
- interpretation: brief explanation of the correlation analysis`;

  return generateStructuredOutput(systemPrompt, userMessage, { temperature: 0.2 });
}

/**
 * Generate stakeholder notification content
 */
export async function generateNotificationContent(
  prediction: PredictionOutput,
  borrowerName: string,
  covenantName: string,
  notificationType: 'risk_escalation' | 'breach_imminent' | 'new_signal'
): Promise<{
  subject: string;
  summary: string;
  details: string;
  recommended_actions: string[];
}> {
  const systemPrompt = `You are a credit risk communication specialist. Generate clear, actionable notification content for stakeholders about covenant compliance risks. Be concise but comprehensive.`;

  const userMessage = `Generate notification content for:
Borrower: ${borrowerName}
Covenant: ${covenantName}
Notification Type: ${notificationType}
Risk Level: ${prediction.overall_risk_level}
Key Risks: ${prediction.key_risks.join(', ')}
Immediate Actions: ${prediction.immediate_actions.join(', ')}

Return a JSON object with:
- subject: email subject line
- summary: 1-2 sentence summary
- details: detailed explanation (2-3 paragraphs)
- recommended_actions: array of specific actions`;

  return generateStructuredOutput(systemPrompt, userMessage, { temperature: 0.3 });
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildPredictionUserMessage(input: PredictionInput): string {
  return `Analyze this covenant for breach risk over the next 6-12 months:

COVENANT DETAILS:
- Name: ${input.covenant.name}
- Type: ${input.covenant.type}
- Threshold: ${input.covenant.threshold} (${input.covenant.threshold_type})
- Current Value: ${input.covenant.current_value}
- Current Headroom: ${input.covenant.headroom_percentage}%
- Test History: ${JSON.stringify(input.covenant.test_history)}

FACILITY:
- Name: ${input.facility.name}
- Type: ${input.facility.type}
- Commitment: $${input.facility.commitment.toLocaleString()}
- Maturity: ${input.facility.maturity_date}

BORROWER:
- Name: ${input.borrower.name}
- Industry: ${input.borrower.industry}

SIGNALS:
${input.signals.market_data ? `Market Data: ${JSON.stringify(input.signals.market_data)}` : ''}
${input.signals.transaction_patterns ? `Transaction Patterns: ${JSON.stringify(input.signals.transaction_patterns)}` : ''}
${input.signals.news_sentiment ? `News Sentiment: ${JSON.stringify(input.signals.news_sentiment)}` : ''}
${input.signals.benchmark_comparison ? `Benchmark: ${JSON.stringify(input.signals.benchmark_comparison)}` : ''}

Provide your prediction as a JSON object with:
{
  "breach_probability_6m": number (0-100),
  "breach_probability_9m": number (0-100),
  "breach_probability_12m": number (0-100),
  "overall_risk_level": "low" | "medium" | "high" | "critical",
  "confidence_score": number (0-100),
  "projected_breach_quarter": string | null,
  "contributing_factors": [...],
  "quarterly_projections": [...],
  "leading_indicators": [...],
  "root_causes": [...],
  "summary": string,
  "key_risks": string[],
  "immediate_actions": string[]
}`;
}

function buildRemediationUserMessage(
  input: PredictionInput,
  prediction: PredictionOutput
): string {
  return `Generate remediation strategies for this at-risk covenant:

COVENANT:
- Name: ${input.covenant.name}
- Current Headroom: ${input.covenant.headroom_percentage}%
- Risk Level: ${prediction.overall_risk_level}

BORROWER:
- Name: ${input.borrower.name}
- Industry: ${input.borrower.industry}

PREDICTION SUMMARY:
${prediction.summary}

ROOT CAUSES:
${prediction.root_causes.map(r => `- ${r.cause} (${r.contribution}% contribution, ${r.addressable ? 'addressable' : 'not addressable'})`).join('\n')}

KEY RISKS:
${prediction.key_risks.map(r => `- ${r}`).join('\n')}

Generate 2-4 remediation strategies as a JSON array:
[
  {
    "strategy_type": string,
    "title": string,
    "description": string,
    "effectiveness": number (0-100),
    "difficulty": "low" | "medium" | "high",
    "time_to_implement": string,
    "projected_improvement": number,
    "steps": [...],
    "risks": string[],
    "estimated_cost": { "total": number, "breakdown": [...] }
  }
]`;
}
