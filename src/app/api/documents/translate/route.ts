import { NextRequest, NextResponse } from 'next/server';
import {
  translationRequestSchema,
  covenantTranslationRequestSchema,
  obligationTranslationRequestSchema,
  facilityTermTranslationRequestSchema,
  batchTranslationRequestSchema,
  precedentAnalysisRequestSchema,
  exportTranslationRequestSchema,
} from '@/lib/validations/document-translation';
import {
  translateStructuredData,
  translateCovenant,
  translateObligation,
  translateFacilityTerm,
  translateBatch,
  analyzePrecedentStyle,
  clauseToMarkdown,
  batchToDocument,
} from '@/lib/llm/document-translation';
import type { ExtractedCovenant, ExtractedObligation } from '@/types';

/**
 * POST /api/documents/translate
 *
 * Translates structured data back into legal document language.
 * Supports single clause translation, batch translation, and precedent analysis.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'translate-clause':
        return handleTranslateClause(body);
      case 'translate-covenant':
        return handleTranslateCovenant(body);
      case 'translate-obligation':
        return handleTranslateObligation(body);
      case 'translate-facility-term':
        return handleTranslateFacilityTerm(body);
      case 'translate-batch':
        return handleTranslateBatch(body);
      case 'analyze-precedent':
        return handleAnalyzePrecedent(body);
      case 'export':
        return handleExport(body);
      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: `Invalid action: ${action}. Valid actions: translate-clause, translate-covenant, translate-obligation, translate-facility-term, translate-batch, analyze-precedent, export`,
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Document translation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TRANSLATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Handle generic clause translation
 */
async function handleTranslateClause(body: Record<string, unknown>) {
  const parseResult = translationRequestSchema.safeParse(body.data);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid translation request',
          details: parseResult.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const translatedClause = await translateStructuredData(parseResult.data);

  return NextResponse.json({
    success: true,
    data: translatedClause,
  });
}

/**
 * Handle covenant-specific translation
 */
async function handleTranslateCovenant(body: Record<string, unknown>) {
  const parseResult = covenantTranslationRequestSchema.safeParse(body.data);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid covenant translation request',
          details: parseResult.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const { documentContext, precedentClauses, ...covenantData } = parseResult.data;

  // Convert to ExtractedCovenant format
  const covenant: ExtractedCovenant = {
    covenantName: covenantData.covenantName,
    covenantType: covenantData.covenantType,
    thresholdType: covenantData.thresholdType,
    thresholdValue: covenantData.thresholdValue,
    testingFrequency: covenantData.testingFrequency,
    numeratorDefinition: covenantData.numeratorDefinition,
    denominatorDefinition: covenantData.denominatorDefinition,
    confidence: 1.0, // User-provided data has full confidence
  };

  const translatedClause = await translateCovenant(covenant, documentContext, precedentClauses);

  return NextResponse.json({
    success: true,
    data: translatedClause,
  });
}

/**
 * Handle obligation-specific translation
 */
async function handleTranslateObligation(body: Record<string, unknown>) {
  const parseResult = obligationTranslationRequestSchema.safeParse(body.data);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid obligation translation request',
          details: parseResult.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const { documentContext, precedentClauses, ...obligationData } = parseResult.data;

  // Convert to ExtractedObligation format
  const obligation: ExtractedObligation = {
    obligationType: obligationData.obligationType,
    description: obligationData.description,
    frequency: obligationData.frequency,
    deadlineDays: obligationData.deadlineDays,
    recipientRole: obligationData.recipientRole,
    confidence: 1.0, // User-provided data has full confidence
  };

  const translatedClause = await translateObligation(obligation, documentContext, precedentClauses);

  return NextResponse.json({
    success: true,
    data: translatedClause,
  });
}

/**
 * Handle facility term translation
 */
async function handleTranslateFacilityTerm(body: Record<string, unknown>) {
  const parseResult = facilityTermTranslationRequestSchema.safeParse(body.data);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid facility term translation request',
          details: parseResult.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const { termName, termValue, termType, documentContext, precedentClauses } = parseResult.data;

  const translatedClause = await translateFacilityTerm(
    termName,
    termValue,
    termType,
    documentContext,
    precedentClauses
  );

  return NextResponse.json({
    success: true,
    data: translatedClause,
  });
}

/**
 * Handle batch translation
 */
async function handleTranslateBatch(body: Record<string, unknown>) {
  const parseResult = batchTranslationRequestSchema.safeParse(body.data);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid batch translation request',
          details: parseResult.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const batchResponse = await translateBatch(parseResult.data);

  return NextResponse.json({
    success: true,
    data: batchResponse,
  });
}

/**
 * Handle precedent style analysis
 */
async function handleAnalyzePrecedent(body: Record<string, unknown>) {
  const parseResult = precedentAnalysisRequestSchema.safeParse(body.data);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid precedent analysis request',
          details: parseResult.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const { precedentClauses, clauseType } = parseResult.data;

  const analysis = await analyzePrecedentStyle(precedentClauses, clauseType);

  return NextResponse.json({
    success: true,
    data: analysis,
  });
}

/**
 * Handle export of translated clauses
 */
async function handleExport(body: Record<string, unknown>) {
  const parseResult = exportTranslationRequestSchema.safeParse(body.data);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid export request',
          details: parseResult.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const { clauses, format, documentTitle, effectiveDate, includeMetrics } = parseResult.data;

  let content: string;

  switch (format) {
    case 'markdown':
      content = batchToDocument(
        {
          translatedClauses: clauses,
          metrics: {
            averageConfidence: clauses.reduce((sum, c) => sum + c.confidence, 0) / clauses.length,
            totalClauses: clauses.length,
            warningsCount: clauses.reduce((sum, c) => sum + (c.warnings?.length ?? 0), 0),
          },
        },
        documentTitle,
        effectiveDate
      );
      break;

    case 'text':
      content = clauses.map((clause) => {
        let text = `${clause.clauseTitle}\n`;
        text += `${'='.repeat(clause.clauseTitle.length)}\n\n`;
        text += `${clause.clauseText}\n\n`;
        if (clause.warnings?.length) {
          text += `Notes: ${clause.warnings.join('; ')}\n`;
        }
        text += `---\n\n`;
        return text;
      }).join('');
      break;

    case 'json':
      content = JSON.stringify({
        documentTitle,
        effectiveDate,
        clauses,
        metrics: includeMetrics ? {
          averageConfidence: clauses.reduce((sum, c) => sum + c.confidence, 0) / clauses.length,
          totalClauses: clauses.length,
          warningsCount: clauses.reduce((sum, c) => sum + (c.warnings?.length ?? 0), 0),
        } : undefined,
      }, null, 2);
      break;

    default:
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNSUPPORTED_FORMAT',
            message: `Export format '${format}' is not yet supported. Available formats: markdown, text, json`,
          },
        },
        { status: 400 }
      );
  }

  return NextResponse.json({
    success: true,
    data: {
      content,
      format,
      filename: `${documentTitle.toLowerCase().replace(/\s+/g, '-')}.${format === 'markdown' ? 'md' : format}`,
    },
  });
}
