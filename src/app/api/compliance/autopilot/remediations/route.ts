import { NextRequest, NextResponse } from 'next/server';
import { mockRemediationStrategies } from '@/app/features/compliance/sub_Autopilot/lib';

/**
 * GET /api/compliance/autopilot/remediations
 *
 * Returns remediation strategies, optionally filtered.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const predictionId = searchParams.get('prediction_id');
  const covenantId = searchParams.get('covenant_id');
  const status = searchParams.get('status');

  let remediations = mockRemediationStrategies;

  if (predictionId) {
    remediations = remediations.filter(r => r.prediction_id === predictionId);
  }

  if (covenantId) {
    remediations = remediations.filter(r => r.covenant_id === covenantId);
  }

  if (status) {
    remediations = remediations.filter(r => r.status === status);
  }

  return NextResponse.json({ remediations });
}

/**
 * POST /api/compliance/autopilot/remediations
 *
 * Generate new remediation strategies for a prediction.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prediction_id, strategy_types } = body;

    if (!prediction_id) {
      return NextResponse.json(
        { error: 'prediction_id is required' },
        { status: 400 }
      );
    }

    // In production, this would call the LLM to generate strategies
    return NextResponse.json({
      success: true,
      message: 'Remediation generation queued',
      job_id: `rem-job-${Date.now()}`,
      prediction_id,
      strategy_types: strategy_types || ['all'],
      estimated_completion: new Date(Date.now() + 30000).toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * PATCH /api/compliance/autopilot/remediations
 *
 * Update remediation status or step progress.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { remediation_id, step_number, status, completed_at, notes } = body;

    if (!remediation_id) {
      return NextResponse.json(
        { error: 'remediation_id is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      remediation_id,
      updated: {
        step_number,
        status,
        completed_at,
        notes,
        updated_at: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
