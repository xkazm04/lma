'use client';

import React, { memo, useEffect, useRef, useCallback, useState } from 'react';
import { X, Volume2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoGuideStore } from '../store';

/**
 * DemoPopup - Top-center popup for displaying demo explanations
 *
 * Appears when a DemoCard is clicked in explore mode.
 * - Slides in from above the viewport
 * - Slides out to above the viewport on close
 * - No overlay - page content remains visible and interactive
 * - Autoplays audio if audioSrc is provided
 */
export const DemoPopup = memo(function DemoPopup() {
  const { activeDemo, hideDemo, isExploreMode } = useDemoGuideStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle show/hide with animation
  useEffect(() => {
    if (activeDemo && isExploreMode) {
      // Small delay to ensure the element is mounted before animating
      requestAnimationFrame(() => {
        setIsVisible(true);
        setIsClosing(false);
      });
    }
  }, [activeDemo, isExploreMode]);

  // Handle audio autoplay
  useEffect(() => {
    if (activeDemo?.audioSrc && audioRef.current && isVisible) {
      audioRef.current.play().catch((error) => {
        console.log('Audio autoplay blocked:', error);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [activeDemo, isVisible]);

  // Close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Wait for animation to complete before actually hiding
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      hideDemo();
    }, 250); // Match the transition duration
  }, [hideDemo]);

  // Handle click outside to close
  useEffect(() => {
    if (!activeDemo || !isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Delay adding listeners to avoid immediate close from the triggering click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activeDemo, isVisible, handleClose]);

  const toggleAudio = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, []);

  // Don't render if no active demo or not in explore mode
  if (!activeDemo || !isExploreMode) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      className={cn(
        'fixed left-1/2 z-[101]',
        'w-full max-w-xl',
        'mx-4 -translate-x-1/2',
        'bg-white rounded-2xl',
        'shadow-[0_8px_40px_rgba(0,0,0,0.15),0_4px_20px_rgba(0,0,0,0.1)]',
        'border border-zinc-200',
        'transition-all duration-250 ease-out',
        // Animation states
        isVisible && !isClosing
          ? 'top-6 opacity-100'
          : '-top-[400px] opacity-0'
      )}
      style={{
        transitionProperty: 'top, opacity',
        transitionDuration: '250ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      role="dialog"
      aria-modal="false"
      aria-labelledby="demo-popup-title"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-5 pb-3 border-b border-zinc-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2
            id="demo-popup-title"
            className="text-lg font-semibold text-zinc-900"
          >
            {activeDemo.title}
          </h2>
          {activeDemo.category && (
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              {activeDemo.category}
            </span>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-2 -m-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-zinc-600 leading-relaxed">{activeDemo.description}</p>
      </div>

      {/* Audio controls (if audio is present) */}
      {activeDemo.audioSrc && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <button
              onClick={toggleAudio}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              aria-label="Toggle audio"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <audio
                ref={audioRef}
                src={activeDemo.audioSrc}
                className="w-full h-8"
                controls
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="px-5 pb-4">
        <p className="text-xs text-zinc-400 text-center">
          Click outside or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
});

export default DemoPopup;
