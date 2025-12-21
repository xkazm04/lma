import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import {
  createGovernanceEventSchema,
  governanceDashboardFiltersSchema,
} from '@/lib/validations/esg';
import type { GovernanceEvent } from '@/lib/validations/esg';

// GET /api/esg/governance/events - Get governance events
// Query params:
//   - borrower_id (optional): Filter by borrower
//   - event_types (optional): Comma-separated event types
//   - severity (optional): Comma-separated severities
//   - date_from (optional): Start date filter
//   - date_to (optional): End date filter
//   - requires_action (optional): Filter by action required
//   - page (optional): Page number (default 1)
//   - page_size (optional): Items per page (default 20)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const borrowerId = searchParams.get('borrower_id');
    const eventTypes = searchParams.get('event_types')?.split(',').filter(Boolean);
    const severities = searchParams.get('severity')?.split(',').filter(Boolean);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const requiresAction = searchParams.get('requires_action');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

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

    // Build query
    let query = supabase
      .from('governance_events')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('event_date', { ascending: false });

    if (borrowerId) {
      query = query.eq('borrower_id', borrowerId);
    }

    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }

    if (severities && severities.length > 0) {
      query = query.in('severity', severities);
    }

    if (dateFrom) {
      query = query.gte('event_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('event_date', dateTo);
    }

    if (requiresAction !== null && requiresAction !== undefined) {
      query = query.eq('requires_action', requiresAction === 'true');
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: events, error, count } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse<GovernanceEvent[]>>({
      success: true,
      data: events || [],
      meta: {
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/esg/governance/events:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/governance/events - Create a new governance event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

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

    interface PostUserData {
      organization_id: string;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single() as { data: PostUserData | null };

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

    // Validate request body
    const validationResult = createGovernanceEventSchema.safeParse(body);
    if (!validationResult.success) {
      const zodError = validationResult.error;
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid governance event data',
          details: {
            fieldErrors: zodError.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
      }, { status: 400 });
    }

    const eventData = validationResult.data;

    // Insert event
    const { data: newEvent, error } = await supabase
      .from('governance_events')
      .insert({
        ...eventData,
        organization_id: orgId,
        created_by: user.id,
      } as Record<string, unknown>)
      .select()
      .single() as { data: GovernanceEvent | null; error: unknown };

    if (error) throw error;

    // Log activity
    try {
      await supabase.from('activities').insert({
        organization_id: orgId,
        user_id: user.id,
        activity_type: 'governance_event_created',
        description: `Governance event recorded: ${eventData.title}`,
        entity_type: 'governance_event',
        entity_id: newEvent?.borrower_id,
        source_module: 'esg',
      } as Record<string, unknown>);
    } catch {
      // Ignore activity logging errors
    }

    // If severity is warning or critical, auto-generate an alert
    if (eventData.severity === 'warning' || eventData.severity === 'critical') {
      try {
        await supabase.from('governance_alerts').insert({
          organization_id: orgId,
          borrower_id: eventData.borrower_id,
          alert_type: eventData.event_type,
          severity: eventData.severity,
          title: `Governance Alert: ${eventData.title}`,
          description: eventData.description || `A ${eventData.severity} governance event has been recorded.`,
          source_event_id: newEvent?.borrower_id,
          recommended_actions: eventData.requires_action
            ? ['Review the governance event', 'Assess impact on covenants', 'Update monitoring']
            : [],
          created_by: user.id,
        } as Record<string, unknown>);
      } catch {
        // Ignore alert creation errors
      }
    }

    return NextResponse.json<ApiResponse<GovernanceEvent>>({
      success: true,
      data: newEvent,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/governance/events:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
