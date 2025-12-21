import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import type {
  GetFolderSuggestionsRequest,
  GetFolderSuggestionsResponse,
  FolderSuggestion,
} from '@/app/features/documents/lib/types';

/**
 * POST /api/documents/folders/suggestions - Get AI folder suggestions for a document
 *
 * This endpoint analyzes document metadata and content to suggest appropriate folders
 * based on classification rules and extracted data.
 */
export async function POST(request: NextRequest) {
  try {
    const body: GetFolderSuggestionsRequest = await request.json();

    if (!body.documentId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Document ID is required',
          },
        },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // 1. Fetch the document from the database
    // 2. Get extracted data (borrower name, deal reference, etc.)
    // 3. Fetch all smart folders with classification rules
    // 4. Match document against rules
    // 5. Use LLM for additional context-based suggestions

    // Mock implementation with sample suggestions
    const suggestions: FolderSuggestion[] = [
      {
        folderId: 'folder-1',
        folderName: 'Project Apollo',
        folderPath: 'Project Apollo',
        confidence: 0.95,
        reasoning: 'Document appears to be related to Project Apollo based on filename and content analysis',
        matchedRules: [
          {
            ruleId: 'rule-1-1',
            fieldType: 'deal_reference',
            matchedValue: 'Apollo',
          },
        ],
        extractedData: {
          dealReference: 'Project Apollo',
          documentType: 'facility_agreement',
        },
      },
      {
        folderId: 'folder-1-1',
        folderName: 'Original Agreements',
        folderPath: 'Project Apollo / Original Agreements',
        confidence: 0.88,
        reasoning: 'Document type matches the "facility_agreement" classification for this folder',
        matchedRules: [
          {
            ruleId: 'rule-1-1-1',
            fieldType: 'document_type',
            matchedValue: 'facility_agreement',
          },
        ],
        extractedData: {
          documentType: 'facility_agreement',
        },
      },
    ];

    // Determine if auto-placement is recommended
    const topSuggestion = suggestions[0];
    const autoPlacementRecommended = topSuggestion && topSuggestion.confidence >= 0.9;

    const response: GetFolderSuggestionsResponse = {
      documentId: body.documentId,
      suggestions: suggestions.slice(0, body.maxSuggestions || 5),
      autoPlacementRecommended,
      recommendedFolderId: autoPlacementRecommended ? topSuggestion.folderId : undefined,
    };

    return NextResponse.json<ApiResponse<GetFolderSuggestionsResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
