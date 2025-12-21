// Cross-Deal Term Intelligence Dashboard Types

export type DealType = 'new_facility' | 'amendment' | 'refinancing' | 'extension' | 'consent' | 'waiver';
export type TermCategory = 'facility' | 'pricing' | 'covenants' | 'structure' | 'collateral' | 'events_of_default';
export type NegotiationOutcome = 'won' | 'conceded' | 'split' | 'unchanged';

export interface NegotiationDelta {
  termId: string;
  termLabel: string;
  termCategory: TermCategory;
  initialAsk: number;
  finalValue: number;
  delta: number;
  deltaPercent: number;
  marketAvgDelta: number;
  outcome: NegotiationOutcome;
}

export interface MarginNegotiationDelta {
  dealId: string;
  dealName: string;
  dealType: DealType;
  initialAsk: number;
  finalMargin: number;
  delta: number;
  deltaPercent: number;
  closedDate: string;
  counterparty: string;
  facilitySizeM: number;
}

export interface TermGroundAnalysis {
  termKey: string;
  termLabel: string;
  termCategory: TermCategory;
  totalNegotiations: number;
  avgUserDelta: number;
  avgMarketDelta: number;
  variance: number;
  consistentlyGivesGround: boolean;
  successRate: number; // Percentage of negotiations where user achieved favorable outcome
  exampleDeals: string[];
}

export interface NegotiationSequence {
  id: string;
  termCategory: TermCategory;
  termLabel: string;
  sequence: NegotiationStep[];
  successRate: number;
  avgOutcomeImprovement: number;
  usageCount: number;
  topPerformers: string[]; // Deal IDs
}

export interface NegotiationStep {
  stepNumber: number;
  action: 'initial_proposal' | 'counter' | 'concession' | 'holdout' | 'package_deal' | 'escalate' | 'final_offer';
  description: string;
  avgDaysToNext: number;
  successProbability: number;
}

export interface CounterpartyRelationship {
  counterpartyId: string;
  counterpartyName: string;
  counterpartyType: 'bank' | 'institutional' | 'fund' | 'sponsor';
  totalDeals: number;
  avgNegotiationDays: number;
  avgTermsAgreedFirst: number;
  successfulDeals: number;
  avgMarginDelta: number;
  avgCovenantDelta: number;
  relationshipScore: number; // 0-100, higher = more efficient working relationship
  lastDealDate: string;
  communicationStyle: 'collaborative' | 'competitive' | 'mixed';
}

export interface CounterpartyHeatmapCell {
  counterpartyId: string;
  counterpartyName: string;
  termCategory: TermCategory;
  avgDelta: number;
  negotiationCount: number;
  efficiency: number; // 0-100
}

export interface PortfolioPerformance {
  totalDeals: number;
  totalVolume: number;
  avgNegotiationDays: number;
  avgMarginDelta: number;
  avgCovenantDelta: number;
  overallSuccessRate: number;
  topStrengths: StrengthWeakness[];
  areasForImprovement: StrengthWeakness[];
}

export interface StrengthWeakness {
  area: string;
  description: string;
  metric: number;
  benchmark: number;
  impact: 'high' | 'medium' | 'low';
}

export interface TimeSeriesDataPoint {
  period: string;
  value: number;
  benchmark?: number;
}

export interface TermIntelligenceDashboardData {
  portfolioPerformance: PortfolioPerformance;
  marginDeltas: MarginNegotiationDelta[];
  termGroundAnalysis: TermGroundAnalysis[];
  negotiationSequences: NegotiationSequence[];
  counterpartyRelationships: CounterpartyRelationship[];
  counterpartyHeatmap: CounterpartyHeatmapCell[];
  marginDeltaTimeSeries: TimeSeriesDataPoint[];
}

export interface TermIntelligenceFilters {
  dateRange: [string, string];
  dealTypes: DealType[];
  termCategories: TermCategory[];
  counterparties: string[];
  minDealSize: number;
  maxDealSize: number;
}
