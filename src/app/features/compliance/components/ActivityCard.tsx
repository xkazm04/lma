'use client';

import React, { memo } from 'react';
import { CheckCircle, AlertTriangle, ClipboardCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecentActivity } from '../lib';

interface ActivityCardProps {
  activity: RecentActivity;
  index?: number;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'covenant_test_passed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'covenant_test_failed':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'waiver_granted':
      return <CheckCircle className="w-4 h-4 text-blue-600" />;
    case 'waiver_denied':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'compliance_submitted':
      return <ClipboardCheck className="w-4 h-4 text-green-600" />;
    default:
      return <Clock className="w-4 h-4 text-zinc-400" />;
  }
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Just now';
}

export const ActivityCard = memo(function ActivityCard({ activity, index = 0 }: ActivityCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 transition-all hover:bg-zinc-100',
        'animate-in fade-in slide-in-from-bottom-2'
      )}
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
    >
      <div className="transition-transform hover:scale-110">
        {getActivityIcon(activity.activity_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-900 line-clamp-2">{activity.description}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{formatTimeAgo(activity.created_at)}</p>
      </div>
    </div>
  );
});
