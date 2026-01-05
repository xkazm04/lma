'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ShieldCheck, AlertTriangle, Clock, Shield, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CovenantCard, WaiverBadge, UnifiedCovenantTimeline } from '../../sub_Covenants/components';
import { WaiverRequestModal, type WaiverRequestData } from './WaiverRequestModal';
import type { Covenant, Waiver } from '../../lib';
import {
  enrichCovenantWithWaiverState,
  deriveUnifiedState,
  getCovenantWaivers,
  type UnifiedDisplayStatus,
} from '../../lib/covenant-waiver-unified-types';

interface CovenantsTabProps {
  covenants: Covenant[];
  waivers?: Waiver[];
  onWaiverSubmitted?: (data: WaiverRequestData) => void;
}

/**
 * Get display icon for unified status.
 */
function getStatusIcon(status: UnifiedDisplayStatus) {
  switch (status) {
    case 'compliant':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'waived_protected':
      return <Shield className="w-4 h-4 text-purple-600" />;
    case 'waived_expiring_soon':
      return <Clock className="w-4 h-4 text-amber-600" />;
    case 'pending_waiver':
      return <Clock className="w-4 h-4 text-amber-600" />;
    case 'at_risk':
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case 'breached_waiver_pending':
      return <Clock className="w-4 h-4 text-amber-600" />;
    case 'breached_no_waiver':
    case 'breached_waiver_rejected':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    default:
      return <CheckCircle className="w-4 h-4 text-zinc-600" />;
  }
}

export const CovenantsTab = memo(function CovenantsTab({
  covenants,
  waivers = [],
  onWaiverSubmitted,
}: CovenantsTabProps) {
  const [waiverModalOpen, setWaiverModalOpen] = useState(false);
  const [selectedCovenant, setSelectedCovenant] = useState<Covenant | null>(null);
  const [selectedTimelineCovenant, setSelectedTimelineCovenant] = useState<Covenant | null>(null);

  // Enrich covenants with waiver state for unified view
  const enrichedCovenants = useMemo(
    () => covenants.map((c) => enrichCovenantWithWaiverState(c, waivers)),
    [covenants, waivers]
  );

  // Group covenants by unified display status
  const covenantsByStatus = useMemo(() => {
    const grouped: Record<string, typeof enrichedCovenants> = {
      critical: [],
      warning: [],
      protected: [],
      healthy: [],
    };

    enrichedCovenants.forEach((covenant) => {
      const { displayStatus } = covenant.unifiedState;
      if (
        displayStatus === 'breached_no_waiver' ||
        displayStatus === 'breached_waiver_rejected'
      ) {
        grouped.critical.push(covenant);
      } else if (
        displayStatus === 'at_risk' ||
        displayStatus === 'breached_waiver_pending' ||
        displayStatus === 'waived_expiring_soon' ||
        displayStatus === 'pending_waiver'
      ) {
        grouped.warning.push(covenant);
      } else if (displayStatus === 'waived_protected') {
        grouped.protected.push(covenant);
      } else {
        grouped.healthy.push(covenant);
      }
    });

    return grouped;
  }, [enrichedCovenants]);

  const waivedCovenants = useMemo(
    () => covenants.filter((c) => c.status === 'waived' && c.waiver),
    [covenants]
  );

  const activeCovenants = useMemo(
    () => covenants.filter((c) => c.status !== 'waived'),
    [covenants]
  );

  const handleRequestWaiver = useCallback((covenant: Covenant) => {
    setSelectedCovenant(covenant);
    setWaiverModalOpen(true);
  }, []);

  const handleWaiverSubmit = useCallback(
    (data: WaiverRequestData) => {
      // In a real app, this would call an API to create the waiver request
      onWaiverSubmitted?.(data);
      setWaiverModalOpen(false);
      setSelectedCovenant(null);
    },
    [onWaiverSubmitted]
  );

  const handleShowTimeline = useCallback((covenant: Covenant) => {
    setSelectedTimelineCovenant(covenant);
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Financial Covenants</h2>
          <p className="text-sm text-zinc-500">
            Unified covenant and waiver state tracking
          </p>
        </div>
        <Button
          size="sm"
          className="hover:shadow-sm transition-all"
          data-testid="add-covenant-btn"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Unified State Summary - Shows covenants grouped by urgency */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="covenant-state-summary">
        <Card
          className={cn(
            'border-red-200 bg-red-50/30',
            covenantsByStatus.critical.length === 0 && 'opacity-50'
          )}
        >
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-xs text-red-700">Critical</p>
                <p className="text-lg font-semibold text-red-900">
                  {covenantsByStatus.critical.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-amber-200 bg-amber-50/30',
            covenantsByStatus.warning.length === 0 && 'opacity-50'
          )}
        >
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs text-amber-700">Needs Attention</p>
                <p className="text-lg font-semibold text-amber-900">
                  {covenantsByStatus.warning.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-purple-200 bg-purple-50/30',
            covenantsByStatus.protected.length === 0 && 'opacity-50'
          )}
        >
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-purple-700">Waiver Protected</p>
                <p className="text-lg font-semibold text-purple-900">
                  {covenantsByStatus.protected.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-green-200 bg-green-50/30',
            covenantsByStatus.healthy.length === 0 && 'opacity-50'
          )}
        >
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-green-700">Healthy</p>
                <p className="text-lg font-semibold text-green-900">
                  {covenantsByStatus.healthy.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical & Warning Covenants with Unified State */}
      {(covenantsByStatus.critical.length > 0 ||
        covenantsByStatus.warning.length > 0) && (
        <Card
          className="border-amber-200 bg-amber-50/30"
          data-testid="attention-required-section"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-900">
                Attention Required (
                {covenantsByStatus.critical.length + covenantsByStatus.warning.length})
              </h3>
            </div>
            <div className="grid gap-2">
              {[...covenantsByStatus.critical, ...covenantsByStatus.warning].map(
                (covenant) => (
                  <div
                    key={covenant.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100"
                    data-testid={`attention-covenant-${covenant.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(covenant.unifiedState.displayStatus)}
                      <div>
                        <span className="text-sm font-medium text-zinc-900">
                          {covenant.name}
                        </span>
                        <p className="text-xs text-zinc-500">
                          {covenant.unifiedState.statusDescription}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs', covenant.unifiedState.statusColor)}>
                        {covenant.latest_test.headroom_percentage.toFixed(1)}% headroom
                      </Badge>
                      {covenant.unifiedState.recommendedAction && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShowTimeline(covenant)}
                          data-testid={`view-timeline-btn-${covenant.id}`}
                        >
                          View Timeline
                        </Button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waived Covenants Summary - Enhanced with waiver context */}
      {waivedCovenants.length > 0 && (
        <Card
          className="border-purple-200 bg-purple-50/30"
          data-testid="waived-covenants-summary"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-purple-900">
                Active Waivers ({waivedCovenants.length})
              </h3>
              <Badge variant="outline" className="text-xs text-purple-700">
                Covenant state: Waived
              </Badge>
            </div>
            <p className="text-sm text-purple-700 mb-3">
              These covenants are temporarily in a waived state. The waiver represents a
              state transition that modifies compliance requirements.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {waivedCovenants.map((covenant) => {
                const enriched = enrichedCovenants.find((c) => c.id === covenant.id);
                return (
                  <div
                    key={covenant.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100"
                    data-testid={`waived-covenant-item-${covenant.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-zinc-900 truncate block">
                        {covenant.name}
                      </span>
                      {enriched?.activeWaiverState && (
                        <span className="text-xs text-purple-600">
                          {enriched.activeWaiverState.daysRemaining} days remaining
                        </span>
                      )}
                    </div>
                    {covenant.waiver && (
                      <WaiverBadge
                        expirationDate={covenant.waiver.expiration_date}
                        compact
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Covenants List */}
      <div className="grid gap-3">
        {/* Show waived covenants first, then active */}
        {waivedCovenants.map((covenant, idx) => (
          <CovenantCard
            key={covenant.id}
            covenant={covenant}
            index={idx}
            onRequestWaiver={handleRequestWaiver}
          />
        ))}
        {activeCovenants.map((covenant, idx) => (
          <CovenantCard
            key={covenant.id}
            covenant={covenant}
            index={waivedCovenants.length + idx}
            onRequestWaiver={handleRequestWaiver}
          />
        ))}
      </div>

      {covenants.length === 0 && (
        <div className="text-center text-zinc-500 py-12" data-testid="no-covenants-message">
          No covenants on record for this facility
        </div>
      )}

      {/* Unified Timeline for Selected Covenant */}
      {selectedTimelineCovenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedTimelineCovenant.name} - State Timeline
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTimelineCovenant(null)}
                data-testid="close-timeline-btn"
              >
                Close
              </Button>
            </div>
            <div className="p-4">
              <UnifiedCovenantTimeline
                covenant={selectedTimelineCovenant}
                waivers={getCovenantWaivers(selectedTimelineCovenant.id, waivers)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Waiver Request Modal */}
      <WaiverRequestModal
        open={waiverModalOpen}
        onOpenChange={setWaiverModalOpen}
        covenant={selectedCovenant}
        onSubmit={handleWaiverSubmit}
      />
    </div>
  );
});
