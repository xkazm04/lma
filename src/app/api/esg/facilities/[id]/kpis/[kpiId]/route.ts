import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateKPISchema } from '@/lib/validations';
import type { ApiResponse, ESGKPIWithTargets } from '@/types';
import type { ESGKPI, ESGTarget, ESGPerformance } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string; kpiId: string }>;
}

// GET /api/esg/facilities/[id]/kpis/[kpiId] - Get KPI with full details
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

    // Get KPI
    const { data: kpi, error: kpiError } = await supabase
      .from('esg_kpis')
      .select('*')
      .eq('id', kpiId)
      .eq('facility_id', facilityId)
      .single();

    if (kpiError || !kpi) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'KPI not found',
        },
      }, { status: 404 });
    }

    // Get targets
    const { data: targets } = await supabase
      .from('esg_targets')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('target_year', { ascending: true });

    // Get performance history
    const { data: performances } = await supabase
      .from('esg_performance')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('reporting_period_end', { ascending: false });

    const achievedTargets = (targets || []).filter((t: ESGTarget) => t.target_status === 'achieved').length;

    const response: ESGKPIWithTargets = {
      ...kpi,
      targets: targets || [],
      recent_performance: performances || [],
      targets_count: (targets || []).length,
      achieved_count: achievedTargets,
      current_status: (performances && performances.length > 0)
        ? performances[0].verification_status
        : 'pending',
    };

    return NextResponse.json<ApiResponse<ESGKPIWithTargets>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/facilities/[id]/kpis/[kpiId]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PATCH /api/esg/facilities/[id]/kpis/[kpiId] - Update KPI
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
    const { data: existing } = await supabase
      .from('esg_kpis')
      .select('id, kpi_name')
      .eq('id', kpiId)
      .eq('facility_id', facilityId)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'KPI not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateKPISchema.safeParse(body);

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

    const { data: kpi, error: updateError } = await supabase
      .from('esg_kpis')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kpiId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating KPI:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update KPI',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'kpi_updated',
      actor_id: user.id,
      entity_type: 'esg_kpi',
      entity_id: kpi.id,
      entity_name: kpi.kpi_name,
      description: `Updated KPI "${kpi.kpi_name}"`,
    });

    return NextResponse.json<ApiResponse<ESGKPI>>({
      success: true,
      data: kpi,
    });
  } catch (error) {
    console.error('Error in PATCH /api/esg/facilities/[id]/kpis/[kpiId]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/esg/facilities/[id]/kpis/[kpiId] - Delete KPI
export async function DELETE(
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

    // Verify KPI exists
    const { data: existing } = await supabase
      .from('esg_kpis')
      .select('id, kpi_name')
      .eq('id', kpiId)
      .eq('facility_id', facilityId)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'KPI not found',
        },
      }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('esg_kpis')
      .delete()
      .eq('id', kpiId);

    if (deleteError) {
      console.error('Error deleting KPI:', deleteError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete KPI',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'kpi_deleted',
      actor_id: user.id,
      entity_type: 'esg_kpi',
      entity_id: kpiId,
      entity_name: existing.kpi_name,
      description: `Deleted KPI "${existing.kpi_name}"`,
    });

    return NextResponse.json<ApiResponse<{ deleted: true }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error in DELETE /api/esg/facilities/[id]/kpis/[kpiId]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
