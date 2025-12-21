import { NextRequest, NextResponse } from 'next/server';
import type {
  InitiateSignatureRequest,
  InitiateSignatureResponse,
  ApplySignatureRequest,
  ApplySignatureResponse,
  SignatureWorkflow,
  Signer,
  AuditTrailEntry,
  SignatureData,
} from '@/app/features/compliance/lib/document-generation-types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/compliance/documents/[id]/signature
 * Initiate e-signature workflow for a document
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params;
    const body: InitiateSignatureRequest = await request.json();

    // Validate required fields
    if (!body.signers || body.signers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one signer is required' },
        { status: 400 }
      );
    }

    // Validate signer emails
    const invalidSigners = body.signers.filter(s => !s.email.includes('@'));
    if (invalidSigners.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email addresses provided' },
        { status: 400 }
      );
    }

    // Create signers with initial status
    const signers: Signer[] = body.signers.map((config, index) => ({
      id: `signer-${Date.now()}-${index}`,
      role: config.role,
      name: config.name,
      email: config.email,
      title: config.title,
      organization: config.organization,
      signing_order: body.signing_order === 'sequential' ? index + 1 : 1,
      status: 'pending',
      signature_data: null,
      viewed_at: null,
      signed_at: null,
      declined_at: null,
      decline_reason: null,
      reminder_sent_at: null,
      reminders_count: 0,
    }));

    // Calculate expiration
    const expirationDays = body.expiration_days || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create the workflow
    const workflow: SignatureWorkflow = {
      id: `wf-${Date.now()}`,
      document_id: documentId,
      status: 'in_progress',
      signers,
      signing_order: body.signing_order || 'sequential',
      reminder_frequency_hours: body.reminder_frequency_hours || 24,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    // Create audit entry
    const auditEntry: AuditTrailEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'workflow_started',
      actor_id: 'system',
      actor_name: 'System',
      actor_email: 'system@loanos.com',
      actor_role: 'admin',
      details: `E-signature workflow initiated with ${signers.length} signer(s)`,
    };

    // In a real implementation:
    // 1. Save workflow to database
    // 2. Update document status to 'pending_signature'
    // 3. Send email notifications to signers
    // 4. Save audit entry

    const response: InitiateSignatureResponse = {
      success: true,
      workflow,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error initiating signature workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate signature workflow' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/compliance/documents/[id]/signature
 * Apply a signature to a document
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params;
    const body: ApplySignatureRequest = await request.json();

    // Validate required fields
    if (!body.workflow_id || !body.signer_id || !body.signature_value) {
      return NextResponse.json(
        { success: false, error: 'Missing required signature data' },
        { status: 400 }
      );
    }

    // Create signature data with metadata
    const signatureData: SignatureData = {
      signature_type: body.signature_type,
      signature_value: body.signature_value,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    };

    // Create audit entry
    const auditEntry: AuditTrailEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'signature_applied',
      actor_id: body.signer_id,
      actor_name: 'Signer', // Would come from database lookup
      actor_email: 'signer@example.com', // Would come from database lookup
      actor_role: 'borrower_cfo', // Would come from database lookup
      details: `Signature applied (${body.signature_type})`,
      ip_address: signatureData.ip_address,
    };

    // In a real implementation:
    // 1. Validate workflow exists and is active
    // 2. Validate signer is authorized
    // 3. Check signing order if sequential
    // 4. Store signature data
    // 5. Update signer status
    // 6. Check if all signatures collected
    // 7. Update document status if complete
    // 8. Save audit entry
    // 9. Send notifications

    // Mock response - in reality would return updated workflow and document
    const response: ApplySignatureResponse = {
      success: true,
      workflow: undefined, // Would include updated workflow
      document: undefined, // Would include updated document
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error applying signature:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply signature' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/compliance/documents/[id]/signature
 * Cancel signature workflow or decline to sign
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params;
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflow_id');
    const signerId = searchParams.get('signer_id');
    const reason = searchParams.get('reason');

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'workflow_id is required' },
        { status: 400 }
      );
    }

    // If signer_id provided, this is a decline action
    if (signerId) {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Decline reason is required' },
          { status: 400 }
        );
      }

      // Create audit entry for decline
      const auditEntry: AuditTrailEntry = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'signature_declined',
        actor_id: signerId,
        actor_name: 'Signer',
        actor_email: 'signer@example.com',
        actor_role: 'borrower_cfo',
        details: `Signature declined: ${reason}`,
      };

      // In real implementation: update signer status, notify others

      return NextResponse.json({
        success: true,
        message: 'Signature declined',
        audit_entry: auditEntry,
      });
    }

    // Otherwise, this is a workflow cancellation
    const auditEntry: AuditTrailEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'document_rejected',
      actor_id: 'system',
      actor_name: 'System',
      actor_email: 'system@loanos.com',
      actor_role: 'admin',
      details: 'Signature workflow cancelled',
    };

    return NextResponse.json({
      success: true,
      message: 'Workflow cancelled',
      audit_entry: auditEntry,
    });
  } catch (error) {
    console.error('Error in signature cancellation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
