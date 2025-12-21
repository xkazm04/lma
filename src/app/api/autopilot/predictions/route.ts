/**
 * Autopilot Predictions API
 *
 * Endpoints for generating and managing breach predictions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateBreachPrediction, generateRemediationStrategies } from '@/lib/llm/autopilot-prediction';
import { generateInterventionPlan } from '@/lib/llm/autopilot-intervention';
import { mockBreachPredictions } from '@/app/features/dashboard/lib/mocks';

/**
 * GET /api/autopilot/predictions
 *
 * Fetch all predictions or a specific prediction by ID.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const predictionId = searchParams.get('id');
    const riskLevel = searchParams.get('riskLevel');
    const borrowerId = searchParams.get('borrowerId');
    const sortBy = searchParams.get('sortBy') || 'daysUntilBreach';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Return single prediction if ID provided
    if (predictionId) {
      const prediction = mockBreachPredictions.find((p) => p.id === predictionId);
      if (!prediction) {
        return NextResponse.json(
          { success: false, error: `Prediction not found: ${predictionId}` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: prediction,
      });
    }

    // Filter predictions
    let predictions = [...mockBreachPredictions];

    if (riskLevel) {
      predictions = predictions.filter((p) => p.riskLevel === riskLevel);
    }

    if (borrowerId) {
      predictions = predictions.filter((p) => p.borrowerId === borrowerId);
    }

    // Sort predictions
    predictions.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'daysUntilBreach':
          comparison = a.daysUntilBreach - b.daysUntilBreach;
          break;
        case 'breachProbability':
          comparison = a.breachProbability - b.breachProbability;
          break;
        case 'riskLevel':
          const riskOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = a.daysUntilBreach - b.daysUntilBreach;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Paginate
    const total = predictions.length;
    predictions = predictions.slice(offset, offset + limit);

    // Calculate stats
    const stats = {
      total,
      byRiskLevel: {
        critical: mockBreachPredictions.filter((p) => p.riskLevel === 'critical').length,
        high: mockBreachPredictions.filter((p) => p.riskLevel === 'high').length,
        medium: mockBreachPredictions.filter((p) => p.riskLevel === 'medium').length,
        low: mockBreachPredictions.filter((p) => p.riskLevel === 'low').length,
      },
      avgDaysUntilBreach: Math.round(
        mockBreachPredictions.reduce((sum, p) => sum + p.daysUntilBreach, 0) /
          mockBreachPredictions.length
      ),
      avgBreachProbability: Math.round(
        mockBreachPredictions.reduce((sum, p) => sum + p.breachProbability, 0) /
          mockBreachPredictions.length
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        stats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('[Predictions API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch predictions',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/autopilot/predictions
 *
 * Generate new predictions or request analysis for specific covenants.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'generate_prediction': {
        const { covenantId, covenantData, facilityData, borrowerData, signals } = body;

        // In production, this would use real data
        // For now, we'll use the mock data structure
        const input = {
          covenant: covenantData || {
            id: covenantId,
            name: 'Debt/EBITDA',
            type: 'financial',
            threshold: 4.0,
            threshold_type: 'maximum' as const,
            current_value: 3.8,
            headroom_percentage: 5,
            test_history: [],
          },
          facility: facilityData || {
            id: 'fac-001',
            name: 'Term Loan A',
            type: 'term_loan',
            commitment: 50000000,
            maturity_date: '2027-12-31',
          },
          borrower: borrowerData || {
            id: 'bor-001',
            name: 'Sample Borrower',
            industry: 'Manufacturing',
          },
          signals: signals || {},
        };

        const prediction = await generateBreachPrediction(input);

        return NextResponse.json({
          success: true,
          data: prediction,
          message: 'Prediction generated successfully',
        });
      }

      case 'generate_remediation': {
        const { predictionId } = body;
        const prediction = mockBreachPredictions.find((p) => p.id === predictionId);

        if (!prediction) {
          return NextResponse.json(
            { success: false, error: `Prediction not found: ${predictionId}` },
            { status: 404 }
          );
        }

        // Convert to the format expected by generateRemediationStrategies
        const input = {
          covenant: {
            id: prediction.covenantId,
            name: prediction.covenantName,
            type: prediction.covenantType,
            threshold: prediction.threshold,
            threshold_type: 'maximum' as const,
            current_value: prediction.currentValue,
            headroom_percentage: prediction.headroomPercent,
            test_history: [],
          },
          facility: {
            id: prediction.facilityId,
            name: prediction.facilityName,
            type: 'term_loan',
            commitment: 50000000,
            maturity_date: '2027-12-31',
          },
          borrower: {
            id: prediction.borrowerId,
            name: prediction.borrowerName,
            industry: 'Manufacturing',
          },
          signals: {},
        };

        const predictionOutput = {
          breach_probability_6m: prediction.breachProbability,
          breach_probability_9m: prediction.breachProbability + 5,
          breach_probability_12m: prediction.breachProbability + 10,
          overall_risk_level: prediction.riskLevel,
          confidence_score: prediction.confidenceScore,
          projected_breach_quarter: null,
          contributing_factors: prediction.contributingFactors.map((f) => ({
            factor: f.factor,
            impact: f.impact,
            weight: f.weight,
            description: f.description,
          })),
          quarterly_projections: [],
          leading_indicators: prediction.leadingIndicators.map((i) => ({
            name: i.name,
            status: i.status,
            description: i.description,
          })),
          root_causes: prediction.contributingFactors
            .filter((f) => f.impact === 'negative')
            .map((f) => ({
              cause: f.factor,
              contribution: Math.round(f.weight * 100),
              addressable: true,
              recommended_action: `Address ${f.factor.toLowerCase()}`,
            })),
          summary: prediction.aiSummary,
          key_risks: prediction.recommendedActions.slice(0, 3),
          immediate_actions: prediction.recommendedActions,
        };

        const strategies = await generateRemediationStrategies(input, predictionOutput);

        return NextResponse.json({
          success: true,
          data: strategies,
          message: 'Remediation strategies generated',
        });
      }

      case 'generate_intervention_plan': {
        const { predictionId, portfolioContext } = body;
        const prediction = mockBreachPredictions.find((p) => p.id === predictionId);

        if (!prediction) {
          return NextResponse.json(
            { success: false, error: `Prediction not found: ${predictionId}` },
            { status: 404 }
          );
        }

        const plan = await generateInterventionPlan({
          prediction,
          portfolioContext: portfolioContext || {
            totalExposure: 50000000,
            relationshipLength: 5,
            previousWaivers: 0,
            creditRating: 'BBB',
            lenderSentiment: 'neutral',
          },
        });

        return NextResponse.json({
          success: true,
          data: plan,
          message: 'Intervention plan generated',
        });
      }

      case 'run_portfolio_scan': {
        // Simulate running a full portfolio scan
        return NextResponse.json({
          success: true,
          data: {
            scanId: `scan-${Date.now()}`,
            startedAt: new Date().toISOString(),
            covenantsToAnalyze: 48,
            estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          },
          message: 'Portfolio scan initiated',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Predictions API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process prediction request',
      },
      { status: 500 }
    );
  }
}
