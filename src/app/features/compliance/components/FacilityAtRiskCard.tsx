'use client';

import React, { memo } from 'react';
import { FileWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FacilityAtRisk } from '../lib';

interface FacilityAtRiskCardProps {
  facility: FacilityAtRisk;
  index?: number;
}

export const FacilityAtRiskCard = memo(function FacilityAtRiskCard({
  facility,
  index = 0
}: FacilityAtRiskCardProps) {
  return (
    <div
      className={cn(
        'py-2 first:pt-0 last:pb-0',
        'animate-in fade-in slide-in-from-right-2'
      )}
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-2 group">
        <FileWarning className="w-4 h-4 text-red-500 mt-0.5 shrink-0 transition-transform group-hover:scale-110" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">
            {facility.facility_name}
          </p>
          <p className="text-xs text-zinc-500 truncate">{facility.borrower_name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="destructive" className="text-xs">
              {facility.risk_reason}
            </Badge>
            {facility.headroom_percentage !== null && (
              <span className="text-xs text-zinc-500">
                {facility.headroom_percentage}% headroom
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
