import { z } from 'zod';

// =============================================================================
// Date Validation Schemas and Utilities
// =============================================================================

/**
 * Error class for date validation failures with context about the source.
 */
export class DateValidationError extends Error {
  constructor(
    public readonly functionName: string,
    public readonly receivedValue: unknown,
    public readonly fieldHint?: string
  ) {
    const valueDisplay =
      receivedValue === undefined
        ? 'undefined'
        : receivedValue === null
          ? 'null'
          : typeof receivedValue === 'string' && receivedValue === ''
            ? 'empty string'
            : JSON.stringify(receivedValue);

    const hint = fieldHint ? ` - check ${fieldHint}` : '';
    super(`${functionName} received invalid date: ${valueDisplay}${hint}`);
    this.name = 'DateValidationError';
  }
}

/**
 * Zod schema for validating ISO date strings (e.g., '2024-12-15').
 * Accepts strings that can be parsed to valid dates.
 */
export const dateStringSchema = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: 'Invalid date string' }
);

/**
 * Zod schema for date input that can be either a Date object or string.
 */
export const dateInputSchema = z.union([z.date(), z.string()]).refine(
  (val) => {
    const date = val instanceof Date ? val : new Date(val);
    return !isNaN(date.getTime());
  },
  { message: 'Invalid date input' }
);

/**
 * Zod schema for optional/nullable date strings.
 */
export const optionalDateStringSchema = z
  .string()
  .nullable()
  .optional()
  .refine(
    (val) => {
      if (val === null || val === undefined || val === '') return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date string' }
  );

// =============================================================================
// Runtime Validation Functions
// =============================================================================

/**
 * Validates a date string and throws a descriptive error if invalid.
 *
 * @param dateStr - The date string to validate
 * @param functionName - The name of the calling function (for error context)
 * @param fieldHint - Optional hint about which field/property the date came from
 * @returns The validated date string
 * @throws DateValidationError if the date is invalid
 */
export function validateDateString(
  dateStr: unknown,
  functionName: string,
  fieldHint?: string
): string {
  // Check for undefined, null, or non-string values
  if (dateStr === undefined || dateStr === null) {
    throw new DateValidationError(functionName, dateStr, fieldHint);
  }

  if (typeof dateStr !== 'string') {
    throw new DateValidationError(functionName, dateStr, fieldHint);
  }

  if (dateStr.trim() === '') {
    throw new DateValidationError(functionName, dateStr, fieldHint);
  }

  // Check if the string can be parsed to a valid date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new DateValidationError(functionName, dateStr, fieldHint);
  }

  return dateStr;
}

/**
 * Validates a date input (Date object or string) and returns a Date.
 *
 * @param dateInput - The date input to validate (Date or string)
 * @param functionName - The name of the calling function (for error context)
 * @param fieldHint - Optional hint about which field/property the date came from
 * @returns A valid Date object
 * @throws DateValidationError if the date is invalid
 */
export function validateDateInput(
  dateInput: unknown,
  functionName: string,
  fieldHint?: string
): Date {
  // Check for undefined or null
  if (dateInput === undefined || dateInput === null) {
    throw new DateValidationError(functionName, dateInput, fieldHint);
  }

  // Handle Date objects
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      throw new DateValidationError(functionName, 'Invalid Date object', fieldHint);
    }
    return dateInput;
  }

  // Handle strings
  if (typeof dateInput === 'string') {
    if (dateInput.trim() === '') {
      throw new DateValidationError(functionName, dateInput, fieldHint);
    }

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      throw new DateValidationError(functionName, dateInput, fieldHint);
    }
    return date;
  }

  // Invalid type
  throw new DateValidationError(functionName, dateInput, fieldHint);
}

/**
 * Validates an optional/nullable date string.
 * Returns null for null/undefined/empty values, or the validated string.
 *
 * @param dateStr - The date string to validate (can be null/undefined)
 * @param functionName - The name of the calling function (for error context)
 * @param fieldHint - Optional hint about which field/property the date came from
 * @returns The validated date string or null
 * @throws DateValidationError if the date is non-empty but invalid
 */
export function validateOptionalDateString(
  dateStr: unknown,
  functionName: string,
  fieldHint?: string
): string | null {
  // Allow null, undefined, or empty strings
  if (dateStr === null || dateStr === undefined) {
    return null;
  }

  if (typeof dateStr !== 'string') {
    throw new DateValidationError(functionName, dateStr, fieldHint);
  }

  if (dateStr.trim() === '') {
    return null;
  }

  // Check if the non-empty string can be parsed to a valid date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new DateValidationError(functionName, dateStr, fieldHint);
  }

  return dateStr;
}

/**
 * Type guard to check if a value is a valid date string.
 */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Type guard to check if a value is a valid Date object.
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}
