// ============================================
// Mock Data for Clause Library
// ============================================

import type { ClauseTemplate, ClauseVariant, ClauseLibraryStats } from './clause-library-types';

/**
 * Sample clause templates for the library
 */
export const mockClauseTemplates: ClauseTemplate[] = [
  // Financial Covenants
  {
    id: 'clause-001',
    name: 'Maximum Leverage Ratio',
    category: 'financial_covenants',
    favor: 'lender',
    source: 'lsta_standard',
    text: 'The Borrower shall not permit the Leverage Ratio as of the last day of any fiscal quarter to exceed 3.50 to 1.00.',
    description: 'Standard leverage ratio covenant requiring borrower to maintain debt-to-EBITDA below specified threshold',
    keyPhrases: ['leverage ratio', 'exceed', 'fiscal quarter', 'to 1.00'],
    tags: ['leverage', 'financial', 'quarterly', 'maintenance'],
    isApproved: true,
    usageCount: 47,
    lastUsedAt: '2024-12-15T10:30:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-06-20T14:30:00Z',
    legalNotes: 'Standard LSTA language. Consider headroom based on borrower financial projections.',
    negotiationPoints: [
      'Threshold level (3.00x to 4.00x typical)',
      'Step-downs over facility life',
      'Treatment of one-time charges and add-backs',
    ],
    alternativeClauseIds: ['clause-002'],
  },
  {
    id: 'clause-002',
    name: 'Maximum Leverage Ratio (Borrower-Favorable)',
    category: 'financial_covenants',
    favor: 'borrower',
    source: 'negotiated',
    text: 'The Borrower shall not permit the Leverage Ratio as of the last day of any fiscal quarter to exceed 4.00 to 1.00; provided that, during any Specified Acquisition Period, such ratio may exceed the foregoing level by 0.50 to 1.00.',
    description: 'More flexible leverage ratio with acquisition step-up provision',
    keyPhrases: ['leverage ratio', 'exceed', 'Specified Acquisition Period', 'step-up'],
    tags: ['leverage', 'financial', 'quarterly', 'acquisition', 'flexible'],
    isApproved: true,
    usageCount: 23,
    lastUsedAt: '2024-11-28T16:45:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-06-10T09:00:00Z',
    updatedAt: '2024-03-15T11:20:00Z',
    legalNotes: 'Use for borrowers with active M&A strategy. Acquisition period typically 4 quarters.',
    negotiationPoints: [
      'Step-up amount (0.25x to 0.75x typical)',
      'Duration of acquisition period',
      'Number of step-ups permitted over facility life',
    ],
    alternativeClauseIds: ['clause-001'],
  },
  {
    id: 'clause-003',
    name: 'Minimum Interest Coverage Ratio',
    category: 'financial_covenants',
    favor: 'lender',
    source: 'lsta_standard',
    text: 'The Borrower shall not permit the Interest Coverage Ratio as of the last day of any fiscal quarter to be less than 3.00 to 1.00.',
    description: 'Standard interest coverage covenant ensuring borrower can service debt',
    keyPhrases: ['interest coverage ratio', 'less than', 'fiscal quarter', 'to 1.00'],
    tags: ['interest coverage', 'financial', 'quarterly', 'maintenance'],
    isApproved: true,
    usageCount: 45,
    lastUsedAt: '2024-12-10T09:15:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-05-12T16:40:00Z',
    legalNotes: 'Ensure EBITDA definition aligns with leverage ratio calculation.',
    negotiationPoints: [
      'Threshold level (2.00x to 3.50x typical)',
      'Definition of Interest Charges',
    ],
  },
  // Reporting Requirements
  {
    id: 'clause-010',
    name: 'Quarterly Financial Statements',
    category: 'reporting_requirements',
    favor: 'neutral',
    source: 'lsta_standard',
    text: 'Within 45 days after the end of each fiscal quarter, the Borrower shall deliver to the Administrative Agent a consolidated balance sheet and related statements of income and cash flows, certified by the chief financial officer.',
    description: 'Standard quarterly financial reporting requirement',
    keyPhrases: ['45 days', 'fiscal quarter', 'consolidated', 'balance sheet', 'chief financial officer'],
    tags: ['reporting', 'financial statements', 'quarterly', 'CFO certification'],
    isApproved: true,
    usageCount: 52,
    lastUsedAt: '2024-12-18T14:00:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-02-28T10:15:00Z',
    legalNotes: 'Standard 45-day period. Some borrowers may request 60 days.',
    negotiationPoints: [
      'Delivery period (45 vs 60 days)',
      'Officer certification level',
      'Public company carve-out',
    ],
  },
  {
    id: 'clause-011',
    name: 'Compliance Certificate',
    category: 'reporting_requirements',
    favor: 'lender',
    source: 'lsta_standard',
    text: 'Contemporaneously with the delivery of each set of financial statements, the Borrower shall deliver a Compliance Certificate signed by a Financial Officer certifying that no Default or Event of Default has occurred and is continuing, and setting forth the calculations required to establish compliance with the financial covenants.',
    description: 'Requires borrower to certify covenant compliance with each financial delivery',
    keyPhrases: ['Compliance Certificate', 'Financial Officer', 'Default', 'calculations'],
    tags: ['compliance', 'certificate', 'covenant', 'officer certification'],
    isApproved: true,
    usageCount: 51,
    lastUsedAt: '2024-12-18T14:00:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-04-10T13:30:00Z',
  },
  // Events of Default
  {
    id: 'clause-020',
    name: 'Payment Default',
    category: 'events_of_default',
    favor: 'lender',
    source: 'lsta_standard',
    text: 'The Borrower shall fail to pay any principal of any Loan when due; or the Borrower shall fail to pay any interest on any Loan or any fee or other amount payable hereunder within 5 Business Days after the date due.',
    description: 'Standard payment default with 5-day grace period for non-principal amounts',
    keyPhrases: ['fail to pay', 'principal', 'interest', 'Business Days', 'date due'],
    tags: ['default', 'payment', 'grace period', 'principal', 'interest'],
    isApproved: true,
    usageCount: 48,
    lastUsedAt: '2024-12-12T11:30:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-01-20T09:45:00Z',
    legalNotes: 'No grace for principal. 5 business days is market for interest/fees.',
    negotiationPoints: [
      'Grace period length (3-5 business days typical)',
      'Principal grace (usually none)',
    ],
  },
  {
    id: 'clause-021',
    name: 'Cross-Default',
    category: 'events_of_default',
    favor: 'lender',
    source: 'lsta_standard',
    text: 'The Borrower or any Subsidiary shall default in the payment when due of any principal of or interest on any Indebtedness (other than the Obligations) having an aggregate principal amount in excess of the Threshold Amount, or any other default shall occur under any agreement governing such Indebtedness if the effect thereof is to accelerate the maturity of such Indebtedness.',
    description: 'Standard cross-default clause triggered by defaults on other material debt',
    keyPhrases: ['default', 'Indebtedness', 'Threshold Amount', 'accelerate'],
    tags: ['default', 'cross-default', 'indebtedness', 'acceleration'],
    isApproved: true,
    usageCount: 44,
    lastUsedAt: '2024-12-05T15:20:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-07-18T12:00:00Z',
    legalNotes: 'Threshold Amount typically $25-50M. Consider carve-outs for disputed debt.',
    negotiationPoints: [
      'Threshold Amount',
      'Cross-acceleration vs cross-default',
      'Carve-outs for good faith disputes',
    ],
  },
  {
    id: 'clause-022',
    name: 'Cross-Default (Borrower-Favorable)',
    category: 'events_of_default',
    favor: 'borrower',
    source: 'negotiated',
    text: 'The Borrower or any Material Subsidiary shall default in the payment when due of any principal of or interest on any Indebtedness (other than the Obligations and Indebtedness being contested in good faith by appropriate proceedings) having an aggregate principal amount in excess of $50,000,000, and such default shall continue for 30 days after written notice, or any other default shall occur under any agreement governing such Indebtedness if the effect thereof is to cause such Indebtedness to become due prior to its stated maturity.',
    description: 'Borrower-favorable cross-default with higher threshold, notice period, and dispute carve-out',
    keyPhrases: ['Material Subsidiary', 'contested in good faith', '$50,000,000', '30 days', 'written notice'],
    tags: ['default', 'cross-default', 'notice period', 'dispute carve-out'],
    isApproved: true,
    usageCount: 18,
    lastUsedAt: '2024-11-20T10:45:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-08-05T11:00:00Z',
    updatedAt: '2024-05-22T14:30:00Z',
    alternativeClauseIds: ['clause-021'],
  },
  // Negative Covenants
  {
    id: 'clause-030',
    name: 'Limitation on Indebtedness',
    category: 'negative_covenants',
    favor: 'lender',
    source: 'lsta_standard',
    text: 'The Borrower shall not, and shall not permit any Subsidiary to, create, incur, assume or permit to exist any Indebtedness, except: (a) Indebtedness under the Loan Documents; (b) Indebtedness existing on the Closing Date and listed on Schedule 6.01; and (c) additional Indebtedness not exceeding $25,000,000 in aggregate principal amount at any time outstanding.',
    description: 'Standard negative covenant limiting incurrence of additional debt with enumerated exceptions',
    keyPhrases: ['shall not', 'create, incur, assume', 'Indebtedness', 'except', 'aggregate principal amount'],
    tags: ['negative covenant', 'indebtedness', 'debt incurrence', 'basket'],
    isApproved: true,
    usageCount: 43,
    lastUsedAt: '2024-12-08T13:15:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-08-14T16:20:00Z',
    legalNotes: 'Review basket size relative to borrower size. Consider grower baskets.',
    negotiationPoints: [
      'General basket size',
      'Specific carve-outs (capital leases, purchase money)',
      'Incremental facilities',
    ],
  },
  {
    id: 'clause-031',
    name: 'Limitation on Liens',
    category: 'negative_covenants',
    favor: 'lender',
    source: 'lsta_standard',
    text: 'The Borrower shall not, and shall not permit any Subsidiary to, create, incur, assume or permit to exist any Lien on any asset now owned or hereafter acquired by it, except Permitted Liens.',
    description: 'Standard negative pledge prohibiting liens except for enumerated permitted liens',
    keyPhrases: ['shall not', 'Lien', 'asset', 'Permitted Liens'],
    tags: ['negative covenant', 'liens', 'security', 'negative pledge'],
    isApproved: true,
    usageCount: 50,
    lastUsedAt: '2024-12-16T10:00:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-03-08T11:45:00Z',
    legalNotes: 'Permitted Liens definition is critical. Ensure adequate carve-outs.',
  },
  // Assignments & Participations
  {
    id: 'clause-040',
    name: 'Consent to Assignment',
    category: 'assignments_participations',
    favor: 'borrower',
    source: 'lsta_standard',
    text: 'No Lender may assign any of its rights or obligations hereunder without the prior written consent of the Borrower (such consent not to be unreasonably withheld or delayed); provided that no consent of the Borrower shall be required for an assignment to another Lender, an Affiliate of a Lender, or an Approved Fund.',
    description: 'Standard assignment consent requirement with carve-outs for affiliates and approved funds',
    keyPhrases: ['consent', 'assign', 'Borrower', 'unreasonably withheld', 'Approved Fund'],
    tags: ['assignment', 'consent', 'transfer', 'lender'],
    isApproved: true,
    usageCount: 46,
    lastUsedAt: '2024-12-14T09:30:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-06-05T15:10:00Z',
    legalNotes: 'Borrower consent waived after default is market standard.',
    negotiationPoints: [
      'Scope of consent-free transfers',
      'Deemed consent periods',
      'Disqualified lender provisions',
    ],
  },
  {
    id: 'clause-041',
    name: 'Minimum Assignment Amount',
    category: 'assignments_participations',
    favor: 'neutral',
    source: 'lsta_standard',
    text: 'Each assignment shall be in an aggregate amount of not less than $5,000,000 (or the entire remaining amount of the assigning Lender\'s Commitment or Loans if less), unless otherwise agreed by the Borrower and the Administrative Agent.',
    description: 'Standard minimum assignment threshold to prevent fragmented syndicate',
    keyPhrases: ['assignment', '$5,000,000', 'aggregate amount', 'remaining amount'],
    tags: ['assignment', 'minimum', 'threshold', 'syndicate'],
    isApproved: true,
    usageCount: 44,
    lastUsedAt: '2024-12-14T09:30:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-02-20T12:30:00Z',
    negotiationPoints: [
      'Minimum amount ($1M to $10M typical)',
      'Whole loan carve-out',
    ],
  },
  // Representations & Warranties
  {
    id: 'clause-050',
    name: 'Legal Existence',
    category: 'representations_warranties',
    favor: 'neutral',
    source: 'lsta_standard',
    text: 'The Borrower is a corporation duly organized, validly existing and in good standing under the laws of the jurisdiction of its incorporation and has all corporate power and authority required to carry on its business as now conducted.',
    description: 'Standard representation regarding borrower legal status and capacity',
    keyPhrases: ['duly organized', 'validly existing', 'good standing', 'corporate power and authority'],
    tags: ['representation', 'existence', 'organization', 'corporate'],
    isApproved: true,
    usageCount: 52,
    lastUsedAt: '2024-12-18T14:00:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-01-10T08:30:00Z',
  },
  {
    id: 'clause-051',
    name: 'No Material Adverse Change',
    category: 'representations_warranties',
    favor: 'lender',
    source: 'lsta_standard',
    text: 'Since the date of the most recent audited financial statements delivered to the Lenders, there has been no event or circumstance that has had or could reasonably be expected to have a Material Adverse Effect.',
    description: 'Representation that no MAC has occurred since reference date',
    keyPhrases: ['Material Adverse Effect', 'audited financial statements', 'reasonably be expected'],
    tags: ['representation', 'MAC', 'material adverse', 'bringdown'],
    isApproved: true,
    usageCount: 49,
    lastUsedAt: '2024-12-15T11:45:00Z',
    createdBy: 'Legal Team',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-04-22T10:00:00Z',
    legalNotes: 'MAC definition is heavily negotiated. Consider specific carve-outs.',
    negotiationPoints: [
      'MAC definition scope',
      'Carve-outs (market conditions, industry trends)',
      'Reference date',
    ],
  },
];

/**
 * Sample clause variants
 */
export const mockClauseVariants: ClauseVariant[] = [
  {
    id: 'variant-001-a',
    parentClauseId: 'clause-001',
    favor: 'neutral',
    text: 'The Borrower shall not permit the Leverage Ratio as of the last day of any fiscal quarter to exceed 3.75 to 1.00.',
    variantDescription: 'Slightly higher threshold at 3.75x for investment grade borrowers',
    isApproved: true,
    source: 'market_standard',
    usageCount: 12,
  },
  {
    id: 'variant-001-b',
    parentClauseId: 'clause-001',
    favor: 'lender',
    text: 'The Borrower shall not permit the Leverage Ratio as of the last day of any fiscal quarter to exceed 3.00 to 1.00.',
    variantDescription: 'Tighter threshold at 3.00x for higher credit risk situations',
    isApproved: true,
    source: 'market_standard',
    usageCount: 8,
  },
  {
    id: 'variant-020-a',
    parentClauseId: 'clause-020',
    favor: 'borrower',
    text: 'The Borrower shall fail to pay any principal of any Loan when due and such failure shall continue for 3 Business Days after written notice from the Administrative Agent; or the Borrower shall fail to pay any interest on any Loan or any fee or other amount payable hereunder within 5 Business Days after written notice from the Administrative Agent.',
    variantDescription: 'Adds notice requirement before payment default',
    isApproved: true,
    source: 'negotiated',
    usageCount: 5,
  },
];

/**
 * Mock clause library statistics
 */
export const mockClauseLibraryStats: ClauseLibraryStats = {
  totalClauses: mockClauseTemplates.length,
  byCategory: {
    financial_covenants: 3,
    reporting_requirements: 2,
    representations_warranties: 2,
    events_of_default: 3,
    definitions: 0,
    conditions_precedent: 0,
    affirmative_covenants: 0,
    negative_covenants: 2,
    indemnification: 0,
    assignments_participations: 2,
    miscellaneous: 0,
  },
  byFavor: {
    lender: 8,
    borrower: 3,
    neutral: 3,
  },
  bySource: {
    lsta_standard: 10,
    market_standard: 0,
    custom: 0,
    negotiated: 4,
  },
  mostUsed: [
    { clauseId: 'clause-010', name: 'Quarterly Financial Statements', usageCount: 52 },
    { clauseId: 'clause-050', name: 'Legal Existence', usageCount: 52 },
    { clauseId: 'clause-011', name: 'Compliance Certificate', usageCount: 51 },
    { clauseId: 'clause-031', name: 'Limitation on Liens', usageCount: 50 },
    { clauseId: 'clause-051', name: 'No Material Adverse Change', usageCount: 49 },
  ],
  recentlyAdded: mockClauseTemplates.slice(0, 3),
};

/**
 * Get a clause template by ID
 */
export function getClauseById(id: string): ClauseTemplate | undefined {
  return mockClauseTemplates.find(c => c.id === id);
}

/**
 * Get variants for a clause
 */
export function getClauseVariants(clauseId: string): ClauseVariant[] {
  return mockClauseVariants.filter(v => v.parentClauseId === clauseId);
}

/**
 * Simple text similarity function (Jaccard similarity on words)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) =>
    text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Find matching clauses for given text
 */
export function findMatchingClauses(text: string, minSimilarity: number = 0.3): Array<{
  clause: ClauseTemplate;
  similarity: number;
}> {
  return mockClauseTemplates
    .map(clause => ({
      clause,
      similarity: calculateTextSimilarity(text, clause.text),
    }))
    .filter(match => match.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity);
}
