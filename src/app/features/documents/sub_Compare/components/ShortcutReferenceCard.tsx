'use client';

import React, { memo, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ShortcutDefinition, ShortcutCategory } from '../hooks/useKeyboardShortcuts';
import { SHORTCUT_CATEGORY_LABELS } from '../hooks/useKeyboardShortcuts';

interface ShortcutReferenceCardProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutDefinition[];
  getShortcutsByCategory: (category: ShortcutCategory) => ShortcutDefinition[];
}

interface ShortcutRowProps {
  shortcut: ShortcutDefinition;
}

const ShortcutRow = memo(function ShortcutRow({ shortcut }: ShortcutRowProps) {
  return (
    <div
      className="flex items-center justify-between py-1.5 group"
      data-testid={`shortcut-row-${shortcut.key}`}
    >
      <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">
        {shortcut.description}
      </span>
      <kbd
        className={cn(
          'px-2 py-0.5 text-xs font-mono font-semibold rounded',
          'bg-zinc-100 text-zinc-700 border border-zinc-300',
          'shadow-sm min-w-[24px] text-center'
        )}
        data-testid={`shortcut-key-${shortcut.key}`}
      >
        {shortcut.displayKey}
      </kbd>
    </div>
  );
});

interface ShortcutSectionProps {
  category: ShortcutCategory;
  shortcuts: ShortcutDefinition[];
}

const ShortcutSection = memo(function ShortcutSection({ category, shortcuts }: ShortcutSectionProps) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="space-y-2" data-testid={`shortcut-section-${category}`}>
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {SHORTCUT_CATEGORY_LABELS[category]}
      </h3>
      <div className="space-y-0.5">
        {shortcuts.map((shortcut, idx) => (
          <ShortcutRow
            key={`${shortcut.key}-${shortcut.shift ? 'shift' : 'normal'}-${idx}`}
            shortcut={shortcut}
          />
        ))}
      </div>
    </div>
  );
});

export const ShortcutReferenceCard = memo(function ShortcutReferenceCard({
  isOpen,
  onClose,
  shortcuts,
  getShortcutsByCategory,
}: ShortcutReferenceCardProps) {
  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: ShortcutCategory[] = ['navigation', 'actions', 'filters', 'panels'];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-50 animate-in fade-in duration-200"
        onClick={onClose}
        data-testid="shortcut-reference-backdrop"
      />

      {/* Card */}
      <Card
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg z-50 shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
        data-testid="shortcut-reference-card"
      >
        <CardHeader className="pb-3 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Keyboard className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Navigate and review faster with keyboard shortcuts
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              data-testid="close-shortcut-reference-btn"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Left column: Navigation and Actions */}
            <div className="space-y-5">
              <ShortcutSection
                category="navigation"
                shortcuts={getShortcutsByCategory('navigation')}
              />
              <Separator />
              <ShortcutSection
                category="actions"
                shortcuts={getShortcutsByCategory('actions')}
              />
            </div>

            {/* Right column: Filters and Panels */}
            <div className="space-y-5">
              <ShortcutSection
                category="filters"
                shortcuts={getShortcutsByCategory('filters')}
              />
              <Separator />
              <ShortcutSection
                category="panels"
                shortcuts={getShortcutsByCategory('panels')}
              />
            </div>
          </div>

          {/* Footer tip */}
          <div className="mt-6 pt-4 border-t border-zinc-200 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 rounded border border-zinc-300">?</kbd> anytime to show this reference
            </p>
            <Badge variant="secondary" className="text-xs">
              Vim-style navigation
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
});

/**
 * Inline shortcut hint badge - shows next to buttons/controls
 */
interface ShortcutHintProps {
  shortcutKey: string;
  className?: string;
  /** Whether to show the hint (controlled by global config) */
  show?: boolean;
}

export const ShortcutHint = memo(function ShortcutHint({
  shortcutKey,
  className,
  show = true,
}: ShortcutHintProps) {
  if (!show) return null;

  return (
    <kbd
      className={cn(
        'ml-1.5 px-1 py-0.5 text-[10px] font-mono font-medium rounded',
        'bg-zinc-800/10 text-zinc-500 border border-zinc-300/50',
        'hidden md:inline-block',
        className
      )}
      title={`Keyboard shortcut: ${shortcutKey}`}
      data-testid={`shortcut-hint-${shortcutKey.toLowerCase()}`}
    >
      {shortcutKey}
    </kbd>
  );
});

/**
 * Floating shortcut hint for navigation
 */
interface FloatingNavigationHintProps {
  show: boolean;
  currentIndex: number;
  totalCount: number;
}

export const FloatingNavigationHint = memo(function FloatingNavigationHint({
  show,
  currentIndex,
  totalCount,
}: FloatingNavigationHintProps) {
  if (!show || totalCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'bg-zinc-900 text-white rounded-lg shadow-xl',
        'px-4 py-3 space-y-2',
        'animate-in fade-in slide-in-from-bottom-4 duration-300'
      )}
      data-testid="floating-navigation-hint"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          Change {currentIndex + 1} of {totalCount}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">J</kbd>
          Next
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">K</kbd>
          Previous
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">?</kbd>
          More
        </span>
      </div>
    </div>
  );
});
