'use client';

import React from 'react';
import Link from 'next/link';
import { DollarSign, ArrowLeftRight, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getStatusBadge } from '../lib/utils';
import type { Position } from '../lib/types';

interface PositionCardProps {
  position: Position;
}

export const PositionCard = React.memo<PositionCardProps>(({ position }) => {
  const priceChange = position.current_price - position.acquisition_price;
  const percentChange = ((priceChange / position.acquisition_price) * 100).toFixed(2);

  return (
    <Link href={`/trading/positions/${position.id}`} data-testid={`position-card-${position.id}`}>
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200 cursor-pointer hover:shadow-sm animate-in fade-in slide-in-from-bottom-2">
        <div className={`p-1.5 rounded-lg ${
          position.facility_status === 'default' ? 'bg-red-100 text-red-600' :
          position.facility_status === 'watchlist' ? 'bg-amber-100 text-amber-600' :
          'bg-zinc-100 text-zinc-600'
        }`}>
          <DollarSign className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-zinc-900 truncate">{position.facility_name}</p>
            {getStatusBadge(position.facility_status)}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {position.position_type === 'agent' ? 'Agent' : 'Participant'}
            </Badge>
            {position.has_active_trade && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-blue-600 bg-blue-50">
                <ArrowLeftRight className="w-2.5 h-2.5 mr-0.5" />
                Trading
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{position.borrower_name}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-medium text-sm text-zinc-900">{formatCurrency(position.commitment_amount)}</p>
          <p className="text-xs text-zinc-500">{formatCurrency(position.funded_amount)} funded</p>
        </div>

        <div className="text-right shrink-0 w-20">
          <p className="font-medium text-sm text-zinc-900">{position.current_price}%</p>
          <div className="text-xs">
            {priceChange > 0 ? (
              <span className="flex items-center text-green-600" data-testid="price-change-positive">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{percentChange}%
              </span>
            ) : priceChange < 0 ? (
              <span className="flex items-center text-red-600" data-testid="price-change-negative">
                <TrendingDown className="w-4 h-4 mr-1" />
                {percentChange}%
              </span>
            ) : (
              <span className="text-zinc-500" data-testid="price-change-neutral">0.00%</span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-zinc-400" />
      </div>
    </Link>
  );
});

PositionCard.displayName = 'PositionCard';
