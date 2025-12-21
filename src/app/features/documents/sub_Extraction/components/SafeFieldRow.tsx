'use client';

import React, { memo } from 'react';
import { FieldRow } from './FieldRow';
import { FieldRowErrorBoundary } from './FieldRowErrorBoundary';
import type { ExtractionField } from '../../lib/types';

interface SafeFieldRowProps {
  field: ExtractionField;
  fieldIndex: number;
  categoryIndex?: number;
  documentId?: string;
  isVerified?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  isKeyboardFocused?: boolean;
  variant?: 'default' | 'compact';
  onVerify?: (fieldIndex: number) => void;
  onValueChange?: (fieldIndex: number, newValue: string) => void;
  onSelect?: (field: ExtractionField, categoryIndex: number, fieldIndex: number) => void;
  onHover?: (field: ExtractionField | null, categoryIndex: number, fieldIndex: number) => void;
  forceEditMode?: boolean;
  onEditModeChange?: (isEditing: boolean) => void;
}

/**
 * A wrapper around FieldRow that includes error boundary protection.
 * Use this component to prevent one broken field from crashing the entire extraction review.
 *
 * When a rendering error occurs (bad confidence values, undefined fields, malformed sources),
 * this component will display a compact error state with:
 * - Red alert icon
 * - "Unable to display field: {name}" message
 * - "View Debug Info" button showing error details in a modal
 * - "Report Issue" button that copies diagnostic JSON to clipboard
 *
 * Errors are logged to console with full field data for debugging.
 */
export const SafeFieldRow = memo(function SafeFieldRow(props: SafeFieldRowProps) {
  return (
    <FieldRowErrorBoundary field={props.field} fieldIndex={props.fieldIndex}>
      <FieldRow {...props} />
    </FieldRowErrorBoundary>
  );
});
