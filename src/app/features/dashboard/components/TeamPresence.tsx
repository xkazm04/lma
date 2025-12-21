'use client';

import React, { memo } from 'react';
import { Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  TeamMember,
  PresenceStatus,
} from '../lib/mocks';
import {
  presenceStatusConfig,
  activityTypeConfig,
} from '../lib/mocks';

interface TeamPresenceProps {
  members: TeamMember[];
  maxVisible?: number;
  onMemberClick?: (member: TeamMember) => void;
}

const PresenceIndicator = memo(function PresenceIndicator({
  status,
  size = 'sm',
}: {
  status: PresenceStatus;
  size?: 'sm' | 'md';
}) {
  const config = presenceStatusConfig[status];
  const sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <span
      className={cn(
        sizeClass,
        'rounded-full border-2 border-white',
        config.color,
        status === 'online' && 'animate-pulse'
      )}
      data-testid={`presence-indicator-${status}`}
    />
  );
});

const MemberAvatar = memo(function MemberAvatar({
  member,
  size = 'md',
  showStatus = true,
  onClick,
}: {
  member: TeamMember;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  onClick?: () => void;
}) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const statusPositionClasses = {
    sm: 'bottom-0 right-0',
    md: '-bottom-0.5 -right-0.5',
    lg: '-bottom-0.5 -right-0.5',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center rounded-full font-medium',
        'bg-gradient-to-br from-zinc-600 to-zinc-800 text-white',
        'transition-all duration-200 hover:scale-110 hover:ring-2 hover:ring-blue-400 hover:ring-offset-2',
        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
        sizeClasses[size]
      )}
      data-testid={`member-avatar-${member.id}`}
      aria-label={`${member.name} - ${presenceStatusConfig[member.status].label}`}
    >
      {member.avatar ? (
        <img
          src={member.avatar}
          alt={member.name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        member.initials
      )}
      {showStatus && (
        <span className={cn('absolute', statusPositionClasses[size])}>
          <PresenceIndicator status={member.status} size={size === 'lg' ? 'md' : 'sm'} />
        </span>
      )}
    </button>
  );
});

const MemberTooltipContent = memo(function MemberTooltipContent({
  member,
}: {
  member: TeamMember;
}) {
  const focusConfig = member.currentFocus
    ? activityTypeConfig[member.currentFocus.type]
    : null;
  const FocusIcon = focusConfig?.icon;

  return (
    <div className="p-1 min-w-[200px]">
      <div className="flex items-start gap-3">
        <MemberAvatar member={member} size="lg" showStatus={false} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-900">{member.name}</p>
          <p className="text-xs text-zinc-500">{member.role}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                presenceStatusConfig[member.status].color
              )}
            />
            <span className="text-xs text-zinc-600">
              {presenceStatusConfig[member.status].label}
              {member.status !== 'online' && ` • ${member.lastActive}`}
            </span>
          </div>
        </div>
      </div>
      {member.currentFocus && FocusIcon && (
        <div className="mt-3 pt-3 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Eye className="w-3.5 h-3.5" />
            <span>Currently working on:</span>
          </div>
          <div
            className={cn(
              'mt-1.5 flex items-center gap-2 px-2 py-1.5 rounded-md',
              focusConfig.bgColor
            )}
          >
            <FocusIcon className={cn('w-3.5 h-3.5', focusConfig.color)} />
            <span className={cn('text-xs font-medium truncate', focusConfig.color)}>
              {member.currentFocus.resourceName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export const TeamPresence = memo(function TeamPresence({
  members,
  maxVisible = 5,
  onMemberClick,
}: TeamPresenceProps) {
  // Sort members by status: online first, then busy, away, offline
  const sortedMembers = [...members].sort((a, b) => {
    const statusOrder: Record<PresenceStatus, number> = {
      online: 0,
      busy: 1,
      away: 2,
      offline: 3,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const visibleMembers = sortedMembers.slice(0, maxVisible);
  const remainingCount = Math.max(0, members.length - maxVisible);
  const onlineCount = members.filter(
    (m) => m.status === 'online' || m.status === 'busy'
  ).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="flex items-center gap-3"
        data-testid="team-presence-container"
      >
        {/* Team icon with count */}
        <div className="flex items-center gap-1.5 text-zinc-500">
          <Users className="w-4 h-4" />
          <span className="text-xs font-medium">
            <span className="text-green-600">{onlineCount}</span>
            <span className="text-zinc-400">/{members.length}</span>
          </span>
        </div>

        {/* Avatar stack */}
        <div className="flex -space-x-2" data-testid="team-presence-avatars">
          {visibleMembers.map((member, index) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <div
                  style={{
                    zIndex: visibleMembers.length - index,
                  }}
                >
                  <MemberAvatar
                    member={member}
                    onClick={() => onMemberClick?.(member)}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <MemberTooltipContent member={member} />
              </TooltipContent>
            </Tooltip>
          ))}

          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'relative flex items-center justify-center rounded-full',
                    'w-9 h-9 text-xs font-medium',
                    'bg-zinc-200 text-zinc-600 border-2 border-white',
                    'transition-all duration-200 hover:scale-110 hover:bg-zinc-300',
                    'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2'
                  )}
                  style={{ zIndex: 0 }}
                  data-testid="team-presence-overflow"
                  aria-label={`${remainingCount} more team members`}
                >
                  +{remainingCount}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <div className="p-1">
                  <p className="text-xs font-medium text-zinc-700 mb-2">
                    {remainingCount} more team members
                  </p>
                  <div className="space-y-1">
                    {sortedMembers.slice(maxVisible).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            presenceStatusConfig[member.status].color
                          )}
                        />
                        <span className="text-zinc-600">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
});
