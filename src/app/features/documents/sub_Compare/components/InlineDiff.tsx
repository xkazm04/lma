'use client';

import React, { memo, useMemo } from 'react';
import DiffMatchPatch from 'diff-match-patch';
import { cn } from '@/lib/utils';

const dmp = new DiffMatchPatch();

interface InlineDiffProps {
  /** Original text (from Document 1) */
  oldText: string;
  /** New text (from Document 2) */
  newText: string;
  /** Display mode: 'old' shows removals highlighted, 'new' shows additions highlighted */
  mode: 'old' | 'new';
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Renders inline character-level diff highlighting.
 *
 * In 'old' mode: Shows the original text with removed parts highlighted in red with strikethrough.
 * In 'new' mode: Shows the new text with added parts highlighted in green.
 *
 * Similar to GitHub's code diff view, this makes the exact character-level changes
 * immediately visible without requiring manual comparison.
 */
export const InlineDiff = memo(function InlineDiff({
  oldText,
  newText,
  mode,
  className,
  'data-testid': testId,
}: InlineDiffProps) {
  const diffElements = useMemo(() => {
    // Handle edge cases
    if (!oldText && !newText) {
      return null;
    }

    // If texts are identical, just return the text
    if (oldText === newText) {
      return <span>{oldText}</span>;
    }

    // Compute character-level diff
    const diffs = dmp.diff_main(oldText || '', newText || '');
    dmp.diff_cleanupSemantic(diffs);

    // Map diff results to React elements
    return diffs.map((diff, index) => {
      const [operation, text] = diff;

      // DiffMatchPatch operations:
      // -1 = DIFF_DELETE (removed from old)
      //  0 = DIFF_EQUAL (unchanged)
      //  1 = DIFF_INSERT (added in new)

      if (operation === 0) {
        // Unchanged text - show in both modes
        return (
          <span key={index} data-testid={testId ? `${testId}-unchanged-${index}` : undefined}>
            {text}
          </span>
        );
      }

      if (operation === -1) {
        // Deleted text - only show in 'old' mode
        if (mode === 'old') {
          return (
            <span
              key={index}
              className="bg-red-100 text-red-800 line-through decoration-red-500"
              data-testid={testId ? `${testId}-removed-${index}` : undefined}
            >
              {text}
            </span>
          );
        }
        // In 'new' mode, deleted text is not shown
        return null;
      }

      if (operation === 1) {
        // Inserted text - only show in 'new' mode
        if (mode === 'new') {
          return (
            <span
              key={index}
              className="bg-green-100 text-green-800 font-medium"
              data-testid={testId ? `${testId}-added-${index}` : undefined}
            >
              {text}
            </span>
          );
        }
        // In 'old' mode, inserted text is not shown
        return null;
      }

      return null;
    });
  }, [oldText, newText, mode, testId]);

  return (
    <span className={cn('inline', className)} data-testid={testId}>
      {diffElements}
    </span>
  );
});

interface InlineDiffPairProps {
  /** Original text (from Document 1) */
  oldText: string | null;
  /** New text (from Document 2) */
  newText: string | null;
  /** Whether the change type is 'modified' - only show diff for modified changes */
  isModified: boolean;
  /** Additional CSS classes for the old text container */
  oldClassName?: string;
  /** Additional CSS classes for the new text container */
  newClassName?: string;
  /** Placeholder text when value is null */
  placeholder?: string;
  /** Base test ID */
  testId?: string;
}

interface InlineDiffPairResult {
  oldDisplay: React.ReactNode;
  newDisplay: React.ReactNode;
}

/**
 * Generates a pair of inline diff displays for Document 1 and Document 2 values.
 * Shows character-level diff highlighting only for modified changes.
 *
 * This is a utility function (not a React component) that returns JSX elements.
 */
export function getInlineDiffPair({
  oldText,
  newText,
  isModified,
  oldClassName,
  newClassName,
  placeholder = 'Not present',
  testId,
}: InlineDiffPairProps): InlineDiffPairResult {
  // Only show inline diff for modified values where both texts exist
  const showDiff = isModified && oldText !== null && newText !== null;

  return {
    oldDisplay: (
      <span className={oldClassName} data-testid={testId ? `${testId}-old` : undefined}>
        {oldText ? (
          showDiff ? (
            <InlineDiff
              oldText={oldText}
              newText={newText || ''}
              mode="old"
              data-testid={testId ? `${testId}-diff-old` : undefined}
            />
          ) : (
            oldText
          )
        ) : (
          <span className="text-zinc-400 italic">{placeholder}</span>
        )}
      </span>
    ),
    newDisplay: (
      <span className={newClassName} data-testid={testId ? `${testId}-new` : undefined}>
        {newText ? (
          showDiff ? (
            <InlineDiff
              oldText={oldText || ''}
              newText={newText}
              mode="new"
              data-testid={testId ? `${testId}-diff-new` : undefined}
            />
          ) : (
            newText
          )
        ) : (
          <span className="text-zinc-400 italic">{placeholder}</span>
        )}
      </span>
    ),
  };
}
