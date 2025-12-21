'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, getStatusBadgeVariant, getStatusLabel } from '../lib/utils';
import type { Trade } from '../lib/types';

interface TradeCardProps {
  trade: Trade;
}

export const TradeCard = React.memo<TradeCardProps>(({ trade }) => {
  return (
    <Link key={trade.id} href={`/trading/trades/${trade.id}`} className="block" data-testid={`trade-card-link-${trade.id}`}>
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200 hover:shadow-sm animate-in fade-in slide-in-from-bottom-2" data-testid={`trade-card-${trade.id}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-zinc-900">{trade.trade_reference}</p>
            <Badge variant={getStatusBadgeVariant(trade.status)} className="text-xs">
              {getStatusLabel(trade.status)}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{trade.facility_name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-zinc-500">
              {trade.is_buyer ? 'Buy' : 'Sell'} · {trade.is_buyer ? trade.seller_name : trade.buyer_name}
            </span>
            <span className="text-xs font-medium text-zinc-700">
              {formatCurrency(trade.trade_amount)}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Progress value={trade.dd_progress} className="h-1.5 w-16" />
            <span className="text-xs font-medium text-zinc-700">{trade.dd_progress}%</span>
          </div>
          {(trade.flagged_items > 0 || trade.open_questions > 0) && (
            <div className="flex items-center gap-2 text-xs">
              {trade.flagged_items > 0 && (
                <span className="text-red-600">{trade.flagged_items} flagged</span>
              )}
              {trade.open_questions > 0 && (
                <span className="text-blue-600">{trade.open_questions}Q</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});

TradeCard.displayName = 'TradeCard';
