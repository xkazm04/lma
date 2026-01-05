/**
 * Evolution Engine API - Suggestions endpoint
 *
 * GET: Get all amendment suggestions
 * POST: Generate new suggestion
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateMockAmendmentSuggestions,
  generateAmendmentSuggestion,
  generateMockMarketConditions,
  generateMockCovenantAnalysis,
} from '@/lib/llm/evolution-engine';
import type {
  AmendmentSuggestion,
  AmendmentSuggestionType,
} from '@/app/features/documents/sub_Evolution/lib/types';

// In-memory storage for demo (would be database in production)
const suggestionStore: AmendmentSuggestion[] = generateMockAmendmentSuggestions();

/**
 * GET /api/documents/evolution/suggestions
 * Returns all amendment suggestions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facilityId = searchParams.get('facilityId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');

    let filtered = [...suggestionStore];

    if (facilityId) {
      filtered = filtered.filter((s) => s.facilityId === facilityId);
    }

    if (status) {
      filtered = filtered.filter((s) => s.status === status);
    }

    if (priority) {
      filtered = filtered.filter((s) => s.priority === priority);
    }

    if (type) {
      filtered = filtered.filter((s) => s.type === type);
    }

    // Sort by priority (urgent first) then by creation date
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      data: {
        suggestions: filtered,
        total: filtered.length,
        meta: {
          byPriority: {
            urgent: filtered.filter((s) => s.priority === 'urgent').length,
            high: filtered.filter((s) => s.priority === 'high').length,
            medium: filtered.filter((s) => s.priority === 'medium').length,
            low: filtered.filter((s) => s.priority === 'low').length,
          },
          byStatus: {
            new: filtered.filter((s) => s.status === 'new').length,
            under_review: filtered.filter((s) => s.status === 'under_review').length,
            approved: filtered.filter((s) => s.status === 'approved').length,
            in_progress: filtered.filter((s) => s.status === 'in_progress').length,
            completed: filtered.filter((s) => s.status === 'completed').length,
            dismissed: filtered.filter((s) => s.status === 'dismissed').length,
          },
        },
      },
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_SUGGESTIONS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get suggestions',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/evolution/suggestions
 * Generate a new amendment suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      facilityId,
      documentId,
      suggestionType,
      facilityName,
      borrowerName,
      currentTerms,
      triggerDescription,
      customContext,
    } = body as {
      facilityId: string;
      documentId: string;
      suggestionType: AmendmentSuggestionType;
      facilityName: string;
      borrowerName: string;
      currentTerms: Record<string, unknown>;
      triggerDescription?: string;
      customContext?: Record<string, unknown>;
    };

    if (!facilityId || !documentId || !suggestionType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'facilityId, documentId, and suggestionType are required',
          },
        },
        { status: 400 }
      );
    }

    // Generate market conditions and covenant analysis for context
    const marketConditions = generateMockMarketConditions();
    const covenantAnalysis = generateMockCovenantAnalysis().filter(
      (c) => c.facilityId === facilityId
    );

    // Create trigger from description if provided
    const triggers = triggerDescription
      ? [
          {
            type: 'market_condition' as const,
            description: triggerDescription,
            source: 'Manual trigger',
            triggeredAt: new Date().toISOString(),
          },
        ]
      : [];

    // Generate suggestion using LLM
    const suggestionData = await generateAmendmentSuggestion(facilityId, documentId, suggestionType, {
      facilityName: facilityName || 'Unknown Facility',
      borrowerName: borrowerName || 'Unknown Borrower',
      currentTerms: currentTerms || {},
      triggers,
      marketConditions,
      covenantAnalysis,
      additionalContext: customContext ? JSON.stringify(customContext) : undefined,
    });

    // Create full suggestion object
    const newSuggestion: AmendmentSuggestion = {
      ...suggestionData,
      id: `sug-${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to store
    suggestionStore.push(newSuggestion);

    return NextResponse.json({
      success: true,
      data: newSuggestion,
    });
  } catch (error) {
    console.error('Generate suggestion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GENERATE_SUGGESTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate suggestion',
        },
      },
      { status: 500 }
    );
  }
}
