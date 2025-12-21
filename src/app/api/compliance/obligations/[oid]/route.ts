import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateObligationSchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';
import type { ComplianceObligation } from '@/types/database';

// GET /api/compliance/obligations/[oid] - Get obligation detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ oid: string }> }
) {
  try {
    const { oid: obligationId } = await params;
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

    interface ObligationWithFacility extends ComplianceObligation {
      compliance_facilities: {
        organization_id: string;
      };
    }

    // Get obligation with facility check
    const { data: obligation, error: obligationError } = await (supabase
      .from('compliance_obligations') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          organization_id
        )
      `)
      .eq('id', obligationId)
      .single() as { data: ObligationWithFacility | null; error: unknown };

    if (obligationError || !obligation) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Obligation not found',
        },
      }, { status: 404 });
    }

    if (obligation.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      }, { status: 403 });
    }

    // Remove the join data
    const { compliance_facilities, ...obligationData } = obligation;

    return NextResponse.json<ApiResponse<Omit<ObligationWithFacility, 'compliance_facilities'>>>({
      success: true,
      data: obligationData,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/obligations/[oid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/compliance/obligations/[oid] - Update obligation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ oid: string }> }
) {
  try {
    const { oid: obligationId } = await params;
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

    interface ExistingObligation extends ComplianceObligation {
      compliance_facilities: {
        organization_id: string;
        facility_name: string;
      };
    }

    // Verify obligation access
    const { data: existingObligation } = await (supabase
      .from('compliance_obligations') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          organization_id,
          facility_name
        )
      `)
      .eq('id', obligationId)
      .single() as { data: ExistingObligation | null };

    if (!existingObligation || existingObligation.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Obligation not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateObligationSchema.safeParse(body);

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

    // Update obligation
    const { data: obligation, error: updateError } = await (supabase
      .from('compliance_obligations') as ReturnType<typeof supabase.from>)
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', obligationId)
      .select()
      .single() as { data: ComplianceObligation | null; error: unknown };

    if (updateError) {
      console.error('Error updating obligation:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update obligation',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'obligation_updated',
        actor_id: user.id,
        entity_type: 'compliance_obligation',
        entity_id: obligation!.id,
        entity_name: obligation!.name,
        description: `Updated obligation: ${obligation!.name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<ComplianceObligation>>({
      success: true,
      data: obligation!,
    });
  } catch (error) {
    console.error('Error in PUT /api/compliance/obligations/[oid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/compliance/obligations/[oid] - Delete obligation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ oid: string }> }
) {
  try {
    const { oid: obligationId } = await params;
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

    interface DeleteObligation {
      name: string;
      compliance_facilities: {
        organization_id: string;
      };
    }

    // Verify obligation access
    const { data: existingObligation } = await (supabase
      .from('compliance_obligations') as ReturnType<typeof supabase.from>)
      .select(`
        name,
        compliance_facilities!inner (
          organization_id
        )
      `)
      .eq('id', obligationId)
      .single() as { data: DeleteObligation | null };

    if (!existingObligation || existingObligation.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Obligation not found',
        },
      }, { status: 404 });
    }

    // Delete obligation (cascades to events)
    const { error: deleteError } = await supabase
      .from('compliance_obligations')
      .delete()
      .eq('id', obligationId);

    if (deleteError) {
      console.error('Error deleting obligation:', deleteError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete obligation',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'obligation_deleted',
        actor_id: user.id,
        entity_type: 'compliance_obligation',
        entity_id: obligationId,
        entity_name: existingObligation.name,
        description: `Deleted obligation: ${existingObligation.name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error in DELETE /api/compliance/obligations/[oid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
