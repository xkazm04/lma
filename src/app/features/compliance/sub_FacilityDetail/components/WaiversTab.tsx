'use client';

import React, { memo, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WaiverCard } from './WaiverCard';
import type { Waiver, WaiverStatus, WaiverStats } from '../../lib';

interface WaiversTabProps {
  waivers: Waiver[];
  facilityId?: string;
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

function calculateStats(waivers: Waiver[]): WaiverStats {
  const now = new Date();
  return {
    total_waivers: waivers.length,
    pending_waivers: waivers.filter((w) => w.status === 'pending').length,
    approved_waivers: waivers.filter((w) => w.status === 'approved').length,
    rejected_waivers: waivers.filter((w) => w.status === 'rejected').length,
    expired_waivers: waivers.filter((w) => w.status === 'expired').length,
    active_waivers: waivers.filter(
      (w) =>
        w.status === 'approved' &&
        w.expiration_date &&
        new Date(w.expiration_date) > now
    ).length,
  };
}

export const WaiversTab = memo(function WaiversTab({
  waivers,
  onRequestWaiver,
}: WaiversTabProps) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const stats = useMemo(() => calculateStats(waivers), [waivers]);

  const filteredWaivers = useMemo(() => {
    if (statusFilter === 'all') return waivers;
    return waivers.filter((w) => w.status === statusFilter);
  }, [waivers, statusFilter]);

  const pendingWaivers = useMemo(
    () => waivers.filter((w) => w.status === 'pending'),
    [waivers]
  );

  const activeWaivers = useMemo(() => {
    const now = new Date();
    return waivers.filter(
      (w) =>
        w.status === 'approved' &&
        w.expiration_date &&
        new Date(w.expiration_date) > now
    );
  }, [waivers]);

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
            Waiver requests and approval history for this facility
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
    </div>
  );
});
