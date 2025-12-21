'use client';

import React, { useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, PartyPopper, FileCheck, TrendingUp, Building } from 'lucide-react';
import type { ValidatedCovenantTest } from '../lib/bulk-import-types';
import { getImportSummary } from '../lib/covenant-validator';

interface CompleteStepProps {
  validatedTests: ValidatedCovenantTest[];
  onClose: () => void;
}

export const CompleteStep = memo(function CompleteStep({
  validatedTests,
  onClose,
}: CompleteStepProps) {
  const summary = useMemo(() => getImportSummary(validatedTests), [validatedTests]);

  return (
    <div className="space-y-6 text-center">
      {/* Success Animation */}
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-200 opacity-75" />
          <div className="relative p-4 rounded-full bg-green-100">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-2xl">
          <PartyPopper className="w-6 h-6 text-amber-500" />
          <h2 className="font-bold text-zinc-900">Import Successful!</h2>
          <PartyPopper className="w-6 h-6 text-amber-500 transform scale-x-[-1]" />
        </div>
        <p className="text-zinc-600 max-w-md">
          Your covenant test results have been imported successfully. The compliance
          dashboard will now reflect the updated test data.
        </p>
      </div>

      {/* Results Summary */}
      <Card className="bg-zinc-50">
        <CardContent className="py-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileCheck className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{summary.valid}</p>
              <p className="text-sm text-zinc-500">Tests Recorded</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {summary.facilitiesAffected.length}
              </p>
              <p className="text-sm text-zinc-500">Facilities Updated</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {summary.covenantsAffected.length}
              </p>
              <p className="text-sm text-zinc-500">Covenants Updated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Breakdown */}
      <div className="flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-zinc-600">{summary.passingTests} passing tests</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-zinc-600">{summary.failingTests} failing tests</span>
        </div>
        {summary.invalid > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-zinc-300" />
            <span className="text-zinc-600">{summary.invalid} skipped</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-zinc-100">
        <Button onClick={onClose} className="px-8" data-testid="complete-close-btn">
          Done
        </Button>
      </div>

      {/* Audit Trail Note */}
      <p className="text-xs text-zinc-400">
        This import has been recorded in the audit trail for compliance tracking.
      </p>
    </div>
  );
});
