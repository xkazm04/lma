/**
 * Extraction Template Types
 *
 * Templates define expected fields, validation rules, and typical value ranges
 * for common loan document types. Templates can be auto-detected based on
 * document content or manually selected by the user.
 */

/**
 * Supported loan document types for extraction templates
 */
export type LoanDocumentType =
  | 'term_loan'
  | 'revolving_credit'
  | 'syndicated_facility'
  | 'bridge_loan'
  | 'letter_of_credit'
  | 'amendment'
  | 'custom';

/**
 * Field data types for validation
 */
export type FieldDataType =
  | 'string'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'boolean'
  | 'ratio'
  | 'enum';

/**
 * Validation rule types
 */
export type ValidationRuleType =
  | 'required'
  | 'min_value'
  | 'max_value'
  | 'pattern'
  | 'date_range'
  | 'enum_values'
  | 'custom';

/**
 * A single validation rule for a template field
 */
export interface ValidationRule {
  /** Type of validation */
  type: ValidationRuleType;
  /** Value for the validation (e.g., min value, pattern, etc.) */
  value?: string | number | string[] | { min?: string | number; max?: string | number };
  /** Error message when validation fails */
  message: string;
}

/**
 * Typical value range for anomaly detection
 */
export interface TypicalValueRange {
  /** Minimum typical value */
  min?: number;
  /** Maximum typical value */
  max?: number;
  /** Common/typical values for enum fields */
  commonValues?: string[];
  /** Unit of measure (e.g., 'USD', 'bps', '%') */
  unit?: string;
  /** Description of typical range context */
  context?: string;
}

/**
 * A single field definition in an extraction template
 */
export interface TemplateField {
  /** Unique field key (e.g., 'facility_name', 'total_commitments') */
  fieldKey: string;
  /** Display label for the field */
  label: string;
  /** Category this field belongs to */
  category: string;
  /** Data type for validation */
  dataType: FieldDataType;
  /** Whether this field is required */
  required: boolean;
  /** Description/help text for the field */
  description?: string;
  /** Validation rules for the field */
  validationRules?: ValidationRule[];
  /** Typical value range for anomaly detection */
  typicalRange?: TypicalValueRange;
  /** Display order within the category */
  displayOrder: number;
  /** Keywords that help locate this field in documents */
  extractionHints?: string[];
  /** Default value if not found */
  defaultValue?: string | number | boolean;
}

/**
 * Category grouping for template fields
 */
export interface TemplateCategory {
  /** Unique category ID */
  id: string;
  /** Display name for the category */
  name: string;
  /** Description of what this category contains */
  description?: string;
  /** Display order */
  displayOrder: number;
  /** Icon name for the category */
  icon?: string;
}

/**
 * An extraction template for a specific document type
 */
export interface ExtractionTemplate {
  /** Unique template ID */
  id: string;
  /** Display name for the template */
  name: string;
  /** Document type this template is for */
  documentType: LoanDocumentType;
  /** Description of when to use this template */
  description: string;
  /** Version of the template */
  version: string;
  /** Categories in this template */
  categories: TemplateCategory[];
  /** Fields in this template */
  fields: TemplateField[];
  /** Keywords that help auto-detect this document type */
  detectionKeywords: string[];
  /** Minimum match score to auto-apply (0-1) */
  autoApplyThreshold: number;
  /** Whether this is a system template or user-created */
  isSystemTemplate: boolean;
  /** Created timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Result of applying a template to extracted data
 */
export interface TemplateValidationResult {
  /** The template that was applied */
  templateId: string;
  /** Whether all required fields passed validation */
  isValid: boolean;
  /** Overall match score (0-1) */
  matchScore: number;
  /** Individual field validation results */
  fieldResults: FieldValidationResult[];
  /** Fields found but not in template */
  unexpectedFields: string[];
  /** Anomalies detected based on typical ranges */
  anomalies: FieldAnomaly[];
}

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  /** Field key */
  fieldKey: string;
  /** Whether the field was found */
  found: boolean;
  /** The extracted value */
  value?: string;
  /** Whether the value passed validation */
  isValid: boolean;
  /** Validation error messages if any */
  errors: string[];
  /** Extraction confidence score */
  confidence?: number;
  /** Whether this value is within typical range */
  isTypical: boolean;
}

/**
 * An anomaly detected in extracted data
 */
export interface FieldAnomaly {
  /** Field key */
  fieldKey: string;
  /** Field label */
  fieldLabel: string;
  /** The extracted value */
  value: string;
  /** Type of anomaly */
  anomalyType: 'out_of_range' | 'unusual_value' | 'format_mismatch' | 'missing_required';
  /** Severity of the anomaly */
  severity: 'info' | 'warning' | 'error';
  /** Description of the anomaly */
  description: string;
  /** Expected range/value information */
  expectedInfo?: string;
}

/**
 * Document type detection result
 */
export interface DocumentTypeDetection {
  /** Detected document type */
  detectedType: LoanDocumentType;
  /** Confidence score (0-1) */
  confidence: number;
  /** Keywords that matched */
  matchedKeywords: string[];
  /** Recommended template ID */
  recommendedTemplateId: string;
  /** Alternative templates that could apply */
  alternativeTemplates: {
    templateId: string;
    confidence: number;
    reason: string;
  }[];
}

/**
 * User preferences for extraction templates
 */
export interface TemplatePreferences {
  /** Default template to use when auto-detection fails */
  defaultTemplateId?: string;
  /** Whether to auto-apply detected templates */
  autoApplyTemplates: boolean;
  /** Minimum confidence for auto-apply */
  autoApplyMinConfidence: number;
  /** Whether to show anomaly warnings */
  showAnomalyWarnings: boolean;
  /** Custom field overrides */
  fieldOverrides?: Record<string, Partial<TemplateField>>;
}
