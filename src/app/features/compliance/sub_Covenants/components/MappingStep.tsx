'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { ColumnMapping, RawImportRow } from '../lib/bulk-import-types';

interface MappingStepProps {
  headers: string[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  sampleData: RawImportRow[];
  onBack: () => void;
  onNext: () => void;
  isProcessing: boolean;
}

const FIELD_DEFINITIONS: {
  key: keyof ColumnMapping;
  label: string;
  description: string;
  required: boolean;
}[] = [
  {
    key: 'covenantId',
    label: 'Covenant ID',
    description: 'Unique identifier for the covenant',
    required: false,
  },
  {
    key: 'facilityId',
    label: 'Facility ID',
    description: 'Unique identifier for the facility',
    required: false,
  },
  {
    key: 'facilityName',
    label: 'Facility Name',
    description: 'Name of the loan facility',
    required: false,
  },
  {
    key: 'covenantName',
    label: 'Covenant Name',
    description: 'Name of the covenant (e.g., Leverage Ratio)',
    required: false,
  },
  {
    key: 'covenantType',
    label: 'Covenant Type',
    description: 'Type of covenant (e.g., leverage_ratio)',
    required: false,
  },
  {
    key: 'testDate',
    label: 'Test Date',
    description: 'Date of the covenant test',
    required: true,
  },
  {
    key: 'calculatedValue',
    label: 'Calculated Value',
    description: 'The calculated ratio/amount',
    required: true,
  },
  {
    key: 'testResult',
    label: 'Test Result',
    description: 'Pass/Fail result (optional - will be calculated)',
    required: false,
  },
  {
    key: 'notes',
    label: 'Notes',
    description: 'Additional comments or notes',
    required: false,
  },
];

export const MappingStep = memo(function MappingStep({
  headers,
  mapping,
  onMappingChange,
  sampleData,
  onBack,
  onNext,
  isProcessing,
}: MappingStepProps) {
  const handleFieldChange = (field: keyof ColumnMapping, value: string) => {
    onMappingChange({
      ...mapping,
      [field]: value === 'none' ? null : value,
    });
  };

  const hasRequiredMappings = () => {
    const hasIdentifier = mapping.covenantId || mapping.covenantName;
    const hasTestDate = mapping.testDate;
    const hasValue = mapping.calculatedValue;
    return hasIdentifier && hasTestDate && hasValue;
  };

  const getMappedValue = (field: keyof ColumnMapping, rowIndex: number): string => {
    const column = mapping[field];
    if (!column || !sampleData[rowIndex]) return '-';
    const value = sampleData[rowIndex].data[column];
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Mapping Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <p className="text-sm text-blue-700">
            Map your spreadsheet columns to the corresponding covenant test fields.
            Required fields are marked with a red asterisk.
            Either <strong>Covenant ID</strong> or <strong>Covenant Name</strong> must be mapped.
          </p>
        </CardContent>
      </Card>

      {/* Column Mappings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Column Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FIELD_DEFINITIONS.map((field) => (
              <div
                key={field.key}
                className="grid grid-cols-3 gap-4 items-center py-2 border-b border-zinc-100 last:border-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">
                      {field.label}
                    </span>
                    {field.required && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                    {field.key === 'covenantName' && !mapping.covenantId && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{field.description}</p>
                </div>

                <Select
                  value={mapping[field.key] || 'none'}
                  onValueChange={(value) => handleFieldChange(field.key, value)}
                  data-testid={`mapping-select-${field.key}`}
                >
                  <SelectTrigger className="w-full" data-testid={`mapping-trigger-${field.key}`}>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not mapped --</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  {mapping[field.key] ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Mapped
                    </Badge>
                  ) : field.required ||
                    (field.key === 'covenantName' && !mapping.covenantId) ? (
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-200"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Required
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-zinc-500">
                      Optional
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sample Data Preview */}
      {sampleData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="mapping-preview-table">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                      Row
                    </th>
                    {FIELD_DEFINITIONS.filter((f) => mapping[f.key]).map((field) => (
                      <th
                        key={field.key}
                        className="text-left py-2 px-3 text-xs font-medium text-zinc-500"
                      >
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((row, index) => (
                    <tr key={row.rowIndex} className="border-b border-zinc-100">
                      <td className="py-2 px-3 text-zinc-400">{index + 1}</td>
                      {FIELD_DEFINITIONS.filter((f) => mapping[f.key]).map((field) => (
                        <td key={field.key} className="py-2 px-3 text-zinc-900">
                          {getMappedValue(field.key, index)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              Showing first {sampleData.length} rows of data
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          data-testid="mapping-back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!hasRequiredMappings() || isProcessing}
          data-testid="mapping-next-btn"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              Validate Data
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
});
