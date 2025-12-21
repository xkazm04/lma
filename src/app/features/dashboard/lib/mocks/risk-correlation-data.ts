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

// =============================================================================
// Mock Borrower Risk Profiles
// =============================================================================

export const mockBorrowerProfiles: BorrowerRiskProfile[] = [
  {
    id: 'borrower-1',
    name: 'ABC Holdings',
    facilityId: 'fac-1',
    facilityName: 'Term Loan A',
    industry: 'Technology',
    geography: 'North America',
    totalExposure: 50_000_000,
    esgScore: 72,
    complianceScore: 85,
    creditRating: 'BBB+',
    covenantTypes: ['Leverage Ratio', 'Interest Coverage', 'EBITDA'],
    maturityDate: '2026-12-15',
    riskFactors: [
      {
        id: 'rf-1',
        category: 'compliance',
        name: 'Q4 Financial Statements',
        description: 'Upcoming quarterly reporting deadline',
        severity: 'medium',
        score: 75,
        trend: 'stable',
        lastUpdated: '2024-12-01',
      },
    ],
  },
  {
    id: 'borrower-2',
    name: 'XYZ Corp',
    facilityId: 'fac-2',
    facilityName: 'Revolving Facility',
    industry: 'Technology',
    geography: 'North America',
    totalExposure: 75_000_000,
    esgScore: 68,
    complianceScore: 88,
    creditRating: 'A-',
    covenantTypes: ['Leverage Ratio', 'Fixed Charge Coverage', 'Net Worth'],
    maturityDate: '2027-06-30',
    riskFactors: [
      {
        id: 'rf-2',
        category: 'esg',
        name: 'Carbon Intensity',
        description: 'Above industry average carbon emissions',
        severity: 'medium',
        score: 68,
        trend: 'improving',
        lastUpdated: '2024-11-15',
      },
    ],
  },
  {
    id: 'borrower-3',
    name: 'Apollo Industries',
    facilityId: 'fac-3',
    facilityName: 'Project Apollo',
    industry: 'Manufacturing',
    geography: 'Europe',
    totalExposure: 120_000_000,
    esgScore: 58,
    complianceScore: 72,
    creditRating: 'BBB',
    covenantTypes: ['Leverage Ratio', 'Asset Coverage', 'EBITDA'],
    maturityDate: '2025-09-30',
    riskFactors: [
      {
        id: 'rf-3',
        category: 'esg',
        name: 'ESG Performance',
        description: 'Below target on sustainability KPIs',
        severity: 'high',
        score: 45,
        trend: 'declining',
        lastUpdated: '2024-12-05',
      },
    ],
  },
  {
    id: 'borrower-4',
    name: 'Neptune LLC',
    facilityId: 'fac-4',
    facilityName: 'Project Neptune',
    industry: 'Energy',
    geography: 'Europe',
    totalExposure: 85_000_000,
    esgScore: 45,
    complianceScore: 62,
    creditRating: 'BB+',
    covenantTypes: ['Leverage Ratio', 'Interest Coverage', 'Cash Flow'],
    maturityDate: '2025-06-15',
    riskFactors: [
      {
        id: 'rf-4',
        category: 'esg',
        name: 'Carbon Emissions',
        description: 'Critical - 7% below reduction target',
        severity: 'critical',
        score: 35,
        trend: 'declining',
        lastUpdated: '2024-12-07',
      },
      {
        id: 'rf-5',
        category: 'compliance',
        name: 'Annual Review Overdue',
        description: 'Review documentation pending 3 days',
        severity: 'high',
        score: 55,
        trend: 'declining',
        lastUpdated: '2024-12-07',
      },
    ],
  },
  {
    id: 'borrower-5',
    name: 'Delta Corp',
    facilityId: 'fac-5',
    facilityName: 'Working Capital',
    industry: 'Retail',
    geography: 'North America',
    totalExposure: 25_000_000,
    esgScore: 78,
    complianceScore: 91,
    creditRating: 'A',
    covenantTypes: ['Current Ratio', 'Net Worth', 'Inventory Turnover'],
    maturityDate: '2026-03-31',
    riskFactors: [],
  },
  {
    id: 'borrower-6',
    name: 'Omega Holdings',
    facilityId: 'fac-6',
    facilityName: 'Acquisition Finance',
    industry: 'Technology',
    geography: 'Asia Pacific',
    totalExposure: 200_000_000,
    esgScore: 65,
    complianceScore: 80,
    creditRating: 'BBB-',
    covenantTypes: ['Leverage Ratio', 'Interest Coverage', 'EBITDA'],
    maturityDate: '2028-01-15',
    riskFactors: [
      {
        id: 'rf-6',
        category: 'market',
        name: 'Currency Exposure',
        description: 'Significant USD/CNY exposure',
        severity: 'medium',
        score: 60,
        trend: 'stable',
        lastUpdated: '2024-12-01',
      },
    ],
  },
  {
    id: 'borrower-7',
    name: 'EcoTech Ltd',
    facilityId: 'fac-7',
    facilityName: 'Green Bond',
    industry: 'Clean Energy',
    geography: 'Europe',
    totalExposure: 60_000_000,
    esgScore: 88,
    complianceScore: 94,
    creditRating: 'A-',
    covenantTypes: ['Renewable Usage', 'Carbon Reduction', 'Impact Metrics'],
    maturityDate: '2029-12-31',
    riskFactors: [
      {
        id: 'rf-7',
        category: 'esg',
        name: 'Renewable Energy Usage',
        description: '12% below target but improving',
        severity: 'medium',
        score: 65,
        trend: 'improving',
        lastUpdated: '2024-12-03',
      },
    ],
  },
  {
    id: 'borrower-8',
    name: 'Alpha Partners',
    facilityId: 'fac-8',
    facilityName: 'Bridge Loan',
    industry: 'Financial Services',
    geography: 'North America',
    totalExposure: 15_000_000,
    esgScore: 75,
    complianceScore: 89,
    creditRating: 'A',
    covenantTypes: ['Leverage Ratio', 'Liquidity Ratio', 'Capital Adequacy'],
    maturityDate: '2025-03-15',
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
      'Neptune LLC is 7% below their annual carbon reduction target, triggering potential margin adjustment',
    borrowerId: 'borrower-4',
    borrowerName: 'Neptune LLC',
    facilityId: 'fac-4',
    category: 'esg',
    severity: 'critical',
    occurredAt: '2024-12-05T10:00:00Z',
    detectedAt: '2024-12-07T09:30:00Z',
    status: 'active',
  },
  {
    id: 'event-2',
    type: 'compliance_overdue',
    title: 'Annual Review Overdue',
    description:
      'Neptune LLC annual review documentation is overdue by 3 days',
    borrowerId: 'borrower-4',
    borrowerName: 'Neptune LLC',
    facilityId: 'fac-4',
    category: 'compliance',
    severity: 'high',
    occurredAt: '2024-12-04T00:00:00Z',
    detectedAt: '2024-12-07T08:00:00Z',
    status: 'active',
  },
  {
    id: 'event-3',
    type: 'esg_warning',
    title: 'ESG KPI At Risk',
    description:
      'Apollo Industries is showing declining sustainability performance',
    borrowerId: 'borrower-3',
    borrowerName: 'Apollo Industries',
    facilityId: 'fac-3',
    category: 'esg',
    severity: 'high',
    occurredAt: '2024-12-03T14:00:00Z',
    detectedAt: '2024-12-05T11:00:00Z',
    status: 'active',
  },
];

// =============================================================================
// Upcoming Related Covenants
// =============================================================================

export const mockUpcomingCovenants: RelatedCovenant[] = [
  {
    id: 'cov-1',
    name: 'Q4 Financial Statements',
    type: 'Reporting',
    dueDate: '2024-12-15',
    status: 'due_soon',
    borrowerName: 'ABC Holdings',
    facilityName: 'Term Loan A',
  },
  {
    id: 'cov-2',
    name: 'Leverage Ratio Test',
    type: 'Financial Covenant',
    dueDate: '2024-12-20',
    status: 'upcoming',
    borrowerName: 'XYZ Corp',
    facilityName: 'Revolving Facility',
  },
  {
    id: 'cov-3',
    name: 'ESG Performance Report',
    type: 'ESG',
    dueDate: '2024-12-31',
    status: 'upcoming',
    borrowerName: 'Neptune LLC',
    facilityName: 'Project Neptune',
  },
  {
    id: 'cov-4',
    name: 'Leverage Ratio Test',
    type: 'Financial Covenant',
    dueDate: '2024-12-31',
    status: 'upcoming',
    borrowerName: 'Apollo Industries',
    facilityName: 'Project Apollo',
  },
  {
    id: 'cov-5',
    name: 'Interest Coverage Test',
    type: 'Financial Covenant',
    dueDate: '2025-01-05',
    status: 'upcoming',
    borrowerName: 'Omega Holdings',
    facilityName: 'Acquisition Finance',
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
      "Neptune LLC's carbon emissions breach may affect other energy sector borrowers with similar ESG profiles",
    affectedBorrowers: ['Neptune LLC', 'Apollo Industries', 'EcoTech Ltd'],
    recommendations: [
      'Review ESG compliance status of energy sector borrowers',
      'Initiate proactive outreach to at-risk facilities',
    ],
    createdAt: '2024-12-07T09:35:00Z',
  },
  {
    id: 'alert-2',
    type: 'concentration',
    severity: 'high',
    title: 'Technology Sector Concentration Above Threshold',
    description:
      'Technology sector exposure is at 45% of portfolio, exceeding 40% threshold',
    affectedBorrowers: ['ABC Holdings', 'XYZ Corp', 'Omega Holdings'],
    recommendations: [
      'Consider diversification strategies',
      'Monitor tech sector market conditions',
    ],
    createdAt: '2024-12-06T14:00:00Z',
  },
  {
    id: 'alert-3',
    type: 'correlation_spike',
    severity: 'medium',
    title: 'Increased Correlation in European Portfolio',
    description:
      'European borrowers showing increased risk correlation due to regulatory changes',
    affectedBorrowers: ['Apollo Industries', 'Neptune LLC', 'EcoTech Ltd'],
    recommendations: [
      'Review exposure to EU regulatory changes',
      'Update stress test scenarios',
    ],
    createdAt: '2024-12-05T10:00:00Z',
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
  lastUpdated: '2 hours ago',
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
