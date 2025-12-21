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
export function getAlertSeverityColor(severity: AgentAlert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'warning':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'info':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}

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
