'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  FACILITY_TERM_TYPES,
  type FacilityTermFormFields,
} from '../lib/types';

interface FacilityTermFormProps {
  values: FacilityTermFormFields;
  onChange: (field: keyof FacilityTermFormFields, value: string) => void;
}

export function FacilityTermForm({ values, onChange }: FacilityTermFormProps) {
  return (
    <div className="space-y-4" data-testid="facility-term-form">
      {/* Term Name */}
      <div className="space-y-2">
        <Label htmlFor="termName">Term Name *</Label>
        <Input
          id="termName"
          placeholder='e.g., "Total Commitments" or "Applicable Margin"'
          value={values.termName}
          onChange={(e) => onChange('termName', e.target.value)}
          data-testid="term-name-input"
        />
        <p className="text-xs text-zinc-500">
          The defined term or provision name
        </p>
      </div>

      {/* Term Type */}
      <div className="space-y-2">
        <Label htmlFor="termType">Term Category *</Label>
        <Select
          value={values.termType}
          onValueChange={(value) => onChange('termType', value)}
        >
          <SelectTrigger id="termType" data-testid="term-type-select">
            <SelectValue placeholder="Select term category" />
          </SelectTrigger>
          <SelectContent>
            {FACILITY_TERM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Term Value */}
      <div className="space-y-2">
        <Label htmlFor="termValue">Value / Definition *</Label>
        <Textarea
          id="termValue"
          placeholder="e.g., $500,000,000 or SOFR plus 3.25%"
          value={values.termValue}
          onChange={(e) => onChange('termValue', e.target.value)}
          rows={3}
          data-testid="term-value-input"
        />
        <p className="text-xs text-zinc-500">
          The value or definition for this term
        </p>
      </div>
    </div>
  );
}

export default FacilityTermForm;
