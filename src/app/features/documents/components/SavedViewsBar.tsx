'use client';

import React, { memo, useRef, useState, useEffect } from 'react';
import {
  Files,
  Eye,
  AlertTriangle,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSavedViewsStore } from '../lib/saved-views-store';
import type { SavedView } from '../lib/types';

interface SavedViewsBarProps {
  onViewSelect: (view: SavedView) => void;
  onSaveCurrentFilters: () => void;
}

function ViewIcon({ iconName, className }: { iconName?: string; className?: string }) {
  switch (iconName) {
    case 'files':
      return <Files className={className} />;
    case 'eye':
      return <Eye className={className} />;
    case 'alert-triangle':
      return <AlertTriangle className={className} />;
    case 'file-text':
    default:
      return <FileText className={className} />;
  }
}

export const SavedViewsBar = memo(function SavedViewsBar({
  onViewSelect,
  onSaveCurrentFilters,
}: SavedViewsBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const {
    views,
    activeViewId,
    setActiveView,
  } = useSavedViewsStore();

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [views]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleViewClick = (view: SavedView) => {
    setActiveView(view.id);
    onViewSelect(view);
  };

  return (
    <div className="relative flex items-center h-10 bg-zinc-50 border-b border-zinc-200 px-2">
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-zinc-50 via-zinc-50 to-transparent"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-500" />
        </button>
      )}

      {/* Scrollable view pills */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {views.map((view) => {
          const isActive = activeViewId === view.id;
          return (
            <button
              key={view.id}
              onClick={() => handleViewClick(view)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              )}
              data-testid={`saved-view-${view.id}`}
            >
              <ViewIcon iconName={view.icon} className="w-3 h-3" />
              <span>{view.name}</span>
              {view.isDefault && (
                <Star className={cn('w-2.5 h-2.5', isActive ? 'text-amber-300' : 'text-amber-500')} fill="currentColor" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right scroll arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-16 z-10 h-full px-1 bg-gradient-to-l from-zinc-50 via-zinc-50 to-transparent"
        >
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>
      )}

      {/* Save button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSaveCurrentFilters}
        className="ml-2 h-7 text-xs text-zinc-500 hover:text-zinc-700 flex-shrink-0"
        data-testid="save-view-btn"
      >
        <Plus className="w-3 h-3 mr-1" />
        Save
      </Button>
    </div>
  );
});
