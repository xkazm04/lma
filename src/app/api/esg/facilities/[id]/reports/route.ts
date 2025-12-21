import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitReportSchema, generateReportSchema } from '@/lib/validations';
import { generateESGReport } from '@/lib/llm';
import type { ApiResponse, ESGReportWithDetails, GeneratedESGReport } from '@/types';
import type { ESGReport, ESGKPI, ESGTarget, ESGPerformance, ESGRating } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/esg/facilities/[id]/reports - List ESG reports
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: facilityId } = await context.params;
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

    // Verify facility exists
    const { data: facility } = await supabase
      .from('esg_facilities')
      .select('id')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ESG facility not found',
        },
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('report_type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('esg_reports')
      .select('*')
      .eq('facility_id', facilityId)
      .order('reporting_period_end', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reportType && reportType !== 'all') {
      query = query.eq('report_type', reportType);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch reports',
        },
      }, { status: 500 });
    }

    // Enrich with user names
    const userIds = new Set<string>();
    for (const report of reports || []) {
      if (report.submitted_by) userIds.add(report.submitted_by);
      if (report.reviewed_by) userIds.add(report.reviewed_by);
    }

    let usersMap: Record<string, { full_name: string }> = {};
    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', Array.from(userIds));

      usersMap = (users || []).reduce(
        (acc: Record<string, { full_name: string }>, u: { id: string; full_name: string }) => {
          acc[u.id] = u;
          return acc;
        },
        {}
      );
    }

    const reportsWithDetails: ESGReportWithDetails[] = (reports || []).map(
      (report: ESGReport) => ({
        ...report,
        prepared_by_name: report.submitted_by ? usersMap[report.submitted_by]?.full_name || null : null,
        reviewed_by_name: report.reviewed_by ? usersMap[report.reviewed_by]?.full_name || null : null,
      })
    );

    return NextResponse.json<ApiResponse<ESGReportWithDetails[]>>({
      success: true,
      data: reportsWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/facilities/[id]/reports:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/facilities/[id]/reports - Create or generate report
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: facilityId } = await context.params;
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

    // Verify facility exists
    const { data: facility } = await supabase
      .from('esg_facilities')
      .select('*')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ESG facility not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    // Generate report using AI
    if (action === 'generate') {
      const parsed = generateReportSchema.safeParse(data);

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

      // Gather data for report generation
      const { data: kpis } = await supabase
        .from('esg_kpis')
        .select('*')
        .eq('facility_id', facilityId)
        .eq('is_active', true);

      const kpiIds = (kpis || []).map((k: ESGKPI) => k.id);

      let performances: ESGPerformance[] = [];
      let targets: ESGTarget[] = [];

      if (kpiIds.length > 0) {
        const { data: perfData } = await supabase
          .from('esg_performance')
          .select('*')
          .in('kpi_id', kpiIds)
          .gte('reporting_period_start', parsed.data.period_start)
          .lte('reporting_period_end', parsed.data.period_end)
          .eq('verification_status', 'verified');

        performances = perfData || [];

        const { data: targetData } = await supabase
          .from('esg_targets')
          .select('*')
          .in('kpi_id', kpiIds);

        targets = targetData || [];
      }

      const { data: ratings } = await supabase
        .from('esg_ratings')
        .select('*')
        .eq('facility_id', facilityId)
        .order('rating_date', { ascending: false })
        .limit(5);

      // Build KPI performance data for report
      const kpiPerformance = (kpis || []).map((kpi: ESGKPI) => {
        const kpiPerfs = performances.filter((p) => p.kpi_id === kpi.id);
        const kpiTargets = targets.filter((t) => t.kpi_id === kpi.id);
        const latestPerf = kpiPerfs[0];
        const currentYearTarget = kpiTargets.find(
          (t) => t.target_year === new Date(parsed.data.period_end).getFullYear()
        );

        const achieved = latestPerf && currentYearTarget
          ? latestPerf.actual_value >= currentYearTarget.target_value
          : false;

        // Determine trend
        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (kpiPerfs.length >= 2) {
          const latest = kpiPerfs[0].actual_value;
          const previous = kpiPerfs[1].actual_value;
          if (latest > previous * 1.05) trend = 'improving';
          else if (latest < previous * 0.95) trend = 'declining';
        }

        return {
          kpi_name: kpi.kpi_name,
          category: kpi.kpi_category,
          baseline_value: kpi.baseline_value || 0,
          target_value: currentYearTarget?.target_value || 0,
          actual_value: latestPerf?.actual_value || 0,
          unit: kpi.unit_of_measure,
          achieved,
          verification_status: latestPerf?.verification_status || 'pending',
          trend,
        };
      });

      // Map report type to LLM expected types
      const reportTypeMap: Record<string, 'annual' | 'quarterly' | 'impact' | 'verification' | 'allocation'> = {
        'annual_sustainability_report': 'annual',
        'kpi_performance_report': 'quarterly',
        'allocation_report': 'allocation',
        'impact_report': 'impact',
        'verification_assurance_report': 'verification',
        'external_rating_update': 'annual',
        'other': 'annual',
      };

      // Generate report using LLM
      const generatedReport = await generateESGReport({
        facility: {
          facility_name: facility.facility_name,
          borrower_name: facility.borrower_name,
          esg_loan_type: facility.esg_loan_type,
          commitment_amount: facility.commitment_amount,
          framework_reference: facility.framework_reference,
        },
        report_type: reportTypeMap[parsed.data.report_type] || 'annual',
        reporting_period: {
          start_date: parsed.data.period_start,
          end_date: parsed.data.period_end,
        },
        kpi_performance: kpiPerformance,
        ratings: (ratings || []).map((r: ESGRating) => ({
          provider: r.rating_provider,
          rating: r.rating_value,
          rating_date: r.rating_date,
          outlook: r.rating_category,
        })),
      });

      // Log activity
      await supabase.from('activities').insert({
        organization_id: userData.organization_id,
        source_module: 'esg',
        activity_type: 'report_generated',
        actor_id: user.id,
        entity_type: 'esg_facility',
        entity_id: facilityId,
        entity_name: facility.facility_name,
        description: `Generated ${parsed.data.report_type} ESG report for ${facility.facility_name}`,
      });

      return NextResponse.json<ApiResponse<GeneratedESGReport>>({
        success: true,
        data: generatedReport,
      });
    }

    // Submit a report
    const parsed = submitReportSchema.safeParse(data);

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

    const { data: report, error: createError } = await supabase
      .from('esg_reports')
      .insert({
        ...parsed.data,
        facility_id: facilityId,
        prepared_by: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating report:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create report',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'report_created',
      actor_id: user.id,
      entity_type: 'esg_report',
      entity_id: report.id,
      entity_name: `${report.report_type} Report`,
      description: `Created ${report.report_type} ESG report for ${facility.facility_name}`,
      metadata: { facility_id: facilityId },
    });

    return NextResponse.json<ApiResponse<ESGReport>>({
      success: true,
      data: report,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/facilities/[id]/reports:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
