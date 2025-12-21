import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import {
  acknowledgeGovernanceAlertSchema,
  dismissGovernanceAlertSchema,
} from '@/lib/validations/esg';
import type { GovernanceAlert } from '@/lib/validations/esg';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UserData {
  organization_id: string;
}

interface AlertData {
  id: string;
  title: string;
}

// GET /api/esg/governance/alerts/[id] - Get a single governance alert
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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

    const { data: alert, error } = await supabase
      .from('governance_alerts')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single() as { data: GovernanceAlert | null; error: unknown };

    if (error || !alert) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Governance alert not found',
        },
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<GovernanceAlert>>({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/governance/alerts/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PATCH /api/esg/governance/alerts/[id] - Update a governance alert (acknowledge or dismiss)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
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

    // Check alert exists
    const { data: existingAlert } = await supabase
      .from('governance_alerts')
      .select('id, title')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single() as { data: AlertData | null };

    if (!existingAlert) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Governance alert not found',
        },
      }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    let activityType = 'governance_alert_updated';
    let activityDescription = `Governance alert updated: ${existingAlert.title}`;

    // Handle acknowledge action
    if (body.action === 'acknowledge') {
      const validationResult = acknowledgeGovernanceAlertSchema.safeParse(body);
      if (!validationResult.success) {
        const zodError = validationResult.error;
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid acknowledge data',
            details: {
              fieldErrors: zodError.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
              })),
            },
          },
        }, { status: 400 });
      }

      updateData = {
        ...updateData,
        acknowledged: validationResult.data.acknowledged,
        acknowledged_by: user.id,
        acknowledged_at: new Date().toISOString(),
        acknowledge_notes: validationResult.data.notes,
      };
      activityType = 'governance_alert_acknowledged';
      activityDescription = `Governance alert acknowledged: ${existingAlert.title}`;
    }
    // Handle dismiss action
    else if (body.action === 'dismiss') {
      const validationResult = dismissGovernanceAlertSchema.safeParse(body);
      if (!validationResult.success) {
        const zodError = validationResult.error;
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid dismiss data',
            details: {
              fieldErrors: zodError.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
              })),
            },
          },
        }, { status: 400 });
      }

      updateData = {
        ...updateData,
        dismissed: true,
        dismissed_by: user.id,
        dismissed_at: new Date().toISOString(),
        dismissed_reason: validationResult.data.reason,
      };
      activityType = 'governance_alert_dismissed';
      activityDescription = `Governance alert dismissed: ${existingAlert.title}`;
    } else {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid action. Use "acknowledge" or "dismiss"',
        },
      }, { status: 400 });
    }

    // Update alert
    const { data: updatedAlert, error } = await supabase
      .from('governance_alerts')
      .update(updateData as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single() as { data: GovernanceAlert | null; error: unknown };

    if (error) throw error;

    // Log activity
    try {
      await supabase.from('activities').insert({
        organization_id: userData.organization_id,
        user_id: user.id,
        activity_type: activityType,
        description: activityDescription,
        entity_type: 'governance_alert',
        entity_id: id,
        source_module: 'esg',
      } as Record<string, unknown>);
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<GovernanceAlert | null>>({
      success: true,
      data: updatedAlert,
    });
  } catch (error) {
    console.error('Error in PATCH /api/esg/governance/alerts/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/esg/governance/alerts/[id] - Delete a governance alert
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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

    // Check alert exists
    const { data: existingAlert } = await supabase
      .from('governance_alerts')
      .select('id, title')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single() as { data: AlertData | null };

    if (!existingAlert) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Governance alert not found',
        },
      }, { status: 404 });
    }

    // Delete alert
    const { error } = await supabase
      .from('governance_alerts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log activity
    try {
      await supabase.from('activities').insert({
        organization_id: userData.organization_id,
        user_id: user.id,
        activity_type: 'governance_alert_deleted',
        description: `Governance alert deleted: ${existingAlert.title}`,
        entity_type: 'governance_alert',
        entity_id: id,
        source_module: 'esg',
      } as Record<string, unknown>);
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error in DELETE /api/esg/governance/alerts/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
