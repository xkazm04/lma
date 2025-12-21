import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateWaiverDraft,
  generateComplianceCertificate,
  draftBorrowerCommunication,
  type AgentContext,
} from '@/lib/llm/compliance-agent';
import {
  mockFacilities,
  mockCovenants,
  mockPredictions,
  dashboardStats,
  facilitiesAtRisk,
  upcomingItems,
  mockCalendarItems,
} from '@/app/features/compliance/lib/mock-data';

// Request schemas
const waiverRequestSchema = z.object({
  type: z.literal('waiver'),
  facility_name: z.string().min(1),
  covenant_name: z.string().min(1),
  additional_context: z.string().optional(),
});

const certificateRequestSchema = z.object({
  type: z.literal('certificate'),
  facility_name: z.string().min(1),
  period: z.string().min(1),
});

const communicationRequestSchema = z.object({
  type: z.literal('communication'),
  facility_name: z.string().min(1),
  purpose: z.string().min(1),
});

const generateRequestSchema = z.discriminatedUnion('type', [
  waiverRequestSchema,
  certificateRequestSchema,
  communicationRequestSchema,
]);

// Build the context from mock data
function getAgentContext(): AgentContext {
  return {
    facilities: mockFacilities,
    covenants: mockCovenants,
    predictions: mockPredictions,
    dashboardStats: dashboardStats,
    facilitiesAtRisk: facilitiesAtRisk,
    upcomingItems: upcomingItems,
    calendarEvents: mockCalendarItems,
  };
}

/**
 * POST /api/compliance/agent/generate
 * Generate compliance documents (waivers, certificates, communications)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedRequest = generateRequestSchema.parse(body);
    const context = getAgentContext();

    switch (validatedRequest.type) {
      case 'waiver': {
        const waiver = await generateWaiverDraft(
          validatedRequest.facility_name,
          validatedRequest.covenant_name,
          context,
          validatedRequest.additional_context
        );

        return NextResponse.json({
          success: true,
          document_type: 'waiver',
          document: waiver,
          generated_at: new Date().toISOString(),
        });
      }

      case 'certificate': {
        const certificate = await generateComplianceCertificate(
          validatedRequest.facility_name,
          validatedRequest.period,
          context
        );

        return NextResponse.json({
          success: true,
          document_type: 'certificate',
          document: certificate,
          generated_at: new Date().toISOString(),
        });
      }

      case 'communication': {
        const communication = await draftBorrowerCommunication(
          validatedRequest.facility_name,
          validatedRequest.purpose,
          context
        );

        return NextResponse.json({
          success: true,
          document_type: 'communication',
          document: communication,
          generated_at: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Document generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
