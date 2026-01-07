'use client';

import React, { useState, memo } from 'react';
import { MoreHorizontal, Pencil, Trash2, Reply, CheckCircle2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Comment, User, Mention, ThreadResolution } from '../lib/types';
import { UserAvatar } from './UserMention';
import { MentionInput } from './MentionInput';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  users: User[];
  onEdit: (commentId: string, newContent: string, mentions: Mention[]) => void;
  onDelete: (commentId: string) => void;
  onReply: (content: string, mentions: Mention[]) => void;
}

const CommentItem = memo(function CommentItem({
  comment,
  currentUserId,
  users,
  onEdit,
  onDelete,
  onReply,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editMentions, setEditMentions] = useState<Mention[]>(comment.mentions);
  const [replyContent, setReplyContent] = useState('');
  const [replyMentions, setReplyMentions] = useState<Mention[]>([]);

  const isAuthor = comment.authorId === currentUserId;
  const timeAgo = formatTimeAgo(comment.createdAt);

  // Render comment content with highlighted mentions
  const renderContent = (content: string, mentions: Mention[]) => {
    if (mentions.length === 0) return content;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort mentions by start index
    const sortedMentions = [...mentions].sort((a, b) => a.startIndex - b.startIndex);

    sortedMentions.forEach((mention, idx) => {
      // Add text before mention
      if (mention.startIndex > lastIndex) {
        parts.push(content.slice(lastIndex, mention.startIndex));
      }

      // Add highlighted mention
      parts.push(
        <span
          key={`mention-${idx}`}
          className="px-1 py-0.5 rounded bg-blue-50 text-blue-700 font-medium"
        >
          @{mention.userName}
        </span>
      );

      lastIndex = mention.endIndex;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  };

  const handleSaveEdit = () => {
    onEdit(comment.id, editContent, editMentions);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setEditMentions(comment.mentions);
    setIsEditing(false);
  };

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent, replyMentions);
      setReplyContent('');
      setReplyMentions([]);
      setIsReplying(false);
    }
  };

  return (
    <div className="group" data-testid={`comment-item-${comment.id}`}>
      <div className="flex gap-3">
        <UserAvatar user={comment.author} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-zinc-900">
              {comment.author.name}
            </span>
            <span className="text-xs text-zinc-500">{timeAgo}</span>
            {comment.isEdited && (
              <span className="text-xs text-zinc-400">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <MentionInput
                value={editContent}
                onChange={(value, mentions) => {
                  setEditContent(value);
                  setEditMentions(mentions);
                }}
                users={users}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  data-testid="save-edit-btn"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  data-testid="cancel-edit-btn"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {renderContent(comment.content, comment.mentions)}
            </p>
          )}

          {/* Action buttons (shown on hover) */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-700"
                onClick={() => setIsReplying(!isReplying)}
                data-testid="reply-btn"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-600"
                      data-testid="comment-actions-trigger"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsEditing(true)}
                      data-testid="edit-comment-btn"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(comment.id)}
                      className="text-red-600"
                      data-testid="delete-comment-btn"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply input */}
          {isReplying && (
            <div className="mt-3 pl-3 border-l-2 border-zinc-200">
              <MentionInput
                value={replyContent}
                onChange={(value, mentions) => {
                  setReplyContent(value);
                  setReplyMentions(mentions);
                }}
                users={users}
                placeholder="Write a reply..."
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                  data-testid="submit-reply-btn"
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                    setReplyMentions([]);
                  }}
                  data-testid="cancel-reply-btn"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

interface CommentThreadProps {
  comments: Comment[];
  currentUserId: string;
  users: User[];
  resolution?: ThreadResolution;
  onAddComment: (content: string, mentions: Mention[]) => void;
  onEditComment: (commentId: string, newContent: string, mentions: Mention[]) => void;
  onDeleteComment: (commentId: string) => void;
  onResolve?: () => void;
  onReopen?: () => void;
}

export const CommentThread = memo(function CommentThread({
  comments,
  currentUserId,
  users,
  resolution,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolve,
  onReopen,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [newMentions, setNewMentions] = useState<Mention[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(resolution?.status === 'resolved');

  const isResolved = resolution?.status === 'resolved';
  const hasComments = comments.length > 0;

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment, newMentions);
      setNewComment('');
      setNewMentions([]);
    }
  };

  return (
    <div className="space-y-2" data-testid="comment-thread">
      {/* Thread Resolution Header - only show if there are comments */}
      {hasComments && (
        <div
          className={cn(
            'flex items-center justify-between p-2 rounded-lg border transition-colors',
            isResolved
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          )}
          data-testid="thread-resolution-header"
        >
          <div className="flex items-center gap-2">
            {isResolved ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-amber-500" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isResolved ? 'text-green-700' : 'text-amber-700'
              )}
            >
              {isResolved ? 'Resolved' : 'Open'}
            </span>
            {isResolved && resolution?.resolvedBy && (
              <span className="text-xs text-green-600">
                by {resolution.resolvedBy.name}
              </span>
            )}
            {isResolved && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setIsCollapsed(!isCollapsed)}
                data-testid="toggle-resolved-thread-btn"
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Hide
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isResolved ? (
              onReopen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                  onClick={onReopen}
                  data-testid="reopen-thread-btn"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reopen
                </Button>
              )
            ) : (
              onResolve && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-green-700 hover:text-green-800 hover:bg-green-100"
                  onClick={onResolve}
                  data-testid="resolve-thread-btn"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Resolve
                </Button>
              )
            )}
          </div>
        </div>
      )}

      {/* Existing comments - collapse if resolved */}
      {hasComments && (!isResolved || !isCollapsed) && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              users={users}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onReply={(content, mentions) => onAddComment(content, mentions)}
            />
          ))}
        </div>
      )}

      {/* New comment input - always show unless thread is resolved and collapsed */}
      {(!isResolved || !isCollapsed) && (
        <div className="pt-2 border-t border-zinc-100">
          <MentionInput
            value={newComment}
            onChange={(value, mentions) => {
              setNewComment(value);
              setNewMentions(mentions);
            }}
            users={users}
            placeholder="Add a comment... Use @ to mention someone"
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              data-testid="add-comment-btn"
            >
              Add Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
