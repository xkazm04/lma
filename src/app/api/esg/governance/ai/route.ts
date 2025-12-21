import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import { governanceAIQuerySchema } from '@/lib/validations/esg';
import type { GovernanceMetrics, ShareholderResolution, GovernanceEvent } from '@/lib/validations/esg';
import {
  assessGovernance,
  analyzeCovenantCorrelation,
  analyzeRedFlags,
  analyzeCompensation,
  benchmarkBoardDiversity,
  analyzeProxyVoteImpact,
  type GovernanceAssessmentResult,
  type CovenantCorrelationResult,
  type RedFlagAnalysisResult,
  type CompensationAnalysisResult,
  type BoardDiversityBenchmarkResult,
  type ProxyVoteImpactResult,
} from '@/lib/llm/governance';

type GovernanceAIResult =
  | GovernanceAssessmentResult
  | CovenantCorrelationResult
  | RedFlagAnalysisResult
  | CompensationAnalysisResult
  | BoardDiversityBenchmarkResult
  | ProxyVoteImpactResult;

// POST /api/esg/governance/ai - Run governance AI analysis
// Request body:
//   - query_type: Type of analysis to run
//   - borrower_id: Borrower to analyze
//   - facility_id: Optional facility context
//   - query: Additional query context
//   - context: Additional context options
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

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    // Validate request body
    const validationResult = governanceAIQuerySchema.safeParse(body);
    if (!validationResult.success) {
      const zodError = validationResult.error;
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid governance AI query',
          details: {
            fieldErrors: zodError.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
      }, { status: 400 });
    }

    const { query_type, borrower_id, facility_id } = validationResult.data;

    const orgId = userData.organization_id as string;

    // Get borrower info
    let borrowerName = 'Unknown';
    let borrowerIndustry = 'Unknown';

    if (facility_id) {
      const { data: facilityData } = await supabase
        .from('esg_facilities')
        .select('borrower_name, borrower_industry')
        .eq('id', facility_id)
        .eq('organization_id', orgId)
        .single() as { data: { borrower_name: string | null; borrower_industry: string | null } | null };

      if (facilityData) {
        borrowerName = facilityData.borrower_name || 'Unknown';
        borrowerIndustry = facilityData.borrower_industry || 'Unknown';
      }
    } else if (borrower_id) {
      // Try to get borrower info from any facility
      const { data: facilityData } = await supabase
        .from('esg_facilities')
        .select('borrower_name, borrower_industry')
        .eq('organization_id', orgId)
        .limit(1)
        .single() as { data: { borrower_name: string | null; borrower_industry: string | null } | null };

      if (facilityData) {
        borrowerName = facilityData.borrower_name || 'Unknown';
        borrowerIndustry = facilityData.borrower_industry || 'Unknown';
      }
    }

    // Get governance metrics - using mock data for now as these tables may not exist yet
    const metricsData: GovernanceMetrics | null = null;
    const eventsData: GovernanceEvent[] = [];
    const resolutionsData: ShareholderResolution[] = [];

    // Get covenants if needed
    const { data: facilitiesData } = await supabase
      .from('esg_facilities')
      .select('id')
      .eq('organization_id', orgId) as { data: Array<{ id: string }> | null };

    const facilityIds = (facilitiesData || []).map((f) => f.id);

    const { data: covenantsData } = await supabase
      .from('compliance_covenants')
      .select('id, covenant_name, covenant_type')
      .in('facility_id', facilityIds.length > 0 ? facilityIds : ['00000000-0000-0000-0000-000000000000']) as {
        data: Array<{ id: string; covenant_name: string; covenant_type: string }> | null
      };

    let result: GovernanceAIResult;

    const covenantsList = (covenantsData || []).map((c) => ({
      covenant_id: c.id,
      covenant_name: c.covenant_name,
      covenant_type: c.covenant_type,
    }));

    switch (query_type) {
      case 'governance_assessment':
        result = await assessGovernance({
          borrower_name: borrowerName,
          borrower_industry: borrowerIndustry,
          governance_metrics: metricsData || undefined,
          resolutions: resolutionsData.length > 0 ? resolutionsData : undefined,
          events: eventsData.length > 0 ? eventsData : undefined,
          existing_covenants: covenantsList,
        });
        break;

      case 'covenant_correlation':
        if (!metricsData) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'MISSING_DATA',
              message: 'Governance metrics required for covenant correlation analysis',
            },
          }, { status: 400 });
        }

        result = await analyzeCovenantCorrelation({
          governance_events: eventsData,
          governance_metrics: metricsData,
          covenants: covenantsList,
        });
        break;

      case 'red_flag_analysis':
        if (!metricsData) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'MISSING_DATA',
              message: 'Governance metrics required for red flag analysis',
            },
          }, { status: 400 });
        }

        result = await analyzeRedFlags({
          borrower_name: borrowerName,
          governance_metrics: metricsData,
          recent_events: eventsData,
        });
        break;

      case 'compensation_analysis':
        result = await analyzeCompensation({
          borrower_name: borrowerName,
          ceo_compensation: metricsData ? {
            base_salary: 0,
            bonus: 0,
            equity_awards: 0,
            total_compensation: 0,
            esg_linked_percentage: metricsData.ceo_comp_esg_percentage || 0,
            esg_metrics_used: metricsData.exec_comp_esg_metrics,
          } : undefined,
        });
        break;

      case 'board_diversity_benchmark':
        result = await benchmarkBoardDiversity({
          borrower_name: borrowerName,
          borrower_industry: borrowerIndustry,
          current_board: metricsData?.board_members || [],
        });
        break;

      case 'proxy_vote_impact':
        if (resolutionsData.length === 0) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'MISSING_DATA',
              message: 'Shareholder resolutions required for proxy vote impact analysis',
            },
          }, { status: 400 });
        }

        // Analyze the most recent resolution
        const latestResolution = resolutionsData[0];
        result = await analyzeProxyVoteImpact({
          borrower_name: borrowerName,
          resolution: latestResolution,
          historical_resolutions: resolutionsData.slice(1),
          governance_metrics: metricsData || undefined,
          related_covenants: covenantsList.map((c) => ({
            covenant_name: c.covenant_name,
            description: c.covenant_type,
          })),
        });
        break;

      default:
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'INVALID_QUERY_TYPE',
            message: `Unknown query type: ${query_type}`,
          },
        }, { status: 400 });
    }

    // Log activity - skip if activities table doesn't support metadata
    try {
      await supabase.from('activities').insert({
        organization_id: orgId,
        user_id: user.id,
        activity_type: 'governance_ai_query',
        description: `Governance AI ${query_type} analysis performed`,
        entity_type: 'governance_analysis',
        source_module: 'esg',
      } as Record<string, unknown>);
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<GovernanceAIResult>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in POST /api/esg/governance/ai:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
