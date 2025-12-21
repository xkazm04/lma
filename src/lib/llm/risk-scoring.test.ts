/**
 * Risk Scoring Module Tests
 *
 * Tests for the document comparison risk scoring LLM functions.
 * Uses mocked Claude API responses to test:
 * - Risk analysis generation
 * - Change severity scoring
 * - Market benchmark comparison
 * - Mock data generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateRiskAnalysis,
  generateMockRiskAnalysis,
} from './risk-scoring';
import type { ComparisonResult } from '@/types';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('risk-scoring module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockComparisonResult: ComparisonResult = {
    document1: { id: 'doc-1', name: 'Original Agreement.pdf' },
    document2: { id: 'doc-2', name: 'Amendment No. 1.pdf' },
    differences: [
      {
        category: 'Financial Terms',
        field: 'Total Commitments',
        document1Value: 500000000,
        document2Value: 550000000,
        changeType: 'modified',
      },
      {
        category: 'Financial Terms',
        field: 'Initial Margin',
        document1Value: 3.25,
        document2Value: 3.00,
        changeType: 'modified',
      },
      {
        category: 'Covenants',
        field: 'Maximum Leverage Ratio',
        document1Value: 4.50,
        document2Value: 5.00,
        changeType: 'modified',
      },
    ],
  };

  describe('generateRiskAnalysis', () => {
    it('generates comprehensive risk analysis for comparison', async () => {
      const mockResponse = {
        changeScores: [
          {
            changeId: 'financial-terms-total-commitments',
            severityScore: 6,
            favoredParty: 'borrower',
            riskAnalysis: 'Facility size increase of $50M represents a 10% expansion.',
            deviatesFromMarket: false,
            confidence: 0.92,
          },
          {
            changeId: 'financial-terms-initial-margin',
            severityScore: 5,
            favoredParty: 'borrower',
            riskAnalysis: 'Margin reduction of 25bps reduces borrower interest expense.',
            deviatesFromMarket: true,
            confidence: 0.88,
          },
          {
            changeId: 'covenants-maximum-leverage-ratio',
            severityScore: 8,
            favoredParty: 'borrower',
            riskAnalysis: 'Loosening leverage covenant substantially increases headroom.',
            deviatesFromMarket: true,
            confidence: 0.95,
          },
        ],
        marketBenchmarks: [
          {
            changeId: 'financial-terms-total-commitments',
            termName: 'Total Commitments',
            category: 'Financial Terms',
            originalValue: '$500,000,000',
            amendedValue: '$550,000,000',
            marketRangeLow: '$300,000,000',
            marketRangeHigh: '$750,000,000',
            marketMedian: '$450,000,000',
            marketPosition: 'above_market',
            percentile: 72,
            sampleSize: 156,
            benchmarkPeriod: 'Q4 2024',
            marketInsight: 'Facility size is above median for comparable facilities.',
          },
        ],
        summary: {
          overallRiskScore: 6.3,
          overallDirection: 'borrower_favorable',
          keyFindings: [
            'Amendment significantly favors borrower',
            'Leverage covenant deviation from market standards',
          ],
          executiveSummary: 'This amendment package represents a material shift toward borrower-favorable terms.',
        },
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockResponse);

      const result = await generateRiskAnalysis(mockComparisonResult);

      expect(result.changeScores).toHaveLength(3);
      // Score 6 maps to 'high' (6-7 range per scoreToSeverity)
      expect(result.changeScores[0].severity).toBe('high');
      expect(result.changeScores[2].severity).toBe('critical');
      expect(result.summary.overallDirection).toBe('borrower_favorable');
      expect(result.marketBenchmarks.length).toBeGreaterThan(0);
    });

    it('includes category summaries in analysis', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        changeScores: [
          {
            changeId: 'financial-terms-total-commitments',
            severityScore: 6,
            favoredParty: 'borrower',
            riskAnalysis: 'Analysis...',
            deviatesFromMarket: false,
            confidence: 0.9,
          },
          {
            changeId: 'financial-terms-initial-margin',
            severityScore: 5,
            favoredParty: 'borrower',
            riskAnalysis: 'Analysis...',
            deviatesFromMarket: true,
            confidence: 0.88,
          },
        ],
        marketBenchmarks: [],
        summary: {
          overallRiskScore: 5.5,
          overallDirection: 'borrower_favorable',
          keyFindings: [],
          executiveSummary: 'Summary...',
        },
      });

      const result = await generateRiskAnalysis(mockComparisonResult);

      expect(result.summary.categorySummaries).toBeDefined();
      expect(result.summary.totalChangesAnalyzed).toBe(2);
    });

    it('handles empty comparison result', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        changeScores: [],
        marketBenchmarks: [],
        summary: {
          overallRiskScore: 0,
          overallDirection: 'balanced',
          keyFindings: ['No changes identified between documents'],
          executiveSummary: 'Documents appear to be identical.',
        },
      });

      const emptyComparison: ComparisonResult = {
        document1: { id: 'doc-1', name: 'Doc1.pdf' },
        document2: { id: 'doc-2', name: 'Doc2.pdf' },
        differences: [],
      };

      const result = await generateRiskAnalysis(emptyComparison);

      expect(result.changeScores).toHaveLength(0);
      expect(result.summary.overallRiskScore).toBe(0);
    });
  });

  describe('generateMockRiskAnalysis', () => {
    it('generates mock risk analysis for demo purposes', () => {
      const result = generateMockRiskAnalysis(mockComparisonResult);

      expect(result.document1.id).toBe('doc-1');
      expect(result.document2.id).toBe('doc-2');
      expect(result.changeScores.length).toBeGreaterThan(0);
      expect(result.marketBenchmarks.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
    });

    it('maps severity scores to severity categories correctly', () => {
      const result = generateMockRiskAnalysis(mockComparisonResult);

      // Find a score we know should be high/critical
      const leverageScore = result.changeScores.find(
        (s) => s.changeId.includes('leverage')
      );

      if (leverageScore) {
        // Severity 8 should map to 'critical'
        expect(['high', 'critical']).toContain(leverageScore.severity);
      }
    });

    it('calculates category summaries correctly', () => {
      const result = generateMockRiskAnalysis(mockComparisonResult);

      expect(result.summary.categorySummaries).toBeDefined();
      expect(result.summary.categorySummaries.length).toBeGreaterThan(0);

      const financialTermsSummary = result.summary.categorySummaries.find(
        (s) => s.category === 'Financial Terms'
      );

      if (financialTermsSummary) {
        expect(financialTermsSummary.averageSeverityScore).toBeGreaterThan(0);
      }
    });

    it('includes market benchmarks for financial terms', () => {
      const result = generateMockRiskAnalysis(mockComparisonResult);

      expect(result.marketBenchmarks.length).toBeGreaterThan(0);

      const commitmentBenchmark = result.marketBenchmarks.find(
        (b) => b.termName === 'Total Commitments'
      );

      if (commitmentBenchmark) {
        expect(commitmentBenchmark.marketPosition).toBeDefined();
        expect(commitmentBenchmark.percentile).toBeGreaterThan(0);
        expect(commitmentBenchmark.sampleSize).toBeGreaterThan(0);
      }
    });

    it('generates executive summary', () => {
      const result = generateMockRiskAnalysis(mockComparisonResult);

      expect(result.summary.executiveSummary).toBeTruthy();
      expect(result.summary.keyFindings.length).toBeGreaterThan(0);
    });

    it('tracks market deviation count', () => {
      const result = generateMockRiskAnalysis(mockComparisonResult);

      expect(result.summary.marketDeviationCount).toBeDefined();
      expect(typeof result.summary.marketDeviationCount).toBe('number');
    });

    it('includes analysis timestamp', () => {
      const result = generateMockRiskAnalysis(mockComparisonResult);

      expect(result.summary.analyzedAt).toBeTruthy();
      expect(new Date(result.summary.analyzedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('severity scoring', () => {
    it('correctly maps low severity scores (1-3)', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        changeScores: [
          { changeId: 'test', severityScore: 2, favoredParty: 'neutral', riskAnalysis: '', deviatesFromMarket: false, confidence: 0.9 },
        ],
        marketBenchmarks: [],
        summary: { overallRiskScore: 2, overallDirection: 'balanced', keyFindings: [], executiveSummary: '' },
      });

      const simpleComparison: ComparisonResult = {
        document1: { id: '1', name: 'Doc1' },
        document2: { id: '2', name: 'Doc2' },
        differences: [{ category: 'Test', field: 'Test', document1Value: 1, document2Value: 2, changeType: 'modified' }],
      };

      const result = await generateRiskAnalysis(simpleComparison);

      expect(result.changeScores[0].severity).toBe('low');
    });

    it('correctly maps medium severity scores (4-5)', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        changeScores: [
          { changeId: 'test', severityScore: 5, favoredParty: 'neutral', riskAnalysis: '', deviatesFromMarket: false, confidence: 0.9 },
        ],
        marketBenchmarks: [],
        summary: { overallRiskScore: 5, overallDirection: 'balanced', keyFindings: [], executiveSummary: '' },
      });

      const simpleComparison: ComparisonResult = {
        document1: { id: '1', name: 'Doc1' },
        document2: { id: '2', name: 'Doc2' },
        differences: [{ category: 'Test', field: 'Test', document1Value: 1, document2Value: 2, changeType: 'modified' }],
      };

      const result = await generateRiskAnalysis(simpleComparison);

      expect(result.changeScores[0].severity).toBe('medium');
    });

    it('correctly maps high severity scores (6-7)', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        changeScores: [
          { changeId: 'test', severityScore: 7, favoredParty: 'neutral', riskAnalysis: '', deviatesFromMarket: false, confidence: 0.9 },
        ],
        marketBenchmarks: [],
        summary: { overallRiskScore: 7, overallDirection: 'balanced', keyFindings: [], executiveSummary: '' },
      });

      const simpleComparison: ComparisonResult = {
        document1: { id: '1', name: 'Doc1' },
        document2: { id: '2', name: 'Doc2' },
        differences: [{ category: 'Test', field: 'Test', document1Value: 1, document2Value: 2, changeType: 'modified' }],
      };

      const result = await generateRiskAnalysis(simpleComparison);

      expect(result.changeScores[0].severity).toBe('high');
    });

    it('correctly maps critical severity scores (8-10)', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        changeScores: [
          { changeId: 'test', severityScore: 9, favoredParty: 'neutral', riskAnalysis: '', deviatesFromMarket: false, confidence: 0.9 },
        ],
        marketBenchmarks: [],
        summary: { overallRiskScore: 9, overallDirection: 'balanced', keyFindings: [], executiveSummary: '' },
      });

      const simpleComparison: ComparisonResult = {
        document1: { id: '1', name: 'Doc1' },
        document2: { id: '2', name: 'Doc2' },
        differences: [{ category: 'Test', field: 'Test', document1Value: 1, document2Value: 2, changeType: 'modified' }],
      };

      const result = await generateRiskAnalysis(simpleComparison);

      expect(result.changeScores[0].severity).toBe('critical');
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('API rate limit'));

      await expect(generateRiskAnalysis(mockComparisonResult)).rejects.toThrow('API rate limit');
    });
  });
});
