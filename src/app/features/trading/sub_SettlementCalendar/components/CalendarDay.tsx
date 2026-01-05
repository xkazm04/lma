'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Ban, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import type { CalendarDay as CalendarDayType, SettlementRiskLevel } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

interface CalendarDayProps {
  day: CalendarDayType;
  isSelected: boolean;
  onSelect: (date: string) => void;
  compact?: boolean;
}

const riskColorClasses: Record<SettlementRiskLevel, string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
};

const riskBorderClasses: Record<SettlementRiskLevel, string> = {
  critical: 'border-red-200 bg-red-50',
  high: 'border-amber-200 bg-amber-50',
  medium: 'border-yellow-200 bg-yellow-50',
  low: 'border-green-100 bg-green-50',
};

export const CalendarDayComponent: React.FC<CalendarDayProps> = ({
  day,
  isSelected,
  onSelect,
  compact = false,
}) => {
  const dayNumber = format(parseISO(day.date), 'd');
  const hasSettlements = day.settlements.length > 0;
  const hasCritical = day.settlements.some((s) => s.risk_level === 'critical');
  const hasFlagged = day.settlements.some((s) => s.has_flagged_items);
  const hasMissingConsents = day.settlements.some((s) => s.missing_consents);

  const handleClick = () => {
    onSelect(day.date);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            data-testid={`calendar-day-${day.date}`}
            className={cn(
              'relative w-full p-1 min-h-[80px] border border-zinc-100 transition-all duration-150',
              'hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
              day.isCurrentMonth ? 'bg-white' : 'bg-zinc-50/50',
              day.isWeekend && day.isCurrentMonth && 'bg-zinc-50',
              day.isToday && 'ring-2 ring-blue-500 ring-inset',
              isSelected && 'bg-blue-50 border-blue-200',
              hasSettlements && day.highestRisk && riskBorderClasses[day.highestRisk],
              compact && 'min-h-[60px]'
            )}
          >
            {/* Day number */}
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  'inline-flex items-center justify-center w-6 h-6 text-sm rounded-full',
                  day.isToday && 'bg-blue-600 text-white font-semibold',
                  !day.isToday && day.isCurrentMonth && 'text-zinc-900',
                  !day.isToday && !day.isCurrentMonth && 'text-zinc-400'
                )}
              >
                {dayNumber}
              </span>

              {/* Risk indicators */}
              {hasSettlements && (
                <div className="flex items-center gap-0.5">
                  {hasCritical && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  )}
                  {hasFlagged && !hasCritical && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {hasMissingConsents && (
                    <Ban className="w-3.5 h-3.5 text-orange-500" />
                  )}
                </div>
              )}
            </div>

            {/* Settlement count and amount */}
            {hasSettlements && (
              <div className="mt-1 space-y-0.5">
                {day.settlements.length <= 2 ? (
                  day.settlements.map((settlement) => (
                    <div
                      key={settlement.trade_id}
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate',
                        settlement.risk_level === 'critical' && 'bg-red-100 text-red-800',
                        settlement.risk_level === 'high' && 'bg-amber-100 text-amber-800',
                        settlement.risk_level === 'medium' && 'bg-yellow-100 text-yellow-800',
                        settlement.risk_level === 'low' && 'bg-green-100 text-green-800'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          riskColorClasses[settlement.risk_level]
                        )}
                      />
                      <span className="truncate font-medium">
                        {settlement.counterparty.split(' ')[0]}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-100 rounded text-[10px]">
                    <span className="font-semibold">{day.settlements.length}</span>
                    <span className="text-zinc-600">settlements</span>
                  </div>
                )}

                {/* Total amount */}
                {day.totalAmount > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] text-zinc-600 px-1">
                    <DollarSign className="w-2.5 h-2.5" />
                    <span className="font-medium">{formatCurrency(day.totalAmount)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Funding forecast indicator */}
            {day.fundingForecast && day.fundingForecast.net_position !== 0 && (
              <div
                className={cn(
                  'absolute bottom-1 right-1 w-2 h-2 rounded-full',
                  day.fundingForecast.net_position > 0 ? 'bg-green-400' : 'bg-red-400'
                )}
              />
            )}
          </button>
        </TooltipTrigger>

        {hasSettlements && (
          <TooltipContent side="right" className="max-w-xs p-3">
            <div className="space-y-2">
              <div className="font-semibold text-sm">
                {format(parseISO(day.date), 'EEEE, MMM d')}
              </div>
              <div className="space-y-1.5">
                {day.settlements.slice(0, 5).map((settlement) => (
                  <div
                    key={settlement.trade_id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full mt-1 flex-shrink-0',
                        riskColorClasses[settlement.risk_level]
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {settlement.counterparty}
                      </div>
                      <div className="text-zinc-500">
                        {formatCurrency(settlement.amount)}
                        {settlement.is_buyer ? ' (Buy)' : ' (Sell)'}
                      </div>
                      {(settlement.has_flagged_items || settlement.missing_consents) && (
                        <div className="flex gap-1 mt-0.5">
                          {settlement.has_flagged_items && (
                            <Badge variant="warning" className="text-[10px] px-1 py-0">
                              Flagged
                            </Badge>
                          )}
                          {settlement.missing_consents && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">
                              No Consent
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {day.settlements.length > 5 && (
                  <div className="text-xs text-zinc-500 pt-1">
                    +{day.settlements.length - 5} more
                  </div>
                )}
              </div>
              {day.fundingForecast && (
                <div className="pt-2 border-t border-zinc-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Net Position:</span>
                    <span
                      className={cn(
                        'font-semibold',
                        day.fundingForecast.net_position >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {formatCurrency(Math.abs(day.fundingForecast.net_position))}
                      {day.fundingForecast.net_position >= 0 ? ' in' : ' out'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

CalendarDayComponent.displayName = 'CalendarDay';
