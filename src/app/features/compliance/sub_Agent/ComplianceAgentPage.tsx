'use client';

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  RefreshCw,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  FileText,
  Send,
  ChevronDown,
} from 'lucide-react';
import {
  ChatMessage,
  ChatInput,
  AlertCard,
  AgentStatusPanel,
  DocumentPreviewModal,
} from './components';
import type {
  ChatMessage as ChatMessageType,
  AgentStatus,
  AgentAlert,
  GeneratedDocument,
} from './lib/types';

export const ComplianceAgentPage = memo(function ComplianceAgentPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch agent status on mount
  useEffect(() => {
    fetchAgentStatus();
  }, []);

  const fetchAgentStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const response = await fetch('/api/compliance/agent');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isProcessing) return;

      // Add user message immediately
      const userMessage: ChatMessageType = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);
      setFollowUpSuggestions([]);

      try {
        const response = await fetch('/api/compliance/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            conversationHistory: messages,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to process message');
        }

        const data = await response.json();

        // Add assistant response
        const assistantMessage: ChatMessageType = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          metadata: {
            intent: data.intent?.intent,
            sources: data.sources,
            actions_taken: data.actions?.map((a: { description: string }) => a.description),
            escalation_required: data.escalation_required,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setFollowUpSuggestions(data.follow_up_suggestions || []);

        // Check if a document was generated
        if (data.actions?.some((a: { type: string }) => a.type === 'generate_document')) {
          // For demo purposes, we could trigger document generation here
        }
      } catch (error) {
        console.error('Failed to send message:', error);

        // Add error message
        const errorMessage: ChatMessageType = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [messages, isProcessing]
  );

  const handleAlertAction = useCallback((alert: AgentAlert) => {
    // Navigate to relevant action or show modal
    const message = `Tell me more about the "${alert.title}" alert and what actions I should take.`;
    handleSendMessage(message);
  }, [handleSendMessage]);

  const handleQuickAction = useCallback((action: string) => {
    handleSendMessage(action);
  }, [handleSendMessage]);

  // Initial suggestions
  const initialSuggestions = status?.example_queries?.slice(0, 4) || [];

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4 animate-in fade-in" data-testid="compliance-agent-page">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Bot className="w-7 h-7 text-purple-600" />
              Compliance Agent
            </h1>
            <p className="text-zinc-500">
              Your autonomous compliance assistant - ask questions in natural language
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchAgentStatus}
            disabled={isLoadingStatus}
            data-testid="refresh-status-btn"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <EmptyState onQuickAction={handleQuickAction} suggestions={initialSuggestions} />
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isProcessing}
            suggestions={followUpSuggestions.slice(0, 3)}
            placeholder="Ask about covenant risks, generate waivers, check deadlines..."
          />
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 flex-shrink-0 space-y-4">
        {/* Agent Status */}
        <AgentStatusPanel status={status} isLoading={isLoadingStatus} />

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickActionButton
              icon={<FileText className="w-4 h-4" />}
              label="Generate Compliance Certificate"
              onClick={() =>
                handleQuickAction('Generate a compliance certificate for ABC Holdings for Q4 2024')
              }
            />
            <QuickActionButton
              icon={<FileText className="w-4 h-4" />}
              label="Draft Waiver Request"
              onClick={() =>
                handleQuickAction('Draft a waiver request for Delta Manufacturing Fixed Charge Coverage')
              }
            />
            <QuickActionButton
              icon={<AlertTriangle className="w-4 h-4" />}
              label="Check Critical Risks"
              onClick={() =>
                handleQuickAction('Are there any critical issues that need immediate escalation?')
              }
            />
            <QuickActionButton
              icon={<MessageSquare className="w-4 h-4" />}
              label="Draft Borrower Update"
              onClick={() =>
                handleQuickAction('Draft a communication to XYZ Corporation about their upcoming covenant test')
              }
            />
          </CardContent>
        </Card>

        {/* Active Alerts */}
        {status?.alerts && status.alerts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Active Alerts
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {status.alerts.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {status.alerts.slice(0, 3).map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  compact
                  onAction={handleAlertAction}
                />
              ))}
              {status.alerts.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Show {status.alerts.length - 3} more
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        document={generatedDocument}
        onDownload={() => {
          // Download logic
          console.log('Download document');
        }}
        onCopy={() => {
          // Copy logic
          console.log('Copy document');
        }}
      />
    </div>
  );
});

interface EmptyStateProps {
  onQuickAction: (action: string) => void;
  suggestions: string[];
}

function EmptyState({ onQuickAction, suggestions }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 mb-2">
        Welcome to the Compliance Agent
      </h3>
      <p className="text-sm text-zinc-500 max-w-md mb-6">
        I can help you monitor covenants, generate compliance documents, analyze risks, and
        handle routine compliance tasks. Ask me anything in natural language!
      </p>

      <Separator className="mb-6" />

      <p className="text-xs font-medium text-zinc-500 mb-3">Try asking:</p>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onQuickAction(suggestion)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
            data-testid={`empty-state-suggestion-${idx}`}
          >
            <Sparkles className="w-3 h-3" />
            {suggestion.length > 60 ? suggestion.slice(0, 57) + '...' : suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function QuickActionButton({ icon, label, onClick }: QuickActionButtonProps) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-left h-auto py-2"
      onClick={onClick}
      data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="text-purple-600 mr-2">{icon}</span>
      <span className="text-sm">{label}</span>
    </Button>
  );
}
