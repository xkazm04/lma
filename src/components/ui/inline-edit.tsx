'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

type InputType = 'text' | 'number' | 'currency' | 'percentage' | 'select';

interface InlineEditProps {
  /** Current value to display */
  value: string | number;
  /** Callback when value is saved */
  onSave?: (value: string | number) => void | Promise<void>;
  /** Input type for formatting and validation */
  type?: InputType;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Options for select type */
  options?: { value: string; label: string }[];
  /** Currency symbol for currency type */
  currencySymbol?: string;
  /** Additional className for the container */
  className?: string;
  /** Additional className for the display text */
  textClassName?: string;
  /** Disable editing */
  disabled?: boolean;
  /** Show edit icon on hover */
  showEditIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-xs h-6 px-1.5',
  md: 'text-sm h-8 px-2',
  lg: 'text-base h-10 px-3',
};

const displaySizeClasses = {
  sm: 'text-xs min-h-[24px]',
  md: 'text-sm min-h-[32px]',
  lg: 'text-base min-h-[40px]',
};

export function InlineEdit({
  value,
  onSave,
  type = 'text',
  placeholder = 'Click to edit',
  options = [],
  currencySymbol = '$',
  className,
  textClassName,
  disabled = false,
  showEditIcon = true,
  size = 'md',
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format value for display
  const formatDisplayValue = useCallback((val: string | number): string => {
    if (val === '' || val === null || val === undefined) return '';

    const numVal = typeof val === 'string' ? parseFloat(val) : val;

    switch (type) {
      case 'currency':
        return isNaN(numVal) ? String(val) : `${currencySymbol}${numVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return isNaN(numVal) ? String(val) : `${numVal.toFixed(2)}%`;
      case 'number':
        return isNaN(numVal) ? String(val) : numVal.toLocaleString();
      case 'select':
        const option = options.find(o => o.value === String(val));
        return option?.label || String(val);
      default:
        return String(val);
    }
  }, [type, currencySymbol, options]);

  // Parse value for editing
  const parseEditValue = useCallback((val: string | number): string => {
    if (type === 'currency' || type === 'percentage') {
      const numVal = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
      return isNaN(numVal) ? '' : String(numVal);
    }
    return String(val);
  }, [type]);

  // Update edit value when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(parseEditValue(value));
    }
  }, [value, isEditing, parseEditValue]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const startEditing = () => {
    if (disabled) return;
    setEditValue(parseEditValue(value));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditValue(parseEditValue(value));
    setIsEditing(false);
  };

  const saveValue = async () => {
    if (isSaving) return;

    let newValue: string | number = editValue;

    // Parse numeric types
    if (type === 'number' || type === 'currency' || type === 'percentage') {
      const parsed = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
      if (isNaN(parsed)) {
        cancelEditing();
        return;
      }
      newValue = parsed;
    }

    // Only save if value changed
    if (String(newValue) !== String(value)) {
      setIsSaving(true);
      try {
        await onSave?.(newValue);
      } finally {
        setIsSaving(false);
      }
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveValue();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't save if clicking on the save/cancel buttons
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    saveValue();
  };

  const displayValue = formatDisplayValue(value);
  const isEmpty = !displayValue;

  if (isEditing) {
    return (
      <div ref={containerRef} className={cn('inline-flex items-center gap-1', className)}>
        {type === 'select' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={cn(
              'border border-blue-400 rounded-md bg-white outline-none focus:ring-2 focus:ring-blue-100',
              sizeClasses[size]
            )}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type === 'number' || type === 'currency' || type === 'percentage' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            step={type === 'percentage' ? '0.01' : type === 'currency' ? '0.01' : undefined}
            className={cn(
              'border border-blue-400 rounded-md bg-white outline-none focus:ring-2 focus:ring-blue-100 w-full',
              sizeClasses[size]
            )}
            placeholder={placeholder}
          />
        )}
        <button
          type="button"
          onClick={saveValue}
          disabled={isSaving}
          className="p-1 rounded hover:bg-green-50 text-green-600 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={cancelEditing}
          disabled={isSaving}
          className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={startEditing}
      className={cn(
        'group inline-flex items-center gap-1.5 cursor-pointer rounded-md transition-all',
        !disabled && 'hover:bg-zinc-100',
        disabled && 'cursor-default',
        className
      )}
    >
      <span
        className={cn(
          'py-0.5 px-1 rounded transition-colors',
          displaySizeClasses[size],
          isEmpty ? 'text-zinc-400 italic' : '',
          textClassName
        )}
      >
        {isEmpty ? placeholder : displayValue}
      </span>
      {showEditIcon && !disabled && (
        <Pencil className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

export default InlineEdit;
