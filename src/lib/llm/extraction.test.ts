/**
 * Extraction Module Tests
 *
 * Tests for the document extraction LLM functions.
 * Uses mocked Claude API responses to test:
 * - Prompt construction
 * - Response parsing
 * - Error handling
 * - Fallback behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as extraction from './extraction';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('extraction module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('extractFacilityData', () => {
    it('parses valid facility extraction response', async () => {
      const mockFacility = {
        facilityName: 'Apollo Credit Facility',
        facilityReference: 'ACF-2024-001',
        executionDate: '2024-01-15',
        effectiveDate: '2024-01-20',
        maturityDate: '2029-01-20',
        facilityType: 'term',
        currency: 'USD',
        totalCommitments: 500000000,
        interestRateType: 'floating',
        baseRate: 'SOFR',
        marginInitial: 3.25,
        governingLaw: 'New York',
        borrowers: [{ name: 'Apollo Holdings Inc', jurisdiction: 'Delaware', role: 'Borrower' }],
        lenders: [{ name: 'Big Bank Corp', commitmentAmount: 250000000, percentage: 50 }],
        agents: [{ name: 'Big Bank Corp', role: 'Administrative Agent' }],
        confidence: 0.95,
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockFacility);

      const result = await extraction.extractFacilityData('Sample loan agreement text...');

      expect(result).toEqual(mockFacility);
      expect(mockGenerateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('expert legal analyst'),
        expect.stringContaining('Sample loan agreement text'),
        { maxTokens: 4096 }
      );
    });

    it('truncates document text to 100k characters', async () => {
      const longText = 'x'.repeat(150000);
      mockGenerateStructuredOutput.mockResolvedValue({ facilityName: 'Test', confidence: 0.9 });

      await extraction.extractFacilityData(longText);

      const call = mockGenerateStructuredOutput.mock.calls[0];
      expect(call[1].length).toBeLessThanOrEqual(100100); // ~100k + prompt prefix
    });

    it('handles extraction with low confidence', async () => {
      const lowConfidenceResult = {
        facilityName: 'Unknown Facility',
        confidence: 0.3,
      };

      mockGenerateStructuredOutput.mockResolvedValue(lowConfidenceResult);

      const result = await extraction.extractFacilityData('Unclear document text');

      expect(result.confidence).toBe(0.3);
    });
  });

  describe('extractCovenants', () => {
    it('parses array of covenants', async () => {
      const mockCovenants = [
        {
          covenantType: 'leverage_ratio',
          covenantName: 'Maximum Total Leverage Ratio',
          numeratorDefinition: 'Consolidated Total Indebtedness',
          denominatorDefinition: 'Consolidated EBITDA',
          thresholdType: 'maximum',
          thresholdValue: 4.5,
          testingFrequency: 'quarterly',
          clauseReference: 'Section 7.1(a)',
          pageNumber: 45,
          rawText: 'The Borrower shall not permit the Total Leverage Ratio...',
          confidence: 0.92,
        },
        {
          covenantType: 'interest_coverage',
          covenantName: 'Minimum Interest Coverage Ratio',
          thresholdType: 'minimum',
          thresholdValue: 2.5,
          testingFrequency: 'quarterly',
          confidence: 0.88,
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockCovenants);

      const result = await extraction.extractCovenants('Covenant section text...');

      expect(result).toHaveLength(2);
      expect(result[0].covenantType).toBe('leverage_ratio');
      expect(result[1].covenantType).toBe('interest_coverage');
    });

    it('returns empty array when no covenants found', async () => {
      mockGenerateStructuredOutput.mockResolvedValue([]);

      const result = await extraction.extractCovenants('Document without covenants');

      expect(result).toEqual([]);
    });
  });

  describe('extractObligations', () => {
    it('parses reporting obligations', async () => {
      const mockObligations = [
        {
          obligationType: 'annual_financials',
          description: 'Annual audited financial statements',
          frequency: 'annual',
          deadlineDays: 120,
          recipientRole: 'Administrative Agent',
          clauseReference: 'Section 6.1(a)',
          confidence: 0.9,
        },
        {
          obligationType: 'compliance_certificate',
          description: 'Officers compliance certificate',
          frequency: 'quarterly',
          deadlineDays: 45,
          recipientRole: 'Administrative Agent',
          confidence: 0.85,
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockObligations);

      const result = await extraction.extractObligations('Reporting obligations text...');

      expect(result).toHaveLength(2);
      expect(result[0].obligationType).toBe('annual_financials');
      expect(result[0].deadlineDays).toBe(120);
    });
  });

  describe('extractEventsOfDefault', () => {
    it('parses events of default', async () => {
      const mockEvents = [
        {
          eventCategory: 'payment_default',
          description: 'Failure to pay principal when due',
          gracePeriodDays: 5,
          consequences: 'Acceleration of all amounts outstanding',
          clauseReference: 'Section 8.1(a)',
          confidence: 0.95,
        },
        {
          eventCategory: 'covenant_breach',
          description: 'Breach of financial covenants',
          gracePeriodDays: 30,
          cureRights: 'Equity cure permitted up to 3 times',
          confidence: 0.88,
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockEvents);

      const result = await extraction.extractEventsOfDefault('Events of default section...');

      expect(result).toHaveLength(2);
      expect(result[0].eventCategory).toBe('payment_default');
      expect(result[0].gracePeriodDays).toBe(5);
    });
  });

  describe('extractESGProvisions', () => {
    it('parses ESG provisions', async () => {
      const mockESG = [
        {
          provisionType: 'sustainability_linked_margin',
          kpiName: 'GHG Emissions Reduction',
          kpiDefinition: 'Scope 1 and 2 emissions in tCO2e',
          kpiBaseline: 50000,
          kpiTargets: [
            { date: '2025-12-31', targetValue: 45000, marginAdjustment: -0.05 },
            { date: '2026-12-31', targetValue: 40000, marginAdjustment: -0.10 },
          ],
          verificationRequired: true,
          clauseReference: 'Schedule 5',
          confidence: 0.91,
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockESG);

      const result = await extraction.extractESGProvisions('ESG provisions text...');

      expect(result).toHaveLength(1);
      expect(result[0].kpiName).toBe('GHG Emissions Reduction');
      expect(result[0].kpiTargets).toHaveLength(2);
    });

    it('returns empty array when no ESG provisions', async () => {
      mockGenerateStructuredOutput.mockResolvedValue([]);

      const result = await extraction.extractESGProvisions('Non-ESG loan document');

      expect(result).toEqual([]);
    });
  });

  describe('extractDefinedTerms', () => {
    it('parses defined terms', async () => {
      const mockTerms = [
        {
          term: 'EBITDA',
          definition: 'Earnings before interest, taxes, depreciation, and amortization, calculated on a consolidated basis...',
          clauseReference: 'Section 1.01',
          pageNumber: 5,
          referencesTerms: ['Consolidated Net Income', 'Interest Expense'],
        },
        {
          term: 'Material Adverse Effect',
          definition: 'A material adverse effect on the business, operations, property, condition (financial or otherwise)...',
          clauseReference: 'Section 1.01',
          referencesTerms: [],
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockTerms);

      const result = await extraction.extractDefinedTerms('Definitions section text...');

      expect(result).toHaveLength(2);
      expect(result[0].term).toBe('EBITDA');
      expect(result[0].referencesTerms).toContain('Consolidated Net Income');
    });
  });

  describe('runFullExtraction', () => {
    it('runs all extractions in parallel', async () => {
      const mockFacility = { facilityName: 'Test Facility', confidence: 0.9 };
      const mockCovenants = [{ covenantType: 'leverage_ratio', confidence: 0.85 }];
      const mockObligations = [{ obligationType: 'annual_financials', confidence: 0.88 }];
      const mockEvents = [{ eventCategory: 'payment_default', confidence: 0.9 }];
      const mockESG = [{ provisionType: 'green_use_of_proceeds', confidence: 0.82 }];
      const mockTerms = [{ term: 'EBITDA', definition: 'Earnings...' }];

      mockGenerateStructuredOutput
        .mockResolvedValueOnce(mockFacility)
        .mockResolvedValueOnce(mockCovenants)
        .mockResolvedValueOnce(mockObligations)
        .mockResolvedValueOnce(mockEvents)
        .mockResolvedValueOnce(mockESG)
        .mockResolvedValueOnce(mockTerms);

      const result = await extraction.runFullExtraction('Full document text...');

      expect(result.facility).toBeTruthy();
      expect(result.covenants).toHaveLength(1);
      expect(result.obligations).toHaveLength(1);
      expect(result.eventsOfDefault).toHaveLength(1);
      expect(result.esgProvisions).toHaveLength(1);
      expect(result.definedTerms).toHaveLength(1);
      expect(result.documentId).toBe(''); // Set by caller
    });

    it('calculates overall confidence from all extracted items', async () => {
      mockGenerateStructuredOutput
        .mockResolvedValueOnce({ facilityName: 'Test', confidence: 0.9 })
        .mockResolvedValueOnce([{ covenantType: 'test', confidence: 0.8 }])
        .mockResolvedValueOnce([{ obligationType: 'test', confidence: 0.7 }])
        .mockResolvedValueOnce([{ eventCategory: 'test', confidence: 0.85 }])
        .mockResolvedValueOnce([{ provisionType: 'test', confidence: 0.75 }])
        .mockResolvedValueOnce([{ term: 'test', definition: 'test' }]);

      const result = await extraction.runFullExtraction('Document text...');

      // Average of 0.9, 0.8, 0.7, 0.85, 0.75 = 0.8
      expect(result.overallConfidence).toBe(0.8);
    });

    it('handles partial failures gracefully', async () => {
      mockGenerateStructuredOutput
        .mockResolvedValueOnce({ facilityName: 'Test', confidence: 0.9 })
        .mockRejectedValueOnce(new Error('Covenant extraction failed'))
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Events extraction failed'))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await extraction.runFullExtraction('Document text...');

      expect(result.facility).toBeTruthy();
      expect(result.covenants).toEqual([]);
      expect(result.obligations).toEqual([]);
      expect(result.eventsOfDefault).toEqual([]);
    });

    it('returns null facility when extraction fails', async () => {
      mockGenerateStructuredOutput
        .mockRejectedValueOnce(new Error('Facility extraction failed'))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await extraction.runFullExtraction('Document text...');

      expect(result.facility).toBeNull();
      expect(result.overallConfidence).toBe(0);
    });
  });
});
