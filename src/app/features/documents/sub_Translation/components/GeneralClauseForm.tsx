'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface GeneralClauseFormProps {
  values: {
    clauseTitle: string;
    structuredDataJson: string;
  };
  onChange: (field: 'clauseTitle' | 'structuredDataJson', value: string) => void;
  jsonError?: string | null;
}

export function GeneralClauseForm({ values, onChange, jsonError }: GeneralClauseFormProps) {
  return (
    <div className="space-y-4" data-testid="general-clause-form">
      {/* Clause Title */}
      <div className="space-y-2">
        <Label htmlFor="clauseTitle">Clause Title *</Label>
        <Input
          id="clauseTitle"
          placeholder="e.g., Permitted Indebtedness"
          value={values.clauseTitle}
          onChange={(e) => onChange('clauseTitle', e.target.value)}
          data-testid="general-clause-title-input"
        />
        <p className="text-xs text-zinc-500">
          A descriptive title for the clause
        </p>
      </div>

      {/* Structured Data JSON */}
      <div className="space-y-2">
        <Label htmlFor="structuredDataJson">Structured Data (JSON) *</Label>
        <Textarea
          id="structuredDataJson"
          placeholder={`{
  "field1": "value1",
  "field2": "value2",
  "numericalValue": 1000000
}`}
          value={values.structuredDataJson}
          onChange={(e) => onChange('structuredDataJson', e.target.value)}
          rows={8}
          className={jsonError ? 'border-red-300 focus:ring-red-500' : ''}
          data-testid="general-clause-json-input"
        />
        {jsonError ? (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{jsonError}</span>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Enter your structured data as valid JSON. The AI will convert this to legal clause language.
          </p>
        )}
      </div>

      {/* Example */}
      <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
        <p className="text-xs font-medium text-zinc-700 mb-2">Example JSON structure:</p>
        <pre className="text-xs text-zinc-600 overflow-x-auto">
{`{
  "type": "permitted_indebtedness",
  "baskets": [
    { "category": "working_capital", "limit": 25000000 },
    { "category": "acquisition_debt", "limit": 50000000 }
  ],
  "conditions": "Subject to pro forma compliance"
}`}
        </pre>
      </div>
    </div>
  );
}

export default GeneralClauseForm;
