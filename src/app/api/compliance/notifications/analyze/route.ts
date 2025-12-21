import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeEventSchema } from '@/lib/validations';
import { analyzeBusinessEvent } from '@/lib/llm/compliance';
import type { ApiResponse, EventAnalysisResult } from '@/types';
import type { NotificationRequirement, ComplianceFacility } from '@/types/database';

// POST /api/compliance/notifications/analyze - AI analysis of event
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
    const parsed = analyzeEventSchema.safeParse(body);

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

    // Get facilities for this organization
    let facilitiesQuery = supabase
      .from('compliance_facilities')
      .select('id, facility_name')
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active');

    if (parsed.data.facility_ids && parsed.data.facility_ids.length > 0) {
      facilitiesQuery = facilitiesQuery.in('id', parsed.data.facility_ids);
    }

    const { data: facilities } = await facilitiesQuery;

    if (!facilities || facilities.length === 0) {
      return NextResponse.json<ApiResponse<EventAnalysisResult>>({
        success: true,
        data: {
          triggered_notifications: [],
          suggested_actions: ['No active facilities found to analyze.'],
          risk_assessment: 'No facilities available for analysis.',
        },
      });
    }

    const facilityIds = facilities.map((f: ComplianceFacility) => f.id);
    const facilityMap = new Map(
      facilities.map((f: { id: string; facility_name: string }) => [f.id, f.facility_name])
    );

    // Get notification requirements for these facilities
    const { data: requirements } = await supabase
      .from('notification_requirements')
      .select('*')
      .in('facility_id', facilityIds)
      .eq('is_active', true);

    if (!requirements || requirements.length === 0) {
      return NextResponse.json<ApiResponse<EventAnalysisResult>>({
        success: true,
        data: {
          triggered_notifications: [],
          suggested_actions: ['No notification requirements configured for the selected facilities.'],
          risk_assessment: 'Unable to assess - no notification requirements available.',
        },
      });
    }

    // Prepare context for LLM
    const requirementsContext = (requirements || []).map((r: NotificationRequirement) => ({
      id: r.id,
      facility_id: r.facility_id,
      facility_name: facilityMap.get(r.facility_id) || 'Unknown',
      event_type: r.event_type,
      name: r.name,
      trigger_description: r.trigger_description,
      notification_deadline: r.notification_deadline,
      notification_deadline_days: r.notification_deadline_days,
      required_content: r.required_content,
    }));

    // Call LLM for analysis
    const analysisResult = await analyzeBusinessEvent(
      parsed.data.event_description,
      requirementsContext
    );

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'event_analyzed',
        actor_id: user.id,
        entity_type: 'notification_analysis',
        entity_id: crypto.randomUUID(),
        description: `Analyzed business event for notification triggers`,
        details: {
          event_description: parsed.data.event_description.substring(0, 500),
          triggered_count: analysisResult.triggered_notifications.length,
        },
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<EventAnalysisResult>>({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    console.error('Error in POST /api/compliance/notifications/analyze:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
