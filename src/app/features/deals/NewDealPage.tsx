'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DemoCard } from '@/lib/demo-guide';
import {
  ProgressSteps,
  StepBasics,
  StepImportSource,
  StepParticipants,
  StepSettings,
  UnsavedChangesDialog,
} from './sub_NewDeal';
import { useNewDealForm, useNavigationGuard } from './lib';

export function NewDealPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  const {
    formData,
    updateForm,
    addParticipant,
    removeParticipant,
    updateParticipant,
    canProceed,
    isDirty,
    markClean,
  } = useNewDealForm();

  // Determine if form has meaningful data that would be lost
  const hasFormData = useMemo(() => {
    return (
      formData.deal_name.trim() !== '' ||
      formData.description.trim() !== '' ||
      formData.target_close_date !== '' ||
      formData.selected_facility !== '' ||
      formData.participants.some(
        (p) => p.party_name.trim() !== '' || p.email.trim() !== ''
      ) ||
      currentStep > 0
    );
  }, [formData, currentStep]);

  // Handle navigation blocked callback
  const handleNavigationBlocked = useCallback(
    (proceed: () => void, _cancel: () => void) => {
      setPendingNavigationAction(() => proceed);
      setShowUnsavedDialog(true);
    },
    []
  );

  // Use navigation guard when form has data
  const { proceed: proceedNavigation, cancel: cancelNavigation } = useNavigationGuard({
    shouldBlock: hasFormData,
    message: 'You have unsaved changes in your deal setup. If you leave now, all your progress will be lost.',
    onNavigationBlocked: handleNavigationBlocked,
  });

  // Handle dialog confirm (leave page)
  const handleDialogConfirm = useCallback(() => {
    setShowUnsavedDialog(false);
    if (pendingNavigationAction) {
      pendingNavigationAction();
      setPendingNavigationAction(null);
    } else {
      proceedNavigation();
    }
  }, [pendingNavigationAction, proceedNavigation]);

  // Handle dialog cancel (stay on page)
  const handleDialogCancel = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingNavigationAction(null);
    cancelNavigation();
  }, [cancelNavigation]);

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      markClean();
    }
  }, [currentStep, markClean]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      markClean();
    }
  }, [currentStep, markClean]);

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= currentStep) return;

      if (isDirty) {
        const confirmed = window.confirm(
          'You have unsaved changes on this step. Are you sure you want to go back? Your changes will be preserved but not validated.'
        );
        if (!confirmed) return;
      }

      setCurrentStep(stepIndex);
      markClean();
    },
    [currentStep, isDirty, markClean]
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Prepare the deal creation payload
      const dealPayload = {
        deal_name: formData.deal_name,
        deal_type: formData.deal_type,
        description: formData.description || undefined,
        target_close_date: formData.target_close_date || undefined,
        negotiation_mode: formData.negotiation_mode === 'collaborative' ? 'bilateral' : 'multilateral',
        // Include imported data if facility import was selected
        import_from_facility: formData.import_source === 'facility' && formData.imported_facility_data ? {
          facility_id: formData.imported_facility_data.facilityId,
          facility_name: formData.imported_facility_data.facilityName,
          document_id: formData.imported_facility_data.documentId,
          import_options: {
            covenants: formData.import_covenants,
            obligations: formData.import_obligations,
            esg: formData.import_esg,
          },
          terms: {
            facility_terms: formData.imported_facility_data.facilityTerms,
            covenant_terms: formData.import_covenants ? formData.imported_facility_data.covenantTerms : [],
            obligation_terms: formData.import_obligations ? formData.imported_facility_data.obligationTerms : [],
            esg_terms: formData.import_esg ? formData.imported_facility_data.esgTerms : [],
          },
        } : undefined,
        participants: formData.participants.filter(p => p.party_name.trim() !== '').map(p => ({
          party_name: p.party_name,
          party_type: p.party_type,
          party_role: p.party_role,
          deal_role: p.deal_role,
          email: p.email || undefined,
        })),
      };

      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealPayload),
      });

      const result = await response.json();

      if (result.success && result.data) {
        router.push(`/deals/${result.data.id}`);
      } else {
        console.error('Error creating deal:', result.error);
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Error creating deal:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, router]);

  // Handle the header back button click with confirmation
  const handleGoBack = useCallback(() => {
    if (hasFormData) {
      setPendingNavigationAction(() => () => router.back());
      setShowUnsavedDialog(true);
    } else {
      router.back();
    }
  }, [hasFormData, router]);

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="new-deal-page">
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />

      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          data-testid="new-deal-go-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Create New Deal</h1>
          <p className="text-zinc-500">Set up a new negotiation workspace</p>
        </div>
      </div>

      <ProgressSteps currentStep={currentStep} onStepClick={handleStepClick} />

      <DemoCard sectionId="deal-wizard" fullWidth>
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardContent className="pt-6">
            {currentStep === 0 && (
              <StepBasics formData={formData} onUpdate={updateForm} />
            )}
            {currentStep === 1 && (
              <StepImportSource formData={formData} onUpdate={updateForm} />
            )}
            {currentStep === 2 && (
              <StepParticipants
                formData={formData}
                onUpdate={updateForm}
                onAddParticipant={addParticipant}
                onRemoveParticipant={removeParticipant}
                onUpdateParticipant={updateParticipant}
              />
            )}
            {currentStep === 3 && (
              <StepSettings formData={formData} onUpdate={updateForm} />
            )}
          </CardContent>
        </Card>
      </DemoCard>

      <div className="flex items-center justify-between animate-in fade-in duration-500 delay-300">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          data-testid="new-deal-back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-2">
          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed(currentStep)}
              data-testid="new-deal-next-btn"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed(currentStep) || isSubmitting}
              data-testid="new-deal-create-btn"
            >
              {isSubmitting ? 'Creating...' : 'Create Deal'}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
