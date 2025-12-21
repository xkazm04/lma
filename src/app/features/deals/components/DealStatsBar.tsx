'use client';

import React, { memo, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type DealStatus = 'all' | 'draft' | 'active' | 'paused' | 'agreed' | 'closed';

interface DealStatsBarProps {
  statusCounts: {
    all: number;
    draft: number;
    active: number;
    paused: number;
    agreed: number;
    closed: number;
  };
  activeStatus?: string;
  onStatusClick?: (status: DealStatus) => void;
  /** ID of the element to skip to when using skip link (defaults to main content) */
  skipToId?: string;
}

interface StatCardProps {
  status: DealStatus;
  count: number;
  label: string;
  baseClassName: string;
  textClassName: string;
  isActive: boolean;
  activeRingClassName: string;
  onClick?: (status: DealStatus) => void;
  testId: string;
  /** Index of this card in the group for arrow key navigation */
  index: number;
  /** Total number of cards for arrow key navigation */
  totalCards: number;
  /** Callback to focus a specific card by index */
  onFocusCard: (index: number) => void;
  /** Ref callback for registering card element */
  registerRef: (index: number, el: HTMLDivElement | null) => void;
}

const StatCard = memo(function StatCard({
  status,
  count,
  label,
  baseClassName,
  textClassName,
  isActive,
  activeRingClassName,
  onClick,
  testId,
  index,
  totalCards,
  onFocusCard,
  registerRef,
}: StatCardProps) {
  const handleClick = useCallback(() => {
    onClick?.(status);
  }, [onClick, status]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle Enter/Space for activation
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation(); // Prevent Space from scrolling the page
      onClick?.(status);
      return;
    }

    // Arrow key navigation within the stats bar group
    let targetIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
        targetIndex = (index + 1) % totalCards;
        break;
      case 'ArrowLeft':
        targetIndex = (index - 1 + totalCards) % totalCards;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = totalCards - 1;
        break;
      case 'Escape':
        // Move focus to after the stats bar (skip to next interactive element)
        (e.currentTarget as HTMLElement).blur();
        return;
    }

    if (targetIndex !== null) {
      e.preventDefault();
      e.stopPropagation();
      onFocusCard(targetIndex);
    }
  }, [onClick, status, index, totalCards, onFocusCard]);

  const setRef = useCallback((el: HTMLDivElement | null) => {
    registerRef(index, el);
  }, [registerRef, index]);

  return (
    <Card
      ref={setRef}
      className={cn(
        baseClassName,
        'min-w-[140px] aspect-[4/3] transition-all duration-200 cursor-pointer hover:bg-opacity-80',
        isActive && [activeRingClassName, 'shadow-md']
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isActive}
      aria-label={`Filter by ${label}: ${count} deals`}
      data-testid={testId}
    >
      <CardContent className="p-4 text-center h-full flex flex-col items-center justify-center">
        <p className={cn('text-2xl font-bold tabular-nums', textClassName)}>{count}</p>
        <p className={cn('text-xs', textClassName)}>{label}</p>
      </CardContent>
    </Card>
  );
});

export const DealStatsBar = memo(function DealStatsBar({
  statusCounts,
  activeStatus = 'all',
  onStatusClick,
  skipToId = 'deal-list-content',
}: DealStatsBarProps) {
  // Refs for all stat cards to enable arrow key navigation
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const registerRef = useCallback((index: number, el: HTMLDivElement | null) => {
    cardRefs.current[index] = el;
  }, []);

  const focusCard = useCallback((index: number) => {
    cardRefs.current[index]?.focus();
  }, []);

  const handleSkipLinkClick = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const skipTarget = document.getElementById(skipToId);
    if (skipTarget) {
      skipTarget.focus();
      skipTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [skipToId]);

  const handleSkipLinkKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleSkipLinkClick(e);
    }
  }, [handleSkipLinkClick]);

  const statCards: Array<{
    status: DealStatus;
    count: number;
    label: string;
    baseClassName: string;
    textClassName: string;
    activeRingClassName: string;
    testId: string;
  }> = [
    {
      status: 'all',
      count: statusCounts.all,
      label: 'Total Deals',
      baseClassName: 'bg-zinc-50',
      textClassName: 'text-zinc-900',
      activeRingClassName: 'ring-2 ring-zinc-400 ring-offset-2',
      testId: 'deal-stats-total',
    },
    {
      status: 'active',
      count: statusCounts.active,
      label: 'Active',
      baseClassName: 'bg-green-50',
      textClassName: 'text-green-600',
      activeRingClassName: 'ring-2 ring-green-500 ring-offset-2',
      testId: 'deal-stats-active',
    },
    {
      status: 'paused',
      count: statusCounts.paused,
      label: 'Paused',
      baseClassName: 'bg-amber-50',
      textClassName: 'text-amber-600',
      activeRingClassName: 'ring-2 ring-amber-500 ring-offset-2',
      testId: 'deal-stats-paused',
    },
    {
      status: 'agreed',
      count: statusCounts.agreed,
      label: 'Agreed',
      baseClassName: 'bg-blue-50',
      textClassName: 'text-blue-600',
      activeRingClassName: 'ring-2 ring-blue-500 ring-offset-2',
      testId: 'deal-stats-agreed',
    },
    {
      status: 'draft',
      count: statusCounts.draft,
      label: 'Drafts',
      baseClassName: 'bg-zinc-100',
      textClassName: 'text-zinc-600',
      activeRingClassName: 'ring-2 ring-zinc-400 ring-offset-2',
      testId: 'deal-stats-draft',
    },
  ];

  return (
    <div className="relative">
      {/* Skip link - visible only on focus for keyboard users */}
      <a
        href={`#${skipToId}`}
        onClick={handleSkipLinkClick}
        onKeyDown={handleSkipLinkKeyDown}
        className="sr-only focus:not-sr-only focus:absolute focus:-top-10 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-zinc-900 focus:text-white focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
        data-testid="deal-stats-skip-link"
      >
        Skip to deal list
      </a>

      <div
        className="grid grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-200"
        role="toolbar"
        aria-label="Deal status filters. Use arrow keys to navigate between filters, Enter or Space to select, Escape to exit."
      >
        {statCards.map((card, index) => (
          <StatCard
            key={card.status}
            status={card.status}
            count={card.count}
            label={card.label}
            baseClassName={card.baseClassName}
            textClassName={card.textClassName}
            isActive={activeStatus === card.status}
            activeRingClassName={card.activeRingClassName}
            onClick={onStatusClick}
            testId={card.testId}
            index={index}
            totalCards={statCards.length}
            onFocusCard={focusCard}
            registerRef={registerRef}
          />
        ))}
      </div>
    </div>
  );
});
