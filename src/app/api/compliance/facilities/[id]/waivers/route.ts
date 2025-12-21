import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createWaiverSchema } from '@/lib/validations';
import type { ApiResponse, WaiverWithDetails } from '@/types';
import type { ComplianceWaiver } from '@/types/database';

// GET /api/compliance/facilities/[id]/waivers - List waivers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params;
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

    interface FacilityData {
      id: string;
      facility_name: string;
      borrower_name: string;
    }

    // Verify facility belongs to org
    const { data: facility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id, facility_name, borrower_name')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single() as { data: FacilityData | null };

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    // Get waivers
    const { data: waivers, error: waiversError } = await (supabase
      .from('compliance_waivers') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false }) as { data: ComplianceWaiver[] | null; error: unknown };

    if (waiversError) {
      console.error('Error fetching waivers:', waiversError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch waivers',
        },
      }, { status: 500 });
    }

    // Enrich waivers with related data
    const waiversWithDetails: WaiverWithDetails[] = await Promise.all(
      (waivers || []).map(async (waiver: ComplianceWaiver) => {
        let covenant = undefined;
        let event = undefined;

        if (waiver.related_covenant_id) {
          const { data: cov } = await (supabase
            .from('compliance_covenants') as ReturnType<typeof supabase.from>)
            .select('name, covenant_type')
            .eq('id', waiver.related_covenant_id)
            .single() as { data: { name: string; covenant_type: string } | null };
          covenant = cov || undefined;
        }

        if (waiver.related_event_id) {
          interface EventWithObligation {
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
            .single() as { data: EventWithObligation | null };
          if (evt) {
            event = {
              obligation_name: evt.compliance_obligations.name,
              deadline_date: evt.deadline_date,
            };
          }
        }

        return {
          ...waiver,
          facility: {
            facility_name: facility.facility_name,
            borrower_name: facility.borrower_name,
          },
          covenant,
          event,
        };
      })
    );

    return NextResponse.json<ApiResponse<WaiverWithDetails[]>>({
      success: true,
      data: waiversWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/facilities/[id]/waivers:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/compliance/facilities/[id]/waivers - Create waiver (via facility route)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params;
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

    interface PostUserData {
      organization_id: string;
    }

    // Get user's organization
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

    interface PostFacilityData {
      id: string;
      facility_name: string;
    }

    // Verify facility belongs to org
    const { data: facility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id, facility_name')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single() as { data: PostFacilityData | null };

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createWaiverSchema.safeParse(body);

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

    // Create waiver
    const { data: waiver, error: createError } = await (supabase
      .from('compliance_waivers') as ReturnType<typeof supabase.from>)
      .insert({
        facility_id: facilityId,
        ...parsed.data,
      })
      .select()
      .single() as { data: ComplianceWaiver | null; error: unknown };

    if (createError || !waiver) {
      console.error('Error creating waiver:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create waiver',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'waiver_requested',
        actor_id: user.id,
        entity_type: 'compliance_waiver',
        entity_id: waiver.id,
        entity_name: `${waiver.waiver_type} waiver`,
        description: `Created ${waiver.waiver_type} waiver request for ${facility.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<ComplianceWaiver>>({
      success: true,
      data: waiver,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/compliance/facilities/[id]/waivers:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
