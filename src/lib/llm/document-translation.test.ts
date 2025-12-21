/**
 * Document Translation Module Tests
 *
 * Tests for the structured data to legal clause translation LLM functions.
 * Uses mocked Claude API responses to test:
 * - Covenant translation
 * - Obligation translation
 * - Facility term translation
 * - Batch translation
 * - Precedent style analysis
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  translateCovenant,
  translateObligation,
  translateFacilityTerm,
  translateStructuredData,
  translateBatch,
  analyzePrecedentStyle,
  clauseToMarkdown,
  batchToDocument,
  type TranslatedClause,
  type TranslationBatchResponse,
} from './document-translation';
import type { ExtractedCovenant, ExtractedObligation } from '@/types';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('document-translation module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('translateCovenant', () => {
    const mockCovenant: ExtractedCovenant = {
      covenantType: 'leverage_ratio',
      covenantName: 'Maximum Total Leverage Ratio',
      numeratorDefinition: 'Consolidated Total Indebtedness',
      denominatorDefinition: 'Consolidated EBITDA',
      thresholdType: 'maximum',
      thresholdValue: 4.5,
      testingFrequency: 'quarterly',
      clauseReference: 'Section 7.1(a)',
      pageNumber: 45,
      rawText: 'The Borrower shall not permit...',
      confidence: 0.95,
    };

    it('translates covenant to legal clause text', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: '(a) Maximum Total Leverage Ratio. The Borrower shall not permit the Total Leverage Ratio as of the last day of any fiscal quarter to exceed 4.50 to 1.00.',
        suggestedSection: 'Section 7.01(a)',
        clauseTitle: 'Maximum Total Leverage Ratio',
        category: 'Financial Covenants',
        confidence: 0.92,
        warnings: [],
        alternatives: ['Alternative phrasing...'],
      });

      const result = await translateCovenant(mockCovenant);

      expect(result.clauseText).toContain('4.50 to 1.00');
      expect(result.clauseTitle).toBe('Maximum Total Leverage Ratio');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('includes document context in translation', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: 'Apollo Holdings shall not permit...',
        suggestedSection: 'Section 7.01(a)',
        clauseTitle: 'Leverage Ratio',
        category: 'Financial Covenants',
        confidence: 0.9,
      });

      await translateCovenant(mockCovenant, {
        borrowerName: 'Apollo Holdings',
        facilityName: 'Apollo Credit Facility',
        governingLaw: 'New York',
      });

      const prompt = mockGenerateStructuredOutput.mock.calls[0][1];
      expect(prompt).toContain('Apollo Holdings');
      expect(prompt).toContain('New York');
    });

    it('uses precedent clauses for style matching', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: 'Translated text matching precedent style',
        suggestedSection: 'Section 7.01',
        clauseTitle: 'Leverage Covenant',
        category: 'Financial Covenants',
        confidence: 0.88,
      });

      await translateCovenant(mockCovenant, undefined, [
        'Precedent clause 1 with specific style...',
        'Precedent clause 2 with similar structure...',
      ]);

      const prompt = mockGenerateStructuredOutput.mock.calls[0][1];
      expect(prompt).toContain('PRECEDENT CLAUSES');
      expect(prompt).toContain('Precedent clause 1');
    });

    it('generates unique IDs for translated clauses', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: 'Test clause',
        suggestedSection: 'Section 1',
        clauseTitle: 'Test',
        category: 'Test',
        confidence: 0.9,
      });

      const result1 = await translateCovenant(mockCovenant);
      const result2 = await translateCovenant(mockCovenant);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toContain('covenant-');
    });
  });

  describe('translateObligation', () => {
    const mockObligation: ExtractedObligation = {
      obligationType: 'annual_financials',
      description: 'Annual audited financial statements',
      frequency: 'annual',
      deadlineDays: 120,
      recipientRole: 'Administrative Agent',
      clauseReference: 'Section 6.1(a)',
      pageNumber: 35,
      rawText: 'The Borrower shall deliver...',
      confidence: 0.9,
    };

    it('translates obligation to legal clause text', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: '(a) Annual Financial Statements. The Borrower shall deliver to the Administrative Agent, within 120 days after the end of each fiscal year, audited consolidated financial statements...',
        suggestedSection: 'Section 6.01(a)',
        clauseTitle: 'Annual Financial Statements',
        category: 'Reporting Covenants',
        confidence: 0.9,
      });

      const result = await translateObligation(mockObligation);

      expect(result.clauseText).toContain('120 days');
      expect(result.clauseTitle).toBe('Annual Financial Statements');
      expect(result.category).toBe('Reporting Covenants');
    });

    it('generates obligation-prefixed IDs', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: 'Test obligation',
        suggestedSection: 'Section 6.01',
        clauseTitle: 'Test',
        category: 'Reporting',
        confidence: 0.9,
      });

      const result = await translateObligation(mockObligation);

      expect(result.id).toContain('obligation-');
    });
  });

  describe('translateFacilityTerm', () => {
    it('translates facility term to definition', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: '"Total Commitments" means Five Hundred Million Dollars ($500,000,000).',
        suggestedSection: 'Article I Definitions',
        clauseTitle: 'Total Commitments',
        category: 'Definitions',
        confidence: 0.95,
      });

      const result = await translateFacilityTerm(
        'Total Commitments',
        500000000,
        'currency_amount'
      );

      expect(result.clauseText).toContain('$500,000,000');
      expect(result.category).toBe('Definitions');
      expect(result.id).toContain('term-');
    });

    it('handles date terms', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: '"Maturity Date" means January 15, 2029.',
        suggestedSection: 'Article I Definitions',
        clauseTitle: 'Maturity Date',
        category: 'Definitions',
        confidence: 0.92,
      });

      const result = await translateFacilityTerm(
        'Maturity Date',
        '2029-01-15',
        'date'
      );

      expect(result.clauseText).toContain('January 15, 2029');
    });
  });

  describe('translateStructuredData', () => {
    it('translates generic structured data', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: 'Generic translated clause...',
        suggestedSection: 'Section 5.01',
        clauseTitle: 'Affirmative Covenant',
        category: 'Affirmative Covenants',
        confidence: 0.85,
      });

      const result = await translateStructuredData({
        clauseType: 'general',
        structuredData: { requirement: 'Maintain insurance coverage' },
      });

      expect(result.id).toContain('clause-');
      expect(result.clauseText).toBeTruthy();
    });

    it('includes precedent match information', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        clauseText: 'Matched clause text...',
        suggestedSection: 'Section 7.01',
        clauseTitle: 'Test Covenant',
        category: 'Financial Covenants',
        confidence: 0.88,
        precedentMatch: {
          sourceDocument: 'Apollo Credit Agreement',
          matchPercentage: 0.85,
          adaptations: ['Changed threshold', 'Updated borrower name'],
        },
      });

      const result = await translateStructuredData({
        clauseType: 'covenant',
        structuredData: { type: 'leverage_ratio' },
        precedentClauses: ['Precedent text...'],
      });

      expect(result.precedentMatch).toBeDefined();
      expect(result.precedentMatch!.matchPercentage).toBe(0.85);
    });
  });

  describe('translateBatch', () => {
    it('translates multiple clauses with shared context', async () => {
      mockGenerateStructuredOutput
        .mockResolvedValueOnce({
          clauseText: 'Clause 1 text',
          suggestedSection: 'Section 7.01',
          clauseTitle: 'Covenant 1',
          category: 'Financial Covenants',
          confidence: 0.9,
          warnings: ['Warning 1'],
        })
        .mockResolvedValueOnce({
          clauseText: 'Clause 2 text',
          suggestedSection: 'Section 6.01',
          clauseTitle: 'Obligation 1',
          category: 'Reporting',
          confidence: 0.85,
        });

      const result = await translateBatch({
        clauses: [
          { clauseType: 'covenant', structuredData: {} },
          { clauseType: 'obligation', structuredData: {} },
        ],
        globalContext: {
          borrowerName: 'Test Corp',
          facilityName: 'Test Facility',
          governingLaw: 'New York',
        },
      });

      expect(result.translatedClauses).toHaveLength(2);
      expect(result.metrics.averageConfidence).toBeCloseTo(0.875, 2);
      expect(result.metrics.totalClauses).toBe(2);
      expect(result.metrics.warningsCount).toBe(1);
    });

    it('handles empty batch', async () => {
      const result = await translateBatch({
        clauses: [],
        globalContext: {
          borrowerName: 'Test',
          facilityName: 'Test',
        },
      });

      expect(result.translatedClauses).toHaveLength(0);
      expect(result.metrics.averageConfidence).toBe(0);
    });
  });

  describe('analyzePrecedentStyle', () => {
    it('analyzes style patterns from precedents', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        stylePatterns: ['shall not permit', 'as of the last day of'],
        commonPhrases: ['Consolidated EBITDA', 'Administrative Agent'],
        structureNotes: 'Uses numbered subsections with lowercase letters',
        recommendations: ['Maintain consistent defined term capitalization'],
      });

      const result = await analyzePrecedentStyle(
        ['Precedent clause 1...', 'Precedent clause 2...'],
        'covenant'
      );

      expect(result.stylePatterns).toContain('shall not permit');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('clauseToMarkdown', () => {
    it('converts clause to markdown format', () => {
      const clause: TranslatedClause = {
        id: 'test-1',
        clauseText: 'The Borrower shall not permit the leverage ratio to exceed 4.50x.',
        suggestedSection: 'Section 7.01(a)',
        clauseTitle: 'Maximum Leverage Ratio',
        category: 'Financial Covenants',
        confidence: 0.92,
        warnings: ['Consider adding step-down schedule'],
        alternatives: ['Alternative: Maximum Leverage not to exceed 4.50 to 1.00'],
      };

      const markdown = clauseToMarkdown(clause);

      expect(markdown).toContain('## Maximum Leverage Ratio');
      expect(markdown).toContain('*Section 7.01(a)');
      expect(markdown).toContain('### Drafting Notes');
      expect(markdown).toContain('Consider adding step-down schedule');
      expect(markdown).toContain('### Alternative Phrasings');
      expect(markdown).toContain('*Confidence: 92%*');
    });

    it('handles clause without warnings or alternatives', () => {
      const clause: TranslatedClause = {
        id: 'test-2',
        clauseText: 'Simple clause text.',
        suggestedSection: 'Section 1',
        clauseTitle: 'Simple Clause',
        category: 'General',
        confidence: 0.9,
      };

      const markdown = clauseToMarkdown(clause);

      expect(markdown).toContain('## Simple Clause');
      expect(markdown).not.toContain('### Drafting Notes');
      expect(markdown).not.toContain('### Alternative Phrasings');
    });
  });

  describe('batchToDocument', () => {
    it('converts batch response to full document', () => {
      const response: TranslationBatchResponse = {
        translatedClauses: [
          {
            id: 'clause-1',
            clauseText: 'Covenant clause text',
            suggestedSection: 'Section 7.01',
            clauseTitle: 'Leverage Covenant',
            category: 'Financial Covenants',
            confidence: 0.9,
          },
          {
            id: 'clause-2',
            clauseText: 'Reporting clause text',
            suggestedSection: 'Section 6.01',
            clauseTitle: 'Financial Statements',
            category: 'Reporting Covenants',
            confidence: 0.85,
          },
        ],
        metrics: {
          averageConfidence: 0.875,
          totalClauses: 2,
          warningsCount: 0,
        },
      };

      const document = batchToDocument(
        response,
        'Apollo Credit Agreement Amendment',
        '2025-01-15'
      );

      expect(document).toContain('# Apollo Credit Agreement Amendment');
      expect(document).toContain('**Effective Date:** 2025-01-15');
      expect(document).toContain('# Financial Covenants');
      expect(document).toContain('# Reporting Covenants');
      expect(document).toContain('## Document Metrics');
      expect(document).toContain('**Total Clauses:** 2');
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('API error'));

      await expect(
        translateCovenant({
          covenantType: 'leverage_ratio',
          covenantName: 'Test',
          thresholdType: 'maximum',
          confidence: 0.9,
        })
      ).rejects.toThrow('API error');
    });
  });
});
