import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import type { BreachPrediction, CovenantTestResult } from '@/app/features/compliance/lib/types';
import { predictCovenantBreach } from '@/lib/llm/compliance';

interface TestData {
  test_date: string;
  calculated_ratio: number;
  test_result: 'pass' | 'fail';
  headroom_percentage: number;
  headroom_absolute: number;
}

// POST /api/compliance/covenants/[cid]/predict - Generate breach prediction
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

    const orgId = userData.organization_id;

    interface CovenantWithFacility {
      id: string;
      name: string;
      covenant_type: string;
      threshold_type: string;
      current_threshold: number;
      threshold_value?: number;
      threshold_schedule?: Array<{ effective_from: string; threshold_value: number }>;
      test_frequency: string;
      compliance_facilities: {
        id: string;
        facility_name: string;
        borrower_name: string;
        organization_id: string;
      };
    }

    // Get covenant with facility info
    const { data: covenant, error: covenantError } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select(`
        *,
        compliance_facilities!inner (
          id,
          facility_name,
          borrower_name,
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

    if (covenant.compliance_facilities.organization_id !== orgId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      }, { status: 403 });
    }

    // Get test history (last 8 quarters)
    const { data: testHistory, error: testError } = await supabase
      .from('covenant_tests')
      .select('test_date, calculated_ratio, test_result, headroom_percentage, headroom_absolute')
      .eq('covenant_id', covenantId)
      .order('test_date', { ascending: true })
      .limit(12);

    if (testError) {
      console.error('Error fetching test history:', testError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch test history',
        },
      }, { status: 500 });
    }

    // Convert test history to expected format
    const formattedHistory: CovenantTestResult[] = (testHistory || []).map((t: TestData) => ({
      test_date: t.test_date,
      calculated_ratio: t.calculated_ratio,
      test_result: t.test_result as 'pass' | 'fail',
      headroom_percentage: t.headroom_percentage || 0,
      headroom_absolute: t.headroom_absolute || 0,
    }));

    // Calculate current threshold from schedule
    const thresholdSchedule = covenant.threshold_schedule as Array<{ effective_from: string; threshold_value: number }> | null;
    let currentThreshold = covenant.threshold_value || 0;
    if (thresholdSchedule && thresholdSchedule.length > 0) {
      const now = new Date().toISOString();
      const applicableThresholds = thresholdSchedule
        .filter((t) => t.effective_from <= now)
        .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
      currentThreshold = applicableThresholds[0]?.threshold_value || currentThreshold;
    }

    // Parse optional borrower financial context from request body
    let borrowerFinancials;
    try {
      const body = await request.json();
      borrowerFinancials = body.borrower_financials;
    } catch {
      // No body provided, continue without borrower financials
    }

    // Generate prediction using LLM
    const prediction = await predictCovenantBreach({
      covenant_id: covenantId,
      covenant_name: covenant.name,
      covenant_type: covenant.covenant_type,
      facility_name: covenant.compliance_facilities.facility_name,
      borrower_name: covenant.compliance_facilities.borrower_name,
      threshold_type: (covenant.threshold_type || 'maximum') as 'maximum' | 'minimum',
      current_threshold: currentThreshold,
      test_frequency: (covenant.test_frequency || 'quarterly') as 'monthly' | 'quarterly' | 'annually',
      test_history: formattedHistory,
      borrower_financials: borrowerFinancials,
    });

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'prediction_generated',
        actor_id: user.id,
        entity_type: 'compliance_covenant',
        entity_id: covenantId,
        entity_name: covenant.name,
        description: `Generated breach prediction for ${covenant.name}: ${prediction.overall_risk_level} risk`,
        metadata: {
          breach_probability_2q: prediction.breach_probability_2q,
          breach_probability_3q: prediction.breach_probability_3q,
          overall_risk_level: prediction.overall_risk_level,
          confidence_score: prediction.confidence_score,
        },
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<BreachPrediction>>({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Error in POST /api/compliance/covenants/[cid]/predict:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while generating prediction',
      },
    }, { status: 500 });
  }
}
