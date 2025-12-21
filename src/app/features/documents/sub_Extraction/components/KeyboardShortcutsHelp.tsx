'use client';

import React, { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutItem {
  keys: string[];
  description: string;
}

const shortcuts: ShortcutItem[] = [
  { keys: ['↑', 'k'], description: 'Previous field' },
  { keys: ['↓', 'j'], description: 'Next field' },
  { keys: ['Enter'], description: 'Toggle verified status' },
  { keys: ['E'], description: 'Edit field value' },
  { keys: ['Esc'], description: 'Cancel edit / Close help' },
  { keys: ['?'], description: 'Show this help' },
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  className,
}: KeyboardShortcutsHelpProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'w-80 rounded-lg border border-zinc-200 bg-white shadow-xl',
        'animate-in fade-in slide-in-from-bottom-4 duration-200',
        className
      )}
      role="dialog"
      aria-label="Keyboard shortcuts"
      data-testid="keyboard-shortcuts-help"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Keyboard Shortcuts</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Close shortcuts help"
          data-testid="close-shortcuts-help-btn"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Shortcuts List */}
      <div className="p-3">
        <ul className="space-y-2" data-testid="shortcuts-list">
          {shortcuts.map((shortcut, index) => (
            <li
              key={index}
              className="flex items-center justify-between text-sm"
              data-testid={`shortcut-item-${index}`}
            >
              <span className="text-zinc-600">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <React.Fragment key={keyIndex}>
                    {keyIndex > 0 && <span className="text-zinc-400 text-xs">or</span>}
                    <kbd
                      className={cn(
                        'inline-flex h-6 min-w-[24px] items-center justify-center rounded',
                        'bg-zinc-100 px-1.5 text-xs font-medium text-zinc-700',
                        'border border-zinc-200 shadow-sm'
                      )}
                    >
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer hint */}
      <div className="border-t border-zinc-100 px-4 py-2">
        <p className="text-xs text-zinc-400">
          Press <kbd className="mx-1 rounded bg-zinc-100 px-1 py-0.5 text-zinc-600 border border-zinc-200">?</kbd>
          anytime to toggle this help
        </p>
      </div>
    </div>
  );
}
