/**
 * ActionableEntity Adapters
 *
 * This module provides adapter functions to convert existing ESG types
 * into the unified ActionableEntity pattern.
 *
 * @module ActionableEntityAdapters
 */

import type {
  ESGFacility,
  ESGFacilityDetail,
  ESGKPI,
  FacilityPrediction,
  KPIPrediction,
  RecommendedAction,
  WhatIfScenario,
  Intervention,
  DivestmentCandidate,
  SyndicationOpportunity,
  PortfolioOptimizationScenario,
  OptimizationAction,
  PerformanceStatus,
  RiskLevel,
  PredictionConfidence,
} from './types';

import type {
  ActionableEntity,
  FacilityEntity,
  KPIEntity,
  PortfolioPositionEntity,
  InterventionAction,
  ScenarioAction,
  DivestmentAction,
  ParticipationAction,
  KPIPredictionOutcome,
  MarginImpactOutcome,
  DivestmentOutcome,
  PortfolioOptimizationOutcome,
  EntityState,
  ActionPriority,
  ActionCategory,
  FacilityActionableEntity,
  KPIActionableEntity,
} from './actionable-entity';

import {
  calculatePriorityRank,
  requiresImmediateAttention,
} from './actionable-entity';

// ============================================
// Entity Adapters
// ============================================

/**
 * Converts an ESGFacility to a FacilityEntity.
 */
export function toFacilityEntity(facility: ESGFacility): FacilityEntity {
  return {
    id: facility.id,
    name: facility.facility_name,
    entityType: 'facility',
    description: `${facility.borrower_name} - ${facility.esg_loan_type}`,
    borrowerName: facility.borrower_name,
    borrowerIndustry: facility.borrower_industry,
    esgLoanType: facility.esg_loan_type,
    commitmentAmount: facility.commitment_amount,
    outstandingAmount: facility.outstanding_amount,
    currentMarginBps: facility.current_margin_bps,
    baseMarginBps: facility.base_margin_bps,
    maxMarginAdjustmentBps: facility.max_margin_adjustment_bps,
    kpiCount: facility.kpi_count,
    maturityDate: facility.maturity_date,
  };
}

/**
 * Converts an ESGKPI to a KPIEntity.
 */
export function toKPIEntity(
  kpi: ESGKPI,
  facilityId: string,
  facilityName: string
): KPIEntity {
  const currentTarget = kpi.targets.find(t => t.target_status !== 'achieved' && t.target_status !== 'missed');

  return {
    id: kpi.id,
    name: kpi.kpi_name,
    entityType: 'kpi',
    description: `${kpi.kpi_category} KPI`,
    category: kpi.kpi_category,
    unit: kpi.unit,
    currentValue: kpi.current_value,
    baselineValue: kpi.baseline_value,
    targetValue: currentTarget?.target_value ?? kpi.targets[kpi.targets.length - 1]?.target_value ?? 0,
    targetDate: currentTarget?.target_year.toString() ?? '',
    weight: kpi.weight,
    facilityId,
    facilityName,
  };
}

/**
 * Creates an EntityState from facility/KPI status.
 */
export function toEntityState(
  status: PerformanceStatus,
  riskLevel: RiskLevel,
  daysToDeadline?: number,
  currentValue?: number,
  targetValue?: number
): EntityState {
  const state: EntityState = {
    status,
    riskLevel,
    actionRecommended: status === 'at_risk' || status === 'off_track' || riskLevel === 'high' || riskLevel === 'critical',
    daysToDeadline,
    currentValue,
    targetValue,
  };
  return state;
}

/**
 * Maps PerformanceStatus to RiskLevel.
 */
export function performanceToRisk(status: PerformanceStatus): RiskLevel {
  switch (status) {
    case 'off_track': return 'critical';
    case 'at_risk': return 'high';
    case 'on_track': return 'low';
    case 'pending': return 'medium';
    default: return 'medium';
  }
}

// ============================================
// Action Adapters
// ============================================

/**
 * Converts a RecommendedAction to InterventionAction.
 */
export function toInterventionAction(action: RecommendedAction): InterventionAction {
  return {
    id: action.id,
    title: action.title,
    description: action.description,
    category: 'operational',
    priority: action.priority,
    riskLevel: priorityToRiskLevel(action.priority),
    timeToImplement: action.estimated_effort,
    isRecommended: true,
    kpiImpact: action.potential_margin_benefit_bps,
    kpiImpactPercentage: (action.potential_margin_benefit_bps / 25) * 100, // Normalize to typical max
    timeToEffect: action.estimated_effort,
    affectedKpis: action.kpis_affected,
  };
}

/**
 * Converts an Intervention to InterventionAction.
 */
export function interventionToAction(intervention: Intervention): InterventionAction {
  return {
    id: intervention.id,
    title: intervention.name,
    description: intervention.description,
    category: intervention.category,
    priority: riskToPriority(intervention.risk_level),
    riskLevel: intervention.risk_level,
    timeToImplement: intervention.time_to_effect,
    estimatedCost: intervention.cost_estimate,
    dependencies: intervention.dependencies,
    isRecommended: true,
    kpiImpact: intervention.kpi_impact,
    kpiImpactPercentage: intervention.kpi_impact_percentage,
    timeToEffect: intervention.time_to_effect,
    affectedKpis: [],
  };
}

/**
 * Converts a WhatIfScenario to ScenarioAction.
 */
export function toScenarioAction(scenario: WhatIfScenario): ScenarioAction {
  return {
    id: scenario.id,
    title: scenario.name,
    description: scenario.description,
    category: 'strategic',
    priority: scenario.probability_of_success >= 80 ? 'high' : scenario.probability_of_success >= 60 ? 'medium' : 'low',
    riskLevel: scenario.probability_of_success >= 80 ? 'low' : scenario.probability_of_success >= 60 ? 'medium' : 'high',
    timeToImplement: scenario.time_to_implement,
    estimatedCost: scenario.implementation_cost,
    isRecommended: scenario.probability_of_success >= 70,
    scenarioType: 'custom',
    interventions: scenario.interventions.map(interventionToAction),
    probabilityOfSuccess: scenario.probability_of_success,
    implementationCost: scenario.implementation_cost,
    roi: scenario.roi,
  };
}

/**
 * Converts a DivestmentCandidate to DivestmentAction.
 */
export function toDivestmentAction(candidate: DivestmentCandidate): DivestmentAction {
  return {
    id: candidate.id,
    title: `Divest ${candidate.facility_name}`,
    description: candidate.reason.join('. '),
    category: 'portfolio',
    priority: candidate.priority,
    riskLevel: candidate.esg_performance === 'off_track' ? 'critical' : candidate.esg_performance === 'at_risk' ? 'high' : 'medium',
    timeToImplement: '30-60 days',
    isRecommended: candidate.priority === 'high',
    facilityId: candidate.facility_id,
    expectedMarketPricePct: candidate.expected_market_price_pct,
    reasons: candidate.reason,
    exposureReduction: candidate.portfolio_impact.exposure_reduction,
  };
}

/**
 * Converts a SyndicationOpportunity to ParticipationAction.
 */
export function toParticipationAction(opportunity: SyndicationOpportunity): ParticipationAction {
  return {
    id: opportunity.id,
    title: `Participate in ${opportunity.facility_name}`,
    description: opportunity.recommendation_reason,
    category: 'portfolio',
    priority: opportunity.match_score >= 80 ? 'high' : opportunity.match_score >= 60 ? 'medium' : 'low',
    riskLevel: 'low',
    timeToImplement: `By ${opportunity.syndication_deadline}`,
    isRecommended: opportunity.match_score >= 70,
    syndicationId: opportunity.id,
    participationAmount: opportunity.available_participation,
    minParticipation: opportunity.min_participation,
    leadArranger: opportunity.lead_arranger,
    syndicationDeadline: opportunity.syndication_deadline,
    matchScore: opportunity.match_score,
  };
}

/**
 * Converts an OptimizationAction to InterventionAction.
 */
export function optimizationToInterventionAction(action: OptimizationAction): InterventionAction {
  const categoryMap: Record<string, 'operational' | 'capital' | 'strategic' | 'regulatory'> = {
    participate: 'strategic',
    divest: 'strategic',
    rebalance: 'strategic',
    monitor: 'operational',
  };

  return {
    id: action.id,
    title: action.title,
    description: action.description,
    category: categoryMap[action.action_type] ?? 'strategic',
    priority: action.priority,
    riskLevel: priorityToRiskLevel(action.priority),
    timeToImplement: action.deadline ?? '90 days',
    isRecommended: action.priority === 'critical' || action.priority === 'high',
    kpiImpact: action.estimated_value,
    kpiImpactPercentage: 0,
    timeToEffect: action.deadline ?? '90 days',
    affectedKpis: [],
  };
}

// ============================================
// Outcome Adapters
// ============================================

/**
 * Converts a KPIPrediction to KPIPredictionOutcome.
 */
export function toKPIPredictionOutcome(
  prediction: KPIPrediction,
  actionId: string
): KPIPredictionOutcome {
  return {
    id: `outcome-${prediction.kpi_id}-${actionId}`,
    actionId,
    confidence: prediction.confidence,
    probability: prediction.confidence_score,
    timeHorizon: prediction.prediction_date,
    financialImpact: {
      marginImpactBps: prediction.gap_to_target > 0 ? -Math.round(prediction.gap_percentage * 0.25) : 0,
    },
    summary: prediction.will_miss_target
      ? `KPI predicted to miss target by ${prediction.gap_percentage.toFixed(1)}%`
      : `KPI on track to meet target`,
    benefits: prediction.will_miss_target ? [] : ['Target achievement', 'Margin benefit'],
    risks: prediction.will_miss_target ? prediction.prediction_factors : [],
    predictedValue: prediction.predicted_value,
    currentValue: prediction.current_value,
    targetValue: prediction.target_value,
    gapToTarget: prediction.gap_to_target,
    gapPercentage: prediction.gap_percentage,
    willMissTarget: prediction.will_miss_target,
    predictionFactors: prediction.prediction_factors,
  };
}

/**
 * Converts DivestmentCandidate portfolio_impact to DivestmentOutcome.
 */
export function toDivestmentOutcome(
  candidate: DivestmentCandidate,
  actionId: string
): DivestmentOutcome {
  return {
    id: `outcome-divest-${candidate.id}`,
    actionId,
    confidence: 'medium',
    probability: 75,
    timeHorizon: '60 days',
    financialImpact: {
      monetaryValue: candidate.current_exposure * (candidate.expected_market_price_pct / 100),
      percentageChange: candidate.expected_market_price_pct - 100,
    },
    summary: `Exit at ${candidate.expected_market_price_pct}% of par, improving portfolio ESG by ${candidate.portfolio_impact.esg_score_improvement.toFixed(1)} points`,
    benefits: [
      `ESG score +${candidate.portfolio_impact.esg_score_improvement.toFixed(1)}`,
      `Concentration -${candidate.portfolio_impact.concentration_improvement.toFixed(1)}%`,
      `Exposure reduction ${formatCurrency(candidate.portfolio_impact.exposure_reduction)}`,
    ],
    risks: candidate.reason,
    exitValue: candidate.current_exposure * (candidate.expected_market_price_pct / 100),
    esgScoreImprovement: candidate.portfolio_impact.esg_score_improvement,
    concentrationImprovement: candidate.portfolio_impact.concentration_improvement,
    exposureReduction: candidate.portfolio_impact.exposure_reduction,
  };
}

/**
 * Converts PortfolioOptimizationScenario to PortfolioOptimizationOutcome.
 */
export function toPortfolioOptimizationOutcome(
  scenario: PortfolioOptimizationScenario,
  actionId: string
): PortfolioOptimizationOutcome {
  return {
    id: `outcome-optimize-${scenario.id}`,
    actionId,
    confidence: scenario.feasibility_score >= 80 ? 'high' : scenario.feasibility_score >= 60 ? 'medium' : 'low',
    probability: scenario.feasibility_score,
    timeHorizon: scenario.required_actions.estimated_execution_period,
    financialImpact: {
      marginImpactBps: scenario.expected_outcomes.weighted_avg_yield_bps,
    },
    esgImpact: {
      overallScoreChange: scenario.expected_outcomes.portfolio_esg_score,
    },
    riskImpact: {
      concentrationReduction: 100 - scenario.expected_outcomes.concentration_risk_score,
    },
    summary: `${scenario.name}: ESG ${scenario.expected_outcomes.portfolio_esg_score}, Yield ${scenario.expected_outcomes.weighted_avg_yield_bps}bps`,
    benefits: [
      `Portfolio ESG: ${scenario.expected_outcomes.portfolio_esg_score}`,
      `Avg Yield: ${scenario.expected_outcomes.weighted_avg_yield_bps}bps`,
      `Carbon reduction: ${scenario.expected_outcomes.carbon_intensity_reduction_pct}%`,
    ],
    risks: [],
    portfolioEsgScore: scenario.expected_outcomes.portfolio_esg_score,
    weightedAvgYieldBps: scenario.expected_outcomes.weighted_avg_yield_bps,
    concentrationRiskScore: scenario.expected_outcomes.concentration_risk_score,
    carbonIntensityReductionPct: scenario.expected_outcomes.carbon_intensity_reduction_pct,
    executionPeriod: scenario.required_actions.estimated_execution_period,
  };
}

// ============================================
// Full Entity Converters
// ============================================

/**
 * Creates a FacilityActionableEntity from FacilityPrediction.
 */
export function createFacilityActionableEntity(
  prediction: FacilityPrediction
): FacilityActionableEntity {
  const facilityEntity: FacilityEntity = {
    id: prediction.facility_id,
    name: prediction.facility_name,
    entityType: 'facility',
    description: `${prediction.borrower_name} - ${prediction.esg_loan_type}`,
    borrowerName: prediction.borrower_name,
    borrowerIndustry: '', // Not in prediction
    esgLoanType: prediction.esg_loan_type,
    commitmentAmount: prediction.margin_impact.financial_impact.outstanding_amount,
    outstandingAmount: prediction.margin_impact.financial_impact.outstanding_amount,
    currentMarginBps: prediction.margin_impact.current_margin_bps,
    baseMarginBps: prediction.margin_impact.base_margin_bps,
    maxMarginAdjustmentBps: prediction.margin_impact.max_adjustment_bps,
    kpiCount: prediction.kpi_predictions.length,
    maturityDate: '',
  };

  const entityState = toEntityState(
    riskToPerformance(prediction.overall_risk_level),
    prediction.overall_risk_level,
    prediction.prediction_horizon_days,
    prediction.margin_impact.current_margin_bps,
    prediction.margin_impact.predicted_margin_bps
  );

  const actions = [
    ...prediction.recommended_actions.map(toInterventionAction),
    ...prediction.what_if_scenarios.map(toScenarioAction),
  ];

  const outcomes: Record<string, KPIPredictionOutcome | MarginImpactOutcome> = {};

  // Add KPI prediction outcomes
  for (const kpiPred of prediction.kpi_predictions) {
    const actionId = actions[0]?.id ?? 'default';
    outcomes[`kpi-${kpiPred.kpi_id}`] = toKPIPredictionOutcome(kpiPred, actionId);
  }

  // Add margin impact as outcome
  outcomes['margin'] = {
    id: 'outcome-margin',
    actionId: actions[0]?.id ?? 'default',
    confidence: prediction.margin_impact.confidence,
    probability: prediction.margin_impact.confidence === 'high' ? 85 : prediction.margin_impact.confidence === 'medium' ? 65 : 45,
    timeHorizon: prediction.margin_impact.effective_date,
    financialImpact: {
      marginImpactBps: prediction.margin_impact.predicted_adjustment_bps,
      monetaryValue: prediction.margin_impact.financial_impact.annual_interest_cost_change,
      percentageChange: prediction.margin_impact.financial_impact.percentage_change,
    },
    summary: `Margin predicted to change by ${prediction.margin_impact.predicted_adjustment_bps}bps`,
    currentMarginBps: prediction.margin_impact.current_margin_bps,
    predictedMarginBps: prediction.margin_impact.predicted_margin_bps,
    marginChangeBps: prediction.margin_impact.predicted_adjustment_bps,
    annualInterestImpact: prediction.margin_impact.financial_impact.annual_interest_cost_change,
  };

  const priorityRank = calculatePriorityRank(entityState, outcomes['margin'].financialImpact);

  return {
    id: `actionable-facility-${prediction.facility_id}`,
    entity: facilityEntity,
    availableActions: actions,
    predictedOutcomes: outcomes,
    currentState: entityState,
    generatedAt: prediction.prediction_date,
    requiresAttention: requiresImmediateAttention(entityState),
    priorityRank,
  };
}

/**
 * Creates a KPIActionableEntity from ESGKPI and KPIPrediction.
 */
export function createKPIActionableEntity(
  kpi: ESGKPI,
  prediction: KPIPrediction | undefined,
  facilityId: string,
  facilityName: string,
  recommendedActions: RecommendedAction[]
): KPIActionableEntity {
  const kpiEntity = toKPIEntity(kpi, facilityId, facilityName);

  const currentTarget = kpi.targets.find(t => t.target_status !== 'achieved' && t.target_status !== 'missed');
  const targetStatus = currentTarget?.target_status ?? 'pending';

  const riskLevel: RiskLevel =
    targetStatus === 'off_track' ? 'critical' :
    targetStatus === 'at_risk' ? 'high' :
    targetStatus === 'missed' ? 'critical' :
    'low';

  const entityState = toEntityState(
    targetStatusToPerformance(targetStatus),
    riskLevel,
    prediction?.days_until_deadline,
    kpi.current_value,
    currentTarget?.target_value
  );

  const relevantActions = recommendedActions
    .filter(a => a.kpis_affected.includes(kpi.id) || a.kpis_affected.includes(kpi.kpi_name))
    .map(toInterventionAction);

  const outcomes: Record<string, KPIPredictionOutcome> = {};

  if (prediction) {
    for (const action of relevantActions) {
      outcomes[action.id] = toKPIPredictionOutcome(prediction, action.id);
    }
  }

  const priorityRank = calculatePriorityRank(entityState);

  return {
    id: `actionable-kpi-${kpi.id}`,
    entity: kpiEntity,
    availableActions: relevantActions,
    predictedOutcomes: outcomes,
    currentState: entityState,
    generatedAt: new Date().toISOString(),
    requiresAttention: requiresImmediateAttention(entityState),
    priorityRank,
  };
}

// ============================================
// Helper Functions
// ============================================

function priorityToRiskLevel(priority: ActionPriority): RiskLevel {
  switch (priority) {
    case 'critical': return 'critical';
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
  }
}

function riskToPriority(risk: RiskLevel): ActionPriority {
  switch (risk) {
    case 'critical': return 'critical';
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
  }
}

function riskToPerformance(risk: RiskLevel): PerformanceStatus {
  switch (risk) {
    case 'critical': return 'off_track';
    case 'high': return 'at_risk';
    case 'medium': return 'pending';
    case 'low': return 'on_track';
  }
}

function targetStatusToPerformance(status: string): PerformanceStatus {
  switch (status) {
    case 'achieved':
    case 'on_track':
      return 'on_track';
    case 'at_risk':
      return 'at_risk';
    case 'off_track':
    case 'missed':
      return 'off_track';
    default:
      return 'pending';
  }
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}
