'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import type { FacilityDetail } from '../../lib';

interface FacilityHeaderProps {
  facility: FacilityDetail;
}

import { getStatusBadge } from '@/lib/utils/statusHelpers';

// ... (existing imports)

interface FacilityHeaderProps {
  facility: FacilityDetail;
}

export const FacilityHeader = memo(function FacilityHeader({ facility }: FacilityHeaderProps) {
  const statusBadge = getStatusBadge(facility.status);

  return (
    <div className="flex items-start justify-between animate-in fade-in slide-in-from-top-2">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
          {/* ... existing breadcrumbs ... */}
          <Link href="/compliance" className="hover:text-zinc-900 transition-colors">
            Compliance
          </Link>
          <span>/</span>
          <Link href="/compliance/facilities" className="hover:text-zinc-900 transition-colors">
            Facilities
          </Link>
          <span>/</span>
          <span className="text-zinc-900">{facility.facility_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/compliance/facilities">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 hover:bg-zinc-100 transition-colors"
              data-testid="facility-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">{facility.facility_name}</h1>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <p className="text-zinc-500">{facility.borrower_name}</p>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        className="hover:shadow-sm transition-all"
        data-testid="facility-edit-btn"
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit Facility
      </Button>
    </div>
  );
});
