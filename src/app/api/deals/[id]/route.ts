import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateDealSchema } from '@/lib/validations';
import type { Deal } from '@/types';
import {
  respondSuccess,
  ErrorBuilder,
  getOrCreateRequestId,
  createNotFoundError,
} from '@/lib/utils';

// GET /api/deals/[id] - Get a single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const path = request.nextUrl.pathname;

  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: deal, error } = await (supabase
      .from('deals') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('id', id)
      .single() as { data: Deal | null; error: unknown };

    if (error || !deal) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
        return createNotFoundError('Deal', id, path);
      }

      return ErrorBuilder.database(`Failed to fetch deal: ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`)
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('GET')
        .withContext({ dealId: id, dbErrorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown' })
        .build();
    }

    // Get additional stats
    const { count: totalTerms } = await (supabase
      .from('negotiation_terms') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', id);

    const { count: agreedTerms } = await (supabase
      .from('negotiation_terms') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', id)
      .eq('negotiation_status', 'agreed');

    const { count: pendingProposals } = await (supabase
      .from('term_proposals') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', id)
      .eq('status', 'pending');

    const { count: participantCount } = await (supabase
      .from('deal_participants') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', id)
      .eq('status', 'active');

    return respondSuccess<Deal & { stats: Record<string, number> }>({
      ...deal,
      stats: {
        total_terms: totalTerms || 0,
        agreed_terms: agreedTerms || 0,
        pending_proposals: pendingProposals || 0,
        participant_count: participantCount || 0,
      },
    });
  } catch {
    return ErrorBuilder.internal()
      .withRequestId(requestId)
      .withPath(path)
      .withMethod('GET')
      .build();
  }
}

// PUT /api/deals/[id] - Update a deal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const path = request.nextUrl.pathname;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const parsed = updateDealSchema.safeParse(body);
    if (!parsed.success) {
      return ErrorBuilder.validation('Invalid deal update request')
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('PUT')
        .withZodErrors(parsed.error)
        .withSuggestion(
          'Check the field errors above for specific validation issues',
          'Ensure all required fields are provided with valid values'
        )
        .build();
    }

    const { data: deal, error } = await (supabase
      .from('deals') as ReturnType<typeof supabase.from>)
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single() as { data: Deal | null; error: unknown };

    if (error || !deal) {
      return ErrorBuilder.database(`Failed to update deal: ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`)
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('PUT')
        .withContext({ dealId: id, operation: 'update', dbErrorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown' })
        .withSuggestion(
          'Verify the deal exists and you have permission to update it',
          'Check that the deal is not locked or in a terminal state'
        )
        .build();
    }

    return respondSuccess<Deal>(deal);
  } catch {
    return ErrorBuilder.internal()
      .withRequestId(requestId)
      .withPath(path)
      .withMethod('PUT')
      .build();
  }
}

// DELETE /api/deals/[id] - Delete a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const path = request.nextUrl.pathname;

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if deal exists and is in draft status
    interface DealStatusData {
      status: string;
    }
    const { data: deal, error: fetchError } = await (supabase
      .from('deals') as ReturnType<typeof supabase.from>)
      .select('status')
      .eq('id', id)
      .single() as { data: DealStatusData | null; error: unknown };

    if (fetchError || !deal) {
      return createNotFoundError('Deal', id, path);
    }

    // Only allow deleting draft deals
    if (deal.status !== 'draft') {
      return ErrorBuilder.forbidden('Only draft deals can be deleted')
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('DELETE')
        .withContext({ dealId: id, currentStatus: deal.status })
        .clearSuggestions()
        .withSuggestion(
          'Draft deals can be deleted, but deals in other states cannot',
          'To remove an active deal, use the terminate endpoint instead',
          'PUT /api/deals/{id}/status with { status: "terminated" }'
        )
        .withSuggestion(
          'Current deal status is not deletable',
          `This deal has status "${deal.status}". Only "draft" status allows deletion.`
        )
        .build();
    }

    // Delete related data
    await Promise.all([
      (supabase.from('deal_activities') as ReturnType<typeof supabase.from>).delete().eq('deal_id', id),
      (supabase.from('term_comments') as ReturnType<typeof supabase.from>).delete().eq('deal_id', id),
      (supabase.from('term_proposals') as ReturnType<typeof supabase.from>).delete().eq('deal_id', id),
      (supabase.from('term_history') as ReturnType<typeof supabase.from>).delete().eq('deal_id', id),
      (supabase.from('negotiation_terms') as ReturnType<typeof supabase.from>).delete().eq('deal_id', id),
      (supabase.from('term_categories') as ReturnType<typeof supabase.from>).delete().eq('deal_id', id),
      (supabase.from('deal_participants') as ReturnType<typeof supabase.from>).delete().eq('deal_id', id),
    ]);

    // Delete the deal
    const { error: deleteError } = await (supabase
      .from('deals') as ReturnType<typeof supabase.from>)
      .delete()
      .eq('id', id) as { error: unknown };

    if (deleteError) {
      return ErrorBuilder.database(`Failed to delete deal: ${deleteError && typeof deleteError === 'object' && 'message' in deleteError ? String(deleteError.message) : 'Unknown error'}`)
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('DELETE')
        .withContext({ dealId: id, operation: 'delete', dbErrorCode: deleteError && typeof deleteError === 'object' && 'code' in deleteError ? String(deleteError.code) : 'unknown' })
        .build();
    }

    return respondSuccess<null>(null);
  } catch {
    return ErrorBuilder.internal()
      .withRequestId(requestId)
      .withPath(path)
      .withMethod('DELETE')
      .build();
  }
}
