'use client';

import React, { memo, useState, useCallback, useMemo, forwardRef } from 'react';
import { MoreHorizontal, Sparkles, Plus, AlertCircle, MessageSquare, Calendar, Clock, ExternalLink, Download, GitBranch, Lightbulb, ArrowRight, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { NegotiationTerm, CategoryWithTerms } from '../lib/types';
import {
  getDeadlineStatus,
  formatDeadlineCountdown,
  getDeadlineStatusColors,
  formatDeadlineDisplay,
  generateTermDeadlineICS,
  downloadICSFile,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
} from '../lib/deadline-utils';
import {
  type TermDependencyGraph,
  buildDependencyGraph,
  getSuggestedRelatedTerms,
  analyzeTermImpact,
  STANDARD_TERM_DEPENDENCIES
} from '../lib/term-dependency-graph';
import { isTermModified } from '@/lib/utils/term-utils';

interface TermDetailPanelProps {
  termId: string | null;
  term?: Pick<NegotiationTerm, 'id' | 'term_label' | 'deadline' | 'current_value' | 'current_value_text' | 'original_value' | 'original_value_text'>;
  dealName?: string;
  onDeadlineChange?: (termId: string, deadline: string | null) => void;
  /** Categories for building dependency graph */
  categories?: CategoryWithTerms[];
  /** Dependency graph (optional, will be built from categories if not provided) */
  dependencyGraph?: TermDependencyGraph;
  /** Called when a related term is clicked */
  onSelectRelatedTerm?: (termId: string) => void;
  /** Called when user wants to view full dependency panel */
  onShowDependencies?: (termId: string) => void;
  /** Ref for the make proposal button (for parent component access) */
  makeProposalBtnRef?: React.RefObject<HTMLButtonElement | null>;
  /** Ref for the add comment button (for parent component access) */
  addCommentBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export const TermDetailPanel = memo(forwardRef<HTMLDivElement, TermDetailPanelProps>(function TermDetailPanel({
  termId,
  term,
  dealName = 'Deal',
  onDeadlineChange,
  categories,
  dependencyGraph: providedGraph,
  onSelectRelatedTerm,
  onShowDependencies,
  makeProposalBtnRef,
  addCommentBtnRef,
}, ref) {
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState(term?.deadline || '');

  // Build or use provided dependency graph
  const graph = useMemo(() => {
    if (providedGraph) return providedGraph;
    if (!categories) return null;
    return buildDependencyGraph(categories, STANDARD_TERM_DEPENDENCIES);
  }, [providedGraph, categories]);

  // Get suggested related terms for this term
  const suggestedTerms = useMemo(() => {
    if (!graph || !termId) return [];
    return getSuggestedRelatedTerms(graph, termId, 4);
  }, [graph, termId]);

  // Get quick impact summary
  const impactSummary = useMemo(() => {
    if (!graph || !termId || !categories) return null;
    const analysis = analyzeTermImpact(graph, categories, termId);
    if (analysis.totalImpactedTerms === 0) return null;
    return analysis;
  }, [graph, termId, categories]);

  const handleDeadlineSave = useCallback(() => {
    if (termId && onDeadlineChange) {
      onDeadlineChange(termId, deadlineValue || null);
    }
    setIsEditingDeadline(false);
  }, [termId, deadlineValue, onDeadlineChange]);

  const handleExportICS = useCallback(() => {
    if (!term?.deadline) return;
    const icsContent = generateTermDeadlineICS(term, dealName);
    if (icsContent) {
      const filename = `${term.term_label.replace(/[^a-z0-9]/gi, '_')}_deadline.ics`;
      downloadICSFile(icsContent, filename);
    }
  }, [term, dealName]);

  const handleOpenGoogleCalendar = useCallback(() => {
    if (!term?.deadline) return;
    const url = generateGoogleCalendarUrl(term, dealName);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [term, dealName]);

  const handleOpenOutlookCalendar = useCallback(() => {
    if (!term?.deadline) return;
    const url = generateOutlookCalendarUrl(term, dealName);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [term, dealName]);

  if (!termId) return null;

  const deadlineStatus = term?.deadline ? getDeadlineStatus(term.deadline) : null;
  const deadlineCountdown = term?.deadline ? formatDeadlineCountdown(term.deadline) : null;

  return (
    <Card
      ref={ref}
      className="animate-in fade-in slide-in-from-right-4 duration-500"
      data-testid="term-detail-panel"
      tabIndex={-1}
      role="region"
      aria-label="Term details"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Term Details</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="term-detail-menu-btn"
                aria-label="Open term options menu"
              >
                <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid="ai-suggestions-menu-item" aria-label="Get AI suggestions for this term">
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                Get AI Suggestions
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="view-history-menu-item" aria-label="View term negotiation history">View History</DropdownMenuItem>
              <DropdownMenuItem data-testid="lock-term-menu-item" aria-label="Lock this term from further changes">Lock Term</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {/* Deadline Section */}
        <div className="mb-3 p-2.5 bg-zinc-50 rounded-lg" data-testid="term-deadline-section">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Deadline
            </span>
            {!isEditingDeadline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingDeadline(true)}
                className="h-6 text-xs"
                data-testid="edit-deadline-btn"
                aria-label={term?.deadline ? 'Edit deadline for this term' : 'Set deadline for this term'}
              >
                {term?.deadline ? 'Edit' : 'Set Deadline'}
              </Button>
            )}
          </div>

          {isEditingDeadline ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={deadlineValue}
                onChange={(e) => setDeadlineValue(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="deadline-date-input"
              />
              <Button
                size="sm"
                onClick={handleDeadlineSave}
                className="h-7"
                data-testid="save-deadline-btn"
                aria-label="Save deadline"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingDeadline(false);
                  setDeadlineValue(term?.deadline || '');
                }}
                className="h-7"
                data-testid="cancel-deadline-btn"
                aria-label="Cancel deadline editing"
              >
                Cancel
              </Button>
            </div>
          ) : term?.deadline ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge
                  className={`${getDeadlineStatusColors(deadlineStatus!)} text-xs`}
                  data-testid="term-detail-deadline-badge"
                >
                  {deadlineCountdown}
                </Badge>
                <span className="text-xs text-zinc-500" data-testid="deadline-display-date">
                  {formatDeadlineDisplay(term.deadline)}
                </span>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-zinc-500"
                      data-testid="add-to-calendar-btn"
                      aria-label="Add term deadline to calendar"
                    >
                      <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                      Add to Calendar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleExportICS} data-testid="export-term-ics-btn" aria-label="Download ICS calendar file">
                      <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                      Download ICS
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleOpenGoogleCalendar} data-testid="term-google-calendar-btn" aria-label="Add to Google Calendar">
                      <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                      Google Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenOutlookCalendar} data-testid="term-outlook-calendar-btn" aria-label="Add to Outlook Calendar">
                      <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                      Outlook Calendar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No deadline set</p>
          )}
        </div>

        {/* Current Value Section with Diff Styling */}
        {term && (term.current_value !== undefined || term.current_value_text) && (
          <div className="mb-3 p-2.5 bg-zinc-50 rounded-lg" data-testid="term-value-section">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700">Current Value</span>
              {isTermModified(term) && (
                <Badge className="bg-blue-100 text-blue-700 text-xs" data-testid="term-modified-badge">
                  Modified
                </Badge>
              )}
            </div>
            {isTermModified(term) ? (
              <div className="space-y-2" data-testid="term-value-diff-detail">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Original:</span>
                  <span className="text-sm text-zinc-400 line-through" data-testid="term-detail-original-value">
                    {term.original_value_text ?? String(term.original_value)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Current:</span>
                  <span className="text-sm font-semibold text-zinc-900 bg-blue-50 px-1.5 py-0.5 rounded" data-testid="term-detail-current-value">
                    {term.current_value_text ?? String(term.current_value)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-600" data-testid="term-detail-value">
                {term.current_value_text ?? String(term.current_value)}
              </p>
            )}
          </div>
        )}

        {/* Dependencies & Impact Section - Shows when term has dependencies */}
        {(impactSummary || suggestedTerms.length > 0) && (
          <div
            className="mb-3 p-2.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-lg"
            data-testid="term-dependencies-section"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-800 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4" aria-hidden="true" />
                Dependencies
              </span>
              {termId && onShowDependencies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShowDependencies(termId)}
                  className="h-6 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                  data-testid="view-all-dependencies-btn"
                >
                  View All
                  <ChevronRight className="w-3 h-3 ml-0.5" aria-hidden="true" />
                </Button>
              )}
            </div>

            {/* Impact Summary */}
            {impactSummary && (
              <div className="mb-2.5 pb-2.5 border-b border-purple-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge
                    className={`text-xs ${
                      impactSummary.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                      impactSummary.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                      impactSummary.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}
                    data-testid="impact-risk-level-badge"
                  >
                    {impactSummary.riskLevel.charAt(0).toUpperCase() + impactSummary.riskLevel.slice(1)} Impact
                  </Badge>
                  <span className="text-xs text-purple-600">
                    Changes affect {impactSummary.totalImpactedTerms} other term{impactSummary.totalImpactedTerms !== 1 ? 's' : ''}
                  </span>
                </div>
                {impactSummary.warnings.length > 0 && (
                  <p className="text-xs text-amber-700 mt-1" data-testid="impact-warning">
                    {impactSummary.warnings[0]}
                  </p>
                )}
              </div>
            )}

            {/* Suggested Related Terms */}
            {suggestedTerms.length > 0 && (
              <div data-testid="suggested-related-terms">
                <div className="flex items-center gap-1.5 text-xs text-purple-600 mb-2">
                  <Lightbulb className="w-3 h-3" aria-hidden="true" />
                  <span>Consider together:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTerms.map(({ term: relatedTerm, reason, priority }) => (
                    <TooltipProvider key={relatedTerm.termId}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className={`px-2 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                              priority >= 2.5
                                ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
                                : priority >= 1.5
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                            }`}
                            onClick={() => onSelectRelatedTerm?.(relatedTerm.termId)}
                            data-testid={`suggested-term-btn-${relatedTerm.termId}`}
                          >
                            {relatedTerm.termLabel}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs" side="top">
                          <p className="text-sm">{reason}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="proposals">
          <TabsList className="w-full">
            <TabsTrigger value="proposals" className="flex-1" data-testid="proposals-tab">
              Proposals
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex-1" data-testid="comments-tab">
              Comments
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="proposals"
            className="mt-3"
            data-testid="proposals-tab-content"
            role="tabpanel"
            aria-label="Term proposals"
          >
            <div className="text-center text-sm text-zinc-500 py-3">
              <AlertCircle className="w-6 h-6 mx-auto text-zinc-300 mb-1.5" aria-hidden="true" />
              <p>No pending proposals</p>
              <Button
                ref={makeProposalBtnRef}
                size="sm"
                className="mt-2 transition-transform hover:scale-105"
                data-testid="make-proposal-btn"
                aria-label="Make a proposal for this term"
              >
                <Plus className="w-3 h-3 mr-1" aria-hidden="true" />
                Make Proposal
              </Button>
            </div>
          </TabsContent>
          <TabsContent
            value="comments"
            className="mt-3"
            data-testid="comments-tab-content"
            role="tabpanel"
            aria-label="Term comments"
          >
            <div className="text-center text-sm text-zinc-500 py-3">
              <MessageSquare className="w-6 h-6 mx-auto text-zinc-300 mb-1.5" aria-hidden="true" />
              <p>No comments yet</p>
              <Button
                ref={addCommentBtnRef}
                size="sm"
                variant="outline"
                className="mt-2 transition-transform hover:scale-105"
                data-testid="add-comment-btn"
                aria-label="Add a comment to this term"
              >
                Add Comment
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}));
