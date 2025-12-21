import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import {
  governanceMetricsSchema,
  createGovernanceMetricsSchema,
} from '@/lib/validations/esg';
import type { GovernanceMetrics } from '@/lib/validations/esg';
import {
  assessGovernance,
  analyzeRedFlags,
  type GovernanceAssessmentResult,
  type RedFlagAnalysisResult,
} from '@/lib/llm/governance';

export interface GovernanceDashboardData {
  metrics: GovernanceMetrics | null;
  assessment: GovernanceAssessmentResult | null;
  red_flags: RedFlagAnalysisResult | null;
  alerts_count: number;
  recent_events: Array<{
    id: string;
    event_type: string;
    title: string;
    event_date: string;
    severity: string;
  }>;
  resolutions_summary: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    avg_support_percentage: number;
  };
}

// GET /api/esg/governance - Get governance dashboard data for a borrower
// Query params:
//   - borrower_id (required): Borrower ID to get governance data for
//   - include_assessment (optional): Whether to include AI assessment
//   - include_red_flags (optional): Whether to include red flag analysis
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const borrowerId = searchParams.get('borrower_id');
    const includeAssessment = searchParams.get('include_assessment') === 'true';
    const includeRedFlags = searchParams.get('include_red_flags') === 'true';

    if (!borrowerId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'borrower_id is required',
        },
      }, { status: 400 });
    }

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

    // Get governance metrics
    const { data: metricsData } = await supabase
      .from('governance_metrics')
      .select('*')
      .eq('borrower_id', borrowerId)
      .eq('organization_id', orgId)
      .order('as_of_date', { ascending: false })
      .limit(1)
      .single();

    // Get recent governance events
    const { data: eventsData } = await supabase
      .from('governance_events')
      .select('id, event_type, title, event_date, severity')
      .eq('borrower_id', borrowerId)
      .eq('organization_id', orgId)
      .order('event_date', { ascending: false })
      .limit(10);

    // Get shareholder resolutions summary
    const { data: resolutionsData } = await supabase
      .from('shareholder_resolutions')
      .select('vote_result, support_percentage')
      .eq('borrower_id', borrowerId)
      .eq('organization_id', orgId);

    const resolutions = resolutionsData || [];
    const resolutionsSummary = {
      total: resolutions.length,
      passed: resolutions.filter((r: { vote_result: string }) => r.vote_result === 'passed').length,
      failed: resolutions.filter((r: { vote_result: string }) => r.vote_result === 'failed').length,
      pending: resolutions.filter((r: { vote_result: string }) => r.vote_result === 'pending').length,
      avg_support_percentage: resolutions.length > 0
        ? resolutions.reduce((sum: number, r: { support_percentage: number | null }) => sum + (r.support_percentage || 0), 0) / resolutions.length
        : 0,
    };

    // Get unacknowledged alerts count
    const { count: alertsCount } = await supabase
      .from('governance_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('borrower_id', borrowerId)
      .eq('organization_id', orgId)
      .eq('acknowledged', false)
      .eq('dismissed', false);

    // Get borrower info for AI analysis
    const { data: borrowerInfo } = await supabase
      .from('esg_facilities')
      .select('borrower_name, borrower_industry')
      .eq('organization_id', orgId)
      .limit(1)
      .single();

    const dashboardData: GovernanceDashboardData = {
      metrics: metricsData as GovernanceMetrics | null,
      assessment: null,
      red_flags: null,
      alerts_count: alertsCount || 0,
      recent_events: eventsData || [],
      resolutions_summary: resolutionsSummary,
    };

    // Generate AI assessment if requested
    if (includeAssessment && metricsData && borrowerInfo) {
      try {
        dashboardData.assessment = await assessGovernance({
          borrower_name: borrowerInfo.borrower_name || 'Unknown',
          borrower_industry: borrowerInfo.borrower_industry || 'Unknown',
          governance_metrics: metricsData as GovernanceMetrics,
          events: eventsData?.map((e) => ({
            borrower_id: borrowerId,
            event_type: e.event_type as GovernanceMetrics['exec_comp_esg_metrics'] extends (infer T)[] ? T : never,
            event_date: e.event_date,
            title: e.title,
            severity: e.severity as 'info' | 'warning' | 'critical',
          })),
        });
      } catch (error) {
        console.error('Error generating governance assessment:', error);
      }
    }

    // Generate red flag analysis if requested
    if (includeRedFlags && metricsData && borrowerInfo) {
      try {
        dashboardData.red_flags = await analyzeRedFlags({
          borrower_name: borrowerInfo.borrower_name || 'Unknown',
          governance_metrics: metricsData as GovernanceMetrics,
          recent_events: eventsData?.map((e) => ({
            borrower_id: borrowerId,
            event_type: e.event_type as GovernanceMetrics['exec_comp_esg_metrics'] extends (infer T)[] ? T : never,
            event_date: e.event_date,
            title: e.title,
            severity: e.severity as 'info' | 'warning' | 'critical',
          })) || [],
        });
      } catch (error) {
        console.error('Error generating red flag analysis:', error);
      }
    }

    return NextResponse.json<ApiResponse<GovernanceDashboardData>>({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/governance:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/governance - Create or update governance metrics
export async function POST(request: NextRequest) {
  try {
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

    interface PostUserData {
      organization_id: string;
    }

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

    const orgId = userData.organization_id;

    // Validate request body
    const validationResult = createGovernanceMetricsSchema.safeParse(body);
    if (!validationResult.success) {
      const zodError = validationResult.error;
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid governance metrics data',
          details: {
            fieldErrors: zodError.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
      }, { status: 400 });
    }

    const metricsData = validationResult.data;

    // Check if metrics already exist for this date
    const { data: existingMetrics } = await supabase
      .from('governance_metrics')
      .select('id')
      .eq('borrower_id', metricsData.borrower_id)
      .eq('organization_id', orgId)
      .eq('as_of_date', metricsData.as_of_date)
      .single() as { data: { id: string } | null };

    let result: GovernanceMetrics;
    if (existingMetrics) {
      // Update existing
      const { data, error } = await supabase
        .from('governance_metrics')
        .update({
          ...metricsData,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('id', existingMetrics.id)
        .select()
        .single() as { data: GovernanceMetrics | null; error: unknown };

      if (error) throw error;
      result = data!;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('governance_metrics')
        .insert({
          ...metricsData,
          organization_id: orgId,
          created_by: user.id,
        } as Record<string, unknown>)
        .select()
        .single() as { data: GovernanceMetrics | null; error: unknown };

      if (error) throw error;
      result = data!;
    }

    // Log activity
    try {
      await supabase.from('activities').insert({
        organization_id: orgId,
        user_id: user.id,
        activity_type: existingMetrics ? 'governance_metrics_updated' : 'governance_metrics_created',
        description: `Governance metrics ${existingMetrics ? 'updated' : 'recorded'} for ${metricsData.as_of_date}`,
        entity_type: 'governance_metrics',
        entity_id: result.borrower_id,
        source_module: 'esg',
      } as Record<string, unknown>);
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<GovernanceMetrics>>({
      success: true,
      data: result,
    }, { status: existingMetrics ? 200 : 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/governance:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
