'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CorrelationMatrix } from '../../lib/correlation-types';
import { categorizeCorrelationStrength, getCorrelationStrengthColor } from '../../lib/correlation-types';
import { Info } from 'lucide-react';

interface CorrelationMatrixHeatmapProps {
  matrix: CorrelationMatrix;
  onCellClick?: (rowId: string, colId: string, correlation: number) => void;
}

/**
 * Heatmap visualization of covenant correlation matrix.
 * Shows correlation coefficients with color intensity indicating strength.
 */
export const CorrelationMatrixHeatmap = memo(function CorrelationMatrixHeatmap({
  matrix,
  onCellClick,
}: CorrelationMatrixHeatmapProps) {
  const cellSize = 80; // px

  // Calculate color for correlation value
  const getCorrelationColor = (value: number, pValue: number): string => {
    if (pValue > 0.05) return 'rgb(243, 244, 246)'; // gray-100 - not significant
    const strength = categorizeCorrelationStrength(value);
    const baseColor = getCorrelationStrengthColor(strength);
    const opacity = Math.abs(value);
    return baseColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
  };

  // Get text color based on background
  const getTextColor = (value: number, pValue: number): string => {
    if (pValue > 0.05) return 'text-zinc-400';
    const abs = Math.abs(value);
    return abs > 0.5 ? 'text-white' : 'text-zinc-700';
  };

  return (
    <Card data-testid="correlation-matrix-heatmap">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Covenant Correlation Matrix</CardTitle>
            <CardDescription>
              Statistical dependencies between covenant performance (Pearson correlation)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Info className="w-4 h-4" />
            <span>Hover cells for details</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-4 flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(220, 38, 38)' }} />
            <span className="text-zinc-600">Very Strong (|r| ≥ 0.8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(249, 115, 22)' }} />
            <span className="text-zinc-600">Strong (0.6-0.8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(234, 179, 8)' }} />
            <span className="text-zinc-600">Moderate (0.4-0.6)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100" />
            <span className="text-zinc-600">Non-significant (p &gt; 0.05)</span>
          </div>
        </div>

        {/* Matrix Container */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header Row */}
            <div className="flex">
              <div style={{ width: `${cellSize * 2}px` }} className="shrink-0" />
              {matrix.col_metadata.map((col, idx) => (
                <div
                  key={col.covenant_id}
                  style={{ width: `${cellSize}px` }}
                  className="shrink-0 px-2 py-1"
                >
                  <div className="transform -rotate-45 origin-bottom-left whitespace-nowrap text-xs text-zinc-700 font-medium">
                    {col.covenant_name}
                  </div>
                  <div className="mt-8 text-xs text-zinc-500 truncate">{col.facility_name}</div>
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {matrix.row_metadata.map((row, rowIdx) => (
              <div key={row.covenant_id} className="flex items-center border-t border-zinc-100">
                {/* Row Label */}
                <div style={{ width: `${cellSize * 2}px` }} className="shrink-0 pr-3 py-2">
                  <div className="text-xs font-medium text-zinc-700 truncate">
                    {row.covenant_name}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">{row.facility_name}</div>
                </div>

                {/* Matrix Cells */}
                {matrix.values[rowIdx].map((value, colIdx) => {
                  const pValue = matrix.p_values[rowIdx][colIdx];
                  const leadLag = matrix.lead_lag_matrix[rowIdx][colIdx];
                  const isDiagonal = rowIdx === colIdx;
                  const isSignificant = pValue <= 0.05;

                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        backgroundColor: isDiagonal
                          ? 'rgb(241, 245, 249)'
                          : getCorrelationColor(value, pValue),
                      }}
                      className={cn(
                        'shrink-0 flex flex-col items-center justify-center border border-zinc-200',
                        !isDiagonal && isSignificant && 'cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all',
                        getTextColor(value, pValue)
                      )}
                      onClick={() => {
                        if (!isDiagonal && isSignificant && onCellClick) {
                          onCellClick(matrix.row_labels[rowIdx], matrix.col_labels[colIdx], value);
                        }
                      }}
                      data-testid={`matrix-cell-${rowIdx}-${colIdx}`}
                    >
                      {isDiagonal ? (
                        <span className="text-xs text-zinc-400">—</span>
                      ) : value !== 0 ? (
                        <>
                          <div className="text-sm font-semibold">{value.toFixed(2)}</div>
                          {isSignificant && (
                            <div className="text-xs opacity-80">
                              {leadLag > 0 && `+${leadLag}Q`}
                              {leadLag < 0 && `${leadLag}Q`}
                            </div>
                          )}
                          {!isSignificant && (
                            <div className="text-xs opacity-60">n.s.</div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-4 text-xs text-zinc-500 space-y-1">
          <p>
            <strong>Correlation coefficient (r):</strong> Ranges from -1 (perfect negative) to +1 (perfect positive).
          </p>
          <p>
            <strong>Lead-lag (quarters):</strong> Positive values indicate row covenant leads column covenant.
          </p>
          <p>
            <strong>Significance:</strong> p ≤ 0.05 indicates statistically significant correlation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
