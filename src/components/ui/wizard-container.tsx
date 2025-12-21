'use client';

import React, { memo, useCallback, useRef, useEffect } from 'react';
import { Check, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface WizardStep<TData = unknown> {
  /** Unique identifier for the step */
  id: string;
  /** Display label for the step */
  label: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional description/subtitle */
  description?: string;
  /** Step-specific data */
  data?: TData;
}

export type WizardMode = 'linear' | 'accordion' | 'focus';

export interface WizardContainerProps<TStep extends WizardStep> {
  /** Array of steps to display */
  steps: TStep[];
  /** Current active step index (linear mode) or array of expanded step IDs (accordion mode) */
  activeStep: number | string[];
  /** Called when the active step changes */
  onStepChange: (step: number | string[]) => void;
  /** Mode of operation: 'linear' for wizard, 'accordion' for collapsible sections, 'focus' for single-step focus mode */
  mode: WizardMode;
  /** Function to render step content */
  renderStepContent: (step: TStep, index: number, isActive: boolean) => React.ReactNode;
  /** Optional function to validate if a step can proceed (returns true if valid) */
  canProceed?: (stepIndex: number) => boolean;
  /** Optional function to render step header badge/status */
  renderStepBadge?: (step: TStep, index: number) => React.ReactNode;
  /** Optional function to render step header right side content */
  renderStepActions?: (step: TStep, index: number) => React.ReactNode;
  /** Whether to show step connectors (linear mode) */
  showConnectors?: boolean;
  /** Whether to allow clicking on completed steps to navigate back (linear mode) */
  allowStepClick?: boolean;
  /** Whether to show step numbers */
  showStepNumbers?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for step headers */
  stepHeaderClassName?: string;
  /** Custom class name for step content */
  stepContentClassName?: string;
  /** Test ID prefix for automated testing */
  testIdPrefix?: string;
  /** Scroll selected step into view */
  scrollIntoView?: boolean;
}

// ============================================================================
// Utility hooks
// ============================================================================

function useScrollIntoView(shouldScroll: boolean, activeStep: number | string[]) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScroll && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [shouldScroll, activeStep]);

  return activeRef;
}

// ============================================================================
// Linear Mode Component (Wizard Steps)
// ============================================================================

interface LinearWizardProps<TStep extends WizardStep> extends Omit<WizardContainerProps<TStep>, 'activeStep' | 'onStepChange' | 'mode'> {
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

const LinearWizard = memo(function LinearWizard<TStep extends WizardStep>({
  steps,
  currentStep,
  onStepClick,
  renderStepContent,
  canProceed,
  renderStepBadge,
  showConnectors = true,
  allowStepClick = true,
  showStepNumbers = false,
  className,
  stepHeaderClassName,
  stepContentClassName,
  testIdPrefix = 'wizard',
  scrollIntoView: shouldScrollIntoView = false,
}: LinearWizardProps<TStep>) {
  const activeRef = useScrollIntoView(shouldScrollIntoView, currentStep);

  const handleStepClick = useCallback(
    (index: number, isCompleted: boolean) => {
      if (allowStepClick && isCompleted && onStepClick) {
        onStepClick(index);
      }
    },
    [allowStepClick, onStepClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number, isCompleted: boolean) => {
      if ((e.key === 'Enter' || e.key === ' ') && allowStepClick && isCompleted && onStepClick) {
        e.preventDefault();
        onStepClick(index);
      }
    },
    [allowStepClick, onStepClick]
  );

  return (
    <div className={cn('space-y-4', className)} data-testid={`${testIdPrefix}-container`}>
      {/* Step indicators */}
      <div
        className="flex items-center justify-between"
        data-testid={`${testIdPrefix}-steps`}
        role="tablist"
        aria-label="Wizard steps"
      >
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isFuture = index > currentStep;
          const isClickable = allowStepClick && isCompleted && !!onStepClick;
          const isValid = canProceed ? canProceed(index) : true;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => handleStepClick(index, isCompleted)}
                onKeyDown={(e) => handleKeyDown(e, index, isCompleted)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 transition-all duration-300',
                  isActive && 'text-blue-600',
                  isCompleted && 'text-green-600',
                  !isActive && !isCompleted && 'text-zinc-400',
                  isClickable && 'cursor-pointer hover:scale-105',
                  isFuture && 'cursor-not-allowed opacity-50',
                  !isClickable && !isFuture && 'cursor-default',
                  stepHeaderClassName
                )}
                data-testid={`${testIdPrefix}-step-${step.id}`}
                data-active={isActive}
                data-completed={isCompleted}
                data-clickable={isClickable}
                data-valid={isValid}
                role="tab"
                aria-selected={isActive}
                aria-disabled={isFuture}
                tabIndex={isActive ? 0 : -1}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    isActive && 'bg-blue-100',
                    isCompleted && 'bg-green-100',
                    !isActive && !isCompleted && 'bg-zinc-100',
                    isClickable && 'group-hover:ring-2 group-hover:ring-green-300'
                  )}
                  data-testid={`${testIdPrefix}-step-icon-${step.id}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : showStepNumbers ? (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  ) : Icon ? (
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className="font-medium hidden sm:inline">{step.label}</span>
                {renderStepBadge?.(step, index)}
              </button>
              {showConnectors && index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors duration-300',
                    index < currentStep ? 'bg-green-500' : 'bg-zinc-200'
                  )}
                  data-testid={`${testIdPrefix}-connector-${index}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active step content */}
      <div
        ref={activeRef}
        className={cn('animate-in fade-in duration-300', stepContentClassName)}
        data-testid={`${testIdPrefix}-content`}
        role="tabpanel"
        aria-labelledby={`${testIdPrefix}-step-${steps[currentStep]?.id}`}
      >
        {steps[currentStep] && renderStepContent(steps[currentStep], currentStep, true)}
      </div>
    </div>
  );
}) as <TStep extends WizardStep>(props: LinearWizardProps<TStep>) => React.ReactElement;

// ============================================================================
// Accordion Mode Component (Collapsible Sections)
// ============================================================================

interface AccordionWizardProps<TStep extends WizardStep> extends Omit<WizardContainerProps<TStep>, 'activeStep' | 'onStepChange' | 'mode'> {
  expandedSteps: string[];
  onToggle: (stepId: string) => void;
  /** Selected item within a step (for nested selection like terms) */
  selectedItem?: string | null;
  /** Called when an item within a step is selected */
  onSelectItem?: (itemId: string) => void;
}

const AccordionWizard = memo(function AccordionWizard<TStep extends WizardStep>({
  steps,
  expandedSteps,
  onToggle,
  renderStepContent,
  canProceed,
  renderStepBadge,
  renderStepActions,
  showStepNumbers = false,
  className,
  stepHeaderClassName,
  stepContentClassName,
  testIdPrefix = 'wizard',
  scrollIntoView: shouldScrollIntoView = false,
}: AccordionWizardProps<TStep>) {
  const activeRef = useScrollIntoView(shouldScrollIntoView, expandedSteps);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, stepId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(stepId);
      }
    },
    [onToggle]
  );

  return (
    <div className={cn('space-y-2', className)} data-testid={`${testIdPrefix}-container`}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isExpanded = expandedSteps.includes(step.id);
        const isValid = canProceed ? canProceed(index) : true;

        return (
          <div
            key={step.id}
            ref={isExpanded ? activeRef : null}
            className="border rounded-lg overflow-hidden bg-white"
            data-testid={`${testIdPrefix}-section-${step.id}`}
            data-expanded={isExpanded}
            data-valid={isValid}
          >
            {/* Section header */}
            <button
              type="button"
              onClick={() => onToggle(step.id)}
              onKeyDown={(e) => handleKeyDown(e, step.id)}
              className={cn(
                'w-full py-3 px-4 flex items-center justify-between',
                'cursor-pointer hover:bg-zinc-50 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
                stepHeaderClassName
              )}
              data-testid={`${testIdPrefix}-header-${step.id}`}
              aria-expanded={isExpanded}
              aria-controls={`${testIdPrefix}-content-${step.id}`}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
                )}
                {showStepNumbers && (
                  <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-600">
                    {index + 1}
                  </span>
                )}
                {Icon && <Icon className="w-4 h-4 text-zinc-500" aria-hidden="true" />}
                <span className="font-semibold text-sm text-zinc-900">{step.label}</span>
                {step.description && (
                  <span className="text-xs text-zinc-500 hidden sm:inline">{step.description}</span>
                )}
                {renderStepBadge?.(step, index)}
              </div>
              <div className="flex items-center gap-2">
                {renderStepActions?.(step, index)}
              </div>
            </button>

            {/* Section content */}
            {isExpanded && (
              <div
                id={`${testIdPrefix}-content-${step.id}`}
                className={cn('px-4 pb-3 animate-in fade-in slide-in-from-top-2 duration-200', stepContentClassName)}
                data-testid={`${testIdPrefix}-content-${step.id}`}
                role="region"
                aria-labelledby={`${testIdPrefix}-header-${step.id}`}
              >
                {renderStepContent(step, index, true)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}) as <TStep extends WizardStep>(props: AccordionWizardProps<TStep>) => React.ReactElement;

// ============================================================================
// Focus Mode Component (Single Step Focus)
// ============================================================================

interface FocusWizardProps<TStep extends WizardStep> extends Omit<WizardContainerProps<TStep>, 'activeStep' | 'onStepChange' | 'mode'> {
  currentStep: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onExit?: () => void;
}

const FocusWizard = memo(function FocusWizard<TStep extends WizardStep>({
  steps,
  currentStep,
  onNext,
  onPrevious,
  onExit,
  renderStepContent,
  canProceed,
  renderStepBadge,
  className,
  stepContentClassName,
  testIdPrefix = 'wizard',
}: FocusWizardProps<TStep>) {
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const isValid = canProceed ? canProceed(currentStep) : true;

  if (!step) return null;

  return (
    <div
      className={cn('relative', className)}
      data-testid={`${testIdPrefix}-focus-container`}
      data-step={currentStep}
      data-valid={isValid}
    >
      {/* Progress indicator */}
      <div className="mb-4 flex items-center justify-between" data-testid={`${testIdPrefix}-focus-progress`}>
        <span className="text-sm text-zinc-500">
          Step {currentStep + 1} of {steps.length}
        </span>
        <div className="flex-1 mx-4 h-1 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        {renderStepBadge?.(step, currentStep)}
      </div>

      {/* Step header */}
      <div className="mb-4" data-testid={`${testIdPrefix}-focus-header`}>
        <h3 className="text-lg font-semibold text-zinc-900">{step.label}</h3>
        {step.description && (
          <p className="text-sm text-zinc-500 mt-1">{step.description}</p>
        )}
      </div>

      {/* Step content */}
      <div
        className={cn('animate-in fade-in duration-300', stepContentClassName)}
        data-testid={`${testIdPrefix}-focus-content`}
      >
        {renderStepContent(step, currentStep, true)}
      </div>

      {/* Navigation */}
      <div
        className="mt-6 flex items-center justify-between"
        data-testid={`${testIdPrefix}-focus-nav`}
      >
        <button
          type="button"
          onClick={isFirst ? onExit : onPrevious}
          className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          data-testid={`${testIdPrefix}-focus-back-btn`}
        >
          {isFirst ? 'Exit' : 'Previous'}
        </button>
        <button
          type="button"
          onClick={isLast ? onExit : onNext}
          disabled={!isValid && !isLast}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            isValid || isLast
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
          )}
          data-testid={`${testIdPrefix}-focus-next-btn`}
        >
          {isLast ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}) as <TStep extends WizardStep>(props: FocusWizardProps<TStep>) => React.ReactElement;

// ============================================================================
// Main WizardContainer Component
// ============================================================================

function WizardContainerImpl<TStep extends WizardStep>(
  props: WizardContainerProps<TStep>
): React.ReactElement {
  const { mode, activeStep, onStepChange, ...rest } = props;

  if (mode === 'linear') {
    const currentStep = typeof activeStep === 'number' ? activeStep : 0;
    return (
      <LinearWizard
        {...rest}
        currentStep={currentStep}
        onStepClick={(index) => onStepChange(index)}
      />
    );
  }

  if (mode === 'accordion') {
    const expandedSteps = Array.isArray(activeStep) ? activeStep : [];
    return (
      <AccordionWizard
        {...rest}
        expandedSteps={expandedSteps}
        onToggle={(stepId) => {
          const newExpanded = expandedSteps.includes(stepId)
            ? expandedSteps.filter((id) => id !== stepId)
            : [...expandedSteps, stepId];
          onStepChange(newExpanded);
        }}
      />
    );
  }

  if (mode === 'focus') {
    const currentStep = typeof activeStep === 'number' ? activeStep : 0;
    return (
      <FocusWizard
        {...rest}
        currentStep={currentStep}
        onNext={() => onStepChange(currentStep + 1)}
        onPrevious={() => onStepChange(currentStep - 1)}
        onExit={() => onStepChange(-1)}
      />
    );
  }

  return <div>Invalid wizard mode</div>;
}

export const WizardContainer = memo(WizardContainerImpl) as typeof WizardContainerImpl;

// ============================================================================
// Hook for managing wizard state
// ============================================================================

export interface UseWizardStateOptions {
  totalSteps: number;
  initialStep?: number;
  canProceed?: (step: number) => boolean;
}

export interface UseWizardStateReturn {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  next: () => void;
  previous: () => void;
  goToStep: (step: number) => void;
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number;
}

export function useWizardState({
  totalSteps,
  initialStep = 0,
  canProceed,
}: UseWizardStateOptions): UseWizardStateReturn {
  const [currentStep, setCurrentStep] = React.useState(initialStep);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const canGoNext = canProceed ? canProceed(currentStep) && !isLast : !isLast;
  const canGoPrevious = !isFirst;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const next = useCallback(() => {
    if (canGoNext) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  }, [canGoNext, totalSteps]);

  const previous = useCallback(() => {
    if (canGoPrevious) {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  }, [canGoPrevious]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps && step < currentStep) {
        setCurrentStep(step);
      }
    },
    [currentStep, totalSteps]
  );

  return {
    currentStep,
    setCurrentStep,
    next,
    previous,
    goToStep,
    isFirst,
    isLast,
    canGoNext,
    canGoPrevious,
    progress,
  };
}

// ============================================================================
// Hook for managing accordion state
// ============================================================================

export interface UseAccordionStateOptions {
  stepIds: string[];
  initialExpanded?: string[];
  allowMultiple?: boolean;
}

export interface UseAccordionStateReturn {
  expandedSteps: string[];
  toggle: (stepId: string) => void;
  expand: (stepId: string) => void;
  collapse: (stepId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  isExpanded: (stepId: string) => boolean;
}

export function useAccordionState({
  stepIds,
  initialExpanded = [],
  allowMultiple = true,
}: UseAccordionStateOptions): UseAccordionStateReturn {
  const [expandedSteps, setExpandedSteps] = React.useState<string[]>(initialExpanded);

  const toggle = useCallback(
    (stepId: string) => {
      setExpandedSteps((prev) => {
        if (prev.includes(stepId)) {
          return prev.filter((id) => id !== stepId);
        }
        return allowMultiple ? [...prev, stepId] : [stepId];
      });
    },
    [allowMultiple]
  );

  const expand = useCallback(
    (stepId: string) => {
      setExpandedSteps((prev) => {
        if (prev.includes(stepId)) return prev;
        return allowMultiple ? [...prev, stepId] : [stepId];
      });
    },
    [allowMultiple]
  );

  const collapse = useCallback((stepId: string) => {
    setExpandedSteps((prev) => prev.filter((id) => id !== stepId));
  }, []);

  const expandAll = useCallback(() => {
    if (allowMultiple) {
      setExpandedSteps(stepIds);
    }
  }, [allowMultiple, stepIds]);

  const collapseAll = useCallback(() => {
    setExpandedSteps([]);
  }, []);

  const isExpanded = useCallback(
    (stepId: string) => expandedSteps.includes(stepId),
    [expandedSteps]
  );

  return {
    expandedSteps,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    isExpanded,
  };
}

export default WizardContainer;
