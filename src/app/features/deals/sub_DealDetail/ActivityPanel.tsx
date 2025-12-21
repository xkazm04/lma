'use client';

import React, { memo } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ActivityPanel = memo(function ActivityPanel() {
  return (
    <Card
      className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200"
      data-testid="activity-panel"
      role="region"
      aria-label="Recent deal activity"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center py-6 text-center"
          data-testid="activity-placeholder"
        >
          <Clock className="h-8 w-8 text-zinc-300 mb-3" />
          <p className="text-sm text-zinc-500 font-medium">Activity coming soon</p>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time deal activity will appear here
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
