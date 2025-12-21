'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import type { User } from '../lib/types';

interface UserMentionProps {
  user: User;
  onClick?: () => void;
  className?: string;
}

export const UserMention = memo(function UserMention({
  user,
  onClick,
  className,
}: UserMentionProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-1 py-0.5 rounded text-blue-700 bg-blue-50',
        'font-medium text-sm cursor-pointer hover:bg-blue-100 transition-colors',
        className
      )}
      data-testid={`user-mention-${user.id}`}
    >
      @{user.name}
    </span>
  );
});

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar = memo(function UserAvatar({
  user,
  size = 'md',
  className,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-white font-medium',
        sizeClasses[size],
        className
      )}
      title={user.name}
      data-testid={`user-avatar-${user.id}`}
    >
      {user.initials}
    </div>
  );
});
