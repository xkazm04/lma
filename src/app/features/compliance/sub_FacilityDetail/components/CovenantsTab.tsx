'use client';

import React, { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ShieldCheck } from 'lucide-react';
import { CovenantCard, WaiverBadge } from '../../sub_Covenants/components';
import type { Covenant } from '../../lib';

interface CovenantsTabProps {
  covenants: Covenant[];
}

export const CovenantsTab = memo(function CovenantsTab({ covenants }: CovenantsTabProps) {
  const waivedCovenants = useMemo(
    () => covenants.filter((c) => c.status === 'waived' && c.waiver),
    [covenants]
  );

  const activeCovenants = useMemo(
    () => covenants.filter((c) => c.status !== 'waived'),
    [covenants]
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Financial Covenants</h2>
          <p className="text-sm text-zinc-500">Tracked covenant tests and headroom</p>
        </div>
        <Button size="sm" className="hover:shadow-sm transition-all" data-testid="add-covenant-btn">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Waived Covenants Summary */}
      {waivedCovenants.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/30" data-testid="waived-covenants-summary">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-purple-900">
                Active Waivers ({waivedCovenants.length})
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {waivedCovenants.map((covenant) => (
                <div
                  key={covenant.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100"
                  data-testid={`waived-covenant-item-${covenant.id}`}
                >
                  <span className="text-sm font-medium text-zinc-900 truncate">
                    {covenant.name}
                  </span>
                  {covenant.waiver && (
                    <WaiverBadge expirationDate={covenant.waiver.expiration_date} compact />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Covenants List */}
      <div className="grid gap-3">
        {/* Show waived covenants first, then active */}
        {waivedCovenants.map((covenant, idx) => (
          <CovenantCard key={covenant.id} covenant={covenant} index={idx} />
        ))}
        {activeCovenants.map((covenant, idx) => (
          <CovenantCard key={covenant.id} covenant={covenant} index={waivedCovenants.length + idx} />
        ))}
      </div>

      {covenants.length === 0 && (
        <div className="text-center text-zinc-500 py-12" data-testid="no-covenants-message">
          No covenants on record for this facility
        </div>
      )}
    </div>
  );
});
