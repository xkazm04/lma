import { NextRequest, NextResponse } from 'next/server';
import type { ScheduleCallRequest, ScheduledMeeting } from '@/app/features/deals/lib/velocity-types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/deals/[id]/acceleration-alerts/schedule
 * Schedule a call or meeting based on an intervention suggestion
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dealId } = await params;
    const body = (await request.json()) as ScheduleCallRequest;

    const {
      alertId,
      interventionId,
      title,
      description,
      participantIds,
      duration,
      preferredTimeSlot,
      calendarProvider,
      sendInvites,
      agendaItems,
    } = body;

    // Validate required fields
    if (!alertId || !interventionId || !title || !participantIds || participantIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'alertId, interventionId, title, and participantIds are required',
          },
        },
        { status: 400 }
      );
    }

    // Generate meeting ID
    const meetingId = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    // Determine scheduled time (use preferred slot or default to next business day at 10am)
    let scheduledAt: string;
    if (preferredTimeSlot?.startTime) {
      scheduledAt = preferredTimeSlot.startTime;
    } else {
      const nextBusinessDay = getNextBusinessDay();
      nextBusinessDay.setHours(10, 0, 0, 0);
      scheduledAt = nextBusinessDay.toISOString();
    }

    // In a real implementation, this would:
    // 1. Create a calendar event via the calendar provider API
    // 2. Send invites to participants
    // 3. Store the meeting in the database
    // 4. Update the alert status

    // Generate mock calendar integration response
    let calendarEventId: string | undefined;
    let meetingLink: string | undefined;

    if (calendarProvider && calendarProvider !== 'manual') {
      calendarEventId = `cal-${calendarProvider}-${meetingId}`;

      // Generate appropriate meeting link based on provider
      switch (calendarProvider) {
        case 'google':
          meetingLink = `https://meet.google.com/${generateMeetCode()}`;
          break;
        case 'outlook':
          meetingLink = `https://teams.microsoft.com/l/meetup-join/${generateMeetCode()}`;
          break;
        case 'calendly':
          meetingLink = `https://calendly.com/scheduled/${meetingId}`;
          break;
      }
    }

    const scheduledMeeting: ScheduledMeeting = {
      id: meetingId,
      alertId,
      interventionId,
      dealId,
      title,
      description: description || generateMeetingDescription(agendaItems),
      scheduledAt,
      duration: duration || 30,
      participantIds,
      calendarEventId,
      calendarProvider,
      meetingLink,
      status: sendInvites ? 'scheduled' : 'confirmed',
      createdAt: now.toISOString(),
      createdBy: 'current-user', // In real implementation, get from auth
    };

    // Generate response with additional helper data
    const response = {
      success: true,
      data: {
        meeting: scheduledMeeting,
        calendarIntegration: {
          provider: calendarProvider,
          eventCreated: !!calendarEventId,
          invitesSent: sendInvites,
          inviteCount: sendInvites ? participantIds.length : 0,
        },
        alertUpdate: {
          alertId,
          newStatus: 'acted_upon',
          selectedInterventionId: interventionId,
          actionTakenAt: now.toISOString(),
        },
        suggestedFollowUp: {
          sendReminder: true,
          reminderTime: new Date(new Date(scheduledAt).getTime() - 24 * 60 * 60 * 1000).toISOString(),
          prepareAgenda: true,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SCHEDULE_ERROR',
          message: 'Failed to schedule meeting',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deals/[id]/acceleration-alerts/schedule
 * Get all scheduled meetings for a deal
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dealId } = await params;

    // In a real implementation, fetch from database
    // For now, return mock scheduled meetings

    const mockMeetings: ScheduledMeeting[] = [
      {
        id: 'meeting-1',
        alertId: 'alert-1',
        interventionId: 'intervention-1',
        dealId,
        title: 'Deal Alignment Call',
        description: 'Review current negotiation status and address blockers',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        participantIds: ['user-1', 'user-2'],
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        createdBy: 'user-1',
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        meetings: mockMeetings,
        totalCount: mockMeetings.length,
      },
    });
  } catch (error) {
    console.error('Error fetching scheduled meetings:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch scheduled meetings',
        },
      },
      { status: 500 }
    );
  }
}

// Helper functions

function getNextBusinessDay(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  // Skip weekends
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function generateMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let code = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (i < 2) code += '-';
  }
  return code;
}

function generateMeetingDescription(agendaItems: string[]): string {
  if (!agendaItems || agendaItems.length === 0) {
    return 'Deal acceleration alignment call';
  }

  return `Agenda:\n${agendaItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
}
