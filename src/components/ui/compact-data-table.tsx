'use client';

import React, { memo, useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: string;
  label?: string;
  width?: string;
  flex?: number;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}

interface CompactDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (item: T, index: number) => void;
  rowHeight?: 'xs' | 'sm' | 'md';
  stickyHeader?: boolean;
  maxHeight?: string;
  emptyMessage?: string;
  alternatingRows?: boolean;
  expandable?: boolean;
  renderExpanded?: (item: T, index: number) => React.ReactNode;
  getRowKey?: (item: T, index: number) => string | number;
  className?: string;
  showHeader?: boolean;
}

const rowHeightClasses = {
  xs: 'py-1.5',
  sm: 'py-2',
  md: 'py-2.5',
};

function CompactDataTableInner<T>({
  data,
  columns,
  onRowClick,
  rowHeight = 'sm',
  stickyHeader = false,
  maxHeight,
  emptyMessage = 'No data available',
  alternatingRows = false,
  expandable = false,
  renderExpanded,
  getRowKey,
  className,
  showHeader = true,
}: CompactDataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const toggleRow = useCallback((key: string | number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const getKey = useCallback(
    (item: T, index: number): string | number => {
      if (getRowKey) return getRowKey(item, index);
      if (typeof item === 'object' && item !== null && 'id' in item) {
        return (item as { id: string | number }).id;
      }
      return index;
    },
    [getRowKey]
  );

  const getColumnStyle = (col: ColumnDef<T>) => {
    const style: React.CSSProperties = {};
    if (col.width) style.width = col.width;
    if (col.flex) style.flex = col.flex;
    if (!col.width && !col.flex) style.flex = 1;
    return style;
  };

  const getAlignment = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center justify-center';
      case 'right':
        return 'text-right justify-end';
      default:
        return 'text-left justify-start';
    }
  };

  return (
    <div
      className={cn('w-full', className)}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      <div className="min-w-full">
        {/* Header */}
        {showHeader && (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wider',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            {expandable && <div className="w-6 shrink-0" />}
            {columns.map((col) => (
              <div
                key={col.key}
                className={cn('min-w-0', getAlignment(col.align), col.headerClassName)}
                style={getColumnStyle(col)}
              >
                {col.label || ''}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div>
          {data.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
              {emptyMessage}
            </div>
          ) : (
            data.map((item, index) => {
              const rowKey = getKey(item, index);
              const isExpanded = expandedRows.has(rowKey);
              const isClickable = Boolean(onRowClick) || (expandable && renderExpanded);

              return (
                <React.Fragment key={rowKey}>
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 border-b border-zinc-100 transition-colors',
                      rowHeightClasses[rowHeight],
                      alternatingRows && index % 2 === 1 && 'bg-zinc-50/50',
                      isClickable && 'cursor-pointer hover:bg-zinc-50',
                      isExpanded && 'bg-zinc-50'
                    )}
                    onClick={() => {
                      if (expandable && renderExpanded) {
                        toggleRow(rowKey);
                      }
                      onRowClick?.(item, index);
                    }}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={
                      isClickable
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (expandable && renderExpanded) {
                                toggleRow(rowKey);
                              }
                              onRowClick?.(item, index);
                            }
                          }
                        : undefined
                    }
                  >
                    {expandable && renderExpanded && (
                      <div className="w-6 shrink-0 flex items-center justify-center">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    )}
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        className={cn(
                          'min-w-0 flex items-center',
                          getAlignment(col.align),
                          col.className
                        )}
                        style={getColumnStyle(col)}
                      >
                        {col.render
                          ? col.render(item, index)
                          : (item as Record<string, unknown>)[col.key]?.toString() ?? ''}
                      </div>
                    ))}
                  </div>
                  {expandable && renderExpanded && isExpanded && (
                    <div className="border-b border-zinc-100">{renderExpanded(item, index)}</div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export const CompactDataTable = memo(CompactDataTableInner) as typeof CompactDataTableInner;
