'use client';

import React, { memo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Network,
  Building2,
  ArrowLeftRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskCorrelation } from '../lib/mocks';
import { getCorrelationColor, getCorrelationBgColor } from '../lib/mocks';

interface CorrelatedBorrowersPanelProps {
  correlations: RiskCorrelation[];
  onBorrowerClick?: (borrowerId: string) => void;
}

// Grouping by borrower to show all their correlations
interface BorrowerCorrelationGroup {
  borrowerId: string;
  borrowerName: string;
  correlatedWith: {
    borrowerId: string;
    borrowerName: string;
    strength: number;
    type: string;
    sharedFactors: string[];
  }[];
  avgCorrelation: number;
  maxCorrelation: number;
}

function groupCorrelationsByBorrower(
  correlations: RiskCorrelation[]
): BorrowerCorrelationGroup[] {
  const groupMap = new Map<string, BorrowerCorrelationGroup>();

  correlations.forEach((corr) => {
    // Add for borrower1
    if (!groupMap.has(corr.borrower1Id)) {
      groupMap.set(corr.borrower1Id, {
        borrowerId: corr.borrower1Id,
        borrowerName: corr.borrower1Name,
        correlatedWith: [],
        avgCorrelation: 0,
        maxCorrelation: 0,
      });
    }
    const group1 = groupMap.get(corr.borrower1Id)!;
    group1.correlatedWith.push({
      borrowerId: corr.borrower2Id,
      borrowerName: corr.borrower2Name,
      strength: corr.correlationStrength,
      type: corr.correlationType,
      sharedFactors: corr.sharedFactors.map((f) => f.factorName),
    });

    // Add for borrower2
    if (!groupMap.has(corr.borrower2Id)) {
      groupMap.set(corr.borrower2Id, {
        borrowerId: corr.borrower2Id,
        borrowerName: corr.borrower2Name,
        correlatedWith: [],
        avgCorrelation: 0,
        maxCorrelation: 0,
      });
    }
    const group2 = groupMap.get(corr.borrower2Id)!;
    group2.correlatedWith.push({
      borrowerId: corr.borrower1Id,
      borrowerName: corr.borrower1Name,
      strength: corr.correlationStrength,
      type: corr.correlationType,
      sharedFactors: corr.sharedFactors.map((f) => f.factorName),
    });
  });

  // Calculate avg and max
  groupMap.forEach((group) => {
    if (group.correlatedWith.length > 0) {
      group.avgCorrelation =
        group.correlatedWith.reduce((sum, c) => sum + c.strength, 0) /
        group.correlatedWith.length;
      group.maxCorrelation = Math.max(...group.correlatedWith.map((c) => c.strength));
    }
    // Sort by strength
    group.correlatedWith.sort((a, b) => b.strength - a.strength);
  });

  return Array.from(groupMap.values()).sort(
    (a, b) => b.maxCorrelation - a.maxCorrelation
  );
}

// Individual borrower row
const BorrowerCorrelationRow = memo(function BorrowerCorrelationRow({
  group,
  isExpanded,
  onToggle,
  onBorrowerClick,
}: {
  group: BorrowerCorrelationGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onBorrowerClick?: (borrowerId: string) => void;
}) {
  return (
    <div
      className="border border-zinc-100 rounded-lg overflow-hidden"
      data-testid={`borrower-correlation-group-${group.borrowerId}`}
    >
      {/* Header row */}
      <button
        className="w-full p-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-left"
        onClick={onToggle}
        data-testid={`borrower-correlation-toggle-${group.borrowerId}`}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        )}
        <Building2 className="w-4 h-4 text-zinc-500" />
        <span className="font-medium text-zinc-900 flex-1 truncate">
          {group.borrowerName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {group.correlatedWith.length} correlations
          </span>
          <div
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              getCorrelationBgColor(group.maxCorrelation),
              getCorrelationColor(group.maxCorrelation)
            )}
          >
            Max: {Math.round(group.maxCorrelation * 100)}%
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {group.correlatedWith.map((corr, idx) => (
            <div
              key={`${group.borrowerId}-${corr.borrowerId}`}
              className="flex items-center gap-3 p-2 bg-zinc-50 rounded-md cursor-pointer hover:bg-zinc-100 transition-colors"
              onClick={() => onBorrowerClick?.(corr.borrowerId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBorrowerClick?.(corr.borrowerId);
                }
              }}
              data-testid={`correlation-detail-${group.borrowerId}-${corr.borrowerId}`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-sm text-zinc-700 flex-1 truncate">
                {corr.borrowerName}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {corr.type.replace('_', ' ')}
              </Badge>
              <span
                className={cn(
                  'text-sm font-medium',
                  getCorrelationColor(corr.strength)
                )}
              >
                {Math.round(corr.strength * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export const CorrelatedBorrowersPanel = memo(function CorrelatedBorrowersPanel({
  correlations,
  onBorrowerClick,
}: CorrelatedBorrowersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedBorrowers, setExpandedBorrowers] = useState<Set<string>>(new Set());

  const groups = React.useMemo(
    () => groupCorrelationsByBorrower(correlations),
    [correlations]
  );

  const toggleBorrower = (borrowerId: string) => {
    setExpandedBorrowers((prev) => {
      const next = new Set(prev);
      if (next.has(borrowerId)) {
        next.delete(borrowerId);
      } else {
        next.add(borrowerId);
      }
      return next;
    });
  };

  return (
    <div data-testid="correlated-borrowers-panel">
      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="correlated-borrowers-toggle"
      >
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-zinc-700">
            Borrower Correlation Network
          </span>
          <Badge variant="secondary" className="text-xs">
            {groups.length} borrowers
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {groups.length > 0 ? (
            groups.slice(0, 6).map((group) => (
              <BorrowerCorrelationRow
                key={group.borrowerId}
                group={group}
                isExpanded={expandedBorrowers.has(group.borrowerId)}
                onToggle={() => toggleBorrower(group.borrowerId)}
                onBorrowerClick={onBorrowerClick}
              />
            ))
          ) : (
            <div className="p-4 text-center text-zinc-500 text-sm">
              No significant correlations found
            </div>
          )}

          {groups.length > 6 && (
            <p className="text-xs text-zinc-500 text-center pt-2">
              +{groups.length - 6} more borrowers with correlations
            </p>
          )}
        </div>
      )}
    </div>
  );
});
