/**
 * Query Module Tests
 *
 * Tests for the document query/Q&A LLM functions.
 * Uses mocked Claude API responses to test:
 * - Prompt construction with document context
 * - Response parsing with sources
 * - Confidence scoring
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as query from './query';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateCompletion } from './client';

const mockGenerateCompletion = vi.mocked(generateCompletion);

describe('query module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('queryDocuments', () => {
    it('parses valid JSON response with sources', async () => {
      const mockJsonResponse = JSON.stringify({
        answer: 'The maximum leverage ratio is 4.50x as stated in Section 7.1.',
        sources: [
          {
            documentName: 'Apollo Credit Facility.pdf',
            clauseReference: 'Section 7.1(a)',
            excerpt: 'The Borrower shall not permit the Total Leverage Ratio to exceed 4.50 to 1.00.',
          },
        ],
        confidence: 0.92,
      });

      mockGenerateCompletion.mockResolvedValue(mockJsonResponse);

      const result = await query.queryDocuments(
        'What is the maximum leverage ratio?',
        {
          covenants: [
            {
              id: 'cov-1',
              type: 'leverage_ratio',
              name: 'Maximum Leverage Ratio',
              threshold: 4.5,
              clauseReference: 'Section 7.1(a)',
            },
          ],
        }
      );

      expect(result.answer).toContain('4.50x');
      expect(result.sources).toHaveLength(1);
      expect(result.confidence).toBe(0.92);
    });

    it('includes facilities in context', async () => {
      mockGenerateCompletion.mockResolvedValue(JSON.stringify({
        answer: 'The facility is Apollo Term Loan',
        sources: [],
        confidence: 0.8,
      }));

      await query.queryDocuments(
        'What facilities are available?',
        {
          facilities: [
            { id: 'fac-1', name: 'Apollo Term Loan', data: { type: 'term_loan' } },
            { id: 'fac-2', name: 'Revolving Credit', data: { type: 'revolver' } },
          ],
        }
      );

      const userPrompt = mockGenerateCompletion.mock.calls[0][1];
      expect(userPrompt).toContain('Apollo Term Loan');
      expect(userPrompt).toContain('Revolving Credit');
    });

    it('includes covenants in context', async () => {
      mockGenerateCompletion.mockResolvedValue(JSON.stringify({
        answer: 'The leverage ratio is 4.5x',
        sources: [],
        confidence: 0.85,
      }));

      await query.queryDocuments(
        'What are the financial covenants?',
        {
          covenants: [
            { id: 'cov-1', type: 'leverage_ratio', name: 'Leverage Ratio', threshold: 4.5 },
            { id: 'cov-2', type: 'interest_coverage', name: 'Interest Coverage', threshold: 2.0 },
          ],
        }
      );

      const userPrompt = mockGenerateCompletion.mock.calls[0][1];
      expect(userPrompt).toContain('leverage_ratio');
      expect(userPrompt).toContain('interest_coverage');
    });

    it('includes obligations in context', async () => {
      mockGenerateCompletion.mockResolvedValue(JSON.stringify({
        answer: 'Quarterly reporting is required',
        sources: [],
        confidence: 0.9,
      }));

      await query.queryDocuments(
        'What are the reporting requirements?',
        {
          obligations: [
            { id: 'obl-1', type: 'financial_reporting', description: 'Quarterly financial statements', frequency: 'quarterly' },
          ],
        }
      );

      const userPrompt = mockGenerateCompletion.mock.calls[0][1];
      expect(userPrompt).toContain('Quarterly financial statements');
    });

    it('includes defined terms in context', async () => {
      mockGenerateCompletion.mockResolvedValue(JSON.stringify({
        answer: 'EBITDA means earnings before interest...',
        sources: [],
        confidence: 0.88,
      }));

      await query.queryDocuments(
        'What is the definition of EBITDA?',
        {
          definedTerms: [
            { term: 'EBITDA', definition: 'Earnings before interest, taxes, depreciation, and amortization' },
          ],
        }
      );

      const userPrompt = mockGenerateCompletion.mock.calls[0][1];
      expect(userPrompt).toContain('EBITDA');
    });

    it('handles empty context gracefully', async () => {
      mockGenerateCompletion.mockResolvedValue(JSON.stringify({
        answer: 'No data available to answer the question.',
        sources: [],
        confidence: 0.5,
      }));

      const result = await query.queryDocuments('What is the interest rate?', {});

      expect(result.confidence).toBe(0.5);
      expect(result.sources).toEqual([]);
    });

    it('handles non-JSON response', async () => {
      mockGenerateCompletion.mockResolvedValue(
        'The interest rate is SOFR plus 3.25% based on the margin schedule.'
      );

      const result = await query.queryDocuments(
        'What is the interest rate?',
        { facilities: [{ id: 'fac-1', name: 'Test', data: {} }] }
      );

      expect(result.answer).toContain('SOFR');
      expect(result.sources).toEqual([]);
      expect(result.confidence).toBe(0.7); // Default confidence
    });

    it('handles malformed JSON response', async () => {
      mockGenerateCompletion.mockResolvedValue(
        'Here is the answer: { broken json'
      );

      const result = await query.queryDocuments(
        'Question?',
        { facilities: [{ id: 'fac-1', name: 'Test', data: {} }] }
      );

      // Should fallback to raw text
      expect(result.answer).toBeTruthy();
      expect(result.confidence).toBe(0.7);
    });
  });

  describe('compareDocumentsWithLLM', () => {
    it('compares two document summaries', async () => {
      const mockResponse = JSON.stringify({
        summary: 'Key changes between versions include margin reduction and covenant modifications.',
        keyChanges: [
          'Interest margin reduced from 3.50% to 3.25%',
          'Maturity extended by 1 year to January 2030',
          'Leverage covenant loosened from 4.0x to 4.5x',
        ],
        riskAssessment: 'Moderate risk - margin reduction offset by covenant relaxation',
      });

      mockGenerateCompletion.mockResolvedValue(mockResponse);

      const result = await query.compareDocumentsWithLLM(
        'Original agreement: $500M facility, 3.50% margin, 4.0x leverage, Jan 2029 maturity',
        'Amendment: $500M facility, 3.25% margin, 4.5x leverage, Jan 2030 maturity'
      );

      expect(result.summary).toContain('margin reduction');
      expect(result.keyChanges).toHaveLength(3);
      expect(result.riskAssessment).toContain('Moderate');
    });

    it('handles identical documents', async () => {
      mockGenerateCompletion.mockResolvedValue(JSON.stringify({
        summary: 'No material differences identified between the documents.',
        keyChanges: [],
        riskAssessment: 'No risk implications - documents are substantially similar',
      }));

      const result = await query.compareDocumentsWithLLM(
        'Same content summary',
        'Same content summary'
      );

      expect(result.keyChanges).toHaveLength(0);
      expect(result.summary).toContain('No material differences');
    });

    it('handles non-JSON response', async () => {
      mockGenerateCompletion.mockResolvedValue(
        'The documents differ primarily in the interest rate: Document 1 has 3.5% while Document 2 has 3.25%.'
      );

      const result = await query.compareDocumentsWithLLM(
        'Summary 1',
        'Summary 2'
      );

      expect(result.summary).toContain('interest rate');
      expect(result.keyChanges).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully in queryDocuments', async () => {
      mockGenerateCompletion.mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await query.queryDocuments(
        'Question?',
        { facilities: [{ id: 'fac-1', name: 'Test', data: {} }] }
      );

      // The function catches errors and returns a fallback response
      expect(result.answer).toContain('Sorry');
      expect(result.confidence).toBe(0);
    });

    it('handles API errors gracefully in compareDocumentsWithLLM', async () => {
      mockGenerateCompletion.mockRejectedValue(new Error('API timeout'));

      const result = await query.compareDocumentsWithLLM(
        'Summary 1',
        'Summary 2'
      );

      // The function catches errors and returns a fallback response
      expect(result.summary).toContain('Unable to generate comparison');
      expect(result.keyChanges).toEqual([]);
    });
  });
});
