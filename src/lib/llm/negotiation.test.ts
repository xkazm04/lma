/**
 * Negotiation Module Tests
 *
 * Tests for the deal room negotiation LLM functions.
 * Uses mocked Claude API responses to test:
 * - Market suggestions
 * - Impact analysis
 * - Counter-proposal generation
 * - Negotiation summaries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as negotiation from './negotiation';
import type { NegotiationTerm } from '@/types';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('negotiation module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockNegotiationTerm: NegotiationTerm = {
    id: 'term-1',
    term_label: 'Initial Margin',
    value_type: 'percentage',
    current_value: 3.5,
    original_value: 3.5,
    negotiation_status: 'in_discussion',
  };

  describe('getMarketSuggestions', () => {
    it('returns market suggestions for a term', async () => {
      const mockSuggestions = {
        suggestions: [
          {
            suggested_value: 3.25,
            suggested_value_text: '3.25%',
            rationale: 'Based on current market conditions for BB-rated borrowers in the manufacturing sector.',
            confidence: 'high',
            source: 'Q4 2024 leveraged loan market data',
            market_percentile: 65,
          },
          {
            suggested_value: 3.00,
            suggested_value_text: '3.00%',
            rationale: 'Aggressive pricing for borrowers with strong credit metrics.',
            confidence: 'medium',
            source: 'Recent comparable transactions',
            market_percentile: 45,
          },
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockSuggestions);

      const result = await negotiation.getMarketSuggestions({
        term: mockNegotiationTerm,
        dealContext: {
          dealType: 'term_loan_b',
          dealSize: 500000000,
          currency: 'USD',
          borrowerType: 'corporate',
          facilityType: 'term_loan',
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].suggested_value).toBe(3.25);
      expect(result[0].confidence).toBe('high');
      expect(mockGenerateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('syndicated loan markets'),
        expect.stringContaining('Initial Margin'),
        expect.objectContaining({ temperature: 0.4 })
      );
    });

    it('handles terms without deal size', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        suggestions: [
          {
            suggested_value: 4.0,
            suggested_value_text: '4.00%',
            rationale: 'Standard market rate when deal size is not specified.',
            confidence: 'low',
            source: 'General market benchmarks',
            market_percentile: 50,
          },
        ],
      });

      const result = await negotiation.getMarketSuggestions({
        term: mockNegotiationTerm,
        dealContext: {
          dealType: 'revolving_credit',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe('low');
    });
  });

  describe('analyzeTermImpact', () => {
    it('analyzes the impact of a proposed term change', async () => {
      const mockImpact = {
        summary: 'Reducing margin by 25bps will decrease annual interest cost by approximately $1.25M.',
        risk_level: 'low',
        financial_impact: {
          borrower_cost_change: 'Annual interest savings of approximately $1.25M',
          lender_risk_change: 'Slightly reduced yield; minimal credit risk change',
          estimated_basis_points: -25,
        },
        affected_terms: [
          {
            term_id: 'term-2',
            term_label: 'Margin Grid',
            impact_description: 'Margin grid thresholds may need adjustment for consistency.',
          },
        ],
        compliance_considerations: [],
        recommendations: [
          'Ensure margin grid reflects new base margin',
          'Review commitment fee for consistency',
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockImpact);

      const result = await negotiation.analyzeTermImpact({
        term: mockNegotiationTerm,
        proposedValue: 3.25,
        relatedTerms: [
          {
            id: 'term-2',
            term_label: 'Margin Grid',
            value_type: 'table',
            current_value: { levels: [3.25, 3.50, 3.75] },
            original_value: { levels: [3.25, 3.50, 3.75] },
            negotiation_status: 'agreed',
          },
        ],
        dealContext: {
          dealType: 'term_loan_b',
          dealSize: 500000000,
          currency: 'USD',
        },
      });

      expect(result.summary).toContain('25bps');
      expect(result.risk_level).toBe('low');
      expect(result.affected_terms).toHaveLength(1);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('identifies high risk changes', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        summary: 'Loosening leverage covenant by 0.5x significantly increases credit risk.',
        risk_level: 'high',
        financial_impact: {
          borrower_cost_change: 'No direct cost change; increased flexibility',
          lender_risk_change: 'Materially higher default risk exposure',
          estimated_basis_points: null,
        },
        affected_terms: [
          {
            term_id: 'term-3',
            term_label: 'Interest Coverage Ratio',
            impact_description: 'May need to review for consistency with leverage changes.',
          },
          {
            term_id: 'term-4',
            term_label: 'Equity Cure Rights',
            impact_description: 'Cure cap calculations may be affected.',
          },
        ],
        compliance_considerations: [
          'Review internal credit policy limits',
          'May require additional credit committee approval',
        ],
        recommendations: [
          'Consider offsetting with tighter pricing',
          'Add leverage step-down schedule',
          'Strengthen financial reporting requirements',
        ],
      });

      const leverageTerm: NegotiationTerm = {
        id: 'term-cov',
        term_label: 'Maximum Leverage Ratio',
        value_type: 'ratio',
        current_value: 4.5,
        original_value: 4.5,
        negotiation_status: 'in_discussion',
      };

      const result = await negotiation.analyzeTermImpact({
        term: leverageTerm,
        proposedValue: 5.0,
        relatedTerms: [],
        dealContext: {
          dealType: 'term_loan_b',
        },
      });

      expect(result.risk_level).toBe('high');
      expect(result.affected_terms.length).toBeGreaterThan(0);
      expect(result.compliance_considerations.length).toBeGreaterThan(0);
    });
  });

  describe('suggestCounterProposals', () => {
    it('generates counter-proposals for a term', async () => {
      const mockCounters = {
        counters: [
          {
            counter_value: 3.375,
            counter_value_text: '3.375%',
            rationale: 'Middle ground between current 3.50% and proposed 3.25%.',
            compromise_type: 'middle_ground',
            acceptability_score: 8,
          },
          {
            counter_value: 3.25,
            counter_value_text: '3.25% with margin grid',
            rationale: 'Accept proposed margin but tie to leverage-based margin grid.',
            compromise_type: 'conditional',
            acceptability_score: 7,
          },
          {
            counter_value: 3.25,
            counter_value_text: '3.25% phased in',
            rationale: 'Start at 3.50% and step down to 3.25% over 18 months.',
            compromise_type: 'phased',
            acceptability_score: 6,
          },
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockCounters);

      const result = await negotiation.suggestCounterProposals({
        term: mockNegotiationTerm,
        proposedValue: 3.25,
        proposerParty: 'Borrower',
        responderParty: 'Lender',
      });

      expect(result).toHaveLength(3);
      expect(result[0].compromise_type).toBe('middle_ground');
      expect(result[0].acceptability_score).toBeGreaterThan(0);
      expect(result[1].compromise_type).toBe('conditional');
    });

    it('handles non-numeric term negotiations', async () => {
      const dateTerm: NegotiationTerm = {
        id: 'term-mat',
        term_label: 'Maturity Date',
        value_type: 'date',
        current_value: '2028-01-15',
        original_value: '2028-01-15',
        negotiation_status: 'in_discussion',
      };

      mockGenerateStructuredOutput.mockResolvedValue({
        counters: [
          {
            counter_value: '2028-07-15',
            counter_value_text: 'July 15, 2028',
            rationale: 'Six-month extension as compromise.',
            compromise_type: 'middle_ground',
            acceptability_score: 7,
          },
        ],
      });

      const result = await negotiation.suggestCounterProposals({
        term: dateTerm,
        proposedValue: '2029-01-15',
        proposerParty: 'Borrower',
        responderParty: 'Lender',
      });

      expect(result).toHaveLength(1);
      expect(result[0].counter_value).toBe('2028-07-15');
    });
  });

  describe('summarizeNegotiation', () => {
    it('summarizes negotiation progress', async () => {
      const mockSummary = {
        overall_status: 'Negotiation progressing well with 60% of terms agreed.',
        key_sticking_points: [
          {
            term: 'Initial Margin',
            issue: 'Borrower seeking 25bps reduction; lender wants covenant tightening in exchange.',
            parties_positions: {
              Borrower: 'Requesting 3.25% based on improved credit metrics',
              Lender: 'Willing to reduce to 3.375% with covenant improvement',
            },
          },
        ],
        progress_metrics: {
          terms_agreed: 6,
          terms_in_discussion: 3,
          terms_pending: 1,
        },
        recommendations: [
          'Schedule call to discuss margin/covenant trade-off',
          'Consider package approach for remaining terms',
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockSummary);

      const terms: NegotiationTerm[] = [
        {
          id: 'term-1',
          term_label: 'Total Commitments',
          value_type: 'currency',
          current_value: 550000000,
          original_value: 500000000,
          negotiation_status: 'agreed',
        },
        {
          id: 'term-2',
          term_label: 'Initial Margin',
          value_type: 'percentage',
          current_value: 3.5,
          original_value: 3.5,
          negotiation_status: 'in_discussion',
        },
      ];

      const result = await negotiation.summarizeNegotiation({
        terms,
        history: [
          {
            termLabel: 'Initial Margin',
            changes: [
              { from: 3.5, to: 3.25, party: 'Borrower', date: '2025-01-10' },
              { from: 3.25, to: 3.375, party: 'Lender', date: '2025-01-12' },
            ],
          },
        ],
      });

      expect(result.overall_status).toContain('60%');
      expect(result.key_sticking_points).toHaveLength(1);
      expect(result.progress_metrics.terms_agreed).toBe(6);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('identifies stalled negotiations', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        overall_status: 'Negotiation stalled - no progress on pricing for 2 weeks.',
        key_sticking_points: [
          {
            term: 'Initial Margin',
            issue: 'Significant gap between parties with no movement.',
            parties_positions: {
              Borrower: 'Firm at 2.75%',
              Lender: 'Minimum 3.50%',
            },
          },
        ],
        progress_metrics: {
          terms_agreed: 2,
          terms_in_discussion: 5,
          terms_pending: 3,
        },
        recommendations: [
          'Escalate to senior management',
          'Consider alternative deal structures',
          'Explore bringing in additional lenders',
        ],
      });

      const result = await negotiation.summarizeNegotiation({
        terms: [],
        history: [],
      });

      expect(result.overall_status).toContain('stalled');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(
        negotiation.getMarketSuggestions({
          term: mockNegotiationTerm,
          dealContext: { dealType: 'term_loan' },
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('handles empty response', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({ suggestions: [] });

      const result = await negotiation.getMarketSuggestions({
        term: mockNegotiationTerm,
        dealContext: { dealType: 'term_loan' },
      });

      expect(result).toHaveLength(0);
    });
  });
});
