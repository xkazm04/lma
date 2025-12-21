'use client';

import React, { memo, useState, useCallback } from 'react';
import { Users, Bell, AtSign, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TeamPresence } from './TeamPresence';
import { ActivityStream } from './ActivityStream';
import { CounterpartyActivity } from './CounterpartyActivity';
import type {
  TeamMember,
  LoanActivityEvent,
  CounterpartyAction,
  Mention,
} from '../lib/mocks';
import {
  getActiveTeamMembersCount,
  getUnreadMentionsCount,
  getActiveCounterpartyActionsCount,
} from '../lib/mocks';

interface StakeholderCommandCenterProps {
  teamMembers: TeamMember[];
  loanActivities: LoanActivityEvent[];
  counterpartyActions: CounterpartyAction[];
  mentions: Mention[];
  onMemberClick?: (member: TeamMember) => void;
  onActivityClick?: (activity: LoanActivityEvent) => void;
  onCounterpartyActionClick?: (action: CounterpartyAction) => void;
  onMentionClick?: (mention: Mention) => void;
  onViewDealRoom?: (dealId: string) => void;
  onViewAllActivity?: () => void;
}

const MentionItem = memo(function MentionItem({
  mention,
  index,
  onClick,
}: {
  mention: Mention;
  index: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-2 p-2.5 rounded-lg text-left',
        'transition-all duration-200',
        mention.read
          ? 'bg-white hover:bg-zinc-50'
          : 'bg-red-50 hover:bg-red-100/80 border border-red-100',
        'focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-inset',
        'animate-in fade-in slide-in-from-right-2'
      )}
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
      data-testid={`mention-item-${mention.id}`}
    >
      {/* Mention Icon */}
      <div className="flex-shrink-0 p-1 rounded-md bg-red-100">
        <AtSign className="w-3.5 h-3.5 text-red-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-zinc-900">
            <span className="font-medium">{mention.fromUserName}</span>
            <span className="text-zinc-500"> mentioned you</span>
          </p>
          <span className="text-[9px] text-zinc-400 whitespace-nowrap flex-shrink-0">
            {mention.relativeTime}
          </span>
        </div>
        <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-1">{mention.message}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Badge variant="secondary" className="text-[9px] px-1 py-0">
            {mention.context.resourceName}
          </Badge>
          {!mention.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
      </div>
    </button>
  );
});

const MentionsPanel = memo(function MentionsPanel({
  mentions,
  onMentionClick,
}: {
  mentions: Mention[];
  onMentionClick?: (mention: Mention) => void;
}) {
  const unreadCount = mentions.filter((m) => !m.read).length;

  return (
    <Card className="h-full" data-testid="mentions-panel-card">
      <CardHeader className="py-2.5 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-semibold">
              <AtSign className="w-3.5 h-3.5 inline mr-1" />
              Mentions
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[9px] px-1 py-0">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3">
        {mentions.length > 0 ? (
          <div className="space-y-1.5">
            {mentions.map((mention, index) => (
              <MentionItem
                key={mention.id}
                mention={mention}
                index={index}
                onClick={() => onMentionClick?.(mention)}
              />
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-zinc-400 text-xs">
            <AtSign className="w-6 h-6 text-zinc-300 mx-auto mb-1.5" />
            No mentions yet
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const CollaborationStats = memo(function CollaborationStats({
  teamOnline,
  teamTotal,
  unreadMentions,
  activeCounterparties,
}: {
  teamOnline: number;
  teamTotal: number;
  unreadMentions: number;
  activeCounterparties: number;
}) {
  return (
    <div className="flex items-center gap-4 text-xs" data-testid="collaboration-stats">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Users className="w-3.5 h-3.5" />
              <span>
                <span className="text-green-600 font-medium">{teamOnline}</span>
                <span className="text-zinc-400">/{teamTotal}</span>
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{teamOnline} team members online</p>
          </TooltipContent>
        </Tooltip>

        {unreadMentions > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-red-600">
                <AtSign className="w-3.5 h-3.5" />
                <span className="font-medium">{unreadMentions}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{unreadMentions} unread mentions</p>
            </TooltipContent>
          </Tooltip>
        )}

        {activeCounterparties > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-green-600">
                <Bell className="w-3.5 h-3.5 animate-pulse" />
                <span className="font-medium">{activeCounterparties}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{activeCounterparties} active counterparty actions</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
});

export const StakeholderCommandCenter = memo(function StakeholderCommandCenter({
  teamMembers,
  loanActivities,
  counterpartyActions,
  mentions,
  onMemberClick,
  onActivityClick,
  onCounterpartyActionClick,
  onMentionClick,
  onViewDealRoom,
  onViewAllActivity,
}: StakeholderCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'counterparty' | 'mentions'>(
    'activity'
  );

  const teamOnline = getActiveTeamMembersCount();
  const unreadMentions = getUnreadMentionsCount();
  const activeCounterparties = getActiveCounterpartyActionsCount();

  const handleViewDealRoom = useCallback(
    (dealId: string) => {
      onViewDealRoom?.(dealId);
    },
    [onViewDealRoom]
  );

  return (
    <div
      className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
      data-testid="stakeholder-command-center"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-zinc-900">
            Collaboration Center
          </h2>
          <CollaborationStats
            teamOnline={teamOnline}
            teamTotal={teamMembers.length}
            unreadMentions={unreadMentions}
            activeCounterparties={activeCounterparties}
          />
        </div>
        <TeamPresence members={teamMembers} onMemberClick={onMemberClick} />
      </div>

      {/* Tab Navigation (Mobile) */}
      <div className="flex items-center gap-0.5 p-0.5 bg-zinc-100 rounded-lg lg:hidden">
        <button
          onClick={() => setActiveTab('activity')}
          className={cn(
            'flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200',
            activeTab === 'activity'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          )}
          data-testid="tab-activity"
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab('counterparty')}
          className={cn(
            'flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200 relative',
            activeTab === 'counterparty'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          )}
          data-testid="tab-counterparty"
        >
          Counterparty
          {activeCounterparties > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 text-[9px] bg-green-500 text-white rounded-full flex items-center justify-center">
              {activeCounterparties}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('mentions')}
          className={cn(
            'flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200 relative',
            activeTab === 'mentions'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          )}
          data-testid="tab-mentions"
        >
          Mentions
          {unreadMentions > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 text-[9px] bg-red-500 text-white rounded-full flex items-center justify-center">
              {unreadMentions}
            </span>
          )}
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Activity Stream - Full width on mobile when active, always visible on desktop */}
        <div
          className={cn(
            'lg:col-span-1',
            activeTab === 'activity' ? 'block' : 'hidden lg:block'
          )}
        >
          <ActivityStream
            activities={loanActivities}
            maxItems={5}
            onActivityClick={onActivityClick}
            onViewAll={onViewAllActivity}
          />
        </div>

        {/* Counterparty Activity */}
        <div
          className={cn(
            'lg:col-span-1',
            activeTab === 'counterparty' ? 'block' : 'hidden lg:block'
          )}
        >
          <CounterpartyActivity
            actions={counterpartyActions}
            maxItems={3}
            onActionClick={onCounterpartyActionClick}
            onViewDealRoom={handleViewDealRoom}
          />
        </div>

        {/* Mentions Panel */}
        <div
          className={cn(
            'lg:col-span-1',
            activeTab === 'mentions' ? 'block' : 'hidden lg:block'
          )}
        >
          <MentionsPanel mentions={mentions} onMentionClick={onMentionClick} />
        </div>
      </div>
    </div>
  );
});
