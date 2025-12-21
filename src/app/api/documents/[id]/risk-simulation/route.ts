import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import {
  simulateRiskScenario,
  PREDEFINED_SCENARIOS,
  type RiskScenarioSimulationResult,
  type CovenantInput,
  type ObligationInput,
  type FacilityInput,
} from '@/lib/llm/risk-scenario-simulation';
import { runSimulationRequestSchema } from '@/lib/validations/risk-scenario';

export interface RiskSimulationResponse {
  simulation: RiskScenarioSimulationResult;
}

export interface PredefinedScenariosResponse {
  scenarios: typeof PREDEFINED_SCENARIOS;
}

// GET /api/documents/[id]/risk-simulation - Get available predefined scenarios
export async function GET() {
  return NextResponse.json<ApiResponse<PredefinedScenariosResponse>>({
    success: true,
    data: { scenarios: PREDEFINED_SCENARIOS },
  });
}

// POST /api/documents/[id]/risk-simulation - Run a risk scenario simulation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Validate request
    const validationResult = runSimulationRequestSchema.safeParse({
      ...body,
      documentId: id,
    });

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationResult.error.issues.map(e => e.message).join(', '),
        },
      }, { status: 400 });
    }

    // Get document with extracted text
    const { data: document, error: docError } = await supabase
      .from('loan_documents')
      .select('id, original_filename, document_type, extracted_text')
      .eq('id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found',
        },
      }, { status: 404 });
    }

    // Determine scenario to run
    let scenario;
    const validatedData = validationResult.data;

    if (validatedData.scenarioType === 'predefined' && validatedData.predefinedScenarioId) {
      const predefined = PREDEFINED_SCENARIOS.find(
        s => s.scenarioId === validatedData.predefinedScenarioId
      );
      if (!predefined) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'INVALID_SCENARIO',
            message: 'Predefined scenario not found',
          },
        }, { status: 400 });
      }
      scenario = predefined;
    } else if (validatedData.scenarioType === 'custom' && validatedData.customScenario) {
      scenario = {
        scenarioId: `custom-${Date.now()}`,
        scenarioName: validatedData.customScenario.scenarioName,
        scenarioDescription: validatedData.customScenario.scenarioDescription || '',
        category: 'custom' as const,
        stressParameters: validatedData.customScenario.stressParameters.map(sp => ({
          metric: sp.metric,
          changePercentage: sp.changePercentage,
          description: sp.description || '',
        })),
      };
    } else {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'INVALID_SCENARIO',
          message: 'No valid scenario provided',
        },
      }, { status: 400 });
    }

    // Build mock facility, covenants, and obligations data for demo
    // In production, this would come from extracted data in the database
    const facility: FacilityInput = {
      facilityName: 'Project Apollo Senior Secured Term Loan Facility',
      totalCommitments: 500000000,
      maturityDate: '2029-11-20',
      interestRateType: 'floating',
      baseRate: 'SOFR',
      marginInitial: 3.25,
      borrowerName: 'Apollo Holdings Inc.',
    };

    const covenants: CovenantInput[] = [
      {
        id: 'cov-1',
        covenantType: 'leverage_ratio',
        covenantName: 'Maximum Total Leverage Ratio',
        thresholdType: 'maximum',
        thresholdValue: 4.5,
        testFrequency: 'quarterly',
        calculationMethodology: 'Consolidated Total Indebtedness / Consolidated EBITDA for trailing four quarters',
        numeratorDefinition: 'Consolidated Total Indebtedness',
        denominatorDefinition: 'Consolidated EBITDA for four consecutive fiscal quarters',
      },
      {
        id: 'cov-2',
        covenantType: 'interest_coverage',
        covenantName: 'Minimum Interest Coverage Ratio',
        thresholdType: 'minimum',
        thresholdValue: 3.0,
        testFrequency: 'quarterly',
        calculationMethodology: 'Consolidated EBITDA / Consolidated Interest Expense for trailing four quarters',
        numeratorDefinition: 'Consolidated EBITDA for four consecutive fiscal quarters',
        denominatorDefinition: 'Consolidated Interest Expense for such period',
      },
      {
        id: 'cov-3',
        covenantType: 'leverage_ratio',
        covenantName: 'Maximum Senior Secured Leverage Ratio',
        thresholdType: 'maximum',
        thresholdValue: 3.0,
        testFrequency: 'quarterly',
        calculationMethodology: 'Consolidated Senior Secured Indebtedness / Consolidated EBITDA',
        numeratorDefinition: 'Consolidated Senior Secured Indebtedness',
        denominatorDefinition: 'Consolidated EBITDA for four consecutive fiscal quarters',
      },
      {
        id: 'cov-4',
        covenantType: 'fixed_charge_coverage',
        covenantName: 'Minimum Fixed Charge Coverage Ratio',
        thresholdType: 'minimum',
        thresholdValue: 1.25,
        testFrequency: 'quarterly',
        calculationMethodology: '(EBITDA - Unfinanced CapEx - Cash Taxes) / Fixed Charges',
        numeratorDefinition: 'Consolidated EBITDA minus Unfinanced Capital Expenditures minus cash taxes',
        denominatorDefinition: 'Fixed Charges (principal + interest + restricted payments + capital leases)',
      },
      {
        id: 'cov-5',
        covenantType: 'capex',
        covenantName: 'Maximum Annual Capital Expenditures',
        thresholdType: 'maximum',
        thresholdValue: 50000000,
        testFrequency: 'annually',
        calculationMethodology: 'Total Capital Expenditures for fiscal year',
        numeratorDefinition: 'Capital Expenditures',
        denominatorDefinition: 'N/A - absolute limit',
      },
    ];

    const obligations: ObligationInput[] = [
      {
        id: 'obl-1',
        obligationType: 'annual_financials',
        description: 'Audited annual financial statements',
        frequency: 'annual',
        deadlineDays: 90,
        triggerCondition: 'Fiscal year end',
      },
      {
        id: 'obl-2',
        obligationType: 'quarterly_financials',
        description: 'Quarterly unaudited financial statements',
        frequency: 'quarterly',
        deadlineDays: 45,
        triggerCondition: 'Quarter end',
      },
      {
        id: 'obl-3',
        obligationType: 'compliance_certificate',
        description: 'Compliance certificate with covenant calculations',
        frequency: 'quarterly',
        deadlineDays: 45,
        triggerCondition: 'Quarter end',
      },
    ];

    // Default financials if not provided
    const currentFinancials = validatedData.currentFinancials || {
      ebitda: 100000000,
      totalDebt: 400000000,
      interestExpense: 20000000,
      cashBalance: 50000000,
      netWorth: 150000000,
      capitalExpenditure: 35000000,
      fixedCharges: 40000000,
    };

    // Run simulation
    const simulation = await simulateRiskScenario({
      facility,
      covenants,
      obligations,
      scenario,
      currentFinancials,
    });

    return NextResponse.json<ApiResponse<RiskSimulationResponse>>({
      success: true,
      data: { simulation },
    });
  } catch (error) {
    console.error('Risk simulation error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'SIMULATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to run risk simulation',
      },
    }, { status: 500 });
  }
}
