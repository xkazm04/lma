/**
 * ESG Module Tests
 *
 * Tests for the ESG (Environmental, Social, Governance) LLM functions.
 * Uses mocked Claude API responses to test:
 * - ESG question answering
 * - KPI definition assistance
 * - Gap analysis
 * - Benchmark comparison
 * - Margin calculation
 * - ESG report generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as esg from './esg';

// Mock the client module including withLLMFallback
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
  withLLMFallback: vi.fn((fn) => fn()),
}));

import { generateStructuredOutput, withLLMFallback } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);
const mockWithLLMFallback = vi.mocked(withLLMFallback);

describe('esg module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default withLLMFallback behavior: execute the function
    mockWithLLMFallback.mockImplementation((fn) => fn());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('answerESGQuestion', () => {
    it('answers questions about ESG performance', async () => {
      const mockResponse = {
        query_type: 'performance',
        question: 'Are we on track to meet our emissions target?',
        answer: 'Based on current trajectory, you are on track to meet your GHG emissions reduction target.',
        sources: [
          {
            type: 'kpi_data',
            reference: 'GHG Emissions KPI',
            excerpt: 'Current: 45,000 tCO2e, Target: 40,000 tCO2e',
          },
        ],
        confidence: 0.92,
        suggested_actions: ['Continue monitoring quarterly'],
        related_kpis: [
          {
            kpi_name: 'GHG Emissions Reduction',
            relevance: 'Direct measure of emissions performance',
          },
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockResponse);

      const result = await esg.answerESGQuestion({
        question: 'Are we on track to meet our emissions target?',
        facility_context: {
          facility_name: 'Green Loan Facility',
          borrower_name: 'Apollo Holdings',
          esg_loan_type: 'sustainability_linked',
        },
        kpi_context: [
          {
            kpi_name: 'GHG Emissions Reduction',
            category: 'environmental_emissions',
            current_value: 45000,
            target_value: 40000,
            unit: 'tCO2e',
            performance_status: 'on_track',
          },
        ],
      });

      expect(result.answer).toContain('on track');
      expect(result.confidence).toBeGreaterThan(0.9);
    });
  });

  describe('assistKPIDefinition', () => {
    it('recommends KPIs based on industry', async () => {
      const mockResponse = {
        recommended_kpis: [
          {
            kpi_name: 'Scope 1 & 2 GHG Emissions',
            category: 'environmental_emissions',
            description: 'Direct and indirect emissions',
            measurement_methodology: 'GHG Protocol',
            suggested_unit: 'tCO2e',
            industry_benchmark: '25% reduction by 2030',
            ambition_level: 'Science-based targets',
            verification_approach: 'Third-party verification',
            data_sources: ['Utility bills', 'Fuel records'],
            relevance_score: 9,
            rationale: 'Core emission metric for manufacturing',
          },
        ],
        framework_alignment: {
          llp_principles: 'Aligned with core principles',
          glp_principles: 'Not applicable',
          sdg_alignment: ['SDG 13'],
          eu_taxonomy_alignment: 'Climate mitigation',
        },
        implementation_guidance: {
          baseline_period: 'FY 2023',
          reporting_frequency: 'Quarterly',
          verification_requirements: 'Annual third-party',
          escalation_path: 'Remediation plan required',
        },
        risks_and_considerations: [
          {
            risk: 'Data collection challenges',
            mitigation: 'Implement automated monitoring',
          },
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockResponse);

      const result = await esg.assistKPIDefinition({
        borrower_name: 'Manufacturing Corp',
        borrower_industry: 'manufacturing',
        esg_loan_type: 'sustainability_linked',
      });

      expect(result.recommended_kpis).toHaveLength(1);
      expect(result.recommended_kpis[0].kpi_name).toContain('GHG Emissions');
    });
  });

  describe('performGapAnalysis', () => {
    it('identifies gaps between current state and targets', async () => {
      const mockAnalysis = {
        overall_status: 'at_risk',
        kpi_gaps: [
          {
            kpi_name: 'GHG Emissions',
            current_gap: 8000,
            gap_percentage: 20,
            time_remaining: '12 months',
            required_improvement_rate: '10% per quarter',
            risk_level: 'medium',
            recommendations: ['Accelerate renewable energy transition'],
          },
        ],
        reporting_gaps: {
          status: 'compliant',
          missing_reports: 0,
          next_deadline: '2025-03-31',
          recommendations: ['Maintain current schedule'],
        },
        allocation_gaps: {
          status: 'partially_allocated',
          gap_amount: 50000000,
          gap_percentage: 10,
          recommendations: ['Identify additional eligible projects'],
        },
        priority_actions: [
          {
            action: 'Review renewable energy options',
            urgency: 'short_term',
            impact: 'high',
          },
        ],
        timeline_to_compliance: '12-18 months',
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockAnalysis);

      const result = await esg.performGapAnalysis({
        facility: {
          facility_name: 'Green Facility',
          borrower_name: 'Apollo',
          esg_loan_type: 'green_loan',
        },
        current_kpis: [
          {
            kpi_name: 'GHG Emissions',
            category: 'environmental',
            current_trajectory: 48000,
            target_value: 40000,
            target_date: '2025-12-31',
            unit: 'tCO2e',
          },
        ],
        reporting_status: {
          reports_submitted: 4,
          reports_required: 4,
          last_report_date: '2024-12-31',
          verification_status: 'verified',
        },
      });

      expect(result.overall_status).toBe('at_risk');
      expect(result.kpi_gaps).toHaveLength(1);
      expect(result.priority_actions.length).toBeGreaterThan(0);
    });
  });

  describe('compareBenchmarks', () => {
    it('compares performance against industry benchmarks', async () => {
      const mockComparison = {
        overall_positioning: 'above_average',
        kpi_benchmarks: [
          {
            kpi_name: 'Carbon Intensity',
            borrower_value: 12.5,
            industry_benchmark: 18.0,
            percentile: 75,
            positioning: '30% below industry median',
            improvement_potential: 'Best-in-class at 8.0',
          },
        ],
        peer_comparison: {
          summary: 'Performing above peers in emissions reduction',
          strengths: ['Lower carbon intensity', 'Renewable energy adoption'],
          weaknesses: ['Water usage above average'],
        },
        improvement_opportunities: [
          {
            kpi_name: 'Carbon Intensity',
            current_gap_to_leader: 4.5,
            recommended_target: 10.0,
            expected_impact: 'Top quartile positioning',
          },
        ],
        strategic_recommendations: [
          'Continue emissions reduction trajectory',
          'Focus on water efficiency improvements',
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockComparison);

      const result = await esg.compareBenchmarks({
        borrower_name: 'Apollo Holdings',
        borrower_industry: 'manufacturing',
        kpi_data: [
          {
            kpi_name: 'Carbon Intensity',
            category: 'environmental',
            current_value: 12.5,
            unit: 'tCO2e/revenue',
            target_value: 10.0,
          },
        ],
      });

      expect(result.overall_positioning).toBe('above_average');
      expect(result.kpi_benchmarks).toHaveLength(1);
      expect(result.improvement_opportunities.length).toBeGreaterThan(0);
    });
  });

  describe('calculateMarginAdjustment', () => {
    it('calculates margin adjustment based on KPI performance', async () => {
      const mockCalculation = {
        kpi_assessments: [
          {
            kpi_name: 'GHG Emissions',
            achievement_level: 'exceeded',
            achievement_percentage: 115,
            adjustment_bps: -5,
            rationale: 'Target exceeded by 15%',
          },
          {
            kpi_name: 'Renewable Energy',
            achievement_level: 'missed',
            achievement_percentage: 96,
            adjustment_bps: 0,
            rationale: 'Target missed by 4%',
          },
        ],
        total_adjustment_bps: -2.5,
        new_margin_bps: 297.5,
        effective_date: '2025-01-01',
        calculation_methodology: 'Weighted average based on KPI achievement',
        caveats: ['Subject to verification'],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockCalculation);

      const result = await esg.calculateMarginAdjustment({
        facility: {
          facility_name: 'Green Facility',
          base_margin_bps: 300,
          max_adjustment_bps: 25,
          adjustment_frequency: 'annual',
        },
        kpi_results: [
          {
            kpi_name: 'GHG Emissions',
            target_value: 40000,
            actual_value: 34000,
            weight: 50,
            higher_is_better: false,
            adjustment_per_kpi_bps: -5,
          },
          {
            kpi_name: 'Renewable Energy',
            target_value: 50,
            actual_value: 48,
            weight: 50,
            higher_is_better: true,
            adjustment_per_kpi_bps: -5,
          },
        ],
      });

      expect(result.total_adjustment_bps).toBe(-2.5);
      expect(result.new_margin_bps).toBe(297.5);
      expect(result.kpi_assessments).toHaveLength(2);
    });
  });

  describe('generateESGReport', () => {
    it('generates comprehensive ESG report', async () => {
      const mockReport = {
        executive_summary: 'Strong ESG performance in FY2024...',
        performance_narrative: {
          environmental: 'GHG emissions reduced by 15%',
          social: 'Improved workforce diversity',
          governance: 'Enhanced board oversight',
        },
        target_analysis: {
          achieved_targets: ['Emissions reduction: 15% vs 10% target'],
          missed_targets: ['Renewable energy: 48% vs 50% target'],
          near_misses: ['Water reduction at 9.5% vs 10% target'],
        },
        trend_analysis: 'Positive trend across all environmental KPIs',
        impact_highlights: [
          {
            metric: 'Carbon avoided',
            value: '7,500 tCO2e',
            context: 'Equivalent to 1,600 cars off the road',
          },
        ],
        recommendations: [
          {
            area: 'Renewable energy',
            recommendation: 'Accelerate solar installation',
            priority: 'high',
          },
        ],
        outlook: 'On track to meet 2025 targets',
        methodology_notes: 'Data verified by third party',
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockReport);

      const result = await esg.generateESGReport({
        facility: {
          facility_name: 'Green Facility',
          borrower_name: 'Apollo Holdings',
          esg_loan_type: 'sustainability_linked',
          commitment_amount: 500000000,
        },
        report_type: 'annual',
        reporting_period: {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        kpi_performance: [
          {
            kpi_name: 'GHG Emissions',
            category: 'environmental',
            baseline_value: 50000,
            target_value: 45000,
            actual_value: 42500,
            unit: 'tCO2e',
            achieved: true,
            verification_status: 'verified',
            trend: 'improving',
          },
        ],
      });

      expect(result.executive_summary).toBeDefined();
      expect(result.performance_narrative.environmental).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('uses fallback when API fails', async () => {
      mockWithLLMFallback.mockImplementation((_fn, _ctx, options) => {
        return options.fallbackFactory({ question: 'Test?' });
      });

      const result = await esg.answerESGQuestion({
        question: 'Test?',
        facility_context: {
          facility_name: 'Test',
          borrower_name: 'Test',
          esg_loan_type: 'green_loan',
        },
      });

      expect(result.confidence).toBe(0);
      expect(result.suggested_actions).toContain('Manual review required');
    });
  });
});
