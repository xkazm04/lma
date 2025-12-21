'use client';

import React, { useState } from 'react';
import {
  Users,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock,
  Target,
  Zap,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CounterpartyInsight } from '../lib/types';

interface CounterpartyInsightsPanelProps {
  counterpartyInsights: CounterpartyInsight[];
  onViewHistory?: (counterpartyId: string) => void;
}

export function CounterpartyInsightsPanel({
  counterpartyInsights,
  onViewHistory,
}: CounterpartyInsightsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    counterpartyInsights[0]?.counterpartyId || null
  );

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'aggressive':
        return 'text-red-600 bg-red-50';
      case 'collaborative':
        return 'text-green-600 bg-green-50';
      case 'cautious':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-zinc-600 bg-zinc-50';
    }
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'aggressive':
        return Zap;
      case 'collaborative':
        return MessageSquare;
      case 'cautious':
        return Target;
      default:
        return Building2;
    }
  };

  return (
    <Card data-testid="counterparty-insights-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-500" />
          Counterparty Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {counterpartyInsights.map((insight) => {
          const StyleIcon = getStyleIcon(insight.insights.negotiationStyle);
          const isExpanded = expandedId === insight.counterpartyId;

          return (
            <div
              key={insight.counterpartyId}
              className={cn(
                'rounded-lg border transition-all duration-200',
                isExpanded ? 'bg-purple-50/30 border-purple-200' : 'bg-white'
              )}
              data-testid={`counterparty-${insight.counterpartyId}`}
            >
              {/* Header */}
              <button
                className="w-full p-3 flex items-center justify-between text-left"
                onClick={() =>
                  setExpandedId(isExpanded ? null : insight.counterpartyId)
                }
                data-testid={`counterparty-toggle-${insight.counterpartyId}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">
                      {insight.counterpartyName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          getStyleColor(insight.insights.negotiationStyle)
                        )}
                      >
                        <StyleIcon className="w-3 h-3 mr-1" />
                        {insight.insights.negotiationStyle}
                      </Badge>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{insight.insights.typicalAcceptanceRounds} rounds
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Historical Patterns */}
                  <div className="p-3 rounded-lg bg-white border border-zinc-100">
                    <h5 className="text-xs font-medium text-zinc-500 mb-2">
                      Historical Patterns
                    </h5>
                    <ul className="space-y-1">
                      {insight.insights.historicalPatterns.map((pattern, i) => (
                        <li
                          key={i}
                          className="text-sm text-zinc-700 flex items-start gap-2"
                        >
                          <span className="text-purple-400 mt-1">•</span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preferred Terms */}
                  {insight.insights.preferredTerms.length > 0 && (
                    <div className="p-3 rounded-lg bg-white border border-zinc-100">
                      <h5 className="text-xs font-medium text-zinc-500 mb-2">
                        Term Preferences
                      </h5>
                      <div className="space-y-2">
                        {insight.insights.preferredTerms.map((term, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-zinc-600">{term.termKey}</span>
                            <Badge variant="outline" className="text-xs">
                              {term.preferredRange}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
                    <div className="flex items-center gap-1 text-purple-600 mb-1">
                      <Target className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        Approach Recommendation
                      </span>
                    </div>
                    <p className="text-sm text-purple-800">
                      {insight.recommendation}
                    </p>
                  </div>

                  {/* View History Button */}
                  {onViewHistory && (
                    <button
                      className="w-full p-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      onClick={() => onViewHistory(insight.counterpartyId)}
                      data-testid={`view-history-${insight.counterpartyId}`}
                    >
                      View Full Deal History →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
