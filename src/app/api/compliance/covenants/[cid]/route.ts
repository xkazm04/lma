import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCovenantSchema } from '@/lib/validations';
import type { ApiResponse, CovenantWithTests } from '@/types';
import type { ComplianceCovenant } from '@/types/database';

// GET /api/compliance/covenants/[cid] - Get covenant detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid: covenantId } = await params;
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

    interface CovenantWithFacility {
      id: string;
      name: string;
      description?: string;
      facility_id: string;
      covenant_type: string;
      threshold_type: string | null;
      threshold_value: number | null;
      threshold_schedule: unknown;
      test_frequency: string | null;
      testing_frequency?: string;
      testing_basis?: string;
      has_equity_cure?: boolean;
      is_active?: boolean;
      status: string;
      next_test_date: string | null;
      created_at: string;
      updated_at: string;
      compliance_facilities: {
        organization_id: string;
      };
    }

    // Get covenant with facility check
    const { data: covenant, error: covenantError } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          organization_id
        )
      `)
      .eq('id', covenantId)
      .single() as { data: CovenantWithFacility | null; error: unknown };

    if (covenantError || !covenant) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Covenant not found',
        },
      }, { status: 404 });
    }

    if (covenant.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      }, { status: 403 });
    }

    // Get latest test
    const { data: latestTest } = await supabase
      .from('covenant_tests')
      .select('id, test_date, calculated_ratio, test_result, headroom_percentage')
      .eq('covenant_id', covenantId)
      .order('test_date', { ascending: false })
      .limit(1)
      .single();

    // Get test history
    const { data: testHistory } = await supabase
      .from('covenant_tests')
      .select('id, test_date, calculated_ratio, threshold_value, test_result')
      .eq('covenant_id', covenantId)
      .order('test_date', { ascending: false })
      .limit(8);

    // Calculate current threshold
    const thresholdSchedule = covenant.threshold_schedule as Array<{ effective_from: string; threshold_value: number }> | null;
    let currentThreshold: number | undefined;
    if (thresholdSchedule && thresholdSchedule.length > 0) {
      const now = new Date().toISOString();
      const applicableThresholds = thresholdSchedule
        .filter((t) => t.effective_from <= now)
        .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
      currentThreshold = applicableThresholds[0]?.threshold_value;
    }

    const { compliance_facilities, ...covenantData } = covenant;

    const covenantWithTests = {
      ...covenantData,
      threshold_schedule: thresholdSchedule,
      current_threshold: currentThreshold,
      latest_test: latestTest || undefined,
      test_history: testHistory || [],
    } as CovenantWithTests;

    return NextResponse.json<ApiResponse<CovenantWithTests>>({
      success: true,
      data: covenantWithTests,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/covenants/[cid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/compliance/covenants/[cid] - Update covenant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid: covenantId } = await params;
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

    interface ExistingCovenantData {
      id: string;
      name: string;
      compliance_facilities: {
        organization_id: string;
      };
    }

    // Verify covenant access
    const { data: existingCovenant } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          organization_id
        )
      `)
      .eq('id', covenantId)
      .single() as { data: ExistingCovenantData | null };

    if (!existingCovenant || existingCovenant.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Covenant not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateCovenantSchema.safeParse(body);

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

    // Update covenant
    const { data: covenant, error: updateError } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', covenantId)
      .select()
      .single() as { data: ComplianceCovenant | null; error: unknown };

    if (updateError || !covenant) {
      console.error('Error updating covenant:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update covenant',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'covenant_updated',
        actor_id: user.id,
        entity_type: 'compliance_covenant',
        entity_id: covenant.id,
        entity_name: covenant.name,
        description: `Updated covenant: ${covenant.name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<ComplianceCovenant>>({
      success: true,
      data: covenant,
    });
  } catch (error) {
    console.error('Error in PUT /api/compliance/covenants/[cid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/compliance/covenants/[cid] - Delete covenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid: covenantId } = await params;
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

    interface DeleteUserData {
      organization_id: string;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single() as { data: DeleteUserData | null };

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    interface DeleteCovenantData {
      name: string;
      compliance_facilities: {
        organization_id: string;
      };
    }

    // Verify covenant access
    const { data: existingCovenant } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select(`
        name,
        compliance_facilities!inner (
          organization_id
        )
      `)
      .eq('id', covenantId)
      .single() as { data: DeleteCovenantData | null };

    if (!existingCovenant || existingCovenant.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Covenant not found',
        },
      }, { status: 404 });
    }

    // Delete covenant
    const { error: deleteError } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .delete()
      .eq('id', covenantId);

    if (deleteError) {
      console.error('Error deleting covenant:', deleteError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete covenant',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'covenant_deleted',
        actor_id: user.id,
        entity_type: 'compliance_covenant',
        entity_id: covenantId,
        entity_name: existingCovenant.name,
        description: `Deleted covenant: ${existingCovenant.name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error in DELETE /api/compliance/covenants/[cid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
