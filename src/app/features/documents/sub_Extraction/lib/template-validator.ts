/**
 * Template Validation Engine
 *
 * Validates extracted data against template field definitions,
 * including type validation, range checking, and anomaly detection.
 */

import type {
  ExtractionTemplate,
  TemplateField,
  TemplateValidationResult,
  FieldValidationResult,
  FieldAnomaly,
  ValidationRule,
  TypicalValueRange,
} from './template-types';
import type { ExtractionCategory, ExtractionField } from '../../lib/types';

/**
 * Validate extraction results against a template
 */
export function validateAgainstTemplate(
  extractedData: ExtractionCategory[],
  template: ExtractionTemplate
): TemplateValidationResult {
  const fieldResults: FieldValidationResult[] = [];
  const anomalies: FieldAnomaly[] = [];
  const unexpectedFields: string[] = [];

  // Create a map of extracted fields for quick lookup
  const extractedFieldMap = new Map<string, ExtractionField>();
  for (const category of extractedData) {
    for (const field of category.fields) {
      // Normalize field name to match template field keys
      const normalizedKey = normalizeFieldKey(field.name);
      extractedFieldMap.set(normalizedKey, field);
    }
  }

  // Validate each template field
  for (const templateField of template.fields) {
    const extractedField = extractedFieldMap.get(templateField.fieldKey);

    const result = validateField(templateField, extractedField);
    fieldResults.push(result);

    // Check for anomalies if field was found and has value
    if (extractedField && result.found && templateField.typicalRange) {
      const anomaly = checkForAnomaly(templateField, extractedField.value);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    // Remove from map to track unexpected fields
    extractedFieldMap.delete(templateField.fieldKey);
  }

  // Any remaining fields in the map are unexpected
  for (const [key] of extractedFieldMap) {
    unexpectedFields.push(key);
  }

  // Calculate overall match score
  const foundCount = fieldResults.filter((r) => r.found).length;
  const validCount = fieldResults.filter((r) => r.isValid).length;
  const totalFields = fieldResults.length;

  // Weight: 60% for found fields, 40% for valid values
  const matchScore =
    totalFields > 0
      ? (foundCount / totalFields) * 0.6 + (validCount / totalFields) * 0.4
      : 0;

  return {
    templateId: template.id,
    isValid: fieldResults.every((r) => r.isValid),
    matchScore: Math.round(matchScore * 100) / 100,
    fieldResults,
    unexpectedFields,
    anomalies,
  };
}

/**
 * Validate a single field against its template definition
 */
function validateField(
  templateField: TemplateField,
  extractedField: ExtractionField | undefined
): FieldValidationResult {
  const errors: string[] = [];

  // Check if field was found
  if (!extractedField) {
    if (templateField.required) {
      errors.push(`Required field "${templateField.label}" not found`);
    }
    return {
      fieldKey: templateField.fieldKey,
      found: false,
      isValid: !templateField.required,
      errors,
      isTypical: true, // N/A for missing fields
    };
  }

  const value = extractedField.value;

  // Validate data type
  const typeError = validateDataType(value, templateField.dataType);
  if (typeError) {
    errors.push(typeError);
  }

  // Validate against rules
  if (templateField.validationRules) {
    for (const rule of templateField.validationRules) {
      const ruleError = validateRule(value, rule, templateField.dataType);
      if (ruleError) {
        errors.push(ruleError);
      }
    }
  }

  // Check if value is typical
  const isTypical = templateField.typicalRange
    ? isValueTypical(value, templateField.typicalRange, templateField.dataType)
    : true;

  return {
    fieldKey: templateField.fieldKey,
    found: true,
    value,
    isValid: errors.length === 0,
    errors,
    confidence: extractedField.confidence,
    isTypical,
  };
}

/**
 * Validate value against expected data type
 */
function validateDataType(value: string, dataType: string): string | null {
  switch (dataType) {
    case 'number':
      if (!/^-?\d*\.?\d+$/.test(value.replace(/,/g, ''))) {
        return 'Value must be a number';
      }
      break;

    case 'currency':
      // Allow currency symbols, commas, and decimal points
      if (!/^[$€£¥]?\s*-?\d{1,3}(,\d{3})*(\.\d+)?\s*(million|billion|m|b|M|B)?$/i.test(value)) {
        return 'Value must be a valid currency amount';
      }
      break;

    case 'percentage':
      if (!/^-?\d*\.?\d+\s*%?$/.test(value) && !/^-?\d*\.?\d+\s*(bps|basis points)$/i.test(value)) {
        return 'Value must be a percentage';
      }
      break;

    case 'date':
      // Allow various date formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value) &&
          !/^[A-Z][a-z]+ \d{1,2},? \d{4}$/i.test(value)) {
        return 'Value must be a valid date';
      }
      break;

    case 'ratio':
      if (!/^\d*\.?\d+\s*[x×:]?\s*(\d*\.?\d+)?$/i.test(value)) {
        return 'Value must be a valid ratio (e.g., 4.5x, 3:1)';
      }
      break;

    case 'boolean':
      if (!/^(true|false|yes|no)$/i.test(value)) {
        return 'Value must be true/false or yes/no';
      }
      break;
  }

  return null;
}

/**
 * Validate value against a validation rule
 */
function validateRule(
  value: string,
  rule: ValidationRule,
  dataType: string
): string | null {
  switch (rule.type) {
    case 'required':
      if (!value || value.trim() === '') {
        return rule.message;
      }
      break;

    case 'min_value':
      if (typeof rule.value === 'number') {
        const numValue = parseNumericValue(value);
        if (numValue !== null && numValue < rule.value) {
          return rule.message;
        }
      }
      break;

    case 'max_value':
      if (typeof rule.value === 'number') {
        const numValue = parseNumericValue(value);
        if (numValue !== null && numValue > rule.value) {
          return rule.message;
        }
      }
      break;

    case 'pattern':
      if (typeof rule.value === 'string') {
        const regex = new RegExp(rule.value, 'i');
        if (!regex.test(value)) {
          return rule.message;
        }
      }
      break;

    case 'enum_values':
      if (Array.isArray(rule.value)) {
        const normalizedValue = value.toLowerCase().trim();
        const normalizedOptions = rule.value.map((v) =>
          String(v).toLowerCase().trim()
        );
        if (!normalizedOptions.includes(normalizedValue)) {
          return rule.message;
        }
      }
      break;

    case 'date_range':
      if (typeof rule.value === 'object' && rule.value !== null) {
        const dateValue = parseDate(value);
        const rangeValue = rule.value as { min?: string; max?: string };
        if (dateValue) {
          if (rangeValue.min && dateValue < parseDate(rangeValue.min)!) {
            return rule.message;
          }
          if (rangeValue.max && dateValue > parseDate(rangeValue.max)!) {
            return rule.message;
          }
        }
      }
      break;
  }

  return null;
}

/**
 * Check if a value is within the typical range
 */
function isValueTypical(
  value: string,
  typicalRange: TypicalValueRange,
  dataType: string
): boolean {
  // Check numeric ranges
  if (typicalRange.min !== undefined || typicalRange.max !== undefined) {
    const numValue = parseNumericValue(value);
    if (numValue !== null) {
      if (typicalRange.min !== undefined && numValue < typicalRange.min) {
        return false;
      }
      if (typicalRange.max !== undefined && numValue > typicalRange.max) {
        return false;
      }
    }
  }

  // Check common values for enums
  if (typicalRange.commonValues && typicalRange.commonValues.length > 0) {
    const normalizedValue = value.toLowerCase().trim();
    const normalizedCommon = typicalRange.commonValues.map((v) =>
      v.toLowerCase().trim()
    );
    // For common values, we just note it's unusual, not invalid
    return normalizedCommon.includes(normalizedValue);
  }

  return true;
}

/**
 * Check for anomalies in extracted value
 */
function checkForAnomaly(
  templateField: TemplateField,
  value: string
): FieldAnomaly | null {
  const typicalRange = templateField.typicalRange;
  if (!typicalRange) return null;

  const numValue = parseNumericValue(value);

  // Check for out of range
  if (numValue !== null) {
    if (typicalRange.min !== undefined && numValue < typicalRange.min) {
      const expectedInfo = `Typical minimum: ${typicalRange.min}${typicalRange.unit || ''}`;
      return {
        fieldKey: templateField.fieldKey,
        fieldLabel: templateField.label,
        value,
        anomalyType: 'out_of_range',
        severity: numValue < typicalRange.min * 0.5 ? 'warning' : 'info',
        description: `Value is below the typical minimum range`,
        expectedInfo,
      };
    }

    if (typicalRange.max !== undefined && numValue > typicalRange.max) {
      const expectedInfo = `Typical maximum: ${typicalRange.max}${typicalRange.unit || ''}`;
      return {
        fieldKey: templateField.fieldKey,
        fieldLabel: templateField.label,
        value,
        anomalyType: 'out_of_range',
        severity: numValue > typicalRange.max * 2 ? 'warning' : 'info',
        description: `Value exceeds the typical maximum range`,
        expectedInfo,
      };
    }
  }

  // Check for unusual enum values
  if (typicalRange.commonValues && typicalRange.commonValues.length > 0) {
    const normalizedValue = value.toLowerCase().trim();
    const normalizedCommon = typicalRange.commonValues.map((v) =>
      v.toLowerCase().trim()
    );
    if (!normalizedCommon.includes(normalizedValue)) {
      return {
        fieldKey: templateField.fieldKey,
        fieldLabel: templateField.label,
        value,
        anomalyType: 'unusual_value',
        severity: 'info',
        description: `Value "${value}" is not among the commonly seen values`,
        expectedInfo: `Common values: ${typicalRange.commonValues.join(', ')}`,
      };
    }
  }

  return null;
}

/**
 * Parse a numeric value from string, handling currency and percentage formats
 */
function parseNumericValue(value: string): number | null {
  // Remove currency symbols and commas
  let cleaned = value.replace(/[$€£¥,]/g, '').trim();

  // Handle percentage
  if (cleaned.endsWith('%')) {
    cleaned = cleaned.slice(0, -1);
  }

  // Handle basis points
  const bpsMatch = cleaned.match(/^([\d.]+)\s*(bps|basis points)$/i);
  if (bpsMatch) {
    return parseFloat(bpsMatch[1]) / 100;
  }

  // Handle millions/billions
  const millionMatch = cleaned.match(/^([\d.]+)\s*(m|million)$/i);
  if (millionMatch) {
    return parseFloat(millionMatch[1]) * 1000000;
  }

  const billionMatch = cleaned.match(/^([\d.]+)\s*(b|billion)$/i);
  if (billionMatch) {
    return parseFloat(billionMatch[1]) * 1000000000;
  }

  // Handle ratio format (e.g., "4.5x" or "4.5:1")
  const ratioMatch = cleaned.match(/^([\d.]+)\s*[x×]?$/i);
  if (ratioMatch) {
    return parseFloat(ratioMatch[1]);
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse a date from various formats
 */
function parseDate(value: string): Date | null {
  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value);
  }

  // Try MM/DD/YYYY or similar
  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const year = slashMatch[3].length === 2
      ? 2000 + parseInt(slashMatch[3])
      : parseInt(slashMatch[3]);
    return new Date(year, parseInt(slashMatch[1]) - 1, parseInt(slashMatch[2]));
  }

  // Try "Month DD, YYYY" format
  const parsed = Date.parse(value);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
}

/**
 * Normalize field name to match template field key format
 */
function normalizeFieldKey(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Get missing required fields from validation result
 */
export function getMissingRequiredFields(
  result: TemplateValidationResult,
  template: ExtractionTemplate
): TemplateField[] {
  const missingFieldKeys = result.fieldResults
    .filter((r) => !r.found && r.errors.length > 0)
    .map((r) => r.fieldKey);

  return template.fields.filter((f) => missingFieldKeys.includes(f.fieldKey));
}

/**
 * Get fields with validation errors
 */
export function getFieldsWithErrors(
  result: TemplateValidationResult
): FieldValidationResult[] {
  return result.fieldResults.filter((r) => r.found && !r.isValid);
}

/**
 * Get anomalies by severity
 */
export function getAnomaliesBySeverity(
  result: TemplateValidationResult,
  severity: 'info' | 'warning' | 'error'
): FieldAnomaly[] {
  return result.anomalies.filter((a) => a.severity === severity);
}
