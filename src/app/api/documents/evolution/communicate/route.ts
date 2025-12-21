/**
 * Evolution Engine API - Communication endpoint
 *
 * POST: Draft and initiate counterparty communication
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateMockAmendmentSuggestions,
  draftCommunication,
} from '@/lib/llm/evolution-engine';
import type { AmendmentSuggestion } from '@/app/features/documents/sub_Evolution/lib/types';

// In-memory storage (shared with suggestions routes)
const suggestionStore: AmendmentSuggestion[] = generateMockAmendmentSuggestions();

/**
 * POST /api/documents/evolution/communicate
 * Draft or send counterparty communication for an amendment suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      suggestionId,
      communicationType = 'informal_discussion',
      facilityName,
      borrowerName,
      senderName,
      senderRole,
      recipientName,
      recipientRole,
      relationshipContext,
      sendNow = false,
      recipients,
      customMessage,
    } = body;

    if (!suggestionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'suggestionId is required',
          },
        },
        { status: 400 }
      );
    }

    // Find the suggestion
    const suggestion = suggestionStore.find((s) => s.id === suggestionId);

    if (!suggestion) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Suggestion with ID ${suggestionId} not found`,
          },
        },
        { status: 404 }
      );
    }

    // Draft the communication using AI
    const draft = await draftCommunication(
      suggestion,
      communicationType as 'informal_discussion' | 'formal_proposal' | 'amendment_request',
      {
        facilityName: facilityName || 'Credit Facility',
        borrowerName: borrowerName || 'Borrower',
        senderName: senderName || 'Loan Officer',
        senderRole: senderRole || 'Relationship Manager',
        recipientName: recipientName || 'CFO',
        recipientRole: recipientRole || 'Chief Financial Officer',
        relationshipContext,
      }
    );

    // In production, if sendNow is true and recipients are provided,
    // this would actually send the communication
    const communicationId = `comm-${Date.now()}`;
    const response = {
      communicationId,
      suggestionId,
      communicationType,
      draft,
      customMessage,
      status: sendNow ? 'sent' : 'draft',
      sentAt: sendNow ? new Date().toISOString() : null,
      recipients: recipients || [],
    };

    // If sending, log the activity
    if (sendNow && recipients?.length > 0) {
      console.log(`Communication ${communicationId} sent to:`, recipients);
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Draft communication error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'COMMUNICATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to draft communication',
        },
      },
      { status: 500 }
    );
  }
}
