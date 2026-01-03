// @ts-nocheck
/**
 * Autopilot Intervention Module Tests
 *
 * Tests for the AI-powered intervention generation system.
 * Uses mocked Claude API responses to test:
 * - Intervention plan generation
 * - Escalation analysis
 * - Stakeholder notification generation
 * - Intervention prioritization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as intervention from './autopilot-intervention';
import type { InterventionGenerationInput } from './autopilot-intervention';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('autopilot-intervention module', () => {
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
    breachProbability: 70,
    daysUntilBreach: 30,
    riskLevel: 'high' as const,
    impactSeverity: 'significant' as const,
    trend: 'deteriorating' as const,
    trendRate: -0.1,
    currentValue: 4.4,
    threshold: 4.5,
    headroomPercent: 2.2,
    cascadeRisk: true,
    aiSummary: 'High risk of leverage breach within 30 days due to EBITDA compression',
    contributingFactors: [
      {
        factor: 'Revenue decline',
        category: 'operational',
        description: 'Q4 revenue 15% below forecast',
        impact: 'high' as const,
        weight: 0.6,
      },
    ],
    leadingIndicators: [
      {
        name: 'Cash conversion',
        status: 'warning' as const,
        value: 0.75,
        threshold: 0.85,
        description: 'Below target',
      },
    ],
    recommendedActions: ['Engage borrower', 'Prepare waiver options'],
    lastUpdated: new Date().toISOString(),
  };

  const mockInterventionInput: InterventionGenerationInput = {
    prediction: mockBreachPrediction,
    portfolioContext: {
      totalExposure: 500000000,
      relationshipLength: 8,
      previousWaivers: 1,
      creditRating: 'BB',
      lenderSentiment: 'neutral',
    },
  };

  describe('generateInterventionPlan', () => {
    it('generates comprehensive intervention plan', async () => {
      const mockPlan = {
        primaryIntervention: {
          type: 'borrower_call',
          priority: 'high',
          title: 'Executive Engagement Call',
          description: 'Schedule call with CFO and CEO to discuss situation',
          rationale: 'Early senior engagement critical given breach proximity',
          suggestedAction: 'Request call within 48 hours',
          actionDetails: {
            callType: 'executive_review',
            proposedDate: '2025-01-22',
            duration: '60 minutes',
            participants: ['CEO', 'CFO', 'Relationship Manager', 'Credit Officer'],
          },
          optimalTiming: 'Within 48 hours',
          deadlineDays: 2,
          expectedOutcome: 'Clear understanding of borrower remediation plans',
          successProbability: 85,
          risks: ['Borrower may be defensive', 'May escalate tensions'],
        },
        alternativeInterventions: [
          {
            type: 'waiver_request',
            priority: 'medium',
            title: 'Prepare Waiver Documentation',
            description: 'Draft waiver request for potential covenant relief',
            rationale: 'Have documentation ready if call indicates need',
            suggestedAction: 'Draft waiver terms',
            actionDetails: {},
            optimalTiming: 'Parallel to call preparation',
            deadlineDays: 5,
            expectedOutcome: 'Ready for formal process if needed',
            successProbability: 70,
            risks: ['May be premature'],
          },
        ],
        rationale: 'Direct engagement preferred given long relationship and single prior waiver',
        sequencing: 'Execute borrower call first, then determine if waiver needed',
        riskAssessment: 'Medium risk - early action improves outcomes',
        successProbability: 75,
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockPlan);

      const result = await intervention.generateInterventionPlan(mockInterventionInput);

      expect(result.primaryIntervention.type).toBe('borrower_call');
      expect(result.primaryIntervention.priority).toBe('high');
      expect(result.alternativeInterventions).toHaveLength(1);
      expect(result.successProbability).toBe(75);
    });

    it('respects intervention constraints', async () => {
      const inputWithConstraints: InterventionGenerationInput = {
        ...mockInterventionInput,
        constraints: {
          maxInterventions: 2,
          excludeTypes: ['amendment_draft'],
          urgencyOverride: 'urgent',
        },
      };

      mockGenerateStructuredOutput.mockResolvedValue({
        primaryIntervention: { type: 'borrower_call', priority: 'urgent' },
        alternativeInterventions: [{ type: 'waiver_request', priority: 'high' }],
        rationale: 'Urgent override applied',
        sequencing: 'Immediate action',
        riskAssessment: 'High urgency situation',
        successProbability: 70,
      });

      await intervention.generateInterventionPlan(inputWithConstraints);

      expect(mockGenerateStructuredOutput).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Excluded Types: amendment_draft'),
        expect.any(Object)
      );
    });
  });

  describe('analyzeEscalationNeed', () => {
    it('recommends escalation for critical risk', async () => {
      const mockAnalysis = {
        shouldEscalate: true,
        currentLevel: 'engagement' as const,
        recommendedLevel: 'restructuring' as const,
        escalationTriggers: [
          'Breach probability exceeds 75%',
          'Cascade risk identified',
          'Deteriorating trend persists',
        ],
        timeToEscalation: 14,
        escalationActions: [
          'Engage restructuring team',
          'Notify credit committee',
          'Prepare contingency plans',
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockAnalysis);

      const result = await intervention.analyzeEscalationNeed(
        mockBreachPrediction,
        'engagement'
      );

      expect(result.shouldEscalate).toBe(true);
      expect(result.recommendedLevel).toBe('restructuring');
      expect(result.escalationTriggers.length).toBeGreaterThan(0);
    });

    it('does not escalate when not needed', async () => {
      const lowRiskPrediction = {
        ...mockBreachPrediction,
        breachProbability: 25,
        riskLevel: 'low' as const,
        cascadeRisk: false,
      };

      mockGenerateStructuredOutput.mockResolvedValue({
        shouldEscalate: false,
        currentLevel: 'monitoring',
        recommendedLevel: 'monitoring',
        escalationTriggers: [],
        timeToEscalation: 90,
        escalationActions: ['Continue standard monitoring'],
      });

      const result = await intervention.analyzeEscalationNeed(
        lowRiskPrediction,
        'monitoring'
      );

      expect(result.shouldEscalate).toBe(false);
      expect(result.currentLevel).toBe(result.recommendedLevel);
    });
  });

  describe('generateStakeholderNotification', () => {
    const mockIntervention = {
      id: 'int-1',
      predictionId: 'pred-1',
      type: 'borrower_call' as const,
      status: 'pending' as const,
      priority: 'high' as const,
      title: 'Executive Engagement',
      description: 'Call with CFO',
      rationale: 'Early engagement critical',
      borrowerId: 'bor-1',
      borrowerName: 'Apollo Holdings',
      facilityId: 'fac-1',
      facilityName: 'Apollo Credit Facility',
      suggestedAction: 'Schedule call',
      actionDetails: {},
      optimalTiming: '48 hours',
      deadlineDate: '2025-01-22',
      requiresApproval: true,
      expectedOutcome: 'Clear visibility',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('generates internal notification', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        subject: 'Action Required: Apollo Holdings - Covenant Risk',
        summary: 'High probability of leverage breach requires executive engagement.',
        body: 'Based on current projections, Apollo Holdings shows 70% probability of breaching the Maximum Leverage Ratio covenant within 30 days. Immediate executive engagement is recommended.',
        callToAction: 'Please review and approve the proposed intervention by EOD.',
        urgency: 'action_required',
      });

      const result = await intervention.generateStakeholderNotification(
        mockBreachPrediction,
        mockIntervention,
        'internal'
      );

      expect(result.subject).toContain('Apollo Holdings');
      expect(result.urgency).toBe('action_required');
    });

    it('generates borrower-appropriate communication', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        subject: 'Apollo Holdings - Quarterly Review Discussion',
        summary: 'We would like to schedule a discussion regarding your facility.',
        body: 'Dear Apollo Holdings team, We would like to arrange a discussion to review recent performance and discuss the outlook for the coming quarters.',
        callToAction: 'Please confirm your availability for a call next week.',
        urgency: 'informational',
      });

      const result = await intervention.generateStakeholderNotification(
        mockBreachPrediction,
        mockIntervention,
        'borrower'
      );

      expect(result.urgency).toBe('informational');
      expect(result.body).not.toContain('breach');
    });

    it('generates syndicate notification', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        subject: 'Notice: Apollo Holdings - Credit Update',
        summary: 'Update on Apollo Holdings credit situation.',
        body: 'This notice is to inform syndicate members of developing credit concerns regarding Apollo Holdings.',
        callToAction: 'No action required at this time - monitoring update.',
        urgency: 'informational',
      });

      const result = await intervention.generateStakeholderNotification(
        mockBreachPrediction,
        mockIntervention,
        'syndicate'
      );

      expect(result.subject).toContain('Credit Update');
    });
  });

  describe('prioritizeInterventions', () => {
    it('prioritizes based on urgency and resources', async () => {
      const interventions = [
        {
          type: 'borrower_call',
          priority: 'high',
          title: 'CFO Call',
          successProbability: 85,
          deadlineDays: 2,
          expectedOutcome: 'Clear visibility',
        },
        {
          type: 'waiver_request',
          priority: 'medium',
          title: 'Draft Waiver',
          successProbability: 70,
          deadlineDays: 7,
          expectedOutcome: 'Prepared documentation',
        },
        {
          type: 'compliance_reminder',
          priority: 'low',
          title: 'Reporting Reminder',
          successProbability: 95,
          deadlineDays: 14,
          expectedOutcome: 'Timely reporting',
        },
      ];

      mockGenerateStructuredOutput.mockResolvedValue({
        prioritized: [
          { intervention: interventions[0], score: 92, rank: 1, reasoning: 'Highest urgency' },
          { intervention: interventions[1], score: 78, rank: 2, reasoning: 'Important preparation' },
        ],
        excluded: [
          { intervention: interventions[2], reason: 'Lower priority given resource constraints' },
        ],
        sequencing: 'Execute CFO call first, then draft waiver in parallel',
      });

      const result = await intervention.prioritizeInterventions(
        interventions as any,
        {
          maxSimultaneous: 2,
          availableResources: 'moderate',
          urgencyBias: 0.7,
        }
      );

      expect(result.prioritized).toHaveLength(2);
      expect(result.prioritized[0].rank).toBe(1);
      expect(result.excluded).toHaveLength(1);
    });
  });

  describe('createInterventionFromGenerated', () => {
    it('converts generated intervention to full type', () => {
      const generated = {
        type: 'borrower_call' as const,
        priority: 'high' as const,
        title: 'Executive Call',
        description: 'Schedule call with CFO',
        rationale: 'Early engagement needed',
        suggestedAction: 'Request call within 48 hours',
        actionDetails: { callType: 'executive' },
        optimalTiming: 'Within 48 hours',
        deadlineDays: 3,
        expectedOutcome: 'Clear understanding',
        successProbability: 80,
        risks: ['May be defensive'],
      };

      const result = intervention.createInterventionFromGenerated(
        generated,
        mockBreachPrediction
      );

      expect(result.predictionId).toBe('pred-1');
      expect(result.status).toBe('pending');
      expect(result.borrowerId).toBe('bor-1');
      expect(result.facilityId).toBe('fac-1');
      expect(result.requiresApproval).toBe(false); // borrower_call with high priority
    });

    it('sets requiresApproval for sensitive types', () => {
      const generated = {
        type: 'waiver_request' as const,
        priority: 'medium' as const,
        title: 'Waiver Request',
        description: 'Request covenant relief',
        rationale: 'Prevent technical breach',
        suggestedAction: 'Submit waiver',
        actionDetails: {},
        optimalTiming: 'Within 1 week',
        deadlineDays: 7,
        expectedOutcome: 'Temporary relief',
        successProbability: 65,
        risks: ['May require amendment'],
      };

      const result = intervention.createInterventionFromGenerated(
        generated,
        mockBreachPrediction
      );

      expect(result.requiresApproval).toBe(true);
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('Network error'));

      await expect(
        intervention.generateInterventionPlan(mockInterventionInput)
      ).rejects.toThrow('Network error');
    });
  });
});
