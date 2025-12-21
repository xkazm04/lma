// =============================================================================
// Import History Management for Audit Trail
// =============================================================================

import type { ImportHistoryRecord, ValidatedCovenantTest } from './bulk-import-types';

// In-memory storage for demo purposes
// In production, this would be stored in Supabase
let importHistory: ImportHistoryRecord[] = [
  {
    id: 'hist-1',
    fileName: 'Q3_2024_covenant_tests.xlsx',
    uploadedAt: '2024-09-15T14:30:00Z',
    importedAt: '2024-09-15T14:35:00Z',
    uploadedBy: 'john.smith@example.com',
    totalRecords: 24,
    successfulRecords: 24,
    failedRecords: 0,
    status: 'completed',
    summary: {
      facilitiesAffected: ['ABC Holdings - Term Loan A', 'XYZ Corp Revolver', 'Neptune Holdings TL'],
      covenantsUpdated: 8,
      testsRecorded: 24,
    },
  },
  {
    id: 'hist-2',
    fileName: 'Q2_2024_covenant_results.csv',
    uploadedAt: '2024-06-20T10:15:00Z',
    importedAt: '2024-06-20T10:18:00Z',
    uploadedBy: 'jane.doe@example.com',
    totalRecords: 18,
    successfulRecords: 16,
    failedRecords: 2,
    status: 'partial',
    summary: {
      facilitiesAffected: ['ABC Holdings - Term Loan A', 'Delta Manufacturing TL'],
      covenantsUpdated: 6,
      testsRecorded: 16,
    },
  },
];

/**
 * Get all import history records.
 */
export function getImportHistory(): ImportHistoryRecord[] {
  return [...importHistory].sort(
    (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
  );
}

/**
 * Get a single import history record by ID.
 */
export function getImportHistoryById(id: string): ImportHistoryRecord | undefined {
  return importHistory.find((record) => record.id === id);
}

/**
 * Add a new import history record.
 */
export function addImportHistory(
  fileName: string,
  tests: ValidatedCovenantTest[],
  uploadedBy: string
): ImportHistoryRecord {
  const validTests = tests.filter((t) => t.validation.isValid);
  const invalidTests = tests.filter((t) => !t.validation.isValid);

  const facilitiesAffected = [
    ...new Set(
      validTests
        .filter((t) => t.validation.matchedCovenant)
        .map((t) => t.validation.matchedCovenant!.facilityName)
    ),
  ];

  const covenantsUpdated = new Set(
    validTests
      .filter((t) => t.validation.matchedCovenant)
      .map((t) => t.validation.matchedCovenant!.id)
  ).size;

  const now = new Date().toISOString();

  const record: ImportHistoryRecord = {
    id: `hist-${Date.now()}`,
    fileName,
    uploadedAt: now,
    importedAt: now,
    uploadedBy,
    totalRecords: tests.length,
    successfulRecords: validTests.length,
    failedRecords: invalidTests.length,
    status: invalidTests.length === 0 ? 'completed' : validTests.length === 0 ? 'failed' : 'partial',
    summary: {
      facilitiesAffected,
      covenantsUpdated,
      testsRecorded: validTests.length,
    },
  };

  importHistory = [record, ...importHistory];

  return record;
}

/**
 * Format date for display.
 */
export function formatImportDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
