'use client';

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, User, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      data-testid={`chat-message-${message.id}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block p-3 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-zinc-100 text-zinc-900 rounded-bl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Metadata for assistant messages */}
        {!isUser && message.metadata && (
          <div className="mt-2 space-y-2">
            {/* Escalation Alert */}
            {message.metadata.escalation_required && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Escalation recommended</span>
              </div>
            )}

            {/* Intent Badge */}
            {message.metadata.intent && (
              <Badge variant="outline" className="text-xs">
                {formatIntent(message.metadata.intent)}
              </Badge>
            )}

            {/* Sources */}
            {message.metadata.sources && message.metadata.sources.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {message.metadata.sources.slice(0, 3).map((source, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    <ExternalLink className="w-2 h-2 mr-1" />
                    {source}
                  </Badge>
                ))}
                {message.metadata.sources.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{message.metadata.sources.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Actions Taken */}
            {message.metadata.actions_taken && message.metadata.actions_taken.length > 0 && (
              <div className="flex items-start gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{message.metadata.actions_taken.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs text-zinc-400 mt-1 ${isUser ? 'text-right' : ''}`}>
          {formattedTime}
        </p>
      </div>
    </div>
  );
});

function formatIntent(intent: string): string {
  return intent
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
