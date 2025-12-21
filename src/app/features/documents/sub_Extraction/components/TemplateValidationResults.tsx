'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type {
  TemplateValidationResult,
  FieldValidationResult,
  FieldAnomaly,
} from '../lib/template-types';

interface TemplateValidationResultsProps {
  /** Validation results from template application */
  results: TemplateValidationResult;
  /** Template name for display */
  templateName: string;
  /** Custom class name */
  className?: string;
}

/**
 * Displays validation results after applying a template to extracted data
 */
export function TemplateValidationResults({
  results,
  templateName,
  className,
}: TemplateValidationResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['anomalies', 'missing'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const stats = useMemo(() => {
    const total = results.fieldResults.length;
    const found = results.fieldResults.filter((f) => f.found).length;
    const valid = results.fieldResults.filter((f) => f.isValid).length;
    const typical = results.fieldResults.filter((f) => f.isTypical).length;
    const missing = results.fieldResults.filter((f) => !f.found);
    const invalid = results.fieldResults.filter((f) => f.found && !f.isValid);

    return {
      total,
      found,
      valid,
      typical,
      missing,
      invalid,
      matchPercentage: Math.round((found / total) * 100),
      validPercentage: Math.round((valid / total) * 100),
    };
  }, [results]);

  const overallStatus = useMemo(() => {
    if (results.anomalies.filter((a) => a.severity === 'error').length > 0) {
      return 'error';
    }
    if (
      results.anomalies.filter((a) => a.severity === 'warning').length > 0 ||
      stats.invalid.length > 0
    ) {
      return 'warning';
    }
    return 'success';
  }, [results.anomalies, stats.invalid]);

  return (
    <Card
      className={cn('animate-in fade-in slide-in-from-top-2 duration-300', className)}
      data-testid="template-validation-results"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {overallStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {overallStatus === 'warning' && (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            {overallStatus === 'error' && (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            Template Validation
          </CardTitle>
          <Badge
            variant={
              overallStatus === 'success'
                ? 'success'
                : overallStatus === 'warning'
                  ? 'warning'
                  : 'destructive'
            }
          >
            {Math.round(results.matchScore * 100)}% match
          </Badge>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          Validated against <span className="font-medium">{templateName}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-zinc-50" data-testid="fields-found-stat">
            <div className="text-2xl font-semibold text-zinc-900">
              {stats.found}/{stats.total}
            </div>
            <div className="text-xs text-zinc-500">Fields Found</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-50" data-testid="fields-valid-stat">
            <div className="text-2xl font-semibold text-green-600">
              {stats.valid}
            </div>
            <div className="text-xs text-zinc-500">Valid Values</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-50" data-testid="anomalies-stat">
            <div className="text-2xl font-semibold text-amber-600">
              {results.anomalies.length}
            </div>
            <div className="text-xs text-zinc-500">Anomalies</div>
          </div>
        </div>

        {/* Match Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600">Template Match</span>
            <span className="font-medium">{stats.matchPercentage}%</span>
          </div>
          <Progress
            value={stats.matchPercentage}
            className="h-2"
            data-testid="match-progress"
          />
        </div>

        {/* Anomalies Section */}
        {results.anomalies.length > 0 && (
          <CollapsibleSection
            title="Anomalies Detected"
            count={results.anomalies.length}
            icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
            isExpanded={expandedSections.has('anomalies')}
            onToggle={() => toggleSection('anomalies')}
            variant="warning"
            data-testid="anomalies-section"
          >
            <div className="space-y-2">
              {results.anomalies.map((anomaly, index) => (
                <AnomalyItem key={`${anomaly.fieldKey}-${index}`} anomaly={anomaly} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Missing Required Fields */}
        {stats.missing.filter((f) => f.errors.length > 0).length > 0 && (
          <CollapsibleSection
            title="Missing Required Fields"
            count={stats.missing.filter((f) => f.errors.length > 0).length}
            icon={<XCircle className="w-4 h-4 text-red-600" />}
            isExpanded={expandedSections.has('missing')}
            onToggle={() => toggleSection('missing')}
            variant="error"
            data-testid="missing-fields-section"
          >
            <div className="flex flex-wrap gap-2">
              {stats.missing
                .filter((f) => f.errors.length > 0)
                .map((field) => (
                  <Badge key={field.fieldKey} variant="destructive" className="text-xs">
                    {field.fieldKey.replace(/_/g, ' ')}
                  </Badge>
                ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Validation Errors */}
        {stats.invalid.length > 0 && (
          <CollapsibleSection
            title="Validation Errors"
            count={stats.invalid.length}
            icon={<XCircle className="w-4 h-4 text-red-600" />}
            isExpanded={expandedSections.has('invalid')}
            onToggle={() => toggleSection('invalid')}
            variant="error"
            data-testid="validation-errors-section"
          >
            <div className="space-y-2">
              {stats.invalid.map((field) => (
                <ValidationErrorItem key={field.fieldKey} field={field} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Unexpected Fields */}
        {results.unexpectedFields.length > 0 && (
          <CollapsibleSection
            title="Unexpected Fields"
            count={results.unexpectedFields.length}
            icon={<HelpCircle className="w-4 h-4 text-zinc-500" />}
            isExpanded={expandedSections.has('unexpected')}
            onToggle={() => toggleSection('unexpected')}
            variant="info"
            data-testid="unexpected-fields-section"
          >
            <p className="text-xs text-zinc-500 mb-2">
              These fields were extracted but are not defined in the template.
            </p>
            <div className="flex flex-wrap gap-2">
              {results.unexpectedFields.map((fieldKey) => (
                <Badge key={fieldKey} variant="outline" className="text-xs">
                  {fieldKey.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Success message when no issues */}
        {overallStatus === 'success' &&
          results.anomalies.length === 0 &&
          stats.invalid.length === 0 && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200"
              data-testid="all-valid-message"
            >
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">
                All extracted fields match the template and pass validation.
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  variant: 'warning' | 'error' | 'info';
  children: React.ReactNode;
  'data-testid'?: string;
}

function CollapsibleSection({
  title,
  count,
  icon,
  isExpanded,
  onToggle,
  variant,
  children,
  'data-testid': testId,
}: CollapsibleSectionProps) {
  const bgClass = {
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-zinc-50 border-zinc-200',
  }[variant];

  return (
    <div className={cn('rounded-lg border', bgClass)} data-testid={testId}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left"
        data-testid={`${testId}-toggle`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

interface AnomalyItemProps {
  anomaly: FieldAnomaly;
}

function AnomalyItem({ anomaly }: AnomalyItemProps) {
  const severityStyles = {
    info: 'border-blue-200 bg-blue-50',
    warning: 'border-amber-200 bg-amber-50',
    error: 'border-red-200 bg-red-50',
  }[anomaly.severity];

  const severityIcon = {
    info: <Info className="w-3.5 h-3.5 text-blue-600" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
    error: <XCircle className="w-3.5 h-3.5 text-red-600" />,
  }[anomaly.severity];

  return (
    <div
      className={cn('rounded border p-2', severityStyles)}
      data-testid={`anomaly-item-${anomaly.fieldKey}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{severityIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-zinc-900">
              {anomaly.fieldLabel}
            </span>
            <Badge variant="outline" className="text-xs">
              {anomaly.anomalyType.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">{anomaly.description}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
            <span>
              Value: <code className="bg-white px-1 rounded">{anomaly.value}</code>
            </span>
            {anomaly.expectedInfo && (
              <span>Expected: {anomaly.expectedInfo}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ValidationErrorItemProps {
  field: FieldValidationResult;
}

function ValidationErrorItem({ field }: ValidationErrorItemProps) {
  return (
    <div
      className="rounded border border-red-200 bg-red-50 p-2"
      data-testid={`validation-error-${field.fieldKey}`}
    >
      <div className="flex items-start gap-2">
        <XCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-zinc-900">
            {field.fieldKey.replace(/_/g, ' ')}
          </span>
          {field.value && (
            <p className="text-xs text-zinc-500">
              Value: <code className="bg-white px-1 rounded">{field.value}</code>
            </p>
          )}
          <ul className="mt-1 space-y-0.5">
            {field.errors.map((error, index) => (
              <li key={index} className="text-xs text-red-600">
                {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
