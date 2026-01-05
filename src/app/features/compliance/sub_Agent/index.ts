export { ComplianceAgentPage } from './ComplianceAgentPage';
export * from './components';
export type {
  ChatMessage as ChatMessageData,
  AgentAction,
  AgentAlert,
  AgentStatus,
  ChatResponse,
  GeneratedDocument,
} from './lib/types';
export { getAlertSeverityIcon } from './lib/types';
// Re-export unified color utility
export { getAlertSeverityColor } from '@/lib/utils';
