/**
 * ActionableEntity - Core Abstraction for ESG Decision Support
 *
 * This module implements the Entity-Action-Outcome triad pattern that unifies
 * all decision support concepts across the ESG module:
 *
 * Entity (E): The subject of the action (Facility, KPI, Allocation, Portfolio position)
 * Action (A): The intervention or change to apply (Intervention, Scenario, Divestment, Rebalance)
 * Outcome (O): The predicted/expected result (Prediction, Impact, Status change)
 *
 * This pattern enables building universal 'take action on X to achieve Y' UIs
 * across facilities, KPIs, portfolio optimization, and predictions.
 *
 * @module ActionableEntity
 */

import type {
  RiskLevel,
  PredictionConfidence,
  PerformanceStatus,
  ESGLoanType,
  KPICategory,
} from './types';

// ============================================
// Core Generic Types
// ============================================

/**
 * Priority levels for actions, consistent across all action types.
 */
export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Categories of actions that can be taken on entities.
 */
export type ActionCategory =
  | 'operational'      // Day-to-day operational changes
  | 'capital'          // Capital expenditure or investment
  | 'strategic'        // Strategic/long-term decisions
  | 'regulatory'       // Compliance or regulatory actions
  | 'portfolio'        // Portfolio rebalancing actions
  | 'monitoring';      // Observation/tracking actions

/**
 * Base outcome metrics that all outcomes share.
 */
export interface BaseOutcome {
  /** Confidence level in the predicted outcome */
  confidence: PredictionConfidence;
  /** Probability of achieving this outcome (0-100) */
  probability: number;
  /** Time horizon for the outcome */
  timeHorizon: string;
}

/**
 * Financial impact metrics for outcomes.
 */
export interface FinancialImpact {
  /** Value in basis points (for margin adjustments) */
  marginImpactBps?: number;
  /** Absolute monetary value impact */
  monetaryValue?: number;
  /** Percentage change from current state */
  percentageChange?: number;
  /** Currency for monetary values */
  currency?: string;
}

/**
 * ESG score impact metrics.
 */
export interface ESGImpact {
  /** Overall ESG score change */
  overallScoreChange?: number;
  /** Environmental component change */
  environmentalChange?: number;
  /** Social component change */
  socialChange?: number;
  /** Governance component change */
  governanceChange?: number;
}

/**
 * Risk impact metrics.
 */
export interface RiskImpact {
  /** Change in risk level */
  riskLevelChange?: {
    from: RiskLevel;
    to: RiskLevel;
  };
  /** Concentration risk reduction percentage */
  concentrationReduction?: number;
  /** Compliance risk reduction */
  complianceImprovement?: number;
}

/**
 * Core ActionableEntity interface - the universal abstraction.
 *
 * @typeParam E - The Entity type (what we're acting on)
 * @typeParam A - The Action type (what we're doing)
 * @typeParam O - The Outcome type (what we expect to achieve)
 */
export interface ActionableEntity<
  E extends EntityBase,
  A extends ActionBase,
  O extends OutcomeBase
> {
  /** Unique identifier for this actionable entity */
  id: string;
  /** The entity being acted upon */
  entity: E;
  /** Available actions for this entity */
  availableActions: A[];
  /** Predicted outcomes for each action (keyed by action ID) */
  predictedOutcomes: Map<string, O> | Record<string, O>;
  /** Current state/status of the entity */
  currentState: EntityState;
  /** Metadata about when this was generated */
  generatedAt: string;
  /** Whether this actionable entity requires immediate attention */
  requiresAttention: boolean;
  /** Priority ranking among other actionable entities */
  priorityRank?: number;
}

/**
 * Base interface for all entities that can have actions taken on them.
 */
export interface EntityBase {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Entity type discriminator */
  entityType: EntityType;
  /** Optional description */
  description?: string;
}

/**
 * Discriminated union of entity types.
 */
export type EntityType =
  | 'facility'
  | 'kpi'
  | 'allocation'
  | 'portfolio_position'
  | 'target'
  | 'sector';

/**
 * Current state of an entity.
 */
export interface EntityState {
  /** Performance status */
  status: PerformanceStatus | 'pending';
  /** Risk level */
  riskLevel: RiskLevel;
  /** Whether action is recommended */
  actionRecommended: boolean;
  /** Days until next milestone/deadline */
  daysToDeadline?: number;
  /** Current value (if applicable) */
  currentValue?: number;
  /** Target value (if applicable) */
  targetValue?: number;
}

/**
 * Base interface for all actions that can be taken.
 */
export interface ActionBase {
  /** Unique identifier */
  id: string;
  /** Action title */
  title: string;
  /** Detailed description */
  description: string;
  /** Action category */
  category: ActionCategory;
  /** Priority of this action */
  priority: ActionPriority;
  /** Risk level of executing this action */
  riskLevel: RiskLevel;
  /** Estimated time to implement */
  timeToImplement: string;
  /** Estimated cost (if applicable) */
  estimatedCost?: number;
  /** Dependencies on other actions */
  dependencies?: string[];
  /** Whether this action is recommended by AI */
  isRecommended: boolean;
}

/**
 * Base interface for all outcomes/predictions.
 */
export interface OutcomeBase extends BaseOutcome {
  /** Unique identifier */
  id: string;
  /** Associated action ID */
  actionId: string;
  /** Financial impact of this outcome */
  financialImpact: FinancialImpact;
  /** ESG score impact */
  esgImpact?: ESGImpact;
  /** Risk impact */
  riskImpact?: RiskImpact;
  /** Summary description */
  summary: string;
  /** Key benefits (for positive outcomes) */
  benefits?: string[];
  /** Key risks/drawbacks */
  risks?: string[];
}

// ============================================
// Concrete Entity Types
// ============================================

/**
 * Facility as an actionable entity.
 */
export interface FacilityEntity extends EntityBase {
  entityType: 'facility';
  borrowerName: string;
  borrowerIndustry: string;
  esgLoanType: ESGLoanType;
  commitmentAmount: number;
  outstandingAmount: number;
  currentMarginBps: number;
  baseMarginBps: number;
  maxMarginAdjustmentBps: number;
  kpiCount: number;
  maturityDate: string;
}

/**
 * KPI as an actionable entity.
 */
export interface KPIEntity extends EntityBase {
  entityType: 'kpi';
  category: KPICategory;
  unit: string;
  currentValue: number;
  baselineValue: number;
  targetValue: number;
  targetDate: string;
  weight: number;
  facilityId: string;
  facilityName: string;
}

/**
 * Allocation as an actionable entity.
 */
export interface AllocationEntity extends EntityBase {
  entityType: 'allocation';
  category: string;
  eligibleAmount: number;
  allocatedAmount: number;
  utilizationRate: number;
  facilityId: string;
  facilityName: string;
}

/**
 * Portfolio position as an actionable entity.
 */
export interface PortfolioPositionEntity extends EntityBase {
  entityType: 'portfolio_position';
  exposure: number;
  percentage: number;
  esgScore: number;
  riskLevel: RiskLevel;
  dimension: 'sector' | 'loan_type' | 'geography' | 'borrower';
}

// ============================================
// Concrete Action Types
// ============================================

/**
 * Intervention action for KPIs.
 */
export interface InterventionAction extends ActionBase {
  category: 'operational' | 'capital' | 'strategic' | 'regulatory';
  kpiImpact: number;
  kpiImpactPercentage: number;
  timeToEffect: string;
  affectedKpis: string[];
}

/**
 * Scenario action for what-if analysis.
 */
export interface ScenarioAction extends ActionBase {
  scenarioType: 'aggressive_esg' | 'balanced' | 'yield_focused' | 'risk_minimization' | 'custom';
  interventions: InterventionAction[];
  probabilityOfSuccess: number;
  implementationCost?: number;
  roi?: number;
}

/**
 * Divestment action for portfolio optimization.
 */
export interface DivestmentAction extends ActionBase {
  category: 'portfolio';
  facilityId: string;
  expectedMarketPricePct: number;
  reasons: string[];
  exposureReduction: number;
}

/**
 * Participation action for syndication opportunities.
 */
export interface ParticipationAction extends ActionBase {
  category: 'portfolio';
  syndicationId: string;
  participationAmount: number;
  minParticipation: number;
  leadArranger: string;
  syndicationDeadline: string;
  matchScore: number;
}

/**
 * Rebalance action for sector/type allocation.
 */
export interface RebalanceAction extends ActionBase {
  category: 'portfolio';
  dimension: 'sector' | 'loan_type' | 'geography';
  currentAllocation: number;
  targetAllocation: number;
  requiredChange: number;
}

// ============================================
// Concrete Outcome Types
// ============================================

/**
 * KPI prediction outcome.
 */
export interface KPIPredictionOutcome extends OutcomeBase {
  predictedValue: number;
  currentValue: number;
  targetValue: number;
  gapToTarget: number;
  gapPercentage: number;
  willMissTarget: boolean;
  predictionFactors: string[];
}

/**
 * Margin impact outcome.
 */
export interface MarginImpactOutcome extends OutcomeBase {
  currentMarginBps: number;
  predictedMarginBps: number;
  marginChangeBps: number;
  annualInterestImpact: number;
}

/**
 * Portfolio optimization outcome.
 */
export interface PortfolioOptimizationOutcome extends OutcomeBase {
  portfolioEsgScore: number;
  weightedAvgYieldBps: number;
  concentrationRiskScore: number;
  carbonIntensityReductionPct: number;
  executionPeriod: string;
}

/**
 * Divestment outcome.
 */
export interface DivestmentOutcome extends OutcomeBase {
  exitValue: number;
  esgScoreImprovement: number;
  concentrationImprovement: number;
  exposureReduction: number;
}

// ============================================
// Type Guards
// ============================================

export function isFacilityEntity(entity: EntityBase): entity is FacilityEntity {
  return entity.entityType === 'facility';
}

export function isKPIEntity(entity: EntityBase): entity is KPIEntity {
  return entity.entityType === 'kpi';
}

export function isAllocationEntity(entity: EntityBase): entity is AllocationEntity {
  return entity.entityType === 'allocation';
}

export function isPortfolioPositionEntity(entity: EntityBase): entity is PortfolioPositionEntity {
  return entity.entityType === 'portfolio_position';
}

export function isInterventionAction(action: ActionBase): action is InterventionAction {
  return 'kpiImpact' in action && 'kpiImpactPercentage' in action;
}

export function isDivestmentAction(action: ActionBase): action is DivestmentAction {
  return action.category === 'portfolio' && 'expectedMarketPricePct' in action;
}

export function isScenarioAction(action: ActionBase): action is ScenarioAction {
  return 'scenarioType' in action && 'interventions' in action;
}

// ============================================
// Utility Types
// ============================================

/**
 * Helper type to create ActionableEntity with specific types.
 */
export type FacilityActionableEntity = ActionableEntity<
  FacilityEntity,
  InterventionAction | DivestmentAction | ScenarioAction,
  KPIPredictionOutcome | MarginImpactOutcome
>;

export type KPIActionableEntity = ActionableEntity<
  KPIEntity,
  InterventionAction,
  KPIPredictionOutcome
>;

export type PortfolioActionableEntity = ActionableEntity<
  PortfolioPositionEntity,
  RebalanceAction | DivestmentAction | ParticipationAction,
  PortfolioOptimizationOutcome
>;

/**
 * Union type of all actionable entities.
 */
export type AnyActionableEntity =
  | FacilityActionableEntity
  | KPIActionableEntity
  | PortfolioActionableEntity;

/**
 * Configuration for rendering an actionable entity card.
 */
export interface ActionableEntityRenderConfig {
  /** Icon component to use */
  icon: React.ComponentType<{ className?: string }>;
  /** Color scheme */
  colorScheme: 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'zinc';
  /** Whether to show financial impact prominently */
  showFinancialImpact: boolean;
  /** Whether to show ESG impact */
  showEsgImpact: boolean;
  /** Whether to show risk indicators */
  showRiskIndicators: boolean;
  /** Primary metric to highlight */
  primaryMetric: 'margin' | 'esg_score' | 'value' | 'percentage';
  /** Custom labels */
  labels?: {
    actionButton?: string;
    secondaryButton?: string;
  };
}

// ============================================
// Factory Functions
// ============================================

/**
 * Creates an empty entity state with default values.
 */
export function createDefaultEntityState(): EntityState {
  return {
    status: 'pending',
    riskLevel: 'low',
    actionRecommended: false,
  };
}

/**
 * Determines if an entity requires immediate attention based on state.
 */
export function requiresImmediateAttention(state: EntityState): boolean {
  return (
    state.riskLevel === 'critical' ||
    state.riskLevel === 'high' ||
    state.status === 'off_track' ||
    (state.daysToDeadline !== undefined && state.daysToDeadline <= 7)
  );
}

/**
 * Calculates priority rank for an actionable entity.
 */
export function calculatePriorityRank(state: EntityState, financialImpact?: FinancialImpact): number {
  let score = 0;

  // Risk level contribution (0-40)
  switch (state.riskLevel) {
    case 'critical': score += 40; break;
    case 'high': score += 30; break;
    case 'medium': score += 20; break;
    case 'low': score += 10; break;
  }

  // Status contribution (0-30)
  switch (state.status) {
    case 'off_track': score += 30; break;
    case 'at_risk': score += 20; break;
    case 'pending': score += 10; break;
    case 'on_track': score += 5; break;
  }

  // Deadline urgency (0-30)
  if (state.daysToDeadline !== undefined) {
    if (state.daysToDeadline <= 7) score += 30;
    else if (state.daysToDeadline <= 30) score += 20;
    else if (state.daysToDeadline <= 90) score += 10;
  }

  // Financial impact bonus (0-20)
  if (financialImpact?.marginImpactBps) {
    const absBps = Math.abs(financialImpact.marginImpactBps);
    if (absBps >= 20) score += 20;
    else if (absBps >= 10) score += 15;
    else if (absBps >= 5) score += 10;
  }

  return score;
}

/**
 * Sorts actionable entities by priority (highest first).
 */
export function sortByPriority<E extends EntityBase, A extends ActionBase, O extends OutcomeBase>(
  entities: ActionableEntity<E, A, O>[]
): ActionableEntity<E, A, O>[] {
  return [...entities].sort((a, b) => (b.priorityRank ?? 0) - (a.priorityRank ?? 0));
}

/**
 * Filters actionable entities that require attention.
 */
export function filterRequiringAttention<E extends EntityBase, A extends ActionBase, O extends OutcomeBase>(
  entities: ActionableEntity<E, A, O>[]
): ActionableEntity<E, A, O>[] {
  return entities.filter(e => e.requiresAttention);
}

/**
 * Groups actionable entities by entity type.
 */
export function groupByEntityType<E extends EntityBase, A extends ActionBase, O extends OutcomeBase>(
  entities: ActionableEntity<E, A, O>[]
): Map<EntityType, ActionableEntity<E, A, O>[]> {
  const groups = new Map<EntityType, ActionableEntity<E, A, O>[]>();

  for (const entity of entities) {
    const type = entity.entity.entityType;
    const existing = groups.get(type) ?? [];
    existing.push(entity);
    groups.set(type, existing);
  }

  return groups;
}

/**
 * Gets the best recommended action for an entity.
 */
export function getBestRecommendedAction<A extends ActionBase>(actions: A[]): A | undefined {
  const recommended = actions.filter(a => a.isRecommended);
  if (recommended.length === 0) return undefined;

  // Sort by priority (critical > high > medium > low)
  const priorityOrder: ActionPriority[] = ['critical', 'high', 'medium', 'low'];
  return recommended.sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  )[0];
}

/**
 * Summarizes outcomes for display.
 */
export function summarizeOutcomes<O extends OutcomeBase>(outcomes: O[]): {
  totalFinancialImpact: number;
  avgConfidenceScore: number;
  bestOutcome: O | undefined;
} {
  if (outcomes.length === 0) {
    return { totalFinancialImpact: 0, avgConfidenceScore: 0, bestOutcome: undefined };
  }

  const totalFinancialImpact = outcomes.reduce(
    (sum, o) => sum + (o.financialImpact.monetaryValue ?? 0),
    0
  );

  const avgConfidenceScore = outcomes.reduce(
    (sum, o) => sum + o.probability,
    0
  ) / outcomes.length;

  const bestOutcome = [...outcomes].sort((a, b) => b.probability - a.probability)[0];

  return { totalFinancialImpact, avgConfidenceScore, bestOutcome };
}
