'use client';

import React, { memo, useState } from 'react';
import {
  Focus,
  History,
  Monitor,
  MonitorOff,
  Keyboard,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';

interface WarRoomControlsProps {
  focusMode: boolean;
  showTimeline: boolean;
  showPresence: boolean;
  isScreenSharing: boolean;
  selectedTerm: string | null;
  onToggleFocusMode: () => void;
  onToggleTimeline: () => void;
  onTogglePresence: () => void;
  onToggleScreenShare: () => void;
  onShowHotkeys: () => void;
}

interface HotkeyBadgeProps {
  keys: string;
  label: string;
  requiresTerm?: boolean;
  hasSelectedTerm?: boolean;
}

function HotkeyBadge({
  keys,
  label,
  requiresTerm,
  hasSelectedTerm,
}: HotkeyBadgeProps) {
  const isDisabled = requiresTerm && !hasSelectedTerm;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded ${
              isDisabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-zinc-100 cursor-default'
            }`}
            data-testid={`hotkey-badge-${keys.toLowerCase().replace(/\+/g, '-')}`}
          >
            <kbd
              className={`px-1.5 py-0.5 text-xs font-mono rounded border ${
                isDisabled
                  ? 'bg-zinc-100 border-zinc-200 text-zinc-400'
                  : 'bg-white border-zinc-300 text-zinc-700'
              }`}
            >
              {keys}
            </kbd>
            <span
              className={`text-xs ${
                isDisabled ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isDisabled ? 'Select a term first' : `Press ${keys} to ${label}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const WarRoomControls = memo(function WarRoomControls({
  focusMode,
  showTimeline,
  showPresence,
  isScreenSharing,
  selectedTerm,
  onToggleFocusMode,
  onToggleTimeline,
  onTogglePresence,
  onToggleScreenShare,
  onShowHotkeys,
}: WarRoomControlsProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?view=shared`
      : '';

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleStartScreenShare = async () => {
    // Check if screen sharing is supported
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert('Screen sharing is not supported in your browser');
      return;
    }

    try {
      // Request screen share
      await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      onToggleScreenShare();
      setShowShareModal(false);
    } catch (err) {
      if ((err as DOMException).name !== 'NotAllowedError') {
        console.error('Screen share error:', err);
      }
    }
  };

  return (
    <>
      <div
        className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
        data-testid="war-room-controls"
        role="toolbar"
        aria-label="War room controls"
      >
        {/* Focus Mode Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={focusMode ? 'default' : 'ghost'}
                size="sm"
                onClick={onToggleFocusMode}
                className={`h-8 ${focusMode ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                data-testid="focus-mode-toggle"
                aria-pressed={focusMode}
                aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
              >
                <Focus className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Focus
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {focusMode
                  ? 'Exit focus mode (F)'
                  : 'Enter focus mode to highlight critical terms (F)'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Timeline Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showTimeline ? 'default' : 'ghost'}
                size="sm"
                onClick={onToggleTimeline}
                className="h-8"
                data-testid="timeline-toggle"
                aria-pressed={showTimeline}
                aria-label={showTimeline ? 'Hide timeline' : 'Show timeline'}
              >
                <History className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Timeline
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showTimeline ? 'Hide timeline (T)' : 'Show negotiation timeline (T)'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Presence Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showPresence ? 'default' : 'ghost'}
                size="sm"
                onClick={onTogglePresence}
                className="h-8"
                data-testid="presence-toggle"
                aria-pressed={showPresence}
                aria-label={showPresence ? 'Hide presence' : 'Show presence'}
              >
                {showPresence ? (
                  <Eye className="w-4 h-4 mr-1.5" aria-hidden="true" />
                ) : (
                  <EyeOff className="w-4 h-4 mr-1.5" aria-hidden="true" />
                )}
                Presence
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {showPresence
                  ? 'Hide live presence indicators'
                  : 'Show who is viewing what'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Screen Share */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isScreenSharing ? 'destructive' : 'outline'}
              size="sm"
              className="h-8"
              data-testid="screen-share-btn"
              aria-label={
                isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'
              }
            >
              {isScreenSharing ? (
                <>
                  <MonitorOff className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  Stop Sharing
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  Share
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setShowShareModal(true)}
              data-testid="share-screen-option"
            >
              <Monitor className="w-4 h-4 mr-2" aria-hidden="true" />
              Share your screen
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleCopyShareUrl}
              data-testid="copy-link-option"
            >
              <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
              Copy shareable link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                window.open(shareUrl, '_blank', 'noopener,noreferrer')
              }
              data-testid="open-new-window-option"
            >
              <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
              Open in new window
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Hotkeys Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowHotkeys}
                className="h-8"
                data-testid="hotkeys-btn"
                aria-label="Show keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Keyboard shortcuts</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Quick hotkey hints */}
        <div className="hidden lg:flex items-center gap-1 ml-2 border-l border-zinc-300 pl-3">
          <HotkeyBadge
            keys="N"
            label="Propose"
            requiresTerm
            hasSelectedTerm={!!selectedTerm}
          />
          <HotkeyBadge
            keys="C"
            label="Comment"
            requiresTerm
            hasSelectedTerm={!!selectedTerm}
          />
          <HotkeyBadge
            keys="A"
            label="Accept"
            requiresTerm
            hasSelectedTerm={!!selectedTerm}
          />
        </div>
      </div>

      {/* Screen Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowShareModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          data-testid="screen-share-modal"
        >
          <Card
            className="w-full max-w-md p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="share-modal-title" className="text-lg font-semibold">
                Share War Room View
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareModal(false)}
                data-testid="close-share-modal"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>

            <p className="text-sm text-zinc-600 mb-4">
              Share your war room view with stakeholders for collaborative
              review during calls.
            </p>

            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                onClick={handleStartScreenShare}
                data-testid="start-screen-share-btn"
              >
                <Monitor className="w-4 h-4 mr-2" aria-hidden="true" />
                Share entire screen
              </Button>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-zinc-50"
                  data-testid="share-url-input"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyShareUrl}
                  data-testid="copy-share-url-btn"
                  aria-label="Copy share URL"
                >
                  {shareUrlCopied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4" aria-hidden="true" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-zinc-500">
                Anyone with this link can view the current state of this
                negotiation.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* URL Copied Toast */}
      {shareUrlCopied && !showShareModal && (
        <div
          className="fixed bottom-4 right-4 bg-zinc-900 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4"
          role="status"
          aria-live="polite"
          data-testid="url-copied-toast"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" aria-hidden="true" />
            <span className="text-sm">Link copied to clipboard</span>
          </div>
        </div>
      )}
    </>
  );
});
