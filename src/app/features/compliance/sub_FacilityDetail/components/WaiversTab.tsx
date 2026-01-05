'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  ShieldCheck,
  ShieldX,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  FileText,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WaiverCard } from './WaiverCard';
import { UnifiedCovenantTimeline } from '../../sub_Covenants/components';
import type { Waiver, WaiverStatus, WaiverStats, Covenant } from '../../lib';
import { getCovenantWaivers } from '../../lib/covenant-waiver-unified-types';

interface WaiversTabProps {
  waivers: Waiver[];
  /** Covenants for linking waiver context back to covenant state */
  covenants?: Covenant[];
  onRequestWaiver?: () => void;
}

type FilterStatus = 'all' | WaiverStatus;

const STATUS_FILTERS: { value: FilterStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Filter className="w-3 h-3" /> },
  { value: 'pending', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
  { value: 'approved', label: 'Approved', icon: <CheckCircle className="w-3 h-3" /> },
  { value: 'rejected', label: 'Rejected', icon: <XCircle className="w-3 h-3" /> },
  { value: 'expired', label: 'Expired', icon: <ShieldX className="w-3 h-3" /> },
];

interface DerivedWaiverData {
  stats: WaiverStats;
  pendingWaivers: Waiver[];
  activeWaivers: Waiver[];
}

function calculateDerivedData(waivers: Waiver[]): DerivedWaiverData {
  const now = new Date();
  const pendingWaivers: Waiver[] = [];
  const activeWaivers: Waiver[] = [];
  let approvedCount = 0;
  let rejectedCount = 0;
  let expiredCount = 0;

  for (const waiver of waivers) {
    switch (waiver.status) {
      case 'pending':
        pendingWaivers.push(waiver);
        break;
      case 'approved':
        approvedCount++;
        if (waiver.expiration_date && new Date(waiver.expiration_date) > now) {
          activeWaivers.push(waiver);
        }
        break;
      case 'rejected':
        rejectedCount++;
        break;
      case 'expired':
        expiredCount++;
        break;
    }
  }

  return {
    stats: {
      total_waivers: waivers.length,
      pending_waivers: pendingWaivers.length,
      approved_waivers: approvedCount,
      rejected_waivers: rejectedCount,
      expired_waivers: expiredCount,
      active_waivers: activeWaivers.length,
    },
    pendingWaivers,
    activeWaivers,
  };
}

/**
 * Group waivers by covenant to show the state-transition relationship.
 */
function groupWaiversByCovenant(waivers: Waiver[]): Map<string, Waiver[]> {
  const grouped = new Map<string, Waiver[]>();
  waivers.forEach((waiver) => {
    const existing = grouped.get(waiver.covenant_id) || [];
    existing.push(waiver);
    grouped.set(waiver.covenant_id, existing);
  });
  return grouped;
}

export const WaiversTab = memo(function WaiversTab({
  waivers,
  covenants = [],
  onRequestWaiver,
}: WaiversTabProps) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedCovenant, setSelectedCovenant] = useState<Covenant | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'byState'>('list');

  // Single pass calculation for all derived waiver data
  const { stats, pendingWaivers, activeWaivers } = useMemo(
    () => calculateDerivedData(waivers),
    [waivers]
  );

  const filteredWaivers = useMemo(() => {
    if (statusFilter === 'all') return waivers;
    return waivers.filter((w) => w.status === statusFilter);
  }, [waivers, statusFilter]);

  // Group waivers by covenant for the "by state" view
  const waiversByCovenant = useMemo(() => groupWaiversByCovenant(waivers), [waivers]);

  // Find the covenant for a given waiver
  const getCovenantForWaiver = useCallback(
    (waiver: Waiver) => covenants.find((c) => c.id === waiver.covenant_id),
    [covenants]
  );

  // Show timeline for a specific covenant
  const handleShowCovenantTimeline = useCallback(
    (waiver: Waiver) => {
      const covenant = getCovenantForWaiver(waiver);
      if (covenant) {
        setSelectedCovenant(covenant);
      }
    },
    [getCovenantForWaiver]
  );

  // Placeholder handlers for workflow actions - TODO: implement actual API calls
  const handleApprove: ((waiverId: string) => void) | undefined = undefined;
  const handleReject: ((waiverId: string) => void) | undefined = undefined;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Covenant Waivers</h2>
          <p className="text-sm text-zinc-500">
            Waivers as covenant state transitions - each waiver represents a temporary mutation of covenant compliance status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="hover:shadow-sm transition-all"
            onClick={onRequestWaiver}
            data-testid="request-waiver-btn"
          >
            <Plus className="w-4 h-4 mr-1" />
            Request Waiver
          </Button>
        </div>
      </div>

      {/* Stats summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="border-zinc-200" data-testid="waiver-stats-total">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Total</p>
                <p className="text-lg font-semibold text-zinc-900">{stats.total_waivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30" data-testid="waiver-stats-pending">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs text-amber-700">Pending</p>
                <p className="text-lg font-semibold text-amber-900">{stats.pending_waivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30" data-testid="waiver-stats-active">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-green-700">Active</p>
                <p className="text-lg font-semibold text-green-900">{stats.active_waivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30" data-testid="waiver-stats-approved">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700">Approved</p>
                <p className="text-lg font-semibold text-blue-900">{stats.approved_waivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/30" data-testid="waiver-stats-rejected">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-xs text-red-700">Rejected</p>
                <p className="text-lg font-semibold text-red-900">{stats.rejected_waivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-zinc-50/30" data-testid="waiver-stats-expired">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <ShieldX className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-600">Expired</p>
                <p className="text-lg font-semibold text-zinc-900">{stats.expired_waivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending waivers requiring action */}
      {pendingWaivers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30" data-testid="pending-waivers-section">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-900">
                Pending Approval ({pendingWaivers.length})
              </h3>
            </div>
            <p className="text-sm text-amber-700 mb-4">
              The following waiver requests require review and approval decision.
            </p>
            <div className="flex flex-wrap gap-2">
              {pendingWaivers.map((waiver) => (
                <Badge
                  key={waiver.id}
                  className="bg-amber-100 text-amber-700 hover:bg-amber-100 cursor-pointer"
                  data-testid={`pending-waiver-badge-${waiver.id}`}
                  onClick={() => {
                    setStatusFilter('pending');
                    // Could scroll to the specific waiver card
                  }}
                >
                  {waiver.covenant_name}
                  <span className="ml-1 text-amber-500">•</span>
                  <span className="ml-1 text-xs">{waiver.borrower_name}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active waivers summary */}
      {activeWaivers.length > 0 && (
        <Card className="border-green-200 bg-green-50/30" data-testid="active-waivers-section">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-green-900">
                Active Waivers ({activeWaivers.length})
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {activeWaivers.map((waiver) => (
                <div
                  key={waiver.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-100"
                  data-testid={`active-waiver-item-${waiver.id}`}
                >
                  <span className="text-sm font-medium text-zinc-900 truncate">
                    {waiver.covenant_name}
                  </span>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <Clock className="w-3 h-3 mr-1" />
                    Exp: {new Date(waiver.expiration_date!).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap" data-testid="waiver-filter-tabs">
        {STATUS_FILTERS.map(({ value, label, icon }) => (
          <Button
            key={value}
            size="sm"
            variant={statusFilter === value ? 'default' : 'outline'}
            onClick={() => setStatusFilter(value)}
            className={cn(
              'transition-all',
              statusFilter === value && 'shadow-sm'
            )}
            data-testid={`waiver-filter-${value}`}
          >
            {icon}
            <span className="ml-1">{label}</span>
            {value !== 'all' && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {value === 'pending' && stats.pending_waivers}
                {value === 'approved' && stats.approved_waivers}
                {value === 'rejected' && stats.rejected_waivers}
                {value === 'expired' && stats.expired_waivers}
                {value === 'withdrawn' && 0}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Waiver cards list */}
      <div className="grid gap-3" data-testid="waivers-list">
        {filteredWaivers.map((waiver, idx) => (
          <WaiverCard
            key={waiver.id}
            waiver={waiver}
            index={idx}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredWaivers.length === 0 && (
        <div
          className="text-center text-zinc-500 py-12"
          data-testid="no-waivers-message"
        >
          {statusFilter === 'all' ? (
            <>
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
              <p className="text-lg font-medium text-zinc-700 mb-2">No waivers on record</p>
              <p className="text-sm text-zinc-500 mb-4">
                This facility has no waiver history. You can request a waiver if needed.
              </p>
              <Button
                onClick={onRequestWaiver}
                data-testid="request-waiver-empty-btn"
              >
                <Plus className="w-4 h-4 mr-1" />
                Request Waiver
              </Button>
            </>
          ) : (
            <>
              <p>No {statusFilter} waivers found</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setStatusFilter('all')}
                data-testid="show-all-waivers-btn"
              >
                Show all waivers
              </Button>
            </>
          )}
        </div>
      )}

      {/* Unified State View - Waivers Grouped by Covenant */}
      {waiversByCovenant.size > 0 && (
        <Card className="border-blue-200 bg-blue-50/30" data-testid="waiver-state-context">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-900">
                Waiver-Covenant State Context
              </h3>
              <Badge variant="outline" className="text-xs text-blue-700">
                {waiversByCovenant.size} covenant{waiversByCovenant.size !== 1 ? 's' : ''} affected
              </Badge>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Each waiver represents a state transition for its parent covenant.
              View the unified timeline to see how waivers fit into the covenant lifecycle.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from(waiversByCovenant.entries()).map(([covenantId, covenantWaivers]) => {
                const covenant = covenants.find((c) => c.id === covenantId);
                const activeCount = covenantWaivers.filter(
                  (w) =>
                    w.status === 'approved' &&
                    w.expiration_date &&
                    new Date(w.expiration_date) > new Date()
                ).length;
                const pendingCount = covenantWaivers.filter(
                  (w) => w.status === 'pending'
                ).length;

                return (
                  <div
                    key={covenantId}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100"
                    data-testid={`covenant-waiver-group-${covenantId}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-zinc-900 block truncate">
                        {covenant?.name || covenantWaivers[0]?.covenant_name || 'Unknown Covenant'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500">
                          {covenantWaivers.length} waiver{covenantWaivers.length !== 1 ? 's' : ''}
                        </span>
                        {activeCount > 0 && (
                          <Badge className="text-xs bg-green-100 text-green-700">
                            {activeCount} active
                          </Badge>
                        )}
                        {pendingCount > 0 && (
                          <Badge className="text-xs bg-amber-100 text-amber-700">
                            {pendingCount} pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    {covenant && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCovenant(covenant)}
                        data-testid={`view-covenant-timeline-${covenantId}`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unified Timeline Modal for Selected Covenant */}
      {selectedCovenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedCovenant.name} - Unified State Timeline
                </h2>
                <p className="text-sm text-zinc-500">
                  Waiver as state transition context
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCovenant(null)}
                data-testid="close-waiver-timeline-btn"
              >
                Close
              </Button>
            </div>
            <div className="p-4">
              <UnifiedCovenantTimeline
                covenant={selectedCovenant}
                waivers={getCovenantWaivers(selectedCovenant.id, waivers)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
