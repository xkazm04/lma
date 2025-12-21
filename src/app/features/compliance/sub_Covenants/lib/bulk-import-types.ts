// =============================================================================
// Bulk Covenant Test Import Types
// =============================================================================

/**
 * Column mapping options for covenant test import.
 * Maps spreadsheet columns to covenant test fields.
 */
export interface ColumnMapping {
  covenantId: string | null;
  facilityId: string | null;
  facilityName: string | null;
  covenantName: string | null;
  covenantType: string | null;
  testDate: string | null;
  calculatedValue: string | null;
  testResult: string | null;
  notes: string | null;
}

/**
 * Raw row data from spreadsheet before mapping.
 */
export interface RawImportRow {
  rowIndex: number;
  data: Record<string, string | number | null>;
}

/**
 * Parsed covenant test result ready for validation.
 */
export interface ParsedCovenantTest {
  rowIndex: number;
  covenantId?: string;
  facilityId?: string;
  facilityName?: string;
  covenantName?: string;
  covenantType?: string;
  testDate: string;
  calculatedValue: number;
  testResult?: 'pass' | 'fail';
  notes?: string;
  raw: Record<string, string | number | null>;
}

/**
 * Validation result for a single test record.
 */
export interface ValidationResult {
  rowIndex: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  matchedCovenant?: {
    id: string;
    name: string;
    facilityId: string;
    facilityName: string;
    thresholdType: 'maximum' | 'minimum';
    currentThreshold: number;
    covenantType: string;
  };
  predictedResult?: 'pass' | 'fail';
  calculatedHeadroom?: number;
}

/**
 * Validated test record ready for import.
 */
export interface ValidatedCovenantTest extends ParsedCovenantTest {
  validation: ValidationResult;
}

/**
 * Import batch for processing.
 */
export interface ImportBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: 'pending' | 'validated' | 'importing' | 'completed' | 'failed';
  tests: ValidatedCovenantTest[];
  mapping: ColumnMapping;
}

/**
 * Import history record for audit trail.
 */
export interface ImportHistoryRecord {
  id: string;
  fileName: string;
  uploadedAt: string;
  importedAt: string;
  uploadedBy: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  status: 'completed' | 'partial' | 'failed';
  summary: {
    facilitiesAffected: string[];
    covenantsUpdated: number;
    testsRecorded: number;
  };
}

/**
 * Import step for the wizard.
 */
export type ImportStep = 'upload' | 'mapping' | 'validation' | 'confirmation' | 'complete';

/**
 * Available covenant types for mapping.
 */
export const COVENANT_TYPES = [
  { value: 'leverage_ratio', label: 'Leverage Ratio' },
  { value: 'interest_coverage', label: 'Interest Coverage' },
  { value: 'fixed_charge_coverage', label: 'Fixed Charge Coverage (FCCR)' },
  { value: 'debt_service_coverage', label: 'Debt Service Coverage (DSCR)' },
  { value: 'minimum_liquidity', label: 'Minimum Liquidity' },
  { value: 'capex', label: 'Capital Expenditure (CapEx)' },
  { value: 'net_worth', label: 'Net Worth' },
] as const;

/**
 * Required fields for a valid import.
 */
export const REQUIRED_FIELDS: (keyof ColumnMapping)[] = [
  'testDate',
  'calculatedValue',
];

/**
 * At least one of these identifier fields must be mapped.
 */
export const IDENTIFIER_FIELDS: (keyof ColumnMapping)[] = [
  'covenantId',
  'covenantName',
];
