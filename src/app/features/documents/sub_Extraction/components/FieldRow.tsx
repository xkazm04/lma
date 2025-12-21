'use client';

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Edit3, Save, X, ChevronDown, ChevronUp, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Confidence } from '@/components/ui/confidence';
import { ExplainExtractionButton } from './ExplainExtractionButton';
import { getConfidenceLevel } from '../lib/confidenceHelpers';
import type { ExtractionField } from '../../lib/types';

interface FieldRowProps {
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
  /** External control for edit mode (used by keyboard navigation) */
  forceEditMode?: boolean;
  /** Callback when edit mode changes */
  onEditModeChange?: (isEditing: boolean) => void;
}

// Convert field name to kebab-case for testid
const toFieldTestId = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export const FieldRow = memo(function FieldRow({
  field,
  fieldIndex,
  categoryIndex = 0,
  documentId,
  isVerified = false,
  isSelected = false,
  isHovered = false,
  isKeyboardFocused = false,
  variant = 'compact', // Default to compact
  onVerify,
  onValueChange,
  onSelect,
  onHover,
  forceEditMode,
  onEditModeChange,
}: FieldRowProps) {
  // Style variants
  const isCompact = variant === 'compact';
  const rowPadding = isCompact ? 'py-2 px-3 gap-3' : 'py-4 px-5 gap-6';
  const nameWidth = isCompact ? 'w-32' : 'w-48';
  const confidenceWidth = isCompact ? 'w-16' : 'w-24';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.value);
  const [isExpanded, setIsExpanded] = useState(false);
  const fieldNameTestId = toFieldTestId(field.name);
  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if field is low confidence (using shared logic)
  const isLowConfidence = getConfidenceLevel(field.confidence) === 'low';

  // Sync editing state with external forceEditMode prop
  useEffect(() => {
    if (forceEditMode !== undefined && forceEditMode !== isEditing) {
      setIsEditing(forceEditMode);
      if (forceEditMode) {
        // Focus the input when entering edit mode via keyboard
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  }, [forceEditMode, isEditing]);

  // Notify parent when edit mode changes
  useEffect(() => {
    onEditModeChange?.(isEditing);
  }, [isEditing, onEditModeChange]);

  // Scroll keyboard-focused field into view
  useEffect(() => {
    if (isKeyboardFocused && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isKeyboardFocused]);

  const handleSave = useCallback(() => {
    if (onValueChange && editValue !== field.value) {
      onValueChange(fieldIndex, editValue);
    }
    setIsEditing(false);
  }, [fieldIndex, editValue, field.value, onValueChange]);

  const handleValueChange = useCallback((newValue: string) => {
    setEditValue(newValue);
    if (onValueChange) {
      onValueChange(fieldIndex, newValue);
    }
  }, [fieldIndex, onValueChange]);

  const handleVerify = useCallback(() => {
    if (onVerify) {
      onVerify(fieldIndex);
    }
  }, [onVerify, fieldIndex]);

  const handleCancel = useCallback(() => {
    setEditValue(field.value);
    setIsEditing(false);
  }, [field.value]);

  const handleSelectField = useCallback(() => {
    if (onSelect) {
      onSelect(field, categoryIndex, fieldIndex);
    }
  }, [field, categoryIndex, fieldIndex, onSelect]);

  const handleMouseEnter = useCallback(() => {
    if (onHover) {
      onHover(field, categoryIndex, fieldIndex);
    }
  }, [field, categoryIndex, fieldIndex, onHover]);

  const handleMouseLeave = useCallback(() => {
    if (onHover) {
      onHover(null, categoryIndex, fieldIndex);
    }
  }, [categoryIndex, fieldIndex, onHover]);

  return (
    <div className="space-y-0" ref={rowRef}>
      <div
        className={cn(
          'flex items-center rounded-lg border transition-all duration-200',
          rowPadding,
          field.flagged && !isVerified ? 'border-amber-200 bg-amber-50' : 'border-zinc-100 bg-white',
          isVerified && 'border-green-200 bg-green-50',
          isSelected && 'ring-2 ring-indigo-400 ring-offset-1 bg-indigo-50/50',
          isHovered && !isSelected && 'ring-1 ring-indigo-200 bg-indigo-50/30 shadow-sm',
          // Keyboard focus styles - focus-visible ring for accessibility
          isKeyboardFocused && !isSelected && 'ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50/60 shadow-md',
          isExpanded && 'rounded-b-none border-b-0',
          'hover:shadow-sm cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
        )}
        onClick={handleSelectField}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={isKeyboardFocused ? 0 : -1}
        role="row"
        aria-selected={isSelected || isKeyboardFocused}
        data-testid={`field-row-${fieldIndex}`}
        data-testid-field={`field-row-${fieldNameTestId}`}
        data-keyboard-focused={isKeyboardFocused}
      >
        {/* Status Icon */}
        <div className={cn('shrink-0', isCompact && 'w-5')}>
          {isVerified ? (
            <CheckCircle className={cn(isCompact ? 'w-4 h-4' : 'w-5 h-5', 'text-green-600 animate-in zoom-in duration-200')} />
          ) : field.flagged ? (
            <AlertCircle className={cn(isCompact ? 'w-4 h-4' : 'w-5 h-5', 'text-amber-600')} />
          ) : (
            <CheckCircle className={cn(isCompact ? 'w-4 h-4' : 'w-5 h-5', 'text-zinc-300')} />
          )}
        </div>

        {/* Field Name & Source */}
        <div className={cn(nameWidth, 'shrink-0')}>
          <p className={cn(isCompact ? 'text-xs' : 'text-sm', 'font-medium text-zinc-900 truncate')}>{field.name}</p>
          <p className="text-[10px] text-zinc-400 truncate">{field.source}</p>
        </div>

        {/* Value */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
                // Escape is handled by the keyboard navigation hook
              }}
              className={cn(
                isCompact ? 'h-7 text-xs' : 'h-8',
                'transition-shadow focus:shadow-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
              )}
              autoFocus
              data-testid={`field-edit-input-${fieldIndex}`}
            />
          ) : (
            <p className={cn(isCompact ? 'text-xs' : 'text-sm', 'text-zinc-700 truncate')}>{editValue}</p>
          )}
        </div>

        {/* Confidence & Actions - Visual divider for default variant */}
        <div className={cn(
          'flex items-center shrink-0',
          !isCompact && 'border-l border-zinc-100 pl-4 gap-4',
          isCompact && 'gap-2'
        )}>
          {/* Confidence */}
          <div className={cn(confidenceWidth, 'shrink-0')}>
            <Confidence value={field.confidence} variant={isCompact ? 'badge' : 'bar'} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                className="transition-transform hover:scale-110"
                data-testid={`field-save-btn-${fieldIndex}`}
              >
                <Save className="w-4 h-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="transition-transform hover:scale-110"
                data-testid={`field-cancel-btn-${fieldIndex}`}
              >
                <X className="w-4 h-4 text-zinc-400" />
              </Button>
            </>
          ) : (
            <>
              {/* Show expand button for low confidence or flagged fields */}
              {(isLowConfidence || field.flagged) && documentId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="transition-transform hover:scale-110"
                  data-testid={`field-expand-btn-${fieldIndex}`}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-indigo-500" />
                  )}
                </Button>
              )}
              {onSelect && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectField();
                  }}
                  className={cn(
                    'transition-transform hover:scale-110',
                    isSelected && 'bg-indigo-100'
                  )}
                  title="View in document"
                  data-testid={`field-view-source-btn-${fieldIndex}`}
                >
                  <FileSearch className={cn('w-4 h-4', isSelected ? 'text-indigo-600' : 'text-zinc-400')} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="transition-transform hover:scale-110"
                data-testid={`field-edit-btn-${fieldIndex}`}
              >
                <Edit3 className="w-4 h-4 text-zinc-400" />
              </Button>
              {!isVerified && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVerify();
                  }}
                  className="transition-all hover:bg-green-50"
                  data-testid={`field-verify-btn-${fieldIndex}`}
                  data-testid-field={`verify-field-${fieldNameTestId}`}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verify
                </Button>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Expanded AI Explanation Panel */}
      {isExpanded && documentId && (
        <div
          className={cn(
            'px-4 py-3 border border-t-0 rounded-b-lg',
            'bg-gradient-to-b from-zinc-50 to-white',
            'animate-in slide-in-from-top-2 duration-200',
            field.flagged && !isVerified ? 'border-amber-200' : 'border-zinc-100',
            isVerified && 'border-green-200'
          )}
          data-testid={`field-explanation-panel-${fieldIndex}`}
        >
          <ExplainExtractionButton
            field={field}
            documentId={documentId}
            onValueChange={handleValueChange}
          />
        </div>
      )}
    </div>
  );
});
