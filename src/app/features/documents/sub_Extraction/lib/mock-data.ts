/**
 * Consolidated mock data for extraction feature
 */

import { shouldAutoFlag } from './constants';
import type { ExtractionField, ExtractionCategory } from '../../lib/types';

/**
 * Helper to create extraction fields with auto-flagging based on confidence.
 * Fields with confidence < 70% are automatically flagged.
 */
function createField(field: Omit<ExtractionField, 'flagged'> & { flagged?: boolean }): ExtractionField {
  return {
    ...field,
    // Auto-flag based on confidence threshold if not explicitly set
    flagged: field.flagged ?? shouldAutoFlag(field.confidence),
  };
}

/**
 * Mock extraction data for testing.
 *
 * Auto-flagging is applied based on confidence thresholds:
 * - >= 85%: Trusted (not flagged)
 * - 70-84%: Optional review (not flagged by default)
 * - < 70%: Auto-flagged for mandatory review
 *
 * Some fields may be explicitly flagged even with higher confidence
 * when there are other reasons for review (e.g., ambiguous source text).
 */
export const mockExtractionFields: ExtractionCategory[] = [
    {
        id: '1',
        category: 'Basic Information',
        fields: [
            // 98% confidence - Trusted, not flagged
            createField({
              name: 'Facility Name',
              value: 'Project Apollo Senior Secured Term Loan Facility',
              confidence: 0.98,
              source: 'Page 1, Line 5',
              sourceExcerpt: 'This SENIOR SECURED TERM LOAN FACILITY AGREEMENT (this "Agreement") is entered into as of November 15, 2024, among Apollo Holdings, LLC (the "Borrower"), for the Project Apollo Senior Secured Term Loan Facility...',
              extractionReasoning: 'The facility name was identified in the title section of the agreement. The phrase "Project Apollo Senior Secured Term Loan Facility" appears in both the document title and the preamble, with consistent capitalization indicating it is the formal name.',
              boundingBox: { x: 10, y: 15, width: 80, height: 6 }
            }),
            // 95% confidence - Trusted, not flagged
            createField({
              name: 'Facility Reference',
              value: 'APOLLO-2024-001',
              confidence: 0.95,
              source: 'Page 2, Line 12',
              sourceExcerpt: 'Reference Number: APOLLO-2024-001\nLoan Identification: As assigned by Administrative Agent',
              extractionReasoning: 'The facility reference was found in the standard reference block on page 2. The format APOLLO-2024-001 follows typical facility reference conventions (project code-year-sequence).',
              boundingBox: { x: 15, y: 35, width: 40, height: 5 }
            }),
            // 96% confidence - Trusted, not flagged
            createField({
              name: 'Facility Type',
              value: 'Term Loan',
              confidence: 0.96,
              source: 'Page 1, Line 8',
              sourceExcerpt: '"Facility Type" means Term Loan, being a senior secured term loan facility with scheduled amortization...',
              extractionReasoning: 'The facility type is explicitly defined in the definitions section. "Term Loan" is distinguished from revolving credit facilities by the presence of scheduled principal amortization.',
              boundingBox: { x: 10, y: 22, width: 70, height: 5 }
            }),
            // 99% confidence - Trusted, not flagged
            createField({
              name: 'Governing Law',
              value: 'New York',
              confidence: 0.99,
              source: 'Page 145, Section 12.1',
              sourceExcerpt: 'Section 12.1 GOVERNING LAW. THIS AGREEMENT AND THE OTHER LOAN DOCUMENTS SHALL BE GOVERNED BY, AND CONSTRUED IN ACCORDANCE WITH, THE LAW OF THE STATE OF NEW YORK.',
              extractionReasoning: 'The governing law clause explicitly states New York law. This is a standard provision found in the miscellaneous section and uses typical all-caps emphasis for governing law provisions.',
              boundingBox: { x: 5, y: 25, width: 90, height: 8 }
            }),
        ],
    },
    {
        id: '2',
        category: 'Key Dates',
        fields: [
            // 97% confidence - Trusted, not flagged
            createField({
              name: 'Execution Date',
              value: '2024-11-15',
              confidence: 0.97,
              source: 'Page 1, Header',
              sourceExcerpt: 'SENIOR SECURED TERM LOAN FACILITY AGREEMENT\ndated as of November 15, 2024\namong\nAPOLLO HOLDINGS, LLC',
              extractionReasoning: 'The execution date appears in the header of the agreement using the standard "dated as of" formulation. This date represents when the agreement was formally executed.',
              boundingBox: { x: 20, y: 8, width: 60, height: 4 }
            }),
            // 94% confidence - Trusted, not flagged
            createField({
              name: 'Effective Date',
              value: '2024-11-20',
              confidence: 0.94,
              source: 'Page 3, Section 1.1',
              sourceExcerpt: '"Effective Date" means November 20, 2024, or such later date on which all conditions precedent set forth in Section 5.1 shall have been satisfied...',
              extractionReasoning: 'The effective date is defined in the definitions section. It is distinct from the execution date and represents when the loan becomes operational pending satisfaction of conditions precedent.',
              boundingBox: { x: 5, y: 30, width: 90, height: 6 }
            }),
            // 92% confidence - Trusted, not flagged
            createField({
              name: 'Maturity Date',
              value: '2029-11-20',
              confidence: 0.92,
              source: 'Page 4, Section 2.3',
              sourceExcerpt: '"Maturity Date" means November 20, 2029, unless accelerated or extended pursuant to the terms hereof...',
              extractionReasoning: 'The maturity date is a defined term representing the final repayment date. The 5-year tenor from the effective date is consistent with typical term loan structures.',
              boundingBox: { x: 5, y: 45, width: 85, height: 5 }
            }),
        ],
    },
    {
        id: '3',
        category: 'Financial Terms',
        fields: [
            // 99% confidence - Trusted, not flagged
            createField({
              name: 'Total Commitments',
              value: '$500,000,000',
              confidence: 0.99,
              source: 'Page 5, Section 3.1',
              sourceExcerpt: 'Section 3.1 COMMITMENTS. Subject to the terms and conditions set forth herein, each Lender agrees to make a Term Loan to the Borrower in a principal amount equal to such Lender\'s Commitment. Total Commitments: $500,000,000 (Five Hundred Million Dollars).',
              extractionReasoning: 'The total commitment amount is stated explicitly in both numeric and written form ($500,000,000 and "Five Hundred Million Dollars"), providing high confidence in the accuracy of this extraction.',
              boundingBox: { x: 5, y: 35, width: 90, height: 10 }
            }),
            // 99% confidence - Trusted, not flagged
            createField({
              name: 'Currency',
              value: 'USD',
              confidence: 0.99,
              source: 'Page 5, Section 3.1',
              sourceExcerpt: 'All amounts hereunder shall be denominated in United States Dollars ("USD" or "$")...',
              extractionReasoning: 'The currency is explicitly defined as United States Dollars (USD). The consistent use of the "$" symbol throughout the document confirms this extraction.',
              boundingBox: { x: 5, y: 48, width: 70, height: 4 }
            }),
            // 88% confidence - Trusted, not flagged (>= 85%)
            createField({
              name: 'Base Rate',
              value: 'SOFR',
              confidence: 0.88,
              source: 'Page 12, Section 4.2',
              sourceExcerpt: 'Section 4.2 INTEREST RATES. The Term Loans shall bear interest at a rate per annum equal to Term SOFR plus the Applicable Margin. "Term SOFR" means the Secured Overnight Financing Rate...',
              extractionReasoning: 'The base rate is identified as Term SOFR (Secured Overnight Financing Rate). Confidence is slightly reduced due to the presence of fallback rate provisions that could affect the actual rate applied.',
              boundingBox: { x: 5, y: 20, width: 90, height: 8 }
            }),
            // 85% confidence - Trusted, not flagged (exactly at threshold)
            createField({
              name: 'Initial Margin',
              value: '3.25%',
              confidence: 0.85,
              source: 'Page 12, Section 4.3',
              sourceExcerpt: 'Section 4.3 APPLICABLE MARGIN. "Applicable Margin" means, initially, 3.25% per annum, subject to adjustment based on the Leverage Ratio as set forth in the pricing grid below...',
              extractionReasoning: 'The initial margin of 3.25% is stated as the starting rate. Lower confidence due to the presence of a pricing grid that adjusts the margin based on leverage ratio performance.',
              boundingBox: { x: 5, y: 32, width: 85, height: 7 }
            }),
            // 72% confidence - Optional review range, but explicitly flagged due to ambiguous source
            createField({
              name: 'Commitment Fee',
              value: '0.50%',
              confidence: 0.72,
              source: 'Page 15, Section 4.5',
              flagged: true, // Explicitly flagged due to ambiguous bracketed text in source
              sourceExcerpt: 'Section 4.5 COMMITMENT FEE. The Borrower agrees to pay to each Lender a commitment fee computed at a rate equal to [0.50%/0.375%] per annum on the average daily unused portion...',
              extractionReasoning: 'FLAGGED FOR REVIEW: The commitment fee shows two possible values (0.50% or 0.375%) in the source text, likely representing bracketed negotiation language. The higher rate of 0.50% was selected as the more conservative interpretation, but manual verification is recommended.',
              boundingBox: { x: 5, y: 18, width: 90, height: 10 }
            }),
        ],
    },
    {
        id: '4',
        category: 'Covenants',
        fields: [
            // 93% confidence - Trusted, not flagged
            createField({
              name: 'Max Leverage Ratio',
              value: '4.50x',
              confidence: 0.93,
              source: 'Page 78, Section 7.1(a)',
              sourceExcerpt: 'Section 7.1 FINANCIAL COVENANTS. (a) Maximum Leverage Ratio. The Borrower shall not permit the Leverage Ratio as of the last day of any fiscal quarter to exceed 4.50 to 1.00...',
              extractionReasoning: 'The maximum leverage ratio covenant is clearly stated as 4.50:1.00. This is expressed as "4.50x" in standardized format. The covenant is tested quarterly as of fiscal quarter-end.',
              boundingBox: { x: 5, y: 25, width: 90, height: 8 }
            }),
            // 91% confidence - Trusted, not flagged
            createField({
              name: 'Min Interest Coverage',
              value: '3.00x',
              confidence: 0.91,
              source: 'Page 78, Section 7.1(b)',
              sourceExcerpt: '(b) Minimum Interest Coverage Ratio. The Borrower shall not permit the Interest Coverage Ratio as of the last day of any fiscal quarter to be less than 3.00 to 1.00...',
              extractionReasoning: 'The minimum interest coverage ratio is stated as 3.00:1.00, expressed as "3.00x" in standardized format. This is a floor covenant requiring the ratio to be at or above this level.',
              boundingBox: { x: 5, y: 38, width: 90, height: 7 }
            }),
            // 68% confidence - AUTO-FLAGGED (< 70%)
            createField({
              name: 'Max CapEx',
              value: '$50,000,000',
              confidence: 0.68,
              source: 'Page 82, Section 7.2',
              // Auto-flagged due to confidence < 70%
              sourceExcerpt: 'Section 7.2 CAPITAL EXPENDITURES. The Borrower shall not make Capital Expenditures in any fiscal year in excess of $50,000,000; provided that unused amounts up to $15,000,000 may be carried forward...',
              extractionReasoning: 'FLAGGED FOR REVIEW: While the base CapEx limit of $50,000,000 is clearly stated, the carryforward provision adds complexity. The effective annual limit could be higher if prior year capacity was unused. Manual review recommended to confirm whether carryforward should be reflected.',
              boundingBox: { x: 5, y: 20, width: 90, height: 10 }
            }),
            // 95% confidence - Trusted, not flagged
            createField({
              name: 'Covenant Testing',
              value: 'Quarterly',
              confidence: 0.95,
              source: 'Page 77, Section 7.1',
              sourceExcerpt: 'The financial covenants set forth in this Section 7.1 shall be tested as of the last day of each fiscal quarter, commencing with the fiscal quarter ending March 31, 2025...',
              extractionReasoning: 'The covenant testing frequency is explicitly stated as quarterly, with testing occurring as of each fiscal quarter-end. The first test date is specified as March 31, 2025.',
              boundingBox: { x: 5, y: 15, width: 85, height: 6 }
            }),
        ],
    },
];
