'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { FundingForecast } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

interface FundingForecastPanelProps {
  forecasts: FundingForecast[];
  totalFundingRequired: number;
}

export const FundingForecastPanel: React.FC<FundingForecastPanelProps> = ({
  forecasts,
  totalFundingRequired,
}) => {
  // Calculate aggregates
  const totalInflows = forecasts.reduce((sum, f) => sum + f.total_inflows, 0);
  const totalOutflows = forecasts.reduce((sum, f) => sum + f.total_outflows, 0);
  const netPosition = totalInflows - totalOutflows;

  // Get next 7 days of forecasts
  const upcomingForecasts = forecasts.slice(0, 7);

  return (
    <div
      className="bg-white rounded-lg border border-zinc-200 overflow-hidden"
      data-testid="funding-forecast-panel"
    >
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-zinc-600" />
            <span className="font-semibold text-sm text-zinc-900">
              Funding Forecast
            </span>
          </div>
          <Badge
            variant={netPosition >= 0 ? 'success' : 'destructive'}
            className="text-xs"
          >
            {netPosition >= 0 ? 'Net Positive' : 'Net Negative'}
          </Badge>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 divide-x divide-zinc-100 border-b border-zinc-100">
        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Inflows</span>
          </div>
          <div className="text-sm font-semibold text-zinc-900">
            {formatCurrency(totalInflows)}
          </div>
        </div>

        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Outflows</span>
          </div>
          <div className="text-sm font-semibold text-zinc-900">
            {formatCurrency(totalOutflows)}
          </div>
        </div>

        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-zinc-600 mb-1">
            {netPosition >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            )}
            <span className="text-xs font-medium">Net</span>
          </div>
          <div
            className={cn(
              'text-sm font-semibold',
              netPosition >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {netPosition >= 0 ? '+' : ''}
            {formatCurrency(netPosition)}
          </div>
        </div>
      </div>

      {/* Funding requirement alert */}
      {totalFundingRequired > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100" data-testid="funding-requirement-alert">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-800">
                Funding Requirement (30 days)
              </div>
              <div className="text-xs text-amber-600">
                {formatCurrency(totalFundingRequired)} needed for upcoming purchases
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily breakdown */}
      {upcomingForecasts.length > 0 && (
        <div className="divide-y divide-zinc-100 max-h-[200px] overflow-auto">
          {upcomingForecasts.map((forecast) => {
            const dateObj = parseISO(forecast.date);
            const isToday =
              format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <div
                key={forecast.date}
                className={cn(
                  'px-4 py-2 flex items-center justify-between',
                  isToday && 'bg-blue-50'
                )}
                data-testid={`forecast-day-${forecast.date}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs',
                      isToday ? 'font-semibold text-blue-600' : 'text-zinc-600'
                    )}
                  >
                    {format(dateObj, 'EEE, MMM d')}
                  </span>
                  {isToday && (
                    <Badge variant="info" className="text-[10px] px-1">
                      Today
                    </Badge>
                  )}
                  <span className="text-xs text-zinc-400">
                    ({forecast.settlements.length} settlement
                    {forecast.settlements.length !== 1 ? 's' : ''})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {forecast.total_inflows > 0 && (
                    <span className="text-xs text-green-600">
                      +{formatCurrency(forecast.total_inflows)}
                    </span>
                  )}
                  {forecast.total_outflows > 0 && (
                    <span className="text-xs text-red-600">
                      -{formatCurrency(forecast.total_outflows)}
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-xs font-semibold min-w-[60px] text-right',
                      forecast.net_position >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {forecast.net_position >= 0 ? '+' : ''}
                    {formatCurrency(forecast.net_position)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {upcomingForecasts.length === 0 && (
        <div className="px-4 py-6 text-center text-zinc-500" data-testid="forecast-empty">
          <DollarSign className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
          <p className="text-sm">No forecasts available</p>
        </div>
      )}
    </div>
  );
};

FundingForecastPanel.displayName = 'FundingForecastPanel';
