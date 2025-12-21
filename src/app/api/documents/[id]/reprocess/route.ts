import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, LoanDocument } from '@/types';

// POST /api/documents/[id]/reprocess - Trigger document reprocessing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get document
    const { data: document, error: fetchError } = await supabase
      .from('loan_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found',
        },
      }, { status: 404 });
    }

    // Update status to pending
    const { data: updatedDocument, error: updateError } = await supabase
      .from('loan_documents')
      .update({
        processing_status: 'pending',
        extraction_version: (document.extraction_version || 0) + 1,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: updateError.message,
        },
      }, { status: 500 });
    }

    // Delete existing extraction data for re-extraction
    await Promise.all([
      supabase.from('loan_facilities').delete().eq('source_document_id', id),
      supabase.from('financial_covenants').delete().eq('source_document_id', id),
      supabase.from('reporting_obligations').delete().eq('source_document_id', id),
      supabase.from('events_of_default').delete().eq('source_document_id', id),
      supabase.from('esg_provisions').delete().eq('source_document_id', id),
      supabase.from('defined_terms').delete().eq('source_document_id', id),
    ]);

    // TODO: Trigger document processing job
    // await triggerDocumentProcessing(id);

    return NextResponse.json<ApiResponse<LoanDocument>>({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
