'use client';

import React, { memo, useMemo } from 'react';
import { Circle, Eye, MessageSquare, Edit3, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PresenceUser, TypingIndicator } from '../lib/war-room-types';

interface LivePresencePanelProps {
  users: PresenceUser[];
  typingIndicators: TypingIndicator[];
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

const partyTypeColors = {
  borrower_side: 'bg-blue-500',
  lender_side: 'bg-green-500',
  third_party: 'bg-zinc-500',
};

const partyTypeLabels = {
  borrower_side: 'Borrower',
  lender_side: 'Lender',
  third_party: 'Third Party',
};

function formatLastActive(lastActive: string): string {
  const diff = Date.now() - new Date(lastActive).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function getViewIcon(view?: string) {
  switch (view) {
    case 'proposals':
      return <Edit3 className="w-3 h-3" />;
    case 'comments':
      return <MessageSquare className="w-3 h-3" />;
    default:
      return <Eye className="w-3 h-3" />;
  }
}

export const LivePresencePanel = memo(function LivePresencePanel({
  users,
  typingIndicators,
  currentUserId,
  onUserClick,
}: LivePresencePanelProps) {
  const onlineUsers = useMemo(
    () => users.filter((u) => u.is_online && u.id !== currentUserId),
    [users, currentUserId]
  );

  const offlineUsers = useMemo(
    () => users.filter((u) => !u.is_online && u.id !== currentUserId),
    [users, currentUserId]
  );

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId),
    [users, currentUserId]
  );

  // Group typing indicators by term
  const typingByTerm = useMemo(() => {
    const grouped: Record<string, TypingIndicator[]> = {};
    typingIndicators.forEach((ti) => {
      if (!grouped[ti.term_id]) {
        grouped[ti.term_id] = [];
      }
      grouped[ti.term_id].push(ti);
    });
    return grouped;
  }, [typingIndicators]);

  return (
    <Card
      className="animate-in fade-in slide-in-from-right-4 duration-500"
      data-testid="live-presence-panel"
      role="region"
      aria-label="Live presence"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" aria-hidden="true" />
            Live Presence
          </CardTitle>
          <Badge variant="outline" className="text-xs" data-testid="online-count-badge">
            {onlineUsers.length + (currentUser?.is_online ? 1 : 0)} online
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current User */}
        {currentUser && (
          <div
            className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg"
            data-testid="current-user-presence"
          >
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-full ${partyTypeColors[currentUser.party_type]} flex items-center justify-center text-white text-xs font-medium`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <Circle
                className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {currentUser.name} (You)
              </p>
              <p className="text-xs text-zinc-500">
                {partyTypeLabels[currentUser.party_type]}
              </p>
            </div>
          </div>
        )}

        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Active Now
            </p>
            {onlineUsers.map((user) => {
              const isTyping = typingIndicators.some(
                (ti) => ti.user_id === user.id
              );

              return (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                          user.viewing_term_id
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : 'hover:bg-zinc-50'
                        }`}
                        onClick={() => onUserClick?.(user.id)}
                        data-testid={`presence-user-${user.id}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${user.name}, ${partyTypeLabels[user.party_type]}, ${user.viewing_term_id ? 'viewing a term' : 'online'}`}
                      >
                        <div className="relative">
                          <div
                            className={`w-8 h-8 rounded-full ${partyTypeColors[user.party_type]} flex items-center justify-center text-white text-xs font-medium`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <Circle
                            className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {user.name}
                            </p>
                            {isTyping && (
                              <span
                                className="flex gap-0.5"
                                data-testid={`typing-indicator-${user.id}`}
                                aria-label="Typing"
                              >
                                <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            {getViewIcon(user.current_view)}
                            <span>
                              {user.current_view === 'terms'
                                ? 'Viewing terms'
                                : user.current_view === 'proposals'
                                  ? 'Writing proposal'
                                  : user.current_view === 'comments'
                                    ? 'Adding comment'
                                    : 'Online'}
                            </span>
                          </div>
                        </div>
                        {user.viewing_term_id && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-white"
                            data-testid={`viewing-term-badge-${user.id}`}
                          >
                            Term
                          </Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-zinc-400">
                        {partyTypeLabels[user.party_type]}
                      </p>
                      {user.viewing_term_id && (
                        <p className="text-xs text-blue-500 mt-1">
                          Click to see what they&apos;re viewing
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}

        {/* Typing Indicators Summary */}
        {Object.keys(typingByTerm).length > 0 && (
          <div
            className="p-2 bg-amber-50 rounded-lg border border-amber-100"
            data-testid="typing-activity-summary"
          >
            <p className="text-xs font-medium text-amber-700 mb-1">
              Activity in progress
            </p>
            {Object.entries(typingByTerm).map(([termId, indicators]) => (
              <div key={termId} className="flex items-center gap-1 text-xs text-amber-600">
                <Edit3 className="w-3 h-3" aria-hidden="true" />
                <span>
                  {indicators.map((i) => i.user_name).join(', ')}{' '}
                  {indicators.length > 1 ? 'are' : 'is'} drafting{' '}
                  {indicators[0].action === 'proposal' ? 'a proposal' : 'a comment'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Offline Users */}
        {offlineUsers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Offline
            </p>
            {offlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 opacity-60"
                data-testid={`presence-user-offline-${user.id}`}
              >
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full bg-zinc-300 flex items-center justify-center text-white text-xs font-medium`}
                  >
                    {user.name.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-600 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatLastActive(user.last_active)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No other users */}
        {onlineUsers.length === 0 && offlineUsers.length === 0 && (
          <div className="text-center py-4 text-sm text-zinc-500">
            <Users className="w-8 h-8 mx-auto text-zinc-300 mb-2" aria-hidden="true" />
            <p>No other participants online</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
