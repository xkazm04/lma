'use client';

import React, { memo } from 'react';
import { Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoGuideStore } from '../store';
import { getDemoContentCount } from '../content';

interface ExploreToggleProps {
  /** Additional className */
  className?: string;
  /** Show label text */
  showLabel?: boolean;
}

/**
 * ExploreToggle - Header toggle button for explore mode
 *
 * Displays a compass icon that toggles explore mode on/off.
 * When active, shows a badge with the count of available demos.
 */
export const ExploreToggle = memo(function ExploreToggle({
  className,
  showLabel = true,
}: ExploreToggleProps) {
  const { isExploreMode, toggleExploreMode, viewedDemos } = useDemoGuideStore();
  const totalDemos = getDemoContentCount();
  const viewedCount = viewedDemos.size;

  return (
    <button
      onClick={toggleExploreMode}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
        isExploreMode
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900',
        className
      )}
      aria-pressed={isExploreMode}
      aria-label={isExploreMode ? 'Exit explore mode' : 'Enter explore mode'}
    >
      <Compass
        className={cn(
          'w-4 h-4 transition-transform duration-300',
          isExploreMode && 'rotate-45'
        )}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {isExploreMode ? 'Exploring' : 'Explore'}
        </span>
      )}


      {/* Notification dot when not active and demos available */}
      {!isExploreMode && totalDemos > 0 && viewedCount < totalDemos && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
      )}
    </button>
  );
});

export default ExploreToggle;
