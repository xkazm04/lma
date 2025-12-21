import { generateStructuredOutput } from './client';

// Types for risk scenario simulation
export type CovenantType =
  | 'leverage_ratio'
  | 'interest_coverage'
  | 'fixed_charge_coverage'
  | 'debt_service_coverage'
  | 'minimum_liquidity'
  | 'capex'
  | 'net_worth';

export interface CovenantInput {
  id: string;
  covenantType: CovenantType;
  covenantName: string;
  thresholdType: 'maximum' | 'minimum';
  thresholdValue: number;
  testFrequency: 'monthly' | 'quarterly' | 'annually';
  calculationMethodology?: string;
  numeratorDefinition?: string;
  denominatorDefinition?: string;
}

export interface ObligationInput {
  id: string;
  obligationType: string;
  description: string;
  frequency: string;
  deadlineDays: number;
  triggerCondition?: string;
}

export interface FacilityInput {
  facilityName: string;
  totalCommitments: number;
  maturityDate: string;
  interestRateType: 'fixed' | 'floating';
  baseRate?: string;
  marginInitial?: number;
  borrowerName: string;
}

export interface ScenarioParameter {
  parameterId: string;
  parameterName: string;
  parameterType: 'percentage_change' | 'absolute_value' | 'ratio_change';
  baseValue: number;
  stressedValue: number;
  changeDescription: string;
}

export interface BreachedCovenant {
  covenantId: string;
  covenantName: string;
  covenantType: CovenantType;
  thresholdValue: number;
  thresholdType: 'maximum' | 'minimum';
  projectedValue: number;
  breachSeverity: 'minor' | 'moderate' | 'severe' | 'critical';
  breachMargin: number; // How much over/under the threshold
  breachProbability: number; // 0-1 confidence
  calculationBreakdown: string;
}

export interface CascadingEffect {
  effectId: string;
  triggerCovenantId: string;
  effectType: 'mandatory_prepayment' | 'interest_rate_increase' | 'collateral_requirement' | 'reporting_frequency' | 'dividend_restriction' | 'cross_default' | 'acceleration';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  financialImpact?: number;
  timeToEffect: string; // e.g., "Immediate", "30 days", "Next testing date"
}

export interface CureOption {
  cureId: string;
  cureType: 'equity_cure' | 'asset_sale' | 'cost_reduction' | 'debt_prepayment' | 'waiver_request' | 'amendment' | 'refinancing';
  description: string;
  estimatedCost?: number;
  feasibility: 'easy' | 'moderate' | 'difficult' | 'unlikely';
  timeRequired: string;
  successProbability: number;
  preconditions: string[];
  risks: string[];
}

export interface MandatoryPrepaymentTrigger {
  triggerId: string;
  triggerType: 'asset_sale' | 'debt_issuance' | 'equity_issuance' | 'excess_cash_flow' | 'insurance_proceeds' | 'change_of_control';
  description: string;
  prepaymentPercentage: number;
  estimatedAmount?: number;
  triggerCondition: string;
  isTriggered: boolean;
  triggerProbability: number;
}

export interface CovenantInterconnection {
  sourceCovenantId: string;
  targetCovenantId: string;
  connectionType: 'direct_dependency' | 'shared_metric' | 'cascading_impact' | 'cross_default';
  connectionStrength: 'weak' | 'moderate' | 'strong';
  description: string;
}

export interface RiskScenarioSimulationResult {
  scenarioId: string;
  scenarioName: string;
  scenarioDescription: string;
  simulationTimestamp: string;

  // Input parameters
  stressParameters: ScenarioParameter[];

  // Breach analysis
  breachedCovenants: BreachedCovenant[];
  atRiskCovenants: BreachedCovenant[]; // Close to breach but not breached
  safeCovenants: Array<{
    covenantId: string;
    covenantName: string;
    headroom: number; // Buffer to threshold
    headroomPercentage: number;
  }>;

  // Cascading effects
  cascadingEffects: CascadingEffect[];

  // Cure options
  cureOptions: CureOption[];

  // Mandatory prepayments
  mandatoryPrepaymentTriggers: MandatoryPrepaymentTrigger[];
  totalPotentialPrepayment: number;

  // Interconnection analysis
  covenantInterconnections: CovenantInterconnection[];

  // Summary metrics
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
  keyInsights: string[];
  recommendedActions: string[];

  // Confidence
  analysisConfidence: number;
  limitations: string[];
}

export interface PredefinedScenario {
  scenarioId: string;
  scenarioName: string;
  scenarioDescription: string;
  category: 'economic' | 'operational' | 'market' | 'regulatory' | 'custom';
  stressParameters: Array<{
    metric: string;
    changePercentage: number;
    description: string;
  }>;
}

// Predefined stress scenarios
export const PREDEFINED_SCENARIOS: PredefinedScenario[] = [
  {
    scenarioId: 'ebitda-drop-20',
    scenarioName: 'EBITDA Decline 20%',
    scenarioDescription: 'Simulate the impact of a 20% decline in EBITDA due to revenue shortfall or margin compression',
    category: 'operational',
    stressParameters: [
      { metric: 'EBITDA', changePercentage: -20, description: 'EBITDA decreases by 20%' },
    ],
  },
  {
    scenarioId: 'ebitda-drop-30',
    scenarioName: 'EBITDA Decline 30%',
    scenarioDescription: 'Severe EBITDA decline scenario - recession or major operational disruption',
    category: 'economic',
    stressParameters: [
      { metric: 'EBITDA', changePercentage: -30, description: 'EBITDA decreases by 30%' },
    ],
  },
  {
    scenarioId: 'interest-rate-spike',
    scenarioName: 'Interest Rate Spike +300bps',
    scenarioDescription: 'Simulate impact of interest rate increases on floating rate debt',
    category: 'market',
    stressParameters: [
      { metric: 'Interest Expense', changePercentage: 30, description: 'Interest expense increases by 30% due to rate hike' },
    ],
  },
  {
    scenarioId: 'combined-stress',
    scenarioName: 'Combined Stress Scenario',
    scenarioDescription: 'EBITDA decline combined with increased debt burden',
    category: 'economic',
    stressParameters: [
      { metric: 'EBITDA', changePercentage: -15, description: 'EBITDA decreases by 15%' },
      { metric: 'Total Debt', changePercentage: 10, description: 'Total debt increases by 10%' },
      { metric: 'Interest Expense', changePercentage: 20, description: 'Interest expense increases by 20%' },
    ],
  },
  {
    scenarioId: 'liquidity-crunch',
    scenarioName: 'Liquidity Crunch',
    scenarioDescription: 'Cash flow deterioration impacting liquidity covenants',
    category: 'operational',
    stressParameters: [
      { metric: 'Cash Balance', changePercentage: -40, description: 'Cash balance decreases by 40%' },
      { metric: 'Operating Cash Flow', changePercentage: -25, description: 'Operating cash flow decreases by 25%' },
    ],
  },
  {
    scenarioId: 'capex-overspend',
    scenarioName: 'CapEx Overspend',
    scenarioDescription: 'Capital expenditure exceeds budget, testing CapEx covenants',
    category: 'operational',
    stressParameters: [
      { metric: 'Capital Expenditure', changePercentage: 30, description: 'CapEx increases by 30% above budget' },
    ],
  },
];

const RISK_SCENARIO_SIMULATION_PROMPT = `You are an expert credit analyst specializing in loan covenant analysis and stress testing. Your task is to simulate risk scenarios based on extracted covenants and obligations from a facility agreement.

Given the facility details, covenants, obligations, and stress parameters, you must:

1. ANALYZE COVENANT BREACHES:
   - For each covenant, calculate the projected value under the stress scenario
   - Determine if the covenant would be breached
   - Calculate breach severity and margin
   - Identify covenants that are "at risk" (within 10% of threshold but not breached)

2. MAP CASCADING EFFECTS:
   - Identify cross-default provisions
   - Map mandatory prepayment triggers
   - Identify reporting requirement changes
   - Identify dividend/distribution restrictions
   - Map interest rate step-ups

3. ANALYZE CURE OPTIONS:
   - Equity cure provisions (if available)
   - Asset sale opportunities
   - Cost reduction potential
   - Refinancing feasibility
   - Amendment/waiver likelihood

4. IDENTIFY MANDATORY PREPAYMENTS:
   - Excess cash flow sweep triggers
   - Asset sale prepayment requirements
   - Insurance proceeds application
   - Change of control triggers

5. MAP COVENANT INTERCONNECTIONS:
   - Identify shared metrics (e.g., EBITDA used in multiple covenants)
   - Map direct dependencies
   - Identify cascading breach risks

Return your analysis as a JSON object with this structure:
{
  "scenarioName": "string",
  "scenarioDescription": "string",
  "stressParameters": [
    {
      "parameterId": "string",
      "parameterName": "string",
      "parameterType": "percentage_change" | "absolute_value" | "ratio_change",
      "baseValue": number,
      "stressedValue": number,
      "changeDescription": "string"
    }
  ],
  "breachedCovenants": [
    {
      "covenantId": "string",
      "covenantName": "string",
      "covenantType": "leverage_ratio" | "interest_coverage" | "fixed_charge_coverage" | "debt_service_coverage" | "minimum_liquidity" | "capex" | "net_worth",
      "thresholdValue": number,
      "thresholdType": "maximum" | "minimum",
      "projectedValue": number,
      "breachSeverity": "minor" | "moderate" | "severe" | "critical",
      "breachMargin": number,
      "breachProbability": number,
      "calculationBreakdown": "string"
    }
  ],
  "atRiskCovenants": [...],
  "safeCovenants": [
    {
      "covenantId": "string",
      "covenantName": "string",
      "headroom": number,
      "headroomPercentage": number
    }
  ],
  "cascadingEffects": [
    {
      "effectId": "string",
      "triggerCovenantId": "string",
      "effectType": "mandatory_prepayment" | "interest_rate_increase" | "collateral_requirement" | "reporting_frequency" | "dividend_restriction" | "cross_default" | "acceleration",
      "description": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "financialImpact": number | null,
      "timeToEffect": "string"
    }
  ],
  "cureOptions": [
    {
      "cureId": "string",
      "cureType": "equity_cure" | "asset_sale" | "cost_reduction" | "debt_prepayment" | "waiver_request" | "amendment" | "refinancing",
      "description": "string",
      "estimatedCost": number | null,
      "feasibility": "easy" | "moderate" | "difficult" | "unlikely",
      "timeRequired": "string",
      "successProbability": number,
      "preconditions": ["string"],
      "risks": ["string"]
    }
  ],
  "mandatoryPrepaymentTriggers": [
    {
      "triggerId": "string",
      "triggerType": "asset_sale" | "debt_issuance" | "equity_issuance" | "excess_cash_flow" | "insurance_proceeds" | "change_of_control",
      "description": "string",
      "prepaymentPercentage": number,
      "estimatedAmount": number | null,
      "triggerCondition": "string",
      "isTriggered": boolean,
      "triggerProbability": number
    }
  ],
  "totalPotentialPrepayment": number,
  "covenantInterconnections": [
    {
      "sourceCovenantId": "string",
      "targetCovenantId": "string",
      "connectionType": "direct_dependency" | "shared_metric" | "cascading_impact" | "cross_default",
      "connectionStrength": "weak" | "moderate" | "strong",
      "description": "string"
    }
  ],
  "overallRiskScore": number,
  "riskLevel": "low" | "moderate" | "elevated" | "high" | "critical",
  "keyInsights": ["string"],
  "recommendedActions": ["string"],
  "analysisConfidence": number,
  "limitations": ["string"]
}

IMPORTANT:
- Be precise with calculations - show your work in calculationBreakdown
- Consider typical credit agreement provisions when inferring cascading effects
- Be conservative in estimating cure feasibility
- Consider market conditions when assessing refinancing options
- Identify all interconnections between covenants sharing common metrics
- Provide actionable recommendations`;

export interface SimulateRiskScenarioInput {
  facility: FacilityInput;
  covenants: CovenantInput[];
  obligations: ObligationInput[];
  scenario: PredefinedScenario | {
    scenarioName: string;
    scenarioDescription: string;
    stressParameters: Array<{
      metric: string;
      changePercentage: number;
      description: string;
    }>;
  };
  currentFinancials?: {
    ebitda?: number;
    totalDebt?: number;
    interestExpense?: number;
    cashBalance?: number;
    netWorth?: number;
    capitalExpenditure?: number;
    fixedCharges?: number;
  };
}

export async function simulateRiskScenario(
  input: SimulateRiskScenarioInput
): Promise<RiskScenarioSimulationResult> {
  const userMessage = `
Analyze the following facility agreement data and simulate the risk scenario:

FACILITY DETAILS:
${JSON.stringify(input.facility, null, 2)}

COVENANTS:
${JSON.stringify(input.covenants, null, 2)}

OBLIGATIONS:
${JSON.stringify(input.obligations, null, 2)}

CURRENT FINANCIALS (estimated if not provided):
${JSON.stringify(input.currentFinancials || {
  ebitda: 100000000, // $100M assumed
  totalDebt: 400000000, // $400M assumed (4x leverage baseline)
  interestExpense: 20000000, // $20M assumed
  cashBalance: 50000000, // $50M assumed
  netWorth: 150000000, // $150M assumed
  capitalExpenditure: 35000000, // $35M assumed
  fixedCharges: 40000000, // $40M assumed
}, null, 2)}

STRESS SCENARIO TO SIMULATE:
Name: ${input.scenario.scenarioName}
Description: ${input.scenario.scenarioDescription}
Stress Parameters:
${input.scenario.stressParameters.map(p => `- ${p.metric}: ${p.changePercentage > 0 ? '+' : ''}${p.changePercentage}% (${p.description})`).join('\n')}

Please analyze which covenants would be breached, identify cascading effects, and recommend cure options.
`;

  const result = await generateStructuredOutput<Omit<RiskScenarioSimulationResult, 'scenarioId' | 'simulationTimestamp'>>(
    RISK_SCENARIO_SIMULATION_PROMPT,
    userMessage,
    { maxTokens: 8192, temperature: 0.2 }
  );

  return {
    scenarioId: `sim-${Date.now()}`,
    simulationTimestamp: new Date().toISOString(),
    ...result,
  };
}

// Helper function to get risk level color
export function getRiskLevelColor(level: RiskScenarioSimulationResult['riskLevel']): string {
  const colors: Record<typeof level, string> = {
    low: 'text-green-600',
    moderate: 'text-yellow-600',
    elevated: 'text-orange-500',
    high: 'text-red-500',
    critical: 'text-red-700',
  };
  return colors[level];
}

// Helper function to get risk level badge variant
export function getRiskLevelBadgeVariant(level: RiskScenarioSimulationResult['riskLevel']): 'success' | 'warning' | 'destructive' | 'default' {
  const variants: Record<typeof level, 'success' | 'warning' | 'destructive' | 'default'> = {
    low: 'success',
    moderate: 'warning',
    elevated: 'warning',
    high: 'destructive',
    critical: 'destructive',
  };
  return variants[level];
}

// Helper function to get breach severity color
export function getBreachSeverityColor(severity: BreachedCovenant['breachSeverity']): string {
  const colors: Record<typeof severity, string> = {
    minor: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    moderate: 'text-orange-600 bg-orange-50 border-orange-200',
    severe: 'text-red-600 bg-red-50 border-red-200',
    critical: 'text-red-800 bg-red-100 border-red-300',
  };
  return colors[severity];
}

// Helper function to format percentage
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// Helper function to format currency
export function formatScenarioCurrency(value: number): string {
  if (Math.abs(value) >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}
