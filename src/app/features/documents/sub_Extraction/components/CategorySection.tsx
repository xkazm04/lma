'use client';

import React, { memo, useMemo, useReducer, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Undo2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { SafeFieldRow } from './SafeFieldRow';
import type { ExtractionCategory, ExtractionField } from '../../lib/types';

interface CategorySectionProps {
  category: ExtractionCategory;
  index?: number;
  documentId?: string;
  selectedFieldIndex?: { categoryIndex: number; fieldIndex: number } | null;
  hoveredFieldIndex?: { categoryIndex: number; fieldIndex: number } | null;
  keyboardFocusedFieldIndex?: { categoryIndex: number; fieldIndex: number } | null;
  onFieldSelect?: (field: ExtractionField, categoryIndex: number, fieldIndex: number) => void;
  onFieldHover?: (field: ExtractionField | null, categoryIndex: number, fieldIndex: number) => void;
  externalVerifiedFields?: Set<number>;
  onVerificationChange?: (categoryId: string, verifiedFields: Set<number>) => void;
  fieldRefs?: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
  /** Field index in edit mode (controlled by keyboard navigation) */
  editingFieldIndex?: { categoryIndex: number; fieldIndex: number } | null;
  /** Callback when a field's edit mode changes */
  onFieldEditModeChange?: (categoryIndex: number, fieldIndex: number, isEditing: boolean) => void;
}

const HIGH_CONFIDENCE_THRESHOLD = 90;

// Reducer state type
interface CategorySectionState {
  isExpanded: boolean;
  verifiedFields: Set<number>;
  previousVerifiedFields: Set<number> | null;
}

// Reducer action types
type CategorySectionAction =
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'TOGGLE_EXPAND' }
  | { type: 'VERIFY_FIELD'; fieldIndex: number }
  | { type: 'VERIFY_ALL_HIGH_CONFIDENCE'; fieldIndices: number[] }
  | { type: 'UNDO' }
  | { type: 'CLEAR_UNDO_STATE' }
  | { type: 'SYNC_EXTERNAL'; verifiedFields: Set<number> };

function categorySectionReducer(
  state: CategorySectionState,
  action: CategorySectionAction
): CategorySectionState {
  switch (action.type) {
    case 'EXPAND':
      return { ...state, isExpanded: true };
    case 'COLLAPSE':
      return { ...state, isExpanded: false };
    case 'TOGGLE_EXPAND':
      return { ...state, isExpanded: !state.isExpanded };
    case 'VERIFY_FIELD': {
      const next = new Set(state.verifiedFields);
      next.add(action.fieldIndex);
      return { ...state, verifiedFields: next };
    }
    case 'VERIFY_ALL_HIGH_CONFIDENCE': {
      const next = new Set(state.verifiedFields);
      action.fieldIndices.forEach((index) => next.add(index));
      return {
        ...state,
        previousVerifiedFields: new Set(state.verifiedFields),
        verifiedFields: next,
      };
    }
    case 'UNDO':
      if (state.previousVerifiedFields === null) return state;
      return {
        ...state,
        verifiedFields: state.previousVerifiedFields,
        previousVerifiedFields: null,
      };
    case 'CLEAR_UNDO_STATE':
      return { ...state, previousVerifiedFields: null };
    case 'SYNC_EXTERNAL':
      return { ...state, verifiedFields: action.verifiedFields };
    default:
      return state;
  }
}

function getInitialState(externalVerifiedFields?: Set<number>): CategorySectionState {
  return {
    isExpanded: true,
    verifiedFields: externalVerifiedFields ?? new Set<number>(),
    previousVerifiedFields: null,
  };
}

export const CategorySection = memo(function CategorySection({
  category,
  index = 0,
  documentId,
  selectedFieldIndex,
  hoveredFieldIndex,
  keyboardFocusedFieldIndex,
  onFieldSelect,
  onFieldHover,
  externalVerifiedFields,
  onVerificationChange,
  fieldRefs,
  editingFieldIndex,
  onFieldEditModeChange,
}: CategorySectionProps) {
  const [state, dispatch] = useReducer(
    categorySectionReducer,
    externalVerifiedFields,
    getInitialState
  );
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external verified fields when they change
  useEffect(() => {
    if (externalVerifiedFields !== undefined) {
      dispatch({ type: 'SYNC_EXTERNAL', verifiedFields: externalVerifiedFields });
    }
  }, [externalVerifiedFields]);

  // Notify parent of verification changes when using internal state
  const notifyVerificationChange = useCallback(
    (newVerifiedFields: Set<number>) => {
      if (onVerificationChange) {
        onVerificationChange(category.id, newVerifiedFields);
      }
    },
    [onVerificationChange, category.id]
  );

  // Compute the effective verified fields (external takes precedence)
  const verifiedFields = externalVerifiedFields ?? state.verifiedFields;

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const flaggedCount = useMemo(
    () => category.fields.filter((f) => f.flagged).length,
    [category.fields]
  );

  const verifiedCount = verifiedFields.size;
  const totalFields = category.fields.length;
  const verificationProgress = totalFields > 0 ? (verifiedCount / totalFields) * 100 : 0;

  // Get indices of high confidence fields that are not yet verified
  const highConfidenceUnverifiedIndices = useMemo(() => {
    return category.fields
      .map((field, idx) => ({ field, idx }))
      .filter(({ field, idx }) => field.confidence >= HIGH_CONFIDENCE_THRESHOLD && !verifiedFields.has(idx))
      .map(({ idx }) => idx);
  }, [category.fields, verifiedFields]);

  const hasHighConfidenceUnverified = highConfidenceUnverifiedIndices.length > 0;

  const handleVerifyField = useCallback(
    (fieldIndex: number) => {
      dispatch({ type: 'VERIFY_FIELD', fieldIndex });
      // Notify parent if using external state management
      if (onVerificationChange) {
        const next = new Set(verifiedFields);
        next.add(fieldIndex);
        notifyVerificationChange(next);
      }
    },
    [verifiedFields, onVerificationChange, notifyVerificationChange]
  );

  const handleVerifyAllHighConfidence = useCallback(() => {
    const fieldsToVerify = [...highConfidenceUnverifiedIndices];
    const count = fieldsToVerify.length;

    if (count === 0) return;

    // Dispatch action to verify all high confidence fields
    dispatch({ type: 'VERIFY_ALL_HIGH_CONFIDENCE', fieldIndices: fieldsToVerify });

    // Notify parent if using external state management
    if (onVerificationChange) {
      const next = new Set(verifiedFields);
      fieldsToVerify.forEach((idx) => next.add(idx));
      notifyVerificationChange(next);
    }

    // Clear any existing undo timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Capture current verified fields for undo in toast
    const previousVerifiedFieldsSnapshot = new Set(verifiedFields);

    // Show toast with undo action
    const { dismiss } = toast({
      variant: 'success',
      title: `Verified ${count} high confidence field${count > 1 ? 's' : ''}`,
      description: `All fields above ${HIGH_CONFIDENCE_THRESHOLD}% confidence have been marked as verified.`,
      action: (
        <ToastAction
          altText="Undo verification"
          onClick={() => {
            dispatch({ type: 'UNDO' });
            // Notify parent of undo if using external state management
            if (onVerificationChange) {
              notifyVerificationChange(previousVerifiedFieldsSnapshot);
            }
            if (undoTimeoutRef.current) {
              clearTimeout(undoTimeoutRef.current);
              undoTimeoutRef.current = null;
            }
          }}
          data-testid={`undo-bulk-verify-${category.id}`}
        >
          <Undo2 className="w-4 h-4 mr-1" />
          Undo
        </ToastAction>
      ),
    });

    // Auto-dismiss after 5 seconds (undo window)
    undoTimeoutRef.current = setTimeout(() => {
      dismiss();
      dispatch({ type: 'CLEAR_UNDO_STATE' });
      undoTimeoutRef.current = null;
    }, 5000);
  }, [highConfidenceUnverifiedIndices, verifiedFields, category.id, onVerificationChange, notifyVerificationChange]);

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-2 transition-all duration-200 hover:shadow-sm"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      data-testid={`category-section-${category.id}`}
    >
      <CardHeader
        className="py-2 px-3 cursor-pointer transition-colors hover:bg-zinc-50/50"
        onClick={() => dispatch({ type: 'TOGGLE_EXPAND' })}
        data-testid={`category-header-${category.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="transition-transform duration-200" data-testid={`category-${category.id}-expand`}>
              {state.isExpanded ? (
                <ChevronDown className="w-5 h-5 text-zinc-400" data-testid={`category-${category.id}-chevron-down`} />
              ) : (
                <ChevronRight className="w-5 h-5 text-zinc-400" data-testid={`category-${category.id}-chevron-right`} />
              )}
            </span>
            <CardTitle className="text-sm font-semibold">{category.category}</CardTitle>
            <Badge variant="secondary">{category.fields.length} fields</Badge>
            {flaggedCount > 0 && (
              <Badge variant="warning" className="animate-pulse">
                {flaggedCount} needs review
              </Badge>
            )}
          </div>

          {/* Progress indicator and bulk verify button */}
          <div
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Verification progress */}
            <div className="flex items-center gap-2 min-w-[120px]">
              <Progress
                value={verificationProgress}
                className="h-2 w-20"
                data-testid={`category-progress-${category.id}`}
              />
              <span
                className="text-sm text-zinc-500 whitespace-nowrap"
                data-testid={`category-progress-text-${category.id}`}
              >
                {verifiedCount}/{totalFields} verified
              </span>
            </div>

            {/* Bulk verify button */}
            {hasHighConfidenceUnverified && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyAllHighConfidence}
                className="transition-all hover:bg-green-50 hover:border-green-200"
                data-testid={`verify-high-confidence-btn-${category.id}`}
              >
                <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                Verify All High Confidence ({highConfidenceUnverifiedIndices.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          state.isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <CardContent className="px-3 pb-2 pt-0">
          <div className="divide-y divide-zinc-100">
          {category.fields.map((field, i) => (
            <div
              key={i}
              ref={(el) => {
                if (fieldRefs?.current) {
                  const refKey = `${category.id}-${i}`;
                  if (el) {
                    fieldRefs.current.set(refKey, el);
                  } else {
                    fieldRefs.current.delete(refKey);
                  }
                }
              }}
              data-field-ref={`${category.id}-${i}`}
            >
              <SafeFieldRow
                field={field}
                fieldIndex={i}
                categoryIndex={index}
                documentId={documentId}
                isVerified={verifiedFields.has(i)}
                isSelected={
                  selectedFieldIndex?.categoryIndex === index &&
                  selectedFieldIndex?.fieldIndex === i
                }
                isHovered={
                  hoveredFieldIndex?.categoryIndex === index &&
                  hoveredFieldIndex?.fieldIndex === i
                }
                isKeyboardFocused={
                  keyboardFocusedFieldIndex?.categoryIndex === index &&
                  keyboardFocusedFieldIndex?.fieldIndex === i
                }
                forceEditMode={
                  editingFieldIndex?.categoryIndex === index &&
                  editingFieldIndex?.fieldIndex === i
                }
                onEditModeChange={(isEditing) => {
                  onFieldEditModeChange?.(index, i, isEditing);
                }}
                onVerify={handleVerifyField}
                onSelect={onFieldSelect}
                onHover={onFieldHover}
              />
            </div>
          ))}
          </div>
        </CardContent>
      </div>
    </Card>
  );
});
