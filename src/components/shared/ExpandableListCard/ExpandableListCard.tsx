'use client';

import React, { memo, useState, useCallback, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExpandableItem {
  id: string;
  [key: string]: unknown;
}

interface ExpandableListCardProps<T extends ExpandableItem> {
  items: T[];
  title: string;
  description?: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  renderItemSummary: (item: T, isExpanded: boolean) => ReactNode;
  renderItemDetails: (item: T) => ReactNode;
  emptyMessage?: string;
  className?: string;
  testId?: string;
}

/**
 * ExpandableListCard - Unified expandable item list pattern
 *
 * Used for opportunity cards, activity details, and any list
 * where items can be expanded to show additional details.
 */
export const ExpandableListCard = memo(function ExpandableListCard<T extends ExpandableItem>({
  items,
  title,
  description,
  icon,
  headerAction,
  renderItemSummary,
  renderItemDetails,
  emptyMessage = 'No items to display',
  className,
  testId,
}: ExpandableListCardProps<T>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  return (
    <Card
      className={cn('animate-in fade-in slide-in-from-bottom-4 duration-500', className)}
      data-testid={testId}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="shrink-0">{icon}</div>}
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const isExpanded = expandedId === item.id;

              return (
                <ExpandableListItem
                  key={item.id}
                  item={item}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpanded(item.id)}
                  renderSummary={renderItemSummary}
                  renderDetails={renderItemDetails}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}) as <T extends ExpandableItem>(props: ExpandableListCardProps<T>) => React.ReactElement;

interface ExpandableListItemProps<T extends ExpandableItem> {
  item: T;
  isExpanded: boolean;
  onToggle: () => void;
  renderSummary: (item: T, isExpanded: boolean) => ReactNode;
  renderDetails: (item: T) => ReactNode;
}

const ExpandableListItem = memo(function ExpandableListItem<T extends ExpandableItem>({
  item,
  isExpanded,
  onToggle,
  renderSummary,
  renderDetails,
}: ExpandableListItemProps<T>) {
  return (
    <div
      className="rounded-lg border border-zinc-200 overflow-hidden transition-all hover:border-zinc-300"
      data-testid={`expandable-item-${item.id}`}
    >
      {/* Summary/Header - Always visible */}
      <div
        className="flex items-center justify-between p-4 bg-zinc-50 cursor-pointer"
        onClick={onToggle}
        data-testid={`expandable-toggle-${item.id}`}
      >
        <div className="flex-1">
          {renderSummary(item, isExpanded)}
        </div>
        <div className="shrink-0 ml-4">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Details - Shown when expanded */}
      {isExpanded && (
        <div
          className="p-4 border-t border-zinc-200 bg-white animate-in fade-in slide-in-from-top-2 duration-200"
          data-testid={`expandable-details-${item.id}`}
        >
          {renderDetails(item)}
        </div>
      )}
    </div>
  );
}) as <T extends ExpandableItem>(props: ExpandableListItemProps<T>) => React.ReactElement;

export default ExpandableListCard;
