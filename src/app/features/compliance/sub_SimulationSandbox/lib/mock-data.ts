// =============================================================================
// Simulation Sandbox Mock Data
// =============================================================================

import type {
  StressTestTemplate,
  SimulationScenario,
  SimulationResult,
  SimulationDashboardStats,
  CovenantImpact,
  CascadeEffect,
  ScenarioComment,
  MonteCarloConfig,
  RateChangeParams,
  EbitdaFluctuationParams,
  MAEventParams,
  IndustryDownturnParams,
} from './types';

// =============================================================================
// Stress Test Templates
// =============================================================================

export const stressTestTemplates: StressTestTemplate[] = [
  {
    id: 'template-ccar-severely-adverse',
    name: 'CCAR Severely Adverse',
    description: 'Federal Reserve CCAR severely adverse scenario with significant economic contraction, elevated unemployment, and falling asset prices.',
    regulatory_type: 'fed_ccar',
    is_builtin: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scenarios: [
      {
        id: 'ccar-rate-shock',
        name: 'Interest Rate Shock',
        description: 'Sharp increase in interest rates as per CCAR guidelines',
        type: 'rate_change',
        severity: 'severe',
        time_horizon_quarters: 9,
        basis_points_change: 300,
        change_type: 'gradual',
        ramp_quarters: 4,
      } as RateChangeParams,
      {
        id: 'ccar-ebitda-decline',
        name: 'EBITDA Decline',
        description: 'Significant decline in corporate earnings',
        type: 'ebitda_fluctuation',
        severity: 'severe',
        time_horizon_quarters: 9,
        ebitda_change_percentage: -35,
        impact_duration: 'temporary',
        recovery_quarters: 6,
      } as EbitdaFluctuationParams,
    ],
    monte_carlo_config: {
      iterations: 10000,
      confidence_levels: [0.05, 0.25, 0.5, 0.75, 0.95],
      variables: [
        {
          id: 'ebitda_change',
          name: 'EBITDA Change',
          base_value: -0.35,
          distribution: 'normal',
          std_dev: 0.1,
        },
        {
          id: 'rate_change',
          name: 'Rate Change',
          base_value: 0.03,
          distribution: 'normal',
          std_dev: 0.01,
        },
      ],
    },
    tags: ['regulatory', 'ccar', 'stress-test', 'federal-reserve'],
  },
  {
    id: 'template-dfast-adverse',
    name: 'DFAST Adverse',
    description: 'Federal Reserve DFAST adverse scenario with moderate recession characteristics.',
    regulatory_type: 'fed_dfast',
    is_builtin: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scenarios: [
      {
        id: 'dfast-rate',
        name: 'Moderate Rate Increase',
        description: 'Moderate increase in interest rates',
        type: 'rate_change',
        severity: 'moderate',
        time_horizon_quarters: 9,
        basis_points_change: 150,
        change_type: 'gradual',
        ramp_quarters: 6,
      } as RateChangeParams,
      {
        id: 'dfast-ebitda',
        name: 'Moderate EBITDA Decline',
        description: 'Moderate decline in corporate earnings',
        type: 'ebitda_fluctuation',
        severity: 'moderate',
        time_horizon_quarters: 9,
        ebitda_change_percentage: -20,
        impact_duration: 'temporary',
        recovery_quarters: 4,
      } as EbitdaFluctuationParams,
    ],
    tags: ['regulatory', 'dfast', 'stress-test', 'federal-reserve'],
  },
  {
    id: 'template-rate-shock-mild',
    name: 'Mild Rate Shock (+100bps)',
    description: 'Test impact of a 100 basis point increase in interest rates on covenant compliance.',
    regulatory_type: 'custom',
    is_builtin: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scenarios: [
      {
        id: 'rate-100bps',
        name: 'Rate Increase 100bps',
        description: '100 basis point rate increase',
        type: 'rate_change',
        severity: 'mild',
        time_horizon_quarters: 4,
        basis_points_change: 100,
        change_type: 'immediate',
      } as RateChangeParams,
    ],
    tags: ['rate-shock', 'interest-rate', 'quick-test'],
  },
  {
    id: 'template-rate-shock-severe',
    name: 'Severe Rate Shock (+300bps)',
    description: 'Test impact of a 300 basis point increase in interest rates on covenant compliance.',
    regulatory_type: 'custom',
    is_builtin: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scenarios: [
      {
        id: 'rate-300bps',
        name: 'Rate Increase 300bps',
        description: '300 basis point rate increase',
        type: 'rate_change',
        severity: 'severe',
        time_horizon_quarters: 4,
        basis_points_change: 300,
        change_type: 'immediate',
      } as RateChangeParams,
    ],
    tags: ['rate-shock', 'interest-rate', 'severe'],
  },
  {
    id: 'template-ebitda-25',
    name: 'EBITDA Decline 25%',
    description: 'Simulate impact of a 25% decline in EBITDA on all covenants.',
    regulatory_type: 'custom',
    is_builtin: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scenarios: [
      {
        id: 'ebitda-25-decline',
        name: 'EBITDA -25%',
        description: '25% decline in EBITDA',
        type: 'ebitda_fluctuation',
        severity: 'moderate',
        time_horizon_quarters: 4,
        ebitda_change_percentage: -25,
        impact_duration: 'permanent',
      } as EbitdaFluctuationParams,
    ],
    tags: ['ebitda', 'earnings-decline'],
  },
  {
    id: 'template-ma-acquisition',
    name: 'Leveraged Acquisition',
    description: 'Simulate a debt-financed acquisition with synergy realization over time.',
    regulatory_type: 'custom',
    is_builtin: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scenarios: [
      {
        id: 'acquisition-levered',
        name: 'Leveraged Acquisition',
        description: 'Debt-financed acquisition with synergies',
        type: 'ma_event',
        severity: 'moderate',
        time_horizon_quarters: 8,
        event_type: 'acquisition',
        transaction_value_percentage: 30,
        debt_change_percentage: 40,
        ebitda_synergy_percentage: 15,
        synergy_realization_quarters: 6,
      } as MAEventParams,
    ],
    tags: ['m&a', 'acquisition', 'leverage'],
  },
  {
    id: 'template-industry-downturn-retail',
    name: 'Retail Sector Downturn',
    description: 'Simulate retail industry-specific downturn with consumer spending decline.',
    regulatory_type: 'custom',
    is_builtin: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scenarios: [
      {
        id: 'retail-downturn',
        name: 'Retail Downturn',
        description: 'Industry-wide retail contraction',
        type: 'industry_downturn',
        severity: 'severe',
        time_horizon_quarters: 6,
        affected_industry: 'retail',
        revenue_decline_percentage: 30,
        margin_compression_bps: 250,
        downturn_duration_quarters: 4,
        recovery_shape: 'u',
      } as IndustryDownturnParams,
    ],
    tags: ['industry', 'retail', 'downturn'],
  },
  {
    id: 'template-industry-downturn-manufacturing',
    name: 'Manufacturing Recession',
    description: 'Simulate manufacturing sector recession with supply chain disruption.',
    regulatory_type: 'custom',
    is_builtin: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scenarios: [
      {
        id: 'manufacturing-recession',
        name: 'Manufacturing Recession',
        description: 'Manufacturing sector recession',
        type: 'industry_downturn',
        severity: 'severe',
        time_horizon_quarters: 8,
        affected_industry: 'manufacturing',
        revenue_decline_percentage: 25,
        margin_compression_bps: 200,
        downturn_duration_quarters: 5,
        recovery_shape: 'u',
      } as IndustryDownturnParams,
    ],
    tags: ['industry', 'manufacturing', 'recession'],
  },
  {
    id: 'template-combined-stress',
    name: 'Combined Stress Scenario',
    description: 'Multiple simultaneous stress factors: rate increase, EBITDA decline, and margin compression.',
    regulatory_type: 'custom',
    is_builtin: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scenarios: [
      {
        id: 'combined-rate',
        name: 'Rate Increase',
        description: '200bps rate increase',
        type: 'rate_change',
        severity: 'moderate',
        time_horizon_quarters: 4,
        basis_points_change: 200,
        change_type: 'gradual',
        ramp_quarters: 2,
      } as RateChangeParams,
      {
        id: 'combined-ebitda',
        name: 'EBITDA Decline',
        description: '20% EBITDA decline',
        type: 'ebitda_fluctuation',
        severity: 'moderate',
        time_horizon_quarters: 4,
        ebitda_change_percentage: -20,
        impact_duration: 'temporary',
        recovery_quarters: 4,
      } as EbitdaFluctuationParams,
    ],
    monte_carlo_config: {
      iterations: 5000,
      confidence_levels: [0.05, 0.25, 0.5, 0.75, 0.95],
      variables: [
        {
          id: 'ebitda_change',
          name: 'EBITDA Change',
          base_value: -0.20,
          distribution: 'normal',
          std_dev: 0.08,
          correlations: { rate_change: 0.3 },
        },
        {
          id: 'rate_change',
          name: 'Rate Change',
          base_value: 0.02,
          distribution: 'normal',
          std_dev: 0.005,
          correlations: { ebitda_change: 0.3 },
        },
      ],
    },
    tags: ['combined', 'multi-factor', 'stress-test'],
  },
];

// =============================================================================
// Saved Simulation Scenarios
// =============================================================================

export const savedScenarios: SimulationScenario[] = [
  {
    id: 'scenario-001',
    name: 'Q1 2025 Rate Sensitivity Analysis',
    description: 'Analysis of portfolio sensitivity to rate increases ahead of Fed meeting',
    version: 2,
    created_by: 'john.smith@bank.com',
    created_at: '2024-12-01T10:00:00Z',
    modified_at: '2024-12-05T14:30:00Z',
    status: 'completed',
    params: [
      {
        id: 'rate-sensitivity',
        name: 'Rate Sensitivity',
        description: 'Testing 50-200bps rate scenarios',
        type: 'rate_change',
        severity: 'moderate',
        time_horizon_quarters: 4,
        basis_points_change: 150,
        change_type: 'immediate',
      } as RateChangeParams,
    ],
    monte_carlo_config: {
      iterations: 5000,
      confidence_levels: [0.05, 0.25, 0.5, 0.75, 0.95],
      variables: [
        {
          id: 'rate_change',
          name: 'Rate Change',
          base_value: 0.015,
          distribution: 'uniform',
          min_value: 0.005,
          max_value: 0.02,
        },
      ],
    },
    selected_covenant_ids: ['1', '2', '3', '4', '5', '6'],
    selected_facility_ids: ['1', '2', '3', '4', '5'],
    tags: ['rate-sensitivity', 'q1-2025', 'fed-meeting'],
    is_shared: true,
    collaborators: ['sarah.jones@bank.com', 'mike.wilson@bank.com'],
    notes: 'Initial analysis complete. Need to review with credit committee.',
  },
  {
    id: 'scenario-002',
    name: 'Delta Manufacturing Stress Test',
    description: 'Targeted stress test for Delta Manufacturing given current waiver status',
    version: 1,
    created_by: 'sarah.jones@bank.com',
    created_at: '2024-12-06T09:00:00Z',
    modified_at: '2024-12-06T16:00:00Z',
    status: 'completed',
    params: [
      {
        id: 'ebitda-stress',
        name: 'EBITDA Stress',
        description: 'Testing further EBITDA deterioration',
        type: 'ebitda_fluctuation',
        severity: 'severe',
        time_horizon_quarters: 4,
        ebitda_change_percentage: -15,
        impact_duration: 'temporary',
        recovery_quarters: 3,
      } as EbitdaFluctuationParams,
    ],
    selected_covenant_ids: ['4'],
    selected_facility_ids: ['3'],
    tags: ['delta-manufacturing', 'targeted', 'waiver'],
    is_shared: true,
    collaborators: ['john.smith@bank.com'],
  },
  {
    id: 'scenario-003',
    name: 'Retail Sector Impact Analysis',
    description: 'Analyzing potential retail downturn impact across portfolio',
    version: 1,
    created_by: 'mike.wilson@bank.com',
    created_at: '2024-12-07T11:00:00Z',
    modified_at: '2024-12-07T11:00:00Z',
    status: 'draft',
    params: [
      {
        id: 'retail-downturn',
        name: 'Retail Industry Downturn',
        description: 'Retail sector stress scenario',
        type: 'industry_downturn',
        severity: 'severe',
        time_horizon_quarters: 6,
        affected_industry: 'retail',
        revenue_decline_percentage: 25,
        margin_compression_bps: 200,
        downturn_duration_quarters: 4,
        recovery_shape: 'u',
      } as IndustryDownturnParams,
    ],
    selected_covenant_ids: [],
    selected_facility_ids: [],
    tags: ['retail', 'sector-analysis', 'draft'],
    is_shared: false,
    collaborators: [],
  },
];

// =============================================================================
// Simulation Results
// =============================================================================

export const simulationResults: SimulationResult[] = [
  {
    id: 'result-001',
    scenario_id: 'scenario-001',
    scenario_name: 'Q1 2025 Rate Sensitivity Analysis',
    run_at: '2024-12-05T14:25:00Z',
    runtime_ms: 2450,
    status: 'completed',
    params: savedScenarios[0].params,
    covenant_impacts: [
      {
        covenant_id: '1',
        covenant_name: 'Leverage Ratio',
        facility_name: 'ABC Holdings - Term Loan A',
        borrower_name: 'ABC Holdings LLC',
        covenant_type: 'leverage_ratio',
        current_value: 3.2,
        current_threshold: 4.0,
        current_headroom: 20.0,
        projected_value: 3.35,
        projected_headroom: 16.25,
        headroom_change: -3.75,
        would_breach: false,
        current_status: 'active',
        projected_status: 'active',
        impact_level: 'low',
        quarterly_projections: [
          { quarter: 'Q1 2025', projected_value: 3.25, projected_headroom: 18.75, breach_probability: 2 },
          { quarter: 'Q2 2025', projected_value: 3.30, projected_headroom: 17.5, breach_probability: 5 },
          { quarter: 'Q3 2025', projected_value: 3.35, projected_headroom: 16.25, breach_probability: 8 },
          { quarter: 'Q4 2025', projected_value: 3.35, projected_headroom: 16.25, breach_probability: 8 },
        ],
      },
      {
        covenant_id: '2',
        covenant_name: 'Interest Coverage Ratio',
        facility_name: 'ABC Holdings - Term Loan A',
        borrower_name: 'ABC Holdings LLC',
        covenant_type: 'interest_coverage',
        current_value: 3.8,
        current_threshold: 2.5,
        current_headroom: 52.0,
        projected_value: 3.2,
        projected_headroom: 28.0,
        headroom_change: -24.0,
        would_breach: false,
        current_status: 'active',
        projected_status: 'active',
        impact_level: 'moderate',
        quarterly_projections: [
          { quarter: 'Q1 2025', projected_value: 3.5, projected_headroom: 40.0, breach_probability: 1 },
          { quarter: 'Q2 2025', projected_value: 3.35, projected_headroom: 34.0, breach_probability: 3 },
          { quarter: 'Q3 2025', projected_value: 3.2, projected_headroom: 28.0, breach_probability: 5 },
          { quarter: 'Q4 2025', projected_value: 3.2, projected_headroom: 28.0, breach_probability: 5 },
        ],
      },
      {
        covenant_id: '3',
        covenant_name: 'Leverage Ratio',
        facility_name: 'XYZ Corp Revolver',
        borrower_name: 'XYZ Corporation',
        covenant_type: 'leverage_ratio',
        current_value: 3.1,
        current_threshold: 3.5,
        current_headroom: 11.4,
        projected_value: 3.25,
        projected_headroom: 7.1,
        headroom_change: -4.3,
        would_breach: false,
        current_status: 'active',
        projected_status: 'active',
        impact_level: 'moderate',
        quarterly_projections: [
          { quarter: 'Q1 2025', projected_value: 3.15, projected_headroom: 10.0, breach_probability: 15 },
          { quarter: 'Q2 2025', projected_value: 3.20, projected_headroom: 8.6, breach_probability: 22 },
          { quarter: 'Q3 2025', projected_value: 3.25, projected_headroom: 7.1, breach_probability: 28 },
          { quarter: 'Q4 2025', projected_value: 3.25, projected_headroom: 7.1, breach_probability: 28 },
        ],
      },
      {
        covenant_id: '4',
        covenant_name: 'Fixed Charge Coverage',
        facility_name: 'Delta Manufacturing TL',
        borrower_name: 'Delta Manufacturing Co',
        covenant_type: 'fixed_charge_coverage',
        current_value: 1.05,
        current_threshold: 1.2,
        current_headroom: -12.5,
        projected_value: 0.92,
        projected_headroom: -23.3,
        headroom_change: -10.8,
        would_breach: true,
        current_status: 'waived',
        projected_status: 'breached',
        impact_level: 'critical',
        quarterly_projections: [
          { quarter: 'Q1 2025', projected_value: 1.0, projected_headroom: -16.7, breach_probability: 92 },
          { quarter: 'Q2 2025', projected_value: 0.95, projected_headroom: -20.8, breach_probability: 95 },
          { quarter: 'Q3 2025', projected_value: 0.92, projected_headroom: -23.3, breach_probability: 97 },
          { quarter: 'Q4 2025', projected_value: 0.92, projected_headroom: -23.3, breach_probability: 97 },
        ],
      },
      {
        covenant_id: '6',
        covenant_name: 'Interest Coverage',
        facility_name: 'Sigma Holdings ABL',
        borrower_name: 'Sigma Holdings Inc',
        covenant_type: 'interest_coverage',
        current_value: 1.4,
        current_threshold: 2.0,
        current_headroom: -30.0,
        projected_value: 1.18,
        projected_headroom: -41.0,
        headroom_change: -11.0,
        would_breach: true,
        current_status: 'breached',
        projected_status: 'breached',
        impact_level: 'critical',
        quarterly_projections: [
          { quarter: 'Q1 2025', projected_value: 1.3, projected_headroom: -35.0, breach_probability: 99 },
          { quarter: 'Q2 2025', projected_value: 1.24, projected_headroom: -38.0, breach_probability: 99 },
          { quarter: 'Q3 2025', projected_value: 1.18, projected_headroom: -41.0, breach_probability: 99 },
          { quarter: 'Q4 2025', projected_value: 1.18, projected_headroom: -41.0, breach_probability: 99 },
        ],
      },
    ],
    cascade_effects: [
      {
        primary_covenant_id: '4',
        affected_covenants: [
          {
            covenant_id: '1',
            relationship: 'cross_default',
            impact_delay_quarters: 1,
            impact_probability: 15,
          },
        ],
        total_exposure_at_risk: 75000000,
        description: 'Delta Manufacturing breach could trigger cross-default review for ABC Holdings given common sponsor relationship.',
      },
    ],
    monte_carlo_result: {
      id: 'mc-001',
      config: savedScenarios[0].monte_carlo_config!,
      run_at: '2024-12-05T14:25:00Z',
      runtime_ms: 1800,
      successful_iterations: 5000,
      distributions: {
        '1': {
          covenant_id: '1',
          metric: 'ratio',
          mean: 3.32,
          std_dev: 0.08,
          min: 3.12,
          max: 3.58,
          percentiles: { 5: 3.18, 25: 3.27, 50: 3.32, 75: 3.38, 95: 3.48 },
          breach_probability: 3.2,
        },
        '3': {
          covenant_id: '3',
          metric: 'ratio',
          mean: 3.22,
          std_dev: 0.12,
          min: 2.95,
          max: 3.62,
          percentiles: { 5: 3.02, 25: 3.14, 50: 3.22, 75: 3.30, 95: 3.42 },
          breach_probability: 22.5,
        },
      },
      portfolio_breach_probability: 35.8,
      expected_breaches: 0.42,
      worst_case: {
        breach_count: 3,
        affected_covenants: ['3', '4', '6'],
        total_exposure: 200000000,
      },
      summary: {
        mean_portfolio_headroom: 18.5,
        std_dev_portfolio_headroom: 12.3,
        var_95: -8.2,
        var_99: -15.4,
      },
    },
    summary: {
      total_covenants_analyzed: 5,
      covenants_at_risk_before: 2,
      covenants_at_risk_after: 3,
      covenants_breached_before: 2,
      covenants_breached_after: 2,
      new_breaches: 0,
      worst_affected_covenant: 'Interest Coverage - Sigma Holdings',
      worst_headroom_change: -11.0,
      total_exposure_at_risk: 275000000,
    },
    insights: [
      'Interest rate increase has most significant impact on interest coverage ratios across portfolio',
      'XYZ Corporation leverage ratio approaching critical threshold - headroom drops to 7.1%',
      'Delta Manufacturing FCCR deterioration accelerates under rate stress scenario',
      'ABC Holdings maintains healthy headroom despite rate increase',
      'Cross-default risk between Delta Manufacturing and ABC Holdings warrants monitoring',
    ],
    recommendations: [
      'Engage XYZ Corporation proactively about potential covenant amendment before Q3 2025',
      'Accelerate Delta Manufacturing workout discussions given waiver expiration',
      'Consider hedging interest rate exposure for facilities with sub-15% headroom',
      'Review Sigma Holdings exposure and potential participation sale',
      'Update credit committee on elevated portfolio stress under rate scenario',
    ],
  },
  {
    id: 'result-002',
    scenario_id: 'scenario-002',
    scenario_name: 'Delta Manufacturing Stress Test',
    run_at: '2024-12-06T15:45:00Z',
    runtime_ms: 850,
    status: 'completed',
    params: savedScenarios[1].params,
    covenant_impacts: [
      {
        covenant_id: '4',
        covenant_name: 'Fixed Charge Coverage',
        facility_name: 'Delta Manufacturing TL',
        borrower_name: 'Delta Manufacturing Co',
        covenant_type: 'fixed_charge_coverage',
        current_value: 1.05,
        current_threshold: 1.2,
        current_headroom: -12.5,
        projected_value: 0.89,
        projected_headroom: -25.8,
        headroom_change: -13.3,
        would_breach: true,
        current_status: 'waived',
        projected_status: 'breached',
        impact_level: 'critical',
        quarterly_projections: [
          { quarter: 'Q1 2025', projected_value: 0.95, projected_headroom: -20.8, breach_probability: 98 },
          { quarter: 'Q2 2025', projected_value: 0.89, projected_headroom: -25.8, breach_probability: 99 },
          { quarter: 'Q3 2025', projected_value: 0.92, projected_headroom: -23.3, breach_probability: 98 },
          { quarter: 'Q4 2025', projected_value: 0.98, projected_headroom: -18.3, breach_probability: 95 },
        ],
      },
    ],
    cascade_effects: [],
    summary: {
      total_covenants_analyzed: 1,
      covenants_at_risk_before: 1,
      covenants_at_risk_after: 1,
      covenants_breached_before: 1,
      covenants_breached_after: 1,
      new_breaches: 0,
      worst_affected_covenant: 'Fixed Charge Coverage',
      worst_headroom_change: -13.3,
      total_exposure_at_risk: 75000000,
    },
    insights: [
      'Additional 15% EBITDA decline would push FCCR to 0.89x, deepening breach',
      'Recovery timeline suggests Q4 2025 before meaningful improvement',
      'Current waiver provides temporary protection but underlying trend is negative',
    ],
    recommendations: [
      'Waiver extension or amendment negotiations should begin immediately',
      'Request detailed 12-month cash flow forecast from borrower',
      'Evaluate collateral position and consider enhanced monitoring',
      'Prepare contingency workout strategy if improvement not achieved',
    ],
  },
];

// =============================================================================
// Scenario Comments
// =============================================================================

export const scenarioComments: ScenarioComment[] = [
  {
    id: 'comment-001',
    scenario_id: 'scenario-001',
    author: 'sarah.jones@bank.com',
    text: 'I think we should also run a more severe 250bps scenario to stress test the portfolio further.',
    created_at: '2024-12-05T15:00:00Z',
    is_resolved: false,
  },
  {
    id: 'comment-002',
    scenario_id: 'scenario-001',
    author: 'john.smith@bank.com',
    text: 'Good point. I\'ll add that as a variant scenario and we can compare results.',
    created_at: '2024-12-05T15:15:00Z',
    parent_id: 'comment-001',
    is_resolved: false,
  },
  {
    id: 'comment-003',
    scenario_id: 'scenario-001',
    author: 'mike.wilson@bank.com',
    text: 'The XYZ Corp results are concerning. We should flag this for the credit committee.',
    created_at: '2024-12-05T16:00:00Z',
    is_resolved: true,
  },
];

// =============================================================================
// Dashboard Statistics
// =============================================================================

export const simulationDashboardStats: SimulationDashboardStats = {
  total_scenarios: 12,
  runs_this_month: 28,
  avg_at_risk_covenants: 2.8,
  most_common_scenario_type: 'rate_change',
  last_run_at: '2024-12-08T09:30:00Z',
  total_runs: 156,
  available_templates: 9,
  team_members_with_access: 8,
};

// =============================================================================
// Helper Functions
// =============================================================================

export function getTemplateById(id: string): StressTestTemplate | undefined {
  return stressTestTemplates.find(t => t.id === id);
}

export function getScenarioById(id: string): SimulationScenario | undefined {
  return savedScenarios.find(s => s.id === id);
}

export function getResultByScenarioId(scenarioId: string): SimulationResult | undefined {
  return simulationResults.find(r => r.scenario_id === scenarioId);
}

export function getCommentsForScenario(scenarioId: string): ScenarioComment[] {
  return scenarioComments.filter(c => c.scenario_id === scenarioId);
}

export function getTemplatesByTag(tag: string): StressTestTemplate[] {
  return stressTestTemplates.filter(t => t.tags.includes(tag));
}

export function getRecentScenarios(limit: number = 5): SimulationScenario[] {
  return [...savedScenarios]
    .sort((a, b) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime())
    .slice(0, limit);
}
