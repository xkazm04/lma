import { NextRequest, NextResponse } from 'next/server';
import { generateESGPredictions, generateWhatIfScenario } from '@/lib/llm/esg';
import type { ESGLoanType, KPICategory } from '@/app/features/esg/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, facility, kpis, prediction_horizon_days, scenario_context } = body;

    if (action === 'predict') {
      if (!facility || !kpis || !Array.isArray(kpis)) {
        return NextResponse.json(
          { error: 'Missing required fields: facility, kpis' },
          { status: 400 }
        );
      }

      const predictionContext = {
        facility: {
          facility_id: facility.id || facility.facility_id,
          facility_name: facility.facility_name,
          borrower_name: facility.borrower_name,
          borrower_industry: facility.borrower_industry || 'General',
          esg_loan_type: facility.esg_loan_type as ESGLoanType,
          commitment_amount: facility.commitment_amount,
          outstanding_amount: facility.outstanding_amount,
          base_margin_bps: facility.base_margin_bps,
          current_margin_bps: facility.current_margin_bps,
          max_margin_adjustment_bps: facility.max_margin_adjustment_bps,
        },
        kpis: kpis.map((kpi: {
          id?: string;
          kpi_id?: string;
          kpi_name: string;
          kpi_category: KPICategory;
          unit: string;
          baseline_value: number;
          baseline_year: number;
          current_value: number;
          weight: number;
          targets: Array<{
            target_year: number;
            target_value: number;
            target_status: string;
            actual_value?: number;
          }>;
          historical_data?: Array<{
            period: string;
            value: number;
          }>;
        }) => ({
          kpi_id: kpi.id || kpi.kpi_id || `kpi-${Math.random().toString(36).slice(2)}`,
          kpi_name: kpi.kpi_name,
          kpi_category: kpi.kpi_category,
          unit: kpi.unit,
          baseline_value: kpi.baseline_value,
          baseline_year: kpi.baseline_year,
          current_value: kpi.current_value,
          weight: kpi.weight,
          targets: kpi.targets || [],
          historical_data: kpi.historical_data || [],
        })),
        prediction_horizon_days: prediction_horizon_days || 90,
      };

      const prediction = await generateESGPredictions(predictionContext);

      return NextResponse.json({
        success: true,
        prediction,
      });
    }

    if (action === 'what-if') {
      if (!scenario_context) {
        return NextResponse.json(
          { error: 'Missing required field: scenario_context' },
          { status: 400 }
        );
      }

      const scenario = await generateWhatIfScenario(scenario_context);

      return NextResponse.json({
        success: true,
        scenario,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "predict" or "what-if"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'ESG Predictions API',
    endpoints: {
      POST: {
        actions: ['predict', 'what-if'],
        description: 'Generate AI-powered predictions for ESG KPI performance and margin impacts',
      },
    },
  });
}
