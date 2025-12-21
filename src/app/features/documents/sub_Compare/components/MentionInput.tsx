'use client';

import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import type { User, Mention } from '../lib/types';
import { UserAvatar } from './UserMention';

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: Mention[]) => void;
  users: User[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

interface MentionSuggestion {
  user: User;
  matchStart: number;
}

export const MentionInput = memo(function MentionInput({
  value,
  onChange,
  users,
  placeholder = 'Add a comment... Use @ to mention someone',
  className,
  disabled = false,
  autoFocus = false,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Find the current @ mention being typed
  const findMentionQuery = useCallback((text: string, cursor: number): string | null => {
    const textBeforeCursor = text.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex === -1) return null;

    // Check if there's a space between @ and cursor (means mention is complete)
    const textAfterAt = textBeforeCursor.slice(atIndex + 1);
    if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) return null;

    return textAfterAt;
  }, []);

  // Filter users based on query
  const filterUsers = useCallback((query: string): MentionSuggestion[] => {
    if (!query) {
      return users.slice(0, 5).map(user => ({ user, matchStart: 0 }));
    }

    const lowerQuery = query.toLowerCase();
    return users
      .filter(user =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .map(user => ({
        user,
        matchStart: user.name.toLowerCase().indexOf(lowerQuery),
      }));
  }, [users]);

  // Handle text change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart || 0;

    setCursorPosition(cursor);

    const query = findMentionQuery(newValue, cursor);
    if (query !== null) {
      setMentionQuery(query);
      setSuggestions(filterUsers(query));
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }

    // Parse existing mentions in the text
    const mentions: Mention[] = [];
    const mentionRegex = /@([A-Za-z\s]+?)(?=\s|$|@)/g;
    let match;

    while ((match = mentionRegex.exec(newValue)) !== null) {
      const mentionedName = match[1].trim();
      const user = users.find(u => u.name === mentionedName);
      if (user) {
        mentions.push({
          userId: user.id,
          userName: user.name,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    onChange(newValue, mentions);
  }, [findMentionQuery, filterUsers, onChange, users]);

  // Insert mention
  const insertMention = useCallback((user: User) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex === -1) return;

    const textBefore = value.slice(0, atIndex);
    const textAfter = value.slice(cursorPosition);
    const mention = `@${user.name} `;
    const newValue = textBefore + mention + textAfter;
    const newCursor = atIndex + mention.length;

    // Parse mentions
    const mentions: Mention[] = [];
    const mentionRegex = /@([A-Za-z\s]+?)(?=\s|$|@)/g;
    let match;

    while ((match = mentionRegex.exec(newValue)) !== null) {
      const mentionedName = match[1].trim();
      const mentionedUser = users.find(u => u.name === mentionedName);
      if (mentionedUser) {
        mentions.push({
          userId: mentionedUser.id,
          userName: mentionedUser.name,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    onChange(newValue, mentions);
    setShowSuggestions(false);
    setMentionQuery('');

    // Set cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  }, [value, cursorPosition, onChange, users]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (showSuggestions) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex].user);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (showSuggestions) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex].user);
        }
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, insertMention]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          'w-full min-h-[80px] rounded-md border bg-white px-3 py-2 text-sm transition-colors resize-none',
          'placeholder:text-zinc-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'border-zinc-200',
          className
        )}
        data-testid="mention-input-textarea"
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 mt-1 py-1 bg-white border border-zinc-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
          data-testid="mention-suggestions-dropdown"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.user.id}
              type="button"
              onClick={() => insertMention(suggestion.user)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                index === selectedIndex ? 'bg-zinc-100' : 'hover:bg-zinc-50'
              )}
              data-testid={`mention-suggestion-${suggestion.user.id}`}
            >
              <UserAvatar user={suggestion.user} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {suggestion.user.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {suggestion.user.email}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
