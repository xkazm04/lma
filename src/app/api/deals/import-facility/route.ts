// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type TypedSupabaseClient } from '@/lib/supabase/server';
import type { ApiResponse, ExtractedFacility, ExtractedCovenant, ExtractedObligation, ExtractedESG } from '@/types';

// Response type for importable facility data
export interface ImportableFacilityData {
  facilityId: string;
  facilityName: string;
  documentId: string;
  documentName: string;
  extractedAt: string;
  facility: ExtractedFacility | null;
  covenants: ExtractedCovenant[];
  obligations: ExtractedObligation[];
  esgProvisions: ExtractedESG[];
  // Pre-formatted terms for deal creation
  formattedTerms: {
    facilityTerms: Array<{
      termKey: string;
      termLabel: string;
      valueType: string;
      currentValue: unknown;
      currentValueText: string;
      sourceClauseReference?: string;
    }>;
    covenantTerms: Array<{
      termKey: string;
      termLabel: string;
      valueType: string;
      currentValue: unknown;
      currentValueText: string;
      sourceClauseReference?: string;
    }>;
    obligationTerms: Array<{
      termKey: string;
      termLabel: string;
      valueType: string;
      currentValue: unknown;
      currentValueText: string;
      sourceClauseReference?: string;
    }>;
    esgTerms: Array<{
      termKey: string;
      termLabel: string;
      valueType: string;
      currentValue: unknown;
      currentValueText: string;
      sourceClauseReference?: string;
    }>;
  };
}

// GET /api/deals/import-facility - Get list of facilities available for import
export async function GET(request: NextRequest) {
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

    // Check if a specific facility ID is requested
    const searchParams = request.nextUrl.searchParams;
    const facilityId = searchParams.get('facilityId');

    if (facilityId) {
      // Fetch detailed facility data for import
      const facilityData = await fetchFacilityForImport(supabase, facilityId);

      if (!facilityData) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Facility not found',
          },
        }, { status: 404 });
      }

      return NextResponse.json<ApiResponse<ImportableFacilityData>>({
        success: true,
        data: facilityData,
      });
    }

    // Get all facilities with extraction data for listing
    const { data: facilities, error: facilityError } = await supabase
      .from('loan_facilities')
      .select(`
        id,
        facility_name,
        facility_reference,
        source_document_id,
        execution_date,
        maturity_date,
        borrowers,
        total_commitments,
        currency,
        extraction_confidence,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (facilityError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: facilityError.message,
        },
      }, { status: 500 });
    }

    // Enrich with document names
    const facilityList = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (facilities || []).map(async (facility: any) => {
        let documentName = 'Unknown Document';

        if (facility.source_document_id) {
          const { data: doc } = await supabase
            .from('loan_documents')
            .select('original_filename')
            .eq('id', facility.source_document_id)
            .single();

          if (doc) {
            documentName = doc.original_filename;
          }
        }

        // Get counts of related data
        const [covenantCount, obligationCount, esgCount] = await Promise.all([
          supabase
            .from('financial_covenants')
            .select('*', { count: 'exact', head: true })
            .eq('source_document_id', facility.source_document_id),
          supabase
            .from('reporting_obligations')
            .select('*', { count: 'exact', head: true })
            .eq('source_document_id', facility.source_document_id),
          supabase
            .from('esg_provisions')
            .select('*', { count: 'exact', head: true })
            .eq('source_document_id', facility.source_document_id),
        ]);

        return {
          id: facility.id,
          name: facility.facility_name,
          reference: facility.facility_reference,
          documentId: facility.source_document_id,
          documentName,
          executionDate: facility.execution_date,
          maturityDate: facility.maturity_date,
          borrowers: facility.borrowers,
          totalCommitments: facility.total_commitments,
          currency: facility.currency,
          confidence: facility.extraction_confidence,
          createdAt: facility.created_at,
          covenantCount: covenantCount.count || 0,
          obligationCount: obligationCount.count || 0,
          esgCount: esgCount.count || 0,
        };
      })
    );

    return NextResponse.json<ApiResponse<typeof facilityList>>({
      success: true,
      data: facilityList,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// Helper function to fetch and format facility data for import
async function fetchFacilityForImport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: TypedSupabaseClient,
  facilityId: string
): Promise<ImportableFacilityData | null> {
  // Get facility data
  const { data: facility, error: facilityError } = await supabase
    .from('loan_facilities')
    .select('*')
    .eq('id', facilityId)
    .single();

  if (facilityError || !facility) {
    return null;
  }

  const documentId = facility.source_document_id;

  // Get document name
  let documentName = 'Unknown Document';
  if (documentId) {
    const { data: doc } = await supabase
      .from('loan_documents')
      .select('original_filename')
      .eq('id', documentId)
      .single();

    if (doc) {
      documentName = doc.original_filename;
    }
  }

  // Fetch all related extraction data
  const [covenants, obligations, esgProvisions] = await Promise.all([
    supabase
      .from('financial_covenants')
      .select('*')
      .eq('source_document_id', documentId),
    supabase
      .from('reporting_obligations')
      .select('*')
      .eq('source_document_id', documentId),
    supabase
      .from('esg_provisions')
      .select('*')
      .eq('source_document_id', documentId),
  ]);

  // Format extracted facility
  const extractedFacility: ExtractedFacility | null = facility ? {
    facilityName: facility.facility_name,
    facilityReference: facility.facility_reference ?? undefined,
    executionDate: facility.execution_date ?? undefined,
    effectiveDate: facility.effective_date ?? undefined,
    maturityDate: facility.maturity_date ?? undefined,
    borrowers: facility.borrowers as ExtractedFacility['borrowers'],
    lenders: facility.lenders as ExtractedFacility['lenders'],
    agents: facility.agents as ExtractedFacility['agents'],
    facilityType: facility.facility_type ?? undefined,
    currency: facility.currency ?? undefined,
    totalCommitments: facility.total_commitments ?? undefined,
    interestRateType: facility.interest_rate_type ?? undefined,
    baseRate: facility.base_rate ?? undefined,
    marginInitial: facility.margin_initial ?? undefined,
    marginGrid: facility.margin_grid as ExtractedFacility['marginGrid'],
    governingLaw: facility.governing_law ?? undefined,
    jurisdiction: facility.jurisdiction ?? undefined,
    confidence: facility.extraction_confidence,
  } : null;

  // Format covenants
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractedCovenants: ExtractedCovenant[] = (covenants.data || []).map((c: any) => ({
    covenantType: c.covenant_type,
    covenantName: c.covenant_name,
    numeratorDefinition: c.numerator_definition ?? undefined,
    denominatorDefinition: c.denominator_definition ?? undefined,
    thresholdType: c.threshold_type,
    thresholdValue: c.threshold_value ?? undefined,
    testingFrequency: c.testing_frequency ?? undefined,
    clauseReference: c.clause_reference ?? undefined,
    pageNumber: c.page_number ?? undefined,
    rawText: c.raw_text ?? undefined,
    confidence: c.extraction_confidence,
  }));

  // Format obligations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractedObligations: ExtractedObligation[] = (obligations.data || []).map((o: any) => ({
    obligationType: o.obligation_type,
    description: o.description ?? undefined,
    frequency: o.frequency ?? undefined,
    deadlineDays: o.deadline_days ?? undefined,
    recipientRole: o.recipient_role ?? undefined,
    clauseReference: o.clause_reference ?? undefined,
    pageNumber: o.page_number ?? undefined,
    rawText: o.raw_text ?? undefined,
    confidence: o.extraction_confidence,
  }));

  // Format ESG provisions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractedESG: ExtractedESG[] = (esgProvisions.data || []).map((p: any) => ({
    provisionType: p.provision_type,
    kpiName: p.kpi_name ?? undefined,
    kpiDefinition: p.kpi_definition ?? undefined,
    kpiBaseline: p.kpi_baseline ?? undefined,
    kpiTargets: p.kpi_targets as ExtractedESG['kpiTargets'],
    verificationRequired: p.verification_required ?? undefined,
    clauseReference: p.clause_reference ?? undefined,
    pageNumber: p.page_number ?? undefined,
    rawText: p.raw_text ?? undefined,
    confidence: p.extraction_confidence,
  }));

  // Format terms for deal creation
  const formattedTerms = formatTermsForDeal(extractedFacility, extractedCovenants, extractedObligations, extractedESG);

  return {
    facilityId,
    facilityName: facility.facility_name,
    documentId: documentId || '',
    documentName,
    extractedAt: facility.created_at,
    facility: extractedFacility,
    covenants: extractedCovenants,
    obligations: extractedObligations,
    esgProvisions: extractedESG,
    formattedTerms,
  };
}

// Helper to format extracted data into deal terms
function formatTermsForDeal(
  facility: ExtractedFacility | null,
  covenants: ExtractedCovenant[],
  obligations: ExtractedObligation[],
  esgProvisions: ExtractedESG[]
) {
  const facilityTerms: ImportableFacilityData['formattedTerms']['facilityTerms'] = [];
  const covenantTerms: ImportableFacilityData['formattedTerms']['covenantTerms'] = [];
  const obligationTerms: ImportableFacilityData['formattedTerms']['obligationTerms'] = [];
  const esgTerms: ImportableFacilityData['formattedTerms']['esgTerms'] = [];

  // Format facility terms
  if (facility) {
    if (facility.facilityName) {
      facilityTerms.push({
        termKey: 'facility_name',
        termLabel: 'Facility Name',
        valueType: 'text',
        currentValue: facility.facilityName,
        currentValueText: facility.facilityName,
      });
    }

    if (facility.totalCommitments) {
      facilityTerms.push({
        termKey: 'facility_amount',
        termLabel: 'Facility Amount',
        valueType: 'currency_amount',
        currentValue: facility.totalCommitments,
        currentValueText: `${facility.currency || 'USD'} ${facility.totalCommitments.toLocaleString()}`,
      });
    }

    if (facility.maturityDate) {
      facilityTerms.push({
        termKey: 'maturity_date',
        termLabel: 'Maturity Date',
        valueType: 'date',
        currentValue: facility.maturityDate,
        currentValueText: new Date(facility.maturityDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });
    }

    if (facility.facilityType) {
      facilityTerms.push({
        termKey: 'facility_type',
        termLabel: 'Facility Type',
        valueType: 'text',
        currentValue: facility.facilityType,
        currentValueText: facility.facilityType,
      });
    }

    if (facility.marginInitial !== undefined) {
      facilityTerms.push({
        termKey: 'margin',
        termLabel: 'Interest Margin',
        valueType: 'percentage',
        currentValue: facility.marginInitial,
        currentValueText: `${facility.marginInitial.toFixed(2)}%`,
      });
    }

    if (facility.baseRate) {
      facilityTerms.push({
        termKey: 'base_rate',
        termLabel: 'Base Rate',
        valueType: 'text',
        currentValue: facility.baseRate,
        currentValueText: facility.baseRate,
      });
    }

    if (facility.governingLaw) {
      facilityTerms.push({
        termKey: 'governing_law',
        termLabel: 'Governing Law',
        valueType: 'text',
        currentValue: facility.governingLaw,
        currentValueText: facility.governingLaw,
      });
    }
  }

  // Format covenant terms
  covenants.forEach((covenant, index) => {
    covenantTerms.push({
      termKey: `covenant_${covenant.covenantType.toLowerCase().replace(/\s+/g, '_')}_${index}`,
      termLabel: covenant.covenantName,
      valueType: covenant.thresholdValue !== undefined ? 'number' : 'text',
      currentValue: covenant.thresholdValue ?? covenant.thresholdType,
      currentValueText: covenant.thresholdValue !== undefined
        ? `${covenant.thresholdType} ${covenant.thresholdValue}${covenant.covenantType.includes('ratio') ? 'x' : ''}`
        : covenant.thresholdType,
      sourceClauseReference: covenant.clauseReference,
    });
  });

  // Format obligation terms
  obligations.forEach((obligation, index) => {
    obligationTerms.push({
      termKey: `obligation_${obligation.obligationType.toLowerCase().replace(/\s+/g, '_')}_${index}`,
      termLabel: `${obligation.obligationType} Reporting`,
      valueType: 'text',
      currentValue: {
        frequency: obligation.frequency,
        deadlineDays: obligation.deadlineDays,
        description: obligation.description,
      },
      currentValueText: obligation.frequency
        ? `${obligation.frequency}${obligation.deadlineDays ? ` (within ${obligation.deadlineDays} days)` : ''}`
        : obligation.description || 'See clause reference',
      sourceClauseReference: obligation.clauseReference,
    });
  });

  // Format ESG terms
  esgProvisions.forEach((esg, index) => {
    if (esg.kpiName) {
      esgTerms.push({
        termKey: `esg_${esg.provisionType.toLowerCase().replace(/\s+/g, '_')}_${index}`,
        termLabel: esg.kpiName,
        valueType: 'text',
        currentValue: {
          baseline: esg.kpiBaseline,
          targets: esg.kpiTargets,
          definition: esg.kpiDefinition,
        },
        currentValueText: esg.kpiBaseline !== undefined
          ? `Baseline: ${esg.kpiBaseline}`
          : esg.kpiDefinition || esg.provisionType,
        sourceClauseReference: esg.clauseReference,
      });
    }
  });

  return {
    facilityTerms,
    covenantTerms,
    obligationTerms,
    esgTerms,
  };
}
