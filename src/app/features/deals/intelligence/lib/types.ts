// Market benchmarking types for Deal Intelligence Dashboard

export type DealType = 'new_facility' | 'amendment' | 'refinancing' | 'extension' | 'consent' | 'waiver';
export type BorrowerProfile = 'investment_grade' | 'leveraged' | 'middle_market' | 'distressed' | 'sponsor_backed';
export type Industry = 'technology' | 'healthcare' | 'energy' | 'financial_services' | 'manufacturing' | 'retail' | 'real_estate' | 'other';
export type FacilityType = 'term_loan' | 'revolver' | 'delayed_draw' | 'bridge' | 'mezzanine';

export interface MarketDataPoint {
  date: string;
  value: number;
  percentile25?: number;
  percentile50?: number;
  percentile75?: number;
}

export interface MarginBenchmark {
  current: number;
  marketMedian: number;
  marketP25: number;
  marketP75: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  historicalData: MarketDataPoint[];
}

export interface CovenantBenchmark {
  type: 'leverage' | 'interest_coverage' | 'fixed_charge' | 'minimum_liquidity' | 'debt_service';
  label: string;
  current: number;
  marketMedian: number;
  marketP25: number;
  marketP75: number;
  unit: string;
  tighterIsHigher: boolean; // For display: leverage lower is tighter, coverage higher is tighter
}

export interface StructureBenchmark {
  term: string;
  label: string;
  currentValue: string;
  marketStandard: string;
  frequency: number; // percentage of deals with this term
  trend: 'more_common' | 'less_common' | 'stable';
}

export interface DealBenchmarkComparison {
  dealId: string;
  dealName: string;
  dealType: DealType;
  borrowerProfile: BorrowerProfile;
  industry: Industry;
  facilityType: FacilityType;
  facilitySize: number;
  margin: MarginBenchmark;
  covenants: CovenantBenchmark[];
  structureTerms: StructureBenchmark[];
  overallScore: number; // 0-100, how favorable the terms are vs market
  marketPosition: 'favorable' | 'market' | 'aggressive';
}

export interface MarketTrendData {
  period: string;
  dealType: DealType;
  borrowerProfile: BorrowerProfile;
  metrics: {
    avgMargin: number;
    avgLeverage: number;
    avgTenor: number;
    dealVolume: number;
    spreadTightening: number;
  };
}

export interface MarketInsight {
  id: string;
  type: 'pricing' | 'structure' | 'covenant' | 'volume';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  source: string;
  date: string;
}

export interface BenchmarkFilters {
  dealTypes: DealType[];
  borrowerProfiles: BorrowerProfile[];
  industries: Industry[];
  facilityTypes: FacilityType[];
  facilitySizeRange: [number, number];
  dateRange: [string, string];
}

export interface MarketStats {
  totalDeals: number;
  totalVolume: number;
  avgMargin: number;
  marginTrend: number;
  avgLeverage: number;
  leverageTrend: number;
  avgTenor: number;
  tenorTrend: number;
}

export interface IntelligenceDashboardData {
  currentDeal: DealBenchmarkComparison | null;
  marketStats: MarketStats;
  trendData: MarketTrendData[];
  insights: MarketInsight[];
  peerComparisons: DealBenchmarkComparison[];
}
