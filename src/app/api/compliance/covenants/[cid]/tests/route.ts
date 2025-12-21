import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitCovenantTestSchema } from '@/lib/validations';
import type { ApiResponse, CovenantTestWithDetails } from '@/types';
import type { CovenantTest } from '@/types/database';

// GET /api/compliance/covenants/[cid]/tests - Get test history
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

    interface CovenantData {
      id: string;
      name: string;
      covenant_type: string;
      threshold_type: string;
      compliance_facilities: {
        organization_id: string;
      };
    }

    // Verify covenant access
    const { data: covenant } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        name,
        covenant_type,
        threshold_type,
        compliance_facilities!inner (
          organization_id
        )
      `)
      .eq('id', covenantId)
      .single() as { data: CovenantData | null };

    if (!covenant || covenant.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Covenant not found',
        },
      }, { status: 404 });
    }

    // Get tests
    const { data: tests, error: testsError } = await (supabase
      .from('covenant_tests') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('covenant_id', covenantId)
      .order('test_date', { ascending: false }) as { data: CovenantTest[] | null; error: unknown };

    if (testsError) {
      console.error('Error fetching tests:', testsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch tests',
        },
      }, { status: 500 });
    }

    const testsWithDetails = (tests || []).map((test: CovenantTest) => ({
      ...test,
      covenant: {
        name: covenant.name,
        covenant_type: covenant.covenant_type,
        threshold_type: covenant.threshold_type,
      },
    })) as CovenantTestWithDetails[];

    return NextResponse.json<ApiResponse<CovenantTestWithDetails[]>>({
      success: true,
      data: testsWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/covenants/[cid]/tests:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/compliance/covenants/[cid]/tests - Submit test result
export async function POST(
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

    interface PostCovenantData {
      id: string;
      facility_id: string;
      name: string;
      covenant_type: string;
      threshold_type: string;
      compliance_facilities: {
        organization_id: string;
        facility_name: string;
      };
    }

    // Verify covenant access
    const { data: covenant } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        facility_id,
        name,
        covenant_type,
        threshold_type,
        compliance_facilities!inner (
          organization_id,
          facility_name
        )
      `)
      .eq('id', covenantId)
      .single() as { data: PostCovenantData | null };

    if (!covenant || covenant.compliance_facilities.organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Covenant not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = submitCovenantTestSchema.safeParse(body);

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

    // Calculate test result
    const { numerator_value, denominator_value, threshold_value } = parsed.data;
    let calculatedRatio = parsed.data.calculated_ratio;

    if (!calculatedRatio && numerator_value !== undefined && denominator_value !== undefined && denominator_value !== 0) {
      calculatedRatio = numerator_value / denominator_value;
    }

    // Determine pass/fail
    let testResult: 'pass' | 'fail' = 'pass';
    let headroomAbsolute: number | null = null;
    let headroomPercentage: number | null = null;
    let breachAmount: number | null = null;

    if (calculatedRatio !== undefined) {
      if (covenant.threshold_type === 'maximum') {
        if (calculatedRatio > threshold_value) {
          testResult = 'fail';
          breachAmount = calculatedRatio - threshold_value;
        } else {
          headroomAbsolute = threshold_value - calculatedRatio;
          headroomPercentage = (headroomAbsolute / threshold_value) * 100;
        }
      } else {
        // minimum
        if (calculatedRatio < threshold_value) {
          testResult = 'fail';
          breachAmount = threshold_value - calculatedRatio;
        } else {
          headroomAbsolute = calculatedRatio - threshold_value;
          headroomPercentage = (headroomAbsolute / threshold_value) * 100;
        }
      }
    }

    // Create test record
    const { data: test, error: createError } = await (supabase
      .from('covenant_tests') as ReturnType<typeof supabase.from>)
      .insert({
        covenant_id: covenantId,
        facility_id: covenant.facility_id,
        test_date: parsed.data.test_date,
        period_start: parsed.data.period_start,
        period_end: parsed.data.period_end,
        numerator_value,
        denominator_value,
        calculated_ratio: calculatedRatio,
        threshold_value,
        test_result: testResult,
        headroom_absolute: headroomAbsolute,
        headroom_percentage: headroomPercentage,
        breach_amount: breachAmount,
        calculation_details: parsed.data.calculation_details,
        compliance_event_id: parsed.data.compliance_event_id,
        submitted_at: new Date().toISOString(),
        submitted_by: user.id,
      })
      .select()
      .single() as { data: CovenantTest | null; error: unknown };

    if (createError || !test) {
      console.error('Error creating test:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create test',
        },
      }, { status: 500 });
    }

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: testResult === 'pass' ? 'covenant_test_passed' : 'covenant_test_failed',
        actor_id: user.id,
        entity_type: 'covenant_test',
        entity_id: test.id,
        entity_name: covenant.name,
        description: `Covenant test ${testResult}: ${covenant.name} for ${covenant.compliance_facilities.facility_name}`,
        details: {
          calculated_ratio: calculatedRatio,
          threshold_value,
          headroom_percentage: headroomPercentage,
        },
      });
    } catch {
      // Ignore activity logging errors
    }

    // If failed, update facility status
    if (testResult === 'fail') {
      await (supabase
        .from('compliance_facilities') as ReturnType<typeof supabase.from>)
        .update({ status: 'waiver_period' })
        .eq('id', covenant.facility_id);
    }

    return NextResponse.json<ApiResponse<CovenantTest>>({
      success: true,
      data: test,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/compliance/covenants/[cid]/tests:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
