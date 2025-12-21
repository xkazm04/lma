'use client';

import React, { memo } from 'react';
import { X, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Annotation, User, Mention, ReviewStatus } from '../lib/types';
import { ReviewStatusDropdown } from './ReviewStatusDropdown';
import { CommentThread } from './CommentThread';

interface AnnotationPanelProps {
  annotation: Annotation | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  users: User[];
  changeField: string;
  changeImpact: string;
  onStatusChange: (status: ReviewStatus) => void;
  onAddComment: (content: string, mentions: Mention[]) => void;
  onEditComment: (commentId: string, newContent: string, mentions: Mention[]) => void;
  onDeleteComment: (commentId: string) => void;
}

export const AnnotationPanel = memo(function AnnotationPanel({
  annotation,
  isOpen,
  onClose,
  currentUserId,
  users,
  changeField,
  changeImpact,
  onStatusChange,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: AnnotationPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-zinc-200 shadow-xl z-40',
        'transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
      data-testid="annotation-panel"
    >
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 65px)' }}>
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

        {/* Review Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">Review Status</span>
          <ReviewStatusDropdown
            currentStatus={annotation?.reviewStatus || 'pending'}
            onStatusChange={onStatusChange}
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
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
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
