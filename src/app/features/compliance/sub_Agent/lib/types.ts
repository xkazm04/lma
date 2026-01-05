// =============================================================================
// Compliance Agent UI Types
// =============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    sources?: string[];
    actions_taken?: string[];
    escalation_required?: boolean;
  };
}

export interface AgentAction {
  type: 'generate_document' | 'schedule_reminder' | 'escalate' | 'update_status' | 'send_communication';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  data?: Record<string, unknown>;
}

export interface AgentAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affected_facilities: string[];
  recommended_actions: string[];
  requires_escalation: boolean;
  created_at: string;
}

export interface AgentStatus {
  status: 'active' | 'idle' | 'processing';
  example_queries: string[];
  alerts: AgentAlert[];
  summary: {
    total_facilities: number;
    facilities_at_risk: number;
    pending_actions: number;
    critical_alerts: number;
    warning_alerts: number;
  };
}

export interface ChatResponse {
  success: boolean;
  response: string;
  intent: {
    intent: string;
    confidence: number;
    entities: Record<string, unknown>;
    follow_up_questions?: string[];
  };
  actions: AgentAction[];
  sources: string[];
  escalation_required: boolean;
  follow_up_suggestions: string[];
  conversation_history: ChatMessage[];
}

export interface GeneratedDocument {
  document_type: 'waiver' | 'certificate' | 'communication';
  document: Record<string, unknown>;
  generated_at: string;
}

// Alert severity helpers
// Note: getAlertSeverityColor has been moved to @/lib/utils/color-resolver.ts
// for centralized color management. Import from '@/lib/utils' instead.

export function getAlertSeverityIcon(severity: AgentAlert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'AlertOctagon';
    case 'warning':
      return 'AlertTriangle';
    case 'info':
      return 'Info';
    default:
      return 'Bell';
  }
}
