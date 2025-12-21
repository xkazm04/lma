'use client';

import React, { memo } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotkeysPanelProps {
  isOpen: boolean;
  onClose: () => void;
  hasSelectedTerm: boolean;
}

interface HotkeyRowProps {
  keys: string[];
  description: string;
  disabled?: boolean;
  category?: string;
}

function HotkeyRow({ keys, description, disabled, category }: HotkeyRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <span className={`text-sm ${disabled ? 'text-zinc-400' : 'text-zinc-700'}`}>
        {description}
        {disabled && (
          <span className="text-xs text-zinc-400 ml-1">(select term)</span>
        )}
      </span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            {index > 0 && <span className="text-zinc-400 mx-0.5">+</span>}
            <kbd
              className={`px-2 py-1 text-xs font-mono rounded border ${
                disabled
                  ? 'bg-zinc-100 border-zinc-200 text-zinc-400'
                  : 'bg-white border-zinc-300 text-zinc-700 shadow-sm'
              }`}
            >
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export const HotkeysPanel = memo(function HotkeysPanel({
  isOpen,
  onClose,
  hasSelectedTerm,
}: HotkeysPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotkeys-title"
      data-testid="hotkeys-panel"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-zinc-600" aria-hidden="true" />
            <h2 id="hotkeys-title" className="text-lg font-semibold">
              Keyboard Shortcuts
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="close-hotkeys-btn"
            aria-label="Close keyboard shortcuts"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* War Room Actions */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              War Room Actions
            </h3>
            <div className="divide-y divide-zinc-100">
              <HotkeyRow
                keys={['N']}
                description="New proposal"
                disabled={!hasSelectedTerm}
              />
              <HotkeyRow
                keys={['C']}
                description="Add comment"
                disabled={!hasSelectedTerm}
              />
              <HotkeyRow
                keys={['A']}
                description="Accept term"
                disabled={!hasSelectedTerm}
              />
              <HotkeyRow keys={['F']} description="Toggle focus mode" />
              <HotkeyRow keys={['T']} description="Toggle timeline view" />
              <HotkeyRow keys={['Shift', 'S']} description="Screen share" />
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Navigation
            </h3>
            <div className="divide-y divide-zinc-100">
              <HotkeyRow keys={['↑', '↓']} description="Navigate between terms" />
              <HotkeyRow keys={['Tab']} description="Jump to next category" />
              <HotkeyRow keys={['Shift', 'Tab']} description="Jump to previous category" />
              <HotkeyRow keys={['Enter']} description="Open term detail" />
              <HotkeyRow keys={['←', '→']} description="Collapse/expand category" />
              <HotkeyRow keys={['Home']} description="Go to first term" />
              <HotkeyRow keys={['End']} description="Go to last term" />
              <HotkeyRow keys={['Esc']} description="Clear selection" />
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-zinc-50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Pro Tips
            </h3>
            <ul className="text-sm text-zinc-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Use <strong>Focus Mode</strong> (F) to dim resolved terms and
                  highlight what needs attention
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Press <strong>T</strong> to open the Timeline and see the
                  back-and-forth on contentious terms
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Watch the <strong>Live Presence</strong> panel to see when
                  counterparties are drafting proposals
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50 rounded-b-xl">
          <p className="text-xs text-zinc-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-xs">?</kbd> anytime to show this panel
          </p>
        </div>
      </div>
    </div>
  );
});
