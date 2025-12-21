'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, FileText, Scale, Settings } from 'lucide-react';
import { GOVERNING_LAWS, FORMALITY_LEVELS, type FormalityLevel } from '../lib/types';

interface DocumentContextFormProps {
  context: {
    borrowerName: string;
    facilityName: string;
    governingLaw: string;
  };
  formatOptions: {
    includeNumbering: boolean;
    useDefinedTerms: boolean;
    includeCrossReferences: boolean;
    formalityLevel: FormalityLevel;
  };
  onContextChange: (field: 'borrowerName' | 'facilityName' | 'governingLaw', value: string) => void;
  onFormatChange: (field: keyof DocumentContextFormProps['formatOptions'], value: boolean | FormalityLevel) => void;
}

export function DocumentContextForm({
  context,
  formatOptions,
  onContextChange,
  onFormatChange,
}: DocumentContextFormProps) {
  return (
    <div className="space-y-4" data-testid="document-context-form">
      {/* Document Context Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-500" />
            Document Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="borrowerName" className="text-xs">Borrower Name</Label>
              <Input
                id="borrowerName"
                placeholder="e.g., Acme Corporation"
                value={context.borrowerName}
                onChange={(e) => onContextChange('borrowerName', e.target.value)}
                className="h-9 text-sm"
                data-testid="borrower-name-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facilityName" className="text-xs">Facility Name</Label>
              <Input
                id="facilityName"
                placeholder="e.g., Senior Secured Term Loan"
                value={context.facilityName}
                onChange={(e) => onContextChange('facilityName', e.target.value)}
                className="h-9 text-sm"
                data-testid="facility-name-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="governingLaw" className="text-xs">Governing Law</Label>
              <Select
                value={context.governingLaw}
                onValueChange={(value) => onContextChange('governingLaw', value)}
              >
                <SelectTrigger id="governingLaw" className="h-9 text-sm" data-testid="governing-law-select">
                  <SelectValue placeholder="Select law" />
                </SelectTrigger>
                <SelectContent>
                  {GOVERNING_LAWS.map((law) => (
                    <SelectItem key={law.value} value={law.value}>
                      {law.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Options Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4 text-zinc-500" />
            Formatting Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="formalityLevel" className="text-xs">Formality Level</Label>
            <Select
              value={formatOptions.formalityLevel}
              onValueChange={(value) => onFormatChange('formalityLevel', value as FormalityLevel)}
            >
              <SelectTrigger id="formalityLevel" className="h-9 text-sm" data-testid="formality-level-select">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {FORMALITY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeNumbering"
                checked={formatOptions.includeNumbering}
                onCheckedChange={(checked) => onFormatChange('includeNumbering', !!checked)}
                data-testid="include-numbering-checkbox"
              />
              <Label htmlFor="includeNumbering" className="text-xs cursor-pointer">
                Include section numbering
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="useDefinedTerms"
                checked={formatOptions.useDefinedTerms}
                onCheckedChange={(checked) => onFormatChange('useDefinedTerms', !!checked)}
                data-testid="use-defined-terms-checkbox"
              />
              <Label htmlFor="useDefinedTerms" className="text-xs cursor-pointer">
                Capitalize defined terms
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCrossReferences"
                checked={formatOptions.includeCrossReferences}
                onCheckedChange={(checked) => onFormatChange('includeCrossReferences', !!checked)}
                data-testid="include-cross-refs-checkbox"
              />
              <Label htmlFor="includeCrossReferences" className="text-xs cursor-pointer">
                Include cross-references
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DocumentContextForm;
