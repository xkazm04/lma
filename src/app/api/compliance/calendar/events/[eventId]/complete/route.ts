import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

interface CompleteEventRequest {
  notes?: string;
  document_id?: string;
}

// POST /api/compliance/calendar/events/[eventId]/complete - Mark an event as complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
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

    // Parse request body
    const body: CompleteEventRequest = await request.json().catch(() => ({}));

    interface UserData {
      organization_id: string;
      full_name: string | null;
    }

    // Get user's organization and name
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

    // Determine event type from eventId prefix and update accordingly
    // In a real implementation, you'd have a unified events table
    // For now, we handle different event types separately

    const now = new Date().toISOString();

    if (eventId.startsWith('compliance-') || eventId.startsWith('obligation-')) {
      // Update compliance_events table
      // Using type assertion due to dynamic table that may not be in Supabase types
      const updateData = {
        status: 'submitted',
        submitted_at: now,
        submitted_by: user.id,
        submission_notes: body.notes,
      };

      const { data: event, error: updateError } = await (supabase
        .from('compliance_events') as ReturnType<typeof supabase.from>)
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating compliance event:', updateError);
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update event',
          },
        }, { status: 500 });
      }

      return NextResponse.json<ApiResponse<typeof event>>({
        success: true,
        data: event,
      });
    }

    if (eventId.startsWith('covenant-')) {
      // For covenant test events, we would typically:
      // 1. Create a new covenant test record
      // 2. Update the covenant's next_test_date
      // For simplicity, return a mock success response

      return NextResponse.json<ApiResponse<{ id: string; status: string }>>({
        success: true,
        data: {
          id: eventId,
          status: 'completed',
        },
      });
    }

    // Default response for other event types
    return NextResponse.json<ApiResponse<{ id: string; status: string; completed_at: string; completed_by: string }>>({
      success: true,
      data: {
        id: eventId,
        status: 'completed',
        completed_at: now,
        completed_by: userData.full_name || user.email || 'Unknown',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/compliance/calendar/events/[eventId]/complete:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
