'use client';

import React, { memo, useMemo } from 'react';
import {
  GitBranch,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Calculator,
  Lock,
  Zap,
  Link,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CategoryWithTerms } from '../lib/types';
import {
  type TermDependencyGraph,
  type ImpactAnalysis,
  type DependencyType,
  type DependencyStrength,
  getDependencyStrengthColor,
  getDependencyTypeLabel,
  buildDependencyGraph,
  analyzeTermImpact,
  getSuggestedRelatedTerms,
  STANDARD_TERM_DEPENDENCIES
} from '../lib/term-dependency-graph';

// Icon component mapping
const DependencyIcon: React.FC<{ type: DependencyType; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'derives_from':
      return <Calculator className={className} aria-hidden="true" />;
    case 'constrained_by':
      return <Lock className={className} aria-hidden="true" />;
    case 'triggers':
      return <Zap className={className} aria-hidden="true" />;
    case 'requires':
      return <Link className={className} aria-hidden="true" />;
    case 'affects_risk':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'covenant_linked':
      return <GitBranch className={className} aria-hidden="true" />;
    default:
      return <ArrowRight className={className} aria-hidden="true" />;
  }
};

// Risk level badge colors
const riskLevelColors: Record<ImpactAnalysis['riskLevel'], string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
};

interface TermDependencyPanelProps {
  selectedTermId: string | null;
  categories: CategoryWithTerms[];
  onSelectTerm?: (termId: string) => void;
  onClose?: () => void;
}

export const TermDependencyPanel = memo(function TermDependencyPanel({
  selectedTermId,
  categories,
  onSelectTerm,
  onClose
}: TermDependencyPanelProps) {
  // Build dependency graph
  const graph = useMemo(() => {
    return buildDependencyGraph(categories, STANDARD_TERM_DEPENDENCIES);
  }, [categories]);

  // Get impact analysis for selected term
  const impactAnalysis = useMemo(() => {
    if (!selectedTermId) return null;
    return analyzeTermImpact(graph, categories, selectedTermId);
  }, [graph, categories, selectedTermId]);

  // Get suggested related terms
  const suggestions = useMemo(() => {
    if (!selectedTermId) return [];
    return getSuggestedRelatedTerms(graph, selectedTermId, 5);
  }, [graph, selectedTermId]);

  // Get upstream dependencies for selected term
  const upstreamDependencies = useMemo(() => {
    if (!selectedTermId) return [];
    const node = graph.nodes.get(selectedTermId);
    if (!node) return [];

    return node.dependencies.map(dep => {
      const sourceNode = graph.nodes.get(dep.sourceTermId);
      return {
        ...dep,
        sourceLabel: sourceNode?.termLabel || 'Unknown'
      };
    });
  }, [graph, selectedTermId]);

  if (!selectedTermId) return null;

  const hasAnyDependencies = (impactAnalysis?.totalImpactedTerms || 0) > 0 || upstreamDependencies.length > 0;

  return (
    <Card
      className="animate-in fade-in slide-in-from-right-4 duration-500"
      data-testid="term-dependency-panel"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            <CardTitle className="text-base">Dependencies</CardTitle>
            {impactAnalysis && impactAnalysis.totalImpactedTerms > 0 && (
              <Badge className={riskLevelColors[impactAnalysis.riskLevel]} data-testid="impact-risk-badge">
                {impactAnalysis.riskLevel.charAt(0).toUpperCase() + impactAnalysis.riskLevel.slice(1)} Impact
              </Badge>
            )}
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
              data-testid="close-dependency-panel-btn"
              aria-label="Close dependency panel"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyDependencies ? (
          <div className="text-center py-4 text-sm text-zinc-500" data-testid="no-dependencies-message">
            <Info className="w-6 h-6 mx-auto mb-2 text-zinc-300" aria-hidden="true" />
            <p>No dependencies detected for this term</p>
          </div>
        ) : (
          <>
            {/* Upstream Dependencies (What this term depends on) */}
            {upstreamDependencies.length > 0 && (
              <div data-testid="upstream-dependencies-section">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 rotate-180" aria-hidden="true" />
                  Depends On
                </h4>
                <div className="space-y-2">
                  {upstreamDependencies.map((dep, index) => (
                    <TooltipProvider key={`upstream-${index}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${getDependencyStrengthColor(dep.strength)}`}
                            onClick={() => onSelectTerm?.(dep.sourceTermId)}
                            data-testid={`upstream-dep-${dep.sourceTermId}`}
                          >
                            <DependencyIcon type={dep.dependencyType} className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium truncate flex-1 text-left">
                              {dep.sourceLabel}
                            </span>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {getDependencyTypeLabel(dep.dependencyType)}
                            </Badge>
                            <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">{dep.description}</p>
                          {dep.impactFormula && (
                            <p className="text-xs text-zinc-500 font-mono">{dep.impactFormula}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}

            {/* Downstream Impacts (What this term affects) */}
            {impactAnalysis && impactAnalysis.totalImpactedTerms > 0 && (
              <div data-testid="downstream-impacts-section">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ArrowDown className="w-3 h-3" aria-hidden="true" />
                  Impacts ({impactAnalysis.totalImpactedTerms} term{impactAnalysis.totalImpactedTerms !== 1 ? 's' : ''})
                </h4>

                {/* Direct Impacts */}
                {impactAnalysis.directImpacts.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs text-zinc-400 mb-1 block">Direct</span>
                    <div className="space-y-1.5">
                      {impactAnalysis.directImpacts.map((impact) => (
                        <TooltipProvider key={impact.termId}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${getDependencyStrengthColor(impact.strength)}`}
                                onClick={() => onSelectTerm?.(impact.termId)}
                                data-testid={`direct-impact-${impact.termId}`}
                              >
                                <DependencyIcon type={impact.dependencyType} className="w-4 h-4 flex-shrink-0" />
                                <div className="flex-1 text-left min-w-0">
                                  <span className="text-sm font-medium truncate block">
                                    {impact.termLabel}
                                  </span>
                                  {impact.categoryName && (
                                    <span className="text-xs text-zinc-500 truncate block">
                                      {impact.categoryName}
                                    </span>
                                  )}
                                </div>
                                <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" aria-hidden="true" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{impact.impactDescription}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cascading Impacts */}
                {impactAnalysis.cascadingImpacts.length > 0 && (
                  <div>
                    <span className="text-xs text-zinc-400 mb-1 block">Cascading</span>
                    <div className="space-y-1.5">
                      {impactAnalysis.cascadingImpacts.map((impact) => (
                        <TooltipProvider key={impact.termId}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all hover:shadow-sm cursor-pointer opacity-75 ${getDependencyStrengthColor(impact.strength)}`}
                                onClick={() => onSelectTerm?.(impact.termId)}
                                data-testid={`cascading-impact-${impact.termId}`}
                              >
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  {Array.from({ length: Math.min(impact.chainDepth, 3) }).map((_, i) => (
                                    <ArrowRight key={i} className="w-2 h-2 text-zinc-400" aria-hidden="true" />
                                  ))}
                                </div>
                                <DependencyIcon type={impact.dependencyType} className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm font-medium truncate flex-1 text-left">
                                  {impact.termLabel}
                                </span>
                                <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" aria-hidden="true" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{impact.impactDescription}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                Chain depth: {impact.chainDepth} step{impact.chainDepth !== 1 ? 's' : ''}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {impactAnalysis && impactAnalysis.warnings.length > 0 && (
              <div
                className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1"
                data-testid="dependency-warnings"
              >
                <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Warnings
                </div>
                <ul className="text-xs text-amber-600 space-y-1 ml-6 list-disc">
                  {impactAnalysis.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {impactAnalysis && impactAnalysis.suggestions.length > 0 && (
              <div
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1"
                data-testid="dependency-suggestions"
              >
                <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                  <Info className="w-4 h-4" aria-hidden="true" />
                  Suggestions
                </div>
                <ul className="text-xs text-blue-600 space-y-1 ml-6 list-disc">
                  {impactAnalysis.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Terms to Consider */}
            {suggestions.length > 0 && (
              <div data-testid="related-terms-section">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  Consider Together
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map(({ term, reason }) => (
                    <TooltipProvider key={term.termId}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="px-2 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors cursor-pointer"
                            onClick={() => onSelectTerm?.(term.termId)}
                            data-testid={`suggested-term-${term.termId}`}
                          >
                            {term.termLabel}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{reason}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});
