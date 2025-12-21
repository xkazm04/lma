'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Plus, Keyboard, Zap, Focus, LayoutList, LayoutGrid, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DealHeader,
  DealStats,
  TermsCategory,
  TermDetailPanel,
  ParticipantsPanel,
  ActivityPanel,
  CalendarExportMenu,
  AccelerationAlertsPanel,
  ScheduleCallModal,
  LivePresencePanel,
  NegotiationTheater,
  WarRoomControls,
  HotkeysPanel,
  TermDependencyPanel,
  TermImpactWarningModal,
  TermsCategoryAccordion,
  TermsFocusWizard,
  TermDependencyGraphViz,
} from './sub_DealDetail';
import { mockDeal, mockCategories, mockParticipants } from './lib/mock-data';
import { useTermsKeyboardNav } from './lib/useTermsKeyboardNav';
import { useAccelerationAlerts } from './lib/useAccelerationAlerts';
import { useWarRoomHotkeys } from './lib/useWarRoomHotkeys';
import {
  generateMockPresenceUsers,
  generateMockTypingIndicators,
  generateMockNegotiationEvents,
} from './lib/war-room-types';
import type { SuggestedIntervention } from './lib/velocity-types';
import type { TimelineViewMode, NegotiationEvent } from './lib/war-room-types';
import { isTermFinalized } from './lib/term-status-state-machine';
import type { NegotiationStatus } from './lib/term-status-state-machine';
import {
  buildDependencyGraph,
  STANDARD_TERM_DEPENDENCIES,
} from './lib/term-dependency-graph';

interface DealDetailPageProps {
  dealId: string;
}

export function DealDetailPage({ dealId }: DealDetailPageProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    mockCategories.map((c) => c.id)
  );
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  // Refs for child component elements (replacing document.querySelector)
  const termDetailPanelRef = useRef<HTMLDivElement>(null);
  const makeProposalBtnRef = useRef<HTMLButtonElement>(null);
  const addCommentBtnRef = useRef<HTMLButtonElement>(null);

  // War room state
  const [focusMode, setFocusMode] = useState(false);
  const [showFocusWizard, setShowFocusWizard] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showPresence, setShowPresence] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showHotkeysPanel, setShowHotkeysPanel] = useState(false);
  const [timelineViewMode, setTimelineViewMode] = useState<TimelineViewMode>('compact');
  // View mode: 'standard' uses TermsCategory, 'accordion' uses TermsCategoryAccordion (unified WizardContainer pattern)
  const [termsViewMode, setTermsViewMode] = useState<'standard' | 'accordion'>('standard');

  // Mock war room data
  const [presenceUsers] = useState(generateMockPresenceUsers);
  const [typingIndicators] = useState(generateMockTypingIndicators);
  const [negotiationEvents] = useState<NegotiationEvent[]>(generateMockNegotiationEvents);

  // Term dependency state
  const [showDependencyPanel, setShowDependencyPanel] = useState(false);
  const [dependencyPanelTermId, setDependencyPanelTermId] = useState<string | null>(null);
  const [showDependencyGraphViz, setShowDependencyGraphViz] = useState(false);
  const [impactWarningModal, setImpactWarningModal] = useState<{
    isOpen: boolean;
    termId: string;
    termLabel: string;
    proposedValue: string;
    currentValue: string;
  } | null>(null);

  // Acceleration alerts state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<{
    alertId: string;
    intervention: SuggestedIntervention;
  } | null>(null);

  // Fetch acceleration alerts
  const {
    healthSummary,
    isLoading: alertsLoading,
    dismissAlert,
    actOnAlert,
    scheduleCall,
  } = useAccelerationAlerts(dealId);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  }, []);

  const expandCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev : [...prev, categoryId]
    );
  }, []);

  const collapseCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.filter((id) => id !== categoryId)
    );
  }, []);

  const handleOpenTermDetail = useCallback((termId: string) => {
    // Selecting a term automatically shows its detail panel
    setSelectedTerm(termId);
    // Focus the term detail panel for screen readers (using ref instead of document.querySelector)
    if (termDetailPanelRef.current) {
      termDetailPanelRef.current.focus();
    }
  }, []);

  // Acceleration alert handlers
  const handleDismissAlert = useCallback(
    (alertId: string) => {
      dismissAlert(alertId);
    },
    [dismissAlert]
  );

  const handleActOnAlert = useCallback(
    (alertId: string, interventionId: string) => {
      actOnAlert(alertId, interventionId);
    },
    [actOnAlert]
  );

  const handleScheduleCall = useCallback(
    (alertId: string, intervention: SuggestedIntervention) => {
      setSelectedIntervention({ alertId, intervention });
      setScheduleModalOpen(true);
    },
    []
  );

  const handleConfirmSchedule = useCallback(
    async (config: {
      alertId: string;
      interventionId: string;
      dealId: string;
      title: string;
      description: string;
      participantIds: string[];
      duration: number;
      preferredTimeSlot: { startTime: string; endTime: string } | null;
      calendarProvider: 'google' | 'outlook' | 'calendly' | 'manual';
      sendInvites: boolean;
      agendaItems: string[];
    }) => {
      await scheduleCall(config);
    },
    [scheduleCall]
  );

  // War room action handlers
  const handleNewProposal = useCallback(() => {
    if (selectedTerm) {
      // In a real app, this would open a proposal modal
      console.log('New proposal for term:', selectedTerm);
      // Click the make proposal button using ref (instead of document.querySelector)
      if (makeProposalBtnRef.current) {
        makeProposalBtnRef.current.click();
      }
    }
  }, [selectedTerm]);

  const handleAddComment = useCallback(() => {
    if (selectedTerm) {
      // In a real app, this would open a comment modal
      console.log('Add comment for term:', selectedTerm);
      // Click the add comment button using ref (instead of document.querySelector)
      if (addCommentBtnRef.current) {
        addCommentBtnRef.current.click();
      }
    }
  }, [selectedTerm]);

  const handleAcceptTerm = useCallback(() => {
    if (selectedTerm) {
      // In a real app, this would trigger the accept flow
      console.log('Accept term:', selectedTerm);
      alert(`Term "${selectedTerm}" would be accepted. (Demo only)`);
    }
  }, [selectedTerm]);

  const handleToggleFocusMode = useCallback(() => {
    setFocusMode((prev) => !prev);
  }, []);

  // Open the full focus wizard overlay
  const handleOpenFocusWizard = useCallback(() => {
    setShowFocusWizard(true);
  }, []);

  // Close the focus wizard
  const handleCloseFocusWizard = useCallback(() => {
    setShowFocusWizard(false);
  }, []);

  // Toggle terms view mode between standard and wizard-accordion
  const handleToggleTermsViewMode = useCallback(() => {
    setTermsViewMode((prev) => prev === 'standard' ? 'accordion' : 'standard');
  }, []);

  const handleToggleTimeline = useCallback(() => {
    setShowTimeline((prev) => !prev);
  }, []);

  const handleToggleScreenShare = useCallback(() => {
    setIsScreenSharing((prev) => !prev);
  }, []);

  // Initialize keyboard navigation
  useTermsKeyboardNav({
    categories: mockCategories,
    expandedCategories,
    selectedTerm,
    onSelectTerm: setSelectedTerm,
    onExpandCategory: expandCategory,
    onCollapseCategory: collapseCategory,
    onOpenTermDetail: handleOpenTermDetail,
  });

  // Initialize war room hotkeys
  useWarRoomHotkeys({
    enabled: true,
    actions: {
      onNewProposal: handleNewProposal,
      onAddComment: handleAddComment,
      onAcceptTerm: handleAcceptTerm,
      onToggleFocusMode: handleToggleFocusMode,
      onToggleTimeline: handleToggleTimeline,
      onToggleScreenShare: handleToggleScreenShare,
    },
    selectedTerm,
  });

  // Handle ? key for showing hotkeys
  useEffect(() => {
    const handleQuestionMark = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          setShowHotkeysPanel(true);
        }
      }
    };
    document.addEventListener('keydown', handleQuestionMark);
    return () => document.removeEventListener('keydown', handleQuestionMark);
  }, []);

  // Build term dependency graph
  const dependencyGraph = useMemo(() => {
    return buildDependencyGraph(mockCategories, STANDARD_TERM_DEPENDENCIES);
  }, []);

  // Handler for showing dependency panel
  const handleShowDependencies = useCallback((termId: string) => {
    setDependencyPanelTermId(termId);
    setShowDependencyPanel(true);
  }, []);

  // Handler for closing impact warning modal
  const handleCloseImpactWarning = useCallback(() => {
    setImpactWarningModal(null);
  }, []);

  // Handler for confirming a change with impact
  const handleConfirmImpact = useCallback(() => {
    // In a real app, this would submit the proposal
    if (impactWarningModal) {
      console.log('Change confirmed with impacts:', impactWarningModal);
    }
    setImpactWarningModal(null);
  }, [impactWarningModal]);

  // Critical terms for focus mode - terms that need attention
  const criticalTermIds = useMemo(() => {
    const critical = new Set<string>();
    mockCategories.forEach((category) => {
      category.terms.forEach((term) => {
        // Terms with pending proposals, overdue deadlines, or under discussion
        if (
          term.pending_proposals_count > 0 ||
          (term.deadline && new Date(term.deadline) < new Date()) ||
          term.negotiation_status === 'under_discussion' ||
          term.negotiation_status === 'proposed'
        ) {
          critical.add(term.id);
        }
      });
    });
    return critical;
  }, []);

  // Filter presence users viewing the selected term
  const usersViewingSelectedTerm = useMemo(() => {
    if (!selectedTerm) return [];
    return presenceUsers.filter(
      (u) => u.is_online && u.viewing_term_id === selectedTerm
    );
  }, [selectedTerm, presenceUsers]);

  return (
    <div
      className={`space-y-4 ${focusMode ? 'war-room-focus-mode' : ''}`}
      data-testid="deal-detail-page"
      data-focus-mode={focusMode}
    >
      {/* War Room Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <h2 className="text-sm font-medium text-zinc-600">Negotiation War Room</h2>
          {focusMode && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full animate-pulse">
              Focus Mode Active
            </span>
          )}
        </div>
        <WarRoomControls
          focusMode={focusMode}
          showTimeline={showTimeline}
          showPresence={showPresence}
          isScreenSharing={isScreenSharing}
          selectedTerm={selectedTerm}
          onToggleFocusMode={handleToggleFocusMode}
          onToggleTimeline={handleToggleTimeline}
          onTogglePresence={() => setShowPresence((p) => !p)}
          onToggleScreenShare={handleToggleScreenShare}
          onShowHotkeys={() => setShowHotkeysPanel(true)}
        />
      </div>

      <DealHeader deal={mockDeal} />
      <DealStats deal={mockDeal} />

      {/* Negotiation Timeline (Theater View) */}
      {showTimeline && (
        <NegotiationTheater
          events={negotiationEvents}
          selectedTermId={selectedTerm}
          viewMode={timelineViewMode}
          onViewModeChange={setTimelineViewMode}
          onClose={() => setShowTimeline(false)}
          onSelectTerm={setSelectedTerm}
        />
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-zinc-900">Negotiation Terms</h2>
              <button
                onClick={() => setShowKeyboardHints(!showKeyboardHints)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded hover:bg-zinc-100"
                title="Keyboard shortcuts"
                aria-label="Toggle keyboard shortcuts help"
                data-testid="keyboard-shortcuts-toggle"
              >
                <Keyboard className="w-4 h-4" />
              </button>
              {/* Live viewers indicator on selected term */}
              {usersViewingSelectedTerm.length > 0 && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full"
                  data-testid="term-viewers-indicator"
                >
                  <div className="flex -space-x-1">
                    {usersViewingSelectedTerm.slice(0, 3).map((user) => (
                      <div
                        key={user.id}
                        className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white"
                        title={user.name}
                      >
                        {user.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-blue-600 ml-1">
                    {usersViewingSelectedTerm.length} viewing
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleTermsViewMode}
                      data-testid="toggle-terms-view-mode-btn"
                      aria-label={`Switch to ${termsViewMode === 'standard' ? 'accordion' : 'standard'} view`}
                    >
                      {termsViewMode === 'standard' ? (
                        <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <LayoutList className="w-4 h-4" aria-hidden="true" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch to {termsViewMode === 'standard' ? 'Accordion' : 'Standard'} View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Dependency Graph Viz button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDependencyGraphViz(prev => !prev)}
                      data-testid="toggle-dependency-graph-viz-btn"
                      aria-label="Toggle dependency graph visualization"
                      aria-pressed={showDependencyGraphViz}
                    >
                      <Network className={`w-4 h-4 ${showDependencyGraphViz ? 'text-purple-600' : ''}`} aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dependency Graph - View term relationships</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Focus Wizard button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenFocusWizard}
                      data-testid="open-focus-wizard-btn"
                      aria-label="Open focus wizard for term negotiation"
                    >
                      <Focus className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Focus Wizard - Step through categories</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <CalendarExportMenu
                terms={mockCategories.flatMap((c) => c.terms)}
                dealName={mockDeal.deal_name}
                selectedTermId={selectedTerm}
              />
              <Button
                size="sm"
                className="transition-transform hover:scale-105"
                data-testid="add-term-btn"
                aria-label="Add new negotiation term"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Add Term
              </Button>
            </div>
          </div>

          {/* Keyboard shortcuts help */}
          {showKeyboardHints && (
            <div
              className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
              role="region"
              aria-label="Keyboard shortcuts"
              data-testid="keyboard-shortcuts-panel"
            >
              <h3 className="font-medium text-zinc-900 mb-2">Keyboard Navigation</h3>
              <div className="grid grid-cols-2 gap-2 text-zinc-600">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">↑</kbd>
                  <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">↓</kbd>
                  <span>Navigate between terms</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">Tab</kbd>
                  <span>Jump to next category</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">Enter</kbd>
                  <span>Open term detail</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">←</kbd>
                  <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">→</kbd>
                  <span>Expand/collapse category</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">Home</kbd>
                  <span>Go to first term</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">End</kbd>
                  <span>Go to last term</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">Esc</kbd>
                  <span>Clear selection</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-200">
                <h4 className="font-medium text-zinc-700 mb-2 text-xs uppercase tracking-wide">War Room Actions</h4>
                <div className="grid grid-cols-3 gap-2 text-zinc-600">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">N</kbd>
                    <span>New proposal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">C</kbd>
                    <span>Comment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">A</kbd>
                    <span>Accept</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">F</kbd>
                    <span>Focus mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">T</kbd>
                    <span>Timeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded text-xs font-mono">?</kbd>
                    <span>All shortcuts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            role="region"
            aria-label="Negotiation terms by category"
            data-testid="terms-list-container"
          >
            {/* Conditional rendering based on view mode */}
            {termsViewMode === 'accordion' ? (
              /* Accordion view using unified WizardContainer pattern */
              <TermsCategoryAccordion
                categories={mockCategories}
                expandedCategories={expandedCategories}
                selectedTerm={selectedTerm}
                onToggleCategory={toggleCategory}
                onSelectTerm={setSelectedTerm}
                dependencyGraph={dependencyGraph}
                onShowDependencies={handleShowDependencies}
                focusMode={focusMode}
                criticalTermIds={criticalTermIds}
              />
            ) : (
              /* Standard view using individual TermsCategory components */
              mockCategories.map((category, index) => {
                // In focus mode, calculate if category has critical terms
                const hasCriticalTerms = focusMode
                  ? category.terms.some((t) => criticalTermIds.has(t.id))
                  : true;

                // In focus mode, check if all terms in category are resolved
                const allResolved = category.terms.every((t) =>
                  isTermFinalized(t.negotiation_status as NegotiationStatus)
                );

                return (
                  <div
                    key={category.id}
                    style={{ animationDelay: `${200 + index * 100}ms` }}
                    className={`mb-4 transition-all duration-300 ${
                      focusMode && allResolved
                        ? 'opacity-30 scale-[0.98]'
                        : ''
                    } ${
                      focusMode && hasCriticalTerms && !allResolved
                        ? 'ring-2 ring-amber-300 ring-offset-2 rounded-lg'
                        : ''
                    }`}
                    data-has-critical={hasCriticalTerms}
                    data-all-resolved={allResolved}
                  >
                    <TermsCategory
                      category={category}
                      isExpanded={expandedCategories.includes(category.id)}
                      selectedTerm={selectedTerm}
                      onToggle={() => toggleCategory(category.id)}
                      onSelectTerm={setSelectedTerm}
                      categoryIndex={index}
                      dependencyGraph={dependencyGraph}
                      onShowDependencies={handleShowDependencies}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Live Presence Panel */}
          {showPresence && (
            <LivePresencePanel
              users={presenceUsers}
              typingIndicators={typingIndicators}
              currentUserId="user-1"
              onUserClick={(userId) => {
                // Navigate to what the user is viewing
                const user = presenceUsers.find((u) => u.id === userId);
                if (user?.viewing_term_id) {
                  setSelectedTerm(user.viewing_term_id);
                }
              }}
            />
          )}

          {/* Acceleration Alerts Panel - prominently placed at top */}
          <AccelerationAlertsPanel
            healthSummary={healthSummary}
            isLoading={alertsLoading}
            onDismissAlert={handleDismissAlert}
            onActOnAlert={handleActOnAlert}
            onScheduleCall={handleScheduleCall}
          />
          <TermDetailPanel
            ref={termDetailPanelRef}
            termId={selectedTerm}
            term={
              selectedTerm
                ? mockCategories.flatMap((c) => c.terms).find((t) => t.id === selectedTerm)
                : undefined
            }
            dealName={mockDeal.deal_name}
            categories={mockCategories}
            dependencyGraph={dependencyGraph}
            onSelectRelatedTerm={(termId) => {
              setSelectedTerm(termId);
            }}
            onShowDependencies={handleShowDependencies}
            makeProposalBtnRef={makeProposalBtnRef}
            addCommentBtnRef={addCommentBtnRef}
          />
          {/* Dependency Graph Visualization - Shows when toggle is enabled */}
          {showDependencyGraphViz && (
            <TermDependencyGraphViz
              categories={mockCategories}
              selectedTermId={selectedTerm}
              onSelectTerm={setSelectedTerm}
              onClose={() => setShowDependencyGraphViz(false)}
            />
          )}
          {/* Term Dependency Panel - shows when dependency indicator is clicked */}
          {showDependencyPanel && dependencyPanelTermId && (
            <TermDependencyPanel
              selectedTermId={dependencyPanelTermId}
              categories={mockCategories}
              onSelectTerm={(termId) => {
                setSelectedTerm(termId);
                setDependencyPanelTermId(termId);
              }}
              onClose={() => {
                setShowDependencyPanel(false);
                setDependencyPanelTermId(null);
              }}
            />
          )}
          <ParticipantsPanel participants={mockParticipants} />
          <ActivityPanel />
        </div>
      </div>

      {/* Schedule Call Modal */}
      <ScheduleCallModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSelectedIntervention(null);
        }}
        intervention={selectedIntervention?.intervention || null}
        alertId={selectedIntervention?.alertId || ''}
        dealId={dealId}
        onSchedule={handleConfirmSchedule}
      />

      {/* Hotkeys Panel Modal */}
      <HotkeysPanel
        isOpen={showHotkeysPanel}
        onClose={() => setShowHotkeysPanel(false)}
        hasSelectedTerm={!!selectedTerm}
      />

      {/* Term Impact Warning Modal - shows before accepting proposals */}
      {impactWarningModal && (
        <TermImpactWarningModal
          isOpen={impactWarningModal.isOpen}
          onClose={handleCloseImpactWarning}
          onConfirm={handleConfirmImpact}
          termId={impactWarningModal.termId}
          termLabel={impactWarningModal.termLabel}
          proposedValue={impactWarningModal.proposedValue}
          currentValue={impactWarningModal.currentValue}
          categories={mockCategories}
        />
      )}

      {/* Focus Wizard Overlay - full screen wizard for stepping through categories */}
      {showFocusWizard && (
        <TermsFocusWizard
          categories={mockCategories}
          selectedTerm={selectedTerm}
          onSelectTerm={setSelectedTerm}
          onExit={handleCloseFocusWizard}
          dependencyGraph={dependencyGraph}
          onShowDependencies={handleShowDependencies}
        />
      )}

      {/* Focus Mode Styles */}
      <style jsx global>{`
        .war-room-focus-mode [data-term-id] {
          transition: all 0.3s ease;
        }

        .war-room-focus-mode [data-term-id][data-finalized="true"] {
          opacity: 0.4;
        }

        .war-room-focus-mode [data-term-id][data-in-negotiation="true"] {
          background-color: rgba(251, 191, 36, 0.1);
          border-left: 3px solid rgb(251, 191, 36);
        }

        .war-room-focus-mode [data-status="under_discussion"],
        .war-room-focus-mode [data-status="proposed"] {
          animation: pulse-highlight 2s ease-in-out infinite;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(251, 191, 36, 0);
          }
        }
      `}</style>
    </div>
  );
}
