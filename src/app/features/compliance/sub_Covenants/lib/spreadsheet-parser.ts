// =============================================================================
// Spreadsheet Parser for Covenant Test Bulk Import
// =============================================================================

import * as XLSX from 'xlsx';
import type { RawImportRow, ColumnMapping, ParsedCovenantTest } from './bulk-import-types';

/**
 * Parses Excel/CSV file and extracts rows.
 */
export function parseSpreadsheet(file: File): Promise<{
  headers: string[];
  rows: RawImportRow[];
  sheetNames: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetNames = workbook.SheetNames;
        const firstSheet = workbook.Sheets[sheetNames[0]];

        // Get headers from first row
        const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');
        const headers: string[] = [];

        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
          const cell = firstSheet[cellAddress];
          headers.push(cell ? String(cell.v) : `Column ${col + 1}`);
        }

        // Parse rows (skip header)
        const rows: RawImportRow[] = [];
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          const rowData: Record<string, string | number | null> = {};
          let hasData = false;

          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = firstSheet[cellAddress];
            const header = headers[col - range.s.c];

            if (cell) {
              hasData = true;
              if (cell.t === 'd' && cell.v instanceof Date) {
                rowData[header] = cell.v.toISOString().split('T')[0];
              } else if (cell.t === 'n') {
                rowData[header] = cell.v;
              } else {
                rowData[header] = String(cell.v);
              }
            } else {
              rowData[header] = null;
            }
          }

          // Only include rows with some data
          if (hasData) {
            rows.push({
              rowIndex: row,
              data: rowData,
            });
          }
        }

        resolve({ headers, rows, sheetNames });
      } catch (error) {
        reject(new Error(`Failed to parse spreadsheet: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Auto-detect column mappings based on header names.
 */
export function autoDetectMappings(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    covenantId: null,
    facilityId: null,
    facilityName: null,
    covenantName: null,
    covenantType: null,
    testDate: null,
    calculatedValue: null,
    testResult: null,
    notes: null,
  };

  const normalizeHeader = (h: string) => h.toLowerCase().replace(/[_\s-]/g, '');

  for (const header of headers) {
    const normalized = normalizeHeader(header);

    if (normalized.includes('covenantid') || normalized === 'cid') {
      mapping.covenantId = header;
    } else if (normalized.includes('facilityid') || normalized === 'fid') {
      mapping.facilityId = header;
    } else if (normalized.includes('facilityname') || normalized === 'facility') {
      mapping.facilityName = header;
    } else if (normalized.includes('covenantname') || normalized === 'covenant') {
      mapping.covenantName = header;
    } else if (normalized.includes('covenanttype') || normalized === 'type') {
      mapping.covenantType = header;
    } else if (
      normalized.includes('testdate') ||
      normalized.includes('date') ||
      normalized.includes('period')
    ) {
      mapping.testDate = header;
    } else if (
      normalized.includes('value') ||
      normalized.includes('ratio') ||
      normalized.includes('result') ||
      normalized.includes('calculated') ||
      normalized.includes('actual')
    ) {
      if (!mapping.calculatedValue) {
        mapping.calculatedValue = header;
      }
    } else if (normalized.includes('passfail') || normalized.includes('outcome')) {
      mapping.testResult = header;
    } else if (normalized.includes('note') || normalized.includes('comment')) {
      mapping.notes = header;
    }
  }

  return mapping;
}

/**
 * Apply column mapping to raw rows to create parsed tests.
 */
export function applyMapping(
  rows: RawImportRow[],
  mapping: ColumnMapping
): ParsedCovenantTest[] {
  return rows.map((row) => {
    const getValue = (key: keyof ColumnMapping): string | number | null => {
      const column = mapping[key];
      return column ? row.data[column] : null;
    };

    const parseDate = (value: string | number | null): string => {
      if (!value) return '';
      if (typeof value === 'number') {
        // Excel date serial number
        const date = XLSX.SSF.parse_date_code(value);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
      // Try to parse string date
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      return String(value);
    };

    const parseNumber = (value: string | number | null): number => {
      if (value === null || value === '') return NaN;
      if (typeof value === 'number') return value;
      const cleaned = String(value).replace(/[,%$]/g, '').trim();
      return parseFloat(cleaned);
    };

    const parseTestResult = (value: string | number | null): 'pass' | 'fail' | undefined => {
      if (!value) return undefined;
      const str = String(value).toLowerCase().trim();
      if (str === 'pass' || str === 'passed' || str === 'yes' || str === '1' || str === 'true') {
        return 'pass';
      }
      if (str === 'fail' || str === 'failed' || str === 'no' || str === '0' || str === 'false') {
        return 'fail';
      }
      return undefined;
    };

    return {
      rowIndex: row.rowIndex,
      covenantId: getValue('covenantId') ? String(getValue('covenantId')) : undefined,
      facilityId: getValue('facilityId') ? String(getValue('facilityId')) : undefined,
      facilityName: getValue('facilityName') ? String(getValue('facilityName')) : undefined,
      covenantName: getValue('covenantName') ? String(getValue('covenantName')) : undefined,
      covenantType: getValue('covenantType') ? String(getValue('covenantType')) : undefined,
      testDate: parseDate(getValue('testDate')),
      calculatedValue: parseNumber(getValue('calculatedValue')),
      testResult: parseTestResult(getValue('testResult')),
      notes: getValue('notes') ? String(getValue('notes')) : undefined,
      raw: row.data,
    };
  });
}

/**
 * Export sample template for covenant test import.
 */
export function generateSampleTemplate(): Blob {
  const sampleData = [
    {
      'Facility Name': 'ABC Holdings - Term Loan A',
      'Covenant Name': 'Leverage Ratio',
      'Covenant Type': 'leverage_ratio',
      'Test Date': '2024-12-31',
      'Calculated Value': 3.2,
      'Test Result': 'Pass',
      'Notes': 'Q4 2024 test',
    },
    {
      'Facility Name': 'XYZ Corp Revolver',
      'Covenant Name': 'Interest Coverage',
      'Covenant Type': 'interest_coverage',
      'Test Date': '2024-12-31',
      'Calculated Value': 4.5,
      'Test Result': 'Pass',
      'Notes': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Covenant Tests');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Facility Name
    { wch: 20 }, // Covenant Name
    { wch: 20 }, // Covenant Type
    { wch: 12 }, // Test Date
    { wch: 16 }, // Calculated Value
    { wch: 12 }, // Test Result
    { wch: 30 }, // Notes
  ];

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
