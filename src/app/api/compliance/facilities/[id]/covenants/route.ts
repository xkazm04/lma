import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCovenantSchema } from '@/lib/validations';
import type { ApiResponse, CovenantWithTests } from '@/types';
import type { ComplianceCovenant, CovenantTest } from '@/types/database';

// GET /api/compliance/facilities/[id]/covenants - List covenants
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

    // Get covenants
    let query = (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: covenants, error: covenantsError } = await query as { data: ComplianceCovenant[] | null; error: unknown };

    if (covenantsError) {
      console.error('Error fetching covenants:', covenantsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch covenants',
        },
      }, { status: 500 });
    }

    interface LatestTestData {
      id: string;
      test_date: string;
      calculated_ratio: number;
      test_result: string;
      headroom_percentage: number;
    }

    interface TestHistoryItem {
      id: string;
      test_date: string;
      calculated_ratio: number;
      threshold_value: number;
      test_result: string;
    }

    // Get latest test and history for each covenant
    const covenantsWithTests = await Promise.all(
      (covenants || []).map(async (covenant: ComplianceCovenant) => {
        // Get latest test
        const { data: latestTest } = await (supabase
          .from('covenant_tests') as ReturnType<typeof supabase.from>)
          .select('id, test_date, calculated_ratio, test_result, headroom_percentage')
          .eq('covenant_id', covenant.id)
          .order('test_date', { ascending: false })
          .limit(1)
          .single() as { data: LatestTestData | null };

        // Get test history (last 4 tests)
        const { data: testHistory } = await (supabase
          .from('covenant_tests') as ReturnType<typeof supabase.from>)
          .select('id, test_date, calculated_ratio, threshold_value, test_result')
          .eq('covenant_id', covenant.id)
          .order('test_date', { ascending: false })
          .limit(4) as { data: TestHistoryItem[] | null };

        // Calculate current threshold from schedule
        const thresholdSchedule = covenant.threshold_schedule as Array<{ effective_from: string; threshold_value: number }> | null;
        let currentThreshold: number | undefined;
        if (thresholdSchedule && thresholdSchedule.length > 0) {
          const now = new Date().toISOString();
          const applicableThresholds = thresholdSchedule
            .filter((t) => t.effective_from <= now)
            .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
          currentThreshold = applicableThresholds[0]?.threshold_value;
        }

        return {
          ...covenant,
          threshold_schedule: thresholdSchedule,
          current_threshold: currentThreshold,
          latest_test: latestTest || undefined,
          test_history: testHistory || [],
        };
      })
    ) as CovenantWithTests[];

    return NextResponse.json<ApiResponse<CovenantWithTests[]>>({
      success: true,
      data: covenantsWithTests,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/facilities/[id]/covenants:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/compliance/facilities/[id]/covenants - Create covenant
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
    const parsed = createCovenantSchema.safeParse(body);

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

    // Create covenant
    const { data: covenant, error: createError } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .insert({
        facility_id: facilityId,
        ...parsed.data,
      })
      .select()
      .single() as { data: ComplianceCovenant | null; error: unknown };

    if (createError || !covenant) {
      console.error('Error creating covenant:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create covenant',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'covenant_created',
        actor_id: user.id,
        entity_type: 'compliance_covenant',
        entity_id: covenant.id,
        entity_name: covenant.name,
        description: `Created covenant: ${covenant.name} for ${facility.facility_name}`,
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<ComplianceCovenant>>({
      success: true,
      data: covenant,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/compliance/facilities/[id]/covenants:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
