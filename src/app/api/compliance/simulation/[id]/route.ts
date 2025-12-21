import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  savedScenarios,
  simulationResults,
  scenarioComments,
} from '@/app/features/compliance/sub_SimulationSandbox/lib';

// =============================================================================
// Validation Schemas
// =============================================================================

const updateScenarioSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  is_shared: z.boolean().optional(),
  collaborators: z.array(z.string()).optional(),
  notes: z.string().max(5000).optional(),
});

const addCommentSchema = z.object({
  text: z.string().min(1).max(2000),
  parent_id: z.string().optional(),
});

// =============================================================================
// GET - Get scenario details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') ?? [];

    const scenario = savedScenarios.find(s => s.id === id);
    if (!scenario) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    const response: Record<string, unknown> = { scenario };

    if (include.includes('results')) {
      response.results = simulationResults.filter(r => r.scenario_id === id);
    }

    if (include.includes('comments')) {
      response.comments = scenarioComments.filter(c => c.scenario_id === id);
    }

    if (include.includes('versions')) {
      // In production, would fetch all versions with same parent_id
      response.versions = [scenario];
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT - Update scenario
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = updateScenarioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid update data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const scenario = savedScenarios.find(s => s.id === id);
    if (!scenario) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // In production, update in database
    const updatedScenario = {
      ...scenario,
      ...parsed.data,
      modified_at: new Date().toISOString(),
      version: scenario.version + 1,
    };

    return NextResponse.json({
      success: true,
      data: updatedScenario,
    });
  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete scenario
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scenario = savedScenarios.find(s => s.id === id);
    if (!scenario) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // In production, delete from database (or soft delete)
    return NextResponse.json({
      success: true,
      message: 'Scenario deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Add comment to scenario
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'comment') {
      const body = await request.json();
      const parsed = addCommentSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid comment data', details: parsed.error.issues },
          { status: 400 }
        );
      }

      const scenario = savedScenarios.find(s => s.id === id);
      if (!scenario) {
        return NextResponse.json(
          { success: false, error: 'Scenario not found' },
          { status: 404 }
        );
      }

      const newComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        scenario_id: id,
        author: 'current.user@example.com', // Would come from auth
        text: parsed.data.text,
        created_at: new Date().toISOString(),
        parent_id: parsed.data.parent_id,
        is_resolved: false,
      };

      return NextResponse.json({
        success: true,
        data: newComment,
      });
    }

    if (action === 'clone') {
      const scenario = savedScenarios.find(s => s.id === id);
      if (!scenario) {
        return NextResponse.json(
          { success: false, error: 'Scenario not found' },
          { status: 404 }
        );
      }

      const clonedScenario = {
        ...scenario,
        id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${scenario.name} (Copy)`,
        parent_id: scenario.id,
        version: 1,
        created_by: 'current.user@example.com',
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        status: 'draft' as const,
      };

      return NextResponse.json({
        success: true,
        data: clonedScenario,
      });
    }

    if (action === 'run') {
      const scenario = savedScenarios.find(s => s.id === id);
      if (!scenario) {
        return NextResponse.json(
          { success: false, error: 'Scenario not found' },
          { status: 404 }
        );
      }

      // Simulate running the scenario
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockResult = {
        ...simulationResults[0],
        id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        scenario_id: id,
        scenario_name: scenario.name,
        run_at: new Date().toISOString(),
        runtime_ms: 500 + Math.floor(Math.random() * 2000),
      };

      return NextResponse.json({
        success: true,
        data: mockResult,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing scenario action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
