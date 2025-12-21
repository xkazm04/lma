'use client';

import React, { memo } from 'react';
import { Search, FileX, FolderOpen, Filter, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateVariant = 'search' | 'filter' | 'no-data' | 'facilities' | 'allocations';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
}

const variantConfig: Record<EmptyStateVariant, { icon: React.ReactNode; defaultTitle: string; defaultDescription: string }> = {
  search: {
    icon: <Search className="w-12 h-12 text-zinc-300" strokeWidth={1.5} />,
    defaultTitle: 'No results found',
    defaultDescription: 'Try adjusting your search terms or clearing the search field.',
  },
  filter: {
    icon: <Filter className="w-12 h-12 text-zinc-300" strokeWidth={1.5} />,
    defaultTitle: 'No matches for current filters',
    defaultDescription: 'Try adjusting your filter criteria to see more results.',
  },
  'no-data': {
    icon: <FileX className="w-12 h-12 text-zinc-300" strokeWidth={1.5} />,
    defaultTitle: 'No data available',
    defaultDescription: 'There is no data to display at this time.',
  },
  facilities: {
    icon: <Building2 className="w-12 h-12 text-zinc-300" strokeWidth={1.5} />,
    defaultTitle: 'No facilities match your filters',
    defaultDescription: 'Try adjusting your search or filter criteria to find facilities.',
  },
  allocations: {
    icon: <FolderOpen className="w-12 h-12 text-zinc-300" strokeWidth={1.5} />,
    defaultTitle: 'No allocations match your search',
    defaultDescription: 'Try adjusting your search terms to find allocation projects.',
  },
};

export const EmptyState = memo(function EmptyState({
  variant = 'no-data',
  title,
  description,
  actionLabel = 'Reset Filters',
  onAction,
  showAction = true,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in duration-500"
      data-testid="empty-state-container"
    >
      {/* Illustration Container */}
      <div
        className="relative mb-6 animate-in zoom-in-50 duration-500 delay-100"
        data-testid="empty-state-illustration"
      >
        {/* Background circle */}
        <div className="absolute inset-0 bg-zinc-100 rounded-full scale-150 opacity-50" />
        {/* Icon container */}
        <div className="relative flex items-center justify-center w-24 h-24 bg-zinc-50 rounded-full border border-zinc-200">
          {config.icon}
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center max-w-md animate-in slide-in-from-bottom-4 duration-500 delay-200">
        <h3
          className="text-lg font-semibold text-zinc-900 mb-2"
          data-testid="empty-state-title"
        >
          {displayTitle}
        </h3>
        <p
          className="text-sm text-zinc-500 mb-6"
          data-testid="empty-state-description"
        >
          {displayDescription}
        </p>

        {/* Action Button */}
        {showAction && onAction && (
          <Button
            variant="outline"
            onClick={onAction}
            className="transition-transform hover:scale-105"
            data-testid="empty-state-action-btn"
          >
            {actionLabel}
          </Button>
        )}
      </div>

      {/* Suggestion text */}
      <p
        className="mt-8 text-xs text-zinc-400 animate-in fade-in duration-500 delay-300"
        data-testid="empty-state-suggestion"
      >
        Need help? Check your filter settings or try a different search.
      </p>
    </div>
  );
});
