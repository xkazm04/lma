'use client';

import React, { memo } from 'react';
import { Inbox, AlertCircle, Clock, Bell, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InboxStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  requiresAction: number;
  pendingProposalsTotal: number;
}

interface InboxStatsHeaderProps {
  stats: InboxStats;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const statCards = [
  {
    id: 'all',
    label: 'Total Deals',
    icon: Inbox,
    colorClass: 'text-zinc-600',
    bgClass: 'bg-zinc-50',
    borderClass: 'border-zinc-200',
    getValue: (s: InboxStats) => s.total,
  },
  {
    id: 'critical',
    label: 'Critical',
    icon: AlertCircle,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    getValue: (s: InboxStats) => s.critical,
  },
  {
    id: 'high',
    label: 'High Priority',
    icon: Clock,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    getValue: (s: InboxStats) => s.high,
  },
  {
    id: 'proposals',
    label: 'Pending Proposals',
    icon: Bell,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    getValue: (s: InboxStats) => s.pendingProposalsTotal,
  },
  {
    id: 'low',
    label: 'On Track',
    icon: CheckCircle,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    getValue: (s: InboxStats) => s.low + s.medium,
  },
];

export const InboxStatsHeader = memo(function InboxStatsHeader({
  stats,
  selectedFilter,
  onFilterChange,
}: InboxStatsHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = card.getValue(stats);
        const isSelected = selectedFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            className={cn(
              'text-left transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md'
            )}
            data-testid={`inbox-stat-${card.id}`}
          >
            <Card
              className={cn(
                'cursor-pointer transition-all duration-200',
                isSelected
                  ? cn('ring-2 ring-offset-1', card.borderClass, 'ring-current', card.colorClass)
                  : 'hover:shadow-md hover:scale-[1.02]'
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'p-1.5 rounded-md',
                      isSelected ? card.bgClass : 'bg-zinc-50'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', card.colorClass)} />
                  </div>
                  {value > 0 && card.id !== 'all' && card.id !== 'low' && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5 py-0',
                        card.bgClass,
                        card.colorClass,
                        'border-transparent'
                      )}
                    >
                      {value}
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <p className={cn('text-xl font-bold', card.colorClass)}>{value}</p>
                  <p className="text-xs text-zinc-500 truncate">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
});
