/**
 * Canonical Borrower Registry
 *
 * Single source of truth for all borrower and facility data used across
 * the dashboard mock modules. All mock data files should reference this
 * registry to ensure consistent IDs, names, and attributes.
 */

import { maturityDate } from './date-factory';

// =============================================================================
// Core Types
// =============================================================================

export interface Borrower {
  id: string;
  name: string;
  shortName: string;
  industry: string;
  geography: string;
  creditRating: string | null;
  esgScore: number | null;
  complianceScore: number;
}

export interface Facility {
  id: string;
  name: string;
  borrowerId: string;
  type: string;
  amount: number;
  formattedAmount: string;
  maturityDate: string;
  covenantTypes: string[];
}

export interface BorrowerWithFacility extends Borrower {
  facility: Facility;
}

// =============================================================================
// Canonical Borrower Data
// =============================================================================

export const borrowers: Record<string, Borrower> = {
  'borrower-abc': {
    id: 'borrower-abc',
    name: 'ABC Holdings',
    shortName: 'ABC',
    industry: 'Technology',
    geography: 'North America',
    creditRating: 'BBB+',
    esgScore: 72,
    complianceScore: 85,
  },
  'borrower-xyz': {
    id: 'borrower-xyz',
    name: 'XYZ Corp',
    shortName: 'XYZ',
    industry: 'Technology',
    geography: 'North America',
    creditRating: 'A-',
    esgScore: 68,
    complianceScore: 88,
  },
  'borrower-apollo': {
    id: 'borrower-apollo',
    name: 'Apollo Industries',
    shortName: 'Apollo',
    industry: 'Manufacturing',
    geography: 'Europe',
    creditRating: 'BBB',
    esgScore: 58,
    complianceScore: 72,
  },
  'borrower-neptune': {
    id: 'borrower-neptune',
    name: 'Neptune LLC',
    shortName: 'Neptune',
    industry: 'Energy',
    geography: 'Europe',
    creditRating: 'BB+',
    esgScore: 45,
    complianceScore: 62,
  },
  'borrower-delta': {
    id: 'borrower-delta',
    name: 'Delta Corp',
    shortName: 'Delta',
    industry: 'Retail',
    geography: 'North America',
    creditRating: 'A',
    esgScore: 78,
    complianceScore: 91,
  },
  'borrower-omega': {
    id: 'borrower-omega',
    name: 'Omega Holdings',
    shortName: 'Omega',
    industry: 'Technology',
    geography: 'Asia Pacific',
    creditRating: 'BBB-',
    esgScore: 65,
    complianceScore: 80,
  },
  'borrower-ecotech': {
    id: 'borrower-ecotech',
    name: 'EcoTech Ltd',
    shortName: 'EcoTech',
    industry: 'Clean Energy',
    geography: 'Europe',
    creditRating: 'A-',
    esgScore: 88,
    complianceScore: 94,
  },
  'borrower-alpha': {
    id: 'borrower-alpha',
    name: 'Alpha Partners',
    shortName: 'Alpha',
    industry: 'Financial Services',
    geography: 'North America',
    creditRating: 'A',
    esgScore: 75,
    complianceScore: 89,
  },
};

// =============================================================================
// Canonical Facility Data
// =============================================================================

export const facilities: Record<string, Facility> = {
  'facility-abc-term-a': {
    id: 'facility-abc-term-a',
    name: 'Term Loan A',
    borrowerId: 'borrower-abc',
    type: 'Term Loan',
    amount: 50_000_000,
    formattedAmount: '$50M',
    maturityDate: maturityDate(2, 0),
    covenantTypes: ['Leverage Ratio', 'Interest Coverage', 'EBITDA'],
  },
  'facility-xyz-revolver': {
    id: 'facility-xyz-revolver',
    name: 'Revolving Facility',
    borrowerId: 'borrower-xyz',
    type: 'Revolver',
    amount: 75_000_000,
    formattedAmount: '$75M',
    maturityDate: maturityDate(2, 6),
    covenantTypes: ['Leverage Ratio', 'Fixed Charge Coverage', 'Net Worth'],
  },
  'facility-apollo-project': {
    id: 'facility-apollo-project',
    name: 'Project Apollo',
    borrowerId: 'borrower-apollo',
    type: 'Project Finance',
    amount: 120_000_000,
    formattedAmount: '$120M',
    maturityDate: maturityDate(1, 9),
    covenantTypes: ['Leverage Ratio', 'Asset Coverage', 'EBITDA'],
  },
  'facility-neptune-syndicated': {
    id: 'facility-neptune-syndicated',
    name: 'Project Neptune',
    borrowerId: 'borrower-neptune',
    type: 'Syndicated Loan',
    amount: 85_000_000,
    formattedAmount: '$85M',
    maturityDate: maturityDate(1, 6),
    covenantTypes: ['Leverage Ratio', 'Interest Coverage', 'Cash Flow'],
  },
  'facility-delta-wc': {
    id: 'facility-delta-wc',
    name: 'Working Capital',
    borrowerId: 'borrower-delta',
    type: 'Working Capital',
    amount: 25_000_000,
    formattedAmount: '$25M',
    maturityDate: maturityDate(1, 3),
    covenantTypes: ['Current Ratio', 'Net Worth', 'Inventory Turnover'],
  },
  'facility-omega-acquisition': {
    id: 'facility-omega-acquisition',
    name: 'Acquisition Finance',
    borrowerId: 'borrower-omega',
    type: 'M&A',
    amount: 200_000_000,
    formattedAmount: '$200M',
    maturityDate: maturityDate(3, 1),
    covenantTypes: ['Leverage Ratio', 'Interest Coverage', 'EBITDA'],
  },
  'facility-ecotech-green': {
    id: 'facility-ecotech-green',
    name: 'Green Bond',
    borrowerId: 'borrower-ecotech',
    type: 'Green Finance',
    amount: 60_000_000,
    formattedAmount: '$60M',
    maturityDate: maturityDate(5, 0),
    covenantTypes: ['Renewable Usage', 'Carbon Reduction', 'Impact Metrics'],
  },
  'facility-alpha-bridge': {
    id: 'facility-alpha-bridge',
    name: 'Bridge Loan',
    borrowerId: 'borrower-alpha',
    type: 'Bridge',
    amount: 15_000_000,
    formattedAmount: '$15M',
    maturityDate: maturityDate(0, 3),
    covenantTypes: ['Leverage Ratio', 'Liquidity Ratio', 'Capital Adequacy'],
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a borrower by ID
 */
export function getBorrower(id: string): Borrower | undefined {
  return borrowers[id];
}

/**
 * Get a facility by ID
 */
export function getFacility(id: string): Facility | undefined {
  return facilities[id];
}

/**
 * Get facility for a borrower
 */
export function getFacilityForBorrower(borrowerId: string): Facility | undefined {
  return Object.values(facilities).find((f) => f.borrowerId === borrowerId);
}

/**
 * Get borrower with their primary facility
 */
export function getBorrowerWithFacility(borrowerId: string): BorrowerWithFacility | undefined {
  const borrower = getBorrower(borrowerId);
  const facility = getFacilityForBorrower(borrowerId);
  if (!borrower || !facility) return undefined;
  return { ...borrower, facility };
}

/**
 * Get all borrowers as array
 */
export function getAllBorrowers(): Borrower[] {
  return Object.values(borrowers);
}

/**
 * Get all facilities as array
 */
export function getAllFacilities(): Facility[] {
  return Object.values(facilities);
}

/**
 * Get all borrowers with their facilities
 */
export function getAllBorrowersWithFacilities(): BorrowerWithFacility[] {
  return getAllBorrowers()
    .map((b) => getBorrowerWithFacility(b.id))
    .filter((b): b is BorrowerWithFacility => b !== undefined);
}

/**
 * Get total portfolio exposure
 */
export function getTotalPortfolioExposure(): number {
  return Object.values(facilities).reduce((sum, f) => sum + f.amount, 0);
}

// =============================================================================
// Convenience Exports - Direct ID references for use in mock data
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

export type BorrowerId = (typeof BORROWER_IDS)[keyof typeof BORROWER_IDS];
export type FacilityId = (typeof FACILITY_IDS)[keyof typeof FACILITY_IDS];
