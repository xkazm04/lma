'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type SortDirection = 'asc' | 'desc' | null;

export interface DataTableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Column header label */
  header: string;
  /** Width of the column (CSS value or flex number) */
  width?: string | number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (item: T, index: number) => React.ReactNode;
  /** Accessor function to get value (for sorting and default rendering) */
  accessor?: (item: T) => string | number | null | undefined;
  /** Whether to hide on mobile */
  hideOnMobile?: boolean;
  /** Whether to truncate content */
  truncate?: boolean;
  /** Additional className for header cell */
  headerClassName?: string;
  /** Additional className for body cells */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  /** Data array to display */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Unique key accessor for each row */
  getRowKey: (item: T, index: number) => string;
  /** Click handler for row selection */
  onRowClick?: (item: T, index: number) => void;
  /** Currently selected row key */
  selectedKey?: string;
  /** Enable search functionality */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Custom search filter function */
  searchFilter?: (item: T, query: string) => boolean;
  /** Default sort column key */
  defaultSortKey?: string;
  /** Default sort direction */
  defaultSortDirection?: SortDirection;
  /** Enable expandable rows */
  expandable?: boolean;
  /** Render function for expanded content */
  renderExpanded?: (item: T, index: number) => React.ReactNode;
  /** Initially expanded row keys */
  defaultExpandedKeys?: string[];
  /** Show alternating row colors */
  striped?: boolean;
  /** Row size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Sticky header */
  stickyHeader?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Additional className for container */
  className?: string;
  /** Additional className for table */
  tableClassName?: string;
  /** Test ID */
  testId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CLASSES = {
  sm: {
    header: 'px-3 py-2',
    cell: 'px-3 py-2',
    text: 'text-xs',
  },
  md: {
    header: 'px-3 py-2.5',
    cell: 'px-3 py-2.5',
    text: 'text-sm',
  },
  lg: {
    header: 'px-4 py-3',
    cell: 'px-4 py-3',
    text: 'text-sm',
  },
};

const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const SortIcon = memo(function SortIcon({
  direction,
  active,
}: {
  direction: SortDirection;
  active: boolean;
}) {
  if (!active || direction === null) {
    return <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400" />;
  }
  if (direction === 'asc') {
    return <ChevronUp className="w-3.5 h-3.5 text-zinc-700" />;
  }
  return <ChevronDown className="w-3.5 h-3.5 text-zinc-700" />;
});

const EmptyState = memo(function EmptyState({
  message,
  icon,
}: {
  message: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="p-3 rounded-full bg-zinc-100 mb-3">
          {icon}
        </div>
      )}
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
});

const LoadingRows = memo(function LoadingRows({
  columns,
  size,
}: {
  columns: number;
  size: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className={sizeClasses.cell}>
              <div className="h-4 bg-zinc-200 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * DataTable - Universal data table component
 *
 * Standardized table styling with sorting, searching, expandable rows,
 * and consistent header/cell styling across the application.
 *
 * @example
 * // Basic usage
 * <DataTable
 *   data={items}
 *   columns={[
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'status', header: 'Status', align: 'center' },
 *     { key: 'value', header: 'Value', align: 'right', render: (item) => formatCurrency(item.value) },
 *   ]}
 *   getRowKey={(item) => item.id}
 *   onRowClick={(item) => console.log('Clicked:', item)}
 * />
 */
function DataTableInner<T>({
  data,
  columns,
  getRowKey,
  onRowClick,
  selectedKey,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchFilter,
  defaultSortKey,
  defaultSortDirection = null,
  expandable = false,
  renderExpanded,
  defaultExpandedKeys = [],
  striped = false,
  size = 'md',
  stickyHeader = false,
  emptyMessage = 'No data available',
  emptyIcon,
  loading = false,
  className,
  tableClassName,
  testId,
}: DataTableProps<T>) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set(defaultExpandedKeys)
  );

  // Size classes
  const sizeClasses = SIZE_CLASSES[size];

  // Handle sort toggle
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      // Cycle: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey, sortDirection]);

  // Handle expand toggle
  const handleToggleExpand = useCallback((key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        if (searchFilter) {
          return searchFilter(item, query);
        }
        // Default: search across all columns with accessors
        return columns.some((col) => {
          if (col.accessor) {
            const value = col.accessor(item);
            return value?.toString().toLowerCase().includes(query);
          }
          return false;
        });
      });
    }

    // Sort
    if (sortKey && sortDirection) {
      const column = columns.find((c) => c.key === sortKey);
      if (column?.accessor) {
        result.sort((a, b) => {
          const aVal = column.accessor!(a);
          const bVal = column.accessor!(b);

          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;

          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, searchQuery, searchFilter, sortKey, sortDirection, columns]);

  return (
    <div className={cn('w-full', className)} data-testid={testId}>
      {/* Search */}
      {searchable && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
              data-testid={testId ? `${testId}-search` : 'table-search'}
            />
          </div>
        </div>
      )}

      {/* Table container */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table
          className={cn('w-full border-collapse bg-white', tableClassName)}
          data-testid={testId ? `${testId}-table` : 'data-table'}
        >
          {/* Header */}
          <thead
            className={cn(
              'bg-zinc-50 border-b border-zinc-200',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {/* Expand column */}
              {expandable && (
                <th className={cn(sizeClasses.header, 'w-10')} />
              )}

              {columns.map((column) => {
                const isSortable = column.sortable;
                const isActive = sortKey === column.key;

                return (
                  <th
                    key={column.key}
                    className={cn(
                      sizeClasses.header,
                      'text-xs font-medium text-zinc-500 uppercase tracking-wider',
                      ALIGN_CLASSES[column.align || 'left'],
                      isSortable && 'cursor-pointer select-none hover:text-zinc-700 transition-colors',
                      column.hideOnMobile && 'hidden md:table-cell',
                      column.headerClassName
                    )}
                    style={{ width: column.width }}
                    onClick={isSortable ? () => handleSort(column.key) : undefined}
                    data-testid={testId ? `${testId}-header-${column.key}` : undefined}
                  >
                    <div className={cn(
                      'flex items-center gap-1.5',
                      column.align === 'right' && 'justify-end',
                      column.align === 'center' && 'justify-center'
                    )}>
                      <span>{column.header}</span>
                      {isSortable && (
                        <SortIcon direction={sortDirection} active={isActive} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <LoadingRows columns={columns.length + (expandable ? 1 : 0)} size={size} />
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (expandable ? 1 : 0)}
                  className="p-0"
                >
                  <EmptyState message={emptyMessage} icon={emptyIcon} />
                </td>
              </tr>
            ) : (
              processedData.map((item, rowIndex) => {
                const rowKey = getRowKey(item, rowIndex);
                const isSelected = selectedKey === rowKey;
                const isExpanded = expandedKeys.has(rowKey);
                const isClickable = Boolean(onRowClick);

                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      className={cn(
                        'transition-colors',
                        isClickable && 'cursor-pointer hover:bg-zinc-50',
                        isSelected && 'bg-blue-50',
                        isExpanded && 'bg-zinc-50',
                        striped && rowIndex % 2 === 1 && 'bg-zinc-50/50'
                      )}
                      onClick={isClickable && onRowClick ? () => onRowClick(item, rowIndex) : undefined}
                      data-testid={testId ? `${testId}-row-${rowKey}` : undefined}
                    >
                      {/* Expand toggle */}
                      {expandable && (
                        <td className={cn(sizeClasses.cell, 'w-10')}>
                          <button
                            onClick={(e) => handleToggleExpand(rowKey, e)}
                            className="p-1 hover:bg-zinc-200 rounded transition-colors"
                            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                          >
                            <ChevronRight
                              className={cn(
                                'w-4 h-4 text-zinc-500 transition-transform',
                                isExpanded && 'rotate-90'
                              )}
                            />
                          </button>
                        </td>
                      )}

                      {/* Data cells */}
                      {columns.map((column) => {
                        const value = column.accessor?.(item);
                        const content = column.render
                          ? column.render(item, rowIndex)
                          : value ?? '-';

                        return (
                          <td
                            key={column.key}
                            className={cn(
                              sizeClasses.cell,
                              sizeClasses.text,
                              'text-zinc-900',
                              ALIGN_CLASSES[column.align || 'left'],
                              column.truncate && 'max-w-[200px] truncate',
                              column.hideOnMobile && 'hidden md:table-cell',
                              column.cellClassName
                            )}
                            data-testid={testId ? `${testId}-cell-${column.key}-${rowKey}` : undefined}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Expanded content */}
                    {expandable && isExpanded && renderExpanded && (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="p-0 border-t border-zinc-100"
                        >
                          <div className="p-4 bg-zinc-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            {renderExpanded(item, rowIndex)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      {searchable && searchQuery && (
        <p className="mt-2 text-xs text-zinc-500">
          {processedData.length} result{processedData.length !== 1 ? 's' : ''} found
        </p>
      )}
    </div>
  );
}

// Memoize and export with generic support
export const DataTable = memo(DataTableInner) as typeof DataTableInner;

export default DataTable;
