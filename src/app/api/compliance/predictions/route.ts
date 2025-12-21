import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import type { BreachPrediction, CovenantTestResult } from '@/app/features/compliance/lib/types';
import { predictCovenantBreach } from '@/lib/llm/compliance';

interface CovenantData {
  id: string;
  name: string;
  covenant_type: string;
  threshold_type: 'maximum' | 'minimum';
  threshold_value: number | null;
  threshold_schedule: Array<{ effective_from: string; threshold_value: number }> | null;
  test_frequency: 'monthly' | 'quarterly' | 'annually';
  compliance_facilities: {
    id: string;
    facility_name: string;
    borrower_name: string;
    organization_id: string;
  };
}

interface TestData {
  covenant_id: string;
  test_date: string;
  calculated_ratio: number;
  test_result: 'pass' | 'fail';
  headroom_percentage: number;
  headroom_absolute: number;
}

// POST /api/compliance/predictions - Generate batch predictions for multiple covenants
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body for optional covenant IDs filter
    let covenantIds: string[] | undefined;
    let facilityId: string | undefined;
    try {
      const body = await request.json();
      covenantIds = body.covenant_ids;
      facilityId = body.facility_id;
    } catch {
      // No filter provided, get all covenants
    }

    // Build query for covenants
    let query = supabase
      .from('compliance_covenants')
      .select(`
        id,
        name,
        covenant_type,
        threshold_type,
        threshold_value,
        threshold_schedule,
        test_frequency,
        compliance_facilities!inner (
          id,
          facility_name,
          borrower_name,
          organization_id
        )
      `)
      .eq('compliance_facilities.organization_id', userData.organization_id)
      .eq('is_active', true);

    if (covenantIds && covenantIds.length > 0) {
      query = query.in('id', covenantIds);
    }

    if (facilityId) {
      query = query.eq('facility_id', facilityId);
    }

    const { data: covenants, error: covenantsError } = await query;

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

    if (!covenants || covenants.length === 0) {
      return NextResponse.json<ApiResponse<Record<string, BreachPrediction>>>({
        success: true,
        data: {},
      });
    }

    // Get test history for all covenants
    const covenantIdList = covenants.map((c: CovenantData) => c.id);
    const { data: allTests, error: testsError } = await supabase
      .from('covenant_tests')
      .select('covenant_id, test_date, calculated_ratio, test_result, headroom_percentage, headroom_absolute')
      .in('covenant_id', covenantIdList)
      .order('test_date', { ascending: true });

    if (testsError) {
      console.error('Error fetching test history:', testsError);
    }

    // Group tests by covenant
    const testsByCovenantId = new Map<string, CovenantTestResult[]>();
    (allTests || []).forEach((test: TestData) => {
      const existing = testsByCovenantId.get(test.covenant_id) || [];
      existing.push({
        test_date: test.test_date,
        calculated_ratio: test.calculated_ratio,
        test_result: test.test_result as 'pass' | 'fail',
        headroom_percentage: test.headroom_percentage || 0,
        headroom_absolute: test.headroom_absolute || 0,
      });
      testsByCovenantId.set(test.covenant_id, existing);
    });

    // Generate predictions for each covenant (in parallel with limit)
    const predictions: Record<string, BreachPrediction> = {};
    const concurrencyLimit = 3;

    for (let i = 0; i < covenants.length; i += concurrencyLimit) {
      const batch = covenants.slice(i, i + concurrencyLimit);
      const results = await Promise.all(
        batch.map(async (covenant: CovenantData) => {
          // Calculate current threshold
          let currentThreshold = covenant.threshold_value || 0;
          if (covenant.threshold_schedule && covenant.threshold_schedule.length > 0) {
            const now = new Date().toISOString();
            const applicableThresholds = covenant.threshold_schedule
              .filter((t) => t.effective_from <= now)
              .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
            currentThreshold = applicableThresholds[0]?.threshold_value || currentThreshold;
          }

          const testHistory = testsByCovenantId.get(covenant.id) || [];

          const prediction = await predictCovenantBreach({
            covenant_id: covenant.id,
            covenant_name: covenant.name,
            covenant_type: covenant.covenant_type,
            facility_name: covenant.compliance_facilities.facility_name,
            borrower_name: covenant.compliance_facilities.borrower_name,
            threshold_type: covenant.threshold_type,
            current_threshold: currentThreshold,
            test_frequency: covenant.test_frequency,
            test_history: testHistory,
          });

          return { covenantId: covenant.id, prediction };
        })
      );

      results.forEach(({ covenantId, prediction }) => {
        predictions[covenantId] = prediction;
      });
    }

    // Log batch prediction activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'batch_predictions_generated',
        actor_id: user.id,
        entity_type: 'compliance_covenants',
        entity_id: null,
        entity_name: 'Batch Prediction',
        description: `Generated breach predictions for ${covenants.length} covenants`,
        metadata: {
          covenant_count: covenants.length,
          high_risk_count: Object.values(predictions).filter((p) => p.overall_risk_level === 'high' || p.overall_risk_level === 'critical').length,
        },
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<Record<string, BreachPrediction>>>({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('Error in POST /api/compliance/predictions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while generating predictions',
      },
    }, { status: 500 });
  }
}
