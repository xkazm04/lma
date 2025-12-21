'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  suggestions?: string[];
  placeholder?: string;
}

export const ChatInput = memo(function ChatInput({
  onSend,
  isLoading,
  suggestions = [],
  placeholder = 'Ask anything about compliance...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = useCallback(() => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  }, [message, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (!isLoading) {
        onSend(suggestion);
      }
    },
    [isLoading, onSend]
  );

  return (
    <div className="border-t border-zinc-200 bg-white p-4">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 rounded-full hover:bg-zinc-200 hover:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={`suggestion-btn-${idx}`}
            >
              <Sparkles className="w-3 h-3" />
              {suggestion.length > 50 ? suggestion.slice(0, 47) + '...' : suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-zinc-50"
            data-testid="chat-input"
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="h-11 px-4"
          data-testid="send-message-btn"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Hint */}
      <p className="mt-2 text-xs text-zinc-400">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
});
