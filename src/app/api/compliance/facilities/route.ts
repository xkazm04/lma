import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createComplianceFacilitySchema } from '@/lib/validations';
import type { ApiResponse, ComplianceFacilityWithStats } from '@/types';
import type { ComplianceFacility, ComplianceObligation, ComplianceCovenant, ComplianceEvent } from '@/types/database';

// GET /api/compliance/facilities - List compliance facilities
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`facility_name.ilike.%${search}%,borrower_name.ilike.%${search}%`);
    }

    const { data: facilities, error: facilitiesError } = await query as { data: ComplianceFacility[] | null; error: unknown };

    if (facilitiesError) {
      console.error('Error fetching facilities:', facilitiesError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch facilities',
        },
      }, { status: 500 });
    }

    // Get stats for each facility
    const facilitiesWithStats: ComplianceFacilityWithStats[] = await Promise.all(
      (facilities || []).map(async (facility: ComplianceFacility) => {
        // Get obligations count
        const { count: obligationsCount } = await (supabase
          .from('compliance_obligations') as ReturnType<typeof supabase.from>)
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', facility.id)
          .eq('is_active', true);

        // Get upcoming deadlines (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const { count: upcomingCount } = await (supabase
          .from('compliance_events') as ReturnType<typeof supabase.from>)
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', facility.id)
          .in('status', ['upcoming', 'due_soon'])
          .lte('deadline_date', thirtyDaysFromNow.toISOString());

        // Get overdue items
        const { count: overdueCount } = await (supabase
          .from('compliance_events') as ReturnType<typeof supabase.from>)
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', facility.id)
          .eq('status', 'overdue');

        // Get active covenants
        const { count: covenantsCount } = await (supabase
          .from('compliance_covenants') as ReturnType<typeof supabase.from>)
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', facility.id)
          .eq('is_active', true);

        // Get covenant breaches (failed tests in last 12 months)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const { count: breachesCount } = await (supabase
          .from('covenant_tests') as ReturnType<typeof supabase.from>)
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', facility.id)
          .eq('test_result', 'fail')
          .gte('test_date', oneYearAgo.toISOString());

        return {
          ...facility,
          stats: {
            total_obligations: obligationsCount || 0,
            upcoming_deadlines: upcomingCount || 0,
            overdue_items: overdueCount || 0,
            active_covenants: covenantsCount || 0,
            covenant_breaches: breachesCount || 0,
          },
        };
      })
    );

    return NextResponse.json<ApiResponse<ComplianceFacilityWithStats[]>>({
      success: true,
      data: facilitiesWithStats,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/facilities:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/compliance/facilities - Create compliance facility
export async function POST(request: NextRequest) {
  try {
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

    interface PostUserData {
      organization_id: string;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single() as { data: PostUserData | null };

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
    const parsed = createComplianceFacilitySchema.safeParse(body);

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

    // Create facility
    const { data: facility, error: createError } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .insert({
        organization_id: userData.organization_id,
        ...parsed.data,
      })
      .select()
      .single() as { data: ComplianceFacility | null; error: unknown };

    if (createError || !facility) {
      console.error('Error creating facility:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create facility',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'facility_created',
        actor_id: user.id,
        entity_type: 'compliance_facility',
        entity_id: facility.id,
        entity_name: facility.facility_name,
        description: `Created compliance facility: ${facility.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<ComplianceFacility>>({
      success: true,
      data: facility,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/compliance/facilities:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
