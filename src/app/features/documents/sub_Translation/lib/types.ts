/**
 * Types for Document Translation UI
 */

export type ClauseType = 'covenant' | 'obligation' | 'facility_term' | 'definition' | 'general';
export type FormalityLevel = 'standard' | 'formal' | 'simplified';
export type ExportFormat = 'markdown' | 'text' | 'docx' | 'json';

export interface TranslationFormData {
  clauseType: ClauseType;
  /** Dynamic field values based on clause type */
  fields: Record<string, string | number | boolean>;
  /** Document context */
  context: {
    borrowerName: string;
    facilityName: string;
    governingLaw: string;
  };
  /** Formatting options */
  formatOptions: {
    includeNumbering: boolean;
    useDefinedTerms: boolean;
    includeCrossReferences: boolean;
    formalityLevel: FormalityLevel;
  };
  /** Optional precedent clauses for style matching */
  precedentClauses: string[];
}

export interface TranslatedClause {
  id: string;
  clauseText: string;
  suggestedSection: string;
  clauseTitle: string;
  category: string;
  confidence: number;
  precedentMatch?: {
    sourceDocument: string;
    matchPercentage: number;
    adaptations: string[];
  };
  warnings?: string[];
  alternatives?: string[];
}

export interface TranslationState {
  isLoading: boolean;
  error: string | null;
  translatedClauses: TranslatedClause[];
  selectedClause: TranslatedClause | null;
}

export interface CovenantFormFields {
  covenantName: string;
  covenantType: string;
  thresholdType: 'maximum' | 'minimum' | 'range';
  thresholdValue: string;
  testingFrequency: string;
  numeratorDefinition: string;
  denominatorDefinition: string;
}

export interface ObligationFormFields {
  obligationType: string;
  description: string;
  frequency: string;
  deadlineDays: string;
  recipientRole: string;
}

export interface FacilityTermFormFields {
  termName: string;
  termValue: string;
  termType: string;
}

export interface DefinitionFormFields {
  termName: string;
  definition: string;
  relatedTerms: string;
}

export const COVENANT_TYPES = [
  { value: 'leverage_ratio', label: 'Leverage Ratio' },
  { value: 'interest_coverage', label: 'Interest Coverage Ratio' },
  { value: 'debt_service_coverage', label: 'Debt Service Coverage' },
  { value: 'net_worth', label: 'Minimum Net Worth' },
  { value: 'current_ratio', label: 'Current Ratio' },
  { value: 'capex_limit', label: 'Capital Expenditure Limit' },
  { value: 'fixed_charge_coverage', label: 'Fixed Charge Coverage' },
  { value: 'other', label: 'Other' },
];

export const THRESHOLD_TYPES = [
  { value: 'maximum', label: 'Maximum (shall not exceed)' },
  { value: 'minimum', label: 'Minimum (shall not be less than)' },
  { value: 'range', label: 'Range (within bounds)' },
];

export const TESTING_FREQUENCIES = [
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'monthly', label: 'Monthly' },
];

export const OBLIGATION_TYPES = [
  { value: 'annual_financials', label: 'Annual Financial Statements' },
  { value: 'quarterly_financials', label: 'Quarterly Financial Statements' },
  { value: 'compliance_certificate', label: 'Compliance Certificate' },
  { value: 'budget', label: 'Annual Budget' },
  { value: 'audit_report', label: 'Audit Report' },
  { value: 'event_notice', label: 'Event Notice' },
  { value: 'insurance_certificate', label: 'Insurance Certificate' },
  { value: 'other', label: 'Other' },
];

export const REPORTING_FREQUENCIES = [
  { value: 'annual', label: 'Annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'on_occurrence', label: 'Upon Occurrence' },
];

export const FACILITY_TERM_TYPES = [
  { value: 'commitment', label: 'Commitment Amount' },
  { value: 'interest_rate', label: 'Interest Rate / Margin' },
  { value: 'maturity', label: 'Maturity Date' },
  { value: 'amortization', label: 'Amortization Schedule' },
  { value: 'prepayment', label: 'Prepayment Terms' },
  { value: 'fee', label: 'Fees' },
  { value: 'security', label: 'Security / Collateral' },
  { value: 'other', label: 'Other' },
];

export const FORMALITY_LEVELS = [
  { value: 'formal', label: 'Formal (Standard Legal)' },
  { value: 'standard', label: 'Standard (Balanced)' },
  { value: 'simplified', label: 'Simplified (Plain Language)' },
];

export const GOVERNING_LAWS = [
  { value: 'New York', label: 'New York' },
  { value: 'Delaware', label: 'Delaware' },
  { value: 'English', label: 'English' },
  { value: 'California', label: 'California' },
  { value: 'Other', label: 'Other' },
];
