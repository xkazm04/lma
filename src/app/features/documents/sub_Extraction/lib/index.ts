// Template types
export type {
  LoanDocumentType,
  FieldDataType,
  ValidationRuleType,
  ValidationRule,
  TypicalValueRange,
  TemplateField,
  TemplateCategory,
  ExtractionTemplate,
  TemplateValidationResult,
  FieldValidationResult,
  FieldAnomaly,
  DocumentTypeDetection,
  TemplatePreferences,
} from './template-types';

// Templates
export {
  termLoanTemplate,
  revolvingCreditTemplate,
  syndicatedFacilityTemplate,
  bridgeLoanTemplate,
  amendmentTemplate,
  systemTemplates,
  getTemplateById,
  getTemplateByDocumentType,
  getAllTemplates,
  getFieldsByCategory,
} from './templates';

// Template detection
export {
  detectDocumentType,
  detectFromFileName,
  detectDocumentTypeWithFileName,
  shouldAutoApplyTemplate,
  getDetectionDescription,
} from './template-detector';

// Template validation
export {
  validateAgainstTemplate,
  getMissingRequiredFields,
  getFieldsWithErrors,
  getAnomaliesBySeverity,
} from './template-validator';

// Other exports
export { mockExtractionFields } from './mock-data';
export { getMaxPageNumber, calculateHighlightRegion } from './sourceParser';
export {
  getConfidenceLevel,
  shouldFlagForReview,
  formatConfidenceScore,
} from './confidenceHelpers';
export type { ConfidenceLevel } from './confidenceHelpers';
