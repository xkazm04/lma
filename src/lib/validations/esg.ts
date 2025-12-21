import { z } from 'zod';

// ============================================
// Enums
// ============================================

export const esgLoanTypeSchema = z.enum([
  'sustainability_linked',
  'green_loan',
  'social_loan',
  'transition_loan',
  'esg_linked_hybrid',
]);

export const esgFacilityStatusSchema = z.enum([
  'active',
  'closed',
  'suspended',
]);

export const kpiCategorySchema = z.enum([
  'environmental_emissions',
  'environmental_energy',
  'environmental_water',
  'environmental_waste',
  'environmental_biodiversity',
  'social_workforce',
  'social_health_safety',
  'social_community',
  'social_supply_chain',
  'governance_board',
  'governance_ethics',
  'governance_risk',
  'other',
]);

export const improvementDirectionSchema = z.enum([
  'decrease',
  'increase',
]);

export const verificationFrequencySchema = z.enum([
  'annual',
  'semi_annual',
  'per_test',
]);

export const targetPeriodSchema = z.enum([
  'annual',
  'h1',
  'h2',
  'q1',
  'q2',
  'q3',
  'q4',
]);

export const targetTypeSchema = z.enum([
  'absolute',
  'intensity',
  'percentage_reduction',
]);

export const marginAdjustmentDirectionSchema = z.enum([
  'benefit_if_met',
  'penalty_if_missed',
  'both',
]);

export const dataSourceSchema = z.enum([
  'borrower_reported',
  'system_calculated',
  'third_party',
  'verified',
]);

export const verificationStatusSchema = z.enum([
  'pending',
  'in_progress',
  'verified',
  'rejected',
]);

export const proceedsCategoryTypeSchema = z.enum([
  'green',
  'social',
]);

export const projectStatusSchema = z.enum([
  'planned',
  'in_progress',
  'completed',
]);

export const reportTypeSchema = z.enum([
  'annual_sustainability_report',
  'kpi_performance_report',
  'allocation_report',
  'impact_report',
  'verification_assurance_report',
  'external_rating_update',
  'other',
]);

export const reportFrequencySchema = z.enum([
  'annual',
  'semi_annual',
  'quarterly',
  'on_occurrence',
]);

export const reportStatusSchema = z.enum([
  'submitted',
  'under_review',
  'accepted',
  'rejected',
]);

export const ratingProviderSchema = z.enum([
  'msci',
  'sustainalytics',
  'sp_global',
  'moodys_esg',
  'cdp',
  'internal',
  'other',
]);

export const ratingCategorySchema = z.enum([
  'leader',
  'average',
  'laggard',
]);

// ============================================
// ESG Facility Schemas
// ============================================

export const createESGFacilitySchema = z.object({
  source_facility_id: z.string().uuid().optional(),
  compliance_facility_id: z.string().uuid().optional(),
  facility_name: z.string().min(1).max(200),
  facility_reference: z.string().min(1).max(100),
  borrower_name: z.string().min(1).max(200),
  borrower_industry: z.string().max(100).optional(),
  esg_loan_type: esgLoanTypeSchema,
  aligned_frameworks: z.array(z.string()).optional(),
  base_margin: z.number().optional(),
  margin_adjustment_mechanism: z.record(z.string(), z.unknown()).optional(),
  effective_date: z.string(),
  maturity_date: z.string(),
});

export const updateESGFacilitySchema = z.object({
  source_facility_id: z.string().uuid().optional().nullable(),
  compliance_facility_id: z.string().uuid().optional().nullable(),
  facility_name: z.string().min(1).max(200).optional(),
  facility_reference: z.string().min(1).max(100).optional(),
  borrower_name: z.string().min(1).max(200).optional(),
  borrower_industry: z.string().max(100).optional().nullable(),
  esg_loan_type: esgLoanTypeSchema.optional(),
  aligned_frameworks: z.array(z.string()).optional().nullable(),
  base_margin: z.number().optional().nullable(),
  margin_adjustment_mechanism: z.record(z.string(), z.unknown()).optional().nullable(),
  effective_date: z.string().optional(),
  maturity_date: z.string().optional(),
  status: esgFacilityStatusSchema.optional(),
});

// ============================================
// KPI Schemas
// ============================================

export const createKPISchema = z.object({
  source_provision_id: z.string().uuid().optional(),
  kpi_name: z.string().min(1).max(200),
  kpi_category: kpiCategorySchema,
  kpi_subcategory: z.string().max(100).optional(),
  unit_of_measure: z.string().min(1).max(50),
  measurement_methodology: z.string().optional(),
  boundary_scope: z.string().optional(),
  baseline_year: z.number().int().min(2000).max(2100).optional(),
  baseline_value: z.number().optional(),
  baseline_verified: z.boolean().optional(),
  baseline_verifier: z.string().max(200).optional(),
  improvement_direction: improvementDirectionSchema,
  is_core_kpi: z.boolean().optional(),
  weighting: z.number().min(0).max(100).optional(),
  requires_external_verification: z.boolean().optional(),
  verification_frequency: verificationFrequencySchema.optional(),
  acceptable_verifiers: z.array(z.string()).optional(),
  clause_reference: z.string().max(100).optional(),
});

export const updateKPISchema = z.object({
  source_provision_id: z.string().uuid().optional().nullable(),
  kpi_name: z.string().min(1).max(200).optional(),
  kpi_category: kpiCategorySchema.optional(),
  kpi_subcategory: z.string().max(100).optional().nullable(),
  unit_of_measure: z.string().min(1).max(50).optional(),
  measurement_methodology: z.string().optional().nullable(),
  boundary_scope: z.string().optional().nullable(),
  baseline_year: z.number().int().min(2000).max(2100).optional().nullable(),
  baseline_value: z.number().optional().nullable(),
  baseline_verified: z.boolean().optional(),
  baseline_verifier: z.string().max(200).optional().nullable(),
  improvement_direction: improvementDirectionSchema.optional(),
  is_core_kpi: z.boolean().optional(),
  weighting: z.number().min(0).max(100).optional().nullable(),
  requires_external_verification: z.boolean().optional(),
  verification_frequency: verificationFrequencySchema.optional().nullable(),
  acceptable_verifiers: z.array(z.string()).optional().nullable(),
  clause_reference: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional(),
});

// ============================================
// Target Schemas
// ============================================

export const createTargetSchema = z.object({
  target_year: z.number().int().min(2020).max(2100),
  target_period: targetPeriodSchema,
  target_date: z.string(),
  target_value: z.number(),
  target_type: targetTypeSchema,
  science_based: z.boolean().optional(),
  science_based_initiative: z.string().max(100).optional(),
  paris_aligned: z.boolean().optional(),
  margin_adjustment_bps: z.number().optional(),
  margin_adjustment_direction: marginAdjustmentDirectionSchema.optional(),
});

export const updateTargetSchema = z.object({
  target_year: z.number().int().min(2020).max(2100).optional(),
  target_period: targetPeriodSchema.optional(),
  target_date: z.string().optional(),
  target_value: z.number().optional(),
  target_type: targetTypeSchema.optional(),
  science_based: z.boolean().optional(),
  science_based_initiative: z.string().max(100).optional().nullable(),
  paris_aligned: z.boolean().optional(),
  margin_adjustment_bps: z.number().optional().nullable(),
  margin_adjustment_direction: marginAdjustmentDirectionSchema.optional().nullable(),
});

// ============================================
// Performance Schemas
// ============================================

export const submitPerformanceSchema = z.object({
  target_id: z.string().uuid(),
  reporting_period_start: z.string(),
  reporting_period_end: z.string(),
  measurement_date: z.string(),
  actual_value: z.number(),
  data_source: dataSourceSchema,
  data_quality_score: z.number().min(0).max(100).optional(),
  calculation_details: z.record(z.string(), z.unknown()).optional(),
  supporting_documents: z.array(z.string().uuid()).optional(),
});

export const updatePerformanceSchema = z.object({
  actual_value: z.number().optional(),
  data_source: dataSourceSchema.optional(),
  data_quality_score: z.number().min(0).max(100).optional().nullable(),
  calculation_details: z.record(z.string(), z.unknown()).optional().nullable(),
  supporting_documents: z.array(z.string().uuid()).optional().nullable(),
});

export const submitForVerificationSchema = z.object({
  verifier_name: z.string().min(1).max(200),
  verification_notes: z.string().optional(),
});

export const updateVerificationSchema = z.object({
  verification_status: verificationStatusSchema,
  verifier_name: z.string().max(200).optional(),
  verification_date: z.string().optional(),
  verification_report_id: z.string().uuid().optional(),
  verification_notes: z.string().optional(),
  target_met: z.boolean().optional(),
  margin_adjustment_applied: z.number().optional(),
});

// ============================================
// Use of Proceeds Schemas
// ============================================

export const createProceedsCategorySchema = z.object({
  category_name: z.string().min(1).max(200),
  category_type: proceedsCategoryTypeSchema,
  eligibility_criteria: z.string().optional(),
  aligned_taxonomy: z.string().max(100).optional(),
  taxonomy_activity_code: z.string().max(50).optional(),
  minimum_allocation_percentage: z.number().min(0).max(100).optional(),
  maximum_allocation_percentage: z.number().min(0).max(100).optional(),
  expected_impact_metrics: z.array(z.object({
    metric: z.string(),
    unit: z.string(),
    expected_value: z.number().optional(),
  })).optional(),
  clause_reference: z.string().max(100).optional(),
});

export const updateProceedsCategorySchema = z.object({
  category_name: z.string().min(1).max(200).optional(),
  category_type: proceedsCategoryTypeSchema.optional(),
  eligibility_criteria: z.string().optional().nullable(),
  aligned_taxonomy: z.string().max(100).optional().nullable(),
  taxonomy_activity_code: z.string().max(50).optional().nullable(),
  minimum_allocation_percentage: z.number().min(0).max(100).optional().nullable(),
  maximum_allocation_percentage: z.number().min(0).max(100).optional().nullable(),
  expected_impact_metrics: z.array(z.object({
    metric: z.string(),
    unit: z.string(),
    expected_value: z.number().optional(),
  })).optional().nullable(),
  clause_reference: z.string().max(100).optional().nullable(),
});

export const createAllocationSchema = z.object({
  category_id: z.string().uuid(),
  project_name: z.string().min(1).max(200),
  project_description: z.string().optional(),
  project_location: z.string().max(200).optional(),
  project_start_date: z.string().optional(),
  project_status: projectStatusSchema.optional(),
  allocated_amount: z.number().positive(),
  allocation_date: z.string(),
  allocation_currency: z.string().length(3).optional(),
  impact_metrics: z.array(z.object({
    metric: z.string(),
    unit: z.string(),
    value: z.number(),
    period: z.string().optional(),
  })).optional(),
});

export const updateAllocationSchema = z.object({
  category_id: z.string().uuid().optional(),
  project_name: z.string().min(1).max(200).optional(),
  project_description: z.string().optional().nullable(),
  project_location: z.string().max(200).optional().nullable(),
  project_start_date: z.string().optional().nullable(),
  project_status: projectStatusSchema.optional(),
  allocated_amount: z.number().positive().optional(),
  allocation_date: z.string().optional(),
  allocation_currency: z.string().length(3).optional(),
  impact_metrics: z.array(z.object({
    metric: z.string(),
    unit: z.string(),
    value: z.number(),
    period: z.string().optional(),
  })).optional().nullable(),
  allocation_verified: z.boolean().optional(),
  verification_date: z.string().optional().nullable(),
  verifier_name: z.string().max(200).optional().nullable(),
});

export const recordUnallocatedSchema = z.object({
  as_of_date: z.string(),
  unallocated_amount: z.number().min(0),
  temporary_investment: z.string().optional(),
});

// ============================================
// Rating Schemas
// ============================================

export const createRatingSchema = z.object({
  facility_id: z.string().uuid().optional(),
  borrower_id: z.string().uuid().optional(),
  rating_provider: ratingProviderSchema,
  provider_name: z.string().min(1).max(200),
  rating_type: z.string().min(1).max(100),
  rating_value: z.string().min(1).max(50),
  rating_scale: z.string().max(100).optional(),
  rating_category: ratingCategorySchema.optional(),
  environmental_score: z.number().optional(),
  social_score: z.number().optional(),
  governance_score: z.number().optional(),
  rating_date: z.string(),
  valid_until: z.string().optional(),
  rating_document_id: z.string().uuid().optional(),
});

export const updateRatingSchema = z.object({
  rating_provider: ratingProviderSchema.optional(),
  provider_name: z.string().min(1).max(200).optional(),
  rating_type: z.string().min(1).max(100).optional(),
  rating_value: z.string().min(1).max(50).optional(),
  rating_scale: z.string().max(100).optional().nullable(),
  rating_category: ratingCategorySchema.optional().nullable(),
  environmental_score: z.number().optional().nullable(),
  social_score: z.number().optional().nullable(),
  governance_score: z.number().optional().nullable(),
  rating_date: z.string().optional(),
  valid_until: z.string().optional().nullable(),
  rating_document_id: z.string().uuid().optional().nullable(),
});

// ============================================
// Report Schemas
// ============================================

export const createReportingRequirementSchema = z.object({
  report_type: reportTypeSchema,
  report_name: z.string().min(1).max(200),
  description: z.string().optional(),
  frequency: reportFrequencySchema,
  deadline_days_after_period: z.number().int().min(1),
  recipients: z.array(z.string()).optional(),
  format_requirements: z.string().optional(),
  content_requirements: z.string().optional(),
  compliance_obligation_id: z.string().uuid().optional(),
  clause_reference: z.string().max(100).optional(),
});

export const submitReportSchema = z.object({
  requirement_id: z.string().uuid().optional(),
  report_type: z.string().min(1).max(100),
  report_title: z.string().min(1).max(200),
  reporting_period_start: z.string(),
  reporting_period_end: z.string(),
  document_id: z.string().uuid().optional(),
  file_name: z.string().max(500).optional(),
});

export const reviewReportSchema = z.object({
  status: reportStatusSchema,
  review_notes: z.string().optional(),
});

export const generateReportSchema = z.object({
  report_type: reportTypeSchema,
  period_start: z.string(),
  period_end: z.string(),
  options: z.object({
    include_charts: z.boolean().optional(),
    include_targets: z.boolean().optional(),
    include_verification_status: z.boolean().optional(),
    facilities: z.array(z.string().uuid()).optional(),
  }).optional(),
});

// ============================================
// Margin Test Schemas
// ============================================

export const calculateMarginAdjustmentSchema = z.object({
  test_date: z.string(),
  kpi_results: z.array(z.object({
    kpi_id: z.string().uuid(),
    performance_id: z.string().uuid(),
    target_met: z.boolean(),
  })),
});

// ============================================
// Portfolio Analytics Schemas
// ============================================

export const portfolioBenchmarkSchema = z.object({
  kpi_category: kpiCategorySchema,
  period: z.object({
    start: z.string(),
    end: z.string(),
  }),
  benchmark_source: z.string().optional(),
});

// ============================================
// AI Query Schemas
// ============================================

export const esgAIQuerySchema = z.object({
  query_type: z.enum(['question', 'kpi_assistance', 'gap_analysis', 'benchmark', 'margin_calculation']),
  facility_id: z.string().uuid().optional(),
  query: z.string().min(1),
  target_year: z.number().int().min(2000).max(2100).optional(),
  context: z.object({
    kpi_id: z.string().uuid().optional(),
    borrower_name: z.string().optional(),
    borrower_industry: z.string().optional(),
    esg_loan_type: z.string().optional(),
    sustainability_goals: z.array(z.string()).optional(),
    materiality_focus: z.array(z.string()).optional(),
  }).optional(),
});

// ============================================
// Peer Group Schemas
// ============================================

export const peerGroupDefinitionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  industry_codes: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  loan_types: z.array(esgLoanTypeSchema).optional(),
  commitment_range: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  geography: z.array(z.string()).optional(),
  is_custom: z.boolean().optional(),
});

export const createPeerGroupSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  definition: peerGroupDefinitionSchema,
});

export const updatePeerGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  definition: peerGroupDefinitionSchema.optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// Peer Ranking Schemas
// ============================================

export const peerRankingRequestSchema = z.object({
  facility_id: z.string().uuid(),
  peer_group_id: z.string().uuid().optional(),
  kpi_ids: z.array(z.string().uuid()).optional(),
  kpi_category: kpiCategorySchema.optional(),
  period: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  include_trajectory: z.boolean().optional(),
});

export const portfolioPeerRankingRequestSchema = z.object({
  facility_ids: z.array(z.string().uuid()).optional(),
  peer_group_id: z.string().uuid().optional(),
  kpi_category: kpiCategorySchema.optional(),
  period: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  include_trajectory: z.boolean().optional(),
});

export const peerComparisonQuerySchema = z.object({
  facility_id: z.string().uuid(),
  peer_group_id: z.string().uuid().optional(),
  kpi_id: z.string().uuid().optional(),
  comparison_type: z.enum(['percentile', 'ranking', 'distribution', 'trajectory']),
  period_count: z.number().int().min(1).max(24).optional(),
});

// ============================================
// Governance Signal Schemas (ISS-style)
// ============================================

export const governanceAlertSeveritySchema = z.enum([
  'info',
  'warning',
  'critical',
]);

export const governanceEventTypeSchema = z.enum([
  'board_change',
  'executive_compensation',
  'shareholder_resolution',
  'proxy_vote',
  'audit_committee',
  'ethics_violation',
  'regulatory_action',
  'litigation',
  'whistleblower',
  'policy_change',
]);

export const resolutionCategorySchema = z.enum([
  'environmental',
  'social',
  'governance',
  'compensation',
  'board_composition',
  'climate',
  'human_rights',
  'diversity',
  'lobbying',
  'other',
]);

export const voteRecommendationSchema = z.enum([
  'for',
  'against',
  'abstain',
  'withhold',
]);

export const boardDiversityCategorySchema = z.enum([
  'gender',
  'ethnicity',
  'age',
  'expertise',
  'independence',
  'tenure',
]);

export const compensationLinkTypeSchema = z.enum([
  'emissions_reduction',
  'diversity_targets',
  'safety_metrics',
  'customer_satisfaction',
  'employee_engagement',
  'sustainability_ratings',
  'net_zero_progress',
  'water_usage',
  'waste_reduction',
  'supply_chain_esg',
  'other',
]);

// Board member with ESG qualifications
export const boardMemberSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(100),
  tenure_years: z.number().min(0).optional(),
  is_independent: z.boolean(),
  diversity_categories: z.array(boardDiversityCategorySchema).optional(),
  esg_expertise: z.boolean().optional(),
  esg_committee_member: z.boolean().optional(),
  appointed_date: z.string().optional(),
});

// Governance metrics schema
export const governanceMetricsSchema = z.object({
  borrower_id: z.string().uuid(),
  as_of_date: z.string(),
  // Board composition
  board_size: z.number().int().min(1).optional(),
  independent_directors: z.number().int().min(0).optional(),
  female_directors: z.number().int().min(0).optional(),
  minority_directors: z.number().int().min(0).optional(),
  average_board_tenure: z.number().min(0).optional(),
  esg_expertise_on_board: z.boolean().optional(),
  separate_chair_ceo: z.boolean().optional(),
  // Committees
  has_sustainability_committee: z.boolean().optional(),
  has_audit_committee: z.boolean().optional(),
  has_risk_committee: z.boolean().optional(),
  has_compensation_committee: z.boolean().optional(),
  // Compensation ESG links
  ceo_comp_esg_linked: z.boolean().optional(),
  ceo_comp_esg_percentage: z.number().min(0).max(100).optional(),
  exec_comp_esg_metrics: z.array(compensationLinkTypeSchema).optional(),
  // Voting history
  shareholder_support_rate: z.number().min(0).max(100).optional(),
  esg_resolutions_passed: z.number().int().min(0).optional(),
  esg_resolutions_total: z.number().int().min(0).optional(),
  // Additional metrics
  board_members: z.array(boardMemberSchema).optional(),
});

export const createGovernanceMetricsSchema = governanceMetricsSchema;

export const updateGovernanceMetricsSchema = governanceMetricsSchema.partial().omit({
  borrower_id: true,
}).extend({
  as_of_date: z.string().optional(),
});

// Shareholder resolution schema
export const shareholderResolutionSchema = z.object({
  borrower_id: z.string().uuid(),
  resolution_id: z.string().max(100).optional(),
  meeting_date: z.string(),
  resolution_type: z.string().min(1).max(200),
  resolution_category: resolutionCategorySchema,
  description: z.string().max(2000).optional(),
  sponsor: z.string().max(200).optional(),
  sponsor_type: z.enum(['management', 'shareholder']),
  iss_recommendation: voteRecommendationSchema.optional(),
  glass_lewis_recommendation: voteRecommendationSchema.optional(),
  management_recommendation: voteRecommendationSchema.optional(),
  vote_result: z.enum(['passed', 'failed', 'withdrawn', 'pending']).optional(),
  support_percentage: z.number().min(0).max(100).optional(),
  esg_relevance_score: z.number().min(0).max(100).optional(),
});

export const createShareholderResolutionSchema = shareholderResolutionSchema;

export const updateShareholderResolutionSchema = shareholderResolutionSchema.partial().omit({
  borrower_id: true,
});

// Governance event schema (for tracking events that may trigger alerts)
export const governanceEventSchema = z.object({
  borrower_id: z.string().uuid(),
  event_type: governanceEventTypeSchema,
  event_date: z.string(),
  title: z.string().min(1).max(300),
  description: z.string().max(3000).optional(),
  source: z.string().max(200).optional(),
  source_url: z.string().url().optional(),
  severity: governanceAlertSeveritySchema,
  covenant_implications: z.array(z.string()).optional(),
  affected_kpis: z.array(z.string().uuid()).optional(),
  requires_action: z.boolean().optional(),
  action_deadline: z.string().optional(),
  resolved: z.boolean().optional(),
  resolution_notes: z.string().max(1000).optional(),
});

export const createGovernanceEventSchema = governanceEventSchema;

export const updateGovernanceEventSchema = governanceEventSchema.partial().omit({
  borrower_id: true,
});

// Governance alert schema
export const governanceAlertSchema = z.object({
  facility_id: z.string().uuid().optional(),
  borrower_id: z.string().uuid(),
  alert_type: governanceEventTypeSchema,
  severity: governanceAlertSeveritySchema,
  title: z.string().min(1).max(300),
  description: z.string().max(2000),
  source_event_id: z.string().uuid().optional(),
  covenant_impact: z.array(z.object({
    covenant_id: z.string().uuid().optional(),
    covenant_name: z.string(),
    impact_description: z.string(),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  })).optional(),
  recommended_actions: z.array(z.string()).optional(),
  created_at: z.string().optional(),
  acknowledged: z.boolean().optional(),
  acknowledged_by: z.string().uuid().optional(),
  acknowledged_at: z.string().optional(),
  dismissed: z.boolean().optional(),
  dismissed_reason: z.string().max(500).optional(),
});

export const createGovernanceAlertSchema = governanceAlertSchema;

export const acknowledgeGovernanceAlertSchema = z.object({
  acknowledged: z.boolean(),
  notes: z.string().max(1000).optional(),
});

export const dismissGovernanceAlertSchema = z.object({
  reason: z.string().min(1).max(500),
});

// Governance AI query schema
export const governanceAIQuerySchema = z.object({
  query_type: z.enum([
    'governance_assessment',
    'covenant_correlation',
    'red_flag_analysis',
    'compensation_analysis',
    'board_diversity_benchmark',
    'proxy_vote_impact',
  ]),
  borrower_id: z.string().uuid().optional(),
  facility_id: z.string().uuid().optional(),
  query: z.string().min(1),
  context: z.object({
    include_historical: z.boolean().optional(),
    comparison_period: z.string().optional(),
    peer_group_id: z.string().uuid().optional(),
  }).optional(),
});

// Governance dashboard filters
export const governanceDashboardFiltersSchema = z.object({
  facility_ids: z.array(z.string().uuid()).optional(),
  borrower_ids: z.array(z.string().uuid()).optional(),
  alert_severity: z.array(governanceAlertSeveritySchema).optional(),
  event_types: z.array(governanceEventTypeSchema).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  acknowledged: z.boolean().optional(),
  requires_action: z.boolean().optional(),
});

// Governance score calculation request
export const governanceScoreRequestSchema = z.object({
  borrower_id: z.string().uuid(),
  include_breakdown: z.boolean().optional(),
  benchmark_against_peers: z.boolean().optional(),
  peer_group_id: z.string().uuid().optional(),
});

// Type exports
export type ESGLoanType = z.infer<typeof esgLoanTypeSchema>;
export type ESGFacilityStatus = z.infer<typeof esgFacilityStatusSchema>;
export type KPICategory = z.infer<typeof kpiCategorySchema>;
export type ImprovementDirection = z.infer<typeof improvementDirectionSchema>;
export type VerificationFrequency = z.infer<typeof verificationFrequencySchema>;
export type TargetPeriod = z.infer<typeof targetPeriodSchema>;
export type TargetType = z.infer<typeof targetTypeSchema>;
export type MarginAdjustmentDirection = z.infer<typeof marginAdjustmentDirectionSchema>;
export type DataSource = z.infer<typeof dataSourceSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type ProceedsCategoryType = z.infer<typeof proceedsCategoryTypeSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportFrequency = z.infer<typeof reportFrequencySchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type RatingProvider = z.infer<typeof ratingProviderSchema>;
export type RatingCategory = z.infer<typeof ratingCategorySchema>;

// Governance type exports
export type GovernanceAlertSeverity = z.infer<typeof governanceAlertSeveritySchema>;
export type GovernanceEventType = z.infer<typeof governanceEventTypeSchema>;
export type ResolutionCategory = z.infer<typeof resolutionCategorySchema>;
export type VoteRecommendation = z.infer<typeof voteRecommendationSchema>;
export type BoardDiversityCategory = z.infer<typeof boardDiversityCategorySchema>;
export type CompensationLinkType = z.infer<typeof compensationLinkTypeSchema>;
export type BoardMember = z.infer<typeof boardMemberSchema>;
export type GovernanceMetrics = z.infer<typeof governanceMetricsSchema>;
export type ShareholderResolution = z.infer<typeof shareholderResolutionSchema>;
export type GovernanceEvent = z.infer<typeof governanceEventSchema>;
export type GovernanceAlert = z.infer<typeof governanceAlertSchema>;
export type GovernanceAIQuery = z.infer<typeof governanceAIQuerySchema>;
export type GovernanceDashboardFilters = z.infer<typeof governanceDashboardFiltersSchema>;
export type GovernanceScoreRequest = z.infer<typeof governanceScoreRequestSchema>;
