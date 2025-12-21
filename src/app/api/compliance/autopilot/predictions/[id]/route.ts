import { NextRequest, NextResponse } from 'next/server';
import {
  mockAutopilotPredictions,
  mockRemediationStrategies,
} from '@/app/features/compliance/sub_Autopilot/lib';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/compliance/autopilot/predictions/[id]
 *
 * Returns a specific prediction with its remediation strategies.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  const prediction = mockAutopilotPredictions.find(p => p.id === id);

  if (!prediction) {
    return NextResponse.json(
      { error: 'Prediction not found' },
      { status: 404 }
    );
  }

  const remediations = mockRemediationStrategies.filter(
    r => r.prediction_id === id
  );

  return NextResponse.json({
    prediction,
    remediations,
  });
}

/**
 * PATCH /api/compliance/autopilot/predictions/[id]
 *
 * Update prediction status or add notes.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  const prediction = mockAutopilotPredictions.find(p => p.id === id);

  if (!prediction) {
    return NextResponse.json(
      { error: 'Prediction not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { status, notes, reviewed_by } = body;

    return NextResponse.json({
      success: true,
      prediction_id: id,
      updated_fields: {
        status,
        notes,
        reviewed_by,
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
