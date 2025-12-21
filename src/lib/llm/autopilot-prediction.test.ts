/**
 * Autopilot Prediction Module Tests
 *
 * Tests for the predictive compliance analysis LLM functions.
 * Uses mocked Claude API responses to test:
 * - Breach prediction generation
 * - Remediation strategy generation
 * - Signal correlation analysis
 * - Notification content generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as autopilotPrediction from './autopilot-prediction';
import type { PredictionInput, PredictionOutput } from './autopilot-prediction';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('autopilot-prediction module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockPredictionInput: PredictionInput = {
    covenant: {
      id: 'cov-1',
      name: 'Maximum Leverage Ratio',
      type: 'leverage_ratio',
      threshold: 4.5,
      threshold_type: 'maximum',
      current_value: 4.2,
      headroom_percentage: 6.7,
      test_history: [
        { date: '2024-12-31', value: 4.2, result: 'pass' },
        { date: '2024-09-30', value: 4.0, result: 'pass' },
        { date: '2024-06-30', value: 3.8, result: 'pass' },
      ],
    },
    facility: {
      id: 'fac-1',
      name: 'Apollo Credit Facility',
      type: 'term_loan',
      commitment: 500000000,
      maturity_date: '2029-01-15',
    },
    borrower: {
      id: 'bor-1',
      name: 'Apollo Holdings',
      industry: 'manufacturing',
    },
    signals: {
      market_data: [
        {
          indicator: 'Industry Credit Spread',
          current_value: 325,
          change: 50,
          impact_direction: 'negative',
        },
      ],
      transaction_patterns: [
        {
          pattern_type: 'Cash Flow',
          trend_direction: 'declining',
          change_rate: -0.05,
          values: [
            { period: 'Q4 2024', value: 25000000 },
            { period: 'Q3 2024', value: 28000000 },
          ],
        },
      ],
      news_sentiment: [
        {
          headline: 'Manufacturing sector faces headwinds',
          sentiment_score: -0.3,
          credit_relevance: 0.7,
        },
      ],
      benchmark_comparison: {
        industry_median: 3.8,
        percentile_rank: 75,
        market_trend: 'tightening',
      },
    },
  };

  describe('generateBreachPrediction', () => {
    it('generates breach prediction with multi-signal analysis', async () => {
      const mockPrediction: PredictionOutput = {
        breach_probability_6m: 25,
        breach_probability_9m: 40,
        breach_probability_12m: 55,
        overall_risk_level: 'medium',
        confidence_score: 82,
        projected_breach_quarter: 'Q4 2025',
        contributing_factors: [
          {
            factor: 'EBITDA Compression',
            impact: 'negative',
            weight: 0.4,
            description: 'Margin pressure from rising input costs',
          },
          {
            factor: 'Interest Rate Environment',
            impact: 'negative',
            weight: 0.3,
            description: 'Floating rate debt exposure increasing costs',
          },
        ],
        quarterly_projections: [
          {
            quarter: 'Q1 2025',
            projected_value: 4.35,
            breach_probability: 20,
            key_drivers: ['Seasonal revenue decline'],
          },
          {
            quarter: 'Q2 2025',
            projected_value: 4.45,
            breach_probability: 35,
            key_drivers: ['Continued margin pressure'],
          },
        ],
        leading_indicators: [
          {
            name: 'Days Sales Outstanding',
            status: 'warning',
            description: 'DSO increasing, indicating cash collection issues',
          },
        ],
        root_causes: [
          {
            cause: 'Supply chain cost inflation',
            contribution: 40,
            addressable: true,
            recommended_action: 'Renegotiate supplier contracts',
          },
        ],
        summary: 'Moderate risk of leverage covenant breach within 12 months due to EBITDA compression.',
        key_risks: ['Margin compression', 'Rising interest costs'],
        immediate_actions: ['Review cost structure', 'Engage with lenders early'],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockPrediction);

      const result = await autopilotPrediction.generateBreachPrediction(mockPredictionInput);

      expect(result.overall_risk_level).toBe('medium');
      expect(result.breach_probability_12m).toBe(55);
      expect(result.contributing_factors).toHaveLength(2);
      expect(result.quarterly_projections.length).toBeGreaterThan(0);
      expect(mockGenerateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('credit risk analyst'),
        expect.stringContaining('Maximum Leverage Ratio'),
        expect.any(Object)
      );
    });

    it('handles low risk scenarios', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        breach_probability_6m: 5,
        breach_probability_9m: 8,
        breach_probability_12m: 12,
        overall_risk_level: 'low',
        confidence_score: 90,
        projected_breach_quarter: null,
        contributing_factors: [],
        quarterly_projections: [],
        leading_indicators: [],
        root_causes: [],
        summary: 'Low risk - comfortable headroom maintained',
        key_risks: [],
        immediate_actions: ['Continue standard monitoring'],
      });

      const result = await autopilotPrediction.generateBreachPrediction(mockPredictionInput);

      expect(result.overall_risk_level).toBe('low');
      expect(result.projected_breach_quarter).toBeNull();
    });
  });

  describe('generateRemediationStrategies', () => {
    const mockPrediction: PredictionOutput = {
      breach_probability_6m: 35,
      breach_probability_9m: 50,
      breach_probability_12m: 65,
      overall_risk_level: 'high',
      confidence_score: 85,
      projected_breach_quarter: 'Q3 2025',
      contributing_factors: [
        {
          factor: 'Revenue Decline',
          impact: 'negative',
          weight: 0.5,
          description: 'Revenue down 15% YoY',
        },
      ],
      quarterly_projections: [],
      leading_indicators: [],
      root_causes: [
        {
          cause: 'Market share loss',
          contribution: 50,
          addressable: true,
          recommended_action: 'Launch competitive pricing strategy',
        },
      ],
      summary: 'High risk of breach due to revenue decline',
      key_risks: ['Revenue decline', 'Competitive pressure'],
      immediate_actions: ['Initiate lender discussions'],
    };

    it('generates remediation strategies for at-risk covenants', async () => {
      const mockStrategies = [
        {
          strategy_type: 'covenant_amendment',
          title: 'Negotiate Covenant Holiday',
          description: 'Request temporary covenant waiver or reset',
          effectiveness: 85,
          difficulty: 'medium' as const,
          time_to_implement: '4-6 weeks',
          projected_improvement: 25,
          steps: [
            {
              title: 'Prepare Amendment Request',
              description: 'Draft formal request with supporting financials',
              responsible_party: 'CFO',
              documents_required: ['Financial projections', 'Remediation plan'],
            },
          ],
          risks: ['Lender may require additional collateral'],
          estimated_cost: {
            total: 250000,
            breakdown: [
              { category: 'Legal fees', amount: 150000 },
              { category: 'Amendment fees', amount: 100000 },
            ],
          },
        },
        {
          strategy_type: 'operational_improvement',
          title: 'Cost Reduction Program',
          description: 'Implement targeted cost reductions to improve EBITDA',
          effectiveness: 70,
          difficulty: 'high' as const,
          time_to_implement: '3-6 months',
          projected_improvement: 15,
          steps: [
            {
              title: 'Identify cost savings',
              description: 'Review all major cost categories',
              responsible_party: 'Operations',
              documents_required: ['Cost analysis'],
            },
          ],
          risks: ['May impact operations'],
          estimated_cost: {
            total: 50000,
            breakdown: [{ category: 'Consulting', amount: 50000 }],
          },
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue(mockStrategies);

      const result = await autopilotPrediction.generateRemediationStrategies(
        mockPredictionInput,
        mockPrediction
      );

      expect(result).toHaveLength(2);
      expect(result[0].strategy_type).toBe('covenant_amendment');
      expect(result[0].effectiveness).toBe(85);
      expect(result[1].difficulty).toBe('high');
    });
  });

  describe('analyzeSignalCorrelation', () => {
    it('analyzes correlation between multiple signals', async () => {
      const mockCorrelation = {
        correlation_score: 0.78,
        correlated_factors: [
          'Credit spread widening aligns with declining cash flow',
          'Negative sentiment correlates with industry trends',
        ],
        divergent_signals: [
          'Equity market performance not aligned with credit indicators',
        ],
        interpretation: 'Strong correlation between credit and operational signals suggests genuine deterioration.',
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockCorrelation);

      const result = await autopilotPrediction.analyzeSignalCorrelation(mockPredictionInput.signals);

      expect(result.correlation_score).toBe(0.78);
      expect(result.correlated_factors.length).toBeGreaterThan(0);
      expect(result.divergent_signals.length).toBeGreaterThan(0);
    });

    it('handles uncorrelated signals', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        correlation_score: 0.25,
        correlated_factors: [],
        divergent_signals: ['Market data contradicts transaction patterns'],
        interpretation: 'Low correlation - signals may indicate noise rather than trend.',
      });

      const result = await autopilotPrediction.analyzeSignalCorrelation({});

      expect(result.correlation_score).toBeLessThan(0.5);
    });
  });

  describe('generateNotificationContent', () => {
    const mockPrediction: PredictionOutput = {
      breach_probability_6m: 60,
      breach_probability_9m: 75,
      breach_probability_12m: 85,
      overall_risk_level: 'high',
      confidence_score: 88,
      projected_breach_quarter: 'Q2 2025',
      contributing_factors: [],
      quarterly_projections: [],
      leading_indicators: [],
      root_causes: [],
      summary: 'High probability of breach',
      key_risks: ['EBITDA decline', 'Rising leverage'],
      immediate_actions: ['Engage CFO', 'Review options'],
    };

    it('generates escalation notification content', async () => {
      const mockNotification = {
        subject: 'URGENT: Risk Escalation - Apollo Holdings Leverage Covenant',
        summary: 'High probability (85%) of leverage covenant breach projected for Q2 2025.',
        details: 'Based on multi-signal analysis, Apollo Holdings Maximum Leverage Ratio covenant shows elevated breach risk. Key drivers include EBITDA decline and rising leverage ratios.',
        recommended_actions: [
          'Schedule call with CFO within 48 hours',
          'Review remediation options',
          'Prepare amendment discussion points',
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockNotification);

      const result = await autopilotPrediction.generateNotificationContent(
        mockPrediction,
        'Apollo Holdings',
        'Maximum Leverage Ratio',
        'risk_escalation'
      );

      expect(result.subject).toContain('Risk Escalation');
      expect(result.recommended_actions).toHaveLength(3);
    });

    it('generates breach imminent notification', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        subject: 'CRITICAL: Breach Imminent - Apollo Holdings',
        summary: 'Covenant breach expected within 30 days.',
        details: 'Immediate action required to prevent covenant breach.',
        recommended_actions: ['Initiate emergency lender meeting'],
      });

      const result = await autopilotPrediction.generateNotificationContent(
        mockPrediction,
        'Apollo Holdings',
        'Maximum Leverage Ratio',
        'breach_imminent'
      );

      expect(result.subject).toContain('CRITICAL');
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('API timeout'));

      await expect(
        autopilotPrediction.generateBreachPrediction(mockPredictionInput)
      ).rejects.toThrow('API timeout');
    });
  });
});
