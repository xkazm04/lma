'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, TrendingDown, Check, X, MessageSquare } from 'lucide-react';
import type { HeadroomTrade } from '../lib/types';
import { cn } from '@/lib/utils';

interface TradeProposalCardProps {
  trade: HeadroomTrade;
  onAccept?: (tradeId: string) => void;
  onReject?: (tradeId: string) => void;
  onNegotiate?: (tradeId: string) => void;
}

export const TradeProposalCard = memo(function TradeProposalCard({
  trade,
  onAccept,
  onReject,
  onNegotiate,
}: TradeProposalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed':
        return 'bg-blue-100 text-blue-700';
      case 'negotiating':
        return 'bg-amber-100 text-amber-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'executed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-zinc-100 text-zinc-500';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getExchangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pricing_adjustment: 'Pricing Adjustment',
      cross_guarantee: 'Cross-Guarantee',
      shared_covenant: 'Shared Covenant',
      fee_sharing: 'Fee Sharing',
      hybrid: 'Hybrid Structure',
    };
    return labels[type] || type;
  };

  const renderExchangeDetails = () => {
    const { exchange_type, exchange_details } = trade;

    switch (exchange_type) {
      case 'pricing_adjustment':
        return (
          exchange_details.pricing_adjustment && (
            <div className="text-sm space-y-1">
              <p className="text-zinc-700">
                <span className="font-medium">Rate Reduction:</span>{' '}
                {exchange_details.pricing_adjustment.basis_points_reduction} bps
              </p>
              <p className="text-zinc-700">
                <span className="font-medium">Duration:</span>{' '}
                {exchange_details.pricing_adjustment.duration_months} months
              </p>
              <p className="text-zinc-700">
                <span className="font-medium">Est. Value:</span> $
                {exchange_details.pricing_adjustment.estimated_value_usd.toLocaleString()}
              </p>
            </div>
          )
        );
      case 'cross_guarantee':
        return (
          exchange_details.cross_guarantee && (
            <div className="text-sm space-y-1">
              <p className="text-zinc-700">
                <span className="font-medium">Guarantee Amount:</span> $
                {exchange_details.cross_guarantee.guarantee_amount_usd.toLocaleString()}
              </p>
              <p className="text-zinc-700">
                <span className="font-medium">Coverage:</span>{' '}
                {exchange_details.cross_guarantee.guarantee_percentage.toFixed(1)}%
              </p>
              <p className="text-zinc-700">
                <span className="font-medium">Duration:</span>{' '}
                {exchange_details.cross_guarantee.guarantee_duration_months} months
              </p>
            </div>
          )
        );
      case 'fee_sharing':
        return (
          exchange_details.fee_sharing && (
            <div className="text-sm space-y-1">
              <p className="text-zinc-700">
                <span className="font-medium">Annual Fee Reduction:</span> $
                {exchange_details.fee_sharing.annual_fee_reduction_usd.toLocaleString()}
              </p>
              <p className="text-zinc-700">
                <span className="font-medium">Commitment Fee:</span> -
                {exchange_details.fee_sharing.commitment_fee_reduction_bps} bps
              </p>
              <p className="text-zinc-700">
                <span className="font-medium">Duration:</span>{' '}
                {exchange_details.fee_sharing.duration_months} months
              </p>
            </div>
          )
        );
      case 'shared_covenant':
        return (
          exchange_details.shared_covenant && (
            <div className="text-sm space-y-1">
              <p className="text-zinc-700">
                <span className="font-medium">New Shared Threshold:</span>{' '}
                {exchange_details.shared_covenant.new_shared_threshold}x
              </p>
              <p className="text-zinc-700">
                <span className="font-medium">Pooled Calculation:</span>{' '}
                {exchange_details.shared_covenant.pooled_calculation ? 'Yes' : 'No'}
              </p>
              <p className="text-zinc-700">
                <span className="font-medium">Shared Liability:</span>{' '}
                {exchange_details.shared_covenant.shared_liability_percentage}%
              </p>
            </div>
          )
        );
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-all" data-testid={`trade-card-${trade.id}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with status */}
          <div className="flex items-start justify-between">
            <Badge className={getStatusColor(trade.status)}>
              {trade.status.replace(/_/g, ' ')}
            </Badge>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-xs">
                Score: {trade.compatibility_score}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Fair: {trade.fair_value_score}
              </Badge>
            </div>
          </div>

          {/* Trade parties */}
          <div className="space-y-3">
            {/* Offering party */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-600 font-medium mb-1">Offering</p>
                  <p className="font-semibold text-zinc-900 text-sm truncate">
                    {trade.offering_facility_name}
                  </p>
                  <p className="text-xs text-zinc-500">{trade.offering_covenant_name}</p>
                  <p className="text-xs text-green-700 font-medium mt-1">
                    Headroom: {trade.offering_headroom_percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="bg-zinc-100 rounded-full p-2">
                <ArrowRight className="w-5 h-5 text-zinc-600" />
              </div>
            </div>

            {/* Receiving party */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-600 font-medium mb-1">Receiving</p>
                  <p className="font-semibold text-zinc-900 text-sm truncate">
                    {trade.receiving_facility_name}
                  </p>
                  <p className="text-xs text-zinc-500">{trade.receiving_covenant_name}</p>
                  <p className="text-xs text-blue-700 font-medium mt-1">
                    Headroom: {trade.receiving_headroom_percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trade details */}
          <div className="bg-zinc-50 rounded-lg p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">Exchange Type</span>
                <Badge variant="secondary" className="text-xs">
                  {getExchangeTypeLabel(trade.exchange_type)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">Headroom Traded</span>
                <span className="text-sm font-semibold text-zinc-900">
                  {trade.headroom_amount_traded.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Exchange terms */}
          <div className="border-t border-zinc-200 pt-3">{renderExchangeDetails()}</div>

          {/* Actions */}
          {trade.status === 'proposed' && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onReject?.(trade.id)}
                data-testid={`reject-trade-btn-${trade.id}`}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onNegotiate?.(trade.id)}
                data-testid={`negotiate-trade-btn-${trade.id}`}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Negotiate
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onAccept?.(trade.id)}
                data-testid={`accept-trade-btn-${trade.id}`}
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
            </div>
          )}

          {trade.status === 'negotiating' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onNegotiate?.(trade.id)}
              data-testid={`view-negotiation-btn-${trade.id}`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              View Negotiation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
