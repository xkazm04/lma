'use client';

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getWaiverExpirationUrgency,
  formatWaiverExpiration,
} from '@/lib/utils/urgency';

interface WaiverBadgeProps {
  expirationDate: string;
  compact?: boolean;
  className?: string;
}

export const WaiverBadge = memo(function WaiverBadge({
  expirationDate,
  compact = false,
  className,
}: WaiverBadgeProps) {
  const urgency = getWaiverExpirationUrgency(expirationDate);
  const formattedDate = formatWaiverExpiration(expirationDate);

  if (compact) {
    return (
      <Badge
        className={cn(
          urgency === 'critical' && 'bg-red-100 text-red-700 hover:bg-red-100',
          urgency === 'warning' && 'bg-amber-100 text-amber-700 hover:bg-amber-100',
          urgency === 'normal' && 'bg-purple-100 text-purple-700 hover:bg-purple-100',
          className
        )}
        data-testid="waiver-badge-compact"
      >
        <ShieldCheck className="w-3 h-3 mr-1" />
        Waived
      </Badge>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        urgency === 'critical' && 'bg-red-50 border border-red-200',
        urgency === 'warning' && 'bg-amber-50 border border-amber-200',
        urgency === 'normal' && 'bg-purple-50 border border-purple-200',
        className
      )}
      data-testid="waiver-badge-full"
    >
      <ShieldCheck
        className={cn(
          'w-4 h-4',
          urgency === 'critical' && 'text-red-600',
          urgency === 'warning' && 'text-amber-600',
          urgency === 'normal' && 'text-purple-600'
        )}
      />
      <div className="flex flex-col">
        <span
          className={cn(
            'text-xs font-medium',
            urgency === 'critical' && 'text-red-700',
            urgency === 'warning' && 'text-amber-700',
            urgency === 'normal' && 'text-purple-700'
          )}
        >
          Waiver Active
        </span>
        <div className="flex items-center gap-1">
          <Clock
            className={cn(
              'w-3 h-3',
              urgency === 'critical' && 'text-red-500',
              urgency === 'warning' && 'text-amber-500',
              urgency === 'normal' && 'text-purple-500'
            )}
          />
          <span
            className={cn(
              'text-xs',
              urgency === 'critical' && 'text-red-600 font-medium',
              urgency === 'warning' && 'text-amber-600',
              urgency === 'normal' && 'text-purple-600'
            )}
          >
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
});
