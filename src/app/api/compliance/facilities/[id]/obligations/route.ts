import { NextRequest, NextResponse } from 'next/server';
import { createClient, type TypedSupabaseClient } from '@/lib/supabase/server';
import { createObligationSchema } from '@/lib/validations';
import type { ApiResponse, ObligationWithEvents } from '@/types';
import type { ComplianceObligation, ComplianceEvent } from '@/types/database';

// GET /api/compliance/facilities/[id]/obligations - List obligations
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

    // Verify facility belongs to org
    const { data: facility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single() as { data: { id: string } | null };

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    // Get obligations
    let query = (supabase
      .from('compliance_obligations') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: obligations, error: obligationsError } = await query as { data: ComplianceObligation[] | null; error: unknown };

    if (obligationsError) {
      console.error('Error fetching obligations:', obligationsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch obligations',
        },
      }, { status: 500 });
    }

    interface EventData {
      id: string;
      deadline_date: string;
      status: string;
    }

    // Get upcoming events for each obligation
    const obligationsWithEvents = await Promise.all(
      (obligations || []).map(async (obligation: ComplianceObligation) => {
        const { data: events } = await (supabase
          .from('compliance_events') as ReturnType<typeof supabase.from>)
          .select('id, deadline_date, status')
          .eq('obligation_id', obligation.id)
          .in('status', ['upcoming', 'due_soon', 'overdue'])
          .order('deadline_date', { ascending: true })
          .limit(3) as { data: EventData[] | null };

        return {
          ...obligation,
          upcoming_events: events || [],
        };
      })
    ) as ObligationWithEvents[];

    return NextResponse.json<ApiResponse<ObligationWithEvents[]>>({
      success: true,
      data: obligationsWithEvents,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/facilities/[id]/obligations:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/compliance/facilities/[id]/obligations - Create obligation
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

    interface FacilityData {
      id: string;
      facility_name: string;
    }

    // Verify facility belongs to org
    const { data: facility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id, facility_name')
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

    const body = await request.json();
    const parsed = createObligationSchema.safeParse(body);

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

    // Create obligation
    const { data: obligation, error: createError } = await (supabase
      .from('compliance_obligations') as ReturnType<typeof supabase.from>)
      .insert({
        facility_id: facilityId,
        ...parsed.data,
      })
      .select()
      .single() as { data: ComplianceObligation | null; error: unknown };

    if (createError || !obligation) {
      console.error('Error creating obligation:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create obligation',
        },
      }, { status: 500 });
    }

    // Generate compliance events for this obligation
    await generateComplianceEvents(supabase, obligation, facilityId);

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'obligation_created',
        actor_id: user.id,
        entity_type: 'compliance_obligation',
        entity_id: obligation.id,
        entity_name: obligation.name,
        description: `Created obligation: ${obligation.name} for ${facility.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<ComplianceObligation>>({
      success: true,
      data: obligation,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/compliance/facilities/[id]/obligations:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// Helper function to generate compliance events
 
async function generateComplianceEvents(supabase: TypedSupabaseClient, obligation: ComplianceObligation, facilityId: string) {
  const events: Partial<ComplianceEvent>[] = [];
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  // Get facility fiscal year end
  const { data: facility } = await supabase
    .from('compliance_facilities')
    .select('fiscal_year_end')
    .eq('id', facilityId)
    .single();

  const fiscalYearEnd = facility?.fiscal_year_end || '12-31';

  // Generate events based on frequency
  let currentDate = new Date(now);

  while (currentDate < oneYearFromNow) {
    let periodStart: Date;
    let periodEnd: Date;
    let deadlineDate: Date;

    switch (obligation.frequency) {
      case 'annual':
        periodStart = new Date(currentDate.getFullYear(), 0, 1);
        periodEnd = new Date(currentDate.getFullYear(), 11, 31);
        deadlineDate = new Date(periodEnd);
        deadlineDate.setDate(deadlineDate.getDate() + obligation.deadline_days);
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;

      case 'semi_annual':
        if (currentDate.getMonth() < 6) {
          periodStart = new Date(currentDate.getFullYear(), 0, 1);
          periodEnd = new Date(currentDate.getFullYear(), 5, 30);
        } else {
          periodStart = new Date(currentDate.getFullYear(), 6, 1);
          periodEnd = new Date(currentDate.getFullYear(), 11, 31);
        }
        deadlineDate = new Date(periodEnd);
        deadlineDate.setDate(deadlineDate.getDate() + obligation.deadline_days);
        currentDate.setMonth(currentDate.getMonth() + 6);
        break;

      case 'quarterly':
        const quarter = Math.floor(currentDate.getMonth() / 3);
        periodStart = new Date(currentDate.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(currentDate.getFullYear(), quarter * 3 + 3, 0);
        deadlineDate = new Date(periodEnd);
        deadlineDate.setDate(deadlineDate.getDate() + obligation.deadline_days);
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;

      case 'monthly':
        periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        deadlineDate = new Date(periodEnd);
        deadlineDate.setDate(deadlineDate.getDate() + obligation.deadline_days);
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;

      case 'one_time':
        // Single event at deadline
        periodStart = now;
        periodEnd = now;
        deadlineDate = new Date(now);
        deadlineDate.setDate(deadlineDate.getDate() + obligation.deadline_days);
        currentDate = oneYearFromNow; // Exit loop
        break;

      default:
        currentDate = oneYearFromNow; // Exit loop
        continue;
    }

    // Only create future events
    if (deadlineDate > now) {
      const graceDeadline = new Date(deadlineDate);
      graceDeadline.setDate(graceDeadline.getDate() + obligation.grace_period_days);

      // Determine status based on deadline
      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let status: 'upcoming' | 'due_soon' = 'upcoming';
      if (daysUntilDeadline <= 7) {
        status = 'due_soon';
      }

      events.push({
        facility_id: facilityId,
        obligation_id: obligation.id,
        reference_period_start: periodStart.toISOString().split('T')[0],
        reference_period_end: periodEnd.toISOString().split('T')[0],
        deadline_date: deadlineDate.toISOString().split('T')[0],
        grace_deadline_date: graceDeadline.toISOString().split('T')[0],
        status,
      });
    }
  }

  // Insert events
  if (events.length > 0) {
    await supabase.from('compliance_events').insert(events);
  }
}
