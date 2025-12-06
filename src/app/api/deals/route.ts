import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDealSchema } from '@/lib/validations';
import type { ApiResponse, Deal, DealWithStats } from '@/types';

// GET /api/deals - List all deals
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createClient();

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const dealType = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search');

    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (dealType && dealType !== 'all') {
      query = query.eq('deal_type', dealType);
    }
    if (search) {
      query = query.or(`deal_name.ilike.%${search}%,deal_reference.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('updated_at', { ascending: false });

    const { data: deals, error, count } = await query;

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: error.message,
        },
      }, { status: 500 });
    }

    // Get stats for each deal
    const dealsWithStats: DealWithStats[] = await Promise.all(
      (deals || []).map(async (deal: Deal) => {
        // Get term counts
        const { count: totalTerms } = await supabase
          .from('negotiation_terms')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id);

        const { count: agreedTerms } = await supabase
          .from('negotiation_terms')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id)
          .eq('negotiation_status', 'agreed');

        const { count: pendingProposals } = await supabase
          .from('term_proposals')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id)
          .eq('status', 'pending');

        const { count: participantCount } = await supabase
          .from('deal_participants')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id)
          .eq('status', 'active');

        return {
          ...deal,
          total_terms: totalTerms || 0,
          agreed_terms: agreedTerms || 0,
          pending_proposals: pendingProposals || 0,
          participant_count: participantCount || 0,
        };
      })
    );

    return NextResponse.json<ApiResponse<DealWithStats[]>>({
      success: true,
      data: dealsWithStats,
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
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createClient();

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

    const body = await request.json();

    // Validate input
    const parsed = createDealSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    // Get user's organization ID (in real app, this would come from user profile)
    const organizationId = 'default-org'; // Placeholder

    // Create the deal
    const { data: deal, error: createError } = await supabase
      .from('deals')
      .insert({
        ...parsed.data,
        organization_id: organizationId,
        created_by: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: createError.message,
        },
      }, { status: 500 });
    }

    // Add the creator as a deal lead participant
    await supabase
      .from('deal_participants')
      .insert({
        deal_id: deal.id,
        user_id: user.id,
        party_name: 'Creator',
        party_type: 'lender_side',
        party_role: 'Deal Lead',
        deal_role: 'deal_lead',
        can_approve: true,
        status: 'active',
        joined_at: new Date().toISOString(),
      });

    // Log activity
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: deal.id,
        activity_type: 'deal_created',
        actor_id: user.id,
        actor_party: 'Creator',
        details: { deal_name: deal.deal_name, deal_type: deal.deal_type },
      });

    return NextResponse.json<ApiResponse<Deal>>({
      success: true,
      data: deal,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
