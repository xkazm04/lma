'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Plus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/layout';
import { DemoCard } from '@/lib/demo-guide';
import { DealFiltersBar, DealStatsBar, DealListView, DealKanbanView, DealTimelineView, SmartInboxView, type ViewMode } from './components';
import {
  mockDeals,
  useDealSort,
  prioritizeDeals,
  type TriageAction,
  type Deal,
  type DealWithStats,
  transformToKanbanView,
  transformToTimelineView,
  transformToInboxView,
  pipe,
  filterBySearch,
  filterByStatus,
  filterByType,
  useStatusCounts,
  useDealStatusUpdate,
} from './lib';

export function DealsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Deal['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Deal['deal_type']>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Changed from 'inbox' to 'list' (table view) as default
  const { toast } = useToast();

  // Maintain local state for deals to enable optimistic updates
  const [deals, setDeals] = useState<DealWithStats[]>(mockDeals);

  // Apply filters using composable pipeline pattern
  // Each filter is a pure function that can be composed, reused, and tested independently
  const filteredDeals = useMemo(() => {
    return pipe(
      deals,
      filterBySearch(searchQuery),
      filterByStatus(statusFilter),
      filterByType(typeFilter)
    );
  }, [deals, searchQuery, statusFilter, typeFilter]);

  // Use sort hook with filtered deals
  const { sortState, sortedDeals, handleSort } = useDealSort(filteredDeals);

  // Prioritize deals for Smart Inbox
  const prioritizedDeals = useMemo(() => {
    return prioritizeDeals(filteredDeals);
  }, [filteredDeals]);

  // Transform data for each view mode
  // Grid/list views use sortedDeals directly (no transformation needed)
  const viewData = useMemo(() => {
    return {
      grid: sortedDeals,
      list: sortedDeals,
      kanban: transformToKanbanView(sortedDeals),
      timeline: transformToTimelineView(sortedDeals),
      inbox: transformToInboxView(prioritizedDeals),
    };
  }, [sortedDeals, prioritizedDeals]);

  // Use the declarative stats pattern instead of inline useMemo
  // Stats computation is now a reusable, testable concern
  const statusCounts = useStatusCounts(deals);

  // Optimistic status update hook with race condition handling
  const { updateStatus, isPending } = useDealStatusUpdate({
    onDealsUpdate: setDeals,
    onError: (dealId, error, previousStatus) => {
      const deal = deals.find((d) => d.id === dealId);
      toast({
        title: 'Status update failed',
        description: `Failed to update ${deal?.deal_name || 'deal'}: ${error.message}. Reverted to ${previousStatus}.`,
        variant: 'destructive',
      });
    },
    onSuccess: (dealId, newStatus) => {
      const deal = deals.find((d) => d.id === dealId);
      toast({
        title: 'Status updated',
        description: `${deal?.deal_name || 'Deal'} is now ${newStatus}.`,
      });
    },
  });

  const handleDelete = useCallback((id: string) => {
    console.log('Delete deal:', id);
  }, []);

  const handleStatusChange = useCallback(
    (id: string, newStatus: string) => {
      const deal = deals.find((d) => d.id === id);
      if (!deal) return;

      // Use the optimistic update hook which handles:
      // - Immediate UI update
      // - Request cancellation for rapid changes
      // - Rollback on failure
      updateStatus(id, newStatus as Deal['status'], deal.status);
    },
    [deals, updateStatus]
  );

  const handleTriageAction = useCallback((dealId: string, action: TriageAction) => {
    const deal = deals.find(d => d.id === dealId);
    const dealName = deal?.deal_name || 'Deal';

    const actionMessages: Record<TriageAction, { title: string; description: string }> = {
      respond_proposals: {
        title: 'Opening proposals',
        description: `Navigating to ${dealName} to review proposals`,
      },
      schedule_followup: {
        title: 'Follow-up scheduled',
        description: `Calendar event created for ${dealName}`,
      },
      request_extension: {
        title: 'Extension requested',
        description: `Deadline extension request sent for ${dealName}`,
      },
      escalate: {
        title: 'Deal escalated',
        description: `${dealName} has been escalated to senior management`,
      },
      mark_reviewed: {
        title: 'Marked as reviewed',
        description: `${dealName} marked as reviewed for today`,
      },
      snooze_24h: {
        title: 'Snoozed for 24 hours',
        description: `${dealName} will reappear tomorrow`,
      },
      snooze_7d: {
        title: 'Snoozed for 7 days',
        description: `${dealName} will reappear in a week`,
      },
    };

    const message = actionMessages[action];

    // For respond_proposals, navigate to the deal
    if (action === 'respond_proposals') {
      window.location.href = `/deals/${dealId}`;
      return;
    }

    toast({
      title: message.title,
      description: message.description,
    });

    console.log('Triage action:', { dealId, action });
  }, [deals, toast]);

  return (
    <PageContainer>
      <div className="space-y-3">
        {/* Header */}
        <PageHeader
          title="Deal Room"
          subtitle="Manage and negotiate loan terms"
          compact
          actions={
            <>
              <Link href="/deals/intelligence">
                <Button variant="outline" size="sm" className="h-8 text-xs" data-testid="deals-intelligence-btn">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Intelligence
                </Button>
              </Link>
              <Link href="/deals/new">
                <Button size="sm" className="h-8 text-xs" data-testid="deals-new-btn">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Deal
                </Button>
              </Link>
            </>
          }
        />

        {/* Filters */}
        <DealFiltersBar
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          viewMode={viewMode}
          statusCounts={statusCounts}
          sortState={sortState}
          onSearchChange={setSearchQuery}
          onStatusChange={(status) => setStatusFilter(status as typeof statusFilter)}
          onTypeChange={(type) => setTypeFilter(type as typeof typeFilter)}
          onViewModeChange={setViewMode}
          onSort={handleSort}
        />

        {/* Deal Stages/Stats - Explorable Section */}
        {viewMode !== 'inbox' && (
          <DemoCard sectionId="deals-stages" fullWidth>
            <DealStatsBar
              statusCounts={statusCounts}
              activeStatus={statusFilter}
              onStatusClick={(status) => setStatusFilter(status as typeof statusFilter)}
            />
          </DemoCard>
        )}

        {/* Deal List Content - Explorable Section */}
        <DemoCard sectionId="deals-list" fullWidth>
          <div id="deal-list-content" tabIndex={-1} className="outline-none" data-testid="deal-list-content">
            {viewMode === 'inbox' && (
              <SmartInboxView
                data={viewData.inbox}
                onTriageAction={handleTriageAction}
              />
            )}
            {(viewMode === 'list' || viewMode === 'grid') && (
              <DealListView
                deals={viewMode === 'list' ? viewData.list : viewData.grid}
                layout={viewMode === 'list' ? 'table' : 'grid'}
                sortState={sortState}
                onSort={handleSort}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                isStatusPending={isPending}
              />
            )}
            {viewMode === 'kanban' && (
              <DealKanbanView
                data={viewData.kanban}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                isStatusPending={isPending}
              />
            )}
            {viewMode === 'timeline' && (
              <DealTimelineView
                data={viewData.timeline}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                isStatusPending={isPending}
              />
            )}
          </div>
        </DemoCard>
      </div>
    </PageContainer>
  );
}
