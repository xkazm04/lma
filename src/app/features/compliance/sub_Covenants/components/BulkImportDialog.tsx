'use client';

import React, { useState, useCallback, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, X } from 'lucide-react';
import type { Covenant } from '../../lib/types';
import type {
  ImportStep,
  ColumnMapping,
  RawImportRow,
  ValidatedCovenantTest,
} from '../lib/bulk-import-types';
import {
  parseSpreadsheet,
  autoDetectMappings,
  applyMapping,
} from '../lib/spreadsheet-parser';
import { validateCovenantTests } from '../lib/covenant-validator';
import { UploadStep } from './UploadStep';
import { MappingStep } from './MappingStep';
import { ValidationStep } from './ValidationStep';
import { ConfirmationStep } from './ConfirmationStep';
import { CompleteStep } from './CompleteStep';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCovenants: Covenant[];
  onImportComplete: (tests: ValidatedCovenantTest[]) => void;
}

export const BulkImportDialog = memo(function BulkImportDialog({
  open,
  onOpenChange,
  existingCovenants,
  onImportComplete,
}: BulkImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawImportRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    covenantId: null,
    facilityId: null,
    facilityName: null,
    covenantName: null,
    covenantType: null,
    testDate: null,
    calculatedValue: null,
    testResult: null,
    notes: null,
  });
  const [validatedTests, setValidatedTests] = useState<ValidatedCovenantTest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({
      covenantId: null,
      facilityId: null,
      facilityName: null,
      covenantName: null,
      covenantType: null,
      testDate: null,
      calculatedValue: null,
      testResult: null,
      notes: null,
    });
    setValidatedTests([]);
    setError(null);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseSpreadsheet(file);
      setFileName(file.name);
      setHeaders(result.headers);
      setRows(result.rows);

      // Auto-detect mappings
      const detectedMapping = autoDetectMappings(result.headers);
      setMapping(detectedMapping);

      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleMappingComplete = useCallback(() => {
    setIsProcessing(true);
    setError(null);

    try {
      const parsedTests = applyMapping(rows, mapping);
      const validated = validateCovenantTests(parsedTests, existingCovenants);
      setValidatedTests(validated);
      setStep('validation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate data');
    } finally {
      setIsProcessing(false);
    }
  }, [rows, mapping, existingCovenants]);

  const handleProceedToConfirm = useCallback(() => {
    setStep('confirmation');
  }, []);

  const handleConfirmImport = useCallback(() => {
    const validTests = validatedTests.filter((t) => t.validation.isValid);
    onImportComplete(validTests);
    setStep('complete');
  }, [validatedTests, onImportComplete]);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const getStepTitle = (): string => {
    switch (step) {
      case 'upload':
        return 'Upload Covenant Test Data';
      case 'mapping':
        return 'Map Columns';
      case 'validation':
        return 'Validate Data';
      case 'confirmation':
        return 'Confirm Import';
      case 'complete':
        return 'Import Complete';
    }
  };

  const getStepDescription = (): string => {
    switch (step) {
      case 'upload':
        return 'Upload an Excel or CSV file containing covenant test results';
      case 'mapping':
        return 'Match spreadsheet columns to covenant test fields';
      case 'validation':
        return 'Review validation results and fix any issues';
      case 'confirmation':
        return 'Review and confirm the import';
      case 'complete':
        return 'Your covenant tests have been imported successfully';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        data-testid="bulk-import-dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <FileSpreadsheet className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <DialogTitle data-testid="bulk-import-title">{getStepTitle()}</DialogTitle>
              <DialogDescription data-testid="bulk-import-description">
                {getStepDescription()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-4 border-b border-zinc-100">
          {(['upload', 'mapping', 'validation', 'confirmation', 'complete'] as ImportStep[]).map(
            (s, index) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    step === s
                      ? 'bg-purple-100 text-purple-700'
                      : index <
                        ['upload', 'mapping', 'validation', 'confirmation', 'complete'].indexOf(step)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}
                  data-testid={`import-step-${s}`}
                >
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-xs">
                    {index + 1}
                  </span>
                  <span className="hidden sm:inline capitalize">{s}</span>
                </div>
                {index < 4 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      index <
                      ['upload', 'mapping', 'validation', 'confirmation', 'complete'].indexOf(step)
                        ? 'bg-green-300'
                        : 'bg-zinc-200'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            data-testid="import-error"
          >
            <X className="w-4 h-4" />
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
              data-testid="dismiss-error-btn"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {step === 'upload' && (
            <UploadStep
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
            />
          )}

          {step === 'mapping' && (
            <MappingStep
              headers={headers}
              mapping={mapping}
              onMappingChange={setMapping}
              sampleData={rows.slice(0, 3)}
              onBack={() => setStep('upload')}
              onNext={handleMappingComplete}
              isProcessing={isProcessing}
            />
          )}

          {step === 'validation' && (
            <ValidationStep
              validatedTests={validatedTests}
              onBack={() => setStep('mapping')}
              onNext={handleProceedToConfirm}
            />
          )}

          {step === 'confirmation' && (
            <ConfirmationStep
              fileName={fileName}
              validatedTests={validatedTests}
              onBack={() => setStep('validation')}
              onConfirm={handleConfirmImport}
            />
          )}

          {step === 'complete' && (
            <CompleteStep
              validatedTests={validatedTests}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
