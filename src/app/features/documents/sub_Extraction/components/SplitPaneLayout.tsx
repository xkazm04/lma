'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SplitPaneLayoutProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  minRightWidth?: number;
  className?: string;
  onToggleRight?: () => void;
  showRightPane?: boolean;
}

/**
 * Split pane layout with draggable resizer for side-by-side document preview.
 * Left pane contains extracted fields, right pane contains PDF preview.
 */
export const SplitPaneLayout = memo(function SplitPaneLayout({
  leftPane,
  rightPane,
  defaultLeftWidth = 55,
  minLeftWidth = 30,
  maxLeftWidth = 70,
  minRightWidth = 350,
  className,
  onToggleRight,
  showRightPane = true,
}: SplitPaneLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
  }, [leftWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaX = e.clientX - startXRef.current;
    const deltaPercent = (deltaX / containerWidth) * 100;
    const newLeftWidth = startWidthRef.current + deltaPercent;

    // Calculate minimum right width as percentage
    const minRightPercent = (minRightWidth / containerWidth) * 100;

    // Clamp between min/max values
    const clampedWidth = Math.max(
      minLeftWidth,
      Math.min(maxLeftWidth, Math.min(newLeftWidth, 100 - minRightPercent))
    );

    setLeftWidth(clampedWidth);
  }, [isDragging, minLeftWidth, maxLeftWidth, minRightWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full', className)}
      data-testid="split-pane-layout"
    >
      {/* Left pane - Extracted fields */}
      <div
        className={cn(
          'flex flex-col overflow-hidden transition-all duration-200',
          !showRightPane && 'flex-1'
        )}
        style={{
          width: showRightPane ? `${leftWidth}%` : '100%',
        }}
        data-testid="split-pane-left"
      >
        {leftPane}
      </div>

      {/* Resizer handle */}
      {showRightPane && (
        <div
          className={cn(
            'relative w-1.5 bg-zinc-200 hover:bg-zinc-300 cursor-col-resize flex-shrink-0',
            'flex items-center justify-center transition-colors',
            isDragging && 'bg-indigo-400'
          )}
          onMouseDown={handleMouseDown}
          data-testid="split-pane-resizer"
        >
          <div
            className={cn(
              'absolute inset-y-0 w-4 -left-1.5 z-10 cursor-col-resize',
              'flex items-center justify-center'
            )}
          >
            <GripVertical
              className={cn(
                'w-4 h-6 text-zinc-400 transition-colors',
                isDragging && 'text-indigo-600'
              )}
            />
          </div>
        </div>
      )}

      {/* Right pane - PDF preview */}
      {showRightPane && (
        <div
          className="flex-1 flex flex-col overflow-hidden min-w-[350px]"
          data-testid="split-pane-right"
        >
          {rightPane}
        </div>
      )}

      {/* Toggle button for showing/hiding right pane */}
      {onToggleRight && !showRightPane && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleRight}
          className="fixed bottom-24 right-6 shadow-lg z-10"
          data-testid="show-pdf-preview-btn"
        >
          <PanelLeft className="w-4 h-4 mr-2" />
          Show Document
        </Button>
      )}

      {/* Toggle button visible when right pane is shown */}
      {onToggleRight && showRightPane && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRight}
          className="absolute top-4 right-4 z-20 h-8 w-8 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white"
          data-testid="hide-pdf-preview-btn"
          title="Hide document preview"
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
});
