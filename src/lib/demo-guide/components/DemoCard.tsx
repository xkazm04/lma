'use client';

import React, { memo, useCallback } from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoGuideStore } from '../store';
import { moduleContent } from '../content';

interface DemoCardProps {
  /** The section ID from the module content (e.g., 'dashboard-stats') */
  sectionId: string;
  /** The wrapped component(s) */
  children: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
  /** Whether the card should be full width */
  fullWidth?: boolean;
}

/**
 * Find a section by ID across all modules
 */
function findSection(sectionId: string) {
  for (const module of Object.values(moduleContent)) {
    const section = module.sections.find((s) => s.id === sectionId);
    if (section) {
      return section;
    }
  }
  return null;
}

/**
 * DemoCard - Wrapper component for explore mode demo guidance
 *
 * Wraps any component to make it explorable. When explore mode is active:
 * - Shows a lightbulb indicator in the top-right corner
 * - Adds blue-to-black shadow on hover
 * - Clicking selects the section in the ExplorePanel
 *
 * @example
 * ```tsx
 * <DemoCard sectionId="dashboard-stats">
 *   <PortfolioStatsBar />
 * </DemoCard>
 * ```
 */
export const DemoCard = memo(function DemoCard({
  sectionId,
  children,
  className,
  fullWidth = false,
}: DemoCardProps) {
  const { isExploreMode, setActiveSection, hasViewed, activeSection } = useDemoGuideStore();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isExploreMode) return;

      // Prevent click from propagating to child elements
      e.stopPropagation();
      e.preventDefault();

      const section = findSection(sectionId);
      if (section) {
        setActiveSection(section);
      }
    },
    [isExploreMode, sectionId, setActiveSection]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isExploreMode) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const section = findSection(sectionId);
        if (section) {
          setActiveSection(section);
        }
      }
    },
    [isExploreMode, sectionId, setActiveSection]
  );

  const isViewed = hasViewed(sectionId);
  const isActive = activeSection?.id === sectionId;

  // When not in explore mode, just render children normally
  if (!isExploreMode) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all duration-300',
        // Blue-to-black shadow on hover
        'hover:shadow-[0_4px_20px_rgba(59,130,246,0.4),0_8px_30px_rgba(0,0,0,0.3)]',
        // Subtle ring to indicate it's clickable
        'hover:ring-2 hover:ring-blue-400/50 hover:ring-offset-2 hover:ring-offset-white',
        // Active state - solid ring
        isActive && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg shadow-blue-500/20',
        'rounded-lg',
        fullWidth && 'w-full',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Learn about this feature`}
      data-section-id={sectionId}
    >
      {/* Lightbulb indicator */}
      <div
        className={cn(
          'absolute -top-2 -right-2 z-10',
          'flex items-center justify-center',
          'w-7 h-7 rounded-full',
          isActive
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 scale-110'
            : 'bg-gradient-to-br from-blue-500 to-blue-600',
          'shadow-lg shadow-blue-500/30',
          'transition-all duration-300',
          'hover:scale-110 hover:shadow-blue-500/50',
          // Pulse animation for unviewed demos
          !isViewed && !isActive && 'animate-pulse'
        )}
      >
        <Lightbulb
          className={cn(
            'w-4 h-4',
            isViewed || isActive ? 'text-blue-100' : 'text-white'
          )}
          fill={isViewed || isActive ? 'currentColor' : 'none'}
        />
      </div>

      {/* Overlay to capture clicks */}
      <div className="absolute inset-0 z-[5] rounded-lg" />

      {/* Original content */}
      <div className="pointer-events-none">{children}</div>
    </div>
  );
});

export default DemoCard;
