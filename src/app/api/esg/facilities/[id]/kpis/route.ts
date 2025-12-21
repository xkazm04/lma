import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createKPISchema } from '@/lib/validations';
import { groupBy, groupByWithLimit } from '@/lib/utils';
import type { ApiResponse, ESGKPIWithTargets } from '@/types';
import type { ESGKPI, ESGTarget, ESGPerformance } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/esg/facilities/[id]/kpis - List KPIs for a facility
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
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('esg_kpis')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: true });

    if (category && category !== 'all') {
      query = query.eq('kpi_category', category);
    }

    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: kpis, error: kpisError } = await query;

    if (kpisError) {
      console.error('Error fetching KPIs:', kpisError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch KPIs',
        },
      }, { status: 500 });
    }

    const kpiIds = (kpis || []).map((k: ESGKPI) => k.id);

    let targetsByKpi: Record<string, ESGTarget[]> = {};
    let performanceByKpi: Record<string, ESGPerformance[]> = {};

    if (kpiIds.length > 0) {
      const { data: targets } = await supabase
        .from('esg_targets')
        .select('*')
        .in('kpi_id', kpiIds)
        .order('target_year', { ascending: true });

      targetsByKpi = groupBy(targets || [], (t: ESGTarget) => t.kpi_id);

      const { data: performances } = await supabase
        .from('esg_performance')
        .select('*')
        .in('kpi_id', kpiIds)
        .order('reporting_period_end', { ascending: false })
        .limit(5);

      performanceByKpi = groupByWithLimit(performances || [], (p: ESGPerformance) => p.kpi_id, 5);
    }

    const kpisWithTargets: ESGKPIWithTargets[] = (kpis || []).map((kpi: ESGKPI) => {
      const targets = targetsByKpi[kpi.id] || [];
      const performances = performanceByKpi[kpi.id] || [];
      const achievedTargets = targets.filter((t) => t.target_status === 'achieved').length;

      return {
        ...kpi,
        targets,
        recent_performance: performances,
        targets_count: targets.length,
        achieved_count: achievedTargets,
        current_status: performances.length > 0 ? performances[0].verification_status : 'pending',
      };
    });

    return NextResponse.json<ApiResponse<ESGKPIWithTargets[]>>({
      success: true,
      data: kpisWithTargets,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/facilities/[id]/kpis:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/facilities/[id]/kpis - Create a new KPI
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
      .select('id, facility_name')
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
    const parsed = createKPISchema.safeParse(body);

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

    const { data: kpi, error: createError } = await supabase
      .from('esg_kpis')
      .insert({
        ...parsed.data,
        facility_id: facilityId,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating KPI:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create KPI',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'kpi_created',
      actor_id: user.id,
      entity_type: 'esg_kpi',
      entity_id: kpi.id,
      entity_name: kpi.kpi_name,
      description: `Created KPI "${kpi.kpi_name}" for facility ${facility.facility_name}`,
      metadata: { facility_id: facilityId, category: kpi.kpi_category },
    });

    return NextResponse.json<ApiResponse<ESGKPI>>({
      success: true,
      data: kpi,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/facilities/[id]/kpis:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
