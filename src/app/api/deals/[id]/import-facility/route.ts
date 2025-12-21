import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { importFacilitySchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';

// POST /api/deals/[id]/import-facility - Import terms from a facility
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
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

    const body = await request.json();

    // Validate input
    const parsed = importFacilitySchema.safeParse(body);
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

    const { facility_id, import_covenants, import_obligations, import_esg } = parsed.data;

    // Get the facility
    interface FacilityData {
      id: string;
      facility_name: string;
      facility_type: string;
      currency: string;
      total_commitments: number;
      maturity_date: string;
      effective_date: string;
      interest_rate_type: string;
      base_rate: string;
      margin_initial: number;
      commitment_fee: number;
      arrangement_fee: number;
      source_document_id: string;
    }
    const { data: facility, error: facilityError } = await (supabase
      .from('loan_facilities') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('id', facility_id)
      .single() as { data: FacilityData | null; error: unknown };

    if (facilityError || !facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    // Update deal with base facility reference
    await (supabase
      .from('deals') as ReturnType<typeof supabase.from>)
      .update({
        base_facility_id: facility_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    // Create categories and terms
    const createdTerms: string[] = [];

    // Create Facility Terms category
    interface CategoryData {
      id: string;
      name: string;
      display_order: number;
    }
    const { data: facilityCategory } = await (supabase
      .from('term_categories') as ReturnType<typeof supabase.from>)
      .insert({
        deal_id: dealId,
        name: 'Facility Terms',
        display_order: 1,
      })
      .select()
      .single() as { data: CategoryData | null };

    // Import facility terms
    if (facilityCategory) {
      const facilityTerms = [
        { key: 'facility_name', label: 'Facility Name', value: facility.facility_name, type: 'text' },
        { key: 'facility_type', label: 'Facility Type', value: facility.facility_type, type: 'selection' },
        { key: 'currency', label: 'Currency', value: facility.currency, type: 'text' },
        { key: 'total_commitments', label: 'Total Commitments', value: facility.total_commitments, type: 'currency_amount' },
        { key: 'maturity_date', label: 'Maturity Date', value: facility.maturity_date, type: 'date' },
        { key: 'effective_date', label: 'Effective Date', value: facility.effective_date, type: 'date' },
      ];

      interface TermData {
        id: string;
      }
      for (let i = 0; i < facilityTerms.length; i++) {
        const term = facilityTerms[i];
        if (term.value !== null && term.value !== undefined) {
          const { data: createdTerm } = await (supabase
            .from('negotiation_terms') as ReturnType<typeof supabase.from>)
            .insert({
              deal_id: dealId,
              category_id: facilityCategory.id,
              term_key: term.key,
              term_label: term.label,
              value_type: term.type,
              current_value: term.value,
              current_value_text: String(term.value),
              source_facility_id: facility_id,
              negotiation_status: 'not_started',
              display_order: i + 1,
            })
            .select()
            .single() as { data: TermData | null };
          if (createdTerm) createdTerms.push(createdTerm.id);
        }
      }
    }

    // Create Pricing Terms category
    const { data: pricingCategory } = await (supabase
      .from('term_categories') as ReturnType<typeof supabase.from>)
      .insert({
        deal_id: dealId,
        name: 'Pricing Terms',
        display_order: 2,
      })
      .select()
      .single() as { data: CategoryData | null };

    if (pricingCategory) {
      const pricingTerms = [
        { key: 'interest_rate_type', label: 'Interest Rate Type', value: facility.interest_rate_type, type: 'selection' },
        { key: 'base_rate', label: 'Base Rate', value: facility.base_rate, type: 'text' },
        { key: 'margin_initial', label: 'Initial Margin', value: facility.margin_initial, type: 'percentage' },
        { key: 'commitment_fee', label: 'Commitment Fee', value: facility.commitment_fee, type: 'percentage' },
        { key: 'arrangement_fee', label: 'Arrangement Fee', value: facility.arrangement_fee, type: 'percentage' },
      ];

      interface TermData {
        id: string;
      }
      for (let i = 0; i < pricingTerms.length; i++) {
        const term = pricingTerms[i];
        if (term.value !== null && term.value !== undefined) {
          const { data: createdTerm } = await (supabase
            .from('negotiation_terms') as ReturnType<typeof supabase.from>)
            .insert({
              deal_id: dealId,
              category_id: pricingCategory.id,
              term_key: term.key,
              term_label: term.label,
              value_type: term.type,
              current_value: term.value,
              current_value_text: String(term.value),
              source_facility_id: facility_id,
              negotiation_status: 'not_started',
              display_order: i + 1,
            })
            .select()
            .single() as { data: TermData | null };
          if (createdTerm) createdTerms.push(createdTerm.id);
        }
      }
    }

    // Import covenants if requested
    if (import_covenants) {
      interface CovenantData {
        id: string;
        covenant_type: string;
        covenant_name: string;
        threshold_type: string;
        threshold_value: number;
        clause_reference: string;
      }
      const { data: covenants } = await (supabase
        .from('financial_covenants') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('source_document_id', facility.source_document_id) as { data: CovenantData[] | null };

      if (covenants && covenants.length > 0) {
        const { data: covenantCategory } = await (supabase
          .from('term_categories') as ReturnType<typeof supabase.from>)
          .insert({
            deal_id: dealId,
            name: 'Financial Covenants',
            display_order: 3,
          })
          .select()
          .single() as { data: CategoryData | null };

        if (covenantCategory) {
          interface TermData {
            id: string;
          }
          for (let i = 0; i < covenants.length; i++) {
            const covenant = covenants[i];
            const { data: createdTerm } = await (supabase
              .from('negotiation_terms') as ReturnType<typeof supabase.from>)
              .insert({
                deal_id: dealId,
                category_id: covenantCategory.id,
                term_key: `covenant_${covenant.covenant_type}`,
                term_label: covenant.covenant_name,
                term_description: `${covenant.threshold_type} ${covenant.threshold_value}`,
                value_type: 'number',
                current_value: covenant.threshold_value,
                current_value_text: `${covenant.threshold_type} ${covenant.threshold_value}`,
                source_facility_id: facility_id,
                source_clause_reference: covenant.clause_reference,
                negotiation_status: 'not_started',
                display_order: i + 1,
              })
              .select()
              .single() as { data: TermData | null };
            if (createdTerm) createdTerms.push(createdTerm.id);
          }
        }
      }
    }

    // Import obligations if requested
    if (import_obligations) {
      interface ObligationData {
        id: string;
        obligation_type: string;
        description: string;
        frequency: string;
        deadline_days: number;
        clause_reference: string;
      }
      const { data: obligations } = await (supabase
        .from('reporting_obligations') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('source_document_id', facility.source_document_id) as { data: ObligationData[] | null };

      if (obligations && obligations.length > 0) {
        const { data: obligationCategory } = await (supabase
          .from('term_categories') as ReturnType<typeof supabase.from>)
          .insert({
            deal_id: dealId,
            name: 'Reporting Obligations',
            display_order: 4,
          })
          .select()
          .single() as { data: CategoryData | null };

        if (obligationCategory) {
          interface TermData {
            id: string;
          }
          for (let i = 0; i < obligations.length; i++) {
            const obligation = obligations[i];
            const { data: createdTerm } = await (supabase
              .from('negotiation_terms') as ReturnType<typeof supabase.from>)
              .insert({
                deal_id: dealId,
                category_id: obligationCategory.id,
                term_key: `obligation_${obligation.obligation_type}`,
                term_label: obligation.obligation_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                term_description: obligation.description,
                value_type: 'text',
                current_value: { frequency: obligation.frequency, deadline_days: obligation.deadline_days },
                current_value_text: `${obligation.frequency}, ${obligation.deadline_days} days`,
                source_facility_id: facility_id,
                source_clause_reference: obligation.clause_reference,
                negotiation_status: 'not_started',
                display_order: i + 1,
              })
              .select()
              .single() as { data: TermData | null };
            if (createdTerm) createdTerms.push(createdTerm.id);
          }
        }
      }
    }

    // Import ESG provisions if requested
    if (import_esg) {
      interface ESGProvisionData {
        id: string;
        provision_type: string;
        kpi_name: string | null;
        kpi_definition: string;
        kpi_baseline: unknown;
        kpi_targets: unknown;
        clause_reference: string;
      }
      const { data: esgProvisions } = await (supabase
        .from('esg_provisions') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('source_document_id', facility.source_document_id) as { data: ESGProvisionData[] | null };

      if (esgProvisions && esgProvisions.length > 0) {
        const { data: esgCategory } = await (supabase
          .from('term_categories') as ReturnType<typeof supabase.from>)
          .insert({
            deal_id: dealId,
            name: 'ESG Provisions',
            display_order: 5,
          })
          .select()
          .single() as { data: CategoryData | null };

        if (esgCategory) {
          interface TermData {
            id: string;
          }
          for (let i = 0; i < esgProvisions.length; i++) {
            const esg = esgProvisions[i];
            const { data: createdTerm } = await (supabase
              .from('negotiation_terms') as ReturnType<typeof supabase.from>)
              .insert({
                deal_id: dealId,
                category_id: esgCategory.id,
                term_key: `esg_${esg.provision_type}`,
                term_label: esg.kpi_name || esg.provision_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                term_description: esg.kpi_definition,
                value_type: 'table',
                current_value: { baseline: esg.kpi_baseline, targets: esg.kpi_targets },
                current_value_text: esg.kpi_name || '',
                source_facility_id: facility_id,
                source_clause_reference: esg.clause_reference,
                negotiation_status: 'not_started',
                display_order: i + 1,
              })
              .select()
              .single() as { data: TermData | null };
            if (createdTerm) createdTerms.push(createdTerm.id);
          }
        }
      }
    }

    // Get participant info for activity log
    interface ParticipantData {
      party_name: string;
    }
    const { data: participant } = await (supabase
      .from('deal_participants') as ReturnType<typeof supabase.from>)
      .select('party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .single() as { data: ParticipantData | null };

    // Log activity
    await (supabase
      .from('deal_activities') as ReturnType<typeof supabase.from>)
      .insert({
        deal_id: dealId,
        activity_type: 'deal_created', // Using existing type for import
        actor_id: user.id,
        actor_party: participant?.party_name || 'Unknown',
        details: {
          action: 'facility_imported',
          facility_id: facility_id,
          terms_created: createdTerms.length,
        },
      });

    return NextResponse.json<ApiResponse<{ terms_imported: number }>>({
      success: true,
      data: {
        terms_imported: createdTerms.length,
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
