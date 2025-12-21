/**
 * Evolution Engine Module Tests
 *
 * Tests for the autonomous document evolution LLM functions.
 * Uses mocked Claude API responses to test:
 * - Market condition analysis
 * - Covenant risk analysis
 * - Amendment suggestion generation
 * - Regulatory impact analysis
 * - Communication drafting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as evolutionEngine from './evolution-engine';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('evolution-engine module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('analyzeMarketConditions', () => {
    const mockMarketData = {
      timestamp: new Date().toISOString(),
      interestRates: [
        {
          rateType: 'SOFR',
          currentRate: 5.33,
          previousRate: 5.31,
          changeBps: 2,
          direction: 'up',
          asOfDate: new Date().toISOString(),
        },
      ],
      creditSpreads: [
        {
          spreadType: 'Investment Grade',
          rating: 'BBB',
          currentSpread: 175,
          previousSpread: 168,
          changeBps: 7,
          direction: 'widening',
          asOfDate: new Date().toISOString(),
        },
      ],
      regulatoryAnnouncements: [],
      marketSentiment: {
        overall: 'neutral',
        volatilityIndex: 18.5,
        economicOutlook: 'stable',
      },
      dataQuality: {
        completeness: 0.95,
        freshness: 0.98,
        sources: ['Bloomberg', 'Reuters'],
      },
    };

    const mockFacilityContext = {
      facilityName: 'Apollo Credit Facility',
      borrowerName: 'Apollo Holdings',
      borrowerIndustry: 'manufacturing',
      facilityType: 'term_loan',
      baseRate: 'SOFR',
      currentMargin: 325,
      maturityDate: '2029-01-15',
      totalCommitment: 500000000,
    };

    it('identifies amendment triggers from market conditions', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        triggers: [
          {
            type: 'market_condition',
            description: 'Credit spreads widening significantly',
            indicator: 'BBB Spread Index',
            currentValue: 175,
            threshold: 150,
            source: 'Bloomberg',
            triggeredAt: new Date().toISOString(),
          },
        ],
        riskAssessment: {
          interestRateRisk: 'medium',
          creditRisk: 'medium',
          regulatoryRisk: 'low',
          overallRisk: 'medium',
        },
        recommendations: [
          'Consider hedging interest rate exposure',
          'Monitor credit spread movements closely',
        ],
        summary: 'Market conditions show moderate stress in credit spreads.',
      });

      const result = await evolutionEngine.analyzeMarketConditions(
        mockMarketData as any,
        mockFacilityContext
      );

      expect(result.triggers).toHaveLength(1);
      expect(result.triggers[0].type).toBe('market_condition');
      expect(result.riskAssessment.overallRisk).toBe('medium');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('handles stable market conditions', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        triggers: [],
        riskAssessment: {
          interestRateRisk: 'low',
          creditRisk: 'low',
          regulatoryRisk: 'low',
          overallRisk: 'low',
        },
        recommendations: ['Continue standard monitoring'],
        summary: 'Market conditions stable - no immediate action required.',
      });

      const result = await evolutionEngine.analyzeMarketConditions(
        mockMarketData as any,
        mockFacilityContext
      );

      expect(result.triggers).toHaveLength(0);
      expect(result.riskAssessment.overallRisk).toBe('low');
    });
  });

  describe('analyzeCovenantRisk', () => {
    const mockCovenants = [
      {
        covenantId: 'cov-1',
        covenantName: 'Maximum Leverage Ratio',
        covenantType: 'leverage',
        facilityId: 'fac-1',
        currentHeadroom: 8.2,
        thresholdValue: 4.5,
        currentValue: 4.13,
        thresholdType: 'maximum',
        riskLevel: 'tight',
        trend: 'deteriorating',
        monthsToProjectedBreach: 9,
        testHistory: [],
      },
    ];

    it('identifies at-risk covenants', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        atRiskCovenants: [
          {
            covenantId: 'cov-1',
            covenantName: 'Maximum Leverage Ratio',
            riskLevel: 'at_risk',
            projectedBreachDate: '2025-10-01',
            driverAnalysis: 'EBITDA compression driving leverage higher',
            recommendations: ['Accelerate cost reduction', 'Consider amendment'],
          },
        ],
        overallCovenantHealth: {
          score: 65,
          trend: 'deteriorating',
          summary: 'Covenant headroom declining - proactive action recommended',
        },
        triggers: [
          {
            type: 'covenant_headroom',
            description: 'Headroom below 10%',
            indicator: 'Leverage Headroom',
            currentValue: 8.2,
            threshold: 10,
            source: 'Quarterly test',
            triggeredAt: new Date().toISOString(),
          },
        ],
        prioritizedActions: [
          'Engage borrower on remediation plans',
          'Prepare amendment discussion points',
        ],
      });

      const result = await evolutionEngine.analyzeCovenantRisk(
        mockCovenants as any,
        {
          facilityName: 'Apollo Credit Facility',
          borrowerName: 'Apollo Holdings',
          borrowerIndustry: 'manufacturing',
        }
      );

      expect(result.atRiskCovenants).toHaveLength(1);
      expect(result.atRiskCovenants[0].riskLevel).toBe('at_risk');
      expect(result.overallCovenantHealth.score).toBe(65);
      expect(result.triggers.length).toBeGreaterThan(0);
    });
  });

  describe('generateAmendmentSuggestion', () => {
    it('generates comprehensive amendment suggestion', async () => {
      const mockSuggestion = {
        facilityId: 'fac-1',
        documentId: 'doc-1',
        type: 'covenant_reset',
        priority: 'high',
        title: 'Proactive Leverage Covenant Reset',
        description: 'Reset leverage covenant to provide headroom cushion',
        rationale: 'Current headroom insufficient given market conditions',
        triggerConditions: [],
        suggestedChanges: [
          {
            field: 'Maximum Leverage Ratio',
            category: 'Financial Covenants',
            currentValue: 4.5,
            suggestedValue: 5.0,
            rationale: 'Provide additional headroom buffer',
            impact: {
              financial: 'Slightly increased credit risk',
              operational: 'Reduced reporting burden',
              legal: 'Standard amendment process',
            },
            draftLanguage: 'Section 7.1(a) is hereby amended by deleting "4.50:1.00" and substituting "5.00:1.00"',
            clauseReference: 'Section 7.1(a)',
          },
        ],
        negotiationPoints: [
          {
            title: 'Covenant Level',
            ourPosition: 'Reset to 5.00x',
            anticipatedCounterposition: 'May request higher',
            fallbackPosition: '5.25x with margin step-up',
            priority: 'must_have',
            supportingArguments: ['Market conditions justify relief'],
            marketPrecedent: 'Similar amendments averaging 0.5x relief',
          },
        ],
        riskIfIgnored: {
          likelihood: 'high',
          impact: 'significant',
          description: '65% probability of breach within 9 months',
        },
        estimatedTimeline: '4-6 weeks',
        confidence: 0.85,
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockSuggestion);

      const result = await evolutionEngine.generateAmendmentSuggestion(
        'fac-1',
        'doc-1',
        'covenant_reset',
        {
          facilityName: 'Apollo Credit Facility',
          borrowerName: 'Apollo Holdings',
          currentTerms: { leverageRatio: 4.5 },
          triggers: [],
        }
      );

      expect(result.type).toBe('covenant_reset');
      expect(result.priority).toBe('high');
      expect(result.suggestedChanges).toHaveLength(1);
      expect(result.negotiationPoints).toHaveLength(1);
      expect(result.confidence).toBe(0.85);
    });
  });

  describe('analyzeRegulatoryImpact', () => {
    const mockAnnouncement = {
      id: 'reg-1',
      regulator: 'Federal Reserve',
      title: 'Updated LIBOR Transition Guidance',
      summary: 'New requirements for fallback provisions',
      categories: ['Interest Rate', 'Documentation'],
      publishedDate: new Date().toISOString(),
      effectiveDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      impactLevel: 'high',
      affectedDocumentTypes: ['credit_agreement'],
    };

    it('identifies relevant regulatory impacts', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        isRelevant: true,
        relevanceScore: 0.92,
        affectedClauses: ['Interest Rate Definitions', 'Fallback Provisions'],
        requiredChanges: [
          {
            field: 'LIBOR Rate Definition',
            category: 'Definitions',
            currentValue: 'LIBOR-based',
            suggestedValue: 'SOFR with fallback',
            rationale: 'Regulatory compliance',
            impact: {
              financial: 'Minor spread adjustment',
              operational: 'Updated systems needed',
              legal: 'Mandatory change',
            },
            draftLanguage: 'Replace LIBOR definition with SOFR fallback language',
            clauseReference: 'Section 1.01',
          },
        ],
        complianceDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        actionRequired: true,
        summary: 'Document requires update to comply with LIBOR transition requirements.',
      });

      const result = await evolutionEngine.analyzeRegulatoryImpact(
        mockAnnouncement as any,
        {
          facilityName: 'Apollo Credit Facility',
          documentType: 'credit_agreement',
          currentDefinitions: { 'LIBOR Rate': 'LIBOR-based definition' },
          jurisdiction: 'New York',
        }
      );

      expect(result.isRelevant).toBe(true);
      expect(result.relevanceScore).toBeGreaterThan(0.9);
      expect(result.actionRequired).toBe(true);
      expect(result.requiredChanges.length).toBeGreaterThan(0);
    });

    it('identifies non-relevant announcements', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        isRelevant: false,
        relevanceScore: 0.15,
        affectedClauses: [],
        requiredChanges: [],
        complianceDeadline: null,
        actionRequired: false,
        summary: 'Announcement not relevant to this facility.',
      });

      const result = await evolutionEngine.analyzeRegulatoryImpact(
        mockAnnouncement as any,
        {
          facilityName: 'Different Facility',
          documentType: 'amendment',
          currentDefinitions: {},
          jurisdiction: 'Delaware',
        }
      );

      expect(result.isRelevant).toBe(false);
      expect(result.actionRequired).toBe(false);
    });
  });

  describe('draftCommunication', () => {
    const mockSuggestion = {
      id: 'sug-1',
      facilityId: 'fac-1',
      documentId: 'doc-1',
      type: 'covenant_reset',
      priority: 'high',
      title: 'Proactive Leverage Reset',
      description: 'Reset covenant to provide headroom',
      rationale: 'Market conditions warrant relief',
      triggerConditions: [],
      suggestedChanges: [],
      negotiationPoints: [],
      riskIfIgnored: { likelihood: 'high', impact: 'significant', description: 'Breach risk' },
      estimatedTimeline: '4-6 weeks',
      confidence: 0.85,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('drafts informal discussion communication', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        subject: 'Apollo Holdings - Discussion Request',
        greeting: 'Dear Apollo Team,',
        body: 'We would like to schedule a discussion regarding your credit facility and market conditions.',
        suggestedNextSteps: [
          'Schedule call for next week',
          'Prepare discussion materials',
        ],
        callToAction: 'Please confirm your availability.',
        closing: 'Best regards,',
        attachmentSuggestions: ['Market analysis summary'],
      });

      const result = await evolutionEngine.draftCommunication(
        mockSuggestion as any,
        'informal_discussion',
        {
          facilityName: 'Apollo Credit Facility',
          borrowerName: 'Apollo Holdings',
          senderName: 'John Smith',
          senderRole: 'Relationship Manager',
          recipientName: 'Jane Doe',
          recipientRole: 'CFO',
        }
      );

      expect(result.subject).toContain('Apollo Holdings');
      expect(result.suggestedNextSteps.length).toBeGreaterThan(0);
    });

    it('drafts formal amendment request', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        subject: 'Amendment Request - Apollo Credit Facility',
        greeting: 'Dear Administrative Agent,',
        body: 'Pursuant to Section X of the Credit Agreement, we hereby request the following amendment...',
        suggestedNextSteps: ['Review with credit committee', 'Prepare consent documents'],
        callToAction: 'Please circulate to the lender group.',
        closing: 'Respectfully,',
        attachmentSuggestions: ['Draft amendment', 'Financial projections'],
      });

      const result = await evolutionEngine.draftCommunication(
        mockSuggestion as any,
        'amendment_request',
        {
          facilityName: 'Apollo Credit Facility',
          borrowerName: 'Apollo Holdings',
          senderName: 'Apollo Holdings',
          senderRole: 'Borrower',
          recipientName: 'Agent Bank',
          recipientRole: 'Administrative Agent',
        }
      );

      expect(result.subject).toContain('Amendment Request');
    });
  });

  describe('mock data generators', () => {
    it('generates mock market conditions', () => {
      const result = evolutionEngine.generateMockMarketConditions();

      expect(result.timestamp).toBeDefined();
      expect(result.interestRates.length).toBeGreaterThan(0);
      expect(result.creditSpreads.length).toBeGreaterThan(0);
      expect(result.marketSentiment).toBeDefined();
    });

    it('generates mock amendment suggestions', () => {
      const result = evolutionEngine.generateMockAmendmentSuggestions();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBeDefined();
      expect(result[0].type).toBeDefined();
      expect(result[0].priority).toBeDefined();
    });

    it('generates mock covenant analysis', () => {
      const result = evolutionEngine.generateMockCovenantAnalysis();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].covenantId).toBeDefined();
      expect(result[0].currentHeadroom).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('API error'));

      // Must provide valid facilityContext to prevent toLocaleString error
      const validContext = {
        facilityName: 'Test Facility',
        borrowerName: 'Test Borrower',
        borrowerIndustry: 'manufacturing',
        facilityType: 'term_loan',
        baseRate: 'SOFR',
        currentMargin: 300,
        maturityDate: '2029-01-15',
        totalCommitment: 100000000,
      };

      await expect(
        evolutionEngine.analyzeMarketConditions({} as any, validContext)
      ).rejects.toThrow('API error');
    });
  });
});
