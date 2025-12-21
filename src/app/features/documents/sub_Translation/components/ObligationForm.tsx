'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  OBLIGATION_TYPES,
  REPORTING_FREQUENCIES,
  type ObligationFormFields,
} from '../lib/types';

interface ObligationFormProps {
  values: ObligationFormFields;
  onChange: (field: keyof ObligationFormFields, value: string) => void;
}

export function ObligationForm({ values, onChange }: ObligationFormProps) {
  return (
    <div className="space-y-4" data-testid="obligation-form">
      {/* Obligation Type */}
      <div className="space-y-2">
        <Label htmlFor="obligationType">Obligation Type *</Label>
        <Select
          value={values.obligationType}
          onValueChange={(value) => onChange('obligationType', value)}
        >
          <SelectTrigger id="obligationType" data-testid="obligation-type-select">
            <SelectValue placeholder="Select obligation type" />
          </SelectTrigger>
          <SelectContent>
            {OBLIGATION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what must be delivered..."
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          data-testid="obligation-description-input"
        />
        <p className="text-xs text-zinc-500">
          Detailed description of the deliverable requirement
        </p>
      </div>

      {/* Frequency and Deadline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Reporting Frequency</Label>
          <Select
            value={values.frequency}
            onValueChange={(value) => onChange('frequency', value)}
          >
            <SelectTrigger id="frequency" data-testid="frequency-select">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {REPORTING_FREQUENCIES.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadlineDays">Deadline (Days After Period End)</Label>
          <Input
            id="deadlineDays"
            type="number"
            placeholder="e.g., 45"
            value={values.deadlineDays}
            onChange={(e) => onChange('deadlineDays', e.target.value)}
            data-testid="deadline-days-input"
          />
          <p className="text-xs text-zinc-500">
            Number of days after period end to submit
          </p>
        </div>
      </div>

      {/* Recipient */}
      <div className="space-y-2">
        <Label htmlFor="recipientRole">Recipient</Label>
        <Input
          id="recipientRole"
          placeholder="e.g., Administrative Agent"
          value={values.recipientRole}
          onChange={(e) => onChange('recipientRole', e.target.value)}
          data-testid="recipient-role-input"
        />
        <p className="text-xs text-zinc-500">
          Who should receive the deliverable
        </p>
      </div>
    </div>
  );
}

export default ObligationForm;
