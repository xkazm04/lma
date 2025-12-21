import { z } from 'zod';

// Covenant type enum for risk simulation (subset of compliance covenant types)
const riskSimulationCovenantTypeSchema = z.enum([
  'leverage_ratio',
  'interest_coverage',
  'fixed_charge_coverage',
  'debt_service_coverage',
  'minimum_liquidity',
  'capex',
  'net_worth',
]);

// Stress parameter schema
export const stressParameterSchema = z.object({
  metric: z.string().min(1, 'Metric is required'),
  changePercentage: z.number().min(-100).max(500),
  description: z.string().optional(),
});

// Covenant input for simulation
export const simulationCovenantInputSchema = z.object({
  id: z.string(),
  covenantType: riskSimulationCovenantTypeSchema,
  covenantName: z.string().min(1),
  thresholdType: z.enum(['maximum', 'minimum']),
  thresholdValue: z.number(),
  testFrequency: z.enum(['monthly', 'quarterly', 'annually']),
  calculationMethodology: z.string().optional(),
  numeratorDefinition: z.string().optional(),
  denominatorDefinition: z.string().optional(),
});

// Obligation input for simulation
export const simulationObligationInputSchema = z.object({
  id: z.string(),
  obligationType: z.string(),
  description: z.string(),
  frequency: z.string(),
  deadlineDays: z.number(),
  triggerCondition: z.string().optional(),
});

// Facility input for simulation
export const simulationFacilityInputSchema = z.object({
  facilityName: z.string().min(1),
  totalCommitments: z.number().positive(),
  maturityDate: z.string(),
  interestRateType: z.enum(['fixed', 'floating']),
  baseRate: z.string().optional(),
  marginInitial: z.number().optional(),
  borrowerName: z.string().min(1),
});

// Current financials for simulation
export const simulationCurrentFinancialsSchema = z.object({
  ebitda: z.number().optional(),
  totalDebt: z.number().optional(),
  interestExpense: z.number().optional(),
  cashBalance: z.number().optional(),
  netWorth: z.number().optional(),
  capitalExpenditure: z.number().optional(),
  fixedCharges: z.number().optional(),
});

// Predefined scenario selection
export const predefinedScenarioIdSchema = z.enum([
  'ebitda-drop-20',
  'ebitda-drop-30',
  'interest-rate-spike',
  'combined-stress',
  'liquidity-crunch',
  'capex-overspend',
]);

// Custom scenario definition
export const customScenarioSchema = z.object({
  scenarioName: z.string().min(1, 'Scenario name is required').max(100),
  scenarioDescription: z.string().max(500).optional(),
  stressParameters: z.array(stressParameterSchema).min(1, 'At least one stress parameter is required'),
});

// Request schema for running a simulation
export const runSimulationRequestSchema = z.object({
  documentId: z.string().uuid(),
  scenarioType: z.enum(['predefined', 'custom']),
  predefinedScenarioId: predefinedScenarioIdSchema.optional(),
  customScenario: customScenarioSchema.optional(),
  currentFinancials: simulationCurrentFinancialsSchema.optional(),
}).refine(
  (data) => {
    if (data.scenarioType === 'predefined') {
      return !!data.predefinedScenarioId;
    }
    if (data.scenarioType === 'custom') {
      return !!data.customScenario;
    }
    return false;
  },
  {
    message: 'Either predefinedScenarioId or customScenario must be provided based on scenarioType',
  }
);

// Response types
export const simulationBreachedCovenantSchema = z.object({
  covenantId: z.string(),
  covenantName: z.string(),
  covenantType: riskSimulationCovenantTypeSchema,
  thresholdValue: z.number(),
  thresholdType: z.enum(['maximum', 'minimum']),
  projectedValue: z.number(),
  breachSeverity: z.enum(['minor', 'moderate', 'severe', 'critical']),
  breachMargin: z.number(),
  breachProbability: z.number().min(0).max(1),
  calculationBreakdown: z.string(),
});

export const simulationSafeCovenantSchema = z.object({
  covenantId: z.string(),
  covenantName: z.string(),
  headroom: z.number(),
  headroomPercentage: z.number(),
});

export const simulationCascadingEffectSchema = z.object({
  effectId: z.string(),
  triggerCovenantId: z.string(),
  effectType: z.enum([
    'mandatory_prepayment',
    'interest_rate_increase',
    'collateral_requirement',
    'reporting_frequency',
    'dividend_restriction',
    'cross_default',
    'acceleration',
  ]),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  financialImpact: z.number().nullable().optional(),
  timeToEffect: z.string(),
});

export const simulationCureOptionSchema = z.object({
  cureId: z.string(),
  cureType: z.enum([
    'equity_cure',
    'asset_sale',
    'cost_reduction',
    'debt_prepayment',
    'waiver_request',
    'amendment',
    'refinancing',
  ]),
  description: z.string(),
  estimatedCost: z.number().nullable().optional(),
  feasibility: z.enum(['easy', 'moderate', 'difficult', 'unlikely']),
  timeRequired: z.string(),
  successProbability: z.number().min(0).max(1),
  preconditions: z.array(z.string()),
  risks: z.array(z.string()),
});

export const simulationMandatoryPrepaymentTriggerSchema = z.object({
  triggerId: z.string(),
  triggerType: z.enum([
    'asset_sale',
    'debt_issuance',
    'equity_issuance',
    'excess_cash_flow',
    'insurance_proceeds',
    'change_of_control',
  ]),
  description: z.string(),
  prepaymentPercentage: z.number(),
  estimatedAmount: z.number().nullable().optional(),
  triggerCondition: z.string(),
  isTriggered: z.boolean(),
  triggerProbability: z.number().min(0).max(1),
});

export const simulationCovenantInterconnectionSchema = z.object({
  sourceCovenantId: z.string(),
  targetCovenantId: z.string(),
  connectionType: z.enum(['direct_dependency', 'shared_metric', 'cascading_impact', 'cross_default']),
  connectionStrength: z.enum(['weak', 'moderate', 'strong']),
  description: z.string(),
});

export const riskSimulationResultSchema = z.object({
  scenarioId: z.string(),
  scenarioName: z.string(),
  scenarioDescription: z.string(),
  simulationTimestamp: z.string(),
  stressParameters: z.array(z.object({
    parameterId: z.string(),
    parameterName: z.string(),
    parameterType: z.enum(['percentage_change', 'absolute_value', 'ratio_change']),
    baseValue: z.number(),
    stressedValue: z.number(),
    changeDescription: z.string(),
  })),
  breachedCovenants: z.array(simulationBreachedCovenantSchema),
  atRiskCovenants: z.array(simulationBreachedCovenantSchema),
  safeCovenants: z.array(simulationSafeCovenantSchema),
  cascadingEffects: z.array(simulationCascadingEffectSchema),
  cureOptions: z.array(simulationCureOptionSchema),
  mandatoryPrepaymentTriggers: z.array(simulationMandatoryPrepaymentTriggerSchema),
  totalPotentialPrepayment: z.number(),
  covenantInterconnections: z.array(simulationCovenantInterconnectionSchema),
  overallRiskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'moderate', 'elevated', 'high', 'critical']),
  keyInsights: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  analysisConfidence: z.number().min(0).max(1),
  limitations: z.array(z.string()),
});

// Type exports
export type RiskSimulationCovenantType = z.infer<typeof riskSimulationCovenantTypeSchema>;
export type StressParameter = z.infer<typeof stressParameterSchema>;
export type SimulationCovenantInput = z.infer<typeof simulationCovenantInputSchema>;
export type SimulationObligationInput = z.infer<typeof simulationObligationInputSchema>;
export type SimulationFacilityInput = z.infer<typeof simulationFacilityInputSchema>;
export type SimulationCurrentFinancials = z.infer<typeof simulationCurrentFinancialsSchema>;
export type PredefinedScenarioId = z.infer<typeof predefinedScenarioIdSchema>;
export type CustomScenario = z.infer<typeof customScenarioSchema>;
export type RunSimulationRequest = z.infer<typeof runSimulationRequestSchema>;
export type SimulationBreachedCovenant = z.infer<typeof simulationBreachedCovenantSchema>;
export type SimulationSafeCovenant = z.infer<typeof simulationSafeCovenantSchema>;
export type SimulationCascadingEffect = z.infer<typeof simulationCascadingEffectSchema>;
export type SimulationCureOption = z.infer<typeof simulationCureOptionSchema>;
export type SimulationMandatoryPrepaymentTrigger = z.infer<typeof simulationMandatoryPrepaymentTriggerSchema>;
export type SimulationCovenantInterconnection = z.infer<typeof simulationCovenantInterconnectionSchema>;
export type RiskSimulationResult = z.infer<typeof riskSimulationResultSchema>;
