'use client';

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { X, MessageSquare, AlertTriangle, CheckCircle2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Annotation, User, Mention, ReviewStatus, AnnotationSummary } from '../lib/types';
import { ReviewStatusDropdown } from './ReviewStatusDropdown';
import { CommentThread } from './CommentThread';

const STORAGE_KEY = 'annotation-panel-width';
const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 280;
const MAX_WIDTH = 520;

interface AnnotationPanelProps {
  annotation: Annotation | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  users: User[];
  changeField: string;
  changeImpact: string;
  summary?: AnnotationSummary;
  canMarkAsReviewed?: boolean;
  onStatusChange: (status: ReviewStatus) => void;
  onAddComment: (content: string, mentions: Mention[]) => void;
  onEditComment: (commentId: string, newContent: string, mentions: Mention[]) => void;
  onDeleteComment: (commentId: string) => void;
  onResolveThread?: () => void;
  onReopenThread?: () => void;
}

export const AnnotationPanel = memo(function AnnotationPanel({
  annotation,
  isOpen,
  onClose,
  currentUserId,
  users,
  changeField,
  changeImpact,
  summary,
  canMarkAsReviewed,
  onStatusChange,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolveThread,
  onReopenThread,
}: AnnotationPanelProps) {
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          return parsed;
        }
      }
    }
    return DEFAULT_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Persist width to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, panelWidth.toString());
    }
  }, [panelWidth]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    // Calculate new width based on mouse position from right edge
    const newWidth = window.innerWidth - e.clientX;
    const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
    setPanelWidth(clampedWidth);
  }, [isResizing]);

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Set up and tear down resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Start resize on mouse down
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      style={{ width: `${panelWidth}px` }}
      className={cn(
        'fixed inset-y-0 right-0 bg-white border-l border-zinc-200 shadow-xl z-40',
        'transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
        isResizing && 'transition-none'
      )}
      data-testid="annotation-panel"
    >
      {/* Resize Handle */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-50',
          'flex items-center justify-center',
          'group hover:bg-blue-100/50 transition-colors',
          isResizing && 'bg-blue-200/50'
        )}
        onMouseDown={handleResizeStart}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        data-testid="annotation-panel-resize-handle"
      >
        {/* Visual affordance - grip dots that appear on hover */}
        <div
          className={cn(
            'flex flex-col items-center gap-0.5 transition-opacity duration-150',
            (isHoveringHandle || isResizing) ? 'opacity-100' : 'opacity-0'
          )}
          data-testid="annotation-panel-grip-indicator"
        >
          <GripVertical
            className={cn(
              'w-3 h-3 text-zinc-400',
              isResizing && 'text-blue-500'
            )}
          />
        </div>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-zinc-600" />
          <h2 className="text-lg font-semibold text-zinc-900">Change Annotations</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
          data-testid="close-annotation-panel-btn"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: 'calc(100vh - 65px)' }}>
        {/* Change Info Card */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Change Being Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-zinc-900 mb-2">{changeField}</h3>
            <div className="flex items-start gap-2 text-sm text-zinc-600">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{changeImpact}</p>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Summary */}
        {summary && summary.withComments > 0 && (
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border',
              summary.allThreadsResolved
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            )}
            data-testid="resolution-summary"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={cn(
                  'w-4 h-4',
                  summary.allThreadsResolved ? 'text-green-600' : 'text-amber-600'
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  summary.allThreadsResolved ? 'text-green-700' : 'text-amber-700'
                )}
              >
                Thread Resolution
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-700" data-testid="resolved-count">
                {summary.resolved} resolved
              </span>
              <span className="text-amber-700" data-testid="unresolved-count">
                {summary.unresolved} open
              </span>
            </div>
          </div>
        )}

        {/* Review Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">Review Status</span>
          <ReviewStatusDropdown
            currentStatus={annotation?.reviewStatus || 'pending'}
            onStatusChange={onStatusChange}
            canMarkAsReviewed={canMarkAsReviewed}
          />
        </div>

        <Separator />

        {/* Comments Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-zinc-700">Comments</h3>
            <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
              {annotation?.comments.length || 0}
            </span>
          </div>

          <CommentThread
            comments={annotation?.comments || []}
            currentUserId={currentUserId}
            users={users}
            resolution={annotation?.resolution}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            onResolve={onResolveThread}
            onReopen={onReopenThread}
          />
        </div>
      </div>
    </div>
  );
});

// Backdrop overlay when panel is open
export const AnnotationPanelBackdrop = memo(function AnnotationPanelBackdrop({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 z-30 transition-opacity"
      onClick={onClose}
      data-testid="annotation-panel-backdrop"
    />
  );
});
