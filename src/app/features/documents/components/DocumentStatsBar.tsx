'use client';

import React, { memo, useMemo } from 'react';
import { FileText, CheckCircle, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { CompactStatRow } from '@/components/ui/compact-stat-row';
import type { LoanDocument } from '@/types';

interface DocumentStatsBarProps {
  documents: LoanDocument[];
}

export const DocumentStatsBar = memo(function DocumentStatsBar({ documents }: DocumentStatsBarProps) {
  const stats = useMemo(() => {
    const counts = documents.reduce(
      (acc, doc) => {
        acc.total++;
        if (doc.processing_status === 'completed') acc.completed++;
        else if (doc.processing_status === 'processing') acc.processing++;
        else if (doc.processing_status === 'review_required') acc.review++;
        else if (doc.processing_status === 'failed') acc.failed++;
        return acc;
      },
      { total: 0, completed: 0, processing: 0, review: 0, failed: 0 }
    );

    return [
      {
        label: 'Total',
        value: counts.total,
        icon: <FileText className="w-3.5 h-3.5 text-zinc-500" />,
      },
      {
        label: 'Completed',
        value: counts.completed,
        icon: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
      },
      {
        label: 'Processing',
        value: counts.processing,
        icon: <Loader2 className="w-3.5 h-3.5 text-blue-500" />,
      },
      {
        label: 'Review',
        value: counts.review,
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
      },
      {
        label: 'Failed',
        value: counts.failed,
        icon: <Clock className="w-3.5 h-3.5 text-red-500" />,
      },
    ];
  }, [documents]);

  return (
    <div data-testid="document-stats-bar">
      <CompactStatRow stats={stats} variant="bordered" animated />
    </div>
  );
});
