'use client';

import React, { memo } from 'react';
import { MessageSquare, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Annotation, ReviewStatus } from '../lib/types';
import { ReviewStatusBadge } from './ReviewStatusBadge';

interface ChangeAnnotationButtonProps {
  annotation: Annotation | null;
  onClick: () => void;
  className?: string;
}

export const ChangeAnnotationButton = memo(function ChangeAnnotationButton({
  annotation,
  onClick,
  className,
}: ChangeAnnotationButtonProps) {
  const hasAnnotation = annotation !== null;
  const commentCount = annotation?.comments.length || 0;
  const status = annotation?.reviewStatus || 'pending';
  const isDefaultStatus = status === 'pending' && commentCount === 0;

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Show review status badge if not default */}
        {!isDefaultStatus && (
          <ReviewStatusBadge status={status} size="sm" showLabel={false} />
        )}

        {/* Comment button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClick}
              className={cn(
                'h-7 gap-1.5 transition-all',
                hasAnnotation && commentCount > 0
                  ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                  : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
              )}
              data-testid="change-annotation-btn"
            >
              {hasAnnotation && commentCount > 0 ? (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-medium">{commentCount}</span>
                </>
              ) : (
                <MessageSquarePlus className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasAnnotation && commentCount > 0
              ? `${commentCount} comment${commentCount !== 1 ? 's' : ''} - Click to view`
              : 'Add annotation'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

// Summary component to show annotation stats for a category
interface AnnotationSummaryBadgeProps {
  annotations: Annotation[];
  className?: string;
}

export const AnnotationSummaryBadge = memo(function AnnotationSummaryBadge({
  annotations,
  className,
}: AnnotationSummaryBadgeProps) {
  if (annotations.length === 0) return null;

  const totalComments = annotations.reduce((sum, a) => sum + a.comments.length, 0);
  const statusCounts: Record<ReviewStatus, number> = {
    pending: 0,
    reviewed: 0,
    flagged: 0,
    requires_legal: 0,
  };

  annotations.forEach((a) => {
    statusCounts[a.reviewStatus]++;
  });

  // Only show if there's something interesting
  const hasNonPending = statusCounts.reviewed > 0 || statusCounts.flagged > 0 || statusCounts.requires_legal > 0;
  const hasComments = totalComments > 0;

  if (!hasNonPending && !hasComments) return null;

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid="annotation-summary-badge">
      {hasComments && (
        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
          <MessageSquare className="w-3 h-3" />
          {totalComments}
        </span>
      )}
      {statusCounts.reviewed > 0 && (
        <ReviewStatusBadge status="reviewed" size="sm" showLabel={false} />
      )}
      {statusCounts.flagged > 0 && (
        <ReviewStatusBadge status="flagged" size="sm" showLabel={false} />
      )}
      {statusCounts.requires_legal > 0 && (
        <ReviewStatusBadge status="requires_legal" size="sm" showLabel={false} />
      )}
    </div>
  );
});
