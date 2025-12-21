/**
 * Compliance Module Tests
 *
 * Tests for the compliance agent LLM functions.
 * Uses mocked Claude API responses to test:
 * - Event analysis and notification triggering
 * - Risk level determination
 * - Alert generation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create hoisted mock for @anthropic-ai/sdk
const { mockCreate } = vi.hoisted(() => {
  return { mockCreate: vi.fn() };
});

// Mock @anthropic-ai/sdk
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
      };
    },
  };
});

// Import after mocking
import * as compliance from './compliance';
import type { BreachPrediction, PredictionRiskLevel, RiskThresholdConfig } from '@/app/features/compliance/lib/types';

describe('compliance module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('analyzeBusinessEvent', () => {
    it('handles empty notification requirements', async () => {
      const result = await compliance.analyzeBusinessEvent(
        'Apollo Holdings acquired XYZ Corp',
        []
      );

      expect(result.triggered_notifications).toEqual([]);
      expect(result.suggested_actions).toContain('No notification requirements configured for the selected facilities.');
    });

    it('calls Anthropic API for event analysis', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              triggered_notifications: [
                {
                  requirement_id: 'req-1',
                  requirement_name: 'Material Acquisition Notice',
                  facility_id: 'fac-1',
                  facility_name: 'Apollo Credit Facility',
                  deadline_days: 5,
                  confidence: 0.92,
                  reasoning: 'Acquisition exceeds threshold',
                },
              ],
              suggested_actions: ['Prepare notice within 5 days'],
              risk_assessment: 'Medium risk',
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await compliance.analyzeBusinessEvent(
        'Apollo Holdings has completed the acquisition of XYZ Corp for $50 million.',
        [
          {
            id: 'req-1',
            facility_id: 'fac-1',
            facility_name: 'Apollo Credit Facility',
            event_type: 'material_acquisition',
            name: 'Material Acquisition Notice',
            trigger_description: 'Acquisition over $10M',
            notification_deadline: null,
            notification_deadline_days: 5,
            required_content: 'Details of acquisition',
          },
        ]
      );

      expect(mockCreate).toHaveBeenCalled();
      expect(result.triggered_notifications).toHaveLength(1);
      expect(result.triggered_notifications[0].requirement_id).toBe('req-1');
    });

    it('handles API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API timeout'));

      await expect(
        compliance.analyzeBusinessEvent('Event description', [
          {
            id: 'req-1',
            facility_id: 'fac-1',
            facility_name: 'Test Facility',
            event_type: 'test',
            name: 'Test Requirement',
            trigger_description: null,
            notification_deadline: null,
            notification_deadline_days: null,
            required_content: null,
          },
        ])
      ).rejects.toThrow('API timeout');
    });

    it('handles malformed JSON response gracefully', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'Invalid JSON response',
          },
        ],
      });

      const result = await compliance.analyzeBusinessEvent('Test event', [
        {
          id: 'req-1',
          facility_id: 'fac-1',
          facility_name: 'Test Facility',
          event_type: 'test',
          name: 'Test Requirement',
          trigger_description: null,
          notification_deadline: null,
          notification_deadline_days: null,
          required_content: null,
        },
      ]);

      // Should return fallback response
      expect(result.triggered_notifications).toEqual([]);
      expect(result.risk_assessment).toContain('Unable to complete');
    });
  });

  describe('determineRiskLevel', () => {
    it('returns critical for high probability breaches', () => {
      // Based on DEFAULT_RISK_THRESHOLDS: high_threshold = 75
      const result = compliance.determineRiskLevel(85);
      expect(result).toBe('critical');
    });

    it('returns high for breach probability above medium threshold', () => {
      // Based on DEFAULT_RISK_THRESHOLDS: medium_threshold = 50
      const result = compliance.determineRiskLevel(65);
      expect(result).toBe('high');
    });

    it('returns medium for moderate probability breaches', () => {
      // Based on DEFAULT_RISK_THRESHOLDS: low_threshold = 25
      const result = compliance.determineRiskLevel(40);
      expect(result).toBe('medium');
    });

    it('returns low for minimal risk', () => {
      const result = compliance.determineRiskLevel(15);
      expect(result).toBe('low');
    });

    it('accepts custom thresholds', () => {
      const customThresholds: RiskThresholdConfig = {
        low_threshold: 20,
        medium_threshold: 40,
        high_threshold: 60,
        alert_on_critical_risk: true,
        alert_on_high_risk: true,
        alert_on_threshold_crossed: true,
      };

      // 55 should be high with custom thresholds (>= 40 but < 60)
      const result = compliance.determineRiskLevel(55, customThresholds);
      expect(result).toBe('high');
    });
  });

  describe('shouldGenerateAlert', () => {
    const createMockPrediction = (riskLevel: PredictionRiskLevel, probability: number): BreachPrediction => ({
      covenant_id: 'cov-1',
      prediction_date: '2025-01-15',
      breach_probability_2q: probability,
      breach_probability_3q: probability + 5,
      overall_risk_level: riskLevel,
      confidence_score: 80,
      projected_breach_quarter: riskLevel === 'critical' || riskLevel === 'high' ? 'Q2 2025' : null,
      contributing_factors: [],
      quarterly_projections: [],
      seasonal_patterns: [],
      recommendations: [],
      summary: 'Test summary',
    });

    it('returns true for critical risk when alert_on_critical_risk is enabled', () => {
      const prediction = createMockPrediction('critical', 85);
      const thresholds: RiskThresholdConfig = {
        low_threshold: 25,
        medium_threshold: 50,
        high_threshold: 75,
        alert_on_critical_risk: true,
        alert_on_high_risk: false,
        alert_on_threshold_crossed: false,
      };

      const result = compliance.shouldGenerateAlert(prediction, null, thresholds);
      expect(result.shouldAlert).toBe(true);
      expect(result.alertType).toBe('critical_risk');
    });

    it('returns true for high risk when alert_on_high_risk is enabled', () => {
      const prediction = createMockPrediction('high', 65);
      const thresholds: RiskThresholdConfig = {
        low_threshold: 25,
        medium_threshold: 50,
        high_threshold: 75,
        alert_on_critical_risk: false,
        alert_on_high_risk: true,
        alert_on_threshold_crossed: false,
      };

      const result = compliance.shouldGenerateAlert(prediction, null, thresholds);
      expect(result.shouldAlert).toBe(true);
      expect(result.alertType).toBe('high_risk');
    });

    it('returns true when risk level threshold is crossed', () => {
      const prediction = createMockPrediction('high', 65);
      const previousLevel: PredictionRiskLevel = 'medium';
      const thresholds: RiskThresholdConfig = {
        low_threshold: 25,
        medium_threshold: 50,
        high_threshold: 75,
        alert_on_critical_risk: false,
        alert_on_high_risk: false,
        alert_on_threshold_crossed: true,
      };

      const result = compliance.shouldGenerateAlert(prediction, previousLevel, thresholds);
      expect(result.shouldAlert).toBe(true);
      expect(result.alertType).toBe('threshold_crossed');
    });

    it('returns false when no alert conditions are met', () => {
      const prediction = createMockPrediction('medium', 40);
      const thresholds: RiskThresholdConfig = {
        low_threshold: 25,
        medium_threshold: 50,
        high_threshold: 75,
        alert_on_critical_risk: true,
        alert_on_high_risk: true,
        alert_on_threshold_crossed: true,
      };

      // Same risk level, not high or critical
      const result = compliance.shouldGenerateAlert(prediction, 'medium', thresholds);
      expect(result.shouldAlert).toBe(false);
      expect(result.alertType).toBe(null);
    });
  });

  describe('generatePredictionAlert', () => {
    const createMockPrediction = (riskLevel: PredictionRiskLevel, probability: number): BreachPrediction => ({
      covenant_id: 'cov-1',
      prediction_date: '2025-01-15',
      breach_probability_2q: probability,
      breach_probability_3q: probability + 5,
      overall_risk_level: riskLevel,
      confidence_score: 80,
      projected_breach_quarter: 'Q2 2025',
      contributing_factors: [],
      quarterly_projections: [],
      seasonal_patterns: [],
      recommendations: [],
      summary: 'Test summary',
    });

    it('generates high_risk alert with correct severity', () => {
      const prediction = createMockPrediction('high', 75);

      const result = compliance.generatePredictionAlert(
        prediction,
        'Maximum Leverage Ratio',
        'Apollo Credit Facility',
        'Apollo Holdings',
        'medium',
        'high_risk'
      );

      expect(result.alert_type).toBe('high_risk');
      expect(result.covenant_name).toBe('Maximum Leverage Ratio');
      expect(result.facility_name).toBe('Apollo Credit Facility');
      expect(result.covenant_id).toBe('cov-1');
      expect(result.current_risk_level).toBe('high');
      expect(result.previous_risk_level).toBe('medium');
      expect(result.message).toContain('High breach risk');
      expect(result.message).toContain('75%');
    });

    it('generates critical_risk alert', () => {
      const prediction = createMockPrediction('critical', 90);

      const result = compliance.generatePredictionAlert(
        prediction,
        'Interest Coverage Ratio',
        'Test Facility',
        'Test Borrower',
        'high',
        'critical_risk'
      );

      expect(result.alert_type).toBe('critical_risk');
      expect(result.message).toContain('CRITICAL');
      expect(result.message).toContain('90%');
    });

    it('generates threshold_crossed alert', () => {
      const prediction = createMockPrediction('high', 60);

      const result = compliance.generatePredictionAlert(
        prediction,
        'Debt Service Coverage',
        'Test Facility',
        'Test Borrower',
        'medium',
        'threshold_crossed'
      );

      expect(result.alert_type).toBe('threshold_crossed');
      expect(result.message).toContain('Risk level increased');
      expect(result.message).toContain('medium');
      expect(result.message).toContain('high');
    });

    it('includes all required alert properties', () => {
      const prediction = createMockPrediction('high', 70);

      const result = compliance.generatePredictionAlert(
        prediction,
        'Test Covenant',
        'Test Facility',
        'Test Borrower',
        null,
        'high_risk'
      );

      expect(result.id).toMatch(/^alert-cov-1-\d+$/);
      expect(result.covenant_id).toBe('cov-1');
      expect(result.covenant_name).toBe('Test Covenant');
      expect(result.facility_name).toBe('Test Facility');
      expect(result.borrower_name).toBe('Test Borrower');
      expect(result.breach_probability).toBe(70);
      expect(result.created_at).toBeDefined();
      expect(result.acknowledged).toBe(false);
    });
  });

  describe('draftNotificationLetter', () => {
    it('drafts notification letter based on event', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              subject: 'Notice of Material Acquisition - Apollo Holdings',
              content: 'Dear Administrative Agent,\n\nPursuant to Section 6.01 of the Credit Agreement...',
              recipients: ['Administrative Agent', 'Lenders'],
              suggested_attachments: ['Purchase Agreement', 'Financial Statements'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await compliance.draftNotificationLetter({
        event_type: 'material_acquisition',
        event_description: 'Apollo Holdings acquired XYZ Corp for $50 million',
        facility_name: 'Apollo Credit Facility',
        borrower_name: 'Apollo Holdings',
        requirement_name: 'Material Acquisition Notice',
        trigger_description: 'Acquisition over $10M',
        required_content: 'Details of acquisition',
        recipient_roles: ['Administrative Agent', 'Lenders'],
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.subject).toContain('Acquisition');
      expect(result.recipients.length).toBeGreaterThan(0);
    });

    it('returns fallback on malformed response', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'not valid json',
          },
        ],
      });

      const result = await compliance.draftNotificationLetter({
        event_type: 'test_event',
        event_description: 'Test event',
        facility_name: 'Test Facility',
        borrower_name: 'Test Borrower',
        requirement_name: 'Test Requirement',
        trigger_description: null,
        required_content: null,
        recipient_roles: ['Agent'],
      });

      expect(result.subject).toContain('test_event');
      expect(result.content).toContain('Error');
    });
  });

  describe('interpretCovenant', () => {
    it('interprets covenant calculation requirements', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              calculation_steps: [
                'Calculate Total Debt from balance sheet',
                'Calculate trailing 12-month EBITDA',
                'Divide Total Debt by EBITDA',
              ],
              key_considerations: [
                'Exclude non-recourse debt',
                'Add back non-cash charges to EBITDA',
              ],
              common_adjustments: [
                'Pro forma adjustments for acquisitions',
                'Run-rate synergies',
              ],
              potential_issues: [
                'Definition of Consolidated EBITDA may differ from standard',
              ],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await compliance.interpretCovenant({
        covenant_name: 'Maximum Total Leverage Ratio',
        covenant_type: 'leverage_ratio',
        numerator_definition: 'Total Debt',
        denominator_definition: 'Consolidated EBITDA',
        formula_description: 'Total Debt / EBITDA <= 4.50x',
        threshold_type: 'maximum',
        current_threshold: 4.5,
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.calculation_steps.length).toBeGreaterThan(0);
      expect(result.key_considerations.length).toBeGreaterThan(0);
    });
  });

  describe('answerComplianceQuestion', () => {
    it('answers compliance questions using RAG', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              answer: 'Based on Section 6.01(a), financial statements must be delivered within 45 days of quarter end.',
              confidence: 0.92,
              sources: ['Credit Agreement Section 6.01(a)'],
              follow_up_questions: ['Are there any extensions available?'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await compliance.answerComplianceQuestion({
        question: 'When are quarterly financials due?',
        facility_context: 'Apollo Credit Facility - Senior Secured Term Loan',
        document_excerpts: ['Section 6.01(a): Quarterly statements within 45 days...'],
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.answer).toContain('45 days');
      expect(result.confidence).toBeGreaterThan(0.9);
    });
  });

  describe('analyzeCovenantHeadroom', () => {
    it('handles empty test history', async () => {
      const result = await compliance.analyzeCovenantHeadroom(
        'Leverage Ratio',
        'leverage_ratio',
        'maximum',
        4.5,
        []
      );

      expect(result.recommendations).toContain('No historical test data available. Submit covenant tests to enable trend analysis.');
    });

    it('analyzes headroom trends', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              current_headroom_percentage: 15,
              trend: 'declining',
              risk_level: 'medium',
              projected_breach_quarter: 'Q3 2025',
              recommendations: ['Monitor closely', 'Prepare waiver request'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await compliance.analyzeCovenantHeadroom(
        'Leverage Ratio',
        'leverage_ratio',
        'maximum',
        4.5,
        [
          { test_date: '2024-03-31', calculated_ratio: 3.8, headroom_percentage: 15.5 },
          { test_date: '2024-06-30', calculated_ratio: 3.9, headroom_percentage: 13.3 },
          { test_date: '2024-09-30', calculated_ratio: 4.0, headroom_percentage: 11.1 },
        ]
      );

      expect(mockCreate).toHaveBeenCalled();
      expect(result.trend).toBe('declining');
      expect(result.risk_level).toBe('medium');
    });
  });
});
