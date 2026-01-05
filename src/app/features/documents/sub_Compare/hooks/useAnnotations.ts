'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Annotation, Comment, Mention, ReviewStatus, AnnotationsMap, AnnotationSummary, User, ThreadResolutionStatus } from '../lib/types';
import { generateId, currentUser, mockAnnotations, mockUsers } from '../lib/mock-data';

interface UseAnnotationsOptions {
  initialAnnotations?: Annotation[];
}

interface UseAnnotationsReturn {
  annotations: AnnotationsMap;
  users: User[];
  currentUserId: string;
  currentUser: User;
  getAnnotation: (changeId: string) => Annotation | undefined;
  createAnnotation: (changeId: string, categoryName: string) => Annotation;
  updateReviewStatus: (changeId: string, status: ReviewStatus) => void;
  addComment: (changeId: string, content: string, mentions: Mention[]) => void;
  editComment: (changeId: string, commentId: string, newContent: string, mentions: Mention[]) => void;
  deleteComment: (changeId: string, commentId: string) => void;
  getAnnotationsForCategory: (categoryName: string) => Annotation[];
  resolveThread: (changeId: string) => void;
  reopenThread: (changeId: string) => void;
  canMarkAsReviewed: () => boolean;
  summary: AnnotationSummary;
}

export function useAnnotations(options: UseAnnotationsOptions = {}): UseAnnotationsReturn {
  const { initialAnnotations = mockAnnotations } = options;

  // Convert initial annotations to a Map
  const initialMap = useMemo(() => {
    const map = new Map<string, Annotation>();
    initialAnnotations.forEach((annotation) => {
      map.set(annotation.changeId, annotation);
    });
    return map;
  }, [initialAnnotations]);

  const [annotationsMap, setAnnotationsMap] = useState<Map<string, Annotation>>(initialMap);

  // Get a specific annotation by change ID
  const getAnnotation = useCallback((changeId: string): Annotation | undefined => {
    return annotationsMap.get(changeId);
  }, [annotationsMap]);

  // Create a new annotation if it doesn't exist
  const createAnnotation = useCallback((changeId: string, categoryName: string): Annotation => {
    const existing = annotationsMap.get(changeId);
    if (existing) return existing;

    const newAnnotation: Annotation = {
      id: generateId(),
      changeId,
      categoryName,
      reviewStatus: 'pending',
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser,
      resolution: {
        status: 'open',
      },
    };

    setAnnotationsMap((prev) => {
      const next = new Map(prev);
      next.set(changeId, newAnnotation);
      return next;
    });

    return newAnnotation;
  }, [annotationsMap]);

  // Update review status
  const updateReviewStatus = useCallback((changeId: string, status: ReviewStatus) => {
    setAnnotationsMap((prev) => {
      const annotation = prev.get(changeId);
      if (!annotation) return prev;

      const next = new Map(prev);
      next.set(changeId, {
        ...annotation,
        reviewStatus: status,
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
  }, []);

  // Add a comment to an annotation
  const addComment = useCallback((changeId: string, content: string, mentions: Mention[]) => {
    const newComment: Comment = {
      id: generateId(),
      authorId: currentUser.id,
      author: currentUser,
      content,
      mentions,
      createdAt: new Date().toISOString(),
      isEdited: false,
    };

    setAnnotationsMap((prev) => {
      const annotation = prev.get(changeId);
      if (!annotation) return prev;

      const next = new Map(prev);
      next.set(changeId, {
        ...annotation,
        comments: [...annotation.comments, newComment],
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
  }, []);

  // Edit an existing comment
  const editComment = useCallback((changeId: string, commentId: string, newContent: string, mentions: Mention[]) => {
    setAnnotationsMap((prev) => {
      const annotation = prev.get(changeId);
      if (!annotation) return prev;

      const next = new Map(prev);
      next.set(changeId, {
        ...annotation,
        comments: annotation.comments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                content: newContent,
                mentions,
                updatedAt: new Date().toISOString(),
                isEdited: true,
              }
            : comment
        ),
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
  }, []);

  // Delete a comment
  const deleteComment = useCallback((changeId: string, commentId: string) => {
    setAnnotationsMap((prev) => {
      const annotation = prev.get(changeId);
      if (!annotation) return prev;

      const next = new Map(prev);
      next.set(changeId, {
        ...annotation,
        comments: annotation.comments.filter((comment) => comment.id !== commentId),
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
  }, []);

  // Get all annotations for a specific category
  const getAnnotationsForCategory = useCallback((categoryName: string): Annotation[] => {
    return Array.from(annotationsMap.values()).filter(
      (annotation) => annotation.categoryName === categoryName
    );
  }, [annotationsMap]);

  // Resolve a thread
  const resolveThread = useCallback((changeId: string) => {
    setAnnotationsMap((prev) => {
      const annotation = prev.get(changeId);
      if (!annotation) return prev;

      const next = new Map(prev);
      next.set(changeId, {
        ...annotation,
        resolution: {
          ...annotation.resolution,
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUser,
        },
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
  }, []);

  // Reopen a resolved thread
  const reopenThread = useCallback((changeId: string) => {
    setAnnotationsMap((prev) => {
      const annotation = prev.get(changeId);
      if (!annotation) return prev;

      const next = new Map(prev);
      next.set(changeId, {
        ...annotation,
        resolution: {
          ...annotation.resolution,
          status: 'open',
          reopenedAt: new Date().toISOString(),
          reopenedBy: currentUser,
        },
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
  }, []);

  // Calculate summary statistics
  const summary = useMemo((): AnnotationSummary => {
    const annotations = Array.from(annotationsMap.values());
    const byStatus: Record<ReviewStatus, number> = {
      pending: 0,
      reviewed: 0,
      flagged: 0,
      requires_legal: 0,
    };

    let withComments = 0;
    let withMentions = 0;
    let resolved = 0;
    let unresolved = 0;

    annotations.forEach((annotation) => {
      byStatus[annotation.reviewStatus]++;
      if (annotation.comments.length > 0) {
        withComments++;
        if (annotation.comments.some((c) => c.mentions.length > 0)) {
          withMentions++;
        }
      }
      // Count resolution status
      if (annotation.resolution?.status === 'resolved') {
        resolved++;
      } else {
        unresolved++;
      }
    });

    // All threads are resolved only if there are annotations with comments and none are unresolved
    const threadsWithComments = annotations.filter(a => a.comments.length > 0);
    const allThreadsResolved = threadsWithComments.length === 0 ||
      threadsWithComments.every(a => a.resolution?.status === 'resolved');

    return {
      total: annotations.length,
      byStatus,
      withComments,
      withMentions,
      resolved,
      unresolved,
      allThreadsResolved,
    };
  }, [annotationsMap]);

  // Check if all threads are resolved (required before marking as "Reviewed")
  const canMarkAsReviewed = useCallback((): boolean => {
    return summary.allThreadsResolved;
  }, [summary.allThreadsResolved]);

  return {
    annotations: annotationsMap,
    users: mockUsers,
    currentUserId: currentUser.id,
    currentUser,
    getAnnotation,
    createAnnotation,
    updateReviewStatus,
    addComment,
    editComment,
    deleteComment,
    getAnnotationsForCategory,
    resolveThread,
    reopenThread,
    canMarkAsReviewed,
    summary,
  };
}

export type { UseAnnotationsReturn };
