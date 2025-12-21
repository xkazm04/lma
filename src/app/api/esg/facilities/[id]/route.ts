import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateESGFacilitySchema } from '@/lib/validations';
import { groupBy } from '@/lib/utils';
import type { ApiResponse, ESGFacilityWithKPIs } from '@/types';
import type { ESGFacility, ESGKPI, ESGTarget, ESGPerformance } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/esg/facilities/[id] - Get ESG facility with full details
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
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

    // Get facility
    const { data: facility, error: facilityError } = await supabase
      .from('esg_facilities')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (facilityError || !facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ESG facility not found',
        },
      }, { status: 404 });
    }

    // Get KPIs with targets and latest performance
    const { data: kpis } = await supabase
      .from('esg_kpis')
      .select('*')
      .eq('facility_id', id)
      .order('created_at', { ascending: true });

    const kpiIds = (kpis || []).map((k: ESGKPI) => k.id);

    let targetsByKpi: Record<string, ESGTarget[]> = {};
    let latestPerformanceByKpi: Record<string, ESGPerformance> = {};

    if (kpiIds.length > 0) {
      // Get all targets
      const { data: targets } = await supabase
        .from('esg_targets')
        .select('*')
        .in('kpi_id', kpiIds)
        .order('target_year', { ascending: true });

      targetsByKpi = groupBy(targets || [], (t: ESGTarget) => t.kpi_id);

      // Get latest performance for each KPI
      const { data: performances } = await supabase
        .from('esg_performance')
        .select('*')
        .in('kpi_id', kpiIds)
        .order('reporting_period_end', { ascending: false });

      const seenKpis = new Set<string>();
      for (const perf of performances || []) {
        if (!seenKpis.has(perf.kpi_id)) {
          latestPerformanceByKpi[perf.kpi_id] = perf;
          seenKpis.add(perf.kpi_id);
        }
      }
    }

    // Calculate overall stats
    let targetsAchieved = 0;
    let targetsTotal = 0;

    const enrichedKpis = (kpis || []).map((kpi: ESGKPI) => {
      const targets = targetsByKpi[kpi.id] || [];
      targetsTotal += targets.length;
      targetsAchieved += targets.filter((t) => t.target_status === 'achieved').length;

      return {
        ...kpi,
        targets,
        latest_performance: latestPerformanceByKpi[kpi.id] || null,
      };
    });

    const response: ESGFacilityWithKPIs = {
      ...facility,
      kpis: enrichedKpis,
      kpi_count: enrichedKpis.length,
      targets_achieved: targetsAchieved,
      targets_total: targetsTotal,
      overall_performance_status: targetsTotal > 0
        ? (targetsAchieved / targetsTotal >= 0.8 ? 'on_track' : targetsAchieved / targetsTotal >= 0.5 ? 'at_risk' : 'off_track')
        : 'pending',
    };

    return NextResponse.json<ApiResponse<ESGFacilityWithKPIs>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/facilities/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PATCH /api/esg/facilities/[id] - Update ESG facility
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
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

    // Verify facility exists and belongs to org
    const { data: existing } = await supabase
      .from('esg_facilities')
      .select('id, facility_name')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ESG facility not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateESGFacilitySchema.safeParse(body);

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

    const { data: facility, error: updateError } = await supabase
      .from('esg_facilities')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ESG facility:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update ESG facility',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'esg_facility_updated',
      actor_id: user.id,
      entity_type: 'esg_facility',
      entity_id: facility.id,
      entity_name: facility.facility_name,
      description: `Updated ESG facility ${facility.facility_name}`,
    });

    return NextResponse.json<ApiResponse<ESGFacility>>({
      success: true,
      data: facility,
    });
  } catch (error) {
    console.error('Error in PATCH /api/esg/facilities/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/esg/facilities/[id] - Delete ESG facility
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
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
    const { data: existing } = await supabase
      .from('esg_facilities')
      .select('id, facility_name')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ESG facility not found',
        },
      }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('esg_facilities')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting ESG facility:', deleteError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete ESG facility',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'esg_facility_deleted',
      actor_id: user.id,
      entity_type: 'esg_facility',
      entity_id: id,
      entity_name: existing.facility_name,
      description: `Deleted ESG facility ${existing.facility_name}`,
    });

    return NextResponse.json<ApiResponse<{ deleted: true }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error in DELETE /api/esg/facilities/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
