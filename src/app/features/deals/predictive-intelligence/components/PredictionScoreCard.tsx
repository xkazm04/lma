'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Clock, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DealPrediction } from '../lib/types';

interface PredictionScoreCardProps {
  prediction: DealPrediction;
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

  const getProbabilityBg = (prob: number) => {
    if (prob >= 75) return 'bg-green-100 border-green-200';
    if (prob >= 50) return 'bg-blue-100 border-blue-200';
    if (prob >= 25) return 'bg-amber-100 border-amber-200';
    return 'bg-red-100 border-red-200';
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
          {/* Main Score */}
          <div
            className={cn(
              'w-24 h-24 rounded-full flex flex-col items-center justify-center border-4',
              getProbabilityBg(probability)
            )}
            data-testid="probability-score"
          >
            <span className={cn('text-3xl font-bold', getProbabilityColor(probability))}>
              {probability}%
            </span>
            <span className="text-xs text-zinc-500">Success</span>
          </div>

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
