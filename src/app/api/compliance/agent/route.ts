import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  processAgentQuery,
  classifyIntent,
  analyzeAndGenerateAlerts,
  getExampleQueries,
  type AgentContext,
  type AgentMessage,
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
const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string(),
      metadata: z
        .object({
          intent: z.string().optional(),
          sources: z.array(z.string()).optional(),
          actions_taken: z.array(z.string()).optional(),
          escalation_required: z.boolean().optional(),
        })
        .optional(),
    })
  ).optional().default([]),
});

const intentRequestSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string(),
    })
  ).optional().default([]),
});

// Build the context from mock data (in production, this would come from the database)
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
 * POST /api/compliance/agent
 * Process a natural language query to the compliance agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory } = chatRequestSchema.parse(body);

    const context = getAgentContext();
    const history: AgentMessage[] = conversationHistory as AgentMessage[];

    const response = await processAgentQuery(message, context, history);

    // Add the user message and response to the conversation
    const updatedHistory: AgentMessage[] = [
      ...history,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        metadata: {
          intent: response.intent.intent,
          sources: response.sources,
          actions_taken: response.actions.map((a) => a.description),
          escalation_required: response.escalation_required,
        },
      },
    ];

    return NextResponse.json({
      success: true,
      response: response.response,
      intent: response.intent,
      actions: response.actions,
      sources: response.sources,
      escalation_required: response.escalation_required,
      follow_up_suggestions: response.follow_up_suggestions,
      conversation_history: updatedHistory,
    });
  } catch (error) {
    console.error('Compliance agent error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process agent query' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/compliance/agent
 * Get agent status, example queries, and current alerts
 */
export async function GET() {
  try {
    const context = getAgentContext();
    const alerts = await analyzeAndGenerateAlerts(context);

    return NextResponse.json({
      success: true,
      status: 'active',
      example_queries: getExampleQueries(),
      alerts: alerts,
      summary: {
        total_facilities: context.dashboardStats.total_facilities,
        facilities_at_risk: context.facilitiesAtRisk.length,
        pending_actions: context.dashboardStats.overdue_items,
        critical_alerts: alerts.filter((a) => a.severity === 'critical').length,
        warning_alerts: alerts.filter((a) => a.severity === 'warning').length,
      },
    });
  } catch (error) {
    console.error('Compliance agent status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get agent status' },
      { status: 500 }
    );
  }
}
