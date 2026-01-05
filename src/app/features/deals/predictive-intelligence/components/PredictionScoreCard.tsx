'use client';

import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DealPrediction } from '../lib/types';

interface PredictionScoreCardProps {
  prediction: DealPrediction;
}

// Animated circular progress ring component
interface AnimatedRingProps {
  probability: number;
  colorClass: string;
  strokeColor: string;
}

function AnimatedRing({ probability, colorClass, strokeColor }: AnimatedRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevProbabilityRef = useRef(probability);
  const animationRef = useRef<number | null>(null);

  // SVG ring parameters
  const size = 96; // w-24 = 96px
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate on mount and when probability changes
  useEffect(() => {
    const startValue = prevProbabilityRef.current !== probability ? animatedProgress : 0;
    const endValue = probability;
    const duration = 1200; // 1.2 seconds
    const startTime = performance.now();

    // Trigger pulse when score changes (not on initial mount)
    if (prevProbabilityRef.current !== probability && prevProbabilityRef.current !== 0) {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 600);
    }
    prevProbabilityRef.current = probability;

    // Easing function - easeOutExpo for smooth deceleration
    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setAnimatedProgress(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [probability]);

  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div
      className={cn(
        'relative w-24 h-24 flex items-center justify-center',
        isPulsing && 'animate-pulse'
      )}
      data-testid="probability-ring-container"
    >
      {/* Background circle */}
      <svg
        width={size}
        height={size}
        className="absolute transform -rotate-90"
        data-testid="probability-ring-svg"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-200"
        />
        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-colors duration-300"
          style={{
            filter: isPulsing ? 'drop-shadow(0 0 8px currentColor)' : 'none',
          }}
        />
      </svg>
      {/* Center content */}
      <div className="flex flex-col items-center justify-center z-10">
        <span
          className={cn('text-3xl font-bold tabular-nums', colorClass)}
          data-testid="probability-score-value"
        >
          {Math.round(animatedProgress)}%
        </span>
        <span className="text-xs text-zinc-500">Success</span>
      </div>
    </div>
  );
}

export function PredictionScoreCard({ prediction }: PredictionScoreCardProps) {
  const { predictions, confidence } = prediction;
  const probability = Math.round(predictions.closingProbability * 100);

  const getProbabilityColor = (prob: number) => {
    if (prob >= 75) return 'text-green-600';
    if (prob >= 50) return 'text-blue-600';
    if (prob >= 25) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStrokeColor = (prob: number) => {
    if (prob >= 75) return '#16a34a'; // green-600
    if (prob >= 50) return '#2563eb'; // blue-600
    if (prob >= 25) return '#d97706'; // amber-600
    return '#dc2626'; // red-600
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Moderate';
    return 'Low';
  };

  return (
    <Card
      className="border-2 bg-gradient-to-br from-white to-zinc-50"
      data-testid="prediction-score-card"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Deal Success Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Main Score - Animated Ring */}
          <AnimatedRing
            probability={probability}
            colorClass={getProbabilityColor(probability)}
            strokeColor={getStrokeColor(probability)}
          />

          {/* Key Metrics */}
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-white border border-zinc-100">
              <div className="flex items-center justify-center gap-1 text-zinc-400 mb-1">
                <Clock className="w-3 h-3" />
                <span className="text-xs">Est. Close</span>
              </div>
              <p
                className="text-xl font-semibold text-zinc-900"
                data-testid="estimated-days"
              >
                {predictions.estimatedClosingDays}
              </p>
              <p className="text-xs text-zinc-500">days</p>
            </div>

            <div className="text-center p-3 rounded-lg bg-white border border-zinc-100">
              <div className="flex items-center justify-center gap-1 text-zinc-400 mb-1">
                <Zap className="w-3 h-3" />
                <span className="text-xs">Rounds</span>
              </div>
              <p
                className="text-xl font-semibold text-zinc-900"
                data-testid="estimated-rounds"
              >
                {predictions.estimatedRounds}
              </p>
              <p className="text-xs text-zinc-500">expected</p>
            </div>

            <div className="text-center p-3 rounded-lg bg-white border border-zinc-100">
              <div className="flex items-center justify-center gap-1 text-zinc-400 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs">Confidence</span>
              </div>
              <p
                className="text-xl font-semibold text-zinc-900"
                data-testid="confidence-score"
              >
                {Math.round(confidence * 100)}%
              </p>
              <p className="text-xs text-zinc-500">{getConfidenceLabel(confidence)}</p>
            </div>
          </div>
        </div>

        {/* Model Info */}
        <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Model: {prediction.modelVersion}
            </Badge>
            <span className="text-xs text-zinc-400">
              Updated {new Date(prediction.timestamp).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-zinc-500">
            {probability >= 50 ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span>Favorable outlook</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-amber-500" />
                <span>Needs attention</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
