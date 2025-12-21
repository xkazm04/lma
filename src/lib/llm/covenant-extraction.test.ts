/**
 * Covenant Extraction Module Tests
 *
 * Tests for the covenant extraction LLM functions for compliance module integration.
 * Uses mocked Claude API responses to test:
 * - Covenant extraction from documents
 * - Threshold schedule parsing
 * - Validation functions
 * - Transformation to compliance format
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractCovenantsForCompliance,
  getCovenantTypeLabel,
  formatThresholdValue,
  getTestFrequencyLabel,
  validateExtractedCovenant,
  transformToComplianceCovenant,
  type ExtractedCovenantForCompliance,
} from './covenant-extraction';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('covenant-extraction module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('extractCovenantsForCompliance', () => {
    it('extracts multiple covenants from document', async () => {
      const mockResponse = {
        facilityName: 'Apollo Credit Facility',
        borrowerName: 'Apollo Holdings Inc.',
        documentType: 'credit_agreement',
        extractedCovenants: [
          {
            covenantType: 'leverage_ratio',
            covenantName: 'Maximum Total Leverage Ratio',
            thresholdType: 'maximum',
            thresholdValue: 4.5,
            testFrequency: 'quarterly',
            calculationMethodology: 'Total Debt to Consolidated EBITDA for trailing four quarters',
            numeratorDefinition: 'Consolidated Total Indebtedness',
            denominatorDefinition: 'Consolidated EBITDA for the four fiscal quarter period',
            clauseReference: 'Section 7.1(a)',
            pageNumber: 45,
            rawText: 'The Borrower shall not permit the Total Leverage Ratio to exceed 4.50 to 1.00',
            confidence: 0.95,
            suggestedThresholdSchedule: [
              { effectiveFrom: '2024-01-15', thresholdValue: 4.5 },
              { effectiveFrom: '2025-01-15', thresholdValue: 4.25 },
            ],
          },
          {
            covenantType: 'interest_coverage',
            covenantName: 'Minimum Interest Coverage Ratio',
            thresholdType: 'minimum',
            thresholdValue: 2.5,
            testFrequency: 'quarterly',
            calculationMethodology: 'Consolidated EBITDA to Interest Expense',
            numeratorDefinition: 'Consolidated EBITDA',
            denominatorDefinition: 'Consolidated Interest Expense',
            clauseReference: 'Section 7.1(b)',
            pageNumber: 46,
            rawText: 'The Borrower shall maintain an Interest Coverage Ratio of at least 2.50 to 1.00',
            confidence: 0.92,
          },
        ],
        warnings: [],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockResponse);

      const result = await extractCovenantsForCompliance(
        'Credit agreement text...',
        'doc-123'
      );

      expect(result.documentId).toBe('doc-123');
      expect(result.extractedCovenants).toHaveLength(2);
      expect(result.facilityName).toBe('Apollo Credit Facility');
      expect(result.overallConfidence).toBeCloseTo(0.935, 2);
    });

    it('handles documents with no covenants', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        facilityName: 'Simple Agreement',
        borrowerName: 'Simple Corp',
        documentType: 'promissory_note',
        extractedCovenants: [],
        warnings: ['No financial covenants found in this document type'],
      });

      const result = await extractCovenantsForCompliance(
        'Simple promissory note text...',
        'doc-456'
      );

      expect(result.extractedCovenants).toHaveLength(0);
      expect(result.warnings).toContain('No financial covenants found in this document type');
      expect(result.overallConfidence).toBe(0);
    });

    it('truncates long document text', async () => {
      const longText = 'x'.repeat(150000);

      mockGenerateStructuredOutput.mockResolvedValue({
        facilityName: 'Test',
        borrowerName: 'Test',
        documentType: 'credit_agreement',
        extractedCovenants: [],
        warnings: [],
      });

      await extractCovenantsForCompliance(longText, 'doc-789');

      const call = mockGenerateStructuredOutput.mock.calls[0];
      expect(call[1].length).toBeLessThanOrEqual(100100);
    });

    it('extracts step-down schedules', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        facilityName: 'Test Facility',
        borrowerName: 'Test Corp',
        documentType: 'credit_agreement',
        extractedCovenants: [
          {
            covenantType: 'leverage_ratio',
            covenantName: 'Maximum Total Leverage',
            thresholdType: 'maximum',
            thresholdValue: 5.0,
            testFrequency: 'quarterly',
            calculationMethodology: 'Standard calculation',
            numeratorDefinition: 'Total Debt',
            denominatorDefinition: 'EBITDA',
            clauseReference: 'Section 7.1',
            pageNumber: 50,
            rawText: 'Leverage covenant text...',
            confidence: 0.9,
            suggestedThresholdSchedule: [
              { effectiveFrom: '2024-01-01', thresholdValue: 5.0 },
              { effectiveFrom: '2024-06-30', thresholdValue: 4.75 },
              { effectiveFrom: '2024-12-31', thresholdValue: 4.5 },
              { effectiveFrom: '2025-06-30', thresholdValue: 4.25 },
            ],
          },
        ],
        warnings: [],
      });

      const result = await extractCovenantsForCompliance('Document text...', 'doc-1');

      expect(result.extractedCovenants[0].suggestedThresholdSchedule).toHaveLength(4);
    });
  });

  describe('getCovenantTypeLabel', () => {
    it('returns correct labels for known types', () => {
      expect(getCovenantTypeLabel('leverage_ratio')).toBe('Leverage Ratio');
      expect(getCovenantTypeLabel('interest_coverage')).toBe('Interest Coverage Ratio');
      expect(getCovenantTypeLabel('fixed_charge_coverage')).toBe('Fixed Charge Coverage Ratio (FCCR)');
      expect(getCovenantTypeLabel('debt_service_coverage')).toBe('Debt Service Coverage Ratio (DSCR)');
      expect(getCovenantTypeLabel('minimum_liquidity')).toBe('Minimum Liquidity');
      expect(getCovenantTypeLabel('capex')).toBe('Capital Expenditure Limit');
      expect(getCovenantTypeLabel('net_worth')).toBe('Net Worth / Tangible Net Worth');
    });

    it('returns input for unknown types', () => {
      expect(getCovenantTypeLabel('unknown_type')).toBe('unknown_type');
      expect(getCovenantTypeLabel('custom_covenant')).toBe('custom_covenant');
    });
  });

  describe('formatThresholdValue', () => {
    it('formats ratio covenants with x suffix', () => {
      expect(formatThresholdValue(4.5, 'leverage_ratio')).toBe('4.50x');
      expect(formatThresholdValue(2.5, 'interest_coverage')).toBe('2.50x');
      expect(formatThresholdValue(1.1, 'fixed_charge_coverage')).toBe('1.10x');
    });

    it('formats currency covenants with dollar formatting', () => {
      // Uses compact notation with maximumFractionDigits: 1, produces $50.0M
      expect(formatThresholdValue(50000000, 'minimum_liquidity')).toMatch(/\$50/);
      expect(formatThresholdValue(25000000, 'capex')).toMatch(/\$25/);
      expect(formatThresholdValue(100000000, 'net_worth')).toMatch(/\$100/);
    });
  });

  describe('getTestFrequencyLabel', () => {
    it('returns correct labels for frequencies', () => {
      expect(getTestFrequencyLabel('monthly')).toBe('Monthly');
      expect(getTestFrequencyLabel('quarterly')).toBe('Quarterly');
      expect(getTestFrequencyLabel('annually')).toBe('Annually');
    });

    it('returns input for unknown frequencies', () => {
      expect(getTestFrequencyLabel('semi_annually')).toBe('semi_annually');
    });
  });

  describe('validateExtractedCovenant', () => {
    const validCovenant: ExtractedCovenantForCompliance = {
      covenantType: 'leverage_ratio',
      covenantName: 'Maximum Leverage Ratio',
      thresholdType: 'maximum',
      thresholdValue: 4.5,
      testFrequency: 'quarterly',
      calculationMethodology: 'Standard calculation',
      numeratorDefinition: 'Total Debt',
      denominatorDefinition: 'EBITDA',
      clauseReference: 'Section 7.1',
      pageNumber: 45,
      rawText: 'Covenant text...',
      confidence: 0.9,
    };

    it('validates a correct covenant', () => {
      const result = validateExtractedCovenant(validCovenant);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects covenant without name', () => {
      const invalid = { ...validCovenant, covenantName: '' };
      const result = validateExtractedCovenant(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Covenant name is required');
    });

    it('rejects covenant without threshold value', () => {
      const invalid = { ...validCovenant, thresholdValue: undefined as unknown as number };
      const result = validateExtractedCovenant(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Threshold value is required');
    });

    it('rejects invalid threshold type', () => {
      const invalid = { ...validCovenant, thresholdType: 'invalid' as 'maximum' | 'minimum' };
      const result = validateExtractedCovenant(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid threshold type');
    });

    it('rejects invalid test frequency', () => {
      const invalid = { ...validCovenant, testFrequency: 'weekly' as 'monthly' | 'quarterly' | 'annually' };
      const result = validateExtractedCovenant(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid test frequency');
    });

    it('rejects invalid confidence score', () => {
      const invalid = { ...validCovenant, confidence: 1.5 };
      const result = validateExtractedCovenant(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Confidence must be between 0 and 1');
    });
  });

  describe('transformToComplianceCovenant', () => {
    const extractedCovenant: ExtractedCovenantForCompliance = {
      covenantType: 'leverage_ratio',
      covenantName: 'Maximum Total Leverage Ratio',
      thresholdType: 'maximum',
      thresholdValue: 4.5,
      testFrequency: 'quarterly',
      calculationMethodology: 'Total Debt divided by trailing 4-quarter EBITDA',
      numeratorDefinition: 'Consolidated Total Indebtedness',
      denominatorDefinition: 'Consolidated EBITDA',
      clauseReference: 'Section 7.1(a)',
      pageNumber: 45,
      rawText: 'The Borrower shall not permit...',
      confidence: 0.95,
      suggestedThresholdSchedule: [
        { effectiveFrom: '2024-01-15', thresholdValue: 4.5 },
        { effectiveFrom: '2025-01-15', thresholdValue: 4.25 },
      ],
    };

    it('transforms to compliance module format', () => {
      const result = transformToComplianceCovenant(extractedCovenant, 'facility-123');

      expect(result.facility_id).toBe('facility-123');
      expect(result.covenant_type).toBe('leverage_ratio');
      expect(result.name).toBe('Maximum Total Leverage Ratio');
      expect(result.threshold_type).toBe('maximum');
      expect(result.testing_frequency).toBe('quarterly');
      expect(result.is_active).toBe(true);
    });

    it('includes description with calculation methodology', () => {
      const result = transformToComplianceCovenant(extractedCovenant, 'facility-123');

      expect(result.description).toContain('Total Debt divided by trailing 4-quarter EBITDA');
      expect(result.description).toContain('Numerator: Consolidated Total Indebtedness');
      expect(result.description).toContain('Denominator: Consolidated EBITDA');
      expect(result.description).toContain('Section 7.1(a)');
    });

    it('includes threshold schedule when provided', () => {
      const result = transformToComplianceCovenant(extractedCovenant, 'facility-123');

      expect(result.threshold_schedule).toHaveLength(2);
      expect(result.threshold_schedule![0].threshold_value).toBe(4.5);
      expect(result.threshold_schedule![1].threshold_value).toBe(4.25);
    });

    it('creates default schedule when none provided', () => {
      const covenantWithoutSchedule = { ...extractedCovenant, suggestedThresholdSchedule: undefined };
      const result = transformToComplianceCovenant(covenantWithoutSchedule, 'facility-123');

      expect(result.threshold_schedule).toHaveLength(1);
      expect(result.threshold_schedule![0].threshold_value).toBe(4.5);
    });

    it('sets correct defaults', () => {
      const result = transformToComplianceCovenant(extractedCovenant, 'facility-123');

      expect(result.testing_basis).toBe('trailing_four_quarters');
      expect(result.has_equity_cure).toBe(false);
      expect(result.is_active).toBe(true);
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('API timeout'));

      await expect(
        extractCovenantsForCompliance('Document text...', 'doc-1')
      ).rejects.toThrow('API timeout');
    });
  });
});
