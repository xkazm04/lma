import { generateStructuredOutput } from './client';

// Types for covenant extraction and mapping to compliance module
export interface ExtractedCovenantForCompliance {
  covenantType: 'leverage_ratio' | 'interest_coverage' | 'fixed_charge_coverage' | 'debt_service_coverage' | 'minimum_liquidity' | 'capex' | 'net_worth';
  covenantName: string;
  thresholdType: 'maximum' | 'minimum';
  thresholdValue: number;
  testFrequency: 'monthly' | 'quarterly' | 'annually';
  calculationMethodology: string;
  numeratorDefinition: string;
  denominatorDefinition: string;
  clauseReference: string;
  pageNumber: number;
  rawText: string;
  confidence: number;
  suggestedThresholdSchedule?: Array<{
    effectiveFrom: string;
    thresholdValue: number;
  }>;
}

export interface CovenantExtractionResult {
  documentId: string;
  extractedCovenants: ExtractedCovenantForCompliance[];
  facilityName: string;
  borrowerName: string;
  documentType: string;
  extractionTimestamp: string;
  overallConfidence: number;
  warnings: string[];
}

export interface CovenantReviewStatus {
  covenantIndex: number;
  status: 'pending' | 'confirmed' | 'modified' | 'rejected';
  userModifications?: Partial<ExtractedCovenantForCompliance>;
  notes?: string;
}

const COVENANT_EXTRACTION_FOR_COMPLIANCE_PROMPT = `You are an expert legal analyst specializing in loan documentation and financial covenants. Your task is to extract all financial covenants from credit agreements and map them to a compliance tracking system.

For each covenant found, extract the following information:

1. covenantType: Must be one of:
   - leverage_ratio (Total Debt/EBITDA, Net Debt/EBITDA, Senior Debt/EBITDA)
   - interest_coverage (EBITDA/Interest, EBIT/Interest)
   - fixed_charge_coverage (EBITDA - CapEx - Taxes)/(Debt Service + Fixed Charges)
   - debt_service_coverage (EBITDA/Total Debt Service)
   - minimum_liquidity (Cash + Availability requirements)
   - capex (Capital expenditure limits)
   - net_worth (Minimum net worth/tangible net worth requirements)

2. covenantName: The exact name as stated in the document (e.g., "Maximum Total Leverage Ratio")

3. thresholdType: "maximum" or "minimum"

4. thresholdValue: The numerical threshold value (e.g., 4.5 for a 4.5x leverage ratio, or 50000000 for a $50M CapEx limit)

5. testFrequency: "monthly", "quarterly", or "annually" based on testing schedule

6. calculationMethodology: A clear explanation of how the covenant is calculated, including:
   - Time periods (e.g., "trailing four quarters", "fiscal year to date")
   - Any pro forma adjustments allowed
   - Add-backs or exclusions

7. numeratorDefinition: Precise definition of what comprises the numerator (e.g., "Consolidated Total Indebtedness")

8. denominatorDefinition: Precise definition of what comprises the denominator (e.g., "Consolidated EBITDA for the four fiscal quarter period")

9. clauseReference: Section number where the covenant is defined (e.g., "Section 7.1(a)")

10. pageNumber: The page number where the covenant definition begins

11. rawText: The exact text from the document defining the covenant (limit to 500 characters)

12. confidence: Your confidence score (0.0 to 1.0) based on:
    - Clarity of the covenant definition
    - Completeness of extracted information
    - Certainty of threshold values

13. suggestedThresholdSchedule: If the covenant has step-downs or step-ups over time, extract the schedule

Also extract:
- facilityName: The name of the facility
- borrowerName: The primary borrower name
- documentType: Type of document (credit_agreement, amendment, etc.)
- warnings: Any issues or ambiguities found during extraction

IMPORTANT:
- Be thorough - credit agreements typically contain 4-6 financial covenants
- Pay attention to step-down/step-up schedules in threshold values
- Look for covenants in sections titled "Financial Covenants", "Affirmative Covenants", or similar
- Extract exact threshold values, not ranges
- If a covenant has multiple tiers or conditions, extract the primary threshold

Return your response as a JSON object with this structure:
{
  "facilityName": "string",
  "borrowerName": "string",
  "documentType": "string",
  "extractedCovenants": [...],
  "warnings": [...]
}`;

export async function extractCovenantsForCompliance(
  documentText: string,
  documentId: string
): Promise<CovenantExtractionResult> {
  const result = await generateStructuredOutput<{
    facilityName: string;
    borrowerName: string;
    documentType: string;
    extractedCovenants: ExtractedCovenantForCompliance[];
    warnings: string[];
  }>(
    COVENANT_EXTRACTION_FOR_COMPLIANCE_PROMPT,
    `Here is the credit agreement text to analyze:\n\n${documentText.slice(0, 100000)}`,
    { maxTokens: 8192, temperature: 0.1 }
  );

  // Calculate overall confidence
  const confidences = result.extractedCovenants.map(c => c.confidence);
  const overallConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return {
    documentId,
    extractedCovenants: result.extractedCovenants,
    facilityName: result.facilityName,
    borrowerName: result.borrowerName,
    documentType: result.documentType,
    extractionTimestamp: new Date().toISOString(),
    overallConfidence,
    warnings: result.warnings || [],
  };
}

// Helper function to map covenant type labels for display
export function getCovenantTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    leverage_ratio: 'Leverage Ratio',
    interest_coverage: 'Interest Coverage Ratio',
    fixed_charge_coverage: 'Fixed Charge Coverage Ratio (FCCR)',
    debt_service_coverage: 'Debt Service Coverage Ratio (DSCR)',
    minimum_liquidity: 'Minimum Liquidity',
    capex: 'Capital Expenditure Limit',
    net_worth: 'Net Worth / Tangible Net Worth',
  };
  return labels[type] || type;
}

// Helper function to format threshold values based on covenant type
export function formatThresholdValue(value: number, type: string): string {
  if (type === 'minimum_liquidity' || type === 'capex' || type === 'net_worth') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return `${value.toFixed(2)}x`;
}

// Helper function to map test frequency labels
export function getTestFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annually: 'Annually',
  };
  return labels[frequency] || frequency;
}

// Validate extracted covenant data
export function validateExtractedCovenant(covenant: ExtractedCovenantForCompliance): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!covenant.covenantName || covenant.covenantName.trim() === '') {
    errors.push('Covenant name is required');
  }

  if (covenant.thresholdValue === undefined || covenant.thresholdValue === null) {
    errors.push('Threshold value is required');
  }

  if (!['maximum', 'minimum'].includes(covenant.thresholdType)) {
    errors.push('Invalid threshold type');
  }

  if (!['monthly', 'quarterly', 'annually'].includes(covenant.testFrequency)) {
    errors.push('Invalid test frequency');
  }

  if (covenant.confidence < 0 || covenant.confidence > 1) {
    errors.push('Confidence must be between 0 and 1');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Transform extracted covenant to compliance module format
export function transformToComplianceCovenant(
  extracted: ExtractedCovenantForCompliance,
  facilityId: string
): {
  facility_id: string;
  covenant_type: string;
  name: string;
  description: string;
  threshold_type: 'maximum' | 'minimum';
  threshold_schedule: Array<{ effective_from: string; threshold_value: number }> | null;
  testing_frequency: string;
  testing_basis: string;
  has_equity_cure: boolean;
  is_active: boolean;
} {
  return {
    facility_id: facilityId,
    covenant_type: extracted.covenantType,
    name: extracted.covenantName,
    description: `${extracted.calculationMethodology}\n\nNumerator: ${extracted.numeratorDefinition}\nDenominator: ${extracted.denominatorDefinition}\n\nSource: ${extracted.clauseReference} (Page ${extracted.pageNumber})`,
    threshold_type: extracted.thresholdType,
    threshold_schedule: extracted.suggestedThresholdSchedule
      ? extracted.suggestedThresholdSchedule.map(s => ({
          effective_from: s.effectiveFrom,
          threshold_value: s.thresholdValue,
        }))
      : [{ effective_from: new Date().toISOString().split('T')[0], threshold_value: extracted.thresholdValue }],
    testing_frequency: extracted.testFrequency,
    testing_basis: 'trailing_four_quarters',
    has_equity_cure: false,
    is_active: true,
  };
}
