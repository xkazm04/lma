'use client';

import React, { memo } from 'react';
import { cn, sanitizeUserName, sanitizeTimestamp, sanitizeContent } from '@/lib/utils';
import type { ActivityItem as ActivityItemType } from '../lib/mocks';
import { activityStatusConfig, type ActivityStatus } from '../lib/theme';

interface ActivityItemProps {
  activity: ActivityItemType;
  index?: number;
}

export const ActivityItem = memo(function ActivityItem({ activity, index = 0 }: ActivityItemProps) {
  const status = activity.status as ActivityStatus;
  const config = activityStatusConfig[status] || activityStatusConfig.info;
  const StatusIcon = config.Icon;

  // Sanitize user-generated content to prevent XSS attacks
  const safeTimestamp = sanitizeTimestamp(activity.timestamp);
  const safeUser = sanitizeUserName(activity.user);
  const safeTitle = sanitizeContent(activity.title, 200);
  const safeDescription = sanitizeContent(activity.description, 500);

  return (
    <div
      className={cn(
        'flex items-start gap-3 py-3 border-b border-zinc-100 last:border-0',
        'transition-all duration-200 hover:bg-zinc-50/50',
        'animate-in fade-in slide-in-from-left-2'
      )}
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
      data-testid={`activity-item-${index}`}
    >
      <div
        className={cn('mt-0.5 transition-transform hover:scale-110', config.color)}
        data-testid={`activity-status-icon-${activity.status}`}
      >
        <StatusIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900" data-testid="activity-title">
          {safeTitle}
        </p>
        <p className="text-sm text-zinc-500 truncate" data-testid="activity-description">
          {safeDescription}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-400" data-testid="activity-timestamp">
            {safeTimestamp}
          </span>
          <span className="text-xs text-zinc-300">•</span>
          <span className="text-xs text-zinc-400" data-testid="activity-user">
            {safeUser}
          </span>
        </div>
      </div>
    </div>
  );
});
