/**
 * Unified Data Registry
 *
 * Single source of truth for all mock data used across modules.
 * This file provides consistent IDs, relationships, and data structures
 * that enable cross-module features.
 */

import { addDays, subDays, format } from 'date-fns';

// =============================================================================
// Date Helpers
// =============================================================================

const today = new Date();

export function futureDate(days: number): string {
  return format(addDays(today, days), 'yyyy-MM-dd');
}

export function pastDate(days: number): string {
  return format(subDays(today, days), 'yyyy-MM-dd');
}

export function futureDatetime(days: number, hours = 10): string {
  const date = addDays(today, days);
  date.setHours(hours, 0, 0, 0);
  return date.toISOString();
}

// =============================================================================
// Core Entity Types
// =============================================================================

export interface RegisteredBorrower {
  id: string;
  name: string;
  shortName: string;
  industry: string;
  geography: string;
  creditRating: string | null;
  esgScore: number | null;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  watchlist: boolean;
}

export interface RegisteredFacility {
  id: string;
  name: string;
  borrowerId: string;
  type: string;
  amount: number;
  formattedAmount: string;
  maturityDate: string;
  currency: string;
  covenantTypes: string[];
  status: 'active' | 'watchlist' | 'default' | 'matured';
}

export interface RegisteredDocument {
  id: string;
  facilityId: string;
  borrowerId: string;
  type: 'facility_agreement' | 'amendment' | 'consent' | 'assignment' | 'waiver';
  filename: string;
  uploadedAt: string;
  pageCount: number;
  status: 'completed' | 'processing' | 'review_required' | 'failed';
}

export interface RegisteredDeal {
  id: string;
  borrowerId: string;
  facilityId: string | null;
  name: string;
  type: 'new_facility' | 'amendment' | 'refinancing' | 'consent' | 'extension';
  status: 'draft' | 'active' | 'agreed' | 'paused' | 'closed';
  targetCloseDate: string | null;
}

export interface RegisteredTrade {
  id: string;
  facilityId: string;
  borrowerId: string;
  tradeReference: string;
  sellerName: string;
  buyerName: string;
  isBuyer: boolean;
  status: 'draft' | 'indication' | 'agreed' | 'in_due_diligence' | 'documentation' | 'pending_consent' | 'pending_settlement' | 'settled' | 'cancelled' | 'failed';
  tradeAmount: number;
  tradePrice: number;
  tradeDate: string;
  settlementDate: string | null;
}

export interface RegisteredCovenant {
  id: string;
  facilityId: string;
  borrowerId: string;
  type: string;
  description: string;
  threshold: string;
  currentValue: string;
  status: 'compliant' | 'warning' | 'breached' | 'waived';
  testDate: string;
  headroom: number; // percentage
}

export interface RegisteredComplianceEvent {
  id: string;
  facilityId: string;
  borrowerId: string;
  covenantId: string | null;
  type: 'covenant_test' | 'financial_delivery' | 'certificate_due' | 'payment_due' | 'waiver_expiration';
  description: string;
  dueDate: string;
  status: 'upcoming' | 'pending' | 'overdue' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// =============================================================================
// Canonical Borrower Data
// =============================================================================

export const BORROWER_IDS = {
  ABC_HOLDINGS: 'borrower-abc',
  XYZ_CORP: 'borrower-xyz',
  APOLLO_INDUSTRIES: 'borrower-apollo',
  NEPTUNE_LLC: 'borrower-neptune',
  DELTA_CORP: 'borrower-delta',
  OMEGA_HOLDINGS: 'borrower-omega',
  ECOTECH_LTD: 'borrower-ecotech',
  ALPHA_PARTNERS: 'borrower-alpha',
} as const;

export const borrowers: Record<string, RegisteredBorrower> = {
  [BORROWER_IDS.ABC_HOLDINGS]: {
    id: BORROWER_IDS.ABC_HOLDINGS,
    name: 'ABC Holdings',
    shortName: 'ABC',
    industry: 'Technology',
    geography: 'North America',
    creditRating: 'BBB+',
    esgScore: 72,
    complianceScore: 85,
    riskLevel: 'medium',
    watchlist: false,
  },
  [BORROWER_IDS.XYZ_CORP]: {
    id: BORROWER_IDS.XYZ_CORP,
    name: 'XYZ Corp',
    shortName: 'XYZ',
    industry: 'Technology',
    geography: 'North America',
    creditRating: 'A-',
    esgScore: 68,
    complianceScore: 88,
    riskLevel: 'low',
    watchlist: false,
  },
  [BORROWER_IDS.APOLLO_INDUSTRIES]: {
    id: BORROWER_IDS.APOLLO_INDUSTRIES,
    name: 'Apollo Industries',
    shortName: 'Apollo',
    industry: 'Manufacturing',
    geography: 'Europe',
    creditRating: 'BBB',
    esgScore: 58,
    complianceScore: 72,
    riskLevel: 'high',
    watchlist: true,
  },
  [BORROWER_IDS.NEPTUNE_LLC]: {
    id: BORROWER_IDS.NEPTUNE_LLC,
    name: 'Neptune LLC',
    shortName: 'Neptune',
    industry: 'Energy',
    geography: 'Europe',
    creditRating: 'BB+',
    esgScore: 45,
    complianceScore: 62,
    riskLevel: 'critical',
    watchlist: true,
  },
  [BORROWER_IDS.DELTA_CORP]: {
    id: BORROWER_IDS.DELTA_CORP,
    name: 'Delta Corp',
    shortName: 'Delta',
    industry: 'Retail',
    geography: 'North America',
    creditRating: 'A',
    esgScore: 78,
    complianceScore: 91,
    riskLevel: 'low',
    watchlist: false,
  },
  [BORROWER_IDS.OMEGA_HOLDINGS]: {
    id: BORROWER_IDS.OMEGA_HOLDINGS,
    name: 'Omega Holdings',
    shortName: 'Omega',
    industry: 'Technology',
    geography: 'Asia Pacific',
    creditRating: 'BBB-',
    esgScore: 65,
    complianceScore: 80,
    riskLevel: 'medium',
    watchlist: false,
  },
  [BORROWER_IDS.ECOTECH_LTD]: {
    id: BORROWER_IDS.ECOTECH_LTD,
    name: 'EcoTech Ltd',
    shortName: 'EcoTech',
    industry: 'Clean Energy',
    geography: 'Europe',
    creditRating: 'A-',
    esgScore: 88,
    complianceScore: 94,
    riskLevel: 'low',
    watchlist: false,
  },
  [BORROWER_IDS.ALPHA_PARTNERS]: {
    id: BORROWER_IDS.ALPHA_PARTNERS,
    name: 'Alpha Partners',
    shortName: 'Alpha',
    industry: 'Financial Services',
    geography: 'North America',
    creditRating: 'A',
    esgScore: 75,
    complianceScore: 89,
    riskLevel: 'low',
    watchlist: false,
  },
};

// =============================================================================
// Canonical Facility Data
// =============================================================================

export const FACILITY_IDS = {
  ABC_TERM_A: 'facility-abc-term-a',
  XYZ_REVOLVER: 'facility-xyz-revolver',
  APOLLO_PROJECT: 'facility-apollo-project',
  NEPTUNE_SYNDICATED: 'facility-neptune-syndicated',
  DELTA_WC: 'facility-delta-wc',
  OMEGA_ACQUISITION: 'facility-omega-acquisition',
  ECOTECH_GREEN: 'facility-ecotech-green',
  ALPHA_BRIDGE: 'facility-alpha-bridge',
} as const;

export const facilities: Record<string, RegisteredFacility> = {
  [FACILITY_IDS.ABC_TERM_A]: {
    id: FACILITY_IDS.ABC_TERM_A,
    name: 'Term Loan A',
    borrowerId: BORROWER_IDS.ABC_HOLDINGS,
    type: 'Term Loan',
    amount: 50_000_000,
    formattedAmount: '$50M',
    maturityDate: futureDate(730),
    currency: 'USD',
    covenantTypes: ['Leverage Ratio', 'Interest Coverage', 'EBITDA'],
    status: 'active',
  },
  [FACILITY_IDS.XYZ_REVOLVER]: {
    id: FACILITY_IDS.XYZ_REVOLVER,
    name: 'Revolving Facility',
    borrowerId: BORROWER_IDS.XYZ_CORP,
    type: 'Revolver',
    amount: 75_000_000,
    formattedAmount: '$75M',
    maturityDate: futureDate(912),
    currency: 'USD',
    covenantTypes: ['Leverage Ratio', 'Fixed Charge Coverage', 'Net Worth'],
    status: 'active',
  },
  [FACILITY_IDS.APOLLO_PROJECT]: {
    id: FACILITY_IDS.APOLLO_PROJECT,
    name: 'Project Apollo',
    borrowerId: BORROWER_IDS.APOLLO_INDUSTRIES,
    type: 'Project Finance',
    amount: 120_000_000,
    formattedAmount: '$120M',
    maturityDate: futureDate(547),
    currency: 'USD',
    covenantTypes: ['Leverage Ratio', 'Asset Coverage', 'EBITDA'],
    status: 'watchlist',
  },
  [FACILITY_IDS.NEPTUNE_SYNDICATED]: {
    id: FACILITY_IDS.NEPTUNE_SYNDICATED,
    name: 'Project Neptune',
    borrowerId: BORROWER_IDS.NEPTUNE_LLC,
    type: 'Syndicated Loan',
    amount: 85_000_000,
    formattedAmount: '$85M',
    maturityDate: futureDate(365),
    currency: 'USD',
    covenantTypes: ['Leverage Ratio', 'Interest Coverage', 'Cash Flow'],
    status: 'watchlist',
  },
  [FACILITY_IDS.DELTA_WC]: {
    id: FACILITY_IDS.DELTA_WC,
    name: 'Working Capital',
    borrowerId: BORROWER_IDS.DELTA_CORP,
    type: 'Working Capital',
    amount: 25_000_000,
    formattedAmount: '$25M',
    maturityDate: futureDate(274),
    currency: 'USD',
    covenantTypes: ['Current Ratio', 'Net Worth', 'Inventory Turnover'],
    status: 'active',
  },
  [FACILITY_IDS.OMEGA_ACQUISITION]: {
    id: FACILITY_IDS.OMEGA_ACQUISITION,
    name: 'Acquisition Finance',
    borrowerId: BORROWER_IDS.OMEGA_HOLDINGS,
    type: 'M&A',
    amount: 200_000_000,
    formattedAmount: '$200M',
    maturityDate: futureDate(1095),
    currency: 'USD',
    covenantTypes: ['Leverage Ratio', 'Interest Coverage', 'EBITDA'],
    status: 'active',
  },
  [FACILITY_IDS.ECOTECH_GREEN]: {
    id: FACILITY_IDS.ECOTECH_GREEN,
    name: 'Green Bond',
    borrowerId: BORROWER_IDS.ECOTECH_LTD,
    type: 'Green Finance',
    amount: 60_000_000,
    formattedAmount: '$60M',
    maturityDate: futureDate(1825),
    currency: 'EUR',
    covenantTypes: ['Renewable Usage', 'Carbon Reduction', 'Impact Metrics'],
    status: 'active',
  },
  [FACILITY_IDS.ALPHA_BRIDGE]: {
    id: FACILITY_IDS.ALPHA_BRIDGE,
    name: 'Bridge Loan',
    borrowerId: BORROWER_IDS.ALPHA_PARTNERS,
    type: 'Bridge',
    amount: 15_000_000,
    formattedAmount: '$15M',
    maturityDate: futureDate(90),
    currency: 'USD',
    covenantTypes: ['Leverage Ratio', 'Liquidity Ratio', 'Capital Adequacy'],
    status: 'active',
  },
};

// =============================================================================
// Canonical Document Data
// =============================================================================

export const DOCUMENT_IDS = {
  APOLLO_FACILITY_AGREEMENT: 'doc-apollo-fa',
  XYZ_AMENDMENT: 'doc-xyz-amend',
  ABC_CONSENT: 'doc-abc-consent',
  NEPTUNE_REVOLVER: 'doc-neptune-rev',
  DELTA_ASSIGNMENT: 'doc-delta-assign',
  OMEGA_FACILITY_AGREEMENT: 'doc-omega-fa',
  ECOTECH_GREEN_BOND: 'doc-ecotech-green',
  ALPHA_BRIDGE_AGREEMENT: 'doc-alpha-bridge',
} as const;

export const documents: Record<string, RegisteredDocument> = {
  [DOCUMENT_IDS.APOLLO_FACILITY_AGREEMENT]: {
    id: DOCUMENT_IDS.APOLLO_FACILITY_AGREEMENT,
    facilityId: FACILITY_IDS.APOLLO_PROJECT,
    borrowerId: BORROWER_IDS.APOLLO_INDUSTRIES,
    type: 'facility_agreement',
    filename: 'Facility Agreement - Project Apollo.pdf',
    uploadedAt: pastDate(5) + 'T10:30:00Z',
    pageCount: 245,
    status: 'completed',
  },
  [DOCUMENT_IDS.XYZ_AMENDMENT]: {
    id: DOCUMENT_IDS.XYZ_AMENDMENT,
    facilityId: FACILITY_IDS.XYZ_REVOLVER,
    borrowerId: BORROWER_IDS.XYZ_CORP,
    type: 'amendment',
    filename: 'Amendment No. 1 - XYZ Corp Term Loan.docx',
    uploadedAt: pastDate(4) + 'T14:20:00Z',
    pageCount: 45,
    status: 'completed',
  },
  [DOCUMENT_IDS.ABC_CONSENT]: {
    id: DOCUMENT_IDS.ABC_CONSENT,
    facilityId: FACILITY_IDS.ABC_TERM_A,
    borrowerId: BORROWER_IDS.ABC_HOLDINGS,
    type: 'consent',
    filename: 'Consent Request - ABC Holdings.pdf',
    uploadedAt: pastDate(3) + 'T09:15:00Z',
    pageCount: 12,
    status: 'processing',
  },
  [DOCUMENT_IDS.NEPTUNE_REVOLVER]: {
    id: DOCUMENT_IDS.NEPTUNE_REVOLVER,
    facilityId: FACILITY_IDS.NEPTUNE_SYNDICATED,
    borrowerId: BORROWER_IDS.NEPTUNE_LLC,
    type: 'facility_agreement',
    filename: 'Revolving Credit Agreement - Neptune Ltd.pdf',
    uploadedAt: pastDate(2) + 'T16:45:00Z',
    pageCount: 312,
    status: 'review_required',
  },
  [DOCUMENT_IDS.DELTA_ASSIGNMENT]: {
    id: DOCUMENT_IDS.DELTA_ASSIGNMENT,
    facilityId: FACILITY_IDS.DELTA_WC,
    borrowerId: BORROWER_IDS.DELTA_CORP,
    type: 'assignment',
    filename: 'Assignment Agreement - Delta Corp.pdf',
    uploadedAt: pastDate(1) + 'T11:00:00Z',
    pageCount: 28,
    status: 'completed',
  },
  [DOCUMENT_IDS.OMEGA_FACILITY_AGREEMENT]: {
    id: DOCUMENT_IDS.OMEGA_FACILITY_AGREEMENT,
    facilityId: FACILITY_IDS.OMEGA_ACQUISITION,
    borrowerId: BORROWER_IDS.OMEGA_HOLDINGS,
    type: 'facility_agreement',
    filename: 'Acquisition Facility Agreement - Omega Holdings.pdf',
    uploadedAt: pastDate(10) + 'T09:00:00Z',
    pageCount: 380,
    status: 'completed',
  },
  [DOCUMENT_IDS.ECOTECH_GREEN_BOND]: {
    id: DOCUMENT_IDS.ECOTECH_GREEN_BOND,
    facilityId: FACILITY_IDS.ECOTECH_GREEN,
    borrowerId: BORROWER_IDS.ECOTECH_LTD,
    type: 'facility_agreement',
    filename: 'Green Bond Framework - EcoTech Ltd.pdf',
    uploadedAt: pastDate(15) + 'T14:00:00Z',
    pageCount: 156,
    status: 'completed',
  },
  [DOCUMENT_IDS.ALPHA_BRIDGE_AGREEMENT]: {
    id: DOCUMENT_IDS.ALPHA_BRIDGE_AGREEMENT,
    facilityId: FACILITY_IDS.ALPHA_BRIDGE,
    borrowerId: BORROWER_IDS.ALPHA_PARTNERS,
    type: 'facility_agreement',
    filename: 'Bridge Loan Agreement - Alpha Partners.pdf',
    uploadedAt: pastDate(7) + 'T10:30:00Z',
    pageCount: 98,
    status: 'completed',
  },
};

// =============================================================================
// Canonical Deal Data
// =============================================================================

export const DEAL_IDS = {
  APOLLO_TERM_LOAN: 'deal-apollo-term',
  XYZ_AMENDMENT: 'deal-xyz-amend',
  NEPTUNE_REFINANCING: 'deal-neptune-refi',
  DELTA_CONSENT: 'deal-delta-consent',
  OMEGA_EXTENSION: 'deal-omega-ext',
} as const;

export const deals: Record<string, RegisteredDeal> = {
  [DEAL_IDS.APOLLO_TERM_LOAN]: {
    id: DEAL_IDS.APOLLO_TERM_LOAN,
    borrowerId: BORROWER_IDS.APOLLO_INDUSTRIES,
    facilityId: FACILITY_IDS.APOLLO_PROJECT,
    name: 'Project Apollo - Term Loan Facility',
    type: 'new_facility',
    status: 'active',
    targetCloseDate: futureDate(45),
  },
  [DEAL_IDS.XYZ_AMENDMENT]: {
    id: DEAL_IDS.XYZ_AMENDMENT,
    borrowerId: BORROWER_IDS.XYZ_CORP,
    facilityId: FACILITY_IDS.XYZ_REVOLVER,
    name: 'XYZ Corp - Amendment No. 2',
    type: 'amendment',
    status: 'active',
    targetCloseDate: futureDate(25),
  },
  [DEAL_IDS.NEPTUNE_REFINANCING]: {
    id: DEAL_IDS.NEPTUNE_REFINANCING,
    borrowerId: BORROWER_IDS.NEPTUNE_LLC,
    facilityId: FACILITY_IDS.NEPTUNE_SYNDICATED,
    name: 'Neptune Holdings - Refinancing',
    type: 'refinancing',
    status: 'draft',
    targetCloseDate: futureDate(90),
  },
  [DEAL_IDS.DELTA_CONSENT]: {
    id: DEAL_IDS.DELTA_CONSENT,
    borrowerId: BORROWER_IDS.DELTA_CORP,
    facilityId: FACILITY_IDS.DELTA_WC,
    name: 'Delta Corp - Consent Request',
    type: 'consent',
    status: 'agreed',
    targetCloseDate: futureDate(14),
  },
  [DEAL_IDS.OMEGA_EXTENSION]: {
    id: DEAL_IDS.OMEGA_EXTENSION,
    borrowerId: BORROWER_IDS.OMEGA_HOLDINGS,
    facilityId: FACILITY_IDS.OMEGA_ACQUISITION,
    name: 'Omega Group - Extension',
    type: 'extension',
    status: 'paused',
    targetCloseDate: null,
  },
};

// =============================================================================
// Canonical Trade Data
// =============================================================================

export const TRADE_IDS = {
  APOLLO_SELL: 'trade-apollo-sell',
  NEPTUNE_BUY: 'trade-neptune-buy',
  DELTA_SELL: 'trade-delta-sell',
  XYZ_BUY: 'trade-xyz-buy',
  OMEGA_SELL: 'trade-omega-sell',
  ABC_BUY: 'trade-abc-buy',
} as const;

export const trades: Record<string, RegisteredTrade> = {
  [TRADE_IDS.APOLLO_SELL]: {
    id: TRADE_IDS.APOLLO_SELL,
    facilityId: FACILITY_IDS.APOLLO_PROJECT,
    borrowerId: BORROWER_IDS.APOLLO_INDUSTRIES,
    tradeReference: 'TR-2024-001',
    sellerName: 'BigBank NA',
    buyerName: 'Capital Partners Fund',
    isBuyer: false,
    status: 'in_due_diligence',
    tradeAmount: 15_000_000,
    tradePrice: 98.5,
    tradeDate: pastDate(10),
    settlementDate: futureDate(5),
  },
  [TRADE_IDS.NEPTUNE_BUY]: {
    id: TRADE_IDS.NEPTUNE_BUY,
    facilityId: FACILITY_IDS.NEPTUNE_SYNDICATED,
    borrowerId: BORROWER_IDS.NEPTUNE_LLC,
    tradeReference: 'TR-2024-002',
    sellerName: 'European Credit AG',
    buyerName: 'BigBank NA',
    isBuyer: true,
    status: 'pending_settlement',
    tradeAmount: 8_500_000,
    tradePrice: 94.25,
    tradeDate: pastDate(15),
    settlementDate: futureDate(3),
  },
  [TRADE_IDS.DELTA_SELL]: {
    id: TRADE_IDS.DELTA_SELL,
    facilityId: FACILITY_IDS.DELTA_WC,
    borrowerId: BORROWER_IDS.DELTA_CORP,
    tradeReference: 'TR-2024-003',
    sellerName: 'BigBank NA',
    buyerName: 'Retail Credit Fund',
    isBuyer: false,
    status: 'documentation',
    tradeAmount: 5_000_000,
    tradePrice: 100.125,
    tradeDate: pastDate(7),
    settlementDate: futureDate(10),
  },
  [TRADE_IDS.XYZ_BUY]: {
    id: TRADE_IDS.XYZ_BUY,
    facilityId: FACILITY_IDS.XYZ_REVOLVER,
    borrowerId: BORROWER_IDS.XYZ_CORP,
    tradeReference: 'TR-2024-004',
    sellerName: 'Tech Lenders LLC',
    buyerName: 'BigBank NA',
    isBuyer: true,
    status: 'agreed',
    tradeAmount: 12_000_000,
    tradePrice: 99.75,
    tradeDate: pastDate(3),
    settlementDate: futureDate(15),
  },
  [TRADE_IDS.OMEGA_SELL]: {
    id: TRADE_IDS.OMEGA_SELL,
    facilityId: FACILITY_IDS.OMEGA_ACQUISITION,
    borrowerId: BORROWER_IDS.OMEGA_HOLDINGS,
    tradeReference: 'TR-2024-005',
    sellerName: 'BigBank NA',
    buyerName: 'Asia Pacific Credit',
    isBuyer: false,
    status: 'pending_consent',
    tradeAmount: 25_000_000,
    tradePrice: 97.0,
    tradeDate: pastDate(12),
    settlementDate: futureDate(8),
  },
  [TRADE_IDS.ABC_BUY]: {
    id: TRADE_IDS.ABC_BUY,
    facilityId: FACILITY_IDS.ABC_TERM_A,
    borrowerId: BORROWER_IDS.ABC_HOLDINGS,
    tradeReference: 'TR-2024-006',
    sellerName: 'North American Fund',
    buyerName: 'BigBank NA',
    isBuyer: true,
    status: 'settled',
    tradeAmount: 7_500_000,
    tradePrice: 99.0,
    tradeDate: pastDate(20),
    settlementDate: pastDate(5),
  },
};

// =============================================================================
// Canonical Covenant Data
// =============================================================================

export const COVENANT_IDS = {
  APOLLO_LEVERAGE: 'cov-apollo-leverage',
  APOLLO_EBITDA: 'cov-apollo-ebitda',
  NEPTUNE_LEVERAGE: 'cov-neptune-leverage',
  NEPTUNE_INTEREST_COVERAGE: 'cov-neptune-icr',
  XYZ_LEVERAGE: 'cov-xyz-leverage',
  XYZ_NET_WORTH: 'cov-xyz-networth',
  DELTA_CURRENT_RATIO: 'cov-delta-current',
  OMEGA_LEVERAGE: 'cov-omega-leverage',
} as const;

export const covenants: Record<string, RegisteredCovenant> = {
  [COVENANT_IDS.APOLLO_LEVERAGE]: {
    id: COVENANT_IDS.APOLLO_LEVERAGE,
    facilityId: FACILITY_IDS.APOLLO_PROJECT,
    borrowerId: BORROWER_IDS.APOLLO_INDUSTRIES,
    type: 'Leverage Ratio',
    description: 'Maximum Total Debt to EBITDA',
    threshold: '≤ 4.50x',
    currentValue: '4.35x',
    status: 'warning',
    testDate: futureDate(15),
    headroom: 3.3,
  },
  [COVENANT_IDS.APOLLO_EBITDA]: {
    id: COVENANT_IDS.APOLLO_EBITDA,
    facilityId: FACILITY_IDS.APOLLO_PROJECT,
    borrowerId: BORROWER_IDS.APOLLO_INDUSTRIES,
    type: 'EBITDA',
    description: 'Minimum Trailing Twelve Month EBITDA',
    threshold: '≥ $25M',
    currentValue: '$26.2M',
    status: 'compliant',
    testDate: futureDate(15),
    headroom: 4.8,
  },
  [COVENANT_IDS.NEPTUNE_LEVERAGE]: {
    id: COVENANT_IDS.NEPTUNE_LEVERAGE,
    facilityId: FACILITY_IDS.NEPTUNE_SYNDICATED,
    borrowerId: BORROWER_IDS.NEPTUNE_LLC,
    type: 'Leverage Ratio',
    description: 'Maximum Senior Secured Debt to EBITDA',
    threshold: '≤ 5.00x',
    currentValue: '5.15x',
    status: 'breached',
    testDate: pastDate(5),
    headroom: -3.0,
  },
  [COVENANT_IDS.NEPTUNE_INTEREST_COVERAGE]: {
    id: COVENANT_IDS.NEPTUNE_INTEREST_COVERAGE,
    facilityId: FACILITY_IDS.NEPTUNE_SYNDICATED,
    borrowerId: BORROWER_IDS.NEPTUNE_LLC,
    type: 'Interest Coverage',
    description: 'Minimum EBITDA to Interest Expense',
    threshold: '≥ 2.50x',
    currentValue: '2.35x',
    status: 'breached',
    testDate: pastDate(5),
    headroom: -6.0,
  },
  [COVENANT_IDS.XYZ_LEVERAGE]: {
    id: COVENANT_IDS.XYZ_LEVERAGE,
    facilityId: FACILITY_IDS.XYZ_REVOLVER,
    borrowerId: BORROWER_IDS.XYZ_CORP,
    type: 'Leverage Ratio',
    description: 'Maximum Net Debt to EBITDA',
    threshold: '≤ 3.50x',
    currentValue: '2.85x',
    status: 'compliant',
    testDate: futureDate(30),
    headroom: 18.6,
  },
  [COVENANT_IDS.XYZ_NET_WORTH]: {
    id: COVENANT_IDS.XYZ_NET_WORTH,
    facilityId: FACILITY_IDS.XYZ_REVOLVER,
    borrowerId: BORROWER_IDS.XYZ_CORP,
    type: 'Net Worth',
    description: 'Minimum Tangible Net Worth',
    threshold: '≥ $100M',
    currentValue: '$142M',
    status: 'compliant',
    testDate: futureDate(30),
    headroom: 42.0,
  },
  [COVENANT_IDS.DELTA_CURRENT_RATIO]: {
    id: COVENANT_IDS.DELTA_CURRENT_RATIO,
    facilityId: FACILITY_IDS.DELTA_WC,
    borrowerId: BORROWER_IDS.DELTA_CORP,
    type: 'Current Ratio',
    description: 'Minimum Current Assets to Current Liabilities',
    threshold: '≥ 1.25x',
    currentValue: '1.52x',
    status: 'compliant',
    testDate: futureDate(45),
    headroom: 21.6,
  },
  [COVENANT_IDS.OMEGA_LEVERAGE]: {
    id: COVENANT_IDS.OMEGA_LEVERAGE,
    facilityId: FACILITY_IDS.OMEGA_ACQUISITION,
    borrowerId: BORROWER_IDS.OMEGA_HOLDINGS,
    type: 'Leverage Ratio',
    description: 'Maximum Total Debt to EBITDA',
    threshold: '≤ 5.50x',
    currentValue: '4.95x',
    status: 'compliant',
    testDate: futureDate(60),
    headroom: 10.0,
  },
};

// =============================================================================
// Canonical Compliance Events
// =============================================================================

export const complianceEvents: RegisteredComplianceEvent[] = [
  {
    id: 'ce-apollo-test',
    facilityId: FACILITY_IDS.APOLLO_PROJECT,
    borrowerId: BORROWER_IDS.APOLLO_INDUSTRIES,
    covenantId: COVENANT_IDS.APOLLO_LEVERAGE,
    type: 'covenant_test',
    description: 'Q4 Leverage Ratio Test - Apollo Industries',
    dueDate: futureDate(15),
    status: 'upcoming',
    priority: 'high',
  },
  {
    id: 'ce-neptune-waiver',
    facilityId: FACILITY_IDS.NEPTUNE_SYNDICATED,
    borrowerId: BORROWER_IDS.NEPTUNE_LLC,
    covenantId: COVENANT_IDS.NEPTUNE_LEVERAGE,
    type: 'waiver_expiration',
    description: 'Leverage Ratio Waiver Expiration - Neptune LLC',
    dueDate: futureDate(7),
    status: 'pending',
    priority: 'critical',
  },
  {
    id: 'ce-xyz-financials',
    facilityId: FACILITY_IDS.XYZ_REVOLVER,
    borrowerId: BORROWER_IDS.XYZ_CORP,
    covenantId: null,
    type: 'financial_delivery',
    description: 'Annual Audited Financials - XYZ Corp',
    dueDate: futureDate(30),
    status: 'upcoming',
    priority: 'medium',
  },
  {
    id: 'ce-delta-certificate',
    facilityId: FACILITY_IDS.DELTA_WC,
    borrowerId: BORROWER_IDS.DELTA_CORP,
    covenantId: null,
    type: 'certificate_due',
    description: 'Compliance Certificate - Delta Corp',
    dueDate: futureDate(5),
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 'ce-omega-payment',
    facilityId: FACILITY_IDS.OMEGA_ACQUISITION,
    borrowerId: BORROWER_IDS.OMEGA_HOLDINGS,
    covenantId: null,
    type: 'payment_due',
    description: 'Interest Payment Due - Omega Holdings',
    dueDate: futureDate(3),
    status: 'upcoming',
    priority: 'high',
  },
  {
    id: 'ce-alpha-test',
    facilityId: FACILITY_IDS.ALPHA_BRIDGE,
    borrowerId: BORROWER_IDS.ALPHA_PARTNERS,
    covenantId: null,
    type: 'covenant_test',
    description: 'Monthly Liquidity Test - Alpha Partners',
    dueDate: futureDate(10),
    status: 'upcoming',
    priority: 'medium',
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getBorrower(id: string): RegisteredBorrower | undefined {
  return borrowers[id];
}

export function getFacility(id: string): RegisteredFacility | undefined {
  return facilities[id];
}

export function getDocument(id: string): RegisteredDocument | undefined {
  return documents[id];
}

export function getDeal(id: string): RegisteredDeal | undefined {
  return deals[id];
}

export function getTrade(id: string): RegisteredTrade | undefined {
  return trades[id];
}

export function getCovenant(id: string): RegisteredCovenant | undefined {
  return covenants[id];
}

export function getAllBorrowers(): RegisteredBorrower[] {
  return Object.values(borrowers);
}

export function getAllFacilities(): RegisteredFacility[] {
  return Object.values(facilities);
}

export function getAllDocuments(): RegisteredDocument[] {
  return Object.values(documents);
}

export function getAllDeals(): RegisteredDeal[] {
  return Object.values(deals);
}

export function getAllTrades(): RegisteredTrade[] {
  return Object.values(trades);
}

export function getAllCovenants(): RegisteredCovenant[] {
  return Object.values(covenants);
}

export function getFacilitiesByBorrower(borrowerId: string): RegisteredFacility[] {
  return Object.values(facilities).filter((f) => f.borrowerId === borrowerId);
}

export function getDocumentsByFacility(facilityId: string): RegisteredDocument[] {
  return Object.values(documents).filter((d) => d.facilityId === facilityId);
}

export function getDealsByBorrower(borrowerId: string): RegisteredDeal[] {
  return Object.values(deals).filter((d) => d.borrowerId === borrowerId);
}

export function getTradesByFacility(facilityId: string): RegisteredTrade[] {
  return Object.values(trades).filter((t) => t.facilityId === facilityId);
}

export function getCovenantsByFacility(facilityId: string): RegisteredCovenant[] {
  return Object.values(covenants).filter((c) => c.facilityId === facilityId);
}

export function getComplianceEventsByFacility(facilityId: string): RegisteredComplianceEvent[] {
  return complianceEvents.filter((e) => e.facilityId === facilityId);
}

export function getTotalPortfolioExposure(): number {
  return Object.values(facilities).reduce((sum, f) => sum + f.amount, 0);
}

export function getBreachedCovenants(): RegisteredCovenant[] {
  return Object.values(covenants).filter((c) => c.status === 'breached');
}

export function getWatchlistBorrowers(): RegisteredBorrower[] {
  return Object.values(borrowers).filter((b) => b.watchlist);
}

export function getActiveDeals(): RegisteredDeal[] {
  return Object.values(deals).filter((d) => d.status === 'active');
}

export function getPendingTrades(): RegisteredTrade[] {
  return Object.values(trades).filter(
    (t) => !['settled', 'cancelled', 'failed'].includes(t.status)
  );
}

// =============================================================================
// Type Exports
// =============================================================================

export type BorrowerId = (typeof BORROWER_IDS)[keyof typeof BORROWER_IDS];
export type FacilityId = (typeof FACILITY_IDS)[keyof typeof FACILITY_IDS];
export type DocumentId = (typeof DOCUMENT_IDS)[keyof typeof DOCUMENT_IDS];
export type DealId = (typeof DEAL_IDS)[keyof typeof DEAL_IDS];
export type TradeId = (typeof TRADE_IDS)[keyof typeof TRADE_IDS];
export type CovenantId = (typeof COVENANT_IDS)[keyof typeof COVENANT_IDS];
