'use client';

import React, { memo, useState, useMemo } from 'react';
import {
  Activity,
  Eye,
  Edit3,
  MessageSquare,
  Upload,
  FileEdit,
  AtSign,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { LoanActivityEvent } from '../lib/mocks';

interface ActivityStreamProps {
  activities: LoanActivityEvent[];
  maxItems?: number;
  onActivityClick?: (activity: LoanActivityEvent) => void;
  onViewAll?: () => void;
}

type ActivityEventType = LoanActivityEvent['type'];

const eventTypeConfig: Record<
  ActivityEventType,
  { icon: typeof Eye; color: string; bgColor: string; label: string }
> = {
  view: { icon: Eye, color: 'text-zinc-500', bgColor: 'bg-zinc-100', label: 'Viewed' },
  edit: { icon: Edit3, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Edited' },
  comment: { icon: MessageSquare, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Commented' },
  upload: { icon: Upload, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Uploaded' },
  proposal: { icon: FileEdit, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Proposed' },
  mention: { icon: AtSign, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Mentioned' },
};

const ActivityEventItem = memo(function ActivityEventItem({
  activity,
  index,
  onClick,
}: {
  activity: LoanActivityEvent;
  index: number;
  onClick?: () => void;
}) {
  const config = eventTypeConfig[activity.type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-2 p-3 rounded-lg text-left',
        'transition-all duration-200 hover:bg-zinc-50',
        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset',
        'animate-in fade-in slide-in-from-left-2'
      )}
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
      data-testid={`activity-event-${activity.id}`}
    >
      {/* Event Type Icon */}
      <div className={cn('flex-shrink-0 p-1.5 rounded-md', config.bgColor)}>
        <Icon className={cn('w-3.5 h-3.5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-zinc-900">
              <span className="font-medium">{activity.userName}</span>
              <span className="text-zinc-500"> {activity.description}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {activity.loanName}
              </Badge>
              {activity.metadata?.documentName && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-zinc-400 truncate max-w-[120px]">
                        {activity.metadata.documentName}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{activity.metadata.documentName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <span className="text-[10px] text-zinc-400 whitespace-nowrap flex-shrink-0">
            {activity.relativeTime}
          </span>
        </div>

        {/* Comment preview */}
        {activity.metadata?.commentText && (
          <div className="mt-2 p-2 bg-zinc-50 rounded-md border-l-2 border-zinc-200">
            <p className="text-xs text-zinc-600 line-clamp-2">
              {activity.metadata.commentText}
            </p>
          </div>
        )}
      </div>
    </button>
  );
});

const FilterButton = memo(function FilterButton({
  type,
  label,
  isActive,
  onClick,
  count,
}: {
  type: ActivityEventType | 'all';
  label: string;
  isActive: boolean;
  onClick: () => void;
  count: number;
}) {
  const config = type !== 'all' ? eventTypeConfig[type] : null;
  const Icon = config?.icon || Activity;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        'transition-all duration-200',
        isActive
          ? 'bg-zinc-900 text-white'
          : 'text-zinc-600 hover:bg-zinc-100'
      )}
      data-testid={`activity-filter-${type}`}
      aria-pressed={isActive}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full text-[10px]',
            isActive ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
});

export const ActivityStream = memo(function ActivityStream({
  activities,
  maxItems = 5,
  onActivityClick,
  onViewAll,
}: ActivityStreamProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityEventType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') return activities.slice(0, maxItems);
    return activities
      .filter((a) => a.type === activeFilter)
      .slice(0, maxItems);
  }, [activities, activeFilter, maxItems]);

  const activityCounts = useMemo(() => {
    const counts: Record<ActivityEventType | 'all', number> = {
      all: activities.length,
      view: 0,
      edit: 0,
      comment: 0,
      upload: 0,
      proposal: 0,
      mention: 0,
    };
    activities.forEach((a) => {
      counts[a.type]++;
    });
    return counts;
  }, [activities]);

  const mentionCount = activityCounts.mention;

  return (
    <Card className="h-full" data-testid="activity-stream-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Activity Stream</CardTitle>
            {mentionCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {mentionCount} mention{mentionCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
              'transition-all duration-200',
              showFilters ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50'
            )}
            data-testid="activity-stream-filter-toggle"
            aria-expanded={showFilters}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            <ChevronDown
              className={cn(
                'w-3 h-3 transition-transform duration-200',
                showFilters && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Filter buttons */}
        {showFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <FilterButton
              type="all"
              label="All"
              isActive={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              count={activityCounts.all}
            />
            <FilterButton
              type="mention"
              label="Mentions"
              isActive={activeFilter === 'mention'}
              onClick={() => setActiveFilter('mention')}
              count={activityCounts.mention}
            />
            <FilterButton
              type="comment"
              label="Comments"
              isActive={activeFilter === 'comment'}
              onClick={() => setActiveFilter('comment')}
              count={activityCounts.comment}
            />
            <FilterButton
              type="upload"
              label="Uploads"
              isActive={activeFilter === 'upload'}
              onClick={() => setActiveFilter('upload')}
              count={activityCounts.upload}
            />
            <FilterButton
              type="proposal"
              label="Proposals"
              isActive={activeFilter === 'proposal'}
              onClick={() => setActiveFilter('proposal')}
              count={activityCounts.proposal}
            />
            <FilterButton
              type="edit"
              label="Edits"
              isActive={activeFilter === 'edit'}
              onClick={() => setActiveFilter('edit')}
              count={activityCounts.edit}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {filteredActivities.length > 0 ? (
          <div className="space-y-1">
            {filteredActivities.map((activity, index) => (
              <ActivityEventItem
                key={activity.id}
                activity={activity}
                index={index}
                onClick={() => onActivityClick?.(activity)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-400 text-sm">
            No activity to show
          </div>
        )}

        {activities.length > maxItems && (
          <button
            onClick={onViewAll}
            className={cn(
              'w-full mt-3 py-2 text-sm font-medium text-zinc-600',
              'rounded-md border border-zinc-200',
              'transition-all duration-200 hover:bg-zinc-50 hover:text-zinc-900',
              'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2'
            )}
            data-testid="activity-stream-view-all"
          >
            View all activity
          </button>
        )}
      </CardContent>
    </Card>
  );
});
