import { NextRequest, NextResponse } from 'next/server';
import type { AuditTrailEntry } from '@/app/features/compliance/lib/document-generation-types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/compliance/documents/[id]/reminder
 * Send reminder to pending signers
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params;
    const body = await request.json();

    const { signer_id, message } = body;

    if (!signer_id) {
      return NextResponse.json(
        { success: false, error: 'signer_id is required' },
        { status: 400 }
      );
    }

    // In a real implementation:
    // 1. Fetch the document and workflow
    // 2. Validate signer exists and is pending
    // 3. Send email reminder
    // 4. Update reminder_sent_at and reminders_count
    // 5. Add audit trail entry

    const auditEntry: AuditTrailEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'reminder_sent',
      actor_id: 'system',
      actor_name: 'System',
      actor_email: 'system@loanos.com',
      actor_role: 'admin',
      details: `Reminder sent to signer ${signer_id}${message ? `: ${message}` : ''}`,
    };

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      audit_entry: auditEntry,
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
