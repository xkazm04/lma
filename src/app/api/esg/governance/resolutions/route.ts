import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import {
  createShareholderResolutionSchema,
} from '@/lib/validations/esg';
import type { ShareholderResolution } from '@/lib/validations/esg';
import { analyzeProxyVoteImpact } from '@/lib/llm/governance';

// GET /api/esg/governance/resolutions - Get shareholder resolutions
// Query params:
//   - borrower_id (optional): Filter by borrower
//   - category (optional): Filter by resolution category
//   - vote_result (optional): Filter by vote result
//   - date_from (optional): Start date filter
//   - date_to (optional): End date filter
//   - page (optional): Page number (default 1)
//   - page_size (optional): Items per page (default 20)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const borrowerId = searchParams.get('borrower_id');
    const category = searchParams.get('category');
    const voteResult = searchParams.get('vote_result');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

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

    // Build query
    let query = supabase
      .from('shareholder_resolutions')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('meeting_date', { ascending: false });

    if (borrowerId) {
      query = query.eq('borrower_id', borrowerId);
    }

    if (category) {
      query = query.eq('resolution_category', category);
    }

    if (voteResult) {
      query = query.eq('vote_result', voteResult);
    }

    if (dateFrom) {
      query = query.gte('meeting_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('meeting_date', dateTo);
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: resolutions, error, count } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse<ShareholderResolution[]>>({
      success: true,
      data: resolutions || [],
      meta: {
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/esg/governance/resolutions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/governance/resolutions - Create a new shareholder resolution
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
    const validationResult = createShareholderResolutionSchema.safeParse(body);
    if (!validationResult.success) {
      const zodError = validationResult.error;
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid shareholder resolution data',
          details: {
            fieldErrors: zodError.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
      }, { status: 400 });
    }

    const resolutionData = validationResult.data;

    // Insert resolution
    const { data: newResolution, error } = await supabase
      .from('shareholder_resolutions')
      .insert({
        ...resolutionData,
        organization_id: orgId,
        created_by: user.id,
      } as Record<string, unknown>)
      .select()
      .single() as { data: ShareholderResolution | null; error: unknown };

    if (error) throw error;

    // Log activity
    try {
      await supabase.from('activities').insert({
        organization_id: orgId,
        user_id: user.id,
        activity_type: 'shareholder_resolution_created',
        description: `Shareholder resolution recorded: ${resolutionData.resolution_type}`,
        entity_type: 'shareholder_resolution',
        entity_id: newResolution?.borrower_id,
        source_module: 'esg',
      } as Record<string, unknown>);
    } catch {
      // Ignore activity logging errors
    }

    // If there's an ISS recommendation against management or high ESG relevance, create an alert
    if (
      (resolutionData.iss_recommendation &&
        resolutionData.management_recommendation &&
        resolutionData.iss_recommendation !== resolutionData.management_recommendation) ||
      (resolutionData.esg_relevance_score && resolutionData.esg_relevance_score >= 80)
    ) {
      try {
        await supabase.from('governance_alerts').insert({
          organization_id: orgId,
          borrower_id: resolutionData.borrower_id,
          alert_type: 'shareholder_resolution',
          severity: resolutionData.esg_relevance_score && resolutionData.esg_relevance_score >= 80 ? 'critical' : 'warning',
          title: `Shareholder Resolution: ${resolutionData.resolution_type}`,
          description: `A ${resolutionData.resolution_category} resolution is pending review. ` +
            `ISS recommends: ${resolutionData.iss_recommendation || 'N/A'}, ` +
            `Management recommends: ${resolutionData.management_recommendation || 'N/A'}`,
          recommended_actions: [
            'Review resolution details',
            'Assess covenant implications',
            'Prepare voting recommendation',
          ],
          created_by: user.id,
        } as Record<string, unknown>);
      } catch {
        // Ignore alert creation errors
      }
    }

    return NextResponse.json<ApiResponse<ShareholderResolution>>({
      success: true,
      data: newResolution,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/governance/resolutions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
