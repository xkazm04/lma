/**
 * Risk Correlation Engine Types
 *
 * Types for the portfolio risk correlation analysis system.
 */

export type RiskCategory =
  | 'esg'
  | 'compliance'
  | 'credit'
  | 'market'
  | 'operational'
  | 'liquidity';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export type CorrelationType =
  | 'sector'
  | 'geography'
  | 'covenant_type'
  | 'esg_factor'
  | 'lender_exposure'
  | 'maturity_profile';

// Individual borrower/facility risk profile
export interface BorrowerRiskProfile {
  id: string;
  name: string;
  facilityId: string;
  facilityName: string;
  industry: string;
  geography: string;
  totalExposure: number;
  riskFactors: RiskFactor[];
  esgScore: number | null;
  complianceScore: number;
  creditRating: string | null;
  covenantTypes: string[];
  maturityDate: string;
}

export interface RiskFactor {
  id: string;
  category: RiskCategory;
  name: string;
  description: string;
  severity: RiskSeverity;
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
  sourceEvent?: RiskEvent;
}

export interface RiskEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  borrowerId: string;
  borrowerName: string;
  facilityId: string;
  category: RiskCategory;
  severity: RiskSeverity;
  occurredAt: string;
  detectedAt: string;
  status: 'active' | 'resolved' | 'monitoring';
}

// Correlation between borrowers/risks
export interface RiskCorrelation {
  id: string;
  borrower1Id: string;
  borrower1Name: string;
  borrower2Id: string;
  borrower2Name: string;
  correlationType: CorrelationType;
  correlationStrength: number; // -1 to 1
  sharedFactors: SharedRiskFactor[];
  historicalCoMovement: number; // percentage of times they moved together
  confidence: number; // 0-100
}

export interface SharedRiskFactor {
  factorName: string;
  factorType: CorrelationType;
  value: string;
  impactScore: number;
}

// Ripple effect when an event occurs
export interface RippleEffect {
  sourceEvent: RiskEvent;
  affectedBorrowers: AffectedBorrower[];
  totalExposureAtRisk: number;
  portfolioImpactPercentage: number;
  recommendations: string[];
}

export interface AffectedBorrower {
  borrowerId: string;
  borrowerName: string;
  facilityId: string;
  facilityName: string;
  exposure: number;
  correlationStrength: number;
  correlationType: CorrelationType;
  sharedFactors: string[];
  riskProbability: number; // probability of similar risk materializing
  estimatedImpact: RiskSeverity;
  relatedCovenants: RelatedCovenant[];
}

export interface RelatedCovenant {
  id: string;
  name: string;
  type: string;
  dueDate: string;
  status: 'upcoming' | 'due_soon' | 'overdue';
  borrowerName: string;
  facilityName: string;
}

// Portfolio-level correlation metrics
export interface PortfolioCorrelationMetrics {
  averageCorrelation: number;
  concentrationRisk: ConcentrationRisk[];
  sectorExposure: SectorExposure[];
  geographyExposure: GeographyExposure[];
  correlationClusters: CorrelationCluster[];
  systemicRiskScore: number; // 0-100
  diversificationScore: number; // 0-100
}

export interface ConcentrationRisk {
  type: CorrelationType;
  value: string;
  exposure: number;
  percentage: number;
  borrowerCount: number;
  riskLevel: RiskSeverity;
}

export interface SectorExposure {
  sector: string;
  exposure: number;
  percentage: number;
  borrowerCount: number;
  avgEsgScore: number | null;
  avgComplianceScore: number;
  riskFactors: string[];
}

export interface GeographyExposure {
  region: string;
  exposure: number;
  percentage: number;
  borrowerCount: number;
  regulatoryRisk: RiskSeverity;
}

export interface CorrelationCluster {
  id: string;
  name: string;
  borrowerIds: string[];
  correlationType: CorrelationType;
  avgCorrelation: number;
  totalExposure: number;
  clusterRiskScore: number;
  primaryRiskFactors: string[];
}

// Correlation matrix data for visualization
export interface CorrelationMatrixData {
  borrowers: {
    id: string;
    name: string;
    shortName: string;
  }[];
  matrix: number[][]; // correlation values between each pair
  highlights: MatrixHighlight[];
}

export interface MatrixHighlight {
  row: number;
  col: number;
  type: 'high_positive' | 'high_negative' | 'significant';
  tooltip: string;
}

// Dashboard summary for risk correlations
export interface RiskCorrelationDashboard {
  lastUpdated: string;
  portfolioMetrics: PortfolioCorrelationMetrics;
  activeRiskEvents: RiskEvent[];
  recentRippleEffects: RippleEffect[];
  highCorrelationPairs: RiskCorrelation[];
  upcomingRelatedDeadlines: RelatedCovenant[];
  alerts: RiskCorrelationAlert[];
}

export interface RiskCorrelationAlert {
  id: string;
  type: 'concentration' | 'correlation_spike' | 'ripple_risk' | 'systemic';
  severity: RiskSeverity;
  title: string;
  description: string;
  affectedBorrowers: string[];
  recommendations: string[];
  createdAt: string;
}

// Filter options for the correlation engine UI
export interface CorrelationFilters {
  riskCategories?: RiskCategory[];
  correlationTypes?: CorrelationType[];
  minCorrelation?: number;
  maxCorrelation?: number;
  severityLevels?: RiskSeverity[];
  sectors?: string[];
  geographies?: string[];
  borrowerIds?: string[];
}
