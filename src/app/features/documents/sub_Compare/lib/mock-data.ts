// Mock data for annotations system

import type { User, Annotation, Comment, Mention } from './types';

// Mock users for the team
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    initials: 'SC',
  },
  {
    id: 'user-2',
    name: 'Michael Rodriguez',
    email: 'michael.r@example.com',
    initials: 'MR',
  },
  {
    id: 'user-3',
    name: 'Emily Thompson',
    email: 'emily.t@example.com',
    initials: 'ET',
  },
  {
    id: 'user-4',
    name: 'David Park',
    email: 'david.park@example.com',
    initials: 'DP',
  },
  {
    id: 'user-5',
    name: 'Jennifer Walsh',
    email: 'jennifer.w@example.com',
    initials: 'JW',
  },
];

// Current user (for demo purposes)
export const currentUser: User = mockUsers[0];

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a change ID from category and field
export function createChangeId(categoryName: string, fieldName: string): string {
  return `${categoryName.toLowerCase().replace(/\s+/g, '-')}-${fieldName.toLowerCase().replace(/\s+/g, '-')}`;
}

// Mock annotations for demo
export const mockAnnotations: Annotation[] = [
  {
    id: 'ann-1',
    changeId: 'financial-terms-total-commitments',
    categoryName: 'Financial Terms',
    reviewStatus: 'flagged',
    comments: [
      {
        id: 'cmt-1',
        authorId: 'user-2',
        author: mockUsers[1],
        content: '@Sarah Chen - The $50M increase needs board approval. Can we confirm this was authorized?',
        mentions: [{ userId: 'user-1', userName: 'Sarah Chen', startIndex: 0, endIndex: 11 }],
        createdAt: '2024-12-06T14:30:00Z',
        isEdited: false,
      },
      {
        id: 'cmt-2',
        authorId: 'user-1',
        author: mockUsers[0],
        content: 'Yes, board approved on Dec 4th. I\'ll attach the resolution.',
        mentions: [],
        createdAt: '2024-12-06T15:45:00Z',
        isEdited: false,
      },
    ],
    createdAt: '2024-12-06T14:30:00Z',
    updatedAt: '2024-12-06T15:45:00Z',
    createdBy: mockUsers[1],
  },
  {
    id: 'ann-2',
    changeId: 'covenants-maximum-leverage-ratio',
    categoryName: 'Covenants',
    reviewStatus: 'requires_legal',
    comments: [
      {
        id: 'cmt-3',
        authorId: 'user-3',
        author: mockUsers[2],
        content: '@Jennifer Walsh - Legal needs to review this covenant change. The loosening from 4.5x to 5.0x may have implications for our credit insurance.',
        mentions: [{ userId: 'user-5', userName: 'Jennifer Walsh', startIndex: 0, endIndex: 15 }],
        createdAt: '2024-12-06T10:00:00Z',
        isEdited: false,
      },
    ],
    createdAt: '2024-12-06T10:00:00Z',
    updatedAt: '2024-12-06T10:00:00Z',
    createdBy: mockUsers[2],
  },
  {
    id: 'ann-3',
    changeId: 'financial-terms-initial-margin',
    categoryName: 'Financial Terms',
    reviewStatus: 'reviewed',
    comments: [
      {
        id: 'cmt-4',
        authorId: 'user-4',
        author: mockUsers[3],
        content: 'The 25bps reduction is in line with market movements. Approved.',
        mentions: [],
        createdAt: '2024-12-05T16:20:00Z',
        isEdited: false,
      },
    ],
    createdAt: '2024-12-05T16:20:00Z',
    updatedAt: '2024-12-05T16:20:00Z',
    createdBy: mockUsers[3],
  },
];
