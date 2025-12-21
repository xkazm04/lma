import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTargetSchema, updateTargetSchema } from '@/lib/validations';
import type { ApiResponse, ESGTargetWithPerformance } from '@/types';
import type { ESGTarget, ESGPerformance } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string; kpiId: string }>;
}

// GET /api/esg/facilities/[id]/kpis/[kpiId]/targets - List targets for a KPI
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: facilityId, kpiId } = await context.params;
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

    // Verify facility and KPI exist
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

    const { data: kpi } = await supabase
      .from('esg_kpis')
      .select('id')
      .eq('id', kpiId)
      .eq('facility_id', facilityId)
      .single();

    if (!kpi) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'KPI not found',
        },
      }, { status: 404 });
    }

    // Get targets
    const { data: targets, error: targetsError } = await supabase
      .from('esg_targets')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('target_year', { ascending: true });

    if (targetsError) {
      console.error('Error fetching targets:', targetsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch targets',
        },
      }, { status: 500 });
    }

    // Get performance data for each target period
    const { data: performances } = await supabase
      .from('esg_performance')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('reporting_period_end', { ascending: false });

    // Map performance to targets by year
    const performanceByYear: Record<number, ESGPerformance[]> = (performances || []).reduce(
      (acc: Record<number, ESGPerformance[]>, p: ESGPerformance) => {
        const year = new Date(p.reporting_period_end).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(p);
        return acc;
      },
      {}
    );

    const targetsWithPerformance: ESGTargetWithPerformance[] = (targets || []).map(
      (target: ESGTarget) => {
        const yearPerformance = performanceByYear[target.target_year] || [];
        const latestPerformance = yearPerformance[0];

        return {
          ...target,
          performance_records: yearPerformance,
          latest_actual_value: latestPerformance?.actual_value ?? null,
          gap_to_target: target.target_value && latestPerformance?.actual_value
            ? target.target_value - latestPerformance.actual_value
            : null,
          on_track: target.target_status === 'achieved' || target.target_status === 'on_track',
        };
      }
    );

    return NextResponse.json<ApiResponse<ESGTargetWithPerformance[]>>({
      success: true,
      data: targetsWithPerformance,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/facilities/[id]/kpis/[kpiId]/targets:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/facilities/[id]/kpis/[kpiId]/targets - Create a new target
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: facilityId, kpiId } = await context.params;
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

    // Verify KPI exists
    const { data: kpi } = await supabase
      .from('esg_kpis')
      .select('id, kpi_name')
      .eq('id', kpiId)
      .eq('facility_id', facilityId)
      .single();

    if (!kpi) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'KPI not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createTargetSchema.safeParse(body);

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

    // Check for duplicate target year
    const { data: existingTarget } = await supabase
      .from('esg_targets')
      .select('id')
      .eq('kpi_id', kpiId)
      .eq('target_year', parsed.data.target_year)
      .single();

    if (existingTarget) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: `A target for year ${parsed.data.target_year} already exists for this KPI`,
        },
      }, { status: 409 });
    }

    const { data: target, error: createError } = await supabase
      .from('esg_targets')
      .insert({
        ...parsed.data,
        kpi_id: kpiId,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating target:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create target',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'target_created',
      actor_id: user.id,
      entity_type: 'esg_target',
      entity_id: target.id,
      entity_name: `${kpi.kpi_name} - ${target.target_year}`,
      description: `Created target for KPI "${kpi.kpi_name}" for year ${target.target_year}`,
      metadata: { kpi_id: kpiId, facility_id: facilityId },
    });

    return NextResponse.json<ApiResponse<ESGTarget>>({
      success: true,
      data: target,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/facilities/[id]/kpis/[kpiId]/targets:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
