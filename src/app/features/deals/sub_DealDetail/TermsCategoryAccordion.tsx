'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { WizardContainer, useAccordionState, type WizardStep } from '@/components/ui/wizard-container';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { CategoryWithTerms } from '../lib/types';
import type { TermDependencyGraph } from '../lib/term-dependency-graph';
import { TermsCategory } from './TermsCategory';
import { isTermModified } from '@/lib/utils/term-utils';

/**
 * CategoryStep represents a category as a wizard step.
 * This allows TermsCategory to be rendered inside WizardContainer's accordion mode.
 */
interface CategoryStep extends WizardStep<CategoryWithTerms> {
  id: string;
  label: string;
  data: CategoryWithTerms;
  termsCount: number;
  pendingCount: number;
  modifiedCount: number;
}

interface TermsCategoryAccordionProps {
  /** Array of categories with their terms */
  categories: CategoryWithTerms[];
  /** Array of expanded category IDs */
  expandedCategories: string[];
  /** Currently selected term ID */
  selectedTerm: string | null;
  /** Called when a category is toggled */
  onToggleCategory: (categoryId: string) => void;
  /** Called when a term is selected */
  onSelectTerm: (termId: string) => void;
  /** Optional dependency graph for showing term relationships */
  dependencyGraph?: TermDependencyGraph;
  /** Called when user clicks on a dependency indicator */
  onShowDependencies?: (termId: string) => void;
  /** Whether to use wizard-style mode (focus mode) */
  focusMode?: boolean;
  /** Critical term IDs for focus mode highlighting */
  criticalTermIds?: Set<string>;
}

/**
 * TermsCategoryAccordion uses the WizardContainer with accordion mode to render
 * term categories. This demonstrates how the same WizardContainer pattern can
 * power both wizard steps (NewDealPage) and collapsible term sections (DealDetailPage).
 *
 * This component provides an alternative to using TermsCategory directly, showing
 * how the unified WizardContainer pattern enables 'wizard mode' for term negotiation.
 */
export const TermsCategoryAccordion = memo(function TermsCategoryAccordion({
  categories,
  expandedCategories,
  selectedTerm,
  onToggleCategory,
  onSelectTerm,
  dependencyGraph,
  onShowDependencies,
  focusMode = false,
  criticalTermIds,
}: TermsCategoryAccordionProps) {
  // Convert categories to wizard steps
  const categorySteps: CategoryStep[] = useMemo(() => {
    return categories.map((category) => {
      const pendingCount = category.terms.filter(t => t.pending_proposals_count > 0).length;
      const modifiedCount = category.terms.filter(t => isTermModified(t)).length;

      return {
        id: category.id,
        label: category.name,
        description: `${category.terms.length} terms`,
        data: category,
        termsCount: category.terms.length,
        pendingCount,
        modifiedCount,
      };
    });
  }, [categories]);

  // Handle step change from WizardContainer
  const handleStepChange = useCallback(
    (step: number | string[]) => {
      if (Array.isArray(step)) {
        // Find which category was toggled
        const newExpanded = new Set(step);
        const oldExpanded = new Set(expandedCategories);

        // Find added category
        for (const id of newExpanded) {
          if (!oldExpanded.has(id)) {
            onToggleCategory(id);
            return;
          }
        }

        // Find removed category
        for (const id of oldExpanded) {
          if (!newExpanded.has(id)) {
            onToggleCategory(id);
            return;
          }
        }
      }
    },
    [expandedCategories, onToggleCategory]
  );

  // Render badge for each category step
  const renderStepBadge = useCallback(
    (step: CategoryStep) => (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {step.termsCount} terms
        </Badge>
        {step.modifiedCount > 0 && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
        )}
      </div>
    ),
    []
  );

  // Render actions for each category step
  const renderStepActions = useCallback(
    (step: CategoryStep) => {
      if (step.pendingCount > 0) {
        return (
          <Badge className="bg-amber-100 text-amber-700">
            <AlertCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            {step.pendingCount} Pending
          </Badge>
        );
      }
      return null;
    },
    []
  );

  // Render step content - the actual TermsCategory in accordion-item mode
  const renderStepContent = useCallback(
    (step: CategoryStep, index: number) => {
      const category = step.data;

      // Render terms within the accordion content using accordion-item mode
      return (
        <div className="divide-y -mt-2">
          <TermsCategory
            category={category}
            selectedTerm={selectedTerm}
            onSelectTerm={onSelectTerm}
            categoryIndex={index}
            dependencyGraph={dependencyGraph}
            onShowDependencies={onShowDependencies}
            renderMode="accordion-item"
          />
        </div>
      );
    },
    [selectedTerm, onSelectTerm, dependencyGraph, onShowDependencies]
  );

  // Validation function - in focus mode, highlight categories with critical terms
  const canProceed = useCallback(
    (stepIndex: number) => {
      if (!focusMode || !criticalTermIds) return true;

      const category = categories[stepIndex];
      if (!category) return true;

      // In focus mode, return false for categories with pending critical terms
      // This provides visual indication that this category needs attention
      return !category.terms.some(t => criticalTermIds.has(t.id));
    },
    [focusMode, criticalTermIds, categories]
  );

  return (
    <WizardContainer
      steps={categorySteps}
      activeStep={expandedCategories}
      onStepChange={handleStepChange}
      mode="accordion"
      renderStepContent={renderStepContent}
      renderStepBadge={renderStepBadge}
      renderStepActions={renderStepActions}
      canProceed={canProceed}
      testIdPrefix="terms-accordion"
      className="space-y-2"
      stepHeaderClassName="bg-white"
      scrollIntoView={true}
    />
  );
});

/**
 * Hook for managing terms category accordion state.
 * This is a convenience wrapper around useAccordionState for term categories.
 */
export function useTermsCategoryAccordion(categories: CategoryWithTerms[], initialExpanded?: string[]) {
  const stepIds = useMemo(() => categories.map(c => c.id), [categories]);

  return useAccordionState({
    stepIds,
    initialExpanded: initialExpanded ?? stepIds, // Default to all expanded
    allowMultiple: true,
  });
}

export default TermsCategoryAccordion;
