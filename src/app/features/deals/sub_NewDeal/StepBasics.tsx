'use client';

import React, { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { NewDealFormData } from '../lib/types';

interface StepBasicsProps {
  formData: NewDealFormData;
  onUpdate: (field: string, value: unknown) => void;
}

export const StepBasics = memo(function StepBasics({ formData, onUpdate }: StepBasicsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="step-basics">
      <div>
        <Label htmlFor="deal_name">Deal Name *</Label>
        <Input
          id="deal_name"
          placeholder="e.g., Project Apollo - Term Loan Facility"
          value={formData.deal_name}
          onChange={(e) => onUpdate('deal_name', e.target.value)}
          className="mt-1"
          data-testid="deal-name-input"
        />
      </div>

      <div>
        <Label htmlFor="deal_type">Deal Type *</Label>
        <Select value={formData.deal_type} onValueChange={(value) => onUpdate('deal_type', value)}>
          <SelectTrigger className="mt-1" data-testid="deal-type-select">
            <SelectValue placeholder="Select deal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new_facility" data-testid="deal-type-new-facility">New Facility</SelectItem>
            <SelectItem value="amendment" data-testid="deal-type-amendment">Amendment</SelectItem>
            <SelectItem value="refinancing" data-testid="deal-type-refinancing">Refinancing</SelectItem>
            <SelectItem value="extension" data-testid="deal-type-extension">Extension</SelectItem>
            <SelectItem value="consent" data-testid="deal-type-consent">Consent</SelectItem>
            <SelectItem value="waiver" data-testid="deal-type-waiver">Waiver</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Briefly describe the purpose of this deal..."
          value={formData.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          className="mt-1"
          rows={3}
          data-testid="deal-description-input"
        />
      </div>

      <div>
        <Label htmlFor="target_close_date">Target Close Date</Label>
        <Input
          id="target_close_date"
          type="date"
          value={formData.target_close_date}
          onChange={(e) => onUpdate('target_close_date', e.target.value)}
          className="mt-1"
          data-testid="deal-target-close-date-input"
        />
      </div>
    </div>
  );
});
