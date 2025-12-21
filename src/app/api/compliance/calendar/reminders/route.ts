import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import type { NotificationPreferences, ReminderConfig } from '@/app/features/compliance/sub_AutomatedCalendar/lib/types';

// GET /api/compliance/calendar/reminders - Get user's notification preferences and reminders
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

    // In a real implementation, fetch from notification_preferences table
    // For now, return mock preferences
    const preferences: NotificationPreferences = {
      id: `prefs-${user.id}`,
      user_id: user.id,
      email_enabled: true,
      email_address: user.email || '',
      slack_enabled: false,
      in_app_enabled: true,
      calendar_push_enabled: false,
      timezone: 'America/New_York',
      default_reminder_settings: {
        covenant_test: {
          timings: [7, 3, 1],
          channels: ['email', 'in_app'],
        },
        compliance_event: {
          timings: [14, 7, 3],
          channels: ['email', 'in_app'],
        },
        notification_due: {
          timings: [7, 3],
          channels: ['email', 'in_app'],
        },
        waiver_expiration: {
          timings: [30, 14, 7, 1],
          channels: ['email', 'slack', 'in_app'],
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<NotificationPreferences>>({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/calendar/reminders:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/compliance/calendar/reminders - Update user's notification preferences
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const preferences = body as Partial<NotificationPreferences>;

    // In a real implementation, update the notification_preferences table
    // For now, return the updated preferences
    const updatedPreferences: NotificationPreferences = {
      id: `prefs-${user.id}`,
      user_id: user.id,
      email_enabled: preferences.email_enabled ?? true,
      email_address: preferences.email_address ?? user.email ?? '',
      slack_enabled: preferences.slack_enabled ?? false,
      slack_webhook_url: preferences.slack_webhook_url,
      slack_channel: preferences.slack_channel,
      in_app_enabled: preferences.in_app_enabled ?? true,
      calendar_push_enabled: preferences.calendar_push_enabled ?? false,
      quiet_hours_start: preferences.quiet_hours_start,
      quiet_hours_end: preferences.quiet_hours_end,
      timezone: preferences.timezone ?? 'America/New_York',
      default_reminder_settings: preferences.default_reminder_settings ?? {
        covenant_test: {
          timings: [7, 3, 1],
          channels: ['email', 'in_app'],
        },
        compliance_event: {
          timings: [14, 7, 3],
          channels: ['email', 'in_app'],
        },
        notification_due: {
          timings: [7, 3],
          channels: ['email', 'in_app'],
        },
        waiver_expiration: {
          timings: [30, 14, 7, 1],
          channels: ['email', 'slack', 'in_app'],
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<NotificationPreferences>>({
      success: true,
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('Error in PUT /api/compliance/calendar/reminders:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/compliance/calendar/reminders - Create reminders for an event
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

    const body = await request.json();
    const { event_id, reminders } = body as { event_id: string; reminders: Partial<ReminderConfig>[] };

    // In a real implementation, create reminder records in the database
    // For now, return the created reminders
    const createdReminders: ReminderConfig[] = reminders.map((r, idx) => ({
      id: `${event_id}-reminder-${idx}`,
      event_id,
      timing_days: r.timing_days ?? 7,
      channels: r.channels ?? ['email', 'in_app'],
      recipients: r.recipients ?? [user.email || ''],
      is_active: r.is_active ?? true,
      created_at: new Date().toISOString(),
    }));

    return NextResponse.json<ApiResponse<ReminderConfig[]>>({
      success: true,
      data: createdReminders,
    });
  } catch (error) {
    console.error('Error in POST /api/compliance/calendar/reminders:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
