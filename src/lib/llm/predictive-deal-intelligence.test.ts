/**
 * Predictive Deal Intelligence Module Tests
 *
 * Tests for the deal prediction and negotiation strategy LLM functions.
 * Uses mocked Claude API responses to test:
 * - Deal intelligence narrative generation
 * - Negotiation playbook generation
 * - Counterparty brief generation
 * - Term optimization advice
 * - Market insight explanation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as dealIntelligence from './predictive-deal-intelligence';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput, generateCompletion } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);
const mockGenerateCompletion = vi.mocked(generateCompletion);

describe('predictive-deal-intelligence module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockDealPrediction = {
    dealId: 'deal-1',
    predictions: {
      closingProbability: 0.78,
      estimatedClosingDays: 45,
      estimatedRounds: 3,
      likelyStickingPoints: [
        {
          termKey: 'margin',
          termLabel: 'Initial Margin',
          probability: 0.75,
          reason: 'Borrower seeking aggressive pricing',
          suggestedApproach: 'Offer margin grid structure',
          historicalResolution: {
            avgRoundsToResolve: 2,
            commonCompromises: ['Margin step-downs', 'Grid structures'],
          },
        },
        {
          termKey: 'leverage',
          termLabel: 'Leverage Covenant',
          probability: 0.6,
          reason: 'Covenant flexibility concerns',
          suggestedApproach: 'Propose seasonal adjustments',
          historicalResolution: {
            avgRoundsToResolve: 2,
            commonCompromises: ['Headroom increase', 'Step-downs'],
          },
        },
      ],
      recommendedStrategies: [
        {
          id: 'strat-1',
          name: 'Anchor High Strategy',
          description: 'Start with aggressive terms to create negotiation room',
          applicability: 85,
          expectedOutcome: {
            closingTimeDelta: -5,
            successProbabilityDelta: 0.05,
          },
          supportingEvidence: {
            similarDeals: 15,
            successRate: 0.8,
          },
        },
      ],
      optimalTermStructure: {
        terms: [
          {
            termKey: 'margin',
            termLabel: 'Initial Margin',
            suggestedValue: 325,
            acceptanceProbability: 0.75,
            marketPercentile: 60,
          },
        ],
      },
    },
    confidence: 0.82,
    modelVersion: 'v2.1',
    generatedAt: new Date().toISOString(),
  };

  describe('generateDealIntelligenceNarrative', () => {
    it('generates comprehensive deal narrative', async () => {
      const mockNarrative = {
        executiveSummary: 'Apollo Credit Facility shows strong closing probability at 78% with an estimated 45-day timeline.',
        keyFindings: [
          'Margin negotiation expected to be primary sticking point',
          'Leverage covenant flexibility likely to be discussed',
          'Market conditions favor borrower positioning',
        ],
        strategicRecommendations: [
          'Lead with margin grid structure proposal',
          'Prepare covenant package with seasonal adjustments',
          'Engage senior sponsor early in process',
          'Consider early commitment fee incentive',
        ],
        riskAssessment: {
          level: 'medium',
          factors: ['Competitive market environment', 'Borrower has alternatives'],
          mitigations: ['Build relationship value', 'Offer flexible structure'],
        },
        timeline: {
          estimatedClose: 'Mid-February 2025',
          criticalMilestones: [
            { milestone: 'Term sheet agreement', target: 'Week 2' },
            { milestone: 'Credit approval', target: 'Week 4' },
            { milestone: 'Documentation', target: 'Week 6' },
          ],
        },
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockNarrative);

      const result = await dealIntelligence.generateDealIntelligenceNarrative(
        mockDealPrediction as any,
        {
          dealName: 'Apollo Credit Facility',
          dealType: 'Term Loan B',
          totalValue: 500000000,
          participants: ['Apollo Holdings', 'Agent Bank', 'Syndicate'],
        }
      );

      expect(result.executiveSummary).toContain('78%');
      expect(result.keyFindings).toHaveLength(3);
      expect(result.strategicRecommendations.length).toBeGreaterThan(0);
      expect(result.riskAssessment.level).toBe('medium');
      expect(result.timeline.criticalMilestones.length).toBeGreaterThan(0);
    });
  });

  describe('generateNegotiationPlaybook', () => {
    it('generates tactical negotiation playbook', async () => {
      const mockPlaybook = {
        overview: 'Balanced approach focusing on relationship preservation while achieving key commercial terms.',
        phases: [
          {
            name: 'Opening Phase',
            objective: 'Establish anchors on key terms',
            tactics: ['Present comprehensive term sheet', 'Highlight market positioning'],
            expectedOutcome: 'Clear starting positions established',
            duration: '1 week',
          },
          {
            name: 'Negotiation Phase',
            objective: 'Work through sticking points',
            tactics: ['Address margin first', 'Package covenant discussions'],
            expectedOutcome: 'Resolution on 80% of terms',
            duration: '2 weeks',
          },
          {
            name: 'Closing Phase',
            objective: 'Finalize documentation',
            tactics: ['Fast-track documentation', 'Parallel credit approval'],
            expectedOutcome: 'Signed agreement',
            duration: '2 weeks',
          },
        ],
        redLines: [
          'Minimum margin floor of 275bps',
          'Maximum leverage covenant of 5.00x',
        ],
        fallbackPositions: [
          { term: 'Initial Margin', initial: '350bps', fallback: '300bps with grid' },
          { term: 'Leverage Covenant', initial: '4.50x', fallback: '4.75x with step-down' },
        ],
        closingStrategy: 'Offer minor concession on maturity extension to secure final agreement.',
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockPlaybook);

      const result = await dealIntelligence.generateNegotiationPlaybook(
        mockDealPrediction as any,
        {
          dealName: 'Apollo Credit Facility',
          dealType: 'Term Loan B',
          priority: 'balanced',
        }
      );

      expect(result.phases).toHaveLength(3);
      expect(result.redLines.length).toBeGreaterThan(0);
      expect(result.fallbackPositions.length).toBeGreaterThan(0);
      expect(result.closingStrategy).toBeDefined();
    });
  });

  describe('generateCounterpartyBrief', () => {
    const mockCounterpartyInsight = {
      counterpartyId: 'cp-1',
      counterpartyName: 'Apollo Holdings',
      insights: {
        typicalAcceptanceRounds: 3,
        negotiationStyle: 'collaborative',
        historicalPatterns: [
          'Usually requests margin reduction in second round',
          'Flexible on covenant structure if pricing achieved',
        ],
        preferredTerms: [
          { termKey: 'margin', preferredRange: '275-325bps' },
          { termKey: 'maturity', preferredRange: '5-7 years' },
        ],
      },
      recommendation: 'Lead with flexible covenant structure',
      confidence: 0.85,
    };

    it('generates counterparty intelligence brief', async () => {
      const mockBrief = {
        organizationProfile: 'Apollo Holdings is a mid-market manufacturing company with strong market position.',
        negotiationDNA: {
          style: 'Collaborative but price-focused',
          pacePreference: 'Moderate pace with thorough due diligence',
          decisionMakers: 'CFO leads with Board approval for final terms',
          sensitiveTopics: ['Covenant flexibility', 'Reporting requirements'],
        },
        historicalInsights: [
          'Previous deals closed within 60 days',
          'Usually requests margin reduction in round 2',
          'Values relationship stability over marginal pricing gains',
        ],
        approachRecommendation: 'Lead with covenant flexibility offer to build goodwill, then negotiate pricing.',
        watchOuts: [
          'CFO sensitive to covenant language specifics',
          'May escalate if pace feels rushed',
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockBrief);

      const result = await dealIntelligence.generateCounterpartyBrief(
        mockCounterpartyInsight as any,
        {
          dealHistory: 3,
          lastInteraction: '2024-06-15',
          knownPreferences: ['Flexible covenants', 'Long maturity'],
        }
      );

      expect(result.organizationProfile).toBeDefined();
      expect(result.negotiationDNA.style).toBeDefined();
      expect(result.historicalInsights.length).toBeGreaterThan(0);
      expect(result.watchOuts.length).toBeGreaterThan(0);
    });
  });

  describe('generateTermOptimizationAdvice', () => {
    it('generates optimization advice for specific term', async () => {
      const mockAdvice = {
        termKey: 'margin',
        currentAssessment: 'Current margin of 300bps is at market median.',
        marketPosition: 'Positioned at 50th percentile - room to optimize.',
        optimizationPath: {
          aggressive: {
            value: '275bps',
            rationale: 'Push for best-in-class pricing given relationship',
            risk: 'May extend timeline by 1-2 weeks',
          },
          moderate: {
            value: '290bps',
            rationale: 'Slight improvement while maintaining momentum',
            risk: 'Minimal - likely acceptable',
          },
          conservative: {
            value: '300bps',
            rationale: 'Accept current terms to expedite closing',
            risk: 'May leave value on table',
          },
        },
        negotiationScript: 'Given our long relationship and credit quality, we believe 290bps reflects fair value.',
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockAdvice);

      const result = await dealIntelligence.generateTermOptimizationAdvice(
        {
          termKey: 'margin',
          currentValue: 300,
          suggestedValue: 290,
          marketPercentile: 50,
        },
        {
          dealType: 'Term Loan B',
          counterpartyStyle: 'collaborative',
          priority: 'balanced',
        }
      );

      expect(result.termKey).toBe('margin');
      expect(result.optimizationPath.aggressive).toBeDefined();
      expect(result.optimizationPath.moderate).toBeDefined();
      expect(result.optimizationPath.conservative).toBeDefined();
      expect(result.negotiationScript).toBeDefined();
    });
  });

  describe('explainMarketInsight', () => {
    it('generates natural language explanation', async () => {
      mockGenerateCompletion.mockResolvedValue(
        'Credit spreads have tightened 25bps over the past quarter, creating a favorable environment for borrowers. This suggests pricing discussions should reflect current market conditions rather than historical averages.'
      );

      const result = await dealIntelligence.explainMarketInsight({
        id: 'insight-1',
        title: 'Credit Spread Tightening',
        statistic: '-25bps',
        description: 'Investment grade spreads have compressed',
        impact: 'Positive for borrowers',
        confidence: 85,
        suggestedAction: 'Adjust pricing expectations',
      });

      expect(result).toContain('Credit spreads');
      expect(result).toContain('25bps');
    });
  });

  describe('compareStrategies', () => {
    it('compares multiple negotiation strategies', async () => {
      const strategies = [
        {
          id: 'strat-1',
          name: 'Anchor High',
          description: 'Start with aggressive position',
          applicability: 85,
          expectedOutcome: {
            closingTimeDelta: -5,
            successProbabilityDelta: 0.05,
          },
          supportingEvidence: {
            similarDeals: 20,
            successRate: 0.8,
          },
        },
        {
          id: 'strat-2',
          name: 'Collaborative',
          description: 'Build relationship first',
          applicability: 75,
          expectedOutcome: {
            closingTimeDelta: 3,
            successProbabilityDelta: 0.08,
          },
          supportingEvidence: {
            similarDeals: 15,
            successRate: 0.85,
          },
        },
      ];

      mockGenerateCompletion.mockResolvedValue(
        'Based on the analysis, the Collaborative strategy is recommended given the priority of maintaining the relationship. While it may add 3 days to the timeline, the 85% success rate and higher probability delta make it the optimal choice. The Anchor High strategy could be considered as a fallback if initial collaborative approaches are met with aggressive counter-positioning.'
      );

      const result = await dealIntelligence.compareStrategies(
        strategies as any,
        {
          priority: 'relationship',
          constraints: ['Time sensitive', 'Budget conscious'],
        }
      );

      expect(result).toContain('Collaborative');
      expect(mockGenerateCompletion).toHaveBeenCalled();
    });
  });

  describe('generateResolutionScript', () => {
    it('generates dialogue script for sticking point', async () => {
      const stickingPoint = {
        termKey: 'margin',
        termLabel: 'Initial Margin',
        probability: 0.75,
        reason: 'Borrower seeking aggressive pricing',
        suggestedApproach: 'Offer margin grid',
        historicalResolution: {
          avgRoundsToResolve: 2,
          commonCompromises: ['Margin grid', 'Step-downs'],
        },
      };

      mockGenerateCompletion.mockResolvedValue(
        'Opening: "We understand pricing is important to you. Let me share some thoughts on a structure that could work for both parties."\n\nResponse to pushback: "I appreciate the feedback. Given the market environment, we could consider a performance-based margin grid."\n\nClosing: "A grid structure would give you pricing upside while providing us with appropriate compensation. Shall we explore specific thresholds?"'
      );

      const result = await dealIntelligence.generateResolutionScript(
        stickingPoint as any,
        {
          counterpartyStyle: 'collaborative',
          ourPosition: 'Flexible on structure',
        }
      );

      expect(result).toContain('Opening');
      expect(result).toContain('grid');
    });
  });

  describe('explainSuccessProbability', () => {
    it('explains probability assessment', async () => {
      mockGenerateCompletion.mockResolvedValue(
        'The 78% closing probability reflects strong fundamentals with some execution risk. Key positive factors include the established relationship and competitive market. The main risks are margin negotiation complexity and timeline pressure. Improving covenant flexibility positioning could increase probability by 5-8%.'
      );

      const result = await dealIntelligence.explainSuccessProbability(
        mockDealPrediction as any,
        {
          positive: ['Strong relationship', 'Market conditions'],
          negative: ['Pricing competition', 'Timeline pressure'],
          neutral: ['Standard documentation'],
        }
      );

      expect(result).toContain('78%');
      expect(result).toContain('probability');
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('API unavailable'));

      await expect(
        dealIntelligence.generateDealIntelligenceNarrative(
          mockDealPrediction as any,
          { dealName: 'Test', dealType: 'TLB', participants: [] }
        )
      ).rejects.toThrow('API unavailable');
    });
  });
});
