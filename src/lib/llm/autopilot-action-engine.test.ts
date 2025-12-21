/**
 * Autopilot Action Engine Module Tests
 *
 * Tests for the AI-powered action generation and confidence scoring.
 * Uses mocked Claude API responses to test:
 * - Portfolio action generation
 * - Confidence score calculation
 * - Auto-approval evaluation
 * - Action prioritization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as actionEngine from './autopilot-action-engine';
import type { ActionGenerationContext, ConfidenceEvaluationInput } from './autopilot-action-engine';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('autopilot-action-engine module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockBreachPrediction = {
    id: 'pred-1',
    borrowerId: 'bor-1',
    borrowerName: 'Apollo Holdings',
    facilityId: 'fac-1',
    facilityName: 'Apollo Credit Facility',
    covenantId: 'cov-1',
    covenantName: 'Maximum Leverage Ratio',
    covenantType: 'leverage_ratio',
    breachProbability: 65,
    daysUntilBreach: 45,
    riskLevel: 'high' as const,
    impactSeverity: 'significant' as const,
    trend: 'deteriorating' as const,
    trendRate: -0.08,
    currentValue: 4.35,
    threshold: 4.5,
    headroomPercent: 3.3,
    cascadeRisk: true,
    aiSummary: 'High risk of leverage breach within 45 days',
    contributingFactors: [
      {
        factor: 'EBITDA decline',
        category: 'operational',
        description: 'Revenue shortfall impacting EBITDA',
        impact: 'high' as const,
        weight: 0.5,
      },
    ],
    leadingIndicators: [],
    recommendedActions: ['Engage borrower', 'Review options'],
    lastUpdated: new Date().toISOString(),
  };

  const mockActionContext: ActionGenerationContext = {
    prediction: mockBreachPrediction,
    portfolioContext: {
      totalExposure: 500000000,
      relationshipLength: 5,
      previousWaivers: 1,
      creditRating: 'BB',
      lenderSentiment: 'neutral',
    },
    marketContext: {
      rateEnvironment: 'rising',
      creditConditions: 'tight',
      sectorOutlook: 'negative',
    },
  };

  describe('generatePortfolioActions', () => {
    it('generates actions based on breach prediction', async () => {
      const mockActions = {
        actions: [
          {
            type: 'borrower_call',
            title: 'Schedule CFO Discussion',
            description: 'Arrange call with CFO to discuss leverage trajectory',
            rationale: 'Early engagement allows proactive problem-solving',
            suggestedAction: 'Call CFO within 48 hours',
            actionDetails: {
              callType: 'relationship_check',
              participants: ['CFO', 'Relationship Manager'],
              agendaItems: ['Leverage trajectory', 'Remediation options'],
            },
            confidenceScore: 85,
            confidenceFactors: [],
            optimalTiming: 'Within 48 hours',
            urgency: 'today',
            deadlineDays: 2,
            borrowerId: 'bor-1',
            borrowerName: 'Apollo Holdings',
            facilityId: 'fac-1',
            facilityName: 'Apollo Credit Facility',
            expectedOutcome: 'Better visibility on borrower plans',
            successProbability: 80,
            potentialRisks: ['Borrower may be defensive'],
            prerequisites: ['Review recent financials'],
            followUpActions: ['Document call notes', 'Update risk assessment'],
          },
          {
            type: 'amendment_draft',
            title: 'Prepare Amendment Discussion Points',
            description: 'Draft potential covenant relief terms',
            rationale: 'Be prepared if amendment discussion needed',
            suggestedAction: 'Draft amendment term sheet',
            actionDetails: {},
            confidenceScore: 75,
            confidenceFactors: [],
            optimalTiming: 'This week',
            urgency: 'this_week',
            deadlineDays: 7,
            borrowerId: 'bor-1',
            borrowerName: 'Apollo Holdings',
            facilityId: 'fac-1',
            facilityName: 'Apollo Credit Facility',
            expectedOutcome: 'Ready for formal discussions',
            successProbability: 70,
            potentialRisks: ['May be premature'],
            prerequisites: ['CFO call completed'],
            followUpActions: ['Review with credit committee'],
          },
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockActions);

      const result = await actionEngine.generatePortfolioActions(mockActionContext);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('borrower_call');
      expect(result[0].confidenceScore).toBe(85);
      expect(result[1].type).toBe('amendment_draft');
    });

    it('respects action constraints', async () => {
      const contextWithConstraints: ActionGenerationContext = {
        ...mockActionContext,
        constraints: {
          maxActions: 2,
          excludeTypes: ['amendment_draft'],
          urgencyFilter: 'urgent_only',
        },
      };

      mockGenerateStructuredOutput.mockResolvedValue({
        actions: [
          {
            type: 'borrower_call',
            title: 'Urgent CFO Call',
            urgency: 'immediate',
            confidenceScore: 90,
            // ... other fields
          },
        ],
      });

      const result = await actionEngine.generatePortfolioActions(contextWithConstraints);

      expect(mockGenerateStructuredOutput).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Excluded Types: amendment_draft'),
        expect.any(Object)
      );
    });
  });

  describe('calculateConfidenceScore', () => {
    it('calculates weighted confidence score', async () => {
      const mockAction = {
        type: 'borrower_call',
        title: 'Schedule Discussion',
        description: 'Call with CFO',
        urgency: 'today',
        expectedOutcome: 'Better visibility',
        potentialRisks: ['Borrower defensive'],
      };

      const mockInput: ConfidenceEvaluationInput = {
        action: mockAction as any,
        historicalData: {
          similarActionsCount: 25,
          successRate: 0.82,
          avgEffectivenessScore: 78,
        },
        ruleBasedFactors: {
          timingAppropriate: true,
          resourcesAvailable: true,
          noConflicts: true,
        },
      };

      const mockConfidence = {
        overallScore: 84,
        factors: [
          {
            factor: 'Historical Success Rate',
            score: 82,
            weight: 0.35,
            explanation: 'Similar actions succeeded 82% of the time',
            source: 'historical' as const,
          },
          {
            factor: 'Timing Appropriateness',
            score: 90,
            weight: 0.25,
            explanation: 'Action timing aligns with best practices',
            source: 'rule' as const,
          },
          {
            factor: 'Resource Availability',
            score: 85,
            weight: 0.2,
            explanation: 'Adequate resources available',
            source: 'rule' as const,
          },
          {
            factor: 'Model Prediction',
            score: 80,
            weight: 0.2,
            explanation: 'AI model predicts good outcome',
            source: 'model' as const,
          },
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockConfidence);

      const result = await actionEngine.calculateConfidenceScore(mockInput);

      expect(result.confidenceScore).toBe(84);
      expect(result.factors).toHaveLength(4);
      expect(result.factors[0].source).toBe('historical');
    });
  });

  describe('evaluateAutoApproval', () => {
    const mockThresholds = {
      globalThreshold: 75,
      typeThresholds: {
        borrower_call: 70,
        compliance_reminder: 60,
        amendment_draft: 90,
        waiver_request: 95,
      },
      impactThresholds: {
        low: 60,
        medium: 70,
        high: 80,
        critical: 90,
      },
      riskFactors: {
        alwaysRequireApproval: ['waiver_request'],
        requiresLegalReview: ['amendment_draft'],
        requiresComplianceReview: ['waiver_request'],
      },
    };

    it('approves action meeting threshold criteria', () => {
      const mockAction = {
        type: 'borrower_call',
        urgency: 'this_week',
        // other fields...
      };

      const result = actionEngine.evaluateAutoApproval(
        mockAction as any,
        85,
        mockThresholds as any
      );

      expect(result.isEligible).toBe(true);
      expect(result.recommendation).toBe('auto_approve');
      expect(result.blockers).toHaveLength(0);
    });

    it('blocks action below threshold', () => {
      const mockAction = {
        type: 'borrower_call',
        urgency: 'today',
      };

      const result = actionEngine.evaluateAutoApproval(
        mockAction as any,
        65,
        mockThresholds as any
      );

      expect(result.isEligible).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
      expect(result.recommendation).toBe('require_review');
    });

    it('blocks types that always require approval', () => {
      const mockAction = {
        type: 'waiver_request',
        urgency: 'this_week',
      };

      const result = actionEngine.evaluateAutoApproval(
        mockAction as any,
        98,
        mockThresholds as any
      );

      expect(result.isEligible).toBe(false);
      expect(result.blockers.some(b => b.includes('always require manual approval'))).toBe(true);
    });

    it('blocks types requiring legal review', () => {
      const mockAction = {
        type: 'amendment_draft',
        urgency: 'this_week',
      };

      const result = actionEngine.evaluateAutoApproval(
        mockAction as any,
        92,
        mockThresholds as any
      );

      expect(result.isEligible).toBe(false);
      expect(result.blockers.some(b => b.includes('legal review'))).toBe(true);
    });

    it('escalates low confidence urgent actions', () => {
      const mockAction = {
        type: 'borrower_call',
        urgency: 'immediate',
      };

      const result = actionEngine.evaluateAutoApproval(
        mockAction as any,
        45,
        mockThresholds as any
      );

      expect(result.recommendation).toBe('escalate');
    });
  });

  describe('createQueueItem', () => {
    it('creates queue item with correct properties', () => {
      const mockAction = {
        type: 'borrower_call',
        urgency: 'today',
      };

      const mockDecision = {
        isEligible: true,
        effectiveThreshold: 70,
        confidenceScore: 85,
        blockers: [],
        recommendation: 'auto_approve' as const,
        reasoning: 'Meets criteria',
      };

      const result = actionEngine.createQueueItem(
        mockAction as any,
        85,
        [],
        mockDecision
      );

      expect(result.confidenceScore).toBe(85);
      expect(result.status).toBe('auto_approved');
      expect(result.executionMode).toBe('auto');
      expect(result.requiresHumanReview).toBe(false);
      expect(result.estimatedImpact).toBe('high');
    });

    it('creates pending review item for non-eligible actions', () => {
      const mockAction = {
        type: 'amendment_draft',
        urgency: 'this_week',
      };

      const mockDecision = {
        isEligible: false,
        effectiveThreshold: 90,
        confidenceScore: 75,
        blockers: ['Below threshold'],
        recommendation: 'require_review' as const,
        reasoning: 'Needs review',
      };

      const result = actionEngine.createQueueItem(
        mockAction as any,
        75,
        [],
        mockDecision
      );

      expect(result.status).toBe('pending_review');
      expect(result.executionMode).toBe('hybrid');
      expect(result.requiresHumanReview).toBe(true);
    });
  });

  describe('prioritizeActions', () => {
    it('prioritizes actions based on urgency and resources', async () => {
      const mockActions = [
        {
          type: 'borrower_call',
          title: 'Action 1',
          urgency: 'immediate',
          confidenceScore: 90,
          successProbability: 85,
          expectedOutcome: 'Good outcome',
        },
        {
          type: 'compliance_reminder',
          title: 'Action 2',
          urgency: 'this_week',
          confidenceScore: 80,
          successProbability: 90,
          expectedOutcome: 'Good outcome',
        },
        {
          type: 'document_request',
          title: 'Action 3',
          urgency: 'this_month',
          confidenceScore: 70,
          successProbability: 75,
          expectedOutcome: 'Fair outcome',
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue({
        prioritized: [
          { actionIndex: 0, score: 95, rank: 1, reasoning: 'Most urgent' },
          { actionIndex: 1, score: 80, rank: 2, reasoning: 'Important but less urgent' },
        ],
        excludedIndices: [
          { index: 2, reason: 'Resource constraints' },
        ],
        sequencing: 'Execute Action 1 immediately, then Action 2 within the week',
      });

      const result = await actionEngine.prioritizeActions(
        mockActions as any,
        {
          maxSimultaneous: 2,
          availableResources: 'limited',
          urgencyBias: 0.8,
        }
      );

      expect(result.prioritized).toHaveLength(2);
      expect(result.prioritized[0].rank).toBe(1);
      expect(result.excluded).toHaveLength(1);
      expect(result.sequencing).toContain('Execute Action 1');
    });
  });

  describe('error handling', () => {
    it('handles API errors in action generation', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('Service unavailable'));

      await expect(
        actionEngine.generatePortfolioActions(mockActionContext)
      ).rejects.toThrow('Service unavailable');
    });
  });
});
