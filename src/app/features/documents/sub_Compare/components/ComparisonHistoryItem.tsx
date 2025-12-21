'use client';

import React, { memo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Clock,
  User,
  Plus,
  Minus,
  Edit2,
  Tag,
  FileText,
  ChevronDown,
  ChevronRight,
  GitCompare,
  MoreHorizontal,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ComparisonHistoryEntryWithDetails } from '../lib/history-types';

interface ComparisonHistoryItemProps {
  entry: ComparisonHistoryEntryWithDetails;
  isSelected?: boolean;
  onSelect?: (entry: ComparisonHistoryEntryWithDetails) => void;
  onView?: (entry: ComparisonHistoryEntryWithDetails) => void;
  onCompareWith?: (entry: ComparisonHistoryEntryWithDetails) => void;
  onEdit?: (entry: ComparisonHistoryEntryWithDetails) => void;
  onDelete?: (entry: ComparisonHistoryEntryWithDetails) => void;
  isCompareMode?: boolean;
  compareEntryId?: string;
}

export const ComparisonHistoryItem = memo(function ComparisonHistoryItem({
  entry,
  isSelected = false,
  onSelect,
  onView,
  onCompareWith,
  onEdit,
  onDelete,
  isCompareMode = false,
  compareEntryId,
}: ComparisonHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCompareTarget = compareEntryId === entry.id;
  const canCompareWith = isCompareMode && !isCompareTarget && compareEntryId;

  const handleClick = () => {
    if (isCompareMode && canCompareWith) {
      onCompareWith?.(entry);
    } else {
      onSelect?.(entry);
    }
  };

  const formattedDate = format(new Date(entry.comparedAt), 'MMM d, yyyy');
  const formattedTime = format(new Date(entry.comparedAt), 'h:mm a');
  const relativeTime = formatDistanceToNow(new Date(entry.comparedAt), { addSuffix: true });

  return (
    <Card
      className={cn(
        'transition-all duration-200 cursor-pointer hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 shadow-md',
        isCompareTarget && 'ring-2 ring-purple-500 bg-purple-50',
        canCompareWith && 'hover:ring-2 hover:ring-green-400'
      )}
      onClick={handleClick}
      data-testid={`history-item-${entry.id}`}
      data-history-entry-id={entry.id}
    >
      <CardContent className="py-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              data-testid={`history-item-expand-${entry.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>

            <div className="flex flex-col min-w-0">
              {/* Label or date as title */}
              <div className="flex items-center gap-2">
                {entry.label ? (
                  <span className="font-medium text-zinc-900 truncate" title={entry.label}>
                    {entry.label}
                  </span>
                ) : (
                  <span className="font-medium text-zinc-700">
                    {formattedDate}
                  </span>
                )}
                {isCompareTarget && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                    Comparing
                  </Badge>
                )}
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {entry.label ? formattedDate : formattedTime}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {entry.comparedByName}
                </span>
                <span className="text-zinc-400" title={formattedDate + ' ' + formattedTime}>
                  {relativeTime}
                </span>
              </div>
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {entry.addedCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5"
                title={`${entry.addedCount} added`}
              >
                <Plus className="w-3 h-3 mr-0.5" />
                {entry.addedCount}
              </Badge>
            )}
            {entry.modifiedCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5"
                title={`${entry.modifiedCount} modified`}
              >
                <Edit2 className="w-3 h-3 mr-0.5" />
                {entry.modifiedCount}
              </Badge>
            )}
            {entry.removedCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5"
                title={`${entry.removedCount} removed`}
              >
                <Minus className="w-3 h-3 mr-0.5" />
                {entry.removedCount}
              </Badge>
            )}

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  data-testid={`history-item-menu-${entry.id}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onView?.(entry);
                  }}
                  data-testid={`history-item-view-${entry.id}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompareWith?.(entry);
                  }}
                  data-testid={`history-item-compare-${entry.id}`}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare with Another
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(entry);
                  }}
                  data-testid={`history-item-edit-${entry.id}`}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Label/Notes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(entry);
                  }}
                  className="text-red-600"
                  data-testid={`history-item-delete-${entry.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Documents compared */}
            <div className="flex items-center gap-2 text-sm text-zinc-600 mb-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate" title={entry.document1.name}>
                {entry.document1.name}
              </span>
              <span className="text-zinc-400">vs</span>
              <span className="truncate" title={entry.document2.name}>
                {entry.document2.name}
              </span>
            </div>

            {/* Label if present and not shown as title */}
            {entry.label && (
              <div className="flex items-center gap-2 text-sm text-zinc-600 mb-2">
                <Tag className="w-4 h-4 text-zinc-400" />
                <span>{entry.label}</span>
              </div>
            )}

            {/* Notes if present */}
            {entry.notes && (
              <div className="text-sm text-zinc-600 bg-zinc-50 rounded-md p-2 mt-2">
                <p className="whitespace-pre-wrap">{entry.notes}</p>
              </div>
            )}

            {/* Impact analysis preview */}
            {entry.impactAnalysis && (
              <div className="text-sm text-zinc-600 mt-2">
                <span className="font-medium">Impact: </span>
                <span className="text-zinc-500">
                  {entry.impactAnalysis.length > 150
                    ? entry.impactAnalysis.slice(0, 150) + '...'
                    : entry.impactAnalysis}
                </span>
              </div>
            )}

            {/* Total changes summary */}
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
              <span className="font-medium">{entry.totalChanges} total changes</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
