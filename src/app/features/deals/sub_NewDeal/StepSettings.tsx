'use client';

import React, { memo } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioOption } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NewDealFormData } from '../lib/types';

interface StepSettingsProps {
  formData: NewDealFormData;
  onUpdate: (field: string, value: unknown) => void;
}

export const StepSettings = memo(function StepSettings({ formData, onUpdate }: StepSettingsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="step-settings">
      <div>
        <Label className="text-base font-medium">Negotiation Mode</Label>
        <p className="text-sm text-zinc-500 mb-4">Choose how participants will negotiate terms</p>

        <RadioGroup
          value={formData.negotiation_mode}
          onValueChange={(value) => onUpdate('negotiation_mode', value)}
          className="space-y-3"
          data-testid="negotiation-mode-radio-group"
        >
          <RadioOption
            value="collaborative"
            title="Collaborative"
            description="All parties can see and edit terms directly. Best for trusted relationships."
            data-testid="negotiation-mode-collaborative-option"
          />

          <RadioOption
            value="proposal_based"
            title="Proposal-Based"
            description="Changes require formal proposals that must be accepted. Better audit trail."
            data-testid="negotiation-mode-proposal-option"
          />
        </RadioGroup>
      </div>

      <Card className="bg-blue-50 border-blue-200 animate-in fade-in duration-500 delay-100" data-testid="deal-summary-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Deal Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600 space-y-1">
          <p data-testid="summary-deal-name">
            <strong>Name:</strong> {formData.deal_name || 'Not specified'}
          </p>
          <p data-testid="summary-deal-type">
            <strong>Type:</strong> {formData.deal_type.replace('_', ' ')}
          </p>
          <p data-testid="summary-import-source">
            <strong>Source:</strong>{' '}
            {formData.import_source === 'none' ? 'Starting fresh' : 'Importing from facility'}
          </p>
          <p data-testid="summary-participants-count">
            <strong>Participants:</strong> {formData.participants.length}
          </p>
          <p data-testid="summary-negotiation-mode">
            <strong>Mode:</strong> {formData.negotiation_mode.replace('_', '-')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
