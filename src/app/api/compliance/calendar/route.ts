import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, CalendarItem } from '@/types';

// GET /api/compliance/calendar - Get calendar items
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

    const orgId = userData.organization_id;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const facilityId = searchParams.get('facility_id');

    // Build date range (default to current month if not provided)
    const now = new Date();
    const rangeStart = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const rangeEnd = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Get facilities for org
    let facilitiesQuery = (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id')
      .eq('organization_id', orgId);

    if (facilityId) {
      facilitiesQuery = facilitiesQuery.eq('id', facilityId);
    }

    const { data: facilities } = await facilitiesQuery;
    const facilityIds = (facilities || []).map((f: { id: string }) => f.id);

    if (facilityIds.length === 0) {
      return NextResponse.json<ApiResponse<CalendarItem[]>>({
        success: true,
        data: [],
      });
    }

    const calendarItems: CalendarItem[] = [];

    interface EventData {
      id: string;
      deadline_date: string;
      status: string;
      compliance_obligations: {
        name: string;
        obligation_type: string;
      };
      compliance_facilities: {
        id: string;
        facility_name: string;
        borrower_name: string;
      };
    }

    // Get compliance events in date range
    const { data: events } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        deadline_date,
        status,
        compliance_obligations!inner (
          name,
          obligation_type
        ),
        compliance_facilities!inner (
          id,
          facility_name,
          borrower_name
        )
      `)
      .in('facility_id', facilityIds)
      .gte('deadline_date', rangeStart)
      .lte('deadline_date', rangeEnd)
      .order('deadline_date') as { data: EventData[] | null };

    for (const event of events || []) {
      calendarItems.push({
        id: event.id,
        date: event.deadline_date,
        type: 'compliance_event',
        title: event.compliance_obligations.name,
        facility_id: event.compliance_facilities.id,
        facility_name: event.compliance_facilities.facility_name,
        borrower_name: event.compliance_facilities.borrower_name,
        status: event.status,
        details: {
          obligation_type: event.compliance_obligations.obligation_type,
        },
      });
    }

    interface CovenantData {
      id: string;
      name: string;
      covenant_type: string;
      test_frequency: string;
      next_test_date: string | null;
      compliance_facilities: {
        id: string;
        facility_name: string;
        borrower_name: string;
      };
    }

    // Get covenant test deadlines
    const { data: covenants } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        name,
        covenant_type,
        test_frequency,
        next_test_date,
        compliance_facilities!inner (
          id,
          facility_name,
          borrower_name
        )
      `)
      .in('facility_id', facilityIds)
      .eq('status', 'active')
      .gte('next_test_date', rangeStart)
      .lte('next_test_date', rangeEnd)
      .order('next_test_date') as { data: CovenantData[] | null };

    for (const covenant of covenants || []) {
      if (covenant.next_test_date) {
        calendarItems.push({
          id: covenant.id,
          date: covenant.next_test_date,
          type: 'covenant_test',
          title: `${covenant.name} Test`,
          facility_id: covenant.compliance_facilities.id,
          facility_name: covenant.compliance_facilities.facility_name,
          borrower_name: covenant.compliance_facilities.borrower_name,
          status: 'pending',
          details: {
            covenant_type: covenant.covenant_type,
            test_frequency: covenant.test_frequency,
          },
        });
      }
    }

    interface NotificationData {
      id: string;
      notification_due_date: string;
      notification_status: string;
      notification_requirements: {
        name: string;
        event_type: string;
      };
      compliance_facilities: {
        id: string;
        facility_name: string;
        borrower_name: string;
      };
    }

    // Get notification due dates
    const { data: notifications } = await (supabase
      .from('notification_events') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        notification_due_date,
        notification_status,
        notification_requirements!inner (
          name,
          event_type
        ),
        compliance_facilities!inner (
          id,
          facility_name,
          borrower_name
        )
      `)
      .in('facility_id', facilityIds)
      .gte('notification_due_date', rangeStart)
      .lte('notification_due_date', rangeEnd)
      .order('notification_due_date') as { data: NotificationData[] | null };

    for (const notification of notifications || []) {
      calendarItems.push({
        id: notification.id,
        date: notification.notification_due_date,
        type: 'notification_due',
        title: notification.notification_requirements.name,
        facility_id: notification.compliance_facilities.id,
        facility_name: notification.compliance_facilities.facility_name,
        borrower_name: notification.compliance_facilities.borrower_name,
        status: notification.notification_status,
        details: {
          event_type: notification.notification_requirements.event_type,
        },
      });
    }

    interface WaiverData {
      id: string;
      waiver_type: string;
      expiration_date: string;
      status: string;
      compliance_facilities: {
        id: string;
        facility_name: string;
        borrower_name: string;
      };
    }

    // Get waiver expiration dates
    const { data: waivers } = await (supabase
      .from('compliance_waivers') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        waiver_type,
        expiration_date,
        status,
        compliance_facilities!inner (
          id,
          facility_name,
          borrower_name
        )
      `)
      .in('facility_id', facilityIds)
      .eq('status', 'granted')
      .gte('expiration_date', rangeStart)
      .lte('expiration_date', rangeEnd)
      .order('expiration_date') as { data: WaiverData[] | null };

    for (const waiver of waivers || []) {
      if (waiver.expiration_date) {
        calendarItems.push({
          id: waiver.id,
          date: waiver.expiration_date,
          type: 'waiver_expiration',
          title: `${waiver.waiver_type} Waiver Expires`,
          facility_id: waiver.compliance_facilities.id,
          facility_name: waiver.compliance_facilities.facility_name,
          borrower_name: waiver.compliance_facilities.borrower_name,
          status: 'pending',
          details: {
            waiver_type: waiver.waiver_type,
          },
        });
      }
    }

    // Sort all items by date
    calendarItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json<ApiResponse<CalendarItem[]>>({
      success: true,
      data: calendarItems,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/calendar:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
