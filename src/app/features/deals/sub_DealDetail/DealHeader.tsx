'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DealWithStats } from '../lib/types';

import {
  getStatusColor,
  getStatusBadgeVariant,
  getStatusLabel,
} from '@/lib/utils/statusHelpers';

interface DealHeaderProps {
  deal: DealWithStats;
}

export const DealHeader = memo(function DealHeader({ deal }: DealHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between animate-in fade-in slide-in-from-top-4 duration-500" data-testid="deal-header">
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/deals')}
          data-testid="deal-back-btn"
          aria-label="Go back to deals list"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant={getStatusBadgeVariant(deal.status)}
              className={getStatusColor(deal.status)}
            >
              {getStatusLabel(deal.status)}
            </Badge>
            <Badge variant="outline">New Facility</Badge>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">{deal.deal_name}</h1>
          <p className="text-zinc-500 mt-1">{deal.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="transition-transform hover:scale-105"
          data-testid="deal-export-btn"
          aria-label="Export deal data"
        >
          <Download className="w-4 h-4 mr-2" aria-hidden="true" />
          Export
        </Button>
        <Button
          variant="outline"
          className="transition-transform hover:scale-105"
          data-testid="deal-settings-btn"
          aria-label="Open deal settings"
        >
          <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
          Settings
        </Button>
      </div>
    </div>
  );
});
