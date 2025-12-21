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
        icon: <FileText className="w-4 h-4 text-zinc-600" />,
      },
      {
        label: 'Completed',
        value: counts.completed,
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      },
      {
        label: 'Processing',
        value: counts.processing,
        icon: <Loader2 className="w-4 h-4 text-blue-500" />,
      },
      {
        label: 'Review',
        value: counts.review,
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      },
      {
        label: 'Failed',
        value: counts.failed,
        icon: <Clock className="w-4 h-4 text-red-500" />,
      },
    ];
  }, [documents]);

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300" data-testid="document-stats-bar">
      <CompactStatRow stats={stats} variant="bordered" animated />
    </div>
  );
});
