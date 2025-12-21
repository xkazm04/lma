/**
 * Similarity Module Tests
 *
 * Tests for the document similarity analysis LLM functions.
 * Uses mocked Claude API responses to test:
 * - Document similarity analysis
 * - Term deviation analysis
 * - Market benchmarking
 * - Negotiation precedent search
 * - Precedent clause matching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as similarity from './similarity';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('similarity module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('analyzeSimilarity', () => {
    it('finds similar documents from repository', async () => {
      const mockResult = [
        {
          id: 'doc-102',
          filename: 'Similar Facility Agreement.pdf',
          documentType: 'facility_agreement',
          similarityScore: 0.88,
          date: '2024-06-15',
          borrowerName: 'Apollo Corp',
          dealReference: 'APOLLO-2024-001',
          totalCommitment: 500000000,
          currency: 'USD',
          matchingTerms: ['Leverage Ratio', 'Interest Rate', 'Maturity Date'],
          similaritySummary: 'Similar facility type and covenant structure with comparable commitment size.',
        },
        {
          id: 'doc-103',
          filename: 'Manufacturing Credit Facility.pdf',
          documentType: 'facility_agreement',
          similarityScore: 0.72,
          date: '2024-03-20',
          borrowerName: 'Industrial Holdings',
          dealReference: 'IH-2024-002',
          totalCommitment: 450000000,
          currency: 'USD',
          matchingTerms: ['Leverage Ratio', 'Governing Law'],
          similaritySummary: 'Similar industry sector with comparable covenant package.',
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockResult);

      const result = await similarity.analyzeSimilarity({
        documentText: 'Credit agreement text for Apollo Holdings...',
        extractedData: {
          facilityName: 'Apollo Term Loan',
          facilityType: 'term_loan',
          totalCommitments: 500000000,
          currency: 'USD',
          maturityDate: '2029-01-15',
          borrowerName: 'Apollo Holdings',
          governingLaw: 'New York',
        },
        repositoryDocuments: [
          { id: 'doc-102', filename: 'Similar.pdf', documentType: 'facility_agreement', date: '2024-06-15' },
          { id: 'doc-103', filename: 'Manufacturing.pdf', documentType: 'facility_agreement', date: '2024-03-20' },
        ],
      });

      expect(result).toHaveLength(2);
      expect(result[0].similarityScore).toBeGreaterThan(0.8);
      expect(result[0].matchingTerms.length).toBeGreaterThan(0);
    });

    it('returns empty array when no similar documents found', async () => {
      mockGenerateStructuredOutput.mockResolvedValue([]);

      const result = await similarity.analyzeSimilarity({
        documentText: 'Unique document content...',
        extractedData: {},
        repositoryDocuments: [],
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('analyzeDeviations', () => {
    it('identifies terms deviating from organizational norms', async () => {
      const mockDeviations = [
        {
          id: 'dev-1',
          termName: 'Maximum Leverage Ratio',
          category: 'covenants',
          currentValue: '5.00x',
          normValue: '4.50x',
          deviationDirection: 'worse',
          deviationPercentage: 11.1,
          explanation: 'Leverage covenant is looser than organizational standard, increasing credit risk.',
          severity: 'high',
          clauseReference: 'Section 7.01(a)',
          pageNumber: 45,
        },
        {
          id: 'dev-2',
          termName: 'Initial Margin',
          category: 'financial_terms',
          currentValue: '2.75%',
          normValue: '3.00%',
          deviationDirection: 'better',
          deviationPercentage: -8.3,
          explanation: 'Margin is more favorable than norm, potentially due to strong borrower credit.',
          severity: 'low',
          clauseReference: 'Section 2.05',
          pageNumber: 12,
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockDeviations);

      const result = await similarity.analyzeDeviations({
        documentText: 'Credit agreement with financial covenants...',
        extractedTerms: [
          { name: 'Maximum Leverage Ratio', value: '5.00x', category: 'covenants' },
          { name: 'Initial Margin', value: '2.75%', category: 'financial_terms' },
        ],
        organizationalNorms: [
          { termName: 'Maximum Leverage Ratio', normValue: '4.50x' },
          { termName: 'Initial Margin', normValue: '3.00%' },
        ],
      });

      expect(result).toHaveLength(2);
      expect(result[0].severity).toBe('high');
      expect(result[0].deviationDirection).toBe('worse');
      expect(result[1].deviationDirection).toBe('better');
    });

    it('returns empty when no deviations found', async () => {
      mockGenerateStructuredOutput.mockResolvedValue([]);

      const result = await similarity.analyzeDeviations({
        documentText: 'Standard agreement text...',
        extractedTerms: [],
        organizationalNorms: [],
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('getMarketBenchmarks', () => {
    it('provides market benchmarks for document terms', async () => {
      const mockBenchmarks = [
        {
          id: 'bench-1',
          termName: 'Initial Margin',
          category: 'financial_terms',
          currentValue: '3.25%',
          marketAverage: '3.15%',
          marketMedian: '3.00%',
          marketRangeMin: '2.50%',
          marketRangeMax: '4.00%',
          percentile: 65,
          sampleSize: 150,
          benchmarkPeriod: 'Last 12 months',
          industrySegment: 'Manufacturing',
          assessment: 'at_market',
          marketInsight: 'Current margin is within normal market range for BB-rated manufacturing credits.',
        },
        {
          id: 'bench-2',
          termName: 'Maximum Leverage Ratio',
          category: 'covenants',
          currentValue: '4.50x',
          marketAverage: '4.25x',
          marketMedian: '4.25x',
          marketRangeMin: '3.50x',
          marketRangeMax: '5.50x',
          percentile: 60,
          sampleSize: 120,
          benchmarkPeriod: 'Last 12 months',
          industrySegment: 'Manufacturing',
          assessment: 'at_market',
          marketInsight: 'Leverage threshold is consistent with market for similar credit profiles.',
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockBenchmarks);

      const result = await similarity.getMarketBenchmarks({
        documentTerms: [
          { name: 'Initial Margin', value: '3.25%', category: 'financial_terms' },
          { name: 'Maximum Leverage Ratio', value: '4.50x', category: 'covenants' },
        ],
        industrySegment: 'Manufacturing',
        dealSize: 500000000,
        borrowerCreditProfile: 'BB',
      });

      expect(result).toHaveLength(2);
      expect(result[0].assessment).toBe('at_market');
      expect(result[0].percentile).toBeGreaterThan(0);
    });

    it('identifies below market terms', async () => {
      mockGenerateStructuredOutput.mockResolvedValue([
        {
          id: 'bench-1',
          termName: 'Initial Margin',
          category: 'financial_terms',
          currentValue: '2.25%',
          marketAverage: '3.15%',
          marketMedian: '3.00%',
          percentile: 15,
          assessment: 'below_market',
          marketInsight: 'Margin significantly below market - verify credit justification.',
        },
      ]);

      const result = await similarity.getMarketBenchmarks({
        documentTerms: [{ name: 'Initial Margin', value: '2.25%', category: 'financial_terms' }],
      });

      expect(result[0].assessment).toBe('below_market');
      expect(result[0].percentile).toBeLessThan(25);
    });
  });

  describe('findNegotiationPrecedents', () => {
    it('finds negotiation precedents for terms', async () => {
      const mockPrecedents = [
        {
          id: 'prec-1',
          sourceDocumentId: 'doc-50',
          sourceDocumentName: 'Apollo Amendment No. 2',
          dealDate: '2024-06-15',
          borrowerName: 'Apollo Holdings',
          initialValue: '4.50x',
          finalValue: '5.00x',
          negotiationRounds: 3,
          negotiationSummary: 'Borrower successfully negotiated covenant relief after demonstrating strong operational performance.',
          keyArguments: [
            'Strong Q2 earnings exceeded projections',
            'New contract wins provide revenue visibility',
            'Sector peers have comparable covenants',
          ],
          outcomeAssessment: 'neutral',
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockPrecedents);

      const result = await similarity.findNegotiationPrecedents({
        currentTerms: [
          { name: 'Maximum Leverage Ratio', value: '4.50x', clauseReference: 'Section 7.01(a)' },
        ],
        historicalDeals: [
          {
            id: 'doc-50',
            documentName: 'Apollo Amendment No. 2',
            borrowerName: 'Apollo Holdings',
            dealDate: '2024-06-15',
            terms: [{ name: 'Maximum Leverage Ratio', initialValue: '4.50x', finalValue: '5.00x' }],
          },
        ],
      });

      expect(result).toHaveLength(1);
      expect(result[0].negotiationRounds).toBe(3);
      expect(result[0].keyArguments.length).toBeGreaterThan(0);
    });

    it('returns empty when no precedents found', async () => {
      mockGenerateStructuredOutput.mockResolvedValue([]);

      const result = await similarity.findNegotiationPrecedents({
        currentTerms: [],
        historicalDeals: [],
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('findPrecedentClauses', () => {
    it('finds similar clauses from precedent documents', async () => {
      const mockClauses = [
        {
          id: 'clause-1',
          sourceDocumentId: 'doc-101',
          sourceDocumentName: 'Apollo Credit Agreement',
          clauseName: 'Maximum Leverage Ratio',
          clauseText: 'The Borrower shall not permit the Total Leverage Ratio to exceed 4.50 to 1.00...',
          similarity: 0.92,
          keyDifferences: ['Different ratio threshold', 'Different testing frequency'],
          sourceClauseReference: 'Section 7.01(a)',
        },
        {
          id: 'clause-2',
          sourceDocumentId: 'doc-102',
          sourceDocumentName: 'Industrial Holdings Credit Agreement',
          clauseName: 'Maximum Net Leverage Ratio',
          clauseText: 'The Borrower shall not permit the Net Leverage Ratio to exceed 4.25 to 1.00...',
          similarity: 0.78,
          keyDifferences: ['Uses Net Leverage vs Total Leverage', 'Includes cash netting provisions'],
          sourceClauseReference: 'Section 7.02(a)',
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockClauses);

      const result = await similarity.findPrecedentClauses(
        'Maximum Leverage Ratio',
        'The Borrower shall not permit the Total Leverage Ratio to exceed 5.00 to 1.00...',
        [
          {
            id: 'doc-101',
            documentName: 'Apollo Credit Agreement',
            clauses: [
              {
                name: 'Maximum Leverage Ratio',
                text: 'The Borrower shall not permit...',
                reference: 'Section 7.01(a)',
              },
            ],
          },
        ]
      );

      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBeGreaterThan(0.9);
      expect(result[0].keyDifferences.length).toBeGreaterThan(0);
    });
  });

  describe('runFullSimilarityAnalysis', () => {
    it('runs complete similarity analysis', async () => {
      // Mock all three underlying calls
      mockGenerateStructuredOutput
        .mockResolvedValueOnce([{ id: 'doc-1', similarityScore: 0.85, filename: 'Similar.pdf' }])
        .mockResolvedValueOnce([{ id: 'dev-1', termName: 'Leverage', severity: 'medium' }])
        .mockResolvedValueOnce([{ id: 'bench-1', termName: 'Margin', assessment: 'at_market' }]);

      const result = await similarity.runFullSimilarityAnalysis(
        'Document text content...',
        {
          facilityType: 'term_loan',
          totalCommitments: 500000000,
          maturityDate: '2029-01-15',
        },
        [{ id: 'doc-1', filename: 'Similar.pdf', documentType: 'agreement', date: '2024-01-01' }],
        [{ termName: 'Leverage Ratio', normValue: '4.50x' }]
      );

      expect(result.similarDocuments.length).toBeGreaterThanOrEqual(0);
      expect(result.analysisTimestamp).toBeDefined();
      expect(result.overallMatchQuality).toBeDefined();
      expect(['excellent', 'good', 'moderate', 'limited']).toContain(result.overallMatchQuality);
    });

    it('handles partial failures gracefully', async () => {
      // First call succeeds, second and third fail
      mockGenerateStructuredOutput
        .mockResolvedValueOnce([{ id: 'doc-1', similarityScore: 0.85, filename: 'Similar.pdf' }])
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'));

      const result = await similarity.runFullSimilarityAnalysis(
        'Document text...',
        {},
        [],
        []
      );

      // Should still return a result with empty arrays for failed calls
      expect(result.analysisTimestamp).toBeDefined();
      expect(result.deviations).toEqual([]);
      expect(result.marketBenchmarks).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('API unavailable'));

      await expect(
        similarity.analyzeSimilarity({
          documentText: 'Test',
          extractedData: {},
          repositoryDocuments: [],
        })
      ).rejects.toThrow('API unavailable');
    });
  });
});
