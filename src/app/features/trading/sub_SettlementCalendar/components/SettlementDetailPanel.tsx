'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  X,
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  FileText,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CalendarSettlement, SettlementRiskLevel } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

interface SettlementDetailPanelProps {
  date: string;
  settlements: CalendarSettlement[];
  onClose: () => void;
  onViewTrade?: (tradeId: string) => void;
}

const riskBadgeVariants: Record<SettlementRiskLevel, 'destructive' | 'warning' | 'secondary' | 'success'> = {
  critical: 'destructive',
  high: 'warning',
  medium: 'secondary',
  low: 'success',
};

const riskLabels: Record<SettlementRiskLevel, string> = {
  critical: 'Critical Risk',
  high: 'High Risk',
  medium: 'Medium Risk',
  low: 'Low Risk',
};

export const SettlementDetailPanel: React.FC<SettlementDetailPanelProps> = ({
  date,
  settlements,
  onClose,
  onViewTrade,
}) => {
  const dateObj = parseISO(date);
  const isOverdue = dateObj < new Date();
  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
  const totalInflows = settlements
    .filter((s) => !s.is_buyer)
    .reduce((sum, s) => sum + s.amount, 0);
  const totalOutflows = settlements
    .filter((s) => s.is_buyer)
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div
      className="bg-white rounded-lg border border-zinc-200 shadow-lg overflow-hidden"
      data-testid="settlement-detail-panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-900">
              {format(dateObj, 'EEEE, MMMM d, yyyy')}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px]">
                Overdue
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClose}
            data-testid="settlement-detail-close-btn"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary stats - standardized padding with FundingForecastPanel */}
      <div className="grid grid-cols-3 divide-x divide-zinc-100 border-b border-zinc-100">
        <div className="px-4 py-3 text-center">
          <div className="text-xs text-zinc-500 mb-0.5">Settlements</div>
          <div className="text-sm font-semibold text-zinc-900">
            {settlements.length}
          </div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-0.5">
            <ArrowDownLeft className="w-3 h-3" />
            <span className="text-xs">Inflows</span>
          </div>
          <div className="text-sm font-semibold text-green-600">
            {formatCurrency(totalInflows)}
          </div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span className="text-xs">Outflows</span>
          </div>
          <div className="text-sm font-semibold text-red-600">
            {formatCurrency(totalOutflows)}
          </div>
        </div>
      </div>

      {/* Settlements list */}
      <div className="max-h-[400px] overflow-auto divide-y divide-zinc-100">
        {settlements.map((settlement) => (
          <div
            key={settlement.trade_id}
            className="p-4 hover:bg-zinc-50 transition-colors"
            data-testid={`settlement-detail-item-${settlement.trade_id}`}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-zinc-900">
                    {settlement.counterparty}
                  </span>
                  <Badge
                    variant={riskBadgeVariants[settlement.risk_level]}
                    className="text-[10px] px-1.5"
                  >
                    {riskLabels[settlement.risk_level]}
                  </Badge>
                </div>
                <div className="text-xs text-zinc-500">
                  {settlement.trade_reference}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  {settlement.is_buyer ? (
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  )}
                  <span
                    className={cn(
                      'font-semibold text-base',
                      settlement.is_buyer ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {formatCurrency(settlement.amount)}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {settlement.is_buyer ? 'Outflow (Buy)' : 'Inflow (Sell)'}
                </div>
              </div>
            </div>

            {/* Facility info */}
            <div className="flex items-center gap-1 text-xs text-zinc-600 mb-2">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>{settlement.facility_name}</span>
              <span className="text-zinc-300">•</span>
              <span>{settlement.borrower_name}</span>
            </div>

            {/* Status indicators */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {settlement.dd_complete ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-xs text-green-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>DD Complete</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded text-xs text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>DD In Progress</span>
                </div>
              )}

              {settlement.has_flagged_items && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded text-xs text-red-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flagged Items</span>
                </div>
              )}

              {settlement.missing_consents && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded text-xs text-orange-700">
                  <Ban className="w-3.5 h-3.5" />
                  <span>Missing Consent</span>
                </div>
              )}

              {!settlement.has_flagged_items &&
                !settlement.missing_consents &&
                settlement.dd_complete && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-xs text-green-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Ready</span>
                  </div>
                )}
            </div>

            {/* Reminders */}
            {settlement.reminders.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-3.5 h-3.5 text-zinc-400" />
                <div className="flex flex-wrap gap-1">
                  {settlement.reminders.map((reminder) => (
                    <Badge
                      key={reminder.id}
                      variant={reminder.sent ? 'secondary' : 'info'}
                      className="text-[10px] px-1.5"
                    >
                      T-{reminder.days_before}
                      {reminder.sent && ' (sent)'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                data-testid={`settlement-view-docs-btn-${settlement.trade_id}`}
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Documents
              </Button>

              {onViewTrade && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onViewTrade(settlement.trade_id)}
                  data-testid={`settlement-view-trade-btn-${settlement.trade_id}`}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  View Trade
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Total: {formatCurrency(totalAmount)} across {settlements.length} settlement
            {settlements.length !== 1 ? 's' : ''}
          </span>
          <span>
            Net: {totalInflows >= totalOutflows ? '+' : ''}
            {formatCurrency(totalInflows - totalOutflows)}
          </span>
        </div>
      </div>
    </div>
  );
};

SettlementDetailPanel.displayName = 'SettlementDetailPanel';
