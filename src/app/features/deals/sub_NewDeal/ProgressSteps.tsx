'use client';

import React, { memo, useCallback } from 'react';
import { FileText, Upload, Users, Settings } from 'lucide-react';
import { WizardContainer, type WizardStep } from '@/components/ui/wizard-container';

// Define wizard steps with icons
const WIZARD_STEPS: WizardStep[] = [
  { id: 'basics', label: 'Deal Basics', icon: FileText },
  { id: 'source', label: 'Import Terms', icon: Upload },
  { id: 'participants', label: 'Participants', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface ProgressStepsProps {
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  /** Optional validation function for each step */
  canProceed?: (stepIndex: number) => boolean;
}

export const ProgressSteps = memo(function ProgressSteps({
  currentStep,
  onStepClick,
  canProceed,
}: ProgressStepsProps) {
  // Handle step change from WizardContainer
  const handleStepChange = useCallback(
    (step: number | string[]) => {
      if (typeof step === 'number' && onStepClick) {
        onStepClick(step);
      }
    },
    [onStepClick]
  );

  // Render step content (not used in header-only mode, but required by WizardContainer)
  const renderStepContent = useCallback(
    () => null,
    []
  );

  return (
    <div
      className="animate-in fade-in slide-in-from-top-4 duration-500 delay-100"
      data-testid="progress-steps"
    >
      <WizardContainer
        steps={WIZARD_STEPS}
        activeStep={currentStep}
        onStepChange={handleStepChange}
        mode="linear"
        renderStepContent={renderStepContent}
        canProceed={canProceed}
        showConnectors={true}
        allowStepClick={!!onStepClick}
        testIdPrefix="progress"
        className="!space-y-0"
        stepContentClassName="hidden"
      />
    </div>
  );
});

// Export steps for external use
export { WIZARD_STEPS };
export type { WizardStep };
