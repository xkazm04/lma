import { NextRequest, NextResponse } from 'next/server';
import { generateDocumentContent, enhanceDocumentWithAI } from '@/lib/llm/document-generation';
import type {
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  GeneratedDocument,
  DocumentStatus,
  SignatureWorkflow,
  AuditTrailEntry,
} from '@/app/features/compliance/lib/document-generation-types';

/**
 * GET /api/compliance/documents
 * List all generated documents with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facility_id');
    const eventId = searchParams.get('event_id');
    const status = searchParams.get('status') as DocumentStatus | null;

    // In a real implementation, this would query the database
    // For now, return mock data structure
    const documents: GeneratedDocument[] = [];

    // Apply filters (mock implementation)
    let filtered = documents;
    if (facilityId) {
      filtered = filtered.filter(d => d.facility_id === facilityId);
    }
    if (eventId) {
      filtered = filtered.filter(d => d.event_id === eventId);
    }
    if (status) {
      filtered = filtered.filter(d => d.status === status);
    }

    return NextResponse.json({
      success: true,
      documents: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compliance/documents
 * Generate a new compliance document
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateDocumentRequest = await request.json();

    // Validate required fields
    if (!body.template_type || !body.facility_id || !body.data_source) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate document content using AI
    const content = await generateDocumentContent(
      body.template_type,
      body.data_source,
      body.custom_fields
    );

    // Enhance with AI insights if applicable
    const enhancedContent = await enhanceDocumentWithAI(content, body.data_source);

    // Create audit trail entry
    const auditEntry: AuditTrailEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'document_generated',
      actor_id: 'system', // In real app, get from auth
      actor_name: 'System',
      actor_email: 'system@loanos.com',
      actor_role: 'system',
      details: `${body.template_type} generated for ${body.data_source.facility_name}`,
    };

    // Create the document record
    const document: GeneratedDocument = {
      id: `doc-${Date.now()}`,
      template_id: `tpl-${body.template_type}`,
      template_type: body.template_type,
      document_name: `${body.data_source.borrower_name} - ${body.template_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      facility_id: body.facility_id,
      facility_name: body.data_source.facility_name,
      borrower_name: body.data_source.borrower_name,
      event_id: body.event_id || null,
      event_type: null,
      status: 'draft',
      version: 1,
      content: enhancedContent,
      data_snapshot: body.data_source,
      signature_workflow: null,
      generated_at: new Date().toISOString(),
      generated_by: 'system',
      last_modified_at: new Date().toISOString(),
      submitted_at: null,
      completed_at: null,
      expires_at: null,
      audit_trail: [auditEntry],
    };

    // In a real implementation, save to database here

    const response: GenerateDocumentResponse = {
      success: true,
      document,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
