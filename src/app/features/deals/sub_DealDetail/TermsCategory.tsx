'use client';

import React, { memo, useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, AlertCircle, MessageSquare, Lock, Clock, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CategoryWithTerms } from '../lib/types';
import {
  getStatusLabel,
  getStatusDescription,
  isTermFinalized,
  isTermInNegotiation,
  type NegotiationStatus,
} from '../lib/term-status-state-machine';
import {
  getDeadlineStatus,
  formatDeadlineCountdown,
  getDeadlineStatusColors,
  formatDeadlineDisplay,
} from '../lib/deadline-utils';
import type { TermDependencyGraph } from '../lib/term-dependency-graph';
import { isTermModified } from '@/lib/utils/term-utils';

/**
 * Render mode for TermsCategory:
 * - 'standalone': Full collapsible card with header toggle (default)
 * - 'accordion-item': Always expanded, no card wrapper, terms only (for use inside WizardContainer)
 */
type TermsCategoryRenderMode = 'standalone' | 'accordion-item';

interface TermsCategoryProps {
  category: CategoryWithTerms;
  /** Whether the category is expanded - only used in 'standalone' mode */
  isExpanded?: boolean;
  selectedTerm: string | null;
  /** Toggle callback - only used in 'standalone' mode */
  onToggle?: () => void;
  onSelectTerm: (termId: string) => void;
  categoryIndex?: number;
  /** Optional dependency graph for showing term relationships */
  dependencyGraph?: TermDependencyGraph;
  /** Called when user clicks on a dependency indicator */
  onShowDependencies?: (termId: string) => void;
  /**
   * Render mode: 'standalone' (default) renders full card with toggle header,
   * 'accordion-item' renders only the terms list without wrapper
   */
  renderMode?: TermsCategoryRenderMode;
}

const statusColors: Record<NegotiationStatus, string> = {
  not_started: 'bg-zinc-100 text-zinc-600',
  proposed: 'bg-amber-100 text-amber-700',
  under_discussion: 'bg-blue-100 text-blue-700',
  pending_approval: 'bg-purple-100 text-purple-700',
  agreed: 'bg-green-100 text-green-700',
  locked: 'bg-zinc-200 text-zinc-800',
};

export const TermsCategory = memo(function TermsCategory({
  category,
  isExpanded = true,
  selectedTerm,
  onToggle,
  onSelectTerm,
  categoryIndex = 0,
  dependencyGraph,
  onShowDependencies,
  renderMode = 'standalone',
}: TermsCategoryProps) {
  const selectedTermRef = useRef<HTMLDivElement>(null);

  // Calculate dependency counts for each term
  const termDependencyCounts = useMemo(() => {
    if (!dependencyGraph) return new Map<string, { dependents: number; dependencies: number }>();

    const counts = new Map<string, { dependents: number; dependencies: number }>();
    category.terms.forEach(term => {
      const node = dependencyGraph.nodes.get(term.id);
      if (node) {
        counts.set(term.id, {
          dependents: node.dependents.length,
          dependencies: node.dependencies.length
        });
      }
    });
    return counts;
  }, [category.terms, dependencyGraph]);

  // Pre-compute deadline status for all terms to avoid repeated Date parsing on each render
  const termDeadlineStatuses = useMemo(() => {
    const statuses = new Map<string, ReturnType<typeof getDeadlineStatus>>();
    category.terms.forEach(term => {
      if (term.deadline) {
        statuses.set(term.id, getDeadlineStatus(term.deadline));
      }
    });
    return statuses;
  }, [category.terms]);

  // Check if any term in the category has been modified
  const hasModifiedTerms = useMemo(() => {
    return category.terms.some((term) => isTermModified(term));
  }, [category.terms]);

  // Count modified terms for display
  const modifiedTermsCount = useMemo(() => {
    return category.terms.filter((term) => isTermModified(term)).length;
  }, [category.terms]);

  // Scroll selected term into view when it changes
  useEffect(() => {
    if (selectedTerm && selectedTermRef.current) {
      selectedTermRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedTerm]);

  const handleKeyDown = (e: React.KeyboardEvent, termId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectTerm(termId);
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle?.();
    }
  };

  // Shared terms list rendering - used by both render modes
  const renderTermsList = () => (
    <div className="divide-y">
      {category.terms.map((term) => {
        const isSelected = selectedTerm === term.id;
        const termIsModified = isTermModified(term);
        const originalText = term.original_value_text ?? String(term.original_value);
        const currentText = term.current_value_text ?? String(term.current_value);
        const depCounts = termDependencyCounts.get(term.id);
        const hasDependencies = depCounts && (depCounts.dependents > 0 || depCounts.dependencies > 0);
        const totalConnections = depCounts ? depCounts.dependents + depCounts.dependencies : 0;

        return (
          <div
            key={term.id}
            ref={isSelected ? selectedTermRef : null}
            data-term-id={term.id}
            data-testid={`term-row-${term.id}`}
            data-modified={termIsModified}
            role="option"
            aria-selected={isSelected}
            aria-label={`Select ${term.term_label} term${termIsModified ? ', modified from original' : ''}`}
            tabIndex={isSelected ? 0 : -1}
            className={`py-2 flex items-center justify-between hover:bg-zinc-50 px-2 -mx-2 rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              isSelected ? 'bg-blue-50 ring-2 ring-blue-200' : ''
            }`}
            onClick={() => onSelectTerm(term.id)}
            onKeyDown={(e) => handleKeyDown(e, term.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-zinc-900 truncate">{term.term_label}</span>
                {term.is_locked && <Lock className="w-3 h-3 text-zinc-400" aria-label="Locked" />}
                {/* Modified indicator dot next to term label */}
                {termIsModified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500"
                          data-testid={`term-modified-indicator-${term.id}`}
                          aria-label="Modified from original"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Modified from original value</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/* Dependency indicator */}
                {hasDependencies && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-colors ${
                            depCounts.dependents > 0
                              ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowDependencies?.(term.id);
                          }}
                          data-testid={`term-dependency-indicator-${term.id}`}
                          aria-label={`View ${totalConnections} term dependencies`}
                        >
                          <GitBranch className="w-3 h-3" aria-hidden="true" />
                          <span>{totalConnections}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium mb-1">Term Dependencies</p>
                        {depCounts.dependents > 0 && (
                          <p className="text-xs">Affects {depCounts.dependents} other term{depCounts.dependents !== 1 ? 's' : ''}</p>
                        )}
                        {depCounts.dependencies > 0 && (
                          <p className="text-xs">Depends on {depCounts.dependencies} term{depCounts.dependencies !== 1 ? 's' : ''}</p>
                        )}
                        <p className="text-xs text-zinc-400 mt-1">Click to view details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {/* Value display with diff styling for modified terms */}
              <div className="text-xs mt-0.5">
                {termIsModified ? (
                  <span className="flex items-center gap-2 flex-wrap" data-testid={`term-value-diff-${term.id}`}>
                    <span className="text-zinc-400 line-through" data-testid={`term-original-value-${term.id}`}>
                      {originalText}
                    </span>
                    <span className="text-zinc-400" aria-hidden="true">→</span>
                    <span className="font-semibold text-zinc-900 bg-blue-50 px-1 rounded" data-testid={`term-current-value-${term.id}`}>
                      {currentText}
                    </span>
                  </span>
                ) : (
                  <span className="text-zinc-600" data-testid={`term-value-${term.id}`}>
                    {currentText}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Deadline badge - uses memoized status to avoid repeated Date parsing */}
              {term.deadline && (() => {
                const deadlineStatus = termDeadlineStatuses.get(term.id) ?? 'no_deadline';
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          className={`${getDeadlineStatusColors(deadlineStatus)} cursor-default`}
                          data-testid={`term-deadline-badge-${term.id}`}
                          data-deadline-status={deadlineStatus}
                        >
                          <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                          {formatDeadlineCountdown(term.deadline)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Deadline: {formatDeadlineDisplay(term.deadline)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })()}
              {term.pending_proposals_count > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  {term.pending_proposals_count} proposal
                </Badge>
              )}
              {term.comments_count > 0 && (
                <span className="flex items-center text-xs text-zinc-400">
                  <MessageSquare className="w-3 h-3 mr-1" aria-hidden="true" />
                  {term.comments_count}
                </span>
              )}
              <Badge
                className={statusColors[term.negotiation_status as NegotiationStatus]}
                title={getStatusDescription(term.negotiation_status as NegotiationStatus)}
                data-testid={`term-status-badge-${term.id}`}
                data-status={term.negotiation_status}
                data-finalized={isTermFinalized(term.negotiation_status as NegotiationStatus)}
                data-in-negotiation={isTermInNegotiation(term.negotiation_status as NegotiationStatus)}
              >
                {getStatusLabel(term.negotiation_status as NegotiationStatus)}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Accordion-item mode: just render the terms list without card wrapper
  if (renderMode === 'accordion-item') {
    return (
      <div
        data-testid={`terms-category-${category.id}`}
        data-category-id={category.id}
        role="listbox"
        aria-label={`${category.name} terms`}
      >
        {renderTermsList()}
      </div>
    );
  }

  // Standalone mode: full card with collapsible header
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      data-testid={`terms-category-${category.id}`}
      data-category-id={category.id}
    >
      <CardHeader
        className="py-2 px-3 cursor-pointer hover:bg-zinc-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-t-lg"
        onClick={onToggle}
        onKeyDown={handleCategoryKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`category-content-${category.id}`}
        aria-label={`${category.name} category, ${category.terms.length} terms, ${isExpanded ? 'expanded' : 'collapsed'}`}
        data-testid={`category-header-${category.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-400" aria-hidden="true" />
            )}
            <CardTitle className="text-sm font-semibold">{category.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {category.terms.length} terms
            </Badge>
            {/* Modified terms indicator dot */}
            {hasModifiedTerms && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="relative flex h-2.5 w-2.5"
                      data-testid={`category-modified-indicator-${category.id}`}
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{modifiedTermsCount} term{modifiedTermsCount > 1 ? 's' : ''} modified from original</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-2">
            {category.terms.some((t) => t.pending_proposals_count > 0) && (
              <Badge className="bg-amber-100 text-amber-700">
                <AlertCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                Pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent
          className="pt-0 px-3 pb-2"
          id={`category-content-${category.id}`}
          role="listbox"
          aria-label={`${category.name} terms`}
        >
          {renderTermsList()}
        </CardContent>
      )}
    </Card>
  );
});
