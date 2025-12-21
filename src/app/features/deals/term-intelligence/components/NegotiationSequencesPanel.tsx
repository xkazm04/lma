'use client';

import React, { useState } from 'react';
import { Award, Clock, ArrowRight, CheckCircle2, Zap, Target, ChevronRight, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NegotiationSequence, TermCategory } from '../lib/types';
import { getCategoryLabel } from '../lib/mock-data';

interface NegotiationSequencesPanelProps {
  sequences: NegotiationSequence[];
}

const actionIcons: Record<NegotiationSequence['sequence'][0]['action'], React.ReactNode> = {
  initial_proposal: <Target className="w-4 h-4" />,
  counter: <ArrowRight className="w-4 h-4" />,
  concession: <ArrowRight className="w-4 h-4 rotate-180" />,
  holdout: <Clock className="w-4 h-4" />,
  package_deal: <Zap className="w-4 h-4" />,
  escalate: <ChevronRight className="w-4 h-4" />,
  final_offer: <CheckCircle2 className="w-4 h-4" />,
};

const actionLabels: Record<NegotiationSequence['sequence'][0]['action'], string> = {
  initial_proposal: 'Initial Proposal',
  counter: 'Counter-Offer',
  concession: 'Concession',
  holdout: 'Hold Position',
  package_deal: 'Package Deal',
  escalate: 'Escalate',
  final_offer: 'Final Offer',
};

export function NegotiationSequencesPanel({ sequences }: NegotiationSequencesPanelProps) {
  const [expandedSequence, setExpandedSequence] = useState<string | null>(sequences[0]?.id || null);
  const [filterCategory, setFilterCategory] = useState<TermCategory | 'all'>('all');

  const filteredSequences = filterCategory === 'all'
    ? sequences
    : sequences.filter((s) => s.termCategory === filterCategory);

  const categories: (TermCategory | 'all')[] = ['all', 'pricing', 'covenants', 'structure'];

  const sortedSequences = [...filteredSequences].sort((a, b) => b.successRate - a.successRate);

  return (
    <Card data-testid="negotiation-sequences-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Your Most Successful Negotiation Sequences
            </CardTitle>
            <CardDescription>
              Playbooks that consistently deliver favorable outcomes by term category
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {sequences.length} Patterns Identified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Category:</span>
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(cat)}
                className="text-xs"
                data-testid={`seq-filter-${cat}`}
              >
                {cat === 'all' ? 'All' : getCategoryLabel(cat)}
              </Button>
            ))}
          </div>
        </div>

        {/* Sequences List */}
        <div className="space-y-3">
          {sortedSequences.map((sequence, idx) => {
            const isExpanded = expandedSequence === sequence.id;
            return (
              <div
                key={sequence.id}
                className={cn(
                  'border rounded-lg transition-all duration-200',
                  isExpanded ? 'border-blue-200 bg-blue-50/30' : 'border-zinc-200 hover:border-zinc-300'
                )}
                data-testid={`sequence-card-${sequence.id}`}
              >
                {/* Header */}
                <button
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                  onClick={() => setExpandedSequence(isExpanded ? null : sequence.id)}
                  data-testid={`sequence-toggle-${sequence.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-zinc-200 text-zinc-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-zinc-100 text-zinc-500'
                    )}>
                      #{idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">{sequence.termLabel}</h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {getCategoryLabel(sequence.termCategory)}
                        </Badge>
                        <span>•</span>
                        <span>{sequence.sequence.length} steps</span>
                        <span>•</span>
                        <span>Used {sequence.usageCount}x</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{sequence.successRate}%</p>
                      <p className="text-xs text-zinc-500">success rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">+{(sequence.avgOutcomeImprovement * 100).toFixed(0)}%</p>
                      <p className="text-xs text-zinc-500">avg improvement</p>
                    </div>
                    <ChevronRight className={cn(
                      'w-5 h-5 text-zinc-400 transition-transform',
                      isExpanded && 'rotate-90'
                    )} />
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Sequence Steps */}
                    <div className="bg-white rounded-lg p-4 border border-zinc-100">
                      <h4 className="text-sm font-medium text-zinc-700 mb-3">Negotiation Playbook</h4>
                      <div className="relative">
                        {/* Vertical line connecting steps */}
                        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-zinc-200" />

                        <div className="space-y-4">
                          {sequence.sequence.map((step, stepIdx) => (
                            <div
                              key={stepIdx}
                              className="relative flex items-start gap-4"
                              data-testid={`step-${stepIdx}`}
                            >
                              {/* Step indicator */}
                              <div className={cn(
                                'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                stepIdx === sequence.sequence.length - 1
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              )}>
                                {actionIcons[step.action]}
                              </div>

                              {/* Step content */}
                              <div className="flex-1 pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-zinc-900">
                                    {actionLabels[step.action]}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      step.successProbability >= 0.7
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : step.successProbability >= 0.5
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                                    )}
                                  >
                                    {Math.round(step.successProbability * 100)}% success
                                  </Badge>
                                </div>
                                <p className="text-sm text-zinc-600">{step.description}</p>
                                {stepIdx < sequence.sequence.length - 1 && (
                                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Avg {step.avgDaysToNext} days to next step
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Top Performing Deals */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          Top performers using this sequence: {sequence.topPerformers.length} deals
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800">
                        View Deals
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredSequences.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            <p>No negotiation patterns found for this category.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
