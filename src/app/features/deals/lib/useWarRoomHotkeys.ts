'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface WarRoomHotkeyActions {
  onNewProposal: () => void;
  onAddComment: () => void;
  onAcceptTerm: () => void;
  onToggleFocusMode: () => void;
  onToggleTimeline: () => void;
  onToggleScreenShare: () => void;
}

interface UseWarRoomHotkeysOptions {
  enabled: boolean;
  actions: WarRoomHotkeyActions;
  selectedTerm: string | null;
}

export function useWarRoomHotkeys({
  enabled,
  actions,
  selectedTerm,
}: UseWarRoomHotkeysOptions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger hotkeys when typing in inputs
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputElement) return;

      // Also don't trigger if modifier keys (except shift) are pressed
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      switch (event.key.toLowerCase()) {
        case 'n':
          // N for New Proposal
          if (selectedTerm) {
            event.preventDefault();
            actionsRef.current.onNewProposal();
          }
          break;
        case 'c':
          // C for Comment
          if (selectedTerm) {
            event.preventDefault();
            actionsRef.current.onAddComment();
          }
          break;
        case 'a':
          // A for Accept
          if (selectedTerm) {
            event.preventDefault();
            actionsRef.current.onAcceptTerm();
          }
          break;
        case 'f':
          // F for Focus Mode
          event.preventDefault();
          actionsRef.current.onToggleFocusMode();
          break;
        case 't':
          // T for Timeline
          event.preventDefault();
          actionsRef.current.onToggleTimeline();
          break;
        case 's':
          // S for Screen Share (only with Shift)
          if (event.shiftKey) {
            event.preventDefault();
            actionsRef.current.onToggleScreenShare();
          }
          break;
      }
    },
    [enabled, selectedTerm]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    hotkeys: [
      { key: 'N', label: 'New Proposal', requiresTerm: true },
      { key: 'C', label: 'Comment', requiresTerm: true },
      { key: 'A', label: 'Accept', requiresTerm: true },
      { key: 'F', label: 'Focus Mode', requiresTerm: false },
      { key: 'T', label: 'Timeline', requiresTerm: false },
      { key: 'Shift+S', label: 'Screen Share', requiresTerm: false },
    ],
  };
}
