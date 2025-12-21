/**
 * Risk Scenario Simulation Module Tests
 *
 * Tests for the covenant breach simulation LLM functions.
 * Uses mocked Claude API responses to test:
 * - Risk scenario simulation
 * - Breach analysis
 * - Cascading effects identification
 * - Cure options generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as riskScenario from './risk-scenario-simulation';
import type { SimulateRiskScenarioInput, RiskScenarioSimulationResult } from './risk-scenario-simulation';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('risk-scenario-simulation module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockSimulationInput: SimulateRiskScenarioInput = {
    facility: {
      facilityName: 'Apollo Credit Facility',
      totalCommitments: 500000000,
      maturityDate: '2029-01-15',
      interestRateType: 'floating',
      baseRate: 'SOFR',
      marginInitial: 325,
      borrowerName: 'Apollo Holdings',
    },
    covenants: [
      {
        id: 'cov-1',
        covenantType: 'leverage_ratio',
        covenantName: 'Maximum Total Leverage Ratio',
        thresholdType: 'maximum',
        thresholdValue: 4.5,
        testFrequency: 'quarterly',
        numeratorDefinition: 'Total Debt',
        denominatorDefinition: 'EBITDA',
      },
      {
        id: 'cov-2',
        covenantType: 'interest_coverage',
        covenantName: 'Minimum Interest Coverage Ratio',
        thresholdType: 'minimum',
        thresholdValue: 2.5,
        testFrequency: 'quarterly',
        numeratorDefinition: 'EBITDA',
        denominatorDefinition: 'Interest Expense',
      },
    ],
    obligations: [
      {
        id: 'obl-1',
        obligationType: 'financial_reporting',
        description: 'Quarterly financial statements',
        frequency: 'quarterly',
        deadlineDays: 45,
      },
    ],
    scenario: riskScenario.PREDEFINED_SCENARIOS[0], // EBITDA Decline 20%
    currentFinancials: {
      ebitda: 100000000,
      totalDebt: 400000000,
      interestExpense: 20000000,
      cashBalance: 50000000,
      netWorth: 150000000,
    },
  };

  describe('simulateRiskScenario', () => {
    it('simulates EBITDA decline scenario', async () => {
      const mockResult: Omit<RiskScenarioSimulationResult, 'scenarioId' | 'simulationTimestamp'> = {
        scenarioName: 'EBITDA Decline 20%',
        scenarioDescription: 'Impact of 20% EBITDA decline on covenants',
        stressParameters: [
          {
            parameterId: 'param-1',
            parameterName: 'EBITDA',
            parameterType: 'percentage_change',
            baseValue: 100000000,
            stressedValue: 80000000,
            changeDescription: 'EBITDA decreases by 20%',
          },
        ],
        breachedCovenants: [
          {
            covenantId: 'cov-1',
            covenantName: 'Maximum Total Leverage Ratio',
            covenantType: 'leverage_ratio',
            thresholdValue: 4.5,
            thresholdType: 'maximum',
            projectedValue: 5.0,
            breachSeverity: 'moderate',
            breachMargin: 0.5,
            breachProbability: 0.85,
            calculationBreakdown: 'Total Debt ($400M) / Stressed EBITDA ($80M) = 5.00x vs threshold 4.50x',
          },
        ],
        atRiskCovenants: [
          {
            covenantId: 'cov-2',
            covenantName: 'Minimum Interest Coverage Ratio',
            covenantType: 'interest_coverage',
            thresholdValue: 2.5,
            thresholdType: 'minimum',
            projectedValue: 4.0,
            breachSeverity: 'minor',
            breachMargin: 1.5,
            breachProbability: 0.25,
            calculationBreakdown: 'Stressed EBITDA ($80M) / Interest ($20M) = 4.00x vs minimum 2.50x',
          },
        ],
        safeCovenants: [],
        cascadingEffects: [
          {
            effectId: 'eff-1',
            triggerCovenantId: 'cov-1',
            effectType: 'interest_rate_increase',
            description: 'Margin step-up of 50bps upon leverage breach',
            severity: 'medium',
            financialImpact: 2500000,
            timeToEffect: 'Next interest period',
          },
          {
            effectId: 'eff-2',
            triggerCovenantId: 'cov-1',
            effectType: 'reporting_frequency',
            description: 'Monthly financial reporting required',
            severity: 'low',
            timeToEffect: 'Immediate',
          },
        ],
        cureOptions: [
          {
            cureId: 'cure-1',
            cureType: 'equity_cure',
            description: 'Sponsor equity injection to reduce debt',
            estimatedCost: 50000000,
            feasibility: 'moderate',
            timeRequired: '30 days',
            successProbability: 0.7,
            preconditions: ['Sponsor support', 'Board approval'],
            risks: ['Dilution concerns', 'Market perception'],
          },
          {
            cureId: 'cure-2',
            cureType: 'waiver_request',
            description: 'Request temporary covenant waiver from lenders',
            estimatedCost: 500000,
            feasibility: 'moderate',
            timeRequired: '4-6 weeks',
            successProbability: 0.6,
            preconditions: ['Lender consent', 'Remediation plan'],
            risks: ['Amendment fees', 'Relationship strain'],
          },
        ],
        mandatoryPrepaymentTriggers: [
          {
            triggerId: 'mpt-1',
            triggerType: 'excess_cash_flow',
            description: 'Excess cash flow sweep',
            prepaymentPercentage: 50,
            estimatedAmount: 10000000,
            triggerCondition: 'Annual excess cash flow above threshold',
            isTriggered: false,
            triggerProbability: 0.4,
          },
        ],
        totalPotentialPrepayment: 10000000,
        covenantInterconnections: [
          {
            sourceCovenantId: 'cov-1',
            targetCovenantId: 'cov-2',
            connectionType: 'shared_metric',
            connectionStrength: 'strong',
            description: 'Both covenants share EBITDA in their calculations',
          },
        ],
        overallRiskScore: 72,
        riskLevel: 'elevated',
        keyInsights: [
          'Leverage covenant breach likely under 20% EBITDA stress',
          'Interest coverage maintains adequate headroom',
          'Cascading margin step-up would increase annual costs by $2.5M',
        ],
        recommendedActions: [
          'Engage with sponsor regarding potential equity support',
          'Prepare waiver request documentation',
          'Accelerate cost reduction initiatives',
        ],
        analysisConfidence: 0.85,
        limitations: [
          'Based on estimated current financials',
          'Does not account for seasonal variations',
        ],
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockResult);

      const result = await riskScenario.simulateRiskScenario(mockSimulationInput);

      expect(result.scenarioId).toBeDefined();
      expect(result.simulationTimestamp).toBeDefined();
      expect(result.breachedCovenants).toHaveLength(1);
      expect(result.breachedCovenants[0].covenantType).toBe('leverage_ratio');
      expect(result.breachedCovenants[0].projectedValue).toBe(5.0);
      expect(result.cascadingEffects.length).toBeGreaterThan(0);
      expect(result.cureOptions.length).toBeGreaterThan(0);
      expect(result.riskLevel).toBe('elevated');
    });

    it('simulates combined stress scenario', async () => {
      const combinedScenarioInput = {
        ...mockSimulationInput,
        scenario: riskScenario.PREDEFINED_SCENARIOS[3], // Combined stress
      };

      mockGenerateStructuredOutput.mockResolvedValue({
        scenarioName: 'Combined Stress Scenario',
        scenarioDescription: 'Multiple adverse conditions',
        stressParameters: [
          { parameterId: 'p1', parameterName: 'EBITDA', parameterType: 'percentage_change', baseValue: 100000000, stressedValue: 85000000, changeDescription: '-15%' },
          { parameterId: 'p2', parameterName: 'Total Debt', parameterType: 'percentage_change', baseValue: 400000000, stressedValue: 440000000, changeDescription: '+10%' },
        ],
        breachedCovenants: [
          { covenantId: 'cov-1', covenantName: 'Leverage', covenantType: 'leverage_ratio', thresholdValue: 4.5, thresholdType: 'maximum', projectedValue: 5.18, breachSeverity: 'severe', breachMargin: 0.68, breachProbability: 0.92, calculationBreakdown: 'Multiple stresses compound' },
        ],
        atRiskCovenants: [],
        safeCovenants: [],
        cascadingEffects: [],
        cureOptions: [],
        mandatoryPrepaymentTriggers: [],
        totalPotentialPrepayment: 0,
        covenantInterconnections: [],
        overallRiskScore: 85,
        riskLevel: 'high',
        keyInsights: ['Combined stresses significantly increase breach risk'],
        recommendedActions: ['Immediate lender engagement recommended'],
        analysisConfidence: 0.8,
        limitations: [],
      });

      const result = await riskScenario.simulateRiskScenario(combinedScenarioInput);

      expect(result.riskLevel).toBe('high');
      expect(result.overallRiskScore).toBeGreaterThan(80);
      expect(result.stressParameters).toHaveLength(2);
    });

    it('handles scenario with no breaches', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        scenarioName: 'Mild Stress',
        scenarioDescription: 'Minor EBITDA decline',
        stressParameters: [],
        breachedCovenants: [],
        atRiskCovenants: [],
        safeCovenants: [
          { covenantId: 'cov-1', covenantName: 'Leverage', headroom: 0.5, headroomPercentage: 11.1 },
          { covenantId: 'cov-2', covenantName: 'Coverage', headroom: 1.5, headroomPercentage: 60 },
        ],
        cascadingEffects: [],
        cureOptions: [],
        mandatoryPrepaymentTriggers: [],
        totalPotentialPrepayment: 0,
        covenantInterconnections: [],
        overallRiskScore: 25,
        riskLevel: 'low',
        keyInsights: ['All covenants maintain adequate headroom'],
        recommendedActions: ['Continue standard monitoring'],
        analysisConfidence: 0.9,
        limitations: [],
      });

      const result = await riskScenario.simulateRiskScenario(mockSimulationInput);

      expect(result.breachedCovenants).toHaveLength(0);
      expect(result.safeCovenants.length).toBeGreaterThan(0);
      expect(result.riskLevel).toBe('low');
    });
  });

  describe('predefined scenarios', () => {
    it('includes all expected scenario types', () => {
      const scenarios = riskScenario.PREDEFINED_SCENARIOS;

      expect(scenarios.length).toBeGreaterThanOrEqual(6);

      const scenarioIds = scenarios.map(s => s.scenarioId);
      expect(scenarioIds).toContain('ebitda-drop-20');
      expect(scenarioIds).toContain('ebitda-drop-30');
      expect(scenarioIds).toContain('interest-rate-spike');
      expect(scenarioIds).toContain('combined-stress');
      expect(scenarioIds).toContain('liquidity-crunch');
      expect(scenarioIds).toContain('capex-overspend');
    });

    it('each scenario has required properties', () => {
      riskScenario.PREDEFINED_SCENARIOS.forEach(scenario => {
        expect(scenario.scenarioId).toBeDefined();
        expect(scenario.scenarioName).toBeDefined();
        expect(scenario.scenarioDescription).toBeDefined();
        expect(scenario.category).toBeDefined();
        expect(scenario.stressParameters.length).toBeGreaterThan(0);

        scenario.stressParameters.forEach(param => {
          expect(param.metric).toBeDefined();
          expect(typeof param.changePercentage).toBe('number');
          expect(param.description).toBeDefined();
        });
      });
    });
  });

  describe('helper functions', () => {
    it('getRiskLevelColor returns correct color classes', () => {
      expect(riskScenario.getRiskLevelColor('low')).toContain('green');
      expect(riskScenario.getRiskLevelColor('moderate')).toContain('yellow');
      expect(riskScenario.getRiskLevelColor('elevated')).toContain('orange');
      expect(riskScenario.getRiskLevelColor('high')).toContain('red');
      expect(riskScenario.getRiskLevelColor('critical')).toContain('red');
    });

    it('getRiskLevelBadgeVariant returns correct variants', () => {
      expect(riskScenario.getRiskLevelBadgeVariant('low')).toBe('success');
      expect(riskScenario.getRiskLevelBadgeVariant('moderate')).toBe('warning');
      expect(riskScenario.getRiskLevelBadgeVariant('elevated')).toBe('warning');
      expect(riskScenario.getRiskLevelBadgeVariant('high')).toBe('destructive');
      expect(riskScenario.getRiskLevelBadgeVariant('critical')).toBe('destructive');
    });

    it('getBreachSeverityColor returns correct color classes', () => {
      expect(riskScenario.getBreachSeverityColor('minor')).toContain('yellow');
      expect(riskScenario.getBreachSeverityColor('moderate')).toContain('orange');
      expect(riskScenario.getBreachSeverityColor('severe')).toContain('red');
      expect(riskScenario.getBreachSeverityColor('critical')).toContain('red');
    });

    it('formatPercentage formats correctly', () => {
      expect(riskScenario.formatPercentage(10.5)).toBe('+10.5%');
      expect(riskScenario.formatPercentage(-5.2)).toBe('-5.2%');
      expect(riskScenario.formatPercentage(0)).toBe('+0.0%');
    });

    it('formatScenarioCurrency formats correctly', () => {
      expect(riskScenario.formatScenarioCurrency(1500000000)).toBe('$1.5B');
      expect(riskScenario.formatScenarioCurrency(250000000)).toBe('$250.0M');
      expect(riskScenario.formatScenarioCurrency(75000)).toBe('$75.0K');
      expect(riskScenario.formatScenarioCurrency(500)).toBe('$500');
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('Simulation failed'));

      await expect(
        riskScenario.simulateRiskScenario(mockSimulationInput)
      ).rejects.toThrow('Simulation failed');
    });
  });
});
