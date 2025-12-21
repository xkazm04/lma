import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import {
  createGovernanceAlertSchema,
  acknowledgeGovernanceAlertSchema,
  dismissGovernanceAlertSchema,
} from '@/lib/validations/esg';
import type { GovernanceAlert } from '@/lib/validations/esg';
import { generateGovernanceAlerts } from '@/lib/llm/governance';

// GET /api/esg/governance/alerts - Get governance alerts
// Query params:
//   - borrower_id (optional): Filter by borrower
//   - facility_id (optional): Filter by facility
//   - severity (optional): Comma-separated severities
//   - acknowledged (optional): Filter by acknowledged status
//   - dismissed (optional): Filter by dismissed status (default: false)
//   - page (optional): Page number (default 1)
//   - page_size (optional): Items per page (default 20)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const borrowerId = searchParams.get('borrower_id');
    const facilityId = searchParams.get('facility_id');
    const severities = searchParams.get('severity')?.split(',').filter(Boolean);
    const acknowledged = searchParams.get('acknowledged');
    const dismissed = searchParams.get('dismissed') ?? 'false';
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
      .from('governance_alerts')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (borrowerId) {
      query = query.eq('borrower_id', borrowerId);
    }

    if (facilityId) {
      query = query.eq('facility_id', facilityId);
    }

    if (severities && severities.length > 0) {
      query = query.in('severity', severities);
    }

    if (acknowledged !== null && acknowledged !== undefined && acknowledged !== '') {
      query = query.eq('acknowledged', acknowledged === 'true');
    }

    if (dismissed !== null && dismissed !== undefined) {
      query = query.eq('dismissed', dismissed === 'true');
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: alerts, error, count } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse<GovernanceAlert[]>>({
      success: true,
      data: alerts || [],
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
    console.error('Error in GET /api/esg/governance/alerts:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/governance/alerts - Create a new governance alert or generate alerts from events
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

    // Check if this is a generate request or a direct create
    if (body.action === 'generate') {
      // Generate alerts based on events and metrics
      const { borrower_id } = body;

      if (!borrower_id) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'borrower_id is required for generate action',
          },
        }, { status: 400 });
      }

      // Get governance metrics
      const { data: metricsData } = await supabase
        .from('governance_metrics')
        .select('*')
        .eq('borrower_id', borrower_id)
        .eq('organization_id', orgId)
        .order('as_of_date', { ascending: false })
        .limit(1)
        .single();

      // Get recent events
      const { data: eventsData } = await supabase
        .from('governance_events')
        .select('*')
        .eq('borrower_id', borrower_id)
        .eq('organization_id', orgId)
        .order('event_date', { ascending: false })
        .limit(20);

      // Get covenants for the borrower
      const { data: facilitiesData } = await supabase
        .from('esg_facilities')
        .select('id')
        .eq('organization_id', orgId) as { data: Array<{ id: string }> | null };

      const facilityIds = (facilitiesData || []).map((f) => f.id);

      const { data: covenantsData } = await supabase
        .from('compliance_covenants')
        .select('covenant_name, covenant_type')
        .in('facility_id', facilityIds.length > 0 ? facilityIds : ['00000000-0000-0000-0000-000000000000']) as {
          data: Array<{ covenant_name: string; covenant_type: string }> | null
        };

      // Get borrower name
      const { data: borrowerInfo } = await supabase
        .from('esg_facilities')
        .select('borrower_name')
        .eq('organization_id', orgId)
        .limit(1)
        .single() as { data: { borrower_name: string | null } | null };

      if (!metricsData || !eventsData || eventsData.length === 0) {
        return NextResponse.json<ApiResponse<GovernanceAlert[]>>({
          success: true,
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 0,
              total: 0,
              totalPages: 0,
            },
          },
        });
      }

      // Generate alerts using LLM
      const generatedAlerts = await generateGovernanceAlerts(
        borrowerInfo?.borrower_name || 'Unknown',
        eventsData,
        metricsData,
        covenantsData || []
      );

      // Insert generated alerts
      const alertsToInsert = generatedAlerts.map((alert) => ({
        organization_id: orgId,
        borrower_id,
        alert_type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        covenant_impact: alert.covenant_impact,
        recommended_actions: alert.recommended_actions,
        created_by: user.id,
      }));

      if (alertsToInsert.length > 0) {
        const { data: insertedAlerts, error: insertError } = await supabase
          .from('governance_alerts')
          .insert(alertsToInsert as Record<string, unknown>[])
          .select() as { data: GovernanceAlert[] | null; error: unknown };

        if (insertError) throw insertError;

        return NextResponse.json<ApiResponse<GovernanceAlert[]>>({
          success: true,
          data: insertedAlerts || [],
        }, { status: 201 });
      }

      return NextResponse.json<ApiResponse<GovernanceAlert[]>>({
        success: true,
        data: [],
      });
    }

    // Direct create
    const validationResult = createGovernanceAlertSchema.safeParse(body);
    if (!validationResult.success) {
      const zodError = validationResult.error;
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid governance alert data',
          details: {
            fieldErrors: zodError.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
      }, { status: 400 });
    }

    const alertData = validationResult.data;

    const { data: newAlert, error } = await supabase
      .from('governance_alerts')
      .insert({
        ...alertData,
        organization_id: orgId,
        created_by: user.id,
      } as Record<string, unknown>)
      .select()
      .single() as { data: GovernanceAlert | null; error: unknown };

    if (error) throw error;

    // Log activity
    try {
      await supabase.from('activities').insert({
        organization_id: orgId,
        user_id: user.id,
        activity_type: 'governance_alert_created',
        description: `Governance alert created: ${alertData.title}`,
        entity_type: 'governance_alert',
        entity_id: newAlert?.borrower_id,
        source_module: 'esg',
      } as Record<string, unknown>);
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<GovernanceAlert>>({
      success: true,
      data: newAlert,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/governance/alerts:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
