'use client';

import React from 'react';
import Link from 'next/link';
import { Timer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getDaysUntil } from '../lib/utils';
import type { Settlement } from '../lib/types';

interface UpcomingSettlementsProps {
  settlements: Settlement[];
}

export const UpcomingSettlements = React.memo<UpcomingSettlementsProps>(({ settlements }) => {
  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500" data-testid="upcoming-settlements-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Upcoming Settlements</CardTitle>
          <CardDescription>Next 14 days</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {settlements.length > 0 ? (
          <div className="divide-y divide-zinc-100" data-testid="settlements-list">
            {settlements.map((settlement) => {
              const daysUntil = getDaysUntil(settlement.settlement_date);
              return (
                <Link
                  key={settlement.trade_id}
                  href={`/trading/trades/${settlement.trade_id}`}
                  className="block py-2 first:pt-0 last:pb-0 animate-in fade-in duration-300 -mx-2 px-2 rounded-md hover:bg-zinc-50 transition-colors"
                  data-testid={`settlement-link-${settlement.trade_id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center w-10 py-0.5 px-1.5 bg-zinc-100 rounded text-center">
                      <span className="text-[10px] text-zinc-500">
                        {new Date(settlement.settlement_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold text-zinc-900">
                        {new Date(settlement.settlement_date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900">{settlement.trade_reference}</p>
                        <Badge variant={daysUntil <= 3 ? 'destructive' : daysUntil <= 7 ? 'warning' : 'secondary'} className="text-xs">
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-zinc-500">
                          {settlement.is_buyer ? 'Buy' : 'Sell'} · {settlement.counterparty}
                        </p>
                        <p className="text-xs font-medium text-zinc-700">
                          {formatCurrency(settlement.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4" data-testid="no-settlements-message">
            <Timer className="w-8 h-8 mx-auto text-zinc-300 mb-1.5" />
            <p className="text-sm text-zinc-500">No upcoming settlements</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

UpcomingSettlements.displayName = 'UpcomingSettlements';
