import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { esgAIQuerySchema } from '@/lib/validations';
import {
  answerESGQuestion,
  assistKPIDefinition,
  performGapAnalysis,
  compareBenchmarks,
  calculateMarginAdjustment,
} from '@/lib/llm';
import type { ApiResponse, ESGAIQueryResult, KPIDefinitionAssistance } from '@/types';
import type { ESGKPI, ESGTarget, ESGPerformance, ProceedsAllocation } from '@/types/database';

// POST /api/esg/ai - ESG AI assistant endpoints
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = esgAIQuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    const { query_type, facility_id, query, context, target_year: targetYearParam } = parsed.data;

    // Use provided target_year or default to current year
    const targetYear = targetYearParam ?? new Date().getFullYear();

    // Verify facility if provided
    let facility = null;
    if (facility_id) {
      const { data: facilityData } = await supabase
        .from('esg_facilities')
        .select('*')
        .eq('id', facility_id)
        .eq('organization_id', userData.organization_id)
        .single();

      if (!facilityData) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ESG facility not found',
          },
        }, { status: 404 });
      }
      facility = facilityData;
    }

    switch (query_type) {
      case 'question': {
        if (!facility) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'facility_id is required for questions',
            },
          }, { status: 400 });
        }

        // Fetch KPIs first as other queries depend on kpiIds
        const { data: kpis } = await supabase
          .from('esg_kpis')
          .select('*')
          .eq('facility_id', facility_id)
          .eq('is_active', true);

        const kpiIds = (kpis || []).map((k: ESGKPI) => k.id);

        // Parallel fetch: performances, targets, and categories (if applicable)
        const isGreenOrSocial = facility.esg_loan_type === 'green_loan' || facility.esg_loan_type === 'social_loan';

        const [performancesResult, targetsResult, categoriesResult] = await Promise.all([
          kpiIds.length > 0
            ? supabase
                .from('esg_performance')
                .select('*')
                .in('kpi_id', kpiIds)
                .order('reporting_period_end', { ascending: false })
                .limit(20)
            : Promise.resolve({ data: [] }),
          kpiIds.length > 0
            ? supabase
                .from('esg_targets')
                .select('*')
                .in('kpi_id', kpiIds)
            : Promise.resolve({ data: [] }),
          isGreenOrSocial
            ? supabase
                .from('use_of_proceeds_categories')
                .select('id, category_name, eligible_amount')
                .eq('facility_id', facility_id)
            : Promise.resolve({ data: [] }),
        ]);

        const performances: ESGPerformance[] = performancesResult.data || [];
        const targets: ESGTarget[] = targetsResult.data || [];
        const categories = categoriesResult.data || [];

        // Fetch allocations if categories exist
        let allocations: Array<{
          category_name: string;
          allocated_amount: number;
          eligible_amount: number;
          percentage: number;
        }> = [];

        if (categories.length > 0) {
          const categoryIds = categories.map((c: { id: string }) => c.id);
          const { data: allocationData } = await supabase
            .from('proceeds_allocations')
            .select('category_id, allocation_amount')
            .in('category_id', categoryIds);

          const allocationByCategory: Record<string, number> = (allocationData || []).reduce(
            (acc: Record<string, number>, a: ProceedsAllocation) => {
              acc[a.category_id] = (acc[a.category_id] || 0) + a.allocated_amount;
              return acc;
            },
            {}
          );

          allocations = categories.map((c: { id: string; category_name: string; eligible_amount: number }) => ({
            category_name: c.category_name,
            allocated_amount: allocationByCategory[c.id] || 0,
            eligible_amount: c.eligible_amount,
            percentage: c.eligible_amount ? ((allocationByCategory[c.id] || 0) / c.eligible_amount) * 100 : 0,
          }));
        }

        // Build KPI context
        const kpiContext = (kpis || []).map((kpi: ESGKPI) => {
          const latestPerf = performances.find((p) => p.kpi_id === kpi.id);
          const currentTarget = targets.find(
            (t) => t.kpi_id === kpi.id && t.target_year === targetYear
          );

          return {
            kpi_name: kpi.kpi_name,
            category: kpi.kpi_category,
            current_value: latestPerf?.actual_value,
            target_value: currentTarget?.target_value,
            unit: kpi.unit_of_measure,
            performance_status: currentTarget?.target_status,
          };
        });

        // Build performance history
        const performanceHistory = performances.slice(0, 10).map((p) => {
          const kpi = (kpis || []).find((k: ESGKPI) => k.id === p.kpi_id);
          const target = targets.find(
            (t) => t.kpi_id === p.kpi_id &&
            t.target_year === new Date(p.reporting_period_end).getFullYear()
          );

          return {
            period: p.reporting_period_end,
            kpi_name: kpi?.kpi_name || 'Unknown',
            value: p.actual_value,
            target: target?.target_value || 0,
            achieved: target ? p.actual_value >= target.target_value : false,
          };
        });

        const result = await answerESGQuestion({
          question: query,
          facility_context: {
            facility_name: facility.facility_name,
            borrower_name: facility.borrower_name,
            esg_loan_type: facility.esg_loan_type,
            framework_reference: facility.framework_reference,
          },
          kpi_context: kpiContext,
          performance_history: performanceHistory,
          allocation_context: allocations.length > 0 ? allocations : undefined,
        });

        return NextResponse.json<ApiResponse<ESGAIQueryResult>>({
          success: true,
          data: result,
        });
      }

      case 'kpi_assistance': {
        const borrowerIndustry = context?.borrower_industry || 'General';
        const esgLoanType = facility?.esg_loan_type || context?.esg_loan_type || 'sustainability_linked';

        // Get existing KPIs if facility is provided
        let existingKpis: string[] = [];
        if (facility_id) {
          const { data: kpis } = await supabase
            .from('esg_kpis')
            .select('kpi_name')
            .eq('facility_id', facility_id);
          existingKpis = (kpis || []).map((k: { kpi_name: string }) => k.kpi_name);
        }

        const result = await assistKPIDefinition({
          borrower_name: facility?.borrower_name || context?.borrower_name || 'Unknown',
          borrower_industry: borrowerIndustry,
          esg_loan_type: esgLoanType,
          existing_kpis: existingKpis,
          sustainability_goals: context?.sustainability_goals,
          materiality_focus: context?.materiality_focus,
        });

        return NextResponse.json<ApiResponse<KPIDefinitionAssistance>>({
          success: true,
          data: result,
        });
      }

      case 'gap_analysis': {
        if (!facility) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'facility_id is required for gap analysis',
            },
          }, { status: 400 });
        }

        // Fetch KPIs first as other queries depend on kpiIds
        const { data: kpis } = await supabase
          .from('esg_kpis')
          .select('*')
          .eq('facility_id', facility_id)
          .eq('is_active', true);

        const kpiIds = (kpis || []).map((k: ESGKPI) => k.id);
        const isGreenOrSocial = facility.esg_loan_type === 'green_loan' || facility.esg_loan_type === 'social_loan';

        // Parallel fetch: targets, performances, reporting requirements, reports, and categories
        const [targetsResult, performancesResult, reportingReqsResult, reportsResult, categoriesResult] = await Promise.all([
          kpiIds.length > 0
            ? supabase
                .from('esg_targets')
                .select('*')
                .in('kpi_id', kpiIds)
            : Promise.resolve({ data: [] }),
          kpiIds.length > 0
            ? supabase
                .from('esg_performance')
                .select('*')
                .in('kpi_id', kpiIds)
                .order('reporting_period_end', { ascending: false })
            : Promise.resolve({ data: [] }),
          supabase
            .from('esg_reporting_requirements')
            .select('*')
            .eq('facility_id', facility_id)
            .eq('is_active', true),
          supabase
            .from('esg_reports')
            .select('id')
            .eq('facility_id', facility_id),
          isGreenOrSocial
            ? supabase
                .from('use_of_proceeds_categories')
                .select('id, eligible_amount')
                .eq('facility_id', facility_id)
            : Promise.resolve({ data: [] }),
        ]);

        const targets: ESGTarget[] = targetsResult.data || [];
        const performances: ESGPerformance[] = performancesResult.data || [];
        const reportingReqs = reportingReqsResult.data || [];
        const reports = reportsResult.data || [];
        const categories = categoriesResult.data || [];

        // Get allocation status if categories exist
        let allocationStatus = undefined;
        if (categories.length > 0) {
          const categoryIds = categories.map((c: { id: string }) => c.id);
          const { data: allocations } = await supabase
            .from('proceeds_allocations')
            .select('allocation_amount')
            .in('category_id', categoryIds);

          const totalAllocated = (allocations || []).reduce(
            (sum: number, a: { allocation_amount: number }) => sum + a.allocation_amount,
            0
          );

          allocationStatus = {
            total_allocated: totalAllocated,
            total_commitment: facility.commitment_amount,
            unallocated_amount: facility.commitment_amount - totalAllocated,
          };
        }

        // Build current KPI data
        const currentKpis = (kpis || []).map((kpi: ESGKPI) => {
          const latestPerf = performances.find((p) => p.kpi_id === kpi.id);
          const currentTarget = targets.find(
            (t) => t.kpi_id === kpi.id && t.target_year >= targetYear
          );

          return {
            kpi_name: kpi.kpi_name,
            category: kpi.kpi_category,
            current_trajectory: latestPerf?.actual_value || 0,
            target_value: currentTarget?.target_value || 0,
            target_date: currentTarget ? `${currentTarget.target_year}-12-31` : `${targetYear}-12-31`,
            unit: kpi.unit_of_measure,
          };
        });

        const result = await performGapAnalysis({
          facility: {
            facility_name: facility.facility_name,
            borrower_name: facility.borrower_name,
            esg_loan_type: facility.esg_loan_type,
          },
          current_kpis: currentKpis,
          reporting_status: {
            reports_submitted: (reports || []).length,
            reports_required: (reportingReqs || []).length * 2, // Assume 2 per requirement per year
            last_report_date: undefined,
            verification_status: 'pending',
          },
          allocation_status: allocationStatus,
        });

        return NextResponse.json<ApiResponse<typeof result>>({
          success: true,
          data: result,
        });
      }

      case 'benchmark': {
        if (!facility) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'facility_id is required for benchmarking',
            },
          }, { status: 400 });
        }

        // Fetch KPIs first as other queries depend on kpiIds
        const { data: kpis } = await supabase
          .from('esg_kpis')
          .select('*')
          .eq('facility_id', facility_id)
          .eq('is_active', true);

        const kpiIds = (kpis || []).map((k: ESGKPI) => k.id);

        // Parallel fetch: performances, targets, and ratings
        const [performancesResult, targetsResult, ratingsResult] = await Promise.all([
          kpiIds.length > 0
            ? supabase
                .from('esg_performance')
                .select('*')
                .in('kpi_id', kpiIds)
                .order('reporting_period_end', { ascending: false })
            : Promise.resolve({ data: [] }),
          kpiIds.length > 0
            ? supabase
                .from('esg_targets')
                .select('*')
                .in('kpi_id', kpiIds)
            : Promise.resolve({ data: [] }),
          supabase
            .from('esg_ratings')
            .select('*')
            .eq('facility_id', facility_id)
            .order('rating_date', { ascending: false })
            .limit(1),
        ]);

        const performances: ESGPerformance[] = performancesResult.data || [];
        const targets: ESGTarget[] = targetsResult.data || [];
        const latestRating = ratingsResult.data?.[0];

        const kpiData = (kpis || []).map((kpi: ESGKPI) => {
          const latestPerf = performances.find((p) => p.kpi_id === kpi.id);
          const currentTarget = targets.find(
            (t) => t.kpi_id === kpi.id && t.target_year === targetYear
          );

          return {
            kpi_name: kpi.kpi_name,
            category: kpi.kpi_category,
            current_value: latestPerf?.actual_value || 0,
            unit: kpi.unit_of_measure,
            target_value: currentTarget?.target_value || 0,
          };
        });

        const result = await compareBenchmarks({
          borrower_name: facility.borrower_name,
          borrower_industry: context?.borrower_industry || 'General',
          kpi_data: kpiData,
          rating_context: latestRating
            ? {
                current_rating: latestRating.rating,
                rating_provider: latestRating.rating_provider,
              }
            : undefined,
        });

        return NextResponse.json<ApiResponse<typeof result>>({
          success: true,
          data: result,
        });
      }

      case 'margin_calculation': {
        if (!facility) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'facility_id is required for margin calculation',
            },
          }, { status: 400 });
        }

        // Fetch KPIs first as other queries depend on kpiIds
        const { data: kpis } = await supabase
          .from('esg_kpis')
          .select('*')
          .eq('facility_id', facility_id)
          .eq('is_active', true);

        const kpiIds = (kpis || []).map((k: ESGKPI) => k.id);

        if (kpiIds.length === 0) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'No active KPIs found for this facility',
            },
          }, { status: 400 });
        }

        // Parallel fetch: targets and performances
        const [targetsResult, performancesResult] = await Promise.all([
          supabase
            .from('esg_targets')
            .select('*')
            .in('kpi_id', kpiIds)
            .eq('target_year', targetYear),
          supabase
            .from('esg_performance')
            .select('*')
            .in('kpi_id', kpiIds)
            .eq('verification_status', 'verified')
            .order('reporting_period_end', { ascending: false }),
        ]);

        const targets = targetsResult.data || [];
        const performances = performancesResult.data || [];

        // Build KPI results
        const kpiResults = (kpis || []).map((kpi: ESGKPI) => {
          const target = (targets || []).find((t: ESGTarget) => t.kpi_id === kpi.id);
          const latestPerf = (performances || []).find((p: ESGPerformance) => p.kpi_id === kpi.id);

          return {
            kpi_name: kpi.kpi_name,
            target_value: target?.target_value || 0,
            actual_value: latestPerf?.actual_value || 0,
            weight: kpi.weighting || (100 / (kpis || []).length),
            higher_is_better: kpi.improvement_direction === 'increase',
            adjustment_per_kpi_bps: target?.margin_adjustment_bps || 5,
          };
        }).filter((k: { target_value: number }) => k.target_value > 0);

        if (kpiResults.length === 0) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'No KPIs with targets found for margin calculation',
            },
          }, { status: 400 });
        }

        const result = await calculateMarginAdjustment({
          facility: {
            facility_name: facility.facility_name,
            base_margin_bps: facility.base_margin_bps || 200,
            max_adjustment_bps: facility.max_margin_adjustment_bps || 25,
            adjustment_frequency: facility.margin_adjustment_frequency || 'annual',
          },
          kpi_results: kpiResults,
        });

        return NextResponse.json<ApiResponse<typeof result>>({
          success: true,
          data: result,
        });
      }

      default:
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Unknown query type: ${query_type}`,
          },
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/esg/ai:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
