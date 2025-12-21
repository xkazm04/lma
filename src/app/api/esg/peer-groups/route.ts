import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPeerGroupSchema } from '@/lib/validations/esg';
import type { ApiResponse } from '@/types';
import type { PeerGroupDefinition } from '@/app/features/esg/lib/types';

// Database row type for peer groups (table may not exist in generated types yet)
interface PeerGroupRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  definition: Record<string, unknown>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/esg/peer-groups - List all peer groups
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = supabase
      .from('esg_peer_groups')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: peerGroups, error } = await query;

    if (error) {
      console.error('Error fetching peer groups:', error);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch peer groups',
        },
      }, { status: 500 });
    }

    // Calculate member count for each peer group
    const peerGroupsWithCounts: PeerGroupDefinition[] = await Promise.all(
      ((peerGroups || []) as unknown as PeerGroupRow[]).map(async (pg) => {
        const definition = pg.definition as PeerGroupDefinition['definition'];
        let memberCount = 0;

        // Build query based on definition criteria
        let facilityQuery = supabase
          .from('esg_facilities')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', userData.organization_id)
          .eq('status', 'active');

        if (definition.industries && definition.industries.length > 0) {
          facilityQuery = facilityQuery.in('borrower_industry', definition.industries);
        }
        if (definition.loan_types && definition.loan_types.length > 0) {
          facilityQuery = facilityQuery.in('esg_loan_type', definition.loan_types);
        }
        if (definition.commitment_range?.min) {
          facilityQuery = facilityQuery.gte('commitment_amount', definition.commitment_range.min);
        }
        if (definition.commitment_range?.max) {
          facilityQuery = facilityQuery.lte('commitment_amount', definition.commitment_range.max);
        }

        const { count } = await facilityQuery;
        memberCount = count || 0;

        return {
          id: pg.id,
          organization_id: pg.organization_id,
          name: pg.name,
          description: pg.description,
          definition,
          member_count: memberCount,
          created_at: pg.created_at,
          updated_at: pg.updated_at,
          is_active: pg.is_active,
        };
      })
    );

    // Add default industry-based peer groups
    const { data: industries } = await supabase
      .from('esg_facilities')
      .select('borrower_industry')
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active')
      .not('borrower_industry', 'is', null);

    const uniqueIndustries = [...new Set((industries || []).map(i => i.borrower_industry).filter(Boolean))];

    const defaultPeerGroups: PeerGroupDefinition[] = uniqueIndustries.map(industry => {
      const count = (industries || []).filter(i => i.borrower_industry === industry).length;
      return {
        id: `industry-${industry.toLowerCase().replace(/\s+/g, '-')}`,
        organization_id: userData.organization_id,
        name: `${industry} Peer Group`,
        description: `All facilities in the ${industry} sector`,
        definition: {
          industries: [industry],
          is_custom: false,
        },
        member_count: count,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };
    });

    // Add "All Facilities" default peer group
    const { count: totalFacilities } = await supabase
      .from('esg_facilities')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active');

    const allFacilitiesGroup: PeerGroupDefinition = {
      id: 'all-facilities',
      organization_id: userData.organization_id,
      name: 'All Facilities',
      description: 'Compare against all facilities in the portfolio',
      definition: {
        is_custom: false,
      },
      member_count: totalFacilities || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    return NextResponse.json<ApiResponse<{ custom: PeerGroupDefinition[]; default: PeerGroupDefinition[] }>>({
      success: true,
      data: {
        custom: peerGroupsWithCounts,
        default: [allFacilitiesGroup, ...defaultPeerGroups],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/esg/peer-groups:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/peer-groups - Create a new custom peer group
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const body = await request.json();
    const parsed = createPeerGroupSchema.safeParse(body);

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

    const { name, description, definition } = parsed.data;

    // Mark as custom peer group
    const definitionWithCustomFlag = {
      ...definition,
      is_custom: true,
    };

    const { data: newPeerGroupData, error: insertError } = await supabase
      .from('esg_peer_groups')
      .insert({
        organization_id: userData.organization_id,
        name,
        description,
        definition: definitionWithCustomFlag,
        is_active: true,
        created_by: user.id,
      } as Record<string, unknown>)
      .select()
      .single();

    if (insertError || !newPeerGroupData) {
      console.error('Error creating peer group:', insertError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create peer group',
        },
      }, { status: 500 });
    }

    const newPeerGroup = newPeerGroupData as unknown as PeerGroupRow;

    // Calculate initial member count
    let facilityQuery = supabase
      .from('esg_facilities')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active');

    if (definition.industries && definition.industries.length > 0) {
      facilityQuery = facilityQuery.in('borrower_industry', definition.industries);
    }
    if (definition.loan_types && definition.loan_types.length > 0) {
      facilityQuery = facilityQuery.in('esg_loan_type', definition.loan_types);
    }
    if (definition.commitment_range?.min) {
      facilityQuery = facilityQuery.gte('commitment_amount', definition.commitment_range.min);
    }
    if (definition.commitment_range?.max) {
      facilityQuery = facilityQuery.lte('commitment_amount', definition.commitment_range.max);
    }

    const { count } = await facilityQuery;

    const result: PeerGroupDefinition = {
      id: newPeerGroup.id,
      organization_id: newPeerGroup.organization_id,
      name: newPeerGroup.name,
      description: newPeerGroup.description,
      definition: definitionWithCustomFlag,
      member_count: count || 0,
      created_at: newPeerGroup.created_at,
      updated_at: newPeerGroup.updated_at,
      is_active: newPeerGroup.is_active,
    };

    return NextResponse.json<ApiResponse<PeerGroupDefinition>>({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/peer-groups:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
