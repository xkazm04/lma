'use client';

import React from 'react';
import { FileText, Scale, ClipboardList, BookOpen, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClauseType } from '../lib/types';

interface ClauseTypeSelectorProps {
  selected: ClauseType;
  onSelect: (type: ClauseType) => void;
}

const CLAUSE_TYPES: Array<{
  type: ClauseType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: 'covenant',
    label: 'Financial Covenant',
    description: 'Leverage ratios, interest coverage, CapEx limits',
    icon: Scale,
  },
  {
    type: 'obligation',
    label: 'Reporting Obligation',
    description: 'Financial statements, compliance certificates',
    icon: ClipboardList,
  },
  {
    type: 'facility_term',
    label: 'Facility Term',
    description: 'Commitment amounts, rates, maturity',
    icon: FileText,
  },
  {
    type: 'definition',
    label: 'Definition',
    description: 'Defined terms for the agreement',
    icon: BookOpen,
  },
  {
    type: 'general',
    label: 'General Clause',
    description: 'Custom clause from structured data',
    icon: FileCode,
  },
];

export function ClauseTypeSelector({ selected, onSelect }: ClauseTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" data-testid="clause-type-selector">
      {CLAUSE_TYPES.map(({ type, label, description, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={cn(
            'flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200',
            'hover:shadow-md hover:border-indigo-300',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            selected === type
              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
              : 'border-zinc-200 bg-white'
          )}
          data-testid={`clause-type-${type}-btn`}
        >
          <Icon
            className={cn(
              'w-8 h-8 mb-2',
              selected === type ? 'text-indigo-600' : 'text-zinc-400'
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              selected === type ? 'text-indigo-900' : 'text-zinc-700'
            )}
          >
            {label}
          </span>
          <span className="text-xs text-zinc-500 text-center mt-1">{description}</span>
        </button>
      ))}
    </div>
  );
}

export default ClauseTypeSelector;
