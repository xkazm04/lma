// Mock data for Cross-Deal Term Intelligence Dashboard

import type {
  TermIntelligenceDashboardData,
  MarginNegotiationDelta,
  TermGroundAnalysis,
  NegotiationSequence,
  CounterpartyRelationship,
  CounterpartyHeatmapCell,
  PortfolioPerformance,
  TimeSeriesDataPoint,
  TermCategory,
} from './types';

// Generate dates for the past N months
function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

export const mockPortfolioPerformance: PortfolioPerformance = {
  totalDeals: 47,
  totalVolume: 12500000000, // $12.5B
  avgNegotiationDays: 18.3,
  avgMarginDelta: -0.15, // User achieves 15bps better than initial ask
  avgCovenantDelta: 0.08, // User gives 8% ground on covenants
  overallSuccessRate: 72,
  topStrengths: [
    {
      area: 'Margin Negotiation',
      description: 'Consistently achieve better margins than initial ask',
      metric: -0.15,
      benchmark: -0.08,
      impact: 'high',
    },
    {
      area: 'Commitment Fee Terms',
      description: 'Strong track record on fee negotiations',
      metric: -0.05,
      benchmark: 0.02,
      impact: 'medium',
    },
    {
      area: 'Maturity Extensions',
      description: 'Above average success in extending maturities',
      metric: 6.2,
      benchmark: 4.8,
      impact: 'medium',
    },
  ],
  areasForImprovement: [
    {
      area: 'Leverage Covenants',
      description: 'Tend to concede more than market average',
      metric: 0.25,
      benchmark: 0.15,
      impact: 'high',
    },
    {
      area: 'Call Protection',
      description: 'Often accept shorter call protection periods',
      metric: 6.0,
      benchmark: 9.0,
      impact: 'medium',
    },
  ],
};

export const mockMarginDeltas: MarginNegotiationDelta[] = [
  {
    dealId: 'deal-1',
    dealName: 'Project Apollo - Term Loan',
    dealType: 'new_facility',
    initialAsk: 3.0,
    finalMargin: 2.5,
    delta: -0.5,
    deltaPercent: -16.7,
    closedDate: getDateMonthsAgo(1),
    counterparty: 'BigBank NA',
    facilitySizeM: 500,
  },
  {
    dealId: 'deal-2',
    dealName: 'XYZ Corp Amendment',
    dealType: 'amendment',
    initialAsk: 2.75,
    finalMargin: 2.5,
    delta: -0.25,
    deltaPercent: -9.1,
    closedDate: getDateMonthsAgo(2),
    counterparty: 'Capital Partners Fund',
    facilitySizeM: 350,
  },
  {
    dealId: 'deal-3',
    dealName: 'Neptune Holdings Refi',
    dealType: 'refinancing',
    initialAsk: 3.25,
    finalMargin: 3.0,
    delta: -0.25,
    deltaPercent: -7.7,
    closedDate: getDateMonthsAgo(3),
    counterparty: 'Syndicate Bank',
    facilitySizeM: 750,
  },
  {
    dealId: 'deal-4',
    dealName: 'Delta Corp Extension',
    dealType: 'extension',
    initialAsk: 2.5,
    finalMargin: 2.65,
    delta: 0.15,
    deltaPercent: 6.0,
    closedDate: getDateMonthsAgo(4),
    counterparty: 'BigBank NA',
    facilitySizeM: 280,
  },
  {
    dealId: 'deal-5',
    dealName: 'Omega Group Term Loan',
    dealType: 'new_facility',
    initialAsk: 3.5,
    finalMargin: 3.0,
    delta: -0.5,
    deltaPercent: -14.3,
    closedDate: getDateMonthsAgo(5),
    counterparty: 'Regional Credit Union',
    facilitySizeM: 200,
  },
  {
    dealId: 'deal-6',
    dealName: 'TechCorp Acquisition',
    dealType: 'new_facility',
    initialAsk: 2.85,
    finalMargin: 2.75,
    delta: -0.1,
    deltaPercent: -3.5,
    closedDate: getDateMonthsAgo(6),
    counterparty: 'Institutional Investors LLC',
    facilitySizeM: 650,
  },
  {
    dealId: 'deal-7',
    dealName: 'CloudNet Infrastructure',
    dealType: 'refinancing',
    initialAsk: 2.25,
    finalMargin: 2.0,
    delta: -0.25,
    deltaPercent: -11.1,
    closedDate: getDateMonthsAgo(7),
    counterparty: 'Capital Partners Fund',
    facilitySizeM: 420,
  },
  {
    dealId: 'deal-8',
    dealName: 'DataFlow Systems',
    dealType: 'amendment',
    initialAsk: 3.0,
    finalMargin: 3.15,
    delta: 0.15,
    deltaPercent: 5.0,
    closedDate: getDateMonthsAgo(8),
    counterparty: 'BigBank NA',
    facilitySizeM: 180,
  },
];

export const mockTermGroundAnalysis: TermGroundAnalysis[] = [
  {
    termKey: 'margin',
    termLabel: 'Interest Margin',
    termCategory: 'pricing',
    totalNegotiations: 47,
    avgUserDelta: -0.15,
    avgMarketDelta: -0.08,
    variance: -0.07,
    consistentlyGivesGround: false,
    successRate: 78,
    exampleDeals: ['Project Apollo', 'Neptune Holdings'],
  },
  {
    termKey: 'leverage_ratio',
    termLabel: 'Maximum Leverage Ratio',
    termCategory: 'covenants',
    totalNegotiations: 42,
    avgUserDelta: 0.25,
    avgMarketDelta: 0.15,
    variance: 0.10,
    consistentlyGivesGround: true,
    successRate: 52,
    exampleDeals: ['XYZ Corp Amendment', 'Delta Corp'],
  },
  {
    termKey: 'interest_coverage',
    termLabel: 'Minimum Interest Coverage',
    termCategory: 'covenants',
    totalNegotiations: 38,
    avgUserDelta: 0.12,
    avgMarketDelta: 0.10,
    variance: 0.02,
    consistentlyGivesGround: false,
    successRate: 65,
    exampleDeals: ['Omega Group', 'TechCorp'],
  },
  {
    termKey: 'commitment_fee',
    termLabel: 'Commitment Fee',
    termCategory: 'pricing',
    totalNegotiations: 35,
    avgUserDelta: -0.05,
    avgMarketDelta: 0.02,
    variance: -0.07,
    consistentlyGivesGround: false,
    successRate: 82,
    exampleDeals: ['CloudNet', 'DataFlow'],
  },
  {
    termKey: 'call_protection',
    termLabel: 'Call Protection Period',
    termCategory: 'structure',
    totalNegotiations: 28,
    avgUserDelta: -3.0,
    avgMarketDelta: -1.5,
    variance: -1.5,
    consistentlyGivesGround: true,
    successRate: 45,
    exampleDeals: ['Neptune Holdings'],
  },
  {
    termKey: 'maturity',
    termLabel: 'Maturity Extension',
    termCategory: 'facility',
    totalNegotiations: 24,
    avgUserDelta: 6.2,
    avgMarketDelta: 4.8,
    variance: 1.4,
    consistentlyGivesGround: false,
    successRate: 75,
    exampleDeals: ['Delta Corp Extension'],
  },
];

export const mockNegotiationSequences: NegotiationSequence[] = [
  {
    id: 'seq-1',
    termCategory: 'pricing',
    termLabel: 'Margin Compression Strategy',
    sequence: [
      {
        stepNumber: 1,
        action: 'initial_proposal',
        description: 'Start 50bps below initial ask with market data support',
        avgDaysToNext: 2,
        successProbability: 0.45,
      },
      {
        stepNumber: 2,
        action: 'holdout',
        description: 'Reference competitive bids and market trends',
        avgDaysToNext: 3,
        successProbability: 0.62,
      },
      {
        stepNumber: 3,
        action: 'package_deal',
        description: 'Offer to flex on commitment fee in exchange for margin',
        avgDaysToNext: 2,
        successProbability: 0.78,
      },
      {
        stepNumber: 4,
        action: 'final_offer',
        description: 'Lock in terms with 25bps improvement',
        avgDaysToNext: 1,
        successProbability: 0.85,
      },
    ],
    successRate: 78,
    avgOutcomeImprovement: 0.25,
    usageCount: 23,
    topPerformers: ['deal-1', 'deal-5', 'deal-7'],
  },
  {
    id: 'seq-2',
    termCategory: 'covenants',
    termLabel: 'Covenant Flexibility Approach',
    sequence: [
      {
        stepNumber: 1,
        action: 'initial_proposal',
        description: 'Request higher leverage ceiling with step-downs',
        avgDaysToNext: 3,
        successProbability: 0.35,
      },
      {
        stepNumber: 2,
        action: 'concession',
        description: 'Offer tighter EBITDA add-back definitions',
        avgDaysToNext: 2,
        successProbability: 0.55,
      },
      {
        stepNumber: 3,
        action: 'counter',
        description: 'Propose cure rights mechanism',
        avgDaysToNext: 4,
        successProbability: 0.68,
      },
    ],
    successRate: 62,
    avgOutcomeImprovement: 0.15,
    usageCount: 18,
    topPerformers: ['deal-3', 'deal-6'],
  },
  {
    id: 'seq-3',
    termCategory: 'structure',
    termLabel: 'Flexibility Enhancement',
    sequence: [
      {
        stepNumber: 1,
        action: 'initial_proposal',
        description: 'Request incremental facility capacity',
        avgDaysToNext: 2,
        successProbability: 0.50,
      },
      {
        stepNumber: 2,
        action: 'package_deal',
        description: 'Bundle with tighter most-favored-lender provisions',
        avgDaysToNext: 3,
        successProbability: 0.72,
      },
    ],
    successRate: 70,
    avgOutcomeImprovement: 0.20,
    usageCount: 15,
    topPerformers: ['deal-1', 'deal-3'],
  },
];

export const mockCounterpartyRelationships: CounterpartyRelationship[] = [
  {
    counterpartyId: 'cp-1',
    counterpartyName: 'BigBank NA',
    counterpartyType: 'bank',
    totalDeals: 15,
    avgNegotiationDays: 14,
    avgTermsAgreedFirst: 65,
    successfulDeals: 12,
    avgMarginDelta: -0.18,
    avgCovenantDelta: 0.08,
    relationshipScore: 85,
    lastDealDate: getDateMonthsAgo(1),
    communicationStyle: 'collaborative',
  },
  {
    counterpartyId: 'cp-2',
    counterpartyName: 'Capital Partners Fund',
    counterpartyType: 'fund',
    totalDeals: 8,
    avgNegotiationDays: 21,
    avgTermsAgreedFirst: 45,
    successfulDeals: 5,
    avgMarginDelta: -0.12,
    avgCovenantDelta: 0.15,
    relationshipScore: 68,
    lastDealDate: getDateMonthsAgo(2),
    communicationStyle: 'competitive',
  },
  {
    counterpartyId: 'cp-3',
    counterpartyName: 'Institutional Investors LLC',
    counterpartyType: 'institutional',
    totalDeals: 12,
    avgNegotiationDays: 16,
    avgTermsAgreedFirst: 58,
    successfulDeals: 9,
    avgMarginDelta: -0.15,
    avgCovenantDelta: 0.10,
    relationshipScore: 78,
    lastDealDate: getDateMonthsAgo(3),
    communicationStyle: 'mixed',
  },
  {
    counterpartyId: 'cp-4',
    counterpartyName: 'Syndicate Bank',
    counterpartyType: 'bank',
    totalDeals: 6,
    avgNegotiationDays: 19,
    avgTermsAgreedFirst: 52,
    successfulDeals: 4,
    avgMarginDelta: -0.08,
    avgCovenantDelta: 0.12,
    relationshipScore: 72,
    lastDealDate: getDateMonthsAgo(4),
    communicationStyle: 'collaborative',
  },
  {
    counterpartyId: 'cp-5',
    counterpartyName: 'Regional Credit Union',
    counterpartyType: 'bank',
    totalDeals: 4,
    avgNegotiationDays: 12,
    avgTermsAgreedFirst: 72,
    successfulDeals: 4,
    avgMarginDelta: -0.22,
    avgCovenantDelta: 0.05,
    relationshipScore: 92,
    lastDealDate: getDateMonthsAgo(5),
    communicationStyle: 'collaborative',
  },
  {
    counterpartyId: 'cp-6',
    counterpartyName: 'Private Equity Partners',
    counterpartyType: 'sponsor',
    totalDeals: 3,
    avgNegotiationDays: 25,
    avgTermsAgreedFirst: 38,
    successfulDeals: 2,
    avgMarginDelta: 0.05,
    avgCovenantDelta: 0.22,
    relationshipScore: 55,
    lastDealDate: getDateMonthsAgo(8),
    communicationStyle: 'competitive',
  },
];

const termCategories: TermCategory[] = ['pricing', 'covenants', 'structure', 'facility'];

export const mockCounterpartyHeatmap: CounterpartyHeatmapCell[] = mockCounterpartyRelationships.flatMap((cp) =>
  termCategories.map((category) => ({
    counterpartyId: cp.counterpartyId,
    counterpartyName: cp.counterpartyName,
    termCategory: category,
    avgDelta: Math.random() * 0.4 - 0.2, // Random delta between -0.2 and 0.2
    negotiationCount: Math.floor(Math.random() * cp.totalDeals) + 1,
    efficiency: Math.floor(Math.random() * 40) + 50, // Random efficiency 50-90
  }))
);

export const mockMarginDeltaTimeSeries: TimeSeriesDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
  period: getDateMonthsAgo(11 - i).substring(0, 7), // YYYY-MM format
  value: -0.08 - Math.random() * 0.15, // User delta
  benchmark: -0.05 - Math.random() * 0.08, // Market benchmark
}));

export const mockTermIntelligenceData: TermIntelligenceDashboardData = {
  portfolioPerformance: mockPortfolioPerformance,
  marginDeltas: mockMarginDeltas,
  termGroundAnalysis: mockTermGroundAnalysis,
  negotiationSequences: mockNegotiationSequences,
  counterpartyRelationships: mockCounterpartyRelationships,
  counterpartyHeatmap: mockCounterpartyHeatmap,
  marginDeltaTimeSeries: mockMarginDeltaTimeSeries,
};

// Utility functions
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

export function formatDelta(value: number, includeSign: boolean = true): string {
  const sign = value > 0 ? '+' : '';
  return includeSign ? `${sign}${(value * 100).toFixed(0)}bps` : `${(value * 100).toFixed(0)}bps`;
}

export function formatPercent(value: number, decimals: number = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-50';
  if (score >= 60) return 'bg-blue-50';
  if (score >= 40) return 'bg-amber-50';
  return 'bg-red-50';
}

export function getDeltaColor(delta: number, positiveIsGood: boolean = false): string {
  if (positiveIsGood) {
    return delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-zinc-600';
  }
  return delta < 0 ? 'text-green-600' : delta > 0 ? 'text-red-600' : 'text-zinc-600';
}

export function getCategoryLabel(category: TermCategory): string {
  const labels: Record<TermCategory, string> = {
    facility: 'Facility Terms',
    pricing: 'Pricing',
    covenants: 'Covenants',
    structure: 'Structure',
    collateral: 'Collateral',
    events_of_default: 'Events of Default',
  };
  return labels[category];
}
