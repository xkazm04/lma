import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitPerformanceSchema, updatePerformanceSchema, updateVerificationSchema } from '@/lib/validations';
import type { ApiResponse, ESGPerformanceResult } from '@/types';
import type { ESGPerformance, ESGTarget } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string; kpiId: string }>;
}

// GET /api/esg/facilities/[id]/kpis/[kpiId]/performance - List performance records
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
      .select('id, kpi_name, unit, baseline_value')
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

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const verificationStatus = searchParams.get('verification_status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('esg_performance')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('reporting_period_end', { ascending: false })
      .range(offset, offset + limit - 1);

    if (year) {
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      query = query.gte('reporting_period_start', startOfYear).lte('reporting_period_end', endOfYear);
    }

    if (verificationStatus && verificationStatus !== 'all') {
      query = query.eq('verification_status', verificationStatus);
    }

    const { data: performances, error: performanceError } = await query;

    if (performanceError) {
      console.error('Error fetching performance:', performanceError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch performance data',
        },
      }, { status: 500 });
    }

    // Get targets to compare against
    const { data: targets } = await supabase
      .from('esg_targets')
      .select('*')
      .eq('kpi_id', kpiId);

    const targetsByYear: Record<number, ESGTarget> = (targets || []).reduce(
      (acc: Record<number, ESGTarget>, t: ESGTarget) => {
        acc[t.target_year] = t;
        return acc;
      },
      {}
    );

    // Enrich performance data
    const performanceResults: ESGPerformanceResult[] = (performances || []).map(
      (perf: ESGPerformance) => {
        const year = new Date(perf.reporting_period_end).getFullYear();
        const target = targetsByYear[year];

        const vsBaseline = kpi.baseline_value
          ? ((perf.actual_value - kpi.baseline_value) / kpi.baseline_value) * 100
          : null;

        const vsTarget = target?.target_value
          ? ((perf.actual_value - target.target_value) / target.target_value) * 100
          : null;

        return {
          ...perf,
          kpi_name: kpi.kpi_name,
          unit: kpi.unit_of_measure,
          target_value: target?.target_value ?? null,
          baseline_value: kpi.baseline_value,
          vs_baseline_pct: vsBaseline,
          vs_target_pct: vsTarget,
          target_achieved: target?.target_value
            ? perf.actual_value >= target.target_value
            : null,
        };
      }
    );

    return NextResponse.json<ApiResponse<ESGPerformanceResult[]>>({
      success: true,
      data: performanceResults,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/facilities/[id]/kpis/[kpiId]/performance:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/facilities/[id]/kpis/[kpiId]/performance - Submit performance data
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
    const parsed = submitPerformanceSchema.safeParse(body);

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

    // Check for overlapping periods
    const { data: existingPerf } = await supabase
      .from('esg_performance')
      .select('id')
      .eq('kpi_id', kpiId)
      .lte('reporting_period_start', parsed.data.reporting_period_end)
      .gte('reporting_period_end', parsed.data.reporting_period_start)
      .limit(1);

    if (existingPerf && existingPerf.length > 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'A performance record already exists for this reporting period',
        },
      }, { status: 409 });
    }

    const { data: performance, error: createError } = await supabase
      .from('esg_performance')
      .insert({
        ...parsed.data,
        kpi_id: kpiId,
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        verification_status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating performance record:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create performance record',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'performance_submitted',
      actor_id: user.id,
      entity_type: 'esg_performance',
      entity_id: performance.id,
      entity_name: kpi.kpi_name,
      description: `Submitted performance data for KPI "${kpi.kpi_name}": ${performance.actual_value}`,
      metadata: { kpi_id: kpiId, facility_id: facilityId, actual_value: performance.actual_value },
    });

    return NextResponse.json<ApiResponse<ESGPerformance>>({
      success: true,
      data: performance,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/facilities/[id]/kpis/[kpiId]/performance:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PATCH - Verify performance record
export async function PATCH(
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

    const body = await request.json();
    const { performance_id, ...updateData } = body;

    if (!performance_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'performance_id is required',
        },
      }, { status: 400 });
    }

    // Check if this is a verification update or regular update
    const isVerification = 'verification_status' in updateData;
    const parsed = isVerification
      ? updateVerificationSchema.safeParse(updateData)
      : updatePerformanceSchema.safeParse(updateData);

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

    // Verify performance record exists
    const { data: existing } = await supabase
      .from('esg_performance')
      .select('id, kpi_id')
      .eq('id', performance_id)
      .eq('kpi_id', kpiId)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Performance record not found',
        },
      }, { status: 404 });
    }

    const updatePayload = isVerification
      ? {
          ...parsed.data,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      : {
          ...parsed.data,
          updated_at: new Date().toISOString(),
        };

    const { data: performance, error: updateError } = await supabase
      .from('esg_performance')
      .update(updatePayload)
      .eq('id', performance_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating performance:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update performance record',
        },
      }, { status: 500 });
    }

    // Log activity
    const activityType = isVerification ? 'performance_verified' : 'performance_updated';
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: activityType,
      actor_id: user.id,
      entity_type: 'esg_performance',
      entity_id: performance.id,
      description: isVerification
        ? `Verified performance record: ${performance.verification_status}`
        : `Updated performance record`,
      metadata: { kpi_id: kpiId, facility_id: facilityId },
    });

    return NextResponse.json<ApiResponse<ESGPerformance>>({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Error in PATCH /api/esg/facilities/[id]/kpis/[kpiId]/performance:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
