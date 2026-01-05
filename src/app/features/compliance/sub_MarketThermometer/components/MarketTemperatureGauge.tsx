'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getMarketTemperatureColor, getMarketTemperatureLabel } from '../../lib/types';
import type { MarketThermometerReading, MarketTemperature } from '../../lib/types';

interface MarketTemperatureGaugeProps {
  reading: MarketThermometerReading;
}

interface TemperatureNeedleProps {
  score: number;
  temperature: MarketTemperature;
}

function TemperatureNeedle({ score, temperature }: TemperatureNeedleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const previousScoreRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const isCritical = temperature === 'hot' || temperature === 'warm';

  useEffect(() => {
    const startValue = previousScoreRef.current;
    const endValue = score;
    const duration = 1200;
    const startTime = performance.now();

    const easeOutElastic = (t: number): number => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0
        ? 0
        : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutElastic(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setAnimatedScore(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousScoreRef.current = endValue;
        if (isCritical) {
          setIsPulsing(true);
        }
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsPulsing(false);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, isCritical]);

  const needleX = `${animatedScore}%`;

  return (
    <div className="relative h-16 mt-4" data-testid="temperature-needle-container">
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        preserveAspectRatio="none"
        data-testid="temperature-needle-svg"
      >
        <defs>
          <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.4)" />
          </filter>
          <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="50%" stopColor="#374151" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="needleHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        <g
          style={{ transform: `translateX(${needleX})` }}
          className="transition-none"
        >
          {/* Needle body */}
          <polygon
            points="-6,48 6,48 2,8 -2,8"
            fill="url(#needleGradient)"
            filter="url(#needleShadow)"
            className={cn(
              isPulsing && 'animate-pulse-subtle'
            )}
          />

          {/* Needle highlight */}
          <polygon
            points="-5,46 0,46 0,10 -1.5,10"
            fill="url(#needleHighlight)"
          />

          {/* Needle cap (pivot point) */}
          <circle
            cx="0"
            cy="52"
            r="8"
            fill="url(#needleGradient)"
            filter="url(#needleShadow)"
          />

          {/* Cap highlight */}
          <circle
            cx="-2"
            cy="50"
            r="3"
            fill="rgba(255,255,255,0.2)"
          />

          {/* Critical pulse ring */}
          {isPulsing && (
            <circle
              cx="0"
              cy="52"
              r="12"
              fill="none"
              stroke={temperature === 'hot' ? '#ef4444' : '#f97316'}
              strokeWidth="2"
              className="animate-ping-slow"
              opacity="0.6"
            />
          )}
        </g>
      </svg>
    </div>
  );
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
          <div className="h-8 rounded-full overflow-hidden flex shadow-inner">
            <div className="flex-1 bg-gradient-to-r from-blue-700 to-blue-600" />
            <div className="flex-1 bg-gradient-to-r from-blue-500 to-blue-400" />
            <div className="flex-1 bg-gradient-to-r from-gray-400 to-gray-350" />
            <div className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500" />
            <div className="flex-1 bg-gradient-to-r from-red-500 to-red-600" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Very Cold</span>
            <span>Cold</span>
            <span>Neutral</span>
            <span>Warm</span>
            <span>Hot</span>
          </div>

          {/* Animated SVG Needle */}
          <TemperatureNeedle score={overall_score} temperature={overall_temperature} />
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
