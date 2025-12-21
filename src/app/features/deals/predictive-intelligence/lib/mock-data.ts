/**
 * Mock Data for Predictive Deal Intelligence
 *
 * Provides sample data for development and testing of the
 * knowledge graph and prediction features.
 */

import type {
  KnowledgeGraph,
  DealPrediction,
  MarketInsight,
  NegotiationPattern,
  GraphVisualizationData,
  PredictiveIntelligenceDashboardData,
  HistoricalDealAnalysis,
  AggregatedPatterns,
} from './types';
import type { HistoricalDealData } from './graph-engine';

// ============================================
// Historical Deal Data
// ============================================

export const mockHistoricalDeals: HistoricalDealData[] = [
  {
    id: 'deal-hist-001',
    dealName: 'Acme Corp Refinancing',
    dealType: 'refinancing',
    status: 'closed',
    createdAt: '2024-06-15T00:00:00Z',
    closedAt: '2024-08-20T00:00:00Z',
    totalValue: 250000000,
    finalMargin: 2.25,
    negotiationRounds: 4,
    successScore: 85,
    postClosingScore: 90,
    industry: 'manufacturing',
    borrowerProfile: 'leveraged',
    stickingPoints: ['leverage_ratio', 'margin'],
    terms: [
      { termKey: 'margin', termLabel: 'Interest Margin', valueType: 'percentage', finalValue: 2.25, initialValue: 2.5, negotiationRounds: 3, wasContentious: true, category: 'pricing' },
      { termKey: 'leverage_ratio', termLabel: 'Max Leverage', valueType: 'number', finalValue: 4.5, initialValue: 4.0, negotiationRounds: 4, wasContentious: true, category: 'covenants' },
      { termKey: 'tenor', termLabel: 'Facility Tenor', valueType: 'text', finalValue: '5 years', initialValue: '5 years', negotiationRounds: 1, wasContentious: false, category: 'structure' },
    ],
    participants: [
      { id: 'part-001', partyName: 'Acme Corp', partyType: 'borrower_side', dealRole: 'deal_lead', organizationId: 'org-acme' },
      { id: 'part-002', partyName: 'First National Bank', partyType: 'lender_side', dealRole: 'deal_lead', organizationId: 'org-fnb' },
      { id: 'part-003', partyName: 'Regional Credit Union', partyType: 'lender_side', dealRole: 'negotiator', organizationId: 'org-rcu' },
    ],
    marketConditions: { avgMargin: 2.3, avgLeverage: 4.2, marketVolatility: 0.4, dealVolume: 150 },
  },
  {
    id: 'deal-hist-002',
    dealName: 'TechStart Series B Bridge',
    dealType: 'new_facility',
    status: 'closed',
    createdAt: '2024-07-01T00:00:00Z',
    closedAt: '2024-07-25T00:00:00Z',
    totalValue: 75000000,
    finalMargin: 3.0,
    negotiationRounds: 2,
    successScore: 92,
    postClosingScore: 88,
    industry: 'technology',
    borrowerProfile: 'sponsor_backed',
    stickingPoints: ['prepayment_fee'],
    terms: [
      { termKey: 'margin', termLabel: 'Interest Margin', valueType: 'percentage', finalValue: 3.0, initialValue: 3.25, negotiationRounds: 2, wasContentious: false, category: 'pricing' },
      { termKey: 'prepayment_fee', termLabel: 'Prepayment Fee', valueType: 'percentage', finalValue: 2.0, initialValue: 3.0, negotiationRounds: 3, wasContentious: true, category: 'structure' },
    ],
    participants: [
      { id: 'part-004', partyName: 'TechStart Inc', partyType: 'borrower_side', dealRole: 'deal_lead', organizationId: 'org-techstart' },
      { id: 'part-005', partyName: 'Venture Debt Partners', partyType: 'lender_side', dealRole: 'deal_lead', organizationId: 'org-vdp' },
    ],
    marketConditions: { avgMargin: 2.8, avgLeverage: 3.5, marketVolatility: 0.3, dealVolume: 180 },
  },
  {
    id: 'deal-hist-003',
    dealName: 'Healthcare Holdings Amendment',
    dealType: 'amendment',
    status: 'closed',
    createdAt: '2024-08-10T00:00:00Z',
    closedAt: '2024-09-15T00:00:00Z',
    totalValue: 180000000,
    finalMargin: 2.5,
    negotiationRounds: 5,
    successScore: 78,
    postClosingScore: 82,
    industry: 'healthcare',
    borrowerProfile: 'middle_market',
    stickingPoints: ['interest_coverage', 'financial_reporting'],
    terms: [
      { termKey: 'interest_coverage', termLabel: 'Min Interest Coverage', valueType: 'number', finalValue: 2.5, initialValue: 3.0, negotiationRounds: 4, wasContentious: true, category: 'covenants' },
      { termKey: 'financial_reporting', termLabel: 'Reporting Frequency', valueType: 'text', finalValue: 'Quarterly', initialValue: 'Monthly', negotiationRounds: 3, wasContentious: true, category: 'compliance' },
    ],
    participants: [
      { id: 'part-006', partyName: 'Healthcare Holdings LLC', partyType: 'borrower_side', dealRole: 'deal_lead', organizationId: 'org-hh' },
      { id: 'part-007', partyName: 'First National Bank', partyType: 'lender_side', dealRole: 'deal_lead', organizationId: 'org-fnb' },
      { id: 'part-008', partyName: 'Med Finance Corp', partyType: 'lender_side', dealRole: 'negotiator', organizationId: 'org-mfc' },
    ],
    marketConditions: { avgMargin: 2.4, avgLeverage: 4.0, marketVolatility: 0.35, dealVolume: 160 },
  },
  {
    id: 'deal-hist-004',
    dealName: 'Global Retail Restructuring',
    dealType: 'restructuring',
    status: 'closed',
    createdAt: '2024-05-01T00:00:00Z',
    closedAt: '2024-08-30T00:00:00Z',
    totalValue: 500000000,
    finalMargin: 4.0,
    negotiationRounds: 8,
    successScore: 65,
    postClosingScore: 70,
    industry: 'retail',
    borrowerProfile: 'leveraged',
    stickingPoints: ['leverage_ratio', 'interest_coverage', 'asset_coverage', 'margin'],
    terms: [
      { termKey: 'margin', termLabel: 'Interest Margin', valueType: 'percentage', finalValue: 4.0, initialValue: 3.0, negotiationRounds: 5, wasContentious: true, category: 'pricing' },
      { termKey: 'leverage_ratio', termLabel: 'Max Leverage', valueType: 'number', finalValue: 5.5, initialValue: 4.5, negotiationRounds: 6, wasContentious: true, category: 'covenants' },
      { termKey: 'asset_coverage', termLabel: 'Asset Coverage', valueType: 'number', finalValue: 1.25, initialValue: 1.5, negotiationRounds: 4, wasContentious: true, category: 'covenants' },
    ],
    participants: [
      { id: 'part-009', partyName: 'Global Retail Inc', partyType: 'borrower_side', dealRole: 'deal_lead', organizationId: 'org-gri' },
      { id: 'part-010', partyName: 'Mega Bank', partyType: 'lender_side', dealRole: 'deal_lead', organizationId: 'org-mega' },
      { id: 'part-011', partyName: 'Distressed Debt Fund', partyType: 'lender_side', dealRole: 'negotiator', organizationId: 'org-ddf' },
    ],
    marketConditions: { avgMargin: 2.5, avgLeverage: 4.3, marketVolatility: 0.6, dealVolume: 120 },
  },
  {
    id: 'deal-hist-005',
    dealName: 'Energy Transition Facility',
    dealType: 'new_facility',
    status: 'closed',
    createdAt: '2024-09-01T00:00:00Z',
    closedAt: '2024-10-10T00:00:00Z',
    totalValue: 350000000,
    finalMargin: 2.0,
    negotiationRounds: 3,
    successScore: 95,
    postClosingScore: 94,
    industry: 'energy',
    borrowerProfile: 'investment_grade',
    stickingPoints: [],
    terms: [
      { termKey: 'margin', termLabel: 'Interest Margin', valueType: 'percentage', finalValue: 2.0, initialValue: 2.1, negotiationRounds: 1, wasContentious: false, category: 'pricing' },
      { termKey: 'esg_pricing_grid', termLabel: 'ESG Pricing Grid', valueType: 'table', finalValue: 'Yes', initialValue: 'Yes', negotiationRounds: 2, wasContentious: false, category: 'pricing' },
    ],
    participants: [
      { id: 'part-012', partyName: 'CleanEnergy Corp', partyType: 'borrower_side', dealRole: 'deal_lead', organizationId: 'org-ce' },
      { id: 'part-013', partyName: 'Green Finance Bank', partyType: 'lender_side', dealRole: 'deal_lead', organizationId: 'org-gfb' },
    ],
    marketConditions: { avgMargin: 2.2, avgLeverage: 3.8, marketVolatility: 0.25, dealVolume: 200 },
  },
  {
    id: 'deal-hist-006',
    dealName: 'Logistics Hub Expansion',
    dealType: 'new_facility',
    status: 'terminated',
    createdAt: '2024-07-15T00:00:00Z',
    closedAt: undefined,
    totalValue: 120000000,
    finalMargin: undefined,
    negotiationRounds: 6,
    successScore: 35,
    industry: 'logistics',
    borrowerProfile: 'leveraged',
    stickingPoints: ['leverage_ratio', 'security_package'],
    terms: [
      { termKey: 'leverage_ratio', termLabel: 'Max Leverage', valueType: 'number', finalValue: undefined, initialValue: 4.0, negotiationRounds: 5, wasContentious: true, category: 'covenants' },
      { termKey: 'security_package', termLabel: 'Security Package', valueType: 'text', finalValue: undefined, initialValue: 'First lien', negotiationRounds: 6, wasContentious: true, category: 'structure' },
    ],
    participants: [
      { id: 'part-014', partyName: 'Logistics Hub LLC', partyType: 'borrower_side', dealRole: 'deal_lead', organizationId: 'org-lh' },
      { id: 'part-015', partyName: 'Commercial Lending Corp', partyType: 'lender_side', dealRole: 'deal_lead', organizationId: 'org-clc' },
    ],
    marketConditions: { avgMargin: 2.6, avgLeverage: 4.1, marketVolatility: 0.45, dealVolume: 140 },
  },
];

// ============================================
// Mock Predictions
// ============================================

export const mockDealPrediction: DealPrediction = {
  dealId: 'deal-current-001',
  timestamp: new Date().toISOString(),
  predictions: {
    closingProbability: 0.78,
    estimatedClosingDays: 45,
    estimatedRounds: 4,
    likelyStickingPoints: [
      {
        termId: 'term-margin-001',
        termLabel: 'Interest Margin',
        probability: 0.72,
        reason: 'Pricing terms are contentious 65% of the time in similar deals',
        suggestedApproach: 'Consider presenting market data to justify pricing position',
        historicalResolution: {
          avgRoundsToResolve: 3,
          commonCompromises: ['Split the difference on initial margin', 'Add performance-based margin grid'],
        },
      },
      {
        termId: 'term-leverage-001',
        termLabel: 'Leverage Ratio',
        probability: 0.65,
        reason: 'Leverage covenants typically require 4 rounds of negotiation',
        suggestedApproach: 'Propose step-downs tied to deleveraging milestones',
        historicalResolution: {
          avgRoundsToResolve: 4,
          commonCompromises: ['Allow covenant holiday', 'Include cure rights', 'Add seasonal adjustments'],
        },
      },
      {
        termId: 'term-prepay-001',
        termLabel: 'Prepayment Fee',
        probability: 0.48,
        reason: 'Prepayment provisions vary widely in this market segment',
        suggestedApproach: 'Structure declining prepayment fee schedule',
        historicalResolution: {
          avgRoundsToResolve: 2,
          commonCompromises: ['Reduce fee percentage', 'Shorten soft-call period'],
        },
      },
    ],
    recommendedStrategies: [
      {
        id: 'strategy-benchmark',
        name: 'Market Benchmark Anchoring',
        description: 'Use anonymized market data to justify positions',
        applicability: 88,
        expectedOutcome: {
          closingTimeDelta: -10,
          successProbabilityDelta: 0.12,
        },
        steps: [
          'Gather relevant market comparables from the intelligence platform',
          'Prepare percentile analysis for key terms',
          'Present data-driven justification for position',
          'Use market medians as negotiation anchors',
        ],
        supportingEvidence: {
          similarDeals: 24,
          successRate: 0.78,
        },
      },
      {
        id: 'strategy-package',
        name: 'Package Deal Approach',
        description: 'Bundle contentious terms together for simultaneous resolution',
        applicability: 82,
        expectedOutcome: {
          closingTimeDelta: -15,
          successProbabilityDelta: 0.08,
        },
        steps: [
          'Identify interconnected terms (e.g., margin and covenants)',
          'Present terms as a comprehensive package',
          'Offer trade-offs between package elements',
          'Request single approval decision on package',
        ],
        supportingEvidence: {
          similarDeals: 18,
          successRate: 0.72,
        },
      },
      {
        id: 'strategy-sequence',
        name: 'Strategic Concession Sequencing',
        description: 'Order concessions to build momentum toward close',
        applicability: 75,
        expectedOutcome: {
          closingTimeDelta: -8,
          successProbabilityDelta: 0.05,
        },
        steps: [
          'Identify your must-have vs. nice-to-have terms',
          'Start with concessions on lower-priority items',
          'Request reciprocal movement on high-priority terms',
          'Save largest concession for final resolution',
        ],
        supportingEvidence: {
          similarDeals: 15,
          successRate: 0.68,
        },
      },
    ],
    optimalTermStructure: {
      terms: [
        {
          termKey: 'margin',
          termLabel: 'Interest Margin',
          suggestedValue: 2.35,
          reasoning: 'This margin is market-aligned (52nd percentile). Based on 85% of similar successful deals, this value optimizes for both acceptance probability and favorable terms.',
          marketPercentile: 52,
          acceptanceProbability: 0.82,
        },
        {
          termKey: 'leverage_ratio',
          termLabel: 'Max Leverage',
          suggestedValue: 4.25,
          reasoning: 'This leverage ratio is slightly aggressive (42nd percentile). Based on 78% of similar successful deals, this value optimizes for both acceptance probability and favorable terms.',
          marketPercentile: 42,
          acceptanceProbability: 0.75,
        },
        {
          termKey: 'interest_coverage',
          termLabel: 'Min Interest Coverage',
          suggestedValue: 2.75,
          reasoning: 'This coverage ratio is conservative (65th percentile). Based on 90% of similar successful deals, this value optimizes for both acceptance probability and favorable terms.',
          marketPercentile: 65,
          acceptanceProbability: 0.88,
        },
        {
          termKey: 'tenor',
          termLabel: 'Facility Tenor',
          suggestedValue: '5 years',
          reasoning: 'Standard tenor for this deal type. Market-aligned at 50th percentile.',
          marketPercentile: 50,
          acceptanceProbability: 0.92,
        },
      ],
      overallAcceptanceProb: 0.84,
      closingTimeEstimate: 42,
    },
    counterpartyInsights: [
      {
        counterpartyId: 'org-fnb',
        counterpartyName: 'First National Bank',
        insights: {
          typicalAcceptanceRounds: 2,
          preferredTerms: [
            { termKey: 'leverage_ratio', preferredRange: '4.0x - 4.5x' },
            { termKey: 'margin', preferredRange: 'Market to Market+25bps' },
          ],
          negotiationStyle: 'collaborative',
          historicalPatterns: [
            'Experienced counterparty with 45 historical deals',
            'Average deal closing time: 38 days',
            'Prefers collaborative problem-solving approach',
            'Typically accepts after 2 rounds when proposals are market-aligned',
          ],
        },
        recommendation: 'Maintain open communication and focus on mutual value creation. This counterparty responds well to collaborative approaches.',
      },
      {
        counterpartyId: 'org-rcu',
        counterpartyName: 'Regional Credit Union',
        insights: {
          typicalAcceptanceRounds: 3,
          preferredTerms: [
            { termKey: 'interest_coverage', preferredRange: '2.5x - 3.0x' },
            { termKey: 'financial_reporting', preferredRange: 'Quarterly' },
          ],
          negotiationStyle: 'cautious',
          historicalPatterns: [
            'Conservative lender with 12 historical deals',
            'Average deal closing time: 52 days',
            'Requires thorough documentation review',
            'Often requests additional financial covenants',
          ],
        },
        recommendation: 'Provide comprehensive documentation upfront. Allow time for internal review processes.',
      },
    ],
  },
  confidence: 0.76,
  modelVersion: '1.0.0-gnn',
};

// ============================================
// Mock Market Insights
// ============================================

export const mockMarketInsights: MarketInsight[] = [
  {
    id: 'insight-001',
    type: 'term_structure',
    title: 'Deals with this term structure close 40% faster',
    description: 'Analysis of 156 similar deals shows that transactions with streamlined covenant packages close significantly faster than those with complex, multi-tiered structures.',
    statistic: '40% faster close',
    confidence: 82,
    impact: 'positive',
    actionable: true,
    suggestedAction: 'Consider simplifying covenant structure to accelerate closing timeline',
    supportingData: {
      sampleSize: 156,
      timeRange: 'Last 24 months',
      relevantDeals: ['deal-hist-002', 'deal-hist-005'],
    },
  },
  {
    id: 'insight-002',
    type: 'counterparty',
    title: 'This counterparty typically accepts after 2 rounds',
    description: 'Based on historical negotiation patterns, First National Bank tends to reach agreement after an average of 2 negotiation rounds when initial proposals are within 15% of market median.',
    statistic: '2 rounds to acceptance',
    confidence: 75,
    impact: 'positive',
    actionable: true,
    suggestedAction: 'Position initial offer within 10-15% of market to optimize for quick acceptance',
    supportingData: {
      sampleSize: 45,
      timeRange: 'Last 18 months',
      relevantDeals: ['deal-hist-001', 'deal-hist-003'],
    },
  },
  {
    id: 'insight-003',
    type: 'market_trend',
    title: 'Margins tightening 15bps quarter-over-quarter',
    description: 'Current market conditions show a clear trend of margin compression across leveraged loan market segments. This creates pressure to close quickly before further tightening.',
    statistic: '-15bps QoQ',
    confidence: 88,
    impact: 'neutral',
    actionable: true,
    suggestedAction: 'Accelerate timeline to lock in current market terms',
    supportingData: {
      sampleSize: 324,
      timeRange: 'Last 6 months',
      relevantDeals: [],
    },
  },
  {
    id: 'insight-004',
    type: 'timing',
    title: '78% success rate for similar deals',
    description: 'Deals with similar characteristics have a 78% close rate. Key success factors include early alignment on material terms and proactive issue resolution.',
    statistic: '78% success',
    confidence: 71,
    impact: 'positive',
    actionable: false,
    supportingData: {
      sampleSize: 89,
      timeRange: 'Last 24 months',
      relevantDeals: ['deal-hist-001', 'deal-hist-002', 'deal-hist-003'],
    },
  },
  {
    id: 'insight-005',
    type: 'term_structure',
    title: 'ESG pricing grids increase acceptance by 12%',
    description: 'Deals incorporating ESG-linked pricing mechanisms show higher acceptance rates from institutional lenders seeking sustainable investment opportunities.',
    statistic: '+12% acceptance',
    confidence: 68,
    impact: 'positive',
    actionable: true,
    suggestedAction: 'Consider adding ESG KPI-linked margin adjustment mechanism',
    supportingData: {
      sampleSize: 42,
      timeRange: 'Last 12 months',
      relevantDeals: ['deal-hist-005'],
    },
  },
];

// ============================================
// Mock Negotiation Patterns
// ============================================

export const mockNegotiationPatterns: NegotiationPattern[] = [
  {
    id: 'pattern-quick-close',
    name: 'Quick Close Pattern',
    description: 'Deals that close within 30 days typically have pre-aligned principals and streamlined documentation',
    frequency: 0.22,
    successRate: 0.92,
    avgClosingTime: 22,
    characteristics: {
      termSequence: ['pricing', 'tenor', 'covenants', 'documentation'],
      roundPattern: [1, 1, 2],
      concessionPattern: 'early_large_then_small',
    },
    applicableContexts: ['refinancing', 'amendment', 'bilateral'],
  },
  {
    id: 'pattern-anchor-adjust',
    name: 'Anchor and Adjust Pattern',
    description: 'Starting with aggressive anchors leads to better final terms in 65% of cases',
    frequency: 0.35,
    successRate: 0.65,
    avgClosingTime: 52,
    characteristics: {
      termSequence: ['covenants', 'pricing', 'flex', 'documentation'],
      roundPattern: [3, 2, 1, 1],
      concessionPattern: 'large_initial_then_hold',
    },
    applicableContexts: ['new_facility', 'amendment', 'sponsor_backed'],
  },
  {
    id: 'pattern-collaborative',
    name: 'Collaborative Resolution Pattern',
    description: 'Mutual problem-solving approach yields highest satisfaction scores',
    frequency: 0.28,
    successRate: 0.88,
    avgClosingTime: 45,
    characteristics: {
      termSequence: ['structure', 'pricing', 'covenants', 'documentation'],
      roundPattern: [1, 2, 2, 1],
      concessionPattern: 'reciprocal_balanced',
    },
    applicableContexts: ['relationship_bank', 'repeat_borrower', 'bilateral'],
  },
  {
    id: 'pattern-marathon',
    name: 'Marathon Negotiation Pattern',
    description: 'Extended negotiations often result in favorable terms for patient negotiators',
    frequency: 0.15,
    successRate: 0.58,
    avgClosingTime: 95,
    characteristics: {
      termSequence: ['pricing', 'covenants', 'events_of_default', 'representations', 'documentation'],
      roundPattern: [2, 3, 2, 2, 1],
      concessionPattern: 'gradual_symmetric',
    },
    applicableContexts: ['new_facility', 'restructuring', 'multilateral'],
  },
];

// ============================================
// Mock Graph Visualization Data
// ============================================

export const mockGraphVisualization: GraphVisualizationData = {
  nodes: [
    { id: 'deal-current', label: 'Current Deal', type: 'deal', size: 30, color: '#3b82f6', x: 400, y: 300 },
    { id: 'deal-hist-001', label: 'Acme Refinancing', type: 'deal', size: 20, color: '#10b981' },
    { id: 'deal-hist-002', label: 'TechStart Bridge', type: 'deal', size: 18, color: '#10b981' },
    { id: 'deal-hist-003', label: 'Healthcare Amendment', type: 'deal', size: 22, color: '#10b981' },
    { id: 'deal-hist-004', label: 'Global Retail Restructuring', type: 'deal', size: 25, color: '#f59e0b' },
    { id: 'counterparty-fnb', label: 'First National Bank', type: 'counterparty', size: 24, color: '#8b5cf6' },
    { id: 'counterparty-rcu', label: 'Regional Credit Union', type: 'counterparty', size: 16, color: '#8b5cf6' },
    { id: 'term-margin', label: 'Margin Term', type: 'term', size: 14, color: '#ec4899' },
    { id: 'term-leverage', label: 'Leverage Ratio', type: 'term', size: 14, color: '#ec4899' },
    { id: 'market-q3-2024', label: 'Q3 2024 Market', type: 'market_condition', size: 18, color: '#6366f1' },
    { id: 'outcome-success-1', label: 'Closed Successfully', type: 'outcome', size: 12, color: '#10b981' },
  ],
  edges: [
    { id: 'e1', source: 'deal-current', target: 'deal-hist-001', weight: 0.85, color: '#94a3b8' },
    { id: 'e2', source: 'deal-current', target: 'deal-hist-002', weight: 0.72, color: '#94a3b8' },
    { id: 'e3', source: 'deal-current', target: 'deal-hist-003', weight: 0.68, color: '#94a3b8' },
    { id: 'e4', source: 'deal-current', target: 'counterparty-fnb', weight: 1, color: '#8b5cf6' },
    { id: 'e5', source: 'deal-current', target: 'counterparty-rcu', weight: 1, color: '#8b5cf6' },
    { id: 'e6', source: 'deal-current', target: 'term-margin', weight: 1, color: '#ec4899' },
    { id: 'e7', source: 'deal-current', target: 'term-leverage', weight: 1, color: '#ec4899' },
    { id: 'e8', source: 'deal-current', target: 'market-q3-2024', weight: 0.8, color: '#6366f1' },
    { id: 'e9', source: 'deal-hist-001', target: 'counterparty-fnb', weight: 1, color: '#8b5cf6' },
    { id: 'e10', source: 'deal-hist-001', target: 'outcome-success-1', weight: 1, color: '#10b981' },
    { id: 'e11', source: 'counterparty-fnb', target: 'counterparty-rcu', label: '5 deals together', weight: 0.6, color: '#64748b' },
  ],
  layout: 'force',
};

// ============================================
// Mock Dashboard Data
// ============================================

export const mockDashboardData: PredictiveIntelligenceDashboardData = {
  dealId: 'deal-current-001',
  dealName: 'Apex Manufacturing Term Loan B',
  prediction: mockDealPrediction,
  graphSnapshot: {
    relevantNodes: mockGraphVisualization.nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.label,
      properties: {},
    })),
    relevantEdges: mockGraphVisualization.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'similar_to' as const,
      weight: e.weight,
    })),
    clusters: [
      {
        id: 'cluster-refinancing',
        label: 'Refinancing Deals',
        nodeIds: ['deal-hist-001', 'deal-hist-002'],
        characteristics: ['Quick close', 'Established borrowers'],
      },
      {
        id: 'cluster-distressed',
        label: 'Distressed Situations',
        nodeIds: ['deal-hist-004'],
        characteristics: ['Extended negotiations', 'Higher margins'],
      },
    ],
  },
  insights: mockMarketInsights,
  patterns: mockNegotiationPatterns,
  historicalComparisons: {
    similarDeals: [
      { dealId: 'deal-hist-001', dealName: 'Acme Corp Refinancing', similarity: 0.85, outcome: 'closed', closingDays: 66 },
      { dealId: 'deal-hist-002', dealName: 'TechStart Series B Bridge', similarity: 0.72, outcome: 'closed', closingDays: 24 },
      { dealId: 'deal-hist-003', dealName: 'Healthcare Holdings Amendment', similarity: 0.68, outcome: 'closed', closingDays: 36 },
      { dealId: 'deal-hist-005', dealName: 'Energy Transition Facility', similarity: 0.62, outcome: 'closed', closingDays: 39 },
      { dealId: 'deal-hist-006', dealName: 'Logistics Hub Expansion', similarity: 0.55, outcome: 'terminated', closingDays: 0 },
    ],
    avgMetrics: {
      closingDays: 42,
      rounds: 4,
      successRate: 0.78,
    },
  },
};

// ============================================
// Mock Historical Analysis
// ============================================

export const mockHistoricalAnalysis: HistoricalDealAnalysis = {
  dealId: 'deal-hist-001',
  summary: {
    totalDuration: 66,
    negotiationRounds: 4,
    termsNegotiated: 8,
    stickingPoints: ['leverage_ratio', 'margin'],
    finalOutcome: 'closed',
  },
  timeline: [
    { date: '2024-06-15', event: 'Deal initiated', impact: 'Start of negotiation process' },
    { date: '2024-06-22', event: 'Initial term sheet exchanged', impact: 'Counterparty reviewed all terms' },
    { date: '2024-07-05', event: 'Margin disagreement flagged', impact: 'Extended pricing discussion by 10 days' },
    { date: '2024-07-18', event: 'Leverage covenant compromise reached', impact: 'Unlocked other covenant discussions' },
    { date: '2024-08-01', event: 'Documentation phase started', impact: 'Legal teams engaged' },
    { date: '2024-08-15', event: 'Final comments resolved', impact: 'Moved to signing' },
    { date: '2024-08-20', event: 'Deal closed', impact: 'Successful completion' },
  ],
  learnings: [
    'Early alignment on leverage covenant accelerated overall timeline',
    'Market data presentation was effective in margin negotiation',
    'Relationship history with FNB facilitated collaborative resolution',
    'Monthly reporting compromise avoided 2-week delay',
  ],
};

// ============================================
// Mock Aggregated Patterns
// ============================================

export const mockAggregatedPatterns: AggregatedPatterns = {
  byTermType: {
    margin: {
      avgNegotiationRounds: 2.8,
      acceptanceRate: 0.85,
      commonValues: [
        { value: '2.25%', frequency: 0.25 },
        { value: '2.50%', frequency: 0.35 },
        { value: '2.75%', frequency: 0.22 },
        { value: '3.00%', frequency: 0.18 },
      ],
    },
    leverage_ratio: {
      avgNegotiationRounds: 3.5,
      acceptanceRate: 0.72,
      commonValues: [
        { value: '4.0x', frequency: 0.20 },
        { value: '4.25x', frequency: 0.30 },
        { value: '4.5x', frequency: 0.35 },
        { value: '5.0x', frequency: 0.15 },
      ],
    },
    interest_coverage: {
      avgNegotiationRounds: 2.2,
      acceptanceRate: 0.88,
      commonValues: [
        { value: '2.5x', frequency: 0.30 },
        { value: '2.75x', frequency: 0.40 },
        { value: '3.0x', frequency: 0.30 },
      ],
    },
  },
  byCounterparty: {
    'org-fnb': {
      avgClosingDays: 38,
      preferredTerms: ['leverage_ratio', 'margin'],
      negotiationStyle: 'collaborative',
    },
    'org-rcu': {
      avgClosingDays: 52,
      preferredTerms: ['interest_coverage', 'financial_reporting'],
      negotiationStyle: 'cautious',
    },
    'org-mega': {
      avgClosingDays: 65,
      preferredTerms: ['margin', 'security_package'],
      negotiationStyle: 'aggressive',
    },
  },
  byMarketCondition: {
    lowVolatility: { avgMargin: 2.3, avgClosingDays: 35 },
    highVolatility: { avgMargin: 2.8, avgClosingDays: 55 },
  },
};

// ============================================
// Helper Functions
// ============================================

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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-blue-600';
  if (confidence >= 0.4) return 'text-amber-600';
  return 'text-red-600';
}

export function getConfidenceBgColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100';
  if (confidence >= 0.6) return 'bg-blue-100';
  if (confidence >= 0.4) return 'bg-amber-100';
  return 'bg-red-100';
}

export function getImpactColor(impact: 'positive' | 'negative' | 'neutral'): string {
  switch (impact) {
    case 'positive': return 'text-green-600';
    case 'negative': return 'text-amber-600';
    case 'neutral': return 'text-zinc-600';
  }
}

export function getImpactBgColor(impact: 'positive' | 'negative' | 'neutral'): string {
  switch (impact) {
    case 'positive': return 'bg-green-50';
    case 'negative': return 'bg-amber-50';
    case 'neutral': return 'bg-zinc-50';
  }
}
