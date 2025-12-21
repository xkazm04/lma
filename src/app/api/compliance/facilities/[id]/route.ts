import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateComplianceFacilitySchema } from '@/lib/validations';
import type { ApiResponse, ComplianceFacilityWithStats } from '@/types';
import type { ComplianceFacility } from '@/types/database';

// GET /api/compliance/facilities/[id] - Get facility detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params;
    const supabase = await createClient();

    // Get current user
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

    interface UserData {
      organization_id: string;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single() as { data: UserData | null };

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
    const { data: facility, error: facilityError } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single() as { data: ComplianceFacility | null; error: unknown };

    if (facilityError || !facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    // Get stats
    const { count: obligationsCount } = await (supabase
      .from('compliance_obligations') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', facilityId)
      .eq('is_active', true);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const { count: upcomingCount } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', facilityId)
      .in('status', ['upcoming', 'due_soon'])
      .lte('deadline_date', thirtyDaysFromNow.toISOString());

    const { count: overdueCount } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', facilityId)
      .eq('status', 'overdue');

    const { count: covenantsCount } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', facilityId)
      .eq('is_active', true);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const { count: breachesCount } = await (supabase
      .from('covenant_tests') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', facilityId)
      .eq('test_result', 'fail')
      .gte('test_date', oneYearAgo.toISOString());

    const facilityWithStats: ComplianceFacilityWithStats = {
      ...facility,
      stats: {
        total_obligations: obligationsCount || 0,
        upcoming_deadlines: upcomingCount || 0,
        overdue_items: overdueCount || 0,
        active_covenants: covenantsCount || 0,
        covenant_breaches: breachesCount || 0,
      },
    };

    return NextResponse.json<ApiResponse<ComplianceFacilityWithStats>>({
      success: true,
      data: facilityWithStats,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/facilities/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/compliance/facilities/[id] - Update facility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params;
    const supabase = await createClient();

    // Get current user
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

    interface PutUserData {
      organization_id: string;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single() as { data: PutUserData | null };

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    // Check facility exists and belongs to org
    const { data: existingFacility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single() as { data: ComplianceFacility | null };

    if (!existingFacility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateComplianceFacilitySchema.safeParse(body);

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

    // Update facility
    const { data: facility, error: updateError } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facilityId)
      .select()
      .single() as { data: ComplianceFacility | null; error: unknown };

    if (updateError || !facility) {
      console.error('Error updating facility:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update facility',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'facility_updated',
        actor_id: user.id,
        entity_type: 'compliance_facility',
        entity_id: facility.id,
        entity_name: facility.facility_name,
        description: `Updated compliance facility: ${facility.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<ComplianceFacility>>({
      success: true,
      data: facility,
    });
  } catch (error) {
    console.error('Error in PUT /api/compliance/facilities/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/compliance/facilities/[id] - Delete facility
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params;
    const supabase = await createClient();

    // Get current user
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

    interface DeleteUserData {
      organization_id: string;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single() as { data: DeleteUserData | null };

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    interface ExistingFacilityData {
      facility_name: string;
    }

    // Check facility exists and belongs to org
    const { data: existingFacility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('facility_name')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single() as { data: ExistingFacilityData | null };

    if (!existingFacility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    // Delete facility (cascades to related records)
    const { error: deleteError } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .delete()
      .eq('id', facilityId);

    if (deleteError) {
      console.error('Error deleting facility:', deleteError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete facility',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'facility_deleted',
        actor_id: user.id,
        entity_type: 'compliance_facility',
        entity_id: facilityId,
        entity_name: existingFacility.facility_name,
        description: `Deleted compliance facility: ${existingFacility.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error in DELETE /api/compliance/facilities/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
