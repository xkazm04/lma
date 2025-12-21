import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { groupBy, keyBy } from '@/lib/utils';
import type { ApiResponse, ESGDashboardStats } from '@/types';
import type { ESGFacility, ESGKPI, ESGTarget, ESGPerformance } from '@/types/database';

// GET /api/esg/dashboard - Get ESG dashboard statistics
// Query params:
//   - target_year (optional): Year to filter targets (defaults to current year)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse target_year query parameter (defaults to current year)
    const { searchParams } = new URL(request.url);
    const targetYearParam = searchParams.get('target_year');
    const targetYear = targetYearParam ? parseInt(targetYearParam, 10) : new Date().getFullYear();

    // Validate target_year is a reasonable year
    if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'target_year must be a valid year between 2000 and 2100',
        },
      }, { status: 400 });
    }

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

    // Get all ESG facilities
    const { data: facilities } = await supabase
      .from('esg_facilities')
      .select('*')
      .eq('organization_id', userData.organization_id);

    const facilityIds = (facilities || []).map((f: ESGFacility) => f.id);
    const facilitiesMap = keyBy(facilities || [], (f: ESGFacility) => f.id);

    // Initialize stats matching ESGDashboardStats type
    const stats: ESGDashboardStats = {
      total_esg_facilities: (facilities || []).length,
      total_esg_exposure: 0, // ESG facilities don't track exposure directly
      by_loan_type: {
        sustainability_linked: { count: 0, exposure: 0 },
        green_loan: { count: 0, exposure: 0 },
        social_loan: { count: 0, exposure: 0 },
        transition_loan: { count: 0, exposure: 0 },
        esg_linked_hybrid: { count: 0, exposure: 0 },
      },
      kpi_performance: {
        total_kpis: 0,
        on_track: 0,
        at_risk: 0,
        missed: 0,
        pending_verification: 0,
      },
      allocation_summary: {
        total_proceeds: 0,
        allocated: 0,
        unallocated: 0,
        allocation_percentage: 0,
      },
      upcoming_deadlines: [],
      recent_activity: [],
      verification_queue: [],
    };

    // Count facilities by type
    for (const facility of facilities || []) {
      const loanType = facility.esg_loan_type as keyof typeof stats.by_loan_type;
      if (stats.by_loan_type[loanType]) {
        stats.by_loan_type[loanType].count++;
      }
    }

    if (facilityIds.length > 0) {
      // Get KPIs
      const { data: kpis } = await supabase
        .from('esg_kpis')
        .select('*')
        .in('facility_id', facilityIds)
        .eq('is_active', true);

      stats.kpi_performance.total_kpis = (kpis || []).length;

      const kpiIds = (kpis || []).map((k: ESGKPI) => k.id);
      const kpisMap = keyBy(kpis || [], (k: ESGKPI) => k.id);

      if (kpiIds.length > 0) {
        // Get targets
        const { data: targets } = await supabase
          .from('esg_targets')
          .select('*')
          .in('kpi_id', kpiIds);

        // Determine KPI performance status based on targets
        const targetsByKpi = groupBy(targets || [], (t: ESGTarget) => t.kpi_id);

        for (const kpi of kpis || []) {
          const kpiTargets = targetsByKpi[kpi.id] || [];
          const currentYearTarget = kpiTargets.find(
            (t) => t.target_year === targetYear
          );

          if (currentYearTarget) {
            if (currentYearTarget.target_status === 'achieved' || currentYearTarget.target_status === 'on_track') {
              stats.kpi_performance.on_track++;
            } else if (currentYearTarget.target_status === 'at_risk') {
              stats.kpi_performance.at_risk++;
            } else if (currentYearTarget.target_status === 'missed') {
              stats.kpi_performance.missed++;
            }
          }
        }

        // Get latest performance for each KPI
        const { data: performances } = await supabase
          .from('esg_performance')
          .select('*')
          .in('kpi_id', kpiIds)
          .order('reporting_period_end', { ascending: false });

        // Get latest performance per KPI
        const latestPerformanceByKpi: Record<string, ESGPerformance> = {};
        for (const perf of performances || []) {
          if (!latestPerformanceByKpi[perf.kpi_id]) {
            latestPerformanceByKpi[perf.kpi_id] = perf;
          }
        }

        // Count by verification status
        const latestPerfs = Object.values(latestPerformanceByKpi);
        stats.kpi_performance.pending_verification = latestPerfs.filter(
          (p) => p.verification_status === 'pending'
        ).length;

        // Build verification queue
        const pendingVerifications = latestPerfs.filter(
          (p) => p.verification_status === 'pending' || p.verification_status === 'in_progress'
        );

        stats.verification_queue = pendingVerifications.slice(0, 10).map((perf) => {
          const kpi = kpisMap[perf.kpi_id];
          const facility = facilitiesMap[kpi?.facility_id];
          return {
            id: perf.id,
            kpi_name: kpi?.kpi_name || 'Unknown KPI',
            facility_name: facility?.facility_name || 'Unknown Facility',
            submitted_at: perf.submitted_at,
            status: perf.verification_status,
          };
        });
      }

      // Get allocation summary
      const { data: categories } = await supabase
        .from('use_of_proceeds_categories')
        .select('id, eligible_amount')
        .in('facility_id', facilityIds);

      stats.allocation_summary.total_proceeds = (categories || []).reduce(
        (sum: number, c: { eligible_amount: number }) => sum + (c.eligible_amount || 0),
        0
      );

      if ((categories || []).length > 0) {
        const categoryIds = categories.map((c: { id: string }) => c.id);
        const { data: allocations } = await supabase
          .from('proceeds_allocations')
          .select('allocated_amount')
          .in('category_id', categoryIds);

        stats.allocation_summary.allocated = (allocations || []).reduce(
          (sum: number, a: { allocated_amount: number }) => sum + (a.allocated_amount || 0),
          0
        );
      }

      stats.allocation_summary.unallocated =
        stats.allocation_summary.total_proceeds - stats.allocation_summary.allocated;

      if (stats.allocation_summary.total_proceeds > 0) {
        stats.allocation_summary.allocation_percentage =
          (stats.allocation_summary.allocated / stats.allocation_summary.total_proceeds) * 100;
      }

      // Get upcoming deadlines
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Get reporting requirements
      const { data: reportingReqs } = await supabase
        .from('esg_reporting_requirements')
        .select('*, esg_facilities!inner(facility_name)')
        .in('facility_id', facilityIds)
        .eq('is_active', true)
        .lte('next_due_date', thirtyDaysFromNow.toISOString())
        .order('next_due_date', { ascending: true })
        .limit(5);

      for (const req of reportingReqs || []) {
        const deadline = new Date(req.next_due_date);
        const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        stats.upcoming_deadlines.push({
          id: req.id,
          type: 'report_due',
          title: `${req.report_type} report due`,
          facility_name: req.esg_facilities?.facility_name || 'Unknown',
          due_date: req.next_due_date,
          days_until: daysUntil,
        });
      }

      // Get verification deadlines
      const { data: pendingPerfs } = await supabase
        .from('esg_performance')
        .select('*, esg_kpis!inner(kpi_name, facility_id, esg_facilities!inner(facility_name))')
        .in('esg_kpis.facility_id', facilityIds)
        .eq('verification_status', 'pending')
        .order('submitted_at', { ascending: true })
        .limit(5);

      for (const perf of pendingPerfs || []) {
        const submittedDate = new Date(perf.submitted_at);
        const verificationDue = new Date(submittedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const daysUntil = Math.ceil((verificationDue.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        stats.upcoming_deadlines.push({
          id: perf.id,
          type: 'verification_due',
          title: `Verify ${perf.esg_kpis?.kpi_name || 'KPI'} performance`,
          facility_name: perf.esg_kpis?.esg_facilities?.facility_name || 'Unknown',
          due_date: verificationDue.toISOString().split('T')[0],
          days_until: daysUntil,
        });
      }

      // Sort deadlines by date and limit
      stats.upcoming_deadlines.sort((a, b) => a.days_until - b.days_until);
      stats.upcoming_deadlines = stats.upcoming_deadlines.slice(0, 10);

      // Get recent activities
      const { data: activities } = await supabase
        .from('activities')
        .select('*, esg_facilities(facility_name)')
        .eq('organization_id', userData.organization_id)
        .eq('source_module', 'esg')
        .order('created_at', { ascending: false })
        .limit(10);

      stats.recent_activity = (activities || []).map((a: {
        id: string;
        activity_type: string;
        description: string;
        created_at: string;
        entity_id: string | null;
        esg_facilities?: { facility_name: string } | null;
      }) => ({
        id: a.id,
        type: a.activity_type,
        description: a.description,
        facility_name: a.esg_facilities?.facility_name || 'Unknown',
        occurred_at: a.created_at,
      }));
    }

    return NextResponse.json<ApiResponse<ESGDashboardStats>>({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/dashboard:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
