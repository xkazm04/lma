'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils/format';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  BarChart3,
  MessageSquare,
  User,
  Edit,
  Upload,
} from 'lucide-react';

export type ActivityType =
  | 'document_processed'
  | 'document_uploaded'
  | 'status_change'
  | 'compliance_update'
  | 'deadline_approaching'
  | 'alert'
  | 'comment'
  | 'user_action'
  | 'performance_submitted'
  | 'target_achieved'
  | 'rating_updated'
  | 'allocation_made'
  | 'trade_update'
  | 'default';

export interface Activity {
  id: string;
  type: ActivityType;
  title?: string;
  description: string;
  timestamp: string | Date;
  user?: string;
  entityName?: string;
  entityLink?: string;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  activities: Activity[];
  layout?: 'list' | 'grid-2' | 'grid-4';
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  emptyMessage?: string;
  className?: string;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  document_processed: <FileText className="w-4 h-4 text-blue-600" />,
  document_uploaded: <Upload className="w-4 h-4 text-green-600" />,
  status_change: <Edit className="w-4 h-4 text-purple-600" />,
  compliance_update: <CheckCircle className="w-4 h-4 text-green-600" />,
  deadline_approaching: <Clock className="w-4 h-4 text-amber-600" />,
  alert: <AlertTriangle className="w-4 h-4 text-red-600" />,
  comment: <MessageSquare className="w-4 h-4 text-blue-600" />,
  user_action: <User className="w-4 h-4 text-zinc-600" />,
  performance_submitted: <TrendingUp className="w-4 h-4 text-blue-600" />,
  target_achieved: <CheckCircle className="w-4 h-4 text-green-600" />,
  rating_updated: <BarChart3 className="w-4 h-4 text-purple-600" />,
  allocation_made: <DollarSign className="w-4 h-4 text-green-600" />,
  trade_update: <TrendingUp className="w-4 h-4 text-blue-600" />,
  default: <Clock className="w-4 h-4 text-zinc-400" />,
};

const ActivityItem = memo(function ActivityItem({
  activity,
  layout,
}: {
  activity: Activity;
  layout: 'list' | 'grid-2' | 'grid-4';
}) {
  const icon = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.default;
  const timeAgo = formatTimeAgo(activity.timestamp);

  const content = (
    <div
      className={cn(
        'flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 transition-all hover:bg-zinc-100',
        layout === 'list' && 'flex-row items-center',
        (layout === 'grid-2' || layout === 'grid-4') && 'flex-col'
      )}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        {activity.title && (
          <p className="text-sm font-medium text-zinc-900 truncate">{activity.title}</p>
        )}
        <p className={cn(
          'text-sm text-zinc-700',
          layout !== 'list' && 'line-clamp-2'
        )}>
          {activity.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {activity.entityName && (
            <span className="text-xs text-zinc-500 truncate">{activity.entityName}</span>
          )}
          <span className="text-xs text-zinc-400">{timeAgo}</span>
          {activity.user && (
            <span className="text-xs text-zinc-400">by {activity.user}</span>
          )}
        </div>
      </div>
    </div>
  );

  if (activity.entityLink) {
    return (
      <Link href={activity.entityLink} className="block">
        {content}
      </Link>
    );
  }

  return content;
});

/**
 * ActivityFeed - Unified activity/recent updates display
 *
 * Replaces multiple activity section implementations across modules
 * with a single, configurable component.
 */
export const ActivityFeed = memo(function ActivityFeed({
  activities,
  layout = 'list',
  maxItems,
  showViewAll = false,
  onViewAll,
  emptyMessage = 'No recent activity',
  className,
}: ActivityFeedProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  if (displayActivities.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={cn(
          layout === 'list' && 'space-y-2',
          layout === 'grid-2' && 'grid grid-cols-1 md:grid-cols-2 gap-3',
          layout === 'grid-4' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'
        )}
      >
        {displayActivities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} layout={layout} />
        ))}
      </div>

      {showViewAll && activities.length > (maxItems || 0) && (
        <button
          onClick={onViewAll}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all {activities.length} activities
        </button>
      )}
    </div>
  );
});

export default ActivityFeed;
