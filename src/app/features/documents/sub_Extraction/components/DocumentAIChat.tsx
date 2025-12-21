'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  FileText,
  X,
  Minimize2,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { DocumentChatMessage } from '../../lib/types';

interface DocumentAIChatProps {
  documentId: string;
  documentName?: string;
  className?: string;
}

/**
 * AI-powered chat assistant scoped to the current document.
 * Allows users to ask clarifying questions about the document and its extracted data.
 *
 * Features:
 * - Persistent chat history during the session
 * - Source citations with page numbers
 * - Confidence scores for responses
 * - Minimizable/expandable panel
 *
 * @example
 * <DocumentAIChat
 *   documentId="doc-123"
 *   documentName="Facility Agreement - Project Apollo.pdf"
 * />
 */
export const DocumentAIChat = memo(function DocumentAIChat({
  documentId,
  documentName,
  className,
}: DocumentAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<DocumentChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: DocumentChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          history: messages.slice(-10), // Send last 10 messages for context
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to get response');
      }

      const assistantMessage: DocumentChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.data.answer,
        timestamp: new Date().toISOString(),
        sources: data.data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, inputValue, isLoading, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg',
          'bg-indigo-600 hover:bg-indigo-700 text-white',
          className
        )}
        data-testid="open-document-chat-btn"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'fixed bottom-6 right-6 w-96 shadow-xl border-zinc-300',
        'animate-in slide-in-from-bottom-4 duration-300',
        isMinimized ? 'h-14' : 'h-[500px]',
        className
      )}
      data-testid="document-chat-panel"
    >
      {/* Header */}
      <CardHeader
        className={cn(
          'py-3 px-4 border-b border-zinc-200 cursor-pointer',
          'bg-gradient-to-r from-indigo-50 to-white',
          isMinimized && 'rounded-b-md'
        )}
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Document AI Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              data-testid="minimize-chat-btn"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              data-testid="close-chat-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {!isMinimized && documentName && (
          <p className="text-xs text-zinc-500 mt-1 truncate">
            Analyzing: {documentName}
          </p>
        )}
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(100%-56px)]">
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            data-testid="chat-messages"
          >
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500 mb-2">
                  Ask me anything about this document
                </p>
                <div className="space-y-1 text-xs text-zinc-400">
                  <p>&ldquo;What is the maturity date?&rdquo;</p>
                  <p>&ldquo;Explain the interest rate terms&rdquo;</p>
                  <p>&ldquo;Are there any covenants?&rdquo;</p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
                data-testid={`chat-message-${message.id}`}
              >
                {message.role === 'assistant' && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2',
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-100 text-zinc-900'
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-200/50">
                      <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Sources:
                      </p>
                      {message.sources.map((source, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-zinc-500 ml-4"
                        >
                          Page {source.page}
                          {source.section && ` - ${source.section}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-start">
                <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-zinc-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-sm text-zinc-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                className="text-center py-2 text-sm text-red-600"
                data-testid="chat-error"
              >
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about this document..."
                className={cn(
                  'flex-1 h-9 px-3 text-sm rounded-md border border-zinc-200',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                  'placeholder:text-zinc-400'
                )}
                disabled={isLoading}
                data-testid="chat-input"
              />
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="send-message-btn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
});
