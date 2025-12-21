import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updatePeerGroupSchema } from '@/lib/validations/esg';
import type { ApiResponse } from '@/types';
import type { PeerGroupDefinition } from '@/app/features/esg/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

// GET /api/esg/peer-groups/[id] - Get a specific peer group
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    const { data: peerGroupData, error } = await supabase
      .from('esg_peer_groups')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (error || !peerGroupData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Peer group not found',
        },
      }, { status: 404 });
    }

    const peerGroup = peerGroupData as unknown as PeerGroupRow;
    const definition = peerGroup.definition as PeerGroupDefinition['definition'];

    // Calculate member count
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
      id: peerGroup.id,
      organization_id: peerGroup.organization_id,
      name: peerGroup.name,
      description: peerGroup.description,
      definition,
      member_count: count || 0,
      created_at: peerGroup.created_at,
      updated_at: peerGroup.updated_at,
      is_active: peerGroup.is_active,
    };

    return NextResponse.json<ApiResponse<PeerGroupDefinition>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/peer-groups/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PATCH /api/esg/peer-groups/[id] - Update a peer group
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Verify peer group exists and belongs to organization
    const { data: existingPeerGroupData, error: fetchError } = await supabase
      .from('esg_peer_groups')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (fetchError || !existingPeerGroupData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Peer group not found',
        },
      }, { status: 404 });
    }

    const _existingPeerGroup = existingPeerGroupData as unknown as PeerGroupRow;

    const body = await request.json();
    const parsed = updatePeerGroupSchema.safeParse(body);

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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }
    if (parsed.data.description !== undefined) {
      updateData.description = parsed.data.description;
    }
    if (parsed.data.definition !== undefined) {
      updateData.definition = {
        ...parsed.data.definition,
        is_custom: true,
      };
    }
    if (parsed.data.is_active !== undefined) {
      updateData.is_active = parsed.data.is_active;
    }

    const { data: updatedPeerGroupData, error: updateError } = await supabase
      .from('esg_peer_groups')
      .update(updateData as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedPeerGroupData) {
      console.error('Error updating peer group:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update peer group',
        },
      }, { status: 500 });
    }

    const updatedPeerGroup = updatedPeerGroupData as unknown as PeerGroupRow;
    const definition = updatedPeerGroup.definition as PeerGroupDefinition['definition'];

    // Calculate updated member count
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
      id: updatedPeerGroup.id,
      organization_id: updatedPeerGroup.organization_id,
      name: updatedPeerGroup.name,
      description: updatedPeerGroup.description,
      definition,
      member_count: count || 0,
      created_at: updatedPeerGroup.created_at,
      updated_at: updatedPeerGroup.updated_at,
      is_active: updatedPeerGroup.is_active,
    };

    return NextResponse.json<ApiResponse<PeerGroupDefinition>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in PATCH /api/esg/peer-groups/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/esg/peer-groups/[id] - Delete a peer group
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Verify peer group exists and belongs to organization
    const { data: existingPeerGroup, error: fetchError } = await supabase
      .from('esg_peer_groups')
      .select('id')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (fetchError || !existingPeerGroup) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Peer group not found',
        },
      }, { status: 404 });
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('esg_peer_groups')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting peer group:', deleteError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete peer group',
        },
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error in DELETE /api/esg/peer-groups/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
