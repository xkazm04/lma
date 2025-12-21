import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, ExtractionResult, LoanFacility, FinancialCovenant, ReportingObligation, EventOfDefault, ESGProvision, DefinedTerm } from '@/types';

// GET /api/documents/[id]/extraction - Get extraction results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get document
    const { data: document, error: docError } = await supabase
      .from('loan_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (docError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found',
        },
      }, { status: 404 });
    }

    // Get facility data
    const { data: facilityData } = await supabase
      .from('loan_facilities')
      .select('*')
      .eq('source_document_id', id)
      .maybeSingle();

    // Get covenants
    const { data: covenantsData } = await supabase
      .from('financial_covenants')
      .select('*')
      .eq('source_document_id', id);

    // Get obligations
    const { data: obligationsData } = await supabase
      .from('reporting_obligations')
      .select('*')
      .eq('source_document_id', id);

    // Get events of default
    const { data: eventsData } = await supabase
      .from('events_of_default')
      .select('*')
      .eq('source_document_id', id);

    // Get ESG provisions
    const { data: esgData } = await supabase
      .from('esg_provisions')
      .select('*')
      .eq('source_document_id', id);

    // Get defined terms
    const { data: termsData } = await supabase
      .from('defined_terms')
      .select('*')
      .eq('source_document_id', id);

    // Type assertions for proper typing
    const facility = facilityData as LoanFacility | null;
    const covenants = (covenantsData || []) as FinancialCovenant[];
    const obligations = (obligationsData || []) as ReportingObligation[];
    const eventsOfDefault = (eventsData || []) as EventOfDefault[];
    const esgProvisions = (esgData || []) as ESGProvision[];
    const definedTerms = (termsData || []) as DefinedTerm[];

    // Calculate overall confidence
    const confidences: number[] = [];
    if (facility?.extraction_confidence) confidences.push(facility.extraction_confidence);
    covenants.forEach(c => c.extraction_confidence && confidences.push(c.extraction_confidence));
    obligations.forEach(o => o.extraction_confidence && confidences.push(o.extraction_confidence));
    eventsOfDefault.forEach(e => e.extraction_confidence && confidences.push(e.extraction_confidence));
    esgProvisions.forEach(p => p.extraction_confidence && confidences.push(p.extraction_confidence));

    const overallConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    const result: ExtractionResult = {
      documentId: id,
      facility: facility ? {
        facilityName: facility.facility_name,
        facilityReference: facility.facility_reference ?? undefined,
        executionDate: facility.execution_date ?? undefined,
        effectiveDate: facility.effective_date ?? undefined,
        maturityDate: facility.maturity_date ?? undefined,
        borrowers: facility.borrowers as any,
        lenders: facility.lenders as any,
        agents: facility.agents as any,
        facilityType: facility.facility_type ?? undefined,
        currency: facility.currency ?? undefined,
        totalCommitments: facility.total_commitments ?? undefined,
        interestRateType: facility.interest_rate_type ?? undefined,
        baseRate: facility.base_rate ?? undefined,
        marginInitial: facility.margin_initial ?? undefined,
        marginGrid: facility.margin_grid as any,
        governingLaw: facility.governing_law ?? undefined,
        jurisdiction: facility.jurisdiction ?? undefined,
        confidence: facility.extraction_confidence,
      } : null,
      covenants: covenants.map(c => ({
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
      })),
      obligations: obligations.map(o => ({
        obligationType: o.obligation_type,
        description: o.description ?? undefined,
        frequency: o.frequency ?? undefined,
        deadlineDays: o.deadline_days ?? undefined,
        recipientRole: o.recipient_role ?? undefined,
        clauseReference: o.clause_reference ?? undefined,
        pageNumber: o.page_number ?? undefined,
        rawText: o.raw_text ?? undefined,
        confidence: o.extraction_confidence,
      })),
      eventsOfDefault: eventsOfDefault.map(e => ({
        eventCategory: e.event_category,
        description: e.description ?? undefined,
        gracePeriodDays: e.grace_period_days ?? undefined,
        cureRights: e.cure_rights ?? undefined,
        consequences: e.consequences ?? undefined,
        clauseReference: e.clause_reference ?? undefined,
        pageNumber: e.page_number ?? undefined,
        rawText: e.raw_text ?? undefined,
        confidence: e.extraction_confidence,
      })),
      esgProvisions: esgProvisions.map(p => ({
        provisionType: p.provision_type,
        kpiName: p.kpi_name ?? undefined,
        kpiDefinition: p.kpi_definition ?? undefined,
        kpiBaseline: p.kpi_baseline ?? undefined,
        kpiTargets: p.kpi_targets as any,
        verificationRequired: p.verification_required ?? undefined,
        clauseReference: p.clause_reference ?? undefined,
        pageNumber: p.page_number ?? undefined,
        rawText: p.raw_text ?? undefined,
        confidence: p.extraction_confidence,
      })),
      definedTerms: definedTerms.map(t => ({
        term: t.term,
        definition: t.definition,
        clauseReference: t.clause_reference ?? undefined,
        pageNumber: t.page_number ?? undefined,
        referencesTerms: t.references_terms ?? undefined,
      })),
      overallConfidence,
    };

    return NextResponse.json<ApiResponse<ExtractionResult>>({
      success: true,
      data: result,
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

// PUT /api/documents/[id]/extraction - Update extraction (manual corrections)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // This endpoint allows manual corrections to extraction results
    // Each correction updates the respective table

    const updates: string[] = [];

    if (body.facility) {
      const facilityUpdate = {
        ...body.facility,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('loan_facilities')
        .update(facilityUpdate)
        .eq('source_document_id', id);

      if (!error) updates.push('facility');
    }

    // TODO: Handle updates for covenants, obligations, etc.
    // These would require specific record IDs for targeted updates

    return NextResponse.json<ApiResponse<{ updated: string[] }>>({
      success: true,
      data: { updated: updates },
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
