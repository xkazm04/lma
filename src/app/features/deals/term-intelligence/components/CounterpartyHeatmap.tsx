'use client';

import React, { useState, useMemo } from 'react';
import { Users, Clock, TrendingUp, Handshake, Building2, Star, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CounterpartyRelationship, CounterpartyHeatmapCell, TermCategory } from '../lib/types';
import { getCategoryLabel, getScoreColor, getScoreBgColor } from '../lib/mock-data';

interface CounterpartyHeatmapProps {
  relationships: CounterpartyRelationship[];
  heatmapData: CounterpartyHeatmapCell[];
}

const communicationStyleColors: Record<CounterpartyRelationship['communicationStyle'], string> = {
  collaborative: 'bg-green-100 text-green-700',
  competitive: 'bg-amber-100 text-amber-700',
  mixed: 'bg-blue-100 text-blue-700',
};

const counterpartyTypeIcons: Record<CounterpartyRelationship['counterpartyType'], React.ReactNode> = {
  bank: <Building2 className="w-4 h-4" />,
  institutional: <Users className="w-4 h-4" />,
  fund: <TrendingUp className="w-4 h-4" />,
  sponsor: <Star className="w-4 h-4" />,
};

export function CounterpartyHeatmap({ relationships, heatmapData }: CounterpartyHeatmapProps) {
  const [selectedCounterparty, setSelectedCounterparty] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'heatmap' | 'list'>('heatmap');

  const termCategories: TermCategory[] = ['pricing', 'covenants', 'structure', 'facility'];

  const sortedRelationships = useMemo(
    () => [...relationships].sort((a, b) => b.relationshipScore - a.relationshipScore),
    [relationships]
  );

  const getHeatmapValue = (counterpartyId: string, category: TermCategory): CounterpartyHeatmapCell | undefined => {
    return heatmapData.find(
      (cell) => cell.counterpartyId === counterpartyId && cell.termCategory === category
    );
  };

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 80) return 'bg-green-500';
    if (efficiency >= 60) return 'bg-green-300';
    if (efficiency >= 40) return 'bg-amber-300';
    return 'bg-red-300';
  };

  const selectedRelationship = selectedCounterparty
    ? relationships.find((r) => r.counterpartyId === selectedCounterparty)
    : null;

  return (
    <Card data-testid="counterparty-heatmap">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Handshake className="w-5 h-5 text-blue-500" />
              Counterparty Relationship Heatmap
            </CardTitle>
            <CardDescription>
              Discover which counterparties you work most efficiently with by term category
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'heatmap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('heatmap')}
              data-testid="view-heatmap"
            >
              Heatmap
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="view-list"
            >
              List View
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewMode === 'heatmap' ? (
          <>
            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 w-48">
                      Counterparty
                    </th>
                    {termCategories.map((cat) => (
                      <th key={cat} className="text-center py-2 px-3 text-xs font-medium text-zinc-500 w-24">
                        {getCategoryLabel(cat)}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 text-xs font-medium text-zinc-500 w-20">
                      <div className="flex items-center justify-center gap-1">
                        Score
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3 h-3 text-zinc-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Overall relationship efficiency score based on negotiation speed and outcomes.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRelationships.map((cp) => (
                    <tr
                      key={cp.counterpartyId}
                      className={cn(
                        'border-b border-zinc-100 cursor-pointer transition-colors',
                        selectedCounterparty === cp.counterpartyId ? 'bg-blue-50' : 'hover:bg-zinc-50'
                      )}
                      onClick={() => setSelectedCounterparty(
                        selectedCounterparty === cp.counterpartyId ? null : cp.counterpartyId
                      )}
                      data-testid={`heatmap-row-${cp.counterpartyId}`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                            {counterpartyTypeIcons[cp.counterpartyType]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900 truncate max-w-[140px]">
                              {cp.counterpartyName}
                            </p>
                            <p className="text-xs text-zinc-500">{cp.totalDeals} deals</p>
                          </div>
                        </div>
                      </td>
                      {termCategories.map((cat) => {
                        const cell = getHeatmapValue(cp.counterpartyId, cat);
                        return (
                          <td key={cat} className="py-3 px-3 text-center">
                            {cell ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div
                                      className={cn(
                                        'w-12 h-8 mx-auto rounded flex items-center justify-center text-xs font-medium text-white',
                                        getEfficiencyColor(cell.efficiency)
                                      )}
                                    >
                                      {cell.efficiency}%
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{getCategoryLabel(cat)}</p>
                                    <p className="text-xs">Efficiency: {cell.efficiency}%</p>
                                    <p className="text-xs">Avg Delta: {(cell.avgDelta * 100).toFixed(0)}%</p>
                                    <p className="text-xs">{cell.negotiationCount} negotiations</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-center">
                        <div className={cn(
                          'inline-flex items-center justify-center w-12 h-8 rounded font-semibold text-sm',
                          getScoreBgColor(cp.relationshipScore),
                          getScoreColor(cp.relationshipScore)
                        )}>
                          {cp.relationshipScore}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-xs text-zinc-600">High Efficiency (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-300 rounded" />
                <span className="text-xs text-zinc-600">Good (60-79%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-300 rounded" />
                <span className="text-xs text-zinc-600">Fair (40-59%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-300 rounded" />
                <span className="text-xs text-zinc-600">Needs Improvement</span>
              </div>
            </div>
          </>
        ) : (
          /* List View */
          <div className="space-y-3">
            {sortedRelationships.map((cp) => (
              <div
                key={cp.counterpartyId}
                className={cn(
                  'border rounded-lg p-4 cursor-pointer transition-colors',
                  selectedCounterparty === cp.counterpartyId
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-zinc-200 hover:border-zinc-300'
                )}
                onClick={() => setSelectedCounterparty(
                  selectedCounterparty === cp.counterpartyId ? null : cp.counterpartyId
                )}
                data-testid={`list-row-${cp.counterpartyId}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
                      getScoreBgColor(cp.relationshipScore),
                      getScoreColor(cp.relationshipScore)
                    )}>
                      {cp.relationshipScore}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-900">{cp.counterpartyName}</h3>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', communicationStyleColors[cp.communicationStyle])}
                        >
                          {cp.communicationStyle}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span className="flex items-center gap-1">
                          {counterpartyTypeIcons[cp.counterpartyType]}
                          {cp.counterpartyType.replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span>{cp.totalDeals} deals</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cp.avgNegotiationDays} days avg
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className={cn('text-lg font-bold', cp.avgMarginDelta < 0 ? 'text-green-600' : 'text-red-600')}>
                        {cp.avgMarginDelta > 0 ? '+' : ''}{(cp.avgMarginDelta * 100).toFixed(0)}bps
                      </p>
                      <p className="text-xs text-zinc-500">Margin Delta</p>
                    </div>
                    <div>
                      <p className={cn('text-lg font-bold', cp.avgCovenantDelta < 0.1 ? 'text-green-600' : 'text-amber-600')}>
                        {cp.avgCovenantDelta > 0 ? '+' : ''}{(cp.avgCovenantDelta * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-zinc-500">Covenant Delta</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{cp.avgTermsAgreedFirst}%</p>
                      <p className="text-xs text-zinc-500">First-Pass Accept</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Counterparty Detail Panel */}
        {selectedRelationship && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  {selectedRelationship.counterpartyName}
                  <Badge
                    variant="outline"
                    className={cn('text-xs', communicationStyleColors[selectedRelationship.communicationStyle])}
                  >
                    {selectedRelationship.communicationStyle}
                  </Badge>
                </h3>
                <p className="text-sm text-zinc-500">
                  Last deal: {new Date(selectedRelationship.lastDealDate).toLocaleDateString()}
                </p>
              </div>
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
                getScoreBgColor(selectedRelationship.relationshipScore),
                getScoreColor(selectedRelationship.relationshipScore)
              )}>
                {selectedRelationship.relationshipScore}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-zinc-100">
                <p className="text-xl font-bold text-zinc-900">{selectedRelationship.totalDeals}</p>
                <p className="text-xs text-zinc-500">Total Deals</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-zinc-100">
                <p className="text-xl font-bold text-green-600">{selectedRelationship.successfulDeals}</p>
                <p className="text-xs text-zinc-500">Successful</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-zinc-100">
                <p className="text-xl font-bold text-blue-600">{selectedRelationship.avgNegotiationDays}</p>
                <p className="text-xs text-zinc-500">Avg Days</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-zinc-100">
                <p className={cn('text-xl font-bold', selectedRelationship.avgMarginDelta < 0 ? 'text-green-600' : 'text-red-600')}>
                  {(selectedRelationship.avgMarginDelta * 100).toFixed(0)}bps
                </p>
                <p className="text-xs text-zinc-500">Margin Outcome</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-zinc-100">
                <p className="text-xl font-bold text-blue-600">{selectedRelationship.avgTermsAgreedFirst}%</p>
                <p className="text-xs text-zinc-500">First-Pass</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" data-testid="view-deals-btn">
                View Deals
              </Button>
              <Button size="sm" data-testid="contact-btn">
                Schedule Meeting
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
