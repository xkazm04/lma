'use client';

import React, { useState, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ValidatedCovenantTest } from '../lib/bulk-import-types';
import { getImportSummary } from '../lib/covenant-validator';

interface ValidationStepProps {
  validatedTests: ValidatedCovenantTest[];
  onBack: () => void;
  onNext: () => void;
}

type FilterType = 'all' | 'valid' | 'invalid' | 'warnings';

export const ValidationStep = memo(function ValidationStep({
  validatedTests,
  onBack,
  onNext,
}: ValidationStepProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const summary = useMemo(() => getImportSummary(validatedTests), [validatedTests]);

  const filteredTests = useMemo(() => {
    switch (filter) {
      case 'valid':
        return validatedTests.filter((t) => t.validation.isValid);
      case 'invalid':
        return validatedTests.filter((t) => !t.validation.isValid);
      case 'warnings':
        return validatedTests.filter(
          (t) => t.validation.isValid && t.validation.warnings.length > 0
        );
      default:
        return validatedTests;
    }
  }, [validatedTests, filter]);

  const toggleRow = (rowIndex: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };

  const canProceed = summary.valid > 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          className={cn(
            'cursor-pointer transition-colors',
            filter === 'all' ? 'ring-2 ring-purple-500' : 'hover:bg-zinc-50'
          )}
          onClick={() => setFilter('all')}
          data-testid="filter-all"
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-zinc-900">{summary.total}</p>
            <p className="text-xs text-zinc-500">Total Records</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'cursor-pointer transition-colors',
            filter === 'valid' ? 'ring-2 ring-green-500' : 'hover:bg-zinc-50'
          )}
          onClick={() => setFilter('valid')}
          data-testid="filter-valid"
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.valid}</p>
            <p className="text-xs text-zinc-500">Valid</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'cursor-pointer transition-colors',
            filter === 'invalid' ? 'ring-2 ring-red-500' : 'hover:bg-zinc-50'
          )}
          onClick={() => setFilter('invalid')}
          data-testid="filter-invalid"
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.invalid}</p>
            <p className="text-xs text-zinc-500">Invalid</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'cursor-pointer transition-colors',
            filter === 'warnings' ? 'ring-2 ring-amber-500' : 'hover:bg-zinc-50'
          )}
          onClick={() => setFilter('warnings')}
          data-testid="filter-warnings"
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.warnings}</p>
            <p className="text-xs text-zinc-500">Warnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Results Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-zinc-600">
            {summary.passingTests} tests will pass
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-zinc-600">
            {summary.failingTests} tests will fail
          </span>
        </div>
      </div>

      {/* Validation Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Validation Results</CardTitle>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Filter className="w-4 h-4" />
              Showing {filteredTests.length} of {validatedTests.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm" data-testid="validation-results-table">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 w-8"></th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">Row</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                    Covenant
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                    Test Date
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">Value</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                    Predicted
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                    Headroom
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => (
                  <React.Fragment key={test.rowIndex}>
                    <tr
                      className={cn(
                        'border-b border-zinc-100 cursor-pointer hover:bg-zinc-50',
                        !test.validation.isValid && 'bg-red-50',
                        test.validation.isValid &&
                          test.validation.warnings.length > 0 &&
                          'bg-amber-50'
                      )}
                      onClick={() => toggleRow(test.rowIndex)}
                      data-testid={`validation-row-${test.rowIndex}`}
                    >
                      <td className="py-2 px-3">
                        {expandedRows.has(test.rowIndex) ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </td>
                      <td className="py-2 px-3 text-zinc-500">{test.rowIndex}</td>
                      <td className="py-2 px-3">
                        {test.validation.matchedCovenant ? (
                          <div>
                            <p className="font-medium text-zinc-900">
                              {test.validation.matchedCovenant.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {test.validation.matchedCovenant.facilityName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Not matched</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-zinc-900">{test.testDate || '-'}</td>
                      <td className="py-2 px-3 text-zinc-900">
                        {isNaN(test.calculatedValue) ? '-' : test.calculatedValue.toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        {test.validation.predictedResult ? (
                          <Badge
                            className={
                              test.validation.predictedResult === 'pass'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {test.validation.predictedResult === 'pass' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {test.validation.predictedResult}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {test.validation.calculatedHeadroom !== undefined ? (
                          <span
                            className={cn(
                              'font-medium',
                              test.validation.calculatedHeadroom < 0
                                ? 'text-red-600'
                                : test.validation.calculatedHeadroom < 10
                                ? 'text-amber-600'
                                : 'text-green-600'
                            )}
                          >
                            {test.validation.calculatedHeadroom.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {test.validation.isValid ? (
                          test.validation.warnings.length > 0 ? (
                            <Badge className="bg-amber-100 text-amber-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Warning
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          )
                        ) : (
                          <Badge className="bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </td>
                    </tr>
                    {expandedRows.has(test.rowIndex) && (
                      <tr className="bg-zinc-50">
                        <td colSpan={8} className="py-3 px-6">
                          <div className="space-y-2">
                            {test.validation.errors.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-red-700 mb-1">Errors:</p>
                                <ul className="list-disc list-inside text-xs text-red-600">
                                  {test.validation.errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {test.validation.warnings.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-amber-700 mb-1">Warnings:</p>
                                <ul className="list-disc list-inside text-xs text-amber-600">
                                  {test.validation.warnings.map((warning, i) => (
                                    <li key={i}>{warning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {test.validation.matchedCovenant && (
                              <div className="mt-2 pt-2 border-t border-zinc-200">
                                <p className="text-xs font-medium text-zinc-700 mb-1">
                                  Matched Covenant Details:
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-xs text-zinc-600">
                                  <div>
                                    <span className="text-zinc-400">Threshold Type:</span>{' '}
                                    {test.validation.matchedCovenant.thresholdType}
                                  </div>
                                  <div>
                                    <span className="text-zinc-400">Threshold:</span>{' '}
                                    {test.validation.matchedCovenant.currentThreshold}
                                  </div>
                                  <div>
                                    <span className="text-zinc-400">Type:</span>{' '}
                                    {test.validation.matchedCovenant.covenantType}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
        <Button variant="outline" onClick={onBack} data-testid="validation-back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Mapping
        </Button>
        <div className="flex items-center gap-3">
          {summary.invalid > 0 && (
            <p className="text-sm text-amber-600">
              {summary.invalid} invalid records will be skipped
            </p>
          )}
          <Button onClick={onNext} disabled={!canProceed} data-testid="validation-next-btn">
            Continue to Confirm
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
});
