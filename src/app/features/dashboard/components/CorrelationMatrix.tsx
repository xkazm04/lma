'use client';

import React, { memo, useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  mockBorrowerProfiles,
  mockCorrelations,
  generateCorrelationMatrix,
} from '../lib/mocks';

interface CorrelationMatrixProps {
  onBorrowerClick?: (borrowerId: string) => void;
}

// Get color based on correlation value
function getCellColor(value: number): string {
  if (value >= 0.8) return 'bg-red-500';
  if (value >= 0.6) return 'bg-red-400';
  if (value >= 0.4) return 'bg-amber-400';
  if (value >= 0.2) return 'bg-yellow-300';
  if (value > 0) return 'bg-green-200';
  return 'bg-zinc-100';
}

function getCellTextColor(value: number): string {
  if (value >= 0.6) return 'text-white';
  return 'text-zinc-700';
}

// Matrix cell component
const MatrixCell = memo(function MatrixCell({
  value,
  borrower1,
  borrower2,
  row,
  col,
  onClick,
}: {
  value: number;
  borrower1: string;
  borrower2: string;
  row: number;
  col: number;
  onClick?: () => void;
}) {
  const isDiagonal = row === col;
  const displayValue = isDiagonal ? '-' : (value * 100).toFixed(0);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'w-10 h-10 flex items-center justify-center text-xs font-medium transition-all rounded-sm',
              isDiagonal
                ? 'bg-zinc-200 cursor-default'
                : cn(
                    getCellColor(value),
                    getCellTextColor(value),
                    'hover:ring-2 hover:ring-purple-400 hover:ring-offset-1 cursor-pointer'
                  )
            )}
            onClick={isDiagonal ? undefined : onClick}
            disabled={isDiagonal}
            data-testid={`matrix-cell-${row}-${col}`}
          >
            {displayValue}
            {!isDiagonal && value > 0 && '%'}
          </button>
        </TooltipTrigger>
        {!isDiagonal && value > 0 && (
          <TooltipContent side="top" className="max-w-[250px]">
            <div className="text-xs">
              <p className="font-medium mb-1">
                {borrower1} ↔ {borrower2}
              </p>
              <p className="text-zinc-400">
                Correlation: {(value * 100).toFixed(1)}%
              </p>
              <p className="text-zinc-400 mt-1">Click to view details</p>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
});

// Legend component
const CorrelationLegend = memo(function CorrelationLegend() {
  const legendItems = [
    { color: 'bg-green-200', label: '0-20%', description: 'Low' },
    { color: 'bg-yellow-300', label: '20-40%', description: 'Moderate' },
    { color: 'bg-amber-400', label: '40-60%', description: 'Medium' },
    { color: 'bg-red-400', label: '60-80%', description: 'High' },
    { color: 'bg-red-500', label: '80-100%', description: 'Very High' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 mt-4 p-3 bg-zinc-50 rounded-lg">
      <span className="text-xs font-medium text-zinc-600">Correlation:</span>
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={cn('w-4 h-4 rounded-sm', item.color)} />
          <span className="text-xs text-zinc-600">{item.description}</span>
        </div>
      ))}
    </div>
  );
});

export const CorrelationMatrix = memo(function CorrelationMatrix({
  onBorrowerClick,
}: CorrelationMatrixProps) {
  const matrixData = useMemo(
    () => generateCorrelationMatrix(mockBorrowerProfiles, mockCorrelations),
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-700">
          Borrower Correlation Matrix
        </h4>
        <span className="text-xs text-zinc-500">
          {matrixData.borrowers.length} borrowers
        </span>
      </div>

      {/* Scrollable matrix container */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex">
            {/* Empty corner cell */}
            <div className="w-24 h-10 flex-shrink-0" />
            {/* Column headers */}
            {matrixData.borrowers.map((borrower, idx) => (
              <div
                key={`header-${borrower.id}`}
                className="w-10 h-10 flex items-center justify-center"
              >
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button
                        className="text-[10px] font-medium text-zinc-600 hover:text-zinc-900 truncate w-full text-center cursor-pointer"
                        onClick={() => onBorrowerClick?.(borrower.id)}
                        data-testid={`matrix-header-col-${idx}`}
                      >
                        {borrower.shortName.slice(0, 4)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{borrower.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {matrixData.borrowers.map((rowBorrower, rowIdx) => (
            <div key={`row-${rowBorrower.id}`} className="flex">
              {/* Row header */}
              <div className="w-24 h-10 flex items-center pr-2 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button
                        className="text-xs font-medium text-zinc-700 hover:text-zinc-900 truncate text-right w-full cursor-pointer"
                        onClick={() => onBorrowerClick?.(rowBorrower.id)}
                        data-testid={`matrix-header-row-${rowIdx}`}
                      >
                        {rowBorrower.shortName}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="text-xs">{rowBorrower.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Row cells */}
              {matrixData.borrowers.map((colBorrower, colIdx) => (
                <MatrixCell
                  key={`cell-${rowIdx}-${colIdx}`}
                  value={matrixData.matrix[rowIdx][colIdx]}
                  borrower1={rowBorrower.name}
                  borrower2={colBorrower.name}
                  row={rowIdx}
                  col={colIdx}
                  onClick={() => onBorrowerClick?.(rowBorrower.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <CorrelationLegend />

      {/* Highlights */}
      {matrixData.highlights.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <h5 className="text-xs font-medium text-amber-800 mb-2">
            High Correlation Alerts
          </h5>
          <div className="space-y-1">
            {matrixData.highlights
              .filter((h) => h.type === 'high_positive')
              .slice(0, 3)
              .map((highlight, idx) => (
                <p key={idx} className="text-xs text-amber-700">
                  • {highlight.tooltip}
                </p>
              ))}
          </div>
        </div>
      )}
    </div>
  );
});
