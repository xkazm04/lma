import { NextRequest } from 'next/server';
import { createClient, type TypedSupabaseClient } from '@/lib/supabase/server';
import { createDealSchema } from '@/lib/validations';
import type { Deal, DealWithStats } from '@/types';
import {
  respondSuccess,
  respondUnauthorized,
  respondValidationError,
  respondDatabaseError,
  respondInternalError,
} from '@/lib/utils';

// Type for imported terms
interface ImportedTerm {
  termKey: string;
  termLabel: string;
  valueType: string;
  currentValue: unknown;
  currentValueText: string;
  sourceClauseReference?: string;
}

// Type for facility import data in request
interface ImportFromFacilityData {
  facility_id: string;
  facility_name: string;
  document_id: string;
  import_options: {
    covenants: boolean;
    obligations: boolean;
    esg: boolean;
  };
  terms: {
    facility_terms: ImportedTerm[];
    covenant_terms: ImportedTerm[];
    obligation_terms: ImportedTerm[];
    esg_terms: ImportedTerm[];
  };
}

// GET /api/deals - List all deals
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const dealType = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search');

    let query = (supabase
      .from('deals') as ReturnType<typeof supabase.from>)
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

    const { data: deals, error, count } = await query as { data: Deal[] | null; error: unknown; count: number | null };

    if (error) {
      return respondDatabaseError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Unknown error');
    }

    // Get stats for each deal
    const dealsWithStats: DealWithStats[] = await Promise.all(
      (deals || []).map(async (deal: Deal) => {
        // Get term counts
        const { count: totalTerms } = await (supabase
          .from('negotiation_terms') as ReturnType<typeof supabase.from>)
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id);

        const { count: agreedTerms } = await (supabase
          .from('negotiation_terms') as ReturnType<typeof supabase.from>)
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id)
          .eq('negotiation_status', 'agreed');

        const { count: pendingProposals } = await (supabase
          .from('term_proposals') as ReturnType<typeof supabase.from>)
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id)
          .eq('status', 'pending');

        const { count: participantCount } = await (supabase
          .from('deal_participants') as ReturnType<typeof supabase.from>)
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id)
          .eq('status', 'active');

        return {
          ...deal,
          total_terms: totalTerms || 0,
          agreed_terms: agreedTerms || 0,
          pending_proposals: pendingProposals || 0,
          participant_count: participantCount || 0,
        } as unknown as DealWithStats;
      })
    );

    return respondSuccess<DealWithStats[]>(dealsWithStats, {
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch {
    return respondInternalError();
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respondUnauthorized();
    }

    const body = await request.json();

    // Extract import data before validation (it's not part of the base schema)
    const importFromFacility: ImportFromFacilityData | undefined = body.import_from_facility;
    const participants = body.participants || [];

    // Remove fields not in the schema for validation
    const dealData = {
      deal_name: body.deal_name,
      deal_type: body.deal_type,
      deal_reference: body.deal_reference,
      base_facility_id: importFromFacility?.facility_id,
      negotiation_mode: body.negotiation_mode,
      target_signing_date: body.target_signing_date,
      target_closing_date: body.target_close_date || body.target_closing_date,
    };

    // Validate input
    const parsed = createDealSchema.safeParse(dealData);
    if (!parsed.success) {
      return respondValidationError('Invalid request', parsed.error.flatten());
    }

    // Get user's organization ID (in real app, this would come from user profile)
    const organizationId = 'default-org'; // Placeholder

    // Create the deal
    const { data: deal, error: createError } = await (supabase
      .from('deals') as ReturnType<typeof supabase.from>)
      .insert({
        ...parsed.data,
        organization_id: organizationId,
        created_by: user.id,
        status: 'draft',
        description: body.description,
      })
      .select()
      .single() as { data: Deal | null; error: unknown };

    if (createError || !deal) {
      return respondDatabaseError(createError && typeof createError === 'object' && 'message' in createError ? String(createError.message) : 'Unknown error');
    }

    // Add the creator as a deal lead participant
    await (supabase
      .from('deal_participants') as ReturnType<typeof supabase.from>)
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

    // Add additional participants if provided
    if (participants.length > 0) {
      const participantInserts = participants
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => p.party_name && p.party_name.trim() !== '')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => ({
          deal_id: deal.id,
          party_name: p.party_name,
          party_type: p.party_type || 'lender_side',
          party_role: p.party_role || 'Participant',
          deal_role: p.deal_role || 'negotiator',
          can_approve: p.deal_role === 'deal_lead',
          status: 'invited',
          invited_at: new Date().toISOString(),
        }));

      if (participantInserts.length > 0) {
        await (supabase.from('deal_participants') as ReturnType<typeof supabase.from>).insert(participantInserts);
      }
    }

    // If importing from facility, create categories and terms
    if (importFromFacility && importFromFacility.terms) {
      await createTermsFromImport(supabase, deal.id, importFromFacility);
    }

    // Log activity
    const activityDetails: Record<string, unknown> = {
      deal_name: deal.deal_name,
      deal_type: deal.deal_type,
    };

    if (importFromFacility) {
      activityDetails.imported_from_facility = importFromFacility.facility_name;
      activityDetails.imported_terms_count = countImportedTerms(importFromFacility);
    }

    await (supabase
      .from('deal_activities') as ReturnType<typeof supabase.from>)
      .insert({
        deal_id: deal.id,
        activity_type: 'deal_created',
        actor_id: user.id,
        actor_party: 'Creator',
        details: activityDetails,
      });

    return respondSuccess<Deal>(deal, { status: 201 });
  } catch {
    return respondInternalError();
  }
}

// Helper to create categories and terms from imported facility data
async function createTermsFromImport(
   
  supabase: TypedSupabaseClient,
  dealId: string,
  importData: ImportFromFacilityData
) {
  const { terms } = importData;
  const categoryIds: Record<string, string> = {};

  // Create categories for each term type
  const categories = [
    { name: 'Facility Terms', terms: terms.facility_terms, displayOrder: 1 },
    { name: 'Financial Covenants', terms: terms.covenant_terms, displayOrder: 2 },
    { name: 'Reporting Obligations', terms: terms.obligation_terms, displayOrder: 3 },
    { name: 'ESG Provisions', terms: terms.esg_terms, displayOrder: 4 },
  ].filter(cat => cat.terms && cat.terms.length > 0);

  // Create categories
  for (const category of categories) {
    interface CategoryIdData {
      id: string;
    }
    const { data: categoryData, error: categoryError } = await (supabase
      .from('negotiation_categories') as ReturnType<typeof supabase.from>)
      .insert({
        deal_id: dealId,
        name: category.name,
        display_order: category.displayOrder,
      })
      .select('id')
      .single() as { data: CategoryIdData | null; error: unknown };

    if (!categoryError && categoryData) {
      categoryIds[category.name] = categoryData.id;

      // Create terms for this category
      if (category.terms && category.terms.length > 0) {
        const termInserts = category.terms.map((term, index) => ({
          deal_id: dealId,
          category_id: categoryData.id,
          term_key: term.termKey,
          term_label: term.termLabel,
          value_type: mapValueType(term.valueType),
          current_value: term.currentValue,
          current_value_text: term.currentValueText,
          original_value: term.currentValue,
          original_value_text: term.currentValueText,
          source_clause_reference: term.sourceClauseReference || null,
          source_facility_id: importData.facility_id,
          negotiation_status: 'not_started',
          is_locked: false,
          display_order: index + 1,
        }));

        await (supabase.from('negotiation_terms') as ReturnType<typeof supabase.from>).insert(termInserts);
      }
    }
  }

  return categoryIds;
}

// Helper to count total imported terms
function countImportedTerms(importData: ImportFromFacilityData): number {
  let count = 0;
  if (importData.terms.facility_terms) count += importData.terms.facility_terms.length;
  if (importData.terms.covenant_terms) count += importData.terms.covenant_terms.length;
  if (importData.terms.obligation_terms) count += importData.terms.obligation_terms.length;
  if (importData.terms.esg_terms) count += importData.terms.esg_terms.length;
  return count;
}

// Helper to map value types from extraction to deal value types
function mapValueType(valueType: string): string {
  const typeMap: Record<string, string> = {
    'currency_amount': 'currency_amount',
    'percentage': 'percentage',
    'number': 'number',
    'date': 'date',
    'text': 'text',
    'boolean': 'boolean',
  };
  return typeMap[valueType] || 'text';
}
