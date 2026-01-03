'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  /** Array of numeric data points */
  data: number[];
  /** Width of the sparkline */
  width?: number;
  /** Height of the sparkline */
  height?: number;
  /** Stroke color - can be 'auto' to determine based on trend */
  strokeColor?: string | 'auto';
  /** Fill color for area under the line (use 'none' to disable) */
  fillColor?: string | 'auto' | 'none';
  /** Stroke width */
  strokeWidth?: number;
  /** Show end dot */
  showEndDot?: boolean;
  /** Show min/max dots */
  showMinMax?: boolean;
  /** Additional className */
  className?: string;
  /** Animation on mount */
  animate?: boolean;
  /** Smoothing factor (0 = straight lines, 1 = max smoothing) */
  smoothing?: number;
}

// Generate a unique gradient ID
let gradientIdCounter = 0;
function getGradientId() {
  return `sparkline-gradient-${++gradientIdCounter}`;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  strokeColor = 'auto',
  fillColor = 'auto',
  strokeWidth = 1.5,
  showEndDot = true,
  showMinMax = false,
  className,
  animate = false,
  smoothing = 0.2,
}: SparklineProps) {
  const gradientId = useMemo(() => getGradientId(), []);

  // Calculate if trend is positive or negative
  const trend = useMemo(() => {
    if (data.length < 2) return 'neutral';
    const firstValid = data.find(d => d !== null && d !== undefined);
    const lastValid = [...data].reverse().find(d => d !== null && d !== undefined);
    if (firstValid === undefined || lastValid === undefined) return 'neutral';
    if (lastValid > firstValid) return 'positive';
    if (lastValid < firstValid) return 'negative';
    return 'neutral';
  }, [data]);

  // Determine colors based on trend
  const resolvedStrokeColor = useMemo(() => {
    if (strokeColor !== 'auto') return strokeColor;
    switch (trend) {
      case 'positive': return '#22c55e'; // green-500
      case 'negative': return '#ef4444'; // red-500
      default: return '#71717a'; // zinc-500
    }
  }, [strokeColor, trend]);

  const resolvedFillColor = useMemo(() => {
    if (fillColor === 'none') return 'none';
    if (fillColor !== 'auto') return fillColor;
    switch (trend) {
      case 'positive': return '#22c55e20'; // green with alpha
      case 'negative': return '#ef444420'; // red with alpha
      default: return '#71717a20'; // zinc with alpha
    }
  }, [fillColor, trend]);

  // Calculate path data
  const { path, areaPath, points, min, max } = useMemo(() => {
    if (data.length === 0) return { path: '', areaPath: '', points: [], min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };

    const validData = data.filter(d => d !== null && d !== undefined);
    if (validData.length === 0) return { path: '', areaPath: '', points: [], min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };

    const minVal = Math.min(...validData);
    const maxVal = Math.max(...validData);
    const range = maxVal - minVal || 1;

    const padding = { x: 2, y: 3 };
    const chartWidth = width - padding.x * 2;
    const chartHeight = height - padding.y * 2;

    // Generate points
    const pts = data.map((value, index) => {
      const x = padding.x + (index / Math.max(data.length - 1, 1)) * chartWidth;
      const y = padding.y + chartHeight - ((value - minVal) / range) * chartHeight;
      return { x, y, value };
    });

    // Find min/max positions
    let minPoint = { x: 0, y: height };
    let maxPoint = { x: 0, y: 0 };
    pts.forEach(p => {
      if (p.value === minVal && p.y > minPoint.y) minPoint = p;
      if (p.value === maxVal && p.y < maxPoint.y) maxPoint = p;
    });

    // Generate smooth path with bezier curves
    let pathD = '';
    let areaD = '';

    if (pts.length === 1) {
      // Single point - draw a small circle
      pathD = `M ${pts[0].x} ${pts[0].y}`;
      areaD = `M ${pts[0].x} ${height} L ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${height} Z`;
    } else {
      // Build path
      pts.forEach((point, i) => {
        if (i === 0) {
          pathD = `M ${point.x} ${point.y}`;
          areaD = `M ${point.x} ${height - padding.y} L ${point.x} ${point.y}`;
        } else if (smoothing > 0) {
          // Use quadratic bezier for smoothing
          const prev = pts[i - 1];
          const cpx = prev.x + (point.x - prev.x) * (1 - smoothing);
          const cpy = prev.y + (point.y - prev.y) * smoothing;
          pathD += ` Q ${cpx} ${prev.y} ${point.x} ${point.y}`;
          areaD += ` Q ${cpx} ${prev.y} ${point.x} ${point.y}`;
        } else {
          pathD += ` L ${point.x} ${point.y}`;
          areaD += ` L ${point.x} ${point.y}`;
        }
      });

      // Close area path
      const lastPoint = pts[pts.length - 1];
      areaD += ` L ${lastPoint.x} ${height - padding.y} Z`;
    }

    return { path: pathD, areaPath: areaD, points: pts, min: minPoint, max: maxPoint };
  }, [data, width, height, smoothing]);

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ width, height }}>
        <span className="text-[10px] text-zinc-400">No data</span>
      </div>
    );
  }

  const endPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-label="Sparkline chart"
    >
      {/* Gradient definition for fill */}
      {resolvedFillColor !== 'none' && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={resolvedStrokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={resolvedStrokeColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
      )}

      {/* Area fill */}
      {resolvedFillColor !== 'none' && areaPath && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          className={animate ? 'animate-in fade-in duration-500' : ''}
        />
      )}

      {/* Line */}
      {path && (
        <path
          d={path}
          fill="none"
          stroke={resolvedStrokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animate ? 'animate-in slide-in-from-left duration-700' : ''}
        />
      )}

      {/* Min/Max dots */}
      {showMinMax && min && max && (
        <>
          <circle
            cx={min.x}
            cy={min.y}
            r={2.5}
            fill="#ef4444"
            className={animate ? 'animate-in zoom-in duration-300 delay-500' : ''}
          />
          <circle
            cx={max.x}
            cy={max.y}
            r={2.5}
            fill="#22c55e"
            className={animate ? 'animate-in zoom-in duration-300 delay-500' : ''}
          />
        </>
      )}

      {/* End dot */}
      {showEndDot && endPoint && (
        <>
          {/* Outer glow */}
          <circle
            cx={endPoint.x}
            cy={endPoint.y}
            r={4}
            fill={resolvedStrokeColor}
            fillOpacity={0.2}
            className={animate ? 'animate-in zoom-in duration-300 delay-300' : ''}
          />
          {/* Inner dot */}
          <circle
            cx={endPoint.x}
            cy={endPoint.y}
            r={2.5}
            fill={resolvedStrokeColor}
            className={animate ? 'animate-in zoom-in duration-300 delay-300' : ''}
          />
        </>
      )}
    </svg>
  );
}

// Helper to generate random sparkline data
export function generateSparklineData(
  points: number = 12,
  options: {
    min?: number;
    max?: number;
    trend?: 'up' | 'down' | 'volatile' | 'random';
    startValue?: number;
  } = {}
): number[] {
  const { min = 80, max = 120, trend = 'random', startValue } = options;
  const range = max - min;

  const data: number[] = [];
  let value = startValue ?? min + Math.random() * range;

  for (let i = 0; i < points; i++) {
    data.push(value);

    // Calculate next value based on trend
    let change: number;
    switch (trend) {
      case 'up':
        change = (Math.random() - 0.3) * range * 0.1;
        break;
      case 'down':
        change = (Math.random() - 0.7) * range * 0.1;
        break;
      case 'volatile':
        change = (Math.random() - 0.5) * range * 0.3;
        break;
      default:
        change = (Math.random() - 0.5) * range * 0.15;
    }

    value = Math.max(min, Math.min(max, value + change));
  }

  return data;
}

export default Sparkline;
