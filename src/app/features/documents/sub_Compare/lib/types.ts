// Annotation and Comment Types for Document Comparison

// Change type for document comparison - single source of truth
export type ChangeType = 'added' | 'removed' | 'modified';

export type ReviewStatus = 'pending' | 'reviewed' | 'flagged' | 'requires_legal';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

export interface Mention {
  userId: string;
  userName: string;
  startIndex: number;
  endIndex: number;
}

export interface Comment {
  id: string;
  authorId: string;
  author: User;
  content: string;
  mentions: Mention[];
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
}

export interface Annotation {
  id: string;
  changeId: string; // References ComparisonChange
  categoryName: string;
  reviewStatus: ReviewStatus;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  createdBy: User;
}

export interface AnnotationSummary {
  total: number;
  byStatus: Record<ReviewStatus, number>;
  withComments: number;
  withMentions: number;
}

// Maps changeId -> Annotation
export type AnnotationsMap = Map<string, Annotation>;

// Review status configuration
export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: 'check' | 'flag' | 'scale' | 'clock';
}> = {
  pending: {
    label: 'Pending Review',
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-100',
    borderColor: 'border-zinc-200',
    icon: 'clock',
  },
  reviewed: {
    label: 'Reviewed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    icon: 'check',
  },
  flagged: {
    label: 'Flagged for Discussion',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    icon: 'flag',
  },
  requires_legal: {
    label: 'Requires Legal Review',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    icon: 'scale',
  },
};
