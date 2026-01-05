'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTimeAgo, getTradeEventIcon } from '../lib/utils';
import type { Activity } from '../lib/types';

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity = React.memo<RecentActivityProps>(({ activities }) => {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-6 duration-500" data-testid="recent-activity-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest trading updates</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" data-testid="activity-list">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/trading/trades/${activity.trade_id}`}
              data-testid={`activity-item-${activity.id}`}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
            >
              {getTradeEventIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900 line-clamp-2">{activity.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500">{activity.trade_reference}</span>
                  <span className="text-xs text-zinc-400">{formatTimeAgo(activity.occurred_at)}</span>
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
