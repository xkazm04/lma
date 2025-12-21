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
export { getAlertSeverityColor, getAlertSeverityIcon } from './lib/types';
