'use client';

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { ESGLoanType } from '../lib';

interface LoanTypeBadgeProps {
  type: ESGLoanType;
}

export const LoanTypeBadge = memo(function LoanTypeBadge({ type }: LoanTypeBadgeProps) {
  const getLabel = (loanType: ESGLoanType): string => {
    switch (loanType) {
      case 'sustainability_linked':
        return 'Sustainability-Linked';
      case 'green_loan':
        return 'Green Loan';
      case 'social_loan':
        return 'Social Loan';
      case 'transition_loan':
        return 'Transition Loan';
      case 'esg_linked_hybrid':
        return 'ESG Hybrid';
      default:
        return loanType;
    }
  };

  const getColor = (loanType: ESGLoanType): string => {
    switch (loanType) {
      case 'sustainability_linked':
        return 'bg-blue-100 text-blue-700';
      case 'green_loan':
        return 'bg-green-100 text-green-700';
      case 'social_loan':
        return 'bg-purple-100 text-purple-700';
      case 'transition_loan':
        return 'bg-amber-100 text-amber-700';
      case 'esg_linked_hybrid':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <Badge
      className={`${getColor(type)} transition-colors hover:opacity-80`}
      data-testid={`loan-type-badge-${type}`}
      aria-label={`Loan type: ${getLabel(type)}`}
    >
      {getLabel(type)}
    </Badge>
  );
});
