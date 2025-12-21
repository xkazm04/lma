'use client';

import React, { Component, useState, useCallback } from 'react';
import { AlertCircle, Bug, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ExtractionField } from '../../lib/types';

interface FieldRowErrorBoundaryProps {
  children: React.ReactNode;
  field: ExtractionField;
  fieldIndex: number;
}

interface FieldRowErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface DiagnosticInfo {
  fieldName: string;
  fieldIndex: number;
  fieldData: ExtractionField;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

/**
 * Error fallback component displayed when a FieldRow crashes
 */
function FieldRowErrorFallback({
  fieldName,
  diagnosticInfo,
  onRetry,
}: {
  fieldName: string;
  diagnosticInfo: DiagnosticInfo;
  onRetry?: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = useCallback(async () => {
    try {
      const diagnosticJson = JSON.stringify(diagnosticInfo, null, 2);
      await navigator.clipboard.writeText(diagnosticJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy diagnostics:', err);
    }
  }, [diagnosticInfo]);

  return (
    <>
      <div
        className={cn(
          'flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 gap-3',
          'transition-all duration-200'
        )}
        role="alert"
        data-testid={`field-row-error-${diagnosticInfo.fieldIndex}`}
      >
        {/* Error Icon */}
        <div className="shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600" />
        </div>

        {/* Error Message */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-red-800 truncate">
            Unable to display field: {fieldName}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-7 px-2 text-xs text-red-700 hover:bg-red-100 hover:text-red-800"
            data-testid={`field-error-debug-btn-${diagnosticInfo.fieldIndex}`}
          >
            <Bug className="w-3 h-3 mr-1" />
            View Debug Info
          </Button>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-7 px-2 text-xs text-red-700 hover:bg-red-100 hover:text-red-800"
              data-testid={`field-error-retry-btn-${diagnosticInfo.fieldIndex}`}
            >
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Debug Info Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-800">
              <Bug className="w-5 h-5" />
              Field Rendering Error
            </DialogTitle>
            <DialogDescription>
              Debug information for field &quot;{fieldName}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4">
            {/* Error Summary */}
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <h4 className="text-sm font-medium text-red-800 mb-1">Error</h4>
              <p className="text-xs text-red-700 font-mono">
                {diagnosticInfo.error.name}: {diagnosticInfo.error.message}
              </p>
            </div>

            {/* Field Data */}
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
              <h4 className="text-sm font-medium text-zinc-800 mb-2">Field Data</h4>
              <div className="text-xs space-y-1">
                <div className="flex">
                  <span className="w-24 text-zinc-500">Name:</span>
                  <span className="text-zinc-700">{diagnosticInfo.fieldData.name}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-zinc-500">Value:</span>
                  <span className="text-zinc-700 font-mono truncate max-w-md">
                    {String(diagnosticInfo.fieldData.value ?? 'undefined')}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-24 text-zinc-500">Confidence:</span>
                  <span className="text-zinc-700 font-mono">
                    {String(diagnosticInfo.fieldData.confidence ?? 'undefined')}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-24 text-zinc-500">Source:</span>
                  <span className="text-zinc-700 truncate max-w-md">
                    {String(diagnosticInfo.fieldData.source ?? 'undefined')}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-24 text-zinc-500">Flagged:</span>
                  <span className="text-zinc-700">
                    {String(diagnosticInfo.fieldData.flagged ?? 'undefined')}
                  </span>
                </div>
              </div>
            </div>

            {/* Stack Trace */}
            {diagnosticInfo.error.stack && (
              <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
                <h4 className="text-sm font-medium text-zinc-800 mb-2">Stack Trace</h4>
                <pre className="text-[10px] text-zinc-600 font-mono whitespace-pre-wrap overflow-x-auto max-h-40">
                  {diagnosticInfo.error.stack}
                </pre>
              </div>
            )}

            {/* Component Stack */}
            {diagnosticInfo.componentStack && (
              <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
                <h4 className="text-sm font-medium text-zinc-800 mb-2">Component Stack</h4>
                <pre className="text-[10px] text-zinc-600 font-mono whitespace-pre-wrap overflow-x-auto max-h-40">
                  {diagnosticInfo.componentStack}
                </pre>
              </div>
            )}

            {/* Metadata */}
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
              <h4 className="text-sm font-medium text-zinc-800 mb-2">Metadata</h4>
              <div className="text-xs space-y-1">
                <div className="flex">
                  <span className="w-24 text-zinc-500">Timestamp:</span>
                  <span className="text-zinc-700 font-mono">{diagnosticInfo.timestamp}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-zinc-500">Field Index:</span>
                  <span className="text-zinc-700 font-mono">{diagnosticInfo.fieldIndex}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-zinc-500">URL:</span>
                  <span className="text-zinc-700 font-mono truncate max-w-md">{diagnosticInfo.url}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-zinc-200 pt-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyDiagnostics}
              className="gap-2"
              data-testid={`field-error-copy-btn-${diagnosticInfo.fieldIndex}`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Report Issue (Copy Diagnostics)
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              data-testid={`field-error-close-modal-btn-${diagnosticInfo.fieldIndex}`}
            >
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Error boundary component for FieldRow that catches rendering errors
 * and displays a compact error state with debug info modal
 */
export class FieldRowErrorBoundary extends Component<
  FieldRowErrorBoundaryProps,
  FieldRowErrorBoundaryState
> {
  constructor(props: FieldRowErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FieldRowErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error with full field data for debugging
    console.error(
      `[FieldRowErrorBoundary] Error rendering field "${this.props.field.name}" at index ${this.props.fieldIndex}:`,
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        fieldData: this.props.field,
        fieldIndex: this.props.fieldIndex,
        componentStack: errorInfo.componentStack,
      }
    );
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): React.ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, field, fieldIndex } = this.props;

    if (hasError && error) {
      const diagnosticInfo: DiagnosticInfo = {
        fieldName: field.name ?? 'Unknown Field',
        fieldIndex,
        fieldData: field,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        componentStack: errorInfo?.componentStack ?? undefined,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      };

      return (
        <FieldRowErrorFallback
          fieldName={field.name ?? 'Unknown Field'}
          diagnosticInfo={diagnosticInfo}
          onRetry={this.handleRetry}
        />
      );
    }

    return children;
  }
}
