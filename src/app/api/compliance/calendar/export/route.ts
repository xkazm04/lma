import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import {
  generateICalCalendar,
  generateCovenantEvents,
  generateObligationEvents,
  DEFAULT_REMINDER_SETTINGS,
} from '@/app/features/compliance/sub_AutomatedCalendar/lib/event-generator';
import type { AutomatedCalendarEvent } from '@/app/features/compliance/sub_AutomatedCalendar/lib/types';

// GET /api/compliance/calendar/export - Export calendar as iCal file
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
    const format = searchParams.get('format') || 'ical';
    const facilityId = searchParams.get('facility_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // For demo purposes, generate mock events
    // In production, this would fetch real events from the database
    const events: AutomatedCalendarEvent[] = [];

    // Generate iCal content
    const icalContent = generateICalCalendar(events, 'LoanOS Compliance Calendar');

    if (format === 'ical' || format === 'ics') {
      // Return as downloadable file
      return new NextResponse(icalContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar;charset=utf-8',
          'Content-Disposition': `attachment; filename="loanos-compliance-${new Date().toISOString().split('T')[0]}.ics"`,
        },
      });
    }

    // Return JSON response with events
    return NextResponse.json<ApiResponse<{ events: AutomatedCalendarEvent[], ical: string }>>({
      success: true,
      data: {
        events,
        ical: icalContent,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/calendar/export:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
