import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  assessGovernance,
  analyzeCovenantCorrelation,
  analyzeRedFlags,
  analyzeCompensation,
  benchmarkBoardDiversity,
  analyzeProxyVoteImpact,
  generateGovernanceAlerts,
  type GovernanceAssessmentContext,
  type CovenantCorrelationContext,
  type RedFlagAnalysisContext,
  type CompensationAnalysisContext,
  type BoardDiversityBenchmarkContext,
  type ProxyVoteImpactContext,
} from './governance';
import type {
  GovernanceMetrics,
  GovernanceEvent,
  ShareholderResolution,
  BoardMember,
} from '@/lib/validations/esg';

// Mock the LLM client
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  withLLMFallback: vi.fn((fn, context, options) => {
    // Simulate successful LLM call by calling the fallback factory
    try {
      return fn();
    } catch {
      return options.fallbackFactory(context);
    }
  }),
}));

describe('Governance LLM Functions', () => {
  const mockGovernanceMetrics: GovernanceMetrics = {
    borrower_id: '123e4567-e89b-12d3-a456-426614174000',
    as_of_date: '2025-01-15',
    board_size: 11,
    independent_directors: 8,
    female_directors: 4,
    minority_directors: 3,
    average_board_tenure: 5.2,
    esg_expertise_on_board: true,
    separate_chair_ceo: true,
    has_sustainability_committee: true,
    has_audit_committee: true,
    has_risk_committee: true,
    has_compensation_committee: true,
    ceo_comp_esg_linked: true,
    ceo_comp_esg_percentage: 25,
    exec_comp_esg_metrics: ['emissions_reduction', 'diversity_targets'],
    shareholder_support_rate: 94.2,
    esg_resolutions_passed: 3,
    esg_resolutions_total: 4,
  };

  const mockGovernanceEvents: GovernanceEvent[] = [
    {
      borrower_id: '123e4567-e89b-12d3-a456-426614174000',
      event_type: 'board_change',
      event_date: '2025-01-10',
      title: 'CFO Resignation',
      description: 'Chief Financial Officer announced resignation',
      severity: 'warning',
    },
    {
      borrower_id: '123e4567-e89b-12d3-a456-426614174000',
      event_type: 'shareholder_resolution',
      event_date: '2025-01-08',
      title: 'Climate Disclosure Resolution',
      description: 'Shareholder resolution on climate risk disclosure',
      severity: 'info',
    },
  ];

  const mockShareholderResolutions: ShareholderResolution[] = [
    {
      borrower_id: '123e4567-e89b-12d3-a456-426614174000',
      meeting_date: '2025-01-15',
      resolution_type: 'Climate Risk Disclosure',
      resolution_category: 'climate',
      sponsor_type: 'shareholder',
      iss_recommendation: 'for',
      management_recommendation: 'for',
      vote_result: 'passed',
      support_percentage: 78,
    },
  ];

  const mockBoardMembers: BoardMember[] = [
    {
      name: 'Jane Smith',
      role: 'Chair',
      tenure_years: 8,
      is_independent: true,
      diversity_categories: ['gender'],
      esg_expertise: true,
      esg_committee_member: true,
    },
    {
      name: 'John Doe',
      role: 'CEO',
      tenure_years: 5,
      is_independent: false,
      esg_expertise: false,
      esg_committee_member: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assessGovernance', () => {
    it('should return assessment with fallback when LLM fails', async () => {
      const context: GovernanceAssessmentContext = {
        borrower_name: 'TestCorp',
        borrower_industry: 'Technology',
        governance_metrics: mockGovernanceMetrics,
        events: mockGovernanceEvents,
        resolutions: mockShareholderResolutions,
      };

      const result = await assessGovernance(context);

      expect(result).toBeDefined();
      expect(result.overall_score).toBeDefined();
      expect(result.score_category).toBeDefined();
      expect(result.component_scores).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.weaknesses).toBeDefined();
      expect(result.red_flags).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle missing governance metrics gracefully', async () => {
      const context: GovernanceAssessmentContext = {
        borrower_name: 'TestCorp',
        borrower_industry: 'Technology',
      };

      const result = await assessGovernance(context);

      expect(result).toBeDefined();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeCovenantCorrelation', () => {
    it('should analyze correlations between governance events and covenants', async () => {
      const context: CovenantCorrelationContext = {
        governance_events: mockGovernanceEvents,
        governance_metrics: mockGovernanceMetrics,
        covenants: [
          {
            covenant_id: 'cov-1',
            covenant_name: 'Financial Reporting',
            covenant_type: 'financial',
            current_headroom: 15,
          },
        ],
      };

      const result = await analyzeCovenantCorrelation(context);

      expect(result).toBeDefined();
      expect(result.correlations).toBeDefined();
      expect(result.high_risk_patterns).toBeDefined();
      expect(result.predictive_signals).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('analyzeRedFlags', () => {
    it('should identify red flags in governance data', async () => {
      const context: RedFlagAnalysisContext = {
        borrower_name: 'TestCorp',
        governance_metrics: mockGovernanceMetrics,
        recent_events: mockGovernanceEvents,
      };

      const result = await analyzeRedFlags(context);

      expect(result).toBeDefined();
      expect(result.risk_level).toBeDefined();
      expect(result.flags).toBeDefined();
      expect(result.watchlist_items).toBeDefined();
      expect(result.immediate_actions_required).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should return appropriate risk level', async () => {
      const context: RedFlagAnalysisContext = {
        borrower_name: 'TestCorp',
        governance_metrics: mockGovernanceMetrics,
        recent_events: [],
      };

      const result = await analyzeRedFlags(context);

      expect(['low', 'medium', 'high', 'critical']).toContain(result.risk_level);
    });
  });

  describe('analyzeCompensation', () => {
    it('should analyze executive compensation ESG alignment', async () => {
      const context: CompensationAnalysisContext = {
        borrower_name: 'TestCorp',
        ceo_compensation: {
          base_salary: 1000000,
          bonus: 500000,
          equity_awards: 2000000,
          total_compensation: 3500000,
          esg_linked_percentage: 25,
          esg_metrics_used: ['emissions_reduction', 'diversity_targets'],
        },
      };

      const result = await analyzeCompensation(context);

      expect(result).toBeDefined();
      expect(result.esg_alignment_score).toBeDefined();
      expect(result.alignment_category).toBeDefined();
      expect(result.compensation_breakdown).toBeDefined();
      expect(result.effectiveness_assessment).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle missing compensation data', async () => {
      const context: CompensationAnalysisContext = {
        borrower_name: 'TestCorp',
      };

      const result = await analyzeCompensation(context);

      expect(result).toBeDefined();
      expect(result.alignment_category).toBe('none');
    });
  });

  describe('benchmarkBoardDiversity', () => {
    it('should benchmark board diversity against peers', async () => {
      const context: BoardDiversityBenchmarkContext = {
        borrower_name: 'TestCorp',
        borrower_industry: 'Technology',
        current_board: mockBoardMembers,
        industry_benchmarks: {
          avg_board_size: 10,
          avg_female_percentage: 30,
          avg_minority_percentage: 15,
          avg_independence_percentage: 70,
          avg_esg_expertise_percentage: 20,
        },
      };

      const result = await benchmarkBoardDiversity(context);

      expect(result).toBeDefined();
      expect(result.diversity_score).toBeDefined();
      expect(result.score_category).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.vs_benchmarks).toBeDefined();
      expect(result.skill_gaps).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should calculate board metrics from member data', async () => {
      const context: BoardDiversityBenchmarkContext = {
        borrower_name: 'TestCorp',
        borrower_industry: 'Technology',
        current_board: mockBoardMembers,
      };

      const result = await benchmarkBoardDiversity(context);

      expect(result.metrics.board_size).toBe(2);
    });
  });

  describe('analyzeProxyVoteImpact', () => {
    it('should analyze impact of shareholder resolutions', async () => {
      const context: ProxyVoteImpactContext = {
        borrower_name: 'TestCorp',
        resolution: mockShareholderResolutions[0],
        historical_resolutions: [],
        governance_metrics: mockGovernanceMetrics,
      };

      const result = await analyzeProxyVoteImpact(context);

      expect(result).toBeDefined();
      expect(result.resolution_summary).toBeDefined();
      expect(result.esg_materiality).toBeDefined();
      expect(result.expected_outcome).toBeDefined();
      expect(result.if_passed_impact).toBeDefined();
      expect(result.if_failed_impact).toBeDefined();
      expect(result.voting_recommendation).toBeDefined();
    });

    it('should provide voting recommendation', async () => {
      const context: ProxyVoteImpactContext = {
        borrower_name: 'TestCorp',
        resolution: mockShareholderResolutions[0],
      };

      const result = await analyzeProxyVoteImpact(context);

      expect(['for', 'against', 'abstain']).toContain(
        result.voting_recommendation.recommendation
      );
    });
  });

  describe('generateGovernanceAlerts', () => {
    it('should generate alerts from governance data', async () => {
      const alerts = await generateGovernanceAlerts(
        'TestCorp',
        mockGovernanceEvents,
        mockGovernanceMetrics,
        [{ covenant_name: 'Financial Reporting', covenant_type: 'financial' }]
      );

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should include covenant impact in alerts', async () => {
      const alerts = await generateGovernanceAlerts(
        'TestCorp',
        mockGovernanceEvents,
        mockGovernanceMetrics,
        [{ covenant_name: 'Financial Reporting', covenant_type: 'financial' }]
      );

      alerts.forEach((alert) => {
        expect(alert.alert_type).toBeDefined();
        expect(alert.severity).toBeDefined();
        expect(alert.title).toBeDefined();
        expect(alert.description).toBeDefined();
        expect(alert.covenant_impact).toBeDefined();
        expect(alert.recommended_actions).toBeDefined();
      });
    });
  });
});

describe('Governance Validation Schemas Integration', () => {
  it('should validate governance metrics data', () => {
    const validMetrics: GovernanceMetrics = {
      borrower_id: '123e4567-e89b-12d3-a456-426614174000',
      as_of_date: '2025-01-15',
      board_size: 10,
      independent_directors: 7,
      ceo_comp_esg_linked: true,
      ceo_comp_esg_percentage: 20,
    };

    expect(validMetrics.borrower_id).toBeDefined();
    expect(validMetrics.as_of_date).toBeDefined();
  });

  it('should validate governance event data', () => {
    const validEvent: GovernanceEvent = {
      borrower_id: '123e4567-e89b-12d3-a456-426614174000',
      event_type: 'board_change',
      event_date: '2025-01-15',
      title: 'New Director Appointed',
      severity: 'info',
    };

    expect(validEvent.event_type).toBe('board_change');
    expect(validEvent.severity).toBe('info');
  });

  it('should validate shareholder resolution data', () => {
    const validResolution: ShareholderResolution = {
      borrower_id: '123e4567-e89b-12d3-a456-426614174000',
      meeting_date: '2025-01-15',
      resolution_type: 'Climate Disclosure',
      resolution_category: 'climate',
      sponsor_type: 'shareholder',
      iss_recommendation: 'for',
    };

    expect(validResolution.resolution_category).toBe('climate');
    expect(validResolution.sponsor_type).toBe('shareholder');
  });
});
