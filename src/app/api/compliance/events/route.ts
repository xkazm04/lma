import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, ComplianceEventWithDetails } from '@/types';
import type { ComplianceEvent, ComplianceObligation, ComplianceFacility } from '@/types/database';

// GET /api/compliance/events - List all compliance events (with filters)
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
    const facilityId = searchParams.get('facility_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    interface FacilityData {
      id: string;
      facility_name: string;
      borrower_name: string;
    }

    // Get facilities for this organization
    const { data: facilities } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id, facility_name, borrower_name')
      .eq('organization_id', userData.organization_id) as { data: FacilityData[] | null };

    const facilityIds = (facilities || []).map((f: FacilityData) => f.id);
    const facilityMap = new Map<string, { facility_name: string; borrower_name: string }>(
      (facilities || []).map((f: FacilityData) => [
        f.id,
        { facility_name: f.facility_name, borrower_name: f.borrower_name },
      ])
    );

    if (facilityIds.length === 0) {
      return NextResponse.json<ApiResponse<ComplianceEventWithDetails[]>>({
        success: true,
        data: [],
      });
    }

    // Build events query
    let query = (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select('*')
      .in('facility_id', facilityIds)
      .order('deadline_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (facilityId) {
      query = query.eq('facility_id', facilityId);
    }

    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.in('status', ['upcoming', 'due_soon']);
      } else if (status === 'action_required') {
        query = query.in('status', ['overdue', 'rejected']);
      } else {
        query = query.eq('status', status);
      }
    }

    if (startDate) {
      query = query.gte('deadline_date', startDate);
    }

    if (endDate) {
      query = query.lte('deadline_date', endDate);
    }

    const { data: events, error: eventsError } = await query as { data: ComplianceEvent[] | null; error: unknown };

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch events',
        },
      }, { status: 500 });
    }

    interface ObligationData {
      id: string;
      name: string;
      obligation_type: string;
      requires_certification: boolean;
      requires_audit: boolean;
    }

    // Get obligations for events
    const obligationIds = [...new Set((events || []).map((e: ComplianceEvent) => e.obligation_id))];
    const { data: obligations } = await (supabase
      .from('compliance_obligations') as ReturnType<typeof supabase.from>)
      .select('id, name, obligation_type, requires_certification, requires_audit')
      .in('id', obligationIds) as { data: ObligationData[] | null };

    const obligationMap = new Map<string, { name: string; obligation_type: string; requires_certification: boolean; requires_audit: boolean }>(
      (obligations || []).map((o: { id: string; name: string; obligation_type: string; requires_certification: boolean; requires_audit: boolean }) => [o.id, o])
    );

    // Build response with details
    const eventsWithDetails: ComplianceEventWithDetails[] = (events || []).map(
      (event: ComplianceEvent) => {
        const obligation = obligationMap.get(event.obligation_id);
        const facility = facilityMap.get(event.facility_id);

        return {
          ...event,
          obligation: obligation
            ? {
                name: obligation.name,
                obligation_type: obligation.obligation_type,
                requires_certification: obligation.requires_certification,
                requires_audit: obligation.requires_audit,
              }
            : undefined,
          facility: facility
            ? {
                facility_name: facility.facility_name,
                borrower_name: facility.borrower_name,
              }
            : undefined,
        };
      }
    );

    return NextResponse.json<ApiResponse<ComplianceEventWithDetails[]>>({
      success: true,
      data: eventsWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/events:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
