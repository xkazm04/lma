'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRightLeft, Building2, ShieldCheck } from 'lucide-react';
import type { HeadroomListing } from '../lib/types';
import { cn } from '@/lib/utils';

interface HeadroomListingCardProps {
  listing: HeadroomListing;
  onProposeTrade?: (listingId: string) => void;
}

export const HeadroomListingCard = memo(function HeadroomListingCard({
  listing,
  onProposeTrade,
}: HeadroomListingCardProps) {
  const getRiskTierColor = (tier: string) => {
    switch (tier) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-blue-100 text-blue-700';
      case 'high':
        return 'bg-amber-100 text-amber-700';
      case 'very_high':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getExchangeTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      pricing_adjustment: 'Pricing',
      cross_guarantee: 'Guarantee',
      shared_covenant: 'Shared',
      fee_sharing: 'Fee Share',
      hybrid: 'Hybrid',
    };
    return labels[type] || type;
  };

  return (
    <Card className="hover:shadow-md transition-all" data-testid={`listing-card-${listing.id}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-zinc-400" />
                <h3 className="font-semibold text-zinc-900">{listing.facility_name}</h3>
              </div>
              <p className="text-sm text-zinc-500">{listing.borrower_name}</p>
            </div>
            <Badge className={getRiskTierColor(listing.borrower_risk_tier)}>
              {listing.facility_credit_rating}
            </Badge>
          </div>

          {/* Covenant info */}
          <div className="bg-zinc-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700">{listing.covenant_name}</span>
              <Badge variant="outline" className="text-xs">
                {listing.covenant_type.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Headroom visualization */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Available Headroom</span>
                <span className="font-semibold text-zinc-900">
                  {listing.available_for_trade_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    listing.available_for_trade_percentage >= 30
                      ? 'bg-green-500'
                      : listing.available_for_trade_percentage >= 15
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.min(listing.available_for_trade_percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-zinc-500">
                Total: {listing.current_headroom_percentage.toFixed(1)}% (
                {listing.threshold_type === 'maximum'
                  ? listing.current_headroom_absolute.toLocaleString()
                  : `$${(listing.current_headroom_absolute / 1000000).toFixed(1)}M`}
                )
              </div>
            </div>
          </div>

          {/* Exchange types seeking */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Seeking Exchange:</p>
            <div className="flex flex-wrap gap-1.5">
              {listing.seeking_exchange_types.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {getExchangeTypeBadge(type)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action button */}
          <Button
            className="w-full"
            size="sm"
            onClick={() => onProposeTrade?.(listing.id)}
            data-testid={`propose-trade-btn-${listing.id}`}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Propose Trade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
