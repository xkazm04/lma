'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
} from 'lucide-react';
import type { KPIPrediction, PredictionConfidence, TrendDirection } from '../lib/types';

interface PredictionCardProps {
  prediction: KPIPrediction;
  showDetails?: boolean;
  onViewDetails?: () => void;
}

const confidenceColors: Record<PredictionConfidence, string> = {
  high: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-red-100 text-red-700 border-red-200',
};

const trendIcons: Record<TrendDirection, React.ReactNode> = {
  improving: <TrendingUp className="w-4 h-4 text-green-600" />,
  stable: <Minus className="w-4 h-4 text-zinc-400" />,
  declining: <TrendingDown className="w-4 h-4 text-red-600" />,
};

export const PredictionCard = memo(function PredictionCard({
  prediction,
  showDetails = false,
  onViewDetails,
}: PredictionCardProps) {
  const progressPercentage = Math.min(
    100,
    Math.max(0, (prediction.current_value / prediction.target_value) * 100)
  );

  const getStatusIcon = () => {
    if (prediction.will_miss_target) {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
    if (progressPercentage >= 100) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (progressPercentage >= 80) {
      return <Target className="w-5 h-5 text-blue-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getCardBorderClass = () => {
    if (prediction.will_miss_target) return 'border-amber-200 bg-amber-50/30';
    if (progressPercentage >= 100) return 'border-green-200 bg-green-50/30';
    return 'border-zinc-200';
  };

  return (
    <Card
      className={`transition-all duration-300 hover:shadow-md ${getCardBorderClass()} cursor-pointer`}
      onClick={onViewDetails}
      data-testid={`prediction-card-${prediction.kpi_id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-base font-semibold">
              {prediction.kpi_name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {trendIcons[prediction.trend]}
            <Badge
              variant="outline"
              className={`${confidenceColors[prediction.confidence]} text-xs`}
              data-testid={`confidence-badge-${prediction.kpi_id}`}
            >
              {prediction.confidence_score}% confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Values Section */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Current</p>
            <p className="text-lg font-bold text-zinc-900">
              {prediction.current_value.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-400">{prediction.unit}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Predicted</p>
            <p className={`text-lg font-bold ${
              prediction.will_miss_target ? 'text-amber-600' : 'text-green-600'
            }`}>
              {prediction.predicted_value.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-400">{prediction.unit}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Target</p>
            <p className="text-lg font-bold text-blue-600">
              {prediction.target_value.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-400">{prediction.unit}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Progress to Target</span>
            <span className={`font-medium ${
              progressPercentage >= 100 ? 'text-green-600' :
              progressPercentage >= 80 ? 'text-blue-600' : 'text-amber-600'
            }`}>
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2"
            data-testid={`prediction-progress-${prediction.kpi_id}`}
          />
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-zinc-500">
            <Clock className="w-4 h-4" />
            <span>{prediction.days_until_deadline} days until deadline</span>
          </div>
          <span className="text-xs text-zinc-400">{prediction.target_date}</span>
        </div>

        {/* Risk Alert */}
        {prediction.will_miss_target && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">At Risk of Missing Target</p>
                <p className="text-xs text-amber-600 mt-1">
                  Gap: {Math.abs(prediction.gap_to_target).toLocaleString()} {prediction.unit} ({prediction.gap_percentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Factors */}
        {showDetails && prediction.prediction_factors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-600">Prediction Factors</p>
            <div className="flex flex-wrap gap-1">
              {prediction.prediction_factors.map((factor, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs bg-zinc-100"
                >
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
