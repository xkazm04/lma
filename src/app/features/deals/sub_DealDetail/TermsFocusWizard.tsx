'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Check, X, Focus } from 'lucide-react';
import { WizardContainer, useWizardState, type WizardStep } from '@/components/ui/wizard-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CategoryWithTerms } from '../lib/types';
import type { TermDependencyGraph } from '../lib/term-dependency-graph';
import { TermsCategory } from './TermsCategory';

/**
 * FocusStep represents a category in focus wizard mode.
 */
interface FocusStep extends WizardStep<CategoryWithTerms> {
  id: string;
  label: string;
  description: string;
  data: CategoryWithTerms;
  pendingCount: number;
  agreedCount: number;
  totalCount: number;
}

interface TermsFocusWizardProps {
  /** Array of categories with their terms */
  categories: CategoryWithTerms[];
  /** Currently selected term ID */
  selectedTerm: string | null;
  /** Called when a term is selected */
  onSelectTerm: (termId: string) => void;
  /** Called when focus mode is exited */
  onExit: () => void;
  /** Optional dependency graph for showing term relationships */
  dependencyGraph?: TermDependencyGraph;
  /** Called when user clicks on a dependency indicator */
  onShowDependencies?: (termId: string) => void;
  /** Initial category index to start from */
  initialCategoryIndex?: number;
}

/**
 * TermsFocusWizard provides a "wizard mode" for term negotiation where users
 * step through categories one at a time. This demonstrates how the WizardContainer
 * pattern can power focused negotiation workflows.
 *
 * Key features:
 * - Linear progression through categories
 * - Progress tracking per category
 * - Visual indication of category completion
 * - Full-screen focus on one category at a time
 */
export const TermsFocusWizard = memo(function TermsFocusWizard({
  categories,
  selectedTerm,
  onSelectTerm,
  onExit,
  dependencyGraph,
  onShowDependencies,
  initialCategoryIndex = 0,
}: TermsFocusWizardProps) {
  // Convert categories to focus wizard steps
  const focusSteps: FocusStep[] = useMemo(() => {
    return categories.map((category) => {
      const agreedCount = category.terms.filter(
        t => t.negotiation_status === 'agreed' || t.negotiation_status === 'locked'
      ).length;
      const pendingCount = category.terms.filter(t => t.pending_proposals_count > 0).length;

      return {
        id: category.id,
        label: category.name,
        description: `${agreedCount}/${category.terms.length} terms agreed`,
        data: category,
        pendingCount,
        agreedCount,
        totalCount: category.terms.length,
      };
    });
  }, [categories]);

  // Use wizard state hook
  const wizard = useWizardState({
    totalSteps: focusSteps.length,
    initialStep: initialCategoryIndex,
    canProceed: () => {
      // Can always proceed, but we track progress
      return true;
    },
  });

  const currentCategory = focusSteps[wizard.currentStep]?.data;
  const currentProgress = focusSteps[wizard.currentStep];

  // Handle step change
  const handleStepChange = useCallback(
    (step: number | string[]) => {
      if (typeof step === 'number') {
        if (step === -1) {
          onExit();
        } else {
          wizard.setCurrentStep(step);
        }
      }
    },
    [wizard, onExit]
  );

  // Render progress badge for each step
  const renderStepBadge = useCallback(
    (step: FocusStep) => {
      const progressPercent = step.totalCount > 0
        ? Math.round((step.agreedCount / step.totalCount) * 100)
        : 0;

      if (progressPercent === 100) {
        return (
          <Badge className="bg-green-100 text-green-700">
            <Check className="w-3 h-3 mr-1" aria-hidden="true" />
            Complete
          </Badge>
        );
      }

      if (step.pendingCount > 0) {
        return (
          <Badge className="bg-amber-100 text-amber-700">
            {step.pendingCount} pending
          </Badge>
        );
      }

      return (
        <Badge variant="outline">
          {progressPercent}%
        </Badge>
      );
    },
    []
  );

  // Render step content using accordion-item mode since wizard handles container
  const renderStepContent = useCallback(
    (step: FocusStep, index: number) => {
      return (
        <TermsCategory
          category={step.data}
          selectedTerm={selectedTerm}
          onSelectTerm={onSelectTerm}
          categoryIndex={index}
          dependencyGraph={dependencyGraph}
          onShowDependencies={onShowDependencies}
          renderMode="accordion-item"
        />
      );
    },
    [selectedTerm, onSelectTerm, dependencyGraph, onShowDependencies]
  );

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const totalTerms = focusSteps.reduce((sum, s) => sum + s.totalCount, 0);
    const agreedTerms = focusSteps.reduce((sum, s) => sum + s.agreedCount, 0);
    return totalTerms > 0 ? Math.round((agreedTerms / totalTerms) * 100) : 0;
  }, [focusSteps]);

  return (
    <div
      className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col"
      data-testid="terms-focus-wizard"
    >
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onExit}
                data-testid="focus-wizard-exit-btn"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Focus className="w-5 h-5 text-blue-600" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-zinc-900">Focus Mode</h2>
              </div>
            </div>

            {/* Overall progress */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-600">
                Overall: <span className="font-medium">{overallProgress}%</span> agreed
              </div>
              <Progress value={overallProgress} className="w-32 h-2" />
            </div>
          </div>

          {/* Step indicators */}
          <div className="mt-4">
            <WizardContainer
              steps={focusSteps}
              activeStep={wizard.currentStep}
              onStepChange={handleStepChange}
              mode="linear"
              renderStepContent={() => null}
              renderStepBadge={renderStepBadge}
              showConnectors={true}
              allowStepClick={true}
              testIdPrefix="focus-step"
              className="!space-y-0"
              stepContentClassName="hidden"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {currentCategory && currentProgress && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Category header */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{currentCategory.name}</CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-600">
                        {currentProgress.agreedCount} of {currentProgress.totalCount} terms agreed
                      </span>
                      <Progress
                        value={(currentProgress.agreedCount / currentProgress.totalCount) * 100}
                        className="w-24 h-2"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-zinc-600">
                    Review and negotiate terms in this category. Progress to the next category when ready.
                  </p>
                </CardContent>
              </Card>

              {/* Terms list */}
              <Card>
                <CardContent className="pt-4">
                  {renderStepContent(currentProgress, wizard.currentStep)}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="border-t bg-white shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={wizard.previous}
              disabled={wizard.isFirst}
              data-testid="focus-wizard-prev-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Category
            </Button>

            <div className="text-sm text-zinc-500">
              Category {wizard.currentStep + 1} of {focusSteps.length}
            </div>

            {wizard.isLast ? (
              <Button onClick={onExit} data-testid="focus-wizard-complete-btn">
                <Check className="w-4 h-4 mr-2" />
                Complete Focus Mode
              </Button>
            ) : (
              <Button onClick={wizard.next} data-testid="focus-wizard-next-btn">
                Next Category
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default TermsFocusWizard;
