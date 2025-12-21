'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  COVENANT_TYPES,
  THRESHOLD_TYPES,
  TESTING_FREQUENCIES,
  type CovenantFormFields,
} from '../lib/types';

interface CovenantFormProps {
  values: CovenantFormFields;
  onChange: (field: keyof CovenantFormFields, value: string) => void;
}

export function CovenantForm({ values, onChange }: CovenantFormProps) {
  return (
    <div className="space-y-4" data-testid="covenant-form">
      {/* Covenant Name */}
      <div className="space-y-2">
        <Label htmlFor="covenantName">Covenant Name *</Label>
        <Input
          id="covenantName"
          placeholder="e.g., Maximum Leverage Ratio"
          value={values.covenantName}
          onChange={(e) => onChange('covenantName', e.target.value)}
          data-testid="covenant-name-input"
        />
      </div>

      {/* Covenant Type and Threshold Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="covenantType">Covenant Type *</Label>
          <Select
            value={values.covenantType}
            onValueChange={(value) => onChange('covenantType', value)}
          >
            <SelectTrigger id="covenantType" data-testid="covenant-type-select">
              <SelectValue placeholder="Select covenant type" />
            </SelectTrigger>
            <SelectContent>
              {COVENANT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thresholdType">Threshold Type *</Label>
          <Select
            value={values.thresholdType}
            onValueChange={(value) => onChange('thresholdType', value as 'maximum' | 'minimum' | 'range')}
          >
            <SelectTrigger id="thresholdType" data-testid="threshold-type-select">
              <SelectValue placeholder="Select threshold type" />
            </SelectTrigger>
            <SelectContent>
              {THRESHOLD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Threshold Value and Testing Frequency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="thresholdValue">Threshold Value</Label>
          <Input
            id="thresholdValue"
            placeholder="e.g., 4.50 or 3.00"
            value={values.thresholdValue}
            onChange={(e) => onChange('thresholdValue', e.target.value)}
            data-testid="threshold-value-input"
          />
          <p className="text-xs text-zinc-500">
            Enter the ratio or numeric value (e.g., 4.50 for 4.50:1.00)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="testingFrequency">Testing Frequency</Label>
          <Select
            value={values.testingFrequency}
            onValueChange={(value) => onChange('testingFrequency', value)}
          >
            <SelectTrigger id="testingFrequency" data-testid="testing-frequency-select">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {TESTING_FREQUENCIES.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Numerator and Denominator Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numeratorDefinition">Numerator Definition</Label>
          <Textarea
            id="numeratorDefinition"
            placeholder="e.g., Total Funded Debt"
            value={values.numeratorDefinition}
            onChange={(e) => onChange('numeratorDefinition', e.target.value)}
            rows={2}
            data-testid="numerator-definition-input"
          />
          <p className="text-xs text-zinc-500">
            Define the numerator of the ratio calculation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="denominatorDefinition">Denominator Definition</Label>
          <Textarea
            id="denominatorDefinition"
            placeholder="e.g., Consolidated EBITDA"
            value={values.denominatorDefinition}
            onChange={(e) => onChange('denominatorDefinition', e.target.value)}
            rows={2}
            data-testid="denominator-definition-input"
          />
          <p className="text-xs text-zinc-500">
            Define the denominator of the ratio calculation
          </p>
        </div>
      </div>
    </div>
  );
}

export default CovenantForm;
