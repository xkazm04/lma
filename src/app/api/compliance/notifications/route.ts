import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotificationEventSchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';
import type { NotificationEvent } from '@/types/database';

// POST /api/compliance/notifications - Log notification event
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

    const body = await request.json();
    const parsed = createNotificationEventSchema.safeParse(body);

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

    interface NotificationRequirement {
      id: string;
      name: string;
      facility_id: string;
      compliance_facilities: {
        organization_id: string;
        facility_name: string;
      };
    }

    // Verify requirement access
    const { data: requirement } = await (supabase
      .from('notification_requirements') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        name,
        facility_id,
        compliance_facilities!inner (
          organization_id,
          facility_name
        )
      `)
      .eq('id', parsed.data.requirement_id)
      .single() as { data: NotificationRequirement | null };

    if (!requirement || requirement.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification requirement not found',
        },
      }, { status: 404 });
    }

    interface NotificationEventResponse {
      id: string;
      requirement_id: string;
      facility_id: string;
      event_date: string;
      event_description: string;
      notification_due_date: string;
      notification_content: string | null;
      created_by: string;
    }

    // Create notification event
    const { data: event, error: createError } = await (supabase
      .from('notification_events') as ReturnType<typeof supabase.from>)
      .insert({
        requirement_id: parsed.data.requirement_id,
        facility_id: requirement.facility_id,
        event_date: parsed.data.event_date,
        event_description: parsed.data.event_description,
        notification_due_date: parsed.data.notification_due_date,
        notification_content: parsed.data.notification_content,
        created_by: user.id,
      })
      .select()
      .single() as { data: NotificationEventResponse | null; error: unknown };

    if (createError) {
      console.error('Error creating event:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create notification event',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'notification_event_created',
        actor_id: user.id,
        entity_type: 'notification_event',
        entity_id: event!.id,
        entity_name: requirement.name,
        description: `Logged notification event: ${requirement.name} for ${requirement.compliance_facilities.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<NotificationEventResponse>>({
      success: true,
      data: event!,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/compliance/notifications:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
