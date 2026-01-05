'use client';

import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { CalendarSettlement, SettlementRiskLevel } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

interface SettlementListViewProps {
  settlements: CalendarSettlement[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const riskBadgeVariants: Record<SettlementRiskLevel, 'destructive' | 'warning' | 'secondary' | 'success'> = {
  critical: 'destructive',
  high: 'warning',
  medium: 'secondary',
  low: 'success',
};

const riskLabels: Record<SettlementRiskLevel, string> = {
  critical: 'Critical',
  high: 'High Risk',
  medium: 'Medium',
  low: 'Low Risk',
};

export const SettlementListView: React.FC<SettlementListViewProps> = ({
  settlements,
  selectedDate,
  onSelectDate,
}) => {
  // Group settlements by date
  const groupedSettlements = useMemo(() => {
    const groups = new Map<string, CalendarSettlement[]>();

    for (const settlement of settlements) {
      const date = settlement.settlement_date;
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(settlement);
    }

    // Sort groups by date
    return Array.from(groups.entries()).sort(
      (a, b) => parseISO(a[0]).getTime() - parseISO(b[0]).getTime()
    );
  }, [settlements]);

  if (settlements.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-500" data-testid="settlement-list-empty">
        <div className="text-center">
          <Clock className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
          <p className="text-sm">No upcoming settlements</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" data-testid="settlement-list-view">
      <div className="divide-y divide-zinc-100">
        {groupedSettlements.map(([date, dateSettlements]) => {
          const isSelected = selectedDate === date;
          const dateObj = parseISO(date);
          const isOverdue = dateObj < new Date();

          return (
            <div
              key={date}
              className={cn(
                'transition-colors duration-150',
                isSelected && 'bg-blue-50'
              )}
            >
              {/* Date header */}
              <button
                type="button"
                onClick={() => onSelectDate(date)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2 bg-zinc-50',
                  'hover:bg-zinc-100 focus:outline-none focus:bg-zinc-100'
                )}
                data-testid={`settlement-list-date-${date}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900">
                    {format(dateObj, 'EEE, MMM d, yyyy')}
                  </span>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-[10px] px-1.5">
                      Overdue
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-zinc-500">
                  {dateSettlements.length} settlement{dateSettlements.length !== 1 ? 's' : ''}
                </span>
              </button>

              {/* Settlements for this date */}
              <div className="divide-y divide-zinc-50">
                {dateSettlements.map((settlement) => (
                  <div
                    key={settlement.trade_id}
                    className="px-4 py-3 hover:bg-zinc-50/50"
                    data-testid={`settlement-item-${settlement.trade_id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Counterparty and reference */}
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-zinc-900 truncate">
                            {settlement.counterparty}
                          </span>
                          <Badge
                            variant={riskBadgeVariants[settlement.risk_level]}
                            className="text-[10px] px-1.5 shrink-0"
                          >
                            {riskLabels[settlement.risk_level]}
                          </Badge>
                        </div>

                        {/* Facility and borrower */}
                        <div className="text-xs text-zinc-500 mt-0.5 truncate">
                          {settlement.facility_name} • {settlement.borrower_name}
                        </div>

                        {/* Trade reference */}
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {settlement.trade_reference}
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center gap-2 mt-2">
                          {settlement.dd_complete ? (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>DD Complete</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <Clock className="w-3.5 h-3.5" />
                              <span>DD Pending</span>
                            </div>
                          )}

                          {settlement.has_flagged_items && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Flagged</span>
                            </div>
                          )}

                          {settlement.missing_consents && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <Ban className="w-3.5 h-3.5" />
                              <span>No Consent</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          {settlement.is_buyer ? (
                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4 text-green-500" />
                          )}
                          <span
                            className={cn(
                              'font-semibold text-sm',
                              settlement.is_buyer ? 'text-red-600' : 'text-green-600'
                            )}
                          >
                            {formatCurrency(settlement.amount)}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {settlement.is_buyer ? 'Outflow' : 'Inflow'}
                        </div>

                        {settlement.funding_requirement > 0 && (
                          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Funding req.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

SettlementListView.displayName = 'SettlementListView';
