import { NextRequest, NextResponse } from 'next/server';
import { generateAmendmentDraft, amendmentToMarkdown, amendmentToText } from '@/lib/llm/amendment';
import type { GenerateAmendmentRequest, GenerateAmendmentResponse, AmendmentExportFormat } from '@/app/features/documents/sub_Compare/lib/amendment-types';
import type { ComparisonResult } from '@/types';

/**
 * POST /api/documents/amendment
 * Generate an amendment draft from a comparison result
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateAmendmentResponse>> {
  try {
    const body = await request.json() as GenerateAmendmentRequest;

    // Validate the comparison result
    if (!body.comparisonResult) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'comparisonResult is required',
          },
        },
        { status: 400 }
      );
    }

    const { comparisonResult, options } = body;

    // Validate there are differences to generate amendment from
    if (!comparisonResult.differences || comparisonResult.differences.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_CHANGES',
            message: 'No differences found to generate amendment from',
          },
        },
        { status: 400 }
      );
    }

    // Generate the amendment draft
    const draft = await generateAmendmentDraft(comparisonResult, options);

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (error) {
    console.error('Error generating amendment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate amendment',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/amendment/export
 * Export an amendment draft in various formats
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const draftJson = searchParams.get('draft');
    const format = (searchParams.get('format') || 'markdown') as AmendmentExportFormat;

    if (!draftJson) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'draft parameter is required',
          },
        },
        { status: 400 }
      );
    }

    const draft = JSON.parse(decodeURIComponent(draftJson));

    let content: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'markdown':
        content = amendmentToMarkdown(draft);
        contentType = 'text/markdown';
        filename = `amendment-${draft.id}.md`;
        break;
      case 'text':
        content = amendmentToText(draft);
        contentType = 'text/plain';
        filename = `amendment-${draft.id}.txt`;
        break;
      case 'docx':
      case 'pdf':
        // For now, return markdown with a note about future format support
        content = amendmentToMarkdown(draft);
        contentType = 'text/markdown';
        filename = `amendment-${draft.id}.md`;
        break;
      default:
        content = amendmentToMarkdown(draft);
        contentType = 'text/markdown';
        filename = `amendment-${draft.id}.md`;
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting amendment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to export amendment',
        },
      },
      { status: 500 }
    );
  }
}
