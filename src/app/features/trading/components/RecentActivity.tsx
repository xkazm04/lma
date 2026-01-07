'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo, getTradeEventIcon } from '../lib/utils';
import type { Activity } from '../lib/types';

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity = React.memo<RecentActivityProps>(({ activities }) => {
  const displayedActivities = activities.slice(0, 8);
  const remainingCount = activities.length - displayedActivities.length;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-6 duration-500" data-testid="recent-activity-card">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {activities.length}
          </Badge>
        </div>
        {remainingCount > 0 && (
          <span className="text-xs text-zinc-500">
            +{remainingCount} more
          </span>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2" data-testid="activity-list">
          {displayedActivities.map((activity, index) => (
            <Link
              key={activity.id}
              href={`/trading/trades/${activity.trade_id}`}
              data-testid={`activity-item-${activity.id}`}
              className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors duration-150"
              style={index < 4 ? { animationDelay: `${index * 50}ms` } : undefined}
            >
              {getTradeEventIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-900 line-clamp-1">{activity.description}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-zinc-500 truncate">{activity.trade_reference}</span>
                  <span className="text-[10px] text-zinc-400 shrink-0">{formatTimeAgo(activity.occurred_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

RecentActivity.displayName = 'RecentActivity';
