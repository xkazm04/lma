'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { DefinitionFormFields } from '../lib/types';

interface DefinitionFormProps {
  values: DefinitionFormFields;
  onChange: (field: keyof DefinitionFormFields, value: string) => void;
}

export function DefinitionForm({ values, onChange }: DefinitionFormProps) {
  return (
    <div className="space-y-4" data-testid="definition-form">
      {/* Term Name */}
      <div className="space-y-2">
        <Label htmlFor="termName">Defined Term *</Label>
        <Input
          id="termName"
          placeholder='e.g., "EBITDA" or "Material Adverse Effect"'
          value={values.termName}
          onChange={(e) => onChange('termName', e.target.value)}
          data-testid="definition-term-name-input"
        />
        <p className="text-xs text-zinc-500">
          The term being defined (will be capitalized in output)
        </p>
      </div>

      {/* Definition */}
      <div className="space-y-2">
        <Label htmlFor="definition">Definition *</Label>
        <Textarea
          id="definition"
          placeholder="Enter the meaning and scope of this defined term..."
          value={values.definition}
          onChange={(e) => onChange('definition', e.target.value)}
          rows={5}
          data-testid="definition-text-input"
        />
        <p className="text-xs text-zinc-500">
          The complete definition text. AI will format with proper legal language.
        </p>
      </div>

      {/* Related Terms */}
      <div className="space-y-2">
        <Label htmlFor="relatedTerms">Related Defined Terms (Optional)</Label>
        <Input
          id="relatedTerms"
          placeholder="e.g., Total Debt, Net Income, Consolidated"
          value={values.relatedTerms}
          onChange={(e) => onChange('relatedTerms', e.target.value)}
          data-testid="related-terms-input"
        />
        <p className="text-xs text-zinc-500">
          Comma-separated list of other defined terms referenced in this definition
        </p>
      </div>
    </div>
  );
}

export default DefinitionForm;
