import type {
  DealBenchmarkComparison,
  MarketTrendData,
  MarketInsight,
  MarketStats,
  IntelligenceDashboardData,
  MarketDataPoint,
} from './types';

// Generate historical data points for charts
function generateHistoricalData(
  baseValue: number,
  months: number,
  volatility: number = 0.1
): MarketDataPoint[] {
  const data: MarketDataPoint[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);

    const variance = (Math.random() - 0.5) * 2 * volatility * baseValue;
    const value = baseValue + variance;

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      percentile25: Math.round((value - volatility * baseValue) * 100) / 100,
      percentile50: Math.round(value * 100) / 100,
      percentile75: Math.round((value + volatility * baseValue) * 100) / 100,
    });
  }

  return data;
}

export const mockMarketStats: MarketStats = {
  totalDeals: 1247,
  totalVolume: 485000000000, // $485B
  avgMargin: 2.75,
  marginTrend: -0.15, // bps tighter
  avgLeverage: 4.2,
  leverageTrend: 0.3, // higher
  avgTenor: 5.5,
  tenorTrend: 0.2, // longer
};

export const mockCurrentDealBenchmark: DealBenchmarkComparison = {
  dealId: '1',
  dealName: 'Project Apollo - Term Loan Facility',
  dealType: 'new_facility',
  borrowerProfile: 'leveraged',
  industry: 'technology',
  facilityType: 'term_loan',
  facilitySize: 500000000,
  margin: {
    current: 2.5,
    marketMedian: 2.75,
    marketP25: 2.25,
    marketP75: 3.25,
    trend: 'down',
    trendPercentage: -5.5,
    historicalData: generateHistoricalData(2.75, 12, 0.15),
  },
  covenants: [
    {
      type: 'leverage',
      label: 'Max Leverage Ratio',
      current: 4.0,
      marketMedian: 4.5,
      marketP25: 4.0,
      marketP75: 5.25,
      unit: 'x',
      tighterIsHigher: false,
    },
    {
      type: 'interest_coverage',
      label: 'Min Interest Coverage',
      current: 3.0,
      marketMedian: 2.5,
      marketP25: 2.0,
      marketP75: 3.0,
      unit: 'x',
      tighterIsHigher: true,
    },
    {
      type: 'fixed_charge',
      label: 'Fixed Charge Coverage',
      current: 1.25,
      marketMedian: 1.15,
      marketP25: 1.0,
      marketP75: 1.25,
      unit: 'x',
      tighterIsHigher: true,
    },
    {
      type: 'minimum_liquidity',
      label: 'Minimum Liquidity',
      current: 50000000,
      marketMedian: 35000000,
      marketP25: 25000000,
      marketP75: 50000000,
      unit: '$',
      tighterIsHigher: true,
    },
  ],
  structureTerms: [
    {
      term: 'call_protection',
      label: 'Call Protection',
      currentValue: '101 soft call for 6 months',
      marketStandard: '101 soft call for 12 months',
      frequency: 78,
      trend: 'less_common',
    },
    {
      term: 'excess_cash_sweep',
      label: 'Excess Cash Flow Sweep',
      currentValue: '50% with step-downs',
      marketStandard: '75% with step-downs',
      frequency: 65,
      trend: 'more_common',
    },
    {
      term: 'restricted_payments',
      label: 'Restricted Payments Basket',
      currentValue: 'Available Amount + $25M',
      marketStandard: 'Available Amount only',
      frequency: 52,
      trend: 'stable',
    },
    {
      term: 'incremental_facility',
      label: 'Incremental Facility Cap',
      currentValue: '1.0x EBITDA + Ratio-Based',
      marketStandard: 'Ratio-Based only',
      frequency: 71,
      trend: 'more_common',
    },
  ],
  overallScore: 72,
  marketPosition: 'favorable',
};

export const mockPeerComparisons: DealBenchmarkComparison[] = [
  {
    dealId: 'peer-1',
    dealName: 'TechCorp Acquisition Financing',
    dealType: 'new_facility',
    borrowerProfile: 'sponsor_backed',
    industry: 'technology',
    facilityType: 'term_loan',
    facilitySize: 750000000,
    margin: {
      current: 2.75,
      marketMedian: 2.75,
      marketP25: 2.25,
      marketP75: 3.25,
      trend: 'stable',
      trendPercentage: 0,
      historicalData: [],
    },
    covenants: [
      { type: 'leverage', label: 'Max Leverage', current: 5.0, marketMedian: 4.5, marketP25: 4.0, marketP75: 5.25, unit: 'x', tighterIsHigher: false },
      { type: 'interest_coverage', label: 'Interest Coverage', current: 2.25, marketMedian: 2.5, marketP25: 2.0, marketP75: 3.0, unit: 'x', tighterIsHigher: true },
    ],
    structureTerms: [],
    overallScore: 58,
    marketPosition: 'market',
  },
  {
    dealId: 'peer-2',
    dealName: 'DataFlow Systems Refinancing',
    dealType: 'refinancing',
    borrowerProfile: 'leveraged',
    industry: 'technology',
    facilityType: 'term_loan',
    facilitySize: 400000000,
    margin: {
      current: 3.0,
      marketMedian: 2.75,
      marketP25: 2.25,
      marketP75: 3.25,
      trend: 'up',
      trendPercentage: 8.5,
      historicalData: [],
    },
    covenants: [
      { type: 'leverage', label: 'Max Leverage', current: 4.75, marketMedian: 4.5, marketP25: 4.0, marketP75: 5.25, unit: 'x', tighterIsHigher: false },
      { type: 'interest_coverage', label: 'Interest Coverage', current: 2.5, marketMedian: 2.5, marketP25: 2.0, marketP75: 3.0, unit: 'x', tighterIsHigher: true },
    ],
    structureTerms: [],
    overallScore: 45,
    marketPosition: 'aggressive',
  },
  {
    dealId: 'peer-3',
    dealName: 'CloudNet Infrastructure',
    dealType: 'new_facility',
    borrowerProfile: 'investment_grade',
    industry: 'technology',
    facilityType: 'revolver',
    facilitySize: 300000000,
    margin: {
      current: 1.75,
      marketMedian: 1.5,
      marketP25: 1.25,
      marketP75: 2.0,
      trend: 'down',
      trendPercentage: -12,
      historicalData: [],
    },
    covenants: [
      { type: 'leverage', label: 'Max Leverage', current: 3.5, marketMedian: 3.5, marketP25: 3.0, marketP75: 4.0, unit: 'x', tighterIsHigher: false },
      { type: 'interest_coverage', label: 'Interest Coverage', current: 3.5, marketMedian: 3.0, marketP25: 2.5, marketP75: 3.5, unit: 'x', tighterIsHigher: true },
    ],
    structureTerms: [],
    overallScore: 82,
    marketPosition: 'favorable',
  },
];

export const mockTrendData: MarketTrendData[] = [
  {
    period: '2024-Q1',
    dealType: 'new_facility',
    borrowerProfile: 'leveraged',
    metrics: { avgMargin: 3.15, avgLeverage: 4.8, avgTenor: 5.2, dealVolume: 125000000000, spreadTightening: -8 },
  },
  {
    period: '2024-Q2',
    dealType: 'new_facility',
    borrowerProfile: 'leveraged',
    metrics: { avgMargin: 3.0, avgLeverage: 4.6, avgTenor: 5.3, dealVolume: 142000000000, spreadTightening: -15 },
  },
  {
    period: '2024-Q3',
    dealType: 'new_facility',
    borrowerProfile: 'leveraged',
    metrics: { avgMargin: 2.85, avgLeverage: 4.4, avgTenor: 5.4, dealVolume: 158000000000, spreadTightening: -12 },
  },
  {
    period: '2024-Q4',
    dealType: 'new_facility',
    borrowerProfile: 'leveraged',
    metrics: { avgMargin: 2.75, avgLeverage: 4.2, avgTenor: 5.5, dealVolume: 168000000000, spreadTightening: -10 },
  },
];

export const mockInsights: MarketInsight[] = [
  {
    id: 'insight-1',
    type: 'pricing',
    title: 'Spreads Tightening in Leveraged Segment',
    description: 'Average margins for leveraged loans have compressed 40bps YTD as strong CLO demand drives competition among lenders. Current deal terms are favorable relative to market.',
    impact: 'positive',
    confidence: 85,
    source: 'Market Analysis',
    date: '2024-12-06',
  },
  {
    id: 'insight-2',
    type: 'covenant',
    title: 'Covenant-Lite Structures Dominant',
    description: 'Over 85% of institutional term loans are now covenant-lite. The proposed leverage covenant at 4.0x is tighter than market standard, providing additional lender protection.',
    impact: 'positive',
    confidence: 92,
    source: 'LCD Data',
    date: '2024-12-05',
  },
  {
    id: 'insight-3',
    type: 'structure',
    title: 'Call Protection Weakening',
    description: 'Borrower-friendly call protection terms are becoming more common. The 6-month soft call is shorter than the typical 12-month standard.',
    impact: 'neutral',
    confidence: 78,
    source: 'Market Analysis',
    date: '2024-12-04',
  },
  {
    id: 'insight-4',
    type: 'volume',
    title: 'Record M&A Financing Activity',
    description: 'Q4 2024 is on track for record leveraged loan issuance supporting M&A activity. Strong demand conditions favor borrowers in current negotiations.',
    impact: 'negative',
    confidence: 88,
    source: 'Market Report',
    date: '2024-12-03',
  },
];

export const mockIntelligenceData: IntelligenceDashboardData = {
  currentDeal: mockCurrentDealBenchmark,
  marketStats: mockMarketStats,
  trendData: mockTrendData,
  insights: mockInsights,
  peerComparisons: mockPeerComparisons,
};

// Utility function to format currency
export function formatCurrency(value: number, compact: boolean = false): string {
  if (compact) {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Utility function to get position color
export function getPositionColor(position: 'favorable' | 'market' | 'aggressive'): string {
  switch (position) {
    case 'favorable':
      return 'text-green-600';
    case 'market':
      return 'text-blue-600';
    case 'aggressive':
      return 'text-amber-600';
    default:
      return 'text-zinc-600';
  }
}

// Utility function to get position background
export function getPositionBgColor(position: 'favorable' | 'market' | 'aggressive'): string {
  switch (position) {
    case 'favorable':
      return 'bg-green-50';
    case 'market':
      return 'bg-blue-50';
    case 'aggressive':
      return 'bg-amber-50';
    default:
      return 'bg-zinc-50';
  }
}

// Utility function to calculate percentile position
export function calculatePercentilePosition(current: number, p25: number, p75: number): number {
  const range = p75 - p25;
  if (range === 0) return 50;
  const position = ((current - p25) / range) * 50 + 25;
  return Math.max(0, Math.min(100, position));
}
