'use client';

import React, { memo } from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompactDataTable, type ColumnDef } from '@/components/ui/compact-data-table';
import { cn } from '@/lib/utils';
import type { ActivityItem as ActivityItemType } from '../lib/mocks';

interface RecentActivitySectionProps {
  activities: ActivityItemType[];
}

const statusConfig = {
  success: { color: 'text-green-600', bgColor: 'bg-green-100', Icon: CheckCircle },
  warning: { color: 'text-amber-600', bgColor: 'bg-amber-100', Icon: Clock },
  error: { color: 'text-red-600', bgColor: 'bg-red-100', Icon: AlertTriangle },
  info: { color: 'text-blue-600', bgColor: 'bg-blue-100', Icon: Clock },
} as const;

const columns: ColumnDef<ActivityItemType>[] = [
  {
    key: 'status',
    width: '32px',
    render: (activity) => {
      const config = statusConfig[activity.status];
      const StatusIcon = config.Icon;
      return (
        <div className={cn('p-1 rounded', config.bgColor)}>
          <StatusIcon className={cn('w-3.5 h-3.5', config.color)} />
        </div>
      );
    },
  },
  {
    key: 'content',
    flex: 1,
    render: (activity) => (
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">{activity.title}</p>
        <p className="text-xs text-zinc-500 truncate">{activity.description}</p>
      </div>
    ),
  },
  {
    key: 'meta',
    width: '100px',
    align: 'right',
    render: (activity) => (
      <div className="text-right">
        <p className="text-xs text-zinc-500">{activity.timestamp}</p>
        <p className="text-xs text-zinc-400">{activity.user}</p>
      </div>
    ),
  },
];

export const RecentActivitySection = memo(function RecentActivitySection({
  activities,
}: RecentActivitySectionProps) {
  return (
    <Card className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          View all
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <CompactDataTable
          data={activities}
          columns={columns}
          rowHeight="sm"
          showHeader={false}
          maxHeight="280px"
          emptyMessage="No recent activity"
        />
      </CardContent>
    </Card>
  );
});
