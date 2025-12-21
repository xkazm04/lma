import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotificationRequirementSchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';
import type { NotificationRequirement } from '@/types/database';

// GET /api/compliance/facilities/[id]/notifications - List notification requirements
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

    // Verify facility belongs to org
    const { data: facility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single() as { data: { id: string } | null };

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    // Get notification requirements
    let query = (supabase
      .from('notification_requirements') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: requirements, error: requirementsError } = await query as { data: NotificationRequirement[] | null; error: unknown };

    if (requirementsError) {
      console.error('Error fetching requirements:', requirementsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch requirements',
        },
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<NotificationRequirement[]>>({
      success: true,
      data: requirements || [],
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/facilities/[id]/notifications:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/compliance/facilities/[id]/notifications - Create notification requirement
export async function POST(
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

    interface FacilityData {
      id: string;
      facility_name: string;
    }

    // Verify facility belongs to org
    const { data: facility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id, facility_name')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single() as { data: FacilityData | null };

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createNotificationRequirementSchema.safeParse(body);

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

    // Create requirement
    const { data: requirement, error: createError } = await (supabase
      .from('notification_requirements') as ReturnType<typeof supabase.from>)
      .insert({
        facility_id: facilityId,
        ...parsed.data,
      })
      .select()
      .single() as { data: NotificationRequirement | null; error: unknown };

    if (createError || !requirement) {
      console.error('Error creating requirement:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create requirement',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'notification_requirement_created',
        actor_id: user.id,
        entity_type: 'notification_requirement',
        entity_id: requirement.id,
        entity_name: requirement.name,
        description: `Created notification requirement: ${requirement.name} for ${facility.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<NotificationRequirement>>({
      success: true,
      data: requirement,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/compliance/facilities/[id]/notifications:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
