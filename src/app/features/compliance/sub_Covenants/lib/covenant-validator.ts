// =============================================================================
// Covenant Test Validator for Bulk Import
// =============================================================================

import type { Covenant } from '../../lib/types';
import type {
  ParsedCovenantTest,
  ValidatedCovenantTest,
  ValidationResult,
} from './bulk-import-types';

/**
 * Validate parsed covenant tests against existing covenants.
 */
export function validateCovenantTests(
  parsedTests: ParsedCovenantTest[],
  existingCovenants: Covenant[]
): ValidatedCovenantTest[] {
  return parsedTests.map((test) => {
    const validation = validateSingleTest(test, existingCovenants);
    return {
      ...test,
      validation,
    };
  });
}

/**
 * Validate a single covenant test.
 */
function validateSingleTest(
  test: ParsedCovenantTest,
  existingCovenants: Covenant[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!test.testDate) {
    errors.push('Test date is required');
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(test.testDate)) {
      errors.push('Invalid date format. Expected YYYY-MM-DD');
    } else {
      const parsedDate = new Date(test.testDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push('Invalid date value');
      } else if (parsedDate > new Date()) {
        warnings.push('Test date is in the future');
      }
    }
  }

  if (isNaN(test.calculatedValue)) {
    errors.push('Calculated value is required and must be a number');
  }

  // Try to match covenant
  let matchedCovenant: ValidationResult['matchedCovenant'];

  if (test.covenantId) {
    const covenant = existingCovenants.find((c) => c.id === test.covenantId);
    if (covenant) {
      matchedCovenant = {
        id: covenant.id,
        name: covenant.name,
        facilityId: covenant.facility_id,
        facilityName: covenant.facility_name,
        thresholdType: covenant.threshold_type,
        currentThreshold: covenant.current_threshold,
        covenantType: covenant.covenant_type,
      };
    } else {
      errors.push(`Covenant ID "${test.covenantId}" not found`);
    }
  } else if (test.covenantName) {
    // Try to match by name and facility
    const candidates = existingCovenants.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(test.covenantName!.toLowerCase()) ||
        test.covenantName!.toLowerCase().includes(c.name.toLowerCase());

      if (test.facilityName) {
        const facilityMatch = c.facility_name.toLowerCase().includes(test.facilityName.toLowerCase()) ||
          test.facilityName.toLowerCase().includes(c.facility_name.toLowerCase());
        return nameMatch && facilityMatch;
      }

      if (test.facilityId) {
        return nameMatch && c.facility_id === test.facilityId;
      }

      return nameMatch;
    });

    if (candidates.length === 1) {
      const covenant = candidates[0];
      matchedCovenant = {
        id: covenant.id,
        name: covenant.name,
        facilityId: covenant.facility_id,
        facilityName: covenant.facility_name,
        thresholdType: covenant.threshold_type,
        currentThreshold: covenant.current_threshold,
        covenantType: covenant.covenant_type,
      };
    } else if (candidates.length > 1) {
      warnings.push(
        `Multiple covenants match "${test.covenantName}". Please specify facility name or ID.`
      );
      // Use the first match but warn
      const covenant = candidates[0];
      matchedCovenant = {
        id: covenant.id,
        name: covenant.name,
        facilityId: covenant.facility_id,
        facilityName: covenant.facility_name,
        thresholdType: covenant.threshold_type,
        currentThreshold: covenant.current_threshold,
        covenantType: covenant.covenant_type,
      };
    } else {
      errors.push(`No covenant found matching "${test.covenantName}"`);
    }
  } else {
    errors.push('Either Covenant ID or Covenant Name is required');
  }

  // Calculate predicted result and headroom if we have a matched covenant
  let predictedResult: 'pass' | 'fail' | undefined;
  let calculatedHeadroom: number | undefined;

  if (matchedCovenant && !isNaN(test.calculatedValue)) {
    const { thresholdType, currentThreshold } = matchedCovenant;

    if (thresholdType === 'maximum') {
      predictedResult = test.calculatedValue <= currentThreshold ? 'pass' : 'fail';
      calculatedHeadroom = ((currentThreshold - test.calculatedValue) / currentThreshold) * 100;
    } else {
      predictedResult = test.calculatedValue >= currentThreshold ? 'pass' : 'fail';
      calculatedHeadroom = ((test.calculatedValue - currentThreshold) / currentThreshold) * 100;
    }

    // Check if provided test result matches calculated result
    if (test.testResult && test.testResult !== predictedResult) {
      warnings.push(
        `Provided result "${test.testResult}" differs from calculated result "${predictedResult}"`
      );
    }

    // Warn if headroom is low
    if (predictedResult === 'pass' && calculatedHeadroom < 10) {
      warnings.push('Low headroom detected (< 10%)');
    }
  }

  return {
    rowIndex: test.rowIndex,
    isValid: errors.length === 0,
    errors,
    warnings,
    matchedCovenant,
    predictedResult,
    calculatedHeadroom,
  };
}

/**
 * Get import summary statistics.
 */
export function getImportSummary(validatedTests: ValidatedCovenantTest[]): {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  passingTests: number;
  failingTests: number;
  facilitiesAffected: string[];
  covenantsAffected: string[];
} {
  const valid = validatedTests.filter((t) => t.validation.isValid).length;
  const warnings = validatedTests.filter(
    (t) => t.validation.isValid && t.validation.warnings.length > 0
  ).length;
  const passingTests = validatedTests.filter(
    (t) => t.validation.isValid && t.validation.predictedResult === 'pass'
  ).length;
  const failingTests = validatedTests.filter(
    (t) => t.validation.isValid && t.validation.predictedResult === 'fail'
  ).length;

  const facilitiesAffected = [
    ...new Set(
      validatedTests
        .filter((t) => t.validation.matchedCovenant)
        .map((t) => t.validation.matchedCovenant!.facilityName)
    ),
  ];

  const covenantsAffected = [
    ...new Set(
      validatedTests
        .filter((t) => t.validation.matchedCovenant)
        .map((t) => t.validation.matchedCovenant!.name)
    ),
  ];

  return {
    total: validatedTests.length,
    valid,
    invalid: validatedTests.length - valid,
    warnings,
    passingTests,
    failingTests,
    facilitiesAffected,
    covenantsAffected,
  };
}
