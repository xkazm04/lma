/**
 * Evolution Engine API - Individual Suggestion endpoint
 *
 * GET: Get specific suggestion by ID
 * PATCH: Update suggestion status
 * DELETE: Dismiss/delete suggestion
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMockAmendmentSuggestions } from '@/lib/llm/evolution-engine';
import type { AmendmentSuggestion } from '@/app/features/documents/sub_Evolution/lib/types';

// In-memory storage (shared with parent route in production)
let suggestionStore: AmendmentSuggestion[] = generateMockAmendmentSuggestions();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/evolution/suggestions/[id]
 * Returns a specific amendment suggestion
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const suggestion = suggestionStore.find((s) => s.id === id);

    if (!suggestion) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Suggestion with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    console.error('Get suggestion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_SUGGESTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get suggestion',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/evolution/suggestions/[id]
 * Update suggestion status or properties
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, priority, notes } = body;

    const suggestionIndex = suggestionStore.findIndex((s) => s.id === id);

    if (suggestionIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Suggestion with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    // Update the suggestion
    const updatedSuggestion: AmendmentSuggestion = {
      ...suggestionStore[suggestionIndex],
      ...(status && { status }),
      ...(priority && { priority }),
      updatedAt: new Date().toISOString(),
    };

    suggestionStore[suggestionIndex] = updatedSuggestion;

    return NextResponse.json({
      success: true,
      data: updatedSuggestion,
      meta: {
        notes,
        previousStatus: suggestionStore[suggestionIndex].status,
      },
    });
  } catch (error) {
    console.error('Update suggestion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_SUGGESTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update suggestion',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/evolution/suggestions/[id]
 * Dismiss or delete a suggestion
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hardDelete') === 'true';

    const suggestionIndex = suggestionStore.findIndex((s) => s.id === id);

    if (suggestionIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Suggestion with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Remove from store
      suggestionStore = suggestionStore.filter((s) => s.id !== id);
      return NextResponse.json({
        success: true,
        data: {
          id,
          deleted: true,
        },
      });
    } else {
      // Soft delete - mark as dismissed
      suggestionStore[suggestionIndex] = {
        ...suggestionStore[suggestionIndex],
        status: 'dismissed',
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: suggestionStore[suggestionIndex],
      });
    }
  } catch (error) {
    console.error('Delete suggestion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_SUGGESTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete suggestion',
        },
      },
      { status: 500 }
    );
  }
}
