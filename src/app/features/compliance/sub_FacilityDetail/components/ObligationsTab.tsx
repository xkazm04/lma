'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Obligation } from '../../lib';
import { formatDateShort } from '../../lib';
import {
  getUrgencyInfo,
  getUrgencyDisplayConfig,
  getDaysUntil,
} from '@/lib/utils/urgency';

interface ObligationsTabProps {
  obligations: Obligation[];
}

export const ObligationsTab = memo(function ObligationsTab({ obligations }: ObligationsTabProps) {
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Reporting Obligations</h2>
          <p className="text-sm text-zinc-500">Required compliance deliverables</p>
        </div>
        <Button
          size="sm"
          className="hover:shadow-sm transition-all"
          data-testid="add-obligation-btn"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="grid gap-3">
        {obligations.map((obligation, idx) => {
          const urgencyInfo = getUrgencyInfo(obligation.upcoming_event.deadline_date);
          const displayConfig = getUrgencyDisplayConfig(urgencyInfo.level);
          const UrgencyIcon = displayConfig.Icon;

          return (
            <Card
              key={obligation.id}
              className={cn(
                'transition-all hover:shadow-md',
                'animate-in fade-in slide-in-from-left-2',
                displayConfig.isPulsing && 'ring-2 ring-red-200'
              )}
              style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
              data-testid={`obligation-card-${obligation.id}`}
            >
              <CardContent className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm text-zinc-900">{obligation.name}</h3>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        data-testid={`obligation-frequency-${obligation.id}`}
                      >
                        {obligation.frequency}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Due {obligation.deadline_days_after_period}d after period end
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Next Due</p>
                    <p className="font-medium text-sm text-zinc-900">
                      {formatDateShort(obligation.upcoming_event.deadline_date)}
                    </p>
                    <Badge
                      variant={displayConfig.variant}
                      className={cn(
                        'mt-1 inline-flex items-center gap-1',
                        displayConfig.badgeClass,
                        displayConfig.isPulsing && 'animate-pulse-urgent'
                      )}
                      data-testid={`obligation-urgency-badge-${obligation.id}`}
                      aria-label={`${displayConfig.label}: ${urgencyInfo.daysUntil} days until deadline`}
                    >
                      <UrgencyIcon className={cn(
                        displayConfig.variant === 'secondary' ? 'w-3 h-3' : 'w-3.5 h-3.5'
                      )} />
                      <span>{urgencyInfo.daysUntil}d</span>
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});
