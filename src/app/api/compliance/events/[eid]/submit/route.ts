import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitComplianceEventSchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';
import type { ComplianceEvent } from '@/types/database';

// POST /api/compliance/events/[eid]/submit - Submit compliance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eid: string }> }
) {
  try {
    const { eid: eventId } = await params;
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
      full_name: string;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, full_name')
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

    interface ExistingEventData {
      id: string;
      status: string;
      compliance_facilities: {
        organization_id: string;
        facility_name: string;
      };
      compliance_obligations: {
        name: string;
      };
    }

    // Verify event access
    const { data: existingEvent } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          organization_id,
          facility_name
        ),
        compliance_obligations!inner (
          name
        )
      `)
      .eq('id', eventId)
      .single() as { data: ExistingEventData | null };

    if (!existingEvent || existingEvent.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found',
        },
      }, { status: 404 });
    }

    // Check if event can be submitted
    if (!['upcoming', 'due_soon', 'overdue', 'rejected'].includes(existingEvent.status)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot submit event with status: ${existingEvent.status}`,
        },
      }, { status: 400 });
    }

    const body = await request.json();
    const parsed = submitComplianceEventSchema.safeParse(body);

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

    // Update event to submitted
    const { data: event, error: updateError } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submitted_by: user.id,
        submission_notes: parsed.data.submission_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single() as { data: ComplianceEvent | null; error: unknown };

    if (updateError || !event) {
      console.error('Error updating event:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to submit event',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'compliance_submitted',
        actor_id: user.id,
        entity_type: 'compliance_event',
        entity_id: eventId,
        entity_name: existingEvent.compliance_obligations.name,
        description: `Submitted compliance: ${existingEvent.compliance_obligations.name} for ${existingEvent.compliance_facilities.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<ComplianceEvent>>({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error in POST /api/compliance/events/[eid]/submit:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
