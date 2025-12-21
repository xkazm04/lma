'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Lightbulb, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StickingPointPrediction } from '../lib/types';

interface StickingPointsPanelProps {
  stickingPoints: StickingPointPrediction[];
  onViewDetails?: (termId: string) => void;
}

export function StickingPointsPanel({
  stickingPoints,
  onViewDetails,
}: StickingPointsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.7) return 'text-red-600 bg-red-50 border-red-200';
    if (prob >= 0.5) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getProbabilityLabel = (prob: number) => {
    if (prob >= 0.7) return 'High Risk';
    if (prob >= 0.5) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <Card data-testid="sticking-points-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Likely Sticking Points
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {stickingPoints.length} identified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {stickingPoints.length === 0 ? (
          <div className="text-center py-6 text-zinc-500">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No significant sticking points identified</p>
          </div>
        ) : (
          stickingPoints.map((point) => (
            <div
              key={point.termId}
              className={cn(
                'rounded-lg border transition-all duration-200',
                expandedId === point.termId ? 'bg-zinc-50' : 'bg-white hover:bg-zinc-50/50'
              )}
              data-testid={`sticking-point-${point.termId}`}
            >
              {/* Header */}
              <button
                className="w-full p-3 flex items-center justify-between text-left"
                onClick={() =>
                  setExpandedId(expandedId === point.termId ? null : point.termId)
                }
                data-testid={`sticking-point-toggle-${point.termId}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium border',
                      getProbabilityColor(point.probability)
                    )}
                  >
                    {Math.round(point.probability * 100)}%
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{point.termLabel}</p>
                    <p className="text-xs text-zinc-500">
                      {getProbabilityLabel(point.probability)}
                    </p>
                  </div>
                </div>
                {expandedId === point.termId ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {/* Expanded Content */}
              {expandedId === point.termId && (
                <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Reason */}
                  <div className="p-2 rounded bg-white border border-zinc-100">
                    <p className="text-xs text-zinc-500 mb-1">Why this is a sticking point:</p>
                    <p className="text-sm text-zinc-700">{point.reason}</p>
                  </div>

                  {/* Suggested Approach */}
                  <div className="p-2 rounded bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-1 text-blue-600 mb-1">
                      <Lightbulb className="w-3 h-3" />
                      <span className="text-xs font-medium">Suggested Approach</span>
                    </div>
                    <p className="text-sm text-blue-700">{point.suggestedApproach}</p>
                  </div>

                  {/* Historical Resolution */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-white border border-zinc-100">
                      <div className="flex items-center gap-1 text-zinc-400 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">Avg Resolution</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-900">
                        {point.historicalResolution.avgRoundsToResolve} rounds
                      </p>
                    </div>
                    <div className="p-2 rounded bg-white border border-zinc-100">
                      <p className="text-xs text-zinc-400 mb-1">Common Compromises</p>
                      <ul className="text-xs text-zinc-600 space-y-0.5">
                        {point.historicalResolution.commonCompromises.slice(0, 2).map((c, i) => (
                          <li key={i} className="truncate">• {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Button */}
                  {onViewDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onViewDetails(point.termId)}
                      data-testid={`view-term-details-${point.termId}`}
                    >
                      View Term Details
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
