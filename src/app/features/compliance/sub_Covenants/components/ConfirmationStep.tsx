'use client';

import React, { useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Building,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import type { ValidatedCovenantTest } from '../lib/bulk-import-types';
import { getImportSummary } from '../lib/covenant-validator';

interface ConfirmationStepProps {
  fileName: string;
  validatedTests: ValidatedCovenantTest[];
  onBack: () => void;
  onConfirm: () => void;
}

export const ConfirmationStep = memo(function ConfirmationStep({
  fileName,
  validatedTests,
  onBack,
  onConfirm,
}: ConfirmationStepProps) {
  const summary = useMemo(() => getImportSummary(validatedTests), [validatedTests]);
  const validTests = validatedTests.filter((t) => t.validation.isValid);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-100">
              <FileSpreadsheet className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                Ready to Import
              </h3>
              <p className="text-sm text-zinc-600 mb-4">
                You are about to import covenant test results from <strong>{fileName}</strong>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                  <p className="text-2xl font-bold text-green-600">{summary.valid}</p>
                  <p className="text-xs text-zinc-500">Records to Import</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                  <p className="text-2xl font-bold text-green-600">{summary.passingTests}</p>
                  <p className="text-xs text-zinc-500">Passing Tests</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                  <p className="text-2xl font-bold text-red-600">{summary.failingTests}</p>
                  <p className="text-xs text-zinc-500">Failing Tests</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                  <p className="text-2xl font-bold text-zinc-400">{summary.invalid}</p>
                  <p className="text-xs text-zinc-500">Skipped</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-zinc-500" />
              Facilities Affected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.facilitiesAffected.length > 0 ? (
                summary.facilitiesAffected.map((facility) => (
                  <div
                    key={facility}
                    className="flex items-center gap-2 text-sm text-zinc-700"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    {facility}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400">No facilities affected</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              Covenants to Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.covenantsAffected.length > 0 ? (
                summary.covenantsAffected.map((covenant) => (
                  <div
                    key={covenant}
                    className="flex items-center gap-2 text-sm text-zinc-700"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {covenant}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400">No covenants to update</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Test Results Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[200px] overflow-y-auto">
            <table className="w-full text-sm" data-testid="confirmation-preview-table">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                    Covenant
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                    Facility
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                    Test Date
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                    Value
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {validTests.slice(0, 10).map((test) => (
                  <tr key={test.rowIndex} className="border-b border-zinc-100">
                    <td className="py-2 px-3 font-medium text-zinc-900">
                      {test.validation.matchedCovenant?.name || '-'}
                    </td>
                    <td className="py-2 px-3 text-zinc-600">
                      {test.validation.matchedCovenant?.facilityName || '-'}
                    </td>
                    <td className="py-2 px-3 text-zinc-600">{test.testDate}</td>
                    <td className="py-2 px-3 text-zinc-900">
                      {test.calculatedValue.toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      {test.validation.predictedResult === 'pass' ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Pass
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3 mr-1" />
                          Fail
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validTests.length > 10 && (
              <p className="text-xs text-zinc-500 mt-2 text-center">
                And {validTests.length - 10} more records...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {summary.warnings > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {summary.warnings} records have warnings
                </p>
                <p className="text-xs text-amber-600">
                  These records will be imported but may need review. Check the validation
                  step for details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
        <Button variant="outline" onClick={onBack} data-testid="confirmation-back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Validation
        </Button>
        <Button onClick={onConfirm} data-testid="confirm-import-btn">
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirm Import ({summary.valid} records)
        </Button>
      </div>
    </div>
  );
});
