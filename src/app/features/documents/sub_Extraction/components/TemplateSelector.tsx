'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ExtractionTemplate, DocumentTypeDetection, TemplateField } from '../lib/template-types';
import { getAllTemplates, getFieldsByCategory } from '../lib/templates';

interface TemplateSelectorProps {
  /** Current selected template ID */
  selectedTemplateId: string | null;
  /** Callback when template is selected */
  onSelectTemplate: (templateId: string) => void;
  /** Auto-detection result (if available) */
  detection?: DocumentTypeDetection;
  /** Whether to show the detection banner */
  showDetectionBanner?: boolean;
  /** Callback to re-run detection */
  onRedetect?: () => void;
  /** Whether detection is in progress */
  isDetecting?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Template selection component with auto-detection support
 */
export function TemplateSelector({
  selectedTemplateId,
  onSelectTemplate,
  detection,
  showDetectionBanner = true,
  onRedetect,
  isDetecting = false,
  className,
}: TemplateSelectorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const templates = useMemo(() => getAllTemplates(), []);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const recommendedTemplate = useMemo(
    () => (detection ? templates.find((t) => t.id === detection.recommendedTemplateId) : null),
    [templates, detection]
  );

  const handleApplyRecommendation = useCallback(() => {
    if (detection?.recommendedTemplateId) {
      onSelectTemplate(detection.recommendedTemplateId);
    }
  }, [detection, onSelectTemplate]);

  const confidenceBadge = useMemo(() => {
    if (!detection) return null;
    const confidence = detection.confidence;

    if (confidence >= 0.8) {
      return <Badge variant="success">High confidence</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge variant="warning">Moderate confidence</Badge>;
    } else {
      return <Badge variant="secondary">Low confidence</Badge>;
    }
  }, [detection]);

  return (
    <Card className={cn('animate-in fade-in slide-in-from-top-2 duration-300', className)} data-testid="template-selector">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-zinc-600" />
            Extraction Template
          </CardTitle>
          {onRedetect && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedetect}
              disabled={isDetecting}
              data-testid="redetect-template-btn"
            >
              <RefreshCw className={cn('w-4 h-4 mr-1', isDetecting && 'animate-spin')} />
              Re-detect
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Detection Banner */}
        {showDetectionBanner && detection && recommendedTemplate && (
          <div
            className={cn(
              'rounded-lg border p-4 transition-all',
              selectedTemplateId === detection.recommendedTemplateId
                ? 'border-green-200 bg-green-50'
                : 'border-indigo-200 bg-indigo-50'
            )}
            data-testid="detection-banner"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'rounded-full p-1.5',
                  selectedTemplateId === detection.recommendedTemplateId
                    ? 'bg-green-100'
                    : 'bg-indigo-100'
                )}
              >
                {selectedTemplateId === detection.recommendedTemplateId ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'font-medium',
                      selectedTemplateId === detection.recommendedTemplateId
                        ? 'text-green-900'
                        : 'text-indigo-900'
                    )}
                  >
                    {selectedTemplateId === detection.recommendedTemplateId
                      ? 'Using recommended template'
                      : 'Recommended template detected'}
                  </span>
                  {confidenceBadge}
                </div>
                <p
                  className={cn(
                    'text-sm',
                    selectedTemplateId === detection.recommendedTemplateId
                      ? 'text-green-700'
                      : 'text-indigo-700'
                  )}
                >
                  <span className="font-medium">{recommendedTemplate.name}</span>
                  {detection.matchedKeywords.length > 0 && (
                    <span>
                      {' '}
                      - Matched keywords:{' '}
                      {detection.matchedKeywords.slice(0, 4).join(', ')}
                      {detection.matchedKeywords.length > 4 && '...'}
                    </span>
                  )}
                </p>
                {selectedTemplateId !== detection.recommendedTemplateId && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleApplyRecommendation}
                    className="mt-2"
                    data-testid="apply-recommendation-btn"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Apply Recommendation
                  </Button>
                )}
              </div>
            </div>

            {/* Alternative templates */}
            {detection.alternativeTemplates.length > 0 &&
              selectedTemplateId !== detection.recommendedTemplateId && (
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <p className="text-xs text-indigo-600 mb-2">
                    Other possible templates:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detection.alternativeTemplates.slice(0, 3).map((alt) => {
                      const altTemplate = templates.find((t) => t.id === alt.templateId);
                      return (
                        <button
                          key={alt.templateId}
                          onClick={() => onSelectTemplate(alt.templateId)}
                          className="text-xs px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                          data-testid={`alt-template-${alt.templateId}`}
                        >
                          {altTemplate?.name} ({Math.round(alt.confidence * 100)}%)
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Manual Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">
            Select Template
          </label>
          <Select value={selectedTemplateId || ''} onValueChange={onSelectTemplate}>
            <SelectTrigger data-testid="template-select-trigger">
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem
                  key={template.id}
                  value={template.id}
                  data-testid={`template-option-${template.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{template.name}</span>
                    {detection?.recommendedTemplateId === template.id && (
                      <Badge variant="info" className="text-xs py-0">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Info */}
        {selectedTemplate && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">{selectedTemplate.description}</p>

            {/* Toggle Preview */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
              data-testid="toggle-template-preview-btn"
            >
              {showPreview ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showPreview ? 'Hide' : 'Show'} expected fields (
              {selectedTemplate.fields.length})
            </button>

            {/* Fields Preview */}
            {showPreview && (
              <TemplateFieldsPreview template={selectedTemplate} />
            )}
          </div>
        )}

        {/* No template selected info */}
        {!selectedTemplateId && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700">
              Select a template to enable pre-defined field extraction, validation
              rules, and anomaly detection.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TemplateFieldsPreviewProps {
  template: ExtractionTemplate;
}

/**
 * Preview of template fields organized by category
 */
function TemplateFieldsPreview({ template }: TemplateFieldsPreviewProps) {
  return (
    <div
      className="space-y-4 mt-3 pt-3 border-t animate-in fade-in slide-in-from-top-2 duration-200"
      data-testid="template-fields-preview"
    >
      {template.categories.map((category) => {
        const categoryFields = getFieldsByCategory(template, category.id);
        if (categoryFields.length === 0) return null;

        return (
          <div key={category.id} className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
              {category.name}
              <Badge variant="secondary" className="text-xs">
                {categoryFields.length} fields
              </Badge>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {categoryFields.map((field) => (
                <FieldPreviewItem key={field.fieldKey} field={field} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface FieldPreviewItemProps {
  field: TemplateField;
}

/**
 * Single field preview item
 */
function FieldPreviewItem({ field }: FieldPreviewItemProps) {
  return (
    <div
      className={cn(
        'text-xs px-2 py-1.5 rounded border',
        field.required
          ? 'border-zinc-300 bg-zinc-50'
          : 'border-zinc-200 bg-white'
      )}
      title={field.description}
      data-testid={`field-preview-${field.fieldKey}`}
    >
      <div className="flex items-center gap-1">
        <span className="text-zinc-700 truncate">{field.label}</span>
        {field.required && (
          <span className="text-red-500 shrink-0">*</span>
        )}
        {field.typicalRange && (
          <Info className="w-3 h-3 text-zinc-400 shrink-0" />
        )}
      </div>
      <div className="text-zinc-400 text-[10px] mt-0.5">
        {field.dataType}
      </div>
    </div>
  );
}
