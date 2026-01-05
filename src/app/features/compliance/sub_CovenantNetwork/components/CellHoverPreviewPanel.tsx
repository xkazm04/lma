'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/ui/sparkline';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react';
import type { CorrelationStrength } from '../../lib/correlation-types';
import { categorizeCorrelationStrength, getCorrelationStrengthColor } from '../../lib/correlation-types';

export interface CellHoverData {
  rowCovenantId: string;
  rowCovenantName: string;
  rowFacilityName: string;
  rowBorrowerName: string;
  colCovenantId: string;
  colCovenantName: string;
  colFacilityName: string;
  colBorrowerName: string;
  correlationValue: number;
  pValue: number;
  leadLagQuarters: number;
  historicalCorrelation?: number[];
  coBreachCount?: number;
}

interface CellHoverPreviewPanelProps {
  data: CellHoverData | null;
  position: { x: number; y: number } | null;
}

/**
 * Generate AI interpretation for the correlation cell.
 */
function generateAIInterpretation(data: CellHoverData): string {
  const { correlationValue, pValue, leadLagQuarters, rowCovenantName, colCovenantName, coBreachCount } = data;

  if (pValue > 0.05) {
    return `No statistically significant relationship detected between these covenants.`;
  }

  const strength = categorizeCorrelationStrength(correlationValue);
  const direction = correlationValue > 0 ? 'positive' : 'negative';

  let interpretation = '';

  // Direction and strength
  if (direction === 'positive') {
    if (strength === 'very_strong' || strength === 'strong') {
      interpretation = `Strong synchronization: when ${rowCovenantName} deteriorates, ${colCovenantName} typically follows.`;
    } else if (strength === 'moderate') {
      interpretation = `Moderate alignment between ${rowCovenantName} and ${colCovenantName} suggests shared risk exposure.`;
    } else {
      interpretation = `Weak positive correlation may indicate indirect relationship through common factors.`;
    }
  } else {
    if (strength === 'very_strong' || strength === 'strong') {
      interpretation = `Inverse relationship: improvement in ${rowCovenantName} often coincides with stress on ${colCovenantName}.`;
    } else if (strength === 'moderate') {
      interpretation = `Moderate inverse correlation suggests potential hedging effect between covenants.`;
    } else {
      interpretation = `Weak negative correlation may reflect offsetting business dynamics.`;
    }
  }

  // Add lead-lag context
  if (leadLagQuarters !== 0) {
    const leadLagText = leadLagQuarters > 0
      ? `Row covenant leads by ${leadLagQuarters}Q`
      : `Column covenant leads by ${Math.abs(leadLagQuarters)}Q`;
    interpretation += ` ${leadLagText} — early warning potential.`;
  }

  // Add co-breach context
  if (coBreachCount && coBreachCount > 2) {
    interpretation += ` Historical co-breach pattern (${coBreachCount}x) warrants monitoring.`;
  }

  return interpretation;
}

/**
 * Generate mock historical correlation data for sparkline.
 */
function generateHistoricalCorrelation(baseValue: number, periods: number = 12): number[] {
  const data: number[] = [];
  let value = baseValue * 0.6; // Start lower than current
  const targetValue = baseValue;
  const volatility = 0.15;

  for (let i = 0; i < periods; i++) {
    // Trend towards target with some noise
    const trendComponent = (targetValue - value) * 0.2;
    const noiseComponent = (Math.random() - 0.5) * volatility;
    value = Math.max(-1, Math.min(1, value + trendComponent + noiseComponent));
    data.push(value);
  }

  return data;
}

/**
 * Calculate optimal panel position to avoid viewport overflow.
 */
function calculatePosition(
  mouseX: number,
  mouseY: number,
  panelWidth: number,
  panelHeight: number
): { top: number; left: number; placement: 'top' | 'bottom' | 'left' | 'right' } {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const offset = 16;
  const padding = 20;

  // Default: position to the right and slightly below
  let left = mouseX + offset;
  let top = mouseY - panelHeight / 2;
  let placement: 'top' | 'bottom' | 'left' | 'right' = 'right';

  // Check right overflow
  if (left + panelWidth > viewportWidth - padding) {
    left = mouseX - panelWidth - offset;
    placement = 'left';
  }

  // Check left overflow
  if (left < padding) {
    left = mouseX - panelWidth / 2;
    top = mouseY + offset;
    placement = 'bottom';
  }

  // Check bottom overflow
  if (top + panelHeight > viewportHeight - padding) {
    top = viewportHeight - panelHeight - padding;
  }

  // Check top overflow
  if (top < padding) {
    top = padding;
  }

  return { top, left, placement };
}

/**
 * Rich hover preview panel for correlation matrix cells.
 * Shows full covenant names, sparkline, co-breach count, and AI interpretation.
 */
export function CellHoverPreviewPanel({
  data,
  position,
}: CellHoverPreviewPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showState, setShowState] = useState<{ visible: boolean; dataSnapshot: CellHoverData | null }>({
    visible: false,
    dataSnapshot: null,
  });

  // Handle show/hide with proper cleanup
  useEffect(() => {
    // Clear any pending timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (!data || !position) {
      // Hide immediately when data is cleared - use timeout to avoid sync setState
      showTimeoutRef.current = setTimeout(() => {
        setShowState({ visible: false, dataSnapshot: null });
      }, 0);
      return;
    }

    // Show with delay for stability
    showTimeoutRef.current = setTimeout(() => {
      setShowState({ visible: true, dataSnapshot: data });
    }, 100);

    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
    };
  }, [data, position]);

  // Calculate position - derived from props
  const panelPosition = useMemo(() => {
    if (!showState.visible || !position) return null;

    const panelWidth = 340;
    const panelHeight = 280;
    return calculatePosition(
      position.x,
      position.y,
      panelWidth,
      panelHeight
    );
  }, [showState.visible, position]);

  const isVisible = showState.visible && panelPosition !== null;
  const displayData = showState.dataSnapshot;

  // Generate sparkline data
  const historicalData = useMemo(() => {
    if (!displayData) return [];
    return displayData.historicalCorrelation ?? generateHistoricalCorrelation(displayData.correlationValue);
  }, [displayData]);

  // Generate AI interpretation
  const aiInterpretation = useMemo(() => {
    if (!displayData) return '';
    return generateAIInterpretation(displayData);
  }, [displayData]);

  if (!displayData || !panelPosition || !isVisible) {
    return null;
  }

  const { correlationValue, pValue, leadLagQuarters, coBreachCount } = displayData;
  const isSignificant = pValue <= 0.05;
  const strength = categorizeCorrelationStrength(correlationValue);
  const strengthColor = getCorrelationStrengthColor(strength);
  const direction = correlationValue > 0 ? 'positive' : 'negative';

  const strengthLabels: Record<CorrelationStrength, string> = {
    very_strong: 'Very Strong',
    strong: 'Strong',
    moderate: 'Moderate',
    weak: 'Weak',
    very_weak: 'Very Weak',
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed z-[100] w-[340px]',
        'bg-white/95 backdrop-blur-md',
        'border border-zinc-200 rounded-lg shadow-xl',
        'transform transition-all duration-200 ease-out',
        isVisible
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95 pointer-events-none'
      )}
      style={{
        top: panelPosition.top,
        left: panelPosition.left,
      }}
      data-testid="cell-hover-preview-panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/80 rounded-t-lg">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: strengthColor }}
          />
          <span className="text-sm font-semibold text-zinc-800">
            Correlation: {correlationValue.toFixed(3)}
          </span>
          {!isSignificant && (
            <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-300">
              Not Significant
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-600">{strengthLabels[strength]}</span>
          <span>•</span>
          <span>p = {pValue.toFixed(4)}</span>
          {leadLagQuarters !== 0 && (
            <>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{leadLagQuarters > 0 ? `+${leadLagQuarters}Q` : `${leadLagQuarters}Q`}</span>
            </>
          )}
        </div>
      </div>

      {/* Covenant Names */}
      <div className="px-4 py-3 border-b border-zinc-100 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-12 text-xs text-zinc-400 font-medium pt-0.5">Row</div>
          <div>
            <div className="text-sm font-medium text-zinc-800" data-testid="row-covenant-name">
              {displayData.rowCovenantName}
            </div>
            <div className="text-xs text-zinc-500">
              {displayData.rowFacilityName} • {displayData.rowBorrowerName}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-12 text-xs text-zinc-400 font-medium pt-0.5">Col</div>
          <div>
            <div className="text-sm font-medium text-zinc-800" data-testid="col-covenant-name">
              {displayData.colCovenantName}
            </div>
            <div className="text-xs text-zinc-500">
              {displayData.colFacilityName} • {displayData.colBorrowerName}
            </div>
          </div>
        </div>
      </div>

      {/* Sparkline + Stats */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Historical Correlation</div>
            <Sparkline
              data={historicalData}
              width={140}
              height={32}
              strokeColor={direction === 'positive' ? '#3b82f6' : '#f59e0b'}
              fillColor="auto"
              showEndDot
              animate
              smoothing={0.3}
            />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              {direction === 'positive' ? (
                <TrendingUp className="w-4 h-4 text-blue-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-sm font-medium text-zinc-700 capitalize">{direction}</span>
            </div>
            {coBreachCount !== undefined && coBreachCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-zinc-600">
                  <span className="font-semibold text-red-600">{coBreachCount}</span> co-breaches
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Interpretation */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs text-zinc-500 mb-1 font-medium">AI Interpretation</div>
            <p className="text-xs text-zinc-700 leading-relaxed" data-testid="ai-interpretation">
              {aiInterpretation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CellHoverPreviewPanel;
