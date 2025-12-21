'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getMarketTemperatureColor, getMarketTemperatureLabel } from '../../lib/types';
import type { MarketThermometerReading } from '../../lib/types';

interface MarketTemperatureGaugeProps {
  reading: MarketThermometerReading;
}

export function MarketTemperatureGauge({ reading }: MarketTemperatureGaugeProps) {
  const { overall_temperature, overall_score, industry_readings, covenant_type_readings } = reading;

  return (
    <div className="space-y-6" data-testid="market-temperature-gauge">
      {/* Overall Temperature */}
      <div className="text-center space-y-4">
        <div className="inline-flex flex-col items-center">
          <div className="text-sm text-muted-foreground mb-2">Overall Market Temperature</div>
          <Badge className={cn('text-lg px-6 py-2', getMarketTemperatureColor(overall_temperature))}>
            {getMarketTemperatureLabel(overall_temperature)}
          </Badge>
          <div className="text-3xl font-bold mt-2">{overall_score}/100</div>
        </div>

        {/* Temperature Scale */}
        <div className="max-w-2xl mx-auto mt-6">
          <div className="h-8 rounded-full overflow-hidden flex">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-blue-400" />
            <div className="flex-1 bg-gray-400" />
            <div className="flex-1 bg-orange-400" />
            <div className="flex-1 bg-red-500" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Very Cold</span>
            <span>Cold</span>
            <span>Neutral</span>
            <span>Warm</span>
            <span>Hot</span>
          </div>
          <div className="relative h-2 mt-2">
            <div
              className="absolute top-0 w-0.5 h-full bg-black"
              style={{ left: `${overall_score}%` }}
            />
            <div
              className="absolute top-2 w-3 h-3 bg-black rounded-full -translate-x-1/2"
              style={{ left: `${overall_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Industry Readings */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Industry Temperatures</h4>
        <div className="space-y-2">
          {industry_readings.map((industry) => (
            <div
              key={industry.industry}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              data-testid={`industry-reading-${industry.industry}`}
            >
              <div className="flex items-center gap-3">
                <Badge className={cn('text-xs', getMarketTemperatureColor(industry.temperature))}>
                  {industry.industry}
                </Badge>
                <span className="text-sm font-medium">{industry.score}/100</span>
              </div>
              <div className={cn(
                'text-xs font-medium',
                industry.change_from_last_quarter < 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {industry.change_from_last_quarter > 0 ? '+' : ''}
                {industry.change_from_last_quarter}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Covenant Type Readings */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Covenant Type Stress Levels</h4>
        <div className="space-y-2">
          {covenant_type_readings.map((covenant) => (
            <div
              key={covenant.covenant_type}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              data-testid={`covenant-reading-${covenant.covenant_type}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Badge className={cn('text-xs', getMarketTemperatureColor(covenant.temperature))}>
                  {covenant.covenant_type.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm font-medium">{covenant.score}/100</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {covenant.at_risk_percentage.toFixed(0)}% at-risk
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
