/**
 * Risk Correlation Mock Data
 *
 * Mock data for the portfolio risk correlation analysis system.
 */

import type {
  BorrowerRiskProfile,
  RiskEvent,
  RiskCorrelation,
  RiskCorrelationDashboard,
  RiskCorrelationAlert,
  RelatedCovenant,
} from './risk-correlation-types';
import {
  calculatePortfolioCorrelations,
  calculatePortfolioMetrics,
  calculateRippleEffect,
} from './risk-correlation-utils';
import {
  borrowers,
  facilities,
  BORROWER_IDS,
  FACILITY_IDS,
} from './borrower-registry';
import {
  toDateString,
  toISOString,
  daysAgo,
  daysFromNow,
  lastUpdated,
  createDeadline,
} from './date-factory';

// =============================================================================
// Mock Borrower Risk Profiles
// =============================================================================

// Helper references from canonical registry
const bAbc = borrowers[BORROWER_IDS.ABC_HOLDINGS];
const bXyz = borrowers[BORROWER_IDS.XYZ_CORP];
const bApollo = borrowers[BORROWER_IDS.APOLLO_INDUSTRIES];
const bNeptune = borrowers[BORROWER_IDS.NEPTUNE_LLC];
const bDelta = borrowers[BORROWER_IDS.DELTA_CORP];
const bOmega = borrowers[BORROWER_IDS.OMEGA_HOLDINGS];
const bEcotech = borrowers[BORROWER_IDS.ECOTECH_LTD];
const bAlpha = borrowers[BORROWER_IDS.ALPHA_PARTNERS];

const fAbc = facilities[FACILITY_IDS.ABC_TERM_A];
const fXyz = facilities[FACILITY_IDS.XYZ_REVOLVER];
const fApollo = facilities[FACILITY_IDS.APOLLO_PROJECT];
const fNeptune = facilities[FACILITY_IDS.NEPTUNE_SYNDICATED];
const fDelta = facilities[FACILITY_IDS.DELTA_WC];
const fOmega = facilities[FACILITY_IDS.OMEGA_ACQUISITION];
const fEcotech = facilities[FACILITY_IDS.ECOTECH_GREEN];
const fAlpha = facilities[FACILITY_IDS.ALPHA_BRIDGE];

export const mockBorrowerProfiles: BorrowerRiskProfile[] = [
  {
    id: bAbc.id,
    name: bAbc.name,
    facilityId: fAbc.id,
    facilityName: fAbc.name,
    industry: bAbc.industry,
    geography: bAbc.geography,
    totalExposure: fAbc.amount,
    esgScore: bAbc.esgScore,
    complianceScore: bAbc.complianceScore,
    creditRating: bAbc.creditRating,
    covenantTypes: fAbc.covenantTypes,
    maturityDate: fAbc.maturityDate,
    riskFactors: [
      {
        id: 'rf-1',
        category: 'compliance',
        name: 'Q4 Financial Statements',
        description: 'Upcoming quarterly reporting deadline',
        severity: 'medium',
        score: 75,
        trend: 'stable',
        lastUpdated: toDateString(daysAgo(9)),
      },
    ],
  },
  {
    id: bXyz.id,
    name: bXyz.name,
    facilityId: fXyz.id,
    facilityName: fXyz.name,
    industry: bXyz.industry,
    geography: bXyz.geography,
    totalExposure: fXyz.amount,
    esgScore: bXyz.esgScore,
    complianceScore: bXyz.complianceScore,
    creditRating: bXyz.creditRating,
    covenantTypes: fXyz.covenantTypes,
    maturityDate: fXyz.maturityDate,
    riskFactors: [
      {
        id: 'rf-2',
        category: 'esg',
        name: 'Carbon Intensity',
        description: 'Above industry average carbon emissions',
        severity: 'medium',
        score: 68,
        trend: 'improving',
        lastUpdated: toDateString(daysAgo(25)),
      },
    ],
  },
  {
    id: bApollo.id,
    name: bApollo.name,
    facilityId: fApollo.id,
    facilityName: fApollo.name,
    industry: bApollo.industry,
    geography: bApollo.geography,
    totalExposure: fApollo.amount,
    esgScore: bApollo.esgScore,
    complianceScore: bApollo.complianceScore,
    creditRating: bApollo.creditRating,
    covenantTypes: fApollo.covenantTypes,
    maturityDate: fApollo.maturityDate,
    riskFactors: [
      {
        id: 'rf-3',
        category: 'esg',
        name: 'ESG Performance',
        description: 'Below target on sustainability KPIs',
        severity: 'high',
        score: 45,
        trend: 'declining',
        lastUpdated: toDateString(daysAgo(5)),
      },
    ],
  },
  {
    id: bNeptune.id,
    name: bNeptune.name,
    facilityId: fNeptune.id,
    facilityName: fNeptune.name,
    industry: bNeptune.industry,
    geography: bNeptune.geography,
    totalExposure: fNeptune.amount,
    esgScore: bNeptune.esgScore,
    complianceScore: bNeptune.complianceScore,
    creditRating: bNeptune.creditRating,
    covenantTypes: fNeptune.covenantTypes,
    maturityDate: fNeptune.maturityDate,
    riskFactors: [
      {
        id: 'rf-4',
        category: 'esg',
        name: 'Carbon Emissions',
        description: 'Critical - 7% below reduction target',
        severity: 'critical',
        score: 35,
        trend: 'declining',
        lastUpdated: toDateString(daysAgo(3)),
      },
      {
        id: 'rf-5',
        category: 'compliance',
        name: 'Annual Review Overdue',
        description: 'Review documentation pending 3 days',
        severity: 'high',
        score: 55,
        trend: 'declining',
        lastUpdated: toDateString(daysAgo(3)),
      },
    ],
  },
  {
    id: bDelta.id,
    name: bDelta.name,
    facilityId: fDelta.id,
    facilityName: fDelta.name,
    industry: bDelta.industry,
    geography: bDelta.geography,
    totalExposure: fDelta.amount,
    esgScore: bDelta.esgScore,
    complianceScore: bDelta.complianceScore,
    creditRating: bDelta.creditRating,
    covenantTypes: fDelta.covenantTypes,
    maturityDate: fDelta.maturityDate,
    riskFactors: [],
  },
  {
    id: bOmega.id,
    name: bOmega.name,
    facilityId: fOmega.id,
    facilityName: fOmega.name,
    industry: bOmega.industry,
    geography: bOmega.geography,
    totalExposure: fOmega.amount,
    esgScore: bOmega.esgScore,
    complianceScore: bOmega.complianceScore,
    creditRating: bOmega.creditRating,
    covenantTypes: fOmega.covenantTypes,
    maturityDate: fOmega.maturityDate,
    riskFactors: [
      {
        id: 'rf-6',
        category: 'market',
        name: 'Currency Exposure',
        description: 'Significant USD/CNY exposure',
        severity: 'medium',
        score: 60,
        trend: 'stable',
        lastUpdated: toDateString(daysAgo(9)),
      },
    ],
  },
  {
    id: bEcotech.id,
    name: bEcotech.name,
    facilityId: fEcotech.id,
    facilityName: fEcotech.name,
    industry: bEcotech.industry,
    geography: bEcotech.geography,
    totalExposure: fEcotech.amount,
    esgScore: bEcotech.esgScore,
    complianceScore: bEcotech.complianceScore,
    creditRating: bEcotech.creditRating,
    covenantTypes: fEcotech.covenantTypes,
    maturityDate: fEcotech.maturityDate,
    riskFactors: [
      {
        id: 'rf-7',
        category: 'esg',
        name: 'Renewable Energy Usage',
        description: '12% below target but improving',
        severity: 'medium',
        score: 65,
        trend: 'improving',
        lastUpdated: toDateString(daysAgo(7)),
      },
    ],
  },
  {
    id: bAlpha.id,
    name: bAlpha.name,
    facilityId: fAlpha.id,
    facilityName: fAlpha.name,
    industry: bAlpha.industry,
    geography: bAlpha.geography,
    totalExposure: fAlpha.amount,
    esgScore: bAlpha.esgScore,
    complianceScore: bAlpha.complianceScore,
    creditRating: bAlpha.creditRating,
    covenantTypes: fAlpha.covenantTypes,
    maturityDate: fAlpha.maturityDate,
    riskFactors: [],
  },
];

// =============================================================================
// Active Risk Events
// =============================================================================

export const mockRiskEvents: RiskEvent[] = [
  {
    id: 'event-1',
    type: 'esg_breach',
    title: 'Carbon Emissions Target Missed',
    description:
      `${bNeptune.name} is 7% below their annual carbon reduction target, triggering potential margin adjustment`,
    borrowerId: bNeptune.id,
    borrowerName: bNeptune.name,
    facilityId: fNeptune.id,
    category: 'esg',
    severity: 'critical',
    occurredAt: toISOString(daysAgo(5)),
    detectedAt: toISOString(daysAgo(3)),
    status: 'active',
  },
  {
    id: 'event-2',
    type: 'compliance_overdue',
    title: 'Annual Review Overdue',
    description:
      `${bNeptune.name} annual review documentation is overdue by 3 days`,
    borrowerId: bNeptune.id,
    borrowerName: bNeptune.name,
    facilityId: fNeptune.id,
    category: 'compliance',
    severity: 'high',
    occurredAt: toISOString(daysAgo(6)),
    detectedAt: toISOString(daysAgo(3)),
    status: 'active',
  },
  {
    id: 'event-3',
    type: 'esg_warning',
    title: 'ESG KPI At Risk',
    description:
      `${bApollo.name} is showing declining sustainability performance`,
    borrowerId: bApollo.id,
    borrowerName: bApollo.name,
    facilityId: fApollo.id,
    category: 'esg',
    severity: 'high',
    occurredAt: toISOString(daysAgo(7)),
    detectedAt: toISOString(daysAgo(5)),
    status: 'active',
  },
];

// =============================================================================
// Upcoming Related Covenants
// =============================================================================

// Create covenant deadlines
const covDeadline5 = createDeadline(5, 'iso');
const covDeadline10 = createDeadline(10, 'iso');
const covDeadline21 = createDeadline(21, 'iso');
const covDeadline26 = createDeadline(26, 'iso');

export const mockUpcomingCovenants: RelatedCovenant[] = [
  {
    id: 'cov-1',
    name: 'Q4 Financial Statements',
    type: 'Reporting',
    dueDate: covDeadline5.dueDate,
    status: 'due_soon',
    borrowerName: bAbc.name,
    facilityName: fAbc.name,
  },
  {
    id: 'cov-2',
    name: 'Leverage Ratio Test',
    type: 'Financial Covenant',
    dueDate: covDeadline10.dueDate,
    status: 'upcoming',
    borrowerName: bXyz.name,
    facilityName: fXyz.name,
  },
  {
    id: 'cov-3',
    name: 'ESG Performance Report',
    type: 'ESG',
    dueDate: covDeadline21.dueDate,
    status: 'upcoming',
    borrowerName: bNeptune.name,
    facilityName: fNeptune.name,
  },
  {
    id: 'cov-4',
    name: 'Leverage Ratio Test',
    type: 'Financial Covenant',
    dueDate: covDeadline21.dueDate,
    status: 'upcoming',
    borrowerName: bApollo.name,
    facilityName: fApollo.name,
  },
  {
    id: 'cov-5',
    name: 'Interest Coverage Test',
    type: 'Financial Covenant',
    dueDate: covDeadline26.dueDate,
    status: 'upcoming',
    borrowerName: bOmega.name,
    facilityName: fOmega.name,
  },
];

// =============================================================================
// Risk Correlation Alerts
// =============================================================================

export const mockAlerts: RiskCorrelationAlert[] = [
  {
    id: 'alert-1',
    type: 'ripple_risk',
    severity: 'critical',
    title: 'ESG Event May Impact Correlated Energy Positions',
    description:
      `${bNeptune.name}'s carbon emissions breach may affect other energy sector borrowers with similar ESG profiles`,
    affectedBorrowers: [bNeptune.name, bApollo.name, bEcotech.name],
    recommendations: [
      'Review ESG compliance status of energy sector borrowers',
      'Initiate proactive outreach to at-risk facilities',
    ],
    createdAt: toISOString(daysAgo(3)),
  },
  {
    id: 'alert-2',
    type: 'concentration',
    severity: 'high',
    title: 'Technology Sector Concentration Above Threshold',
    description:
      'Technology sector exposure is at 45% of portfolio, exceeding 40% threshold',
    affectedBorrowers: [bAbc.name, bXyz.name, bOmega.name],
    recommendations: [
      'Consider diversification strategies',
      'Monitor tech sector market conditions',
    ],
    createdAt: toISOString(daysAgo(4)),
  },
  {
    id: 'alert-3',
    type: 'correlation_spike',
    severity: 'medium',
    title: 'Increased Correlation in European Portfolio',
    description:
      'European borrowers showing increased risk correlation due to regulatory changes',
    affectedBorrowers: [bApollo.name, bNeptune.name, bEcotech.name],
    recommendations: [
      'Review exposure to EU regulatory changes',
      'Update stress test scenarios',
    ],
    createdAt: toISOString(daysAgo(5)),
  },
];

// =============================================================================
// Computed Mock Data
// =============================================================================

// Calculate correlations from mock data
export const mockCorrelations: RiskCorrelation[] =
  calculatePortfolioCorrelations(mockBorrowerProfiles);

// Calculate portfolio metrics
export const mockPortfolioMetrics = calculatePortfolioMetrics(
  mockBorrowerProfiles,
  mockCorrelations
);

// Calculate ripple effect for the primary risk event
export const mockRippleEffect = calculateRippleEffect(
  mockRiskEvents[0],
  mockBorrowerProfiles,
  mockCorrelations
);

// Full dashboard data
export const mockRiskCorrelationDashboard: RiskCorrelationDashboard = {
  lastUpdated: lastUpdated(2),
  portfolioMetrics: mockPortfolioMetrics,
  activeRiskEvents: mockRiskEvents,
  recentRippleEffects: [mockRippleEffect],
  highCorrelationPairs: mockCorrelations.slice(0, 5),
  upcomingRelatedDeadlines: mockUpcomingCovenants,
  alerts: mockAlerts,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get borrower by ID
 */
export function getBorrowerById(id: string): BorrowerRiskProfile | undefined {
  return mockBorrowerProfiles.find((b) => b.id === id);
}

/**
 * Get correlations for a specific borrower
 */
export function getCorrelationsForBorrower(borrowerId: string): RiskCorrelation[] {
  return mockCorrelations.filter(
    (c) => c.borrower1Id === borrowerId || c.borrower2Id === borrowerId
  );
}

/**
 * Get events for a specific borrower
 */
export function getEventsForBorrower(borrowerId: string): RiskEvent[] {
  return mockRiskEvents.filter((e) => e.borrowerId === borrowerId);
}
