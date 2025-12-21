import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateComplianceEventSchema } from '@/lib/validations';
import type { ApiResponse, ComplianceEventWithDetails } from '@/types';
import type { ComplianceEvent } from '@/types/database';

// GET /api/compliance/events/[eid] - Get event detail
export async function GET(
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

    interface EventWithDetails {
      id: string;
      facility_id: string;
      obligation_id: string;
      reference_period_start: string;
      reference_period_end: string;
      deadline_date: string;
      grace_deadline_date: string | null;
      status: string;
      submitted_at: string | null;
      submitted_by: string | null;
      submission_notes: string | null;
      reviewed_at: string | null;
      reviewed_by: string | null;
      review_notes: string | null;
      created_at: string;
      updated_at: string;
      compliance_facilities: {
        organization_id: string;
        facility_name: string;
        borrower_name: string;
      };
      compliance_obligations: {
        name: string;
        obligation_type: string;
        requires_certification: boolean;
        requires_audit: boolean;
      };
    }

    // Get event with facility verification
    const { data: event, error: eventError } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          organization_id,
          facility_name,
          borrower_name
        ),
        compliance_obligations!inner (
          name,
          obligation_type,
          requires_certification,
          requires_audit
        )
      `)
      .eq('id', eventId)
      .single() as { data: EventWithDetails | null; error: unknown };

    if (eventError || !event) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found',
        },
      }, { status: 404 });
    }

    if (event.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      }, { status: 403 });
    }

    interface DocumentData {
      id: string;
      filename: string;
      document_type: string;
      uploaded_at: string;
    }

    // Get documents
    const { data: documents } = await (supabase
      .from('compliance_documents') as ReturnType<typeof supabase.from>)
      .select('id, filename, document_type, uploaded_at')
      .eq('event_id', eventId)
      .order('uploaded_at', { ascending: false }) as { data: DocumentData[] | null };

    const eventWithDetails = {
      id: event.id,
      facility_id: event.facility_id,
      obligation_id: event.obligation_id,
      reference_period_start: event.reference_period_start,
      reference_period_end: event.reference_period_end,
      deadline_date: event.deadline_date,
      grace_deadline_date: event.grace_deadline_date,
      status: event.status,
      submitted_at: event.submitted_at,
      submitted_by: event.submitted_by,
      submission_notes: event.submission_notes,
      reviewed_at: event.reviewed_at,
      reviewed_by: event.reviewed_by,
      review_notes: event.review_notes,
      created_at: event.created_at,
      updated_at: event.updated_at,
      obligation: {
        name: event.compliance_obligations.name,
        obligation_type: event.compliance_obligations.obligation_type,
        requires_certification: event.compliance_obligations.requires_certification,
        requires_audit: event.compliance_obligations.requires_audit,
      },
      facility: {
        facility_name: event.compliance_facilities.facility_name,
        borrower_name: event.compliance_facilities.borrower_name,
      },
      documents: documents || [],
    } as ComplianceEventWithDetails;

    return NextResponse.json<ApiResponse<ComplianceEventWithDetails>>({
      success: true,
      data: eventWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/events/[eid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/compliance/events/[eid] - Update event
export async function PUT(
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

    interface ExistingEventData {
      id: string;
      compliance_facilities: {
        organization_id: string;
      };
    }

    // Verify event access
    const { data: existingEvent } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          organization_id
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

    const body = await request.json();
    const parsed = updateComplianceEventSchema.safeParse(body);

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

    // Update event
    const { data: event, error: updateError } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .update({
        ...parsed.data,
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
          message: 'Failed to update event',
        },
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<ComplianceEvent>>({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error in PUT /api/compliance/events/[eid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
