import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateWaiverSchema } from '@/lib/validations';
import type { ApiResponse, WaiverWithDetails } from '@/types';
import type { ComplianceWaiver } from '@/types/database';

// GET /api/compliance/waivers/[wid] - Get waiver details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wid: string }> }
) {
  try {
    const { wid: waiverId } = await params;
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

    interface WaiverWithFacility extends ComplianceWaiver {
      compliance_facilities: {
        organization_id: string;
        facility_name: string;
        borrower_name: string;
      };
    }

    // Get waiver with facility verification
    const { data: waiver, error: waiverError } = await (supabase
      .from('compliance_waivers') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          organization_id,
          facility_name,
          borrower_name
        )
      `)
      .eq('id', waiverId)
      .single() as { data: WaiverWithFacility | null; error: unknown };

    if (waiverError || !waiver) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Waiver not found',
        },
      }, { status: 404 });
    }

    if (waiver.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Waiver not found',
        },
      }, { status: 404 });
    }

    // Get related data
    let covenant = undefined;
    let event = undefined;

    if (waiver.related_covenant_id) {
      interface CovenantData {
        name: string;
        covenant_type: string;
      }
      const { data: cov } = await (supabase
        .from('compliance_covenants') as ReturnType<typeof supabase.from>)
        .select('name, covenant_type')
        .eq('id', waiver.related_covenant_id)
        .single() as { data: CovenantData | null };
      covenant = cov ?? undefined;
    }

    if (waiver.related_event_id) {
      interface EventData {
        deadline_date: string;
        compliance_obligations: {
          name: string;
        };
      }
      const { data: evt } = await (supabase
        .from('compliance_events') as ReturnType<typeof supabase.from>)
        .select(`
          deadline_date,
          compliance_obligations!inner (
            name
          )
        `)
        .eq('id', waiver.related_event_id)
        .single() as { data: EventData | null };
      if (evt) {
        event = {
          obligation_name: evt.compliance_obligations.name,
          deadline_date: evt.deadline_date,
        };
      }
    }

    const waiverWithDetails: WaiverWithDetails = {
      ...waiver,
      facility: {
        facility_name: waiver.compliance_facilities.facility_name,
        borrower_name: waiver.compliance_facilities.borrower_name,
      },
      covenant,
      event,
    };

    return NextResponse.json<ApiResponse<WaiverWithDetails>>({
      success: true,
      data: waiverWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/waivers/[wid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/compliance/waivers/[wid] - Update waiver
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ wid: string }> }
) {
  try {
    const { wid: waiverId } = await params;
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

    interface ExistingWaiverWithFacility extends ComplianceWaiver {
      compliance_facilities: {
        organization_id: string;
        facility_name: string;
      };
    }

    // Get waiver with facility verification
    const { data: existingWaiver } = await (supabase
      .from('compliance_waivers') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          organization_id,
          facility_name
        )
      `)
      .eq('id', waiverId)
      .single() as { data: ExistingWaiverWithFacility | null };

    if (!existingWaiver || existingWaiver.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Waiver not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateWaiverSchema.safeParse(body);

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

    // Track status changes
    const previousStatus = existingWaiver.status;
    const newStatus = parsed.data.status;

    // Update waiver
    const { data: waiver, error: updateError } = await (supabase
      .from('compliance_waivers') as ReturnType<typeof supabase.from>)
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', waiverId)
      .select()
      .single() as { data: ComplianceWaiver | null; error: unknown };

    if (updateError) {
      console.error('Error updating waiver:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update waiver',
        },
      }, { status: 500 });
    }

    // Log activity based on status change
    let activityType = 'waiver_updated';
    let description = `Updated waiver for ${existingWaiver.compliance_facilities.facility_name}`;

    if (newStatus && newStatus !== previousStatus) {
      if (newStatus === 'approved') {
        activityType = 'waiver_granted';
        description = `Waiver approved for ${existingWaiver.compliance_facilities.facility_name}`;
      } else if (newStatus === 'rejected') {
        activityType = 'waiver_denied';
        description = `Waiver rejected for ${existingWaiver.compliance_facilities.facility_name}`;
      } else if (newStatus === 'expired') {
        activityType = 'waiver_expired';
        description = `Waiver expired for ${existingWaiver.compliance_facilities.facility_name}`;
      }
    }

    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: activityType,
        actor_id: user.id,
        entity_type: 'compliance_waiver',
        entity_id: waiver!.id,
        entity_name: `${waiver!.waiver_type} waiver`,
        description,
        details: {
          previous_status: previousStatus,
          new_status: newStatus,
        },
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<ComplianceWaiver>>({
      success: true,
      data: waiver!,
    });
  } catch (error) {
    console.error('Error in PUT /api/compliance/waivers/[wid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/compliance/waivers/[wid] - Delete waiver
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wid: string }> }
) {
  try {
    const { wid: waiverId } = await params;
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

    interface WaiverDeleteData {
      id: string;
      waiver_type: string;
      compliance_facilities: {
        organization_id: string;
        facility_name: string;
      };
    }

    // Verify waiver access
    const { data: waiver } = await (supabase
      .from('compliance_waivers') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        waiver_type,
        compliance_facilities!inner (
          organization_id,
          facility_name
        )
      `)
      .eq('id', waiverId)
      .single() as { data: WaiverDeleteData | null };

    if (!waiver || waiver.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Waiver not found',
        },
      }, { status: 404 });
    }

    interface WaiverStatusData {
      status: string;
    }

    // Only allow deletion of pending waivers
    const { data: waiverData } = await (supabase
      .from('compliance_waivers') as ReturnType<typeof supabase.from>)
      .select('status')
      .eq('id', waiverId)
      .single() as { data: WaiverStatusData | null };

    if (waiverData?.status !== 'requested') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Only pending waivers can be deleted',
        },
      }, { status: 400 });
    }

    // Delete waiver
    const { error: deleteError } = await supabase
      .from('compliance_waivers')
      .delete()
      .eq('id', waiverId);

    if (deleteError) {
      console.error('Error deleting waiver:', deleteError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete waiver',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'waiver_deleted',
        actor_id: user.id,
        entity_type: 'compliance_waiver',
        entity_id: waiverId,
        entity_name: `${waiver.waiver_type} waiver`,
        description: `Deleted waiver request for ${waiver.compliance_facilities.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error in DELETE /api/compliance/waivers/[wid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
