'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Download,
  FileSpreadsheet,
  File,
  Check,
  Loader2,
  AlertCircle,
  Settings2,
  LayoutGrid,
  Filter,
  Palette,
  BookOpen,
  Scale,
  ClipboardList,
  FileCheck,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComparisonResult } from '@/types';
import type { ComparisonRiskAnalysis } from '../../lib/types';
import type { AnnotationsMap, ReviewStatus } from '../lib/types';
import type {
  ExportFormat,
  ExportTemplateType,
  ExportConfig,
  ExportSectionConfig,
  ExportTemplate,
  ExportSection,
} from '../lib/export-types';
import {
  EXPORT_TEMPLATES,
  FORMAT_CONFIG,
  SECTION_DISPLAY_NAMES,
  ALL_EXPORT_SECTIONS,
  DEFAULT_EXPORT_STYLING,
  DEFAULT_EXPORT_FILTERS,
} from '../lib/export-types';
import { useExport } from '../hooks/useExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparisonResult: ComparisonResult | null;
  annotations: AnnotationsMap;
  riskAnalysis?: ComparisonRiskAnalysis | null;
  doc1Name?: string;
  doc2Name?: string;
}

/**
 * Modal component for configuring and executing comparison exports
 */
export function ExportModal({
  isOpen,
  onClose,
  comparisonResult,
  annotations,
  riskAnalysis,
  doc1Name = 'Document 1',
  doc2Name = 'Document 2',
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'customize'>('templates');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    isExporting,
    exportError,
    exportConfig,
    templates,
    selectedTemplate,
    selectTemplate,
    updateConfig,
    setFormat,
    setFilename,
    resetConfig,
    downloadExport,
    isFormatSupported,
    prepareExport,
  } = useExport({
    comparisonResult,
    annotations,
    riskAnalysis,
    doc1Name,
    doc2Name,
  });

  // Reset on close
  const handleClose = useCallback(() => {
    resetConfig();
    setActiveTab('templates');
    setShowAdvanced(false);
    onClose();
  }, [resetConfig, onClose]);

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      selectTemplate(templateId);
      setActiveTab('customize');
    },
    [selectTemplate]
  );

  // Handle export
  const handleExport = useCallback(async () => {
    const data = prepareExport();
    if (data) {
      await downloadExport();
      handleClose();
    }
  }, [prepareExport, downloadExport, handleClose]);

  // Get format icon
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'docx':
        return <File className="w-5 h-5" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5" />;
    }
  };

  // Get template icon
  const getTemplateIcon = (type: ExportTemplateType) => {
    switch (type) {
      case 'executive_summary':
        return <BookOpen className="w-6 h-6" />;
      case 'legal_redline':
        return <Scale className="w-6 h-6" />;
      case 'audit_changelog':
        return <ClipboardList className="w-6 h-6" />;
      case 'standard':
        return <FileCheck className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  // Get template color
  const getTemplateColor = (type: ExportTemplateType) => {
    switch (type) {
      case 'executive_summary':
        return 'from-blue-500 to-indigo-500';
      case 'legal_redline':
        return 'from-purple-500 to-violet-500';
      case 'audit_changelog':
        return 'from-emerald-500 to-teal-500';
      case 'standard':
        return 'from-zinc-500 to-slate-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        data-testid="export-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Export Comparison Report
          </DialogTitle>
          <DialogDescription>
            Export your comparison with annotations, risk scores, and review statuses preserved
          </DialogDescription>
        </DialogHeader>

        {/* Error State */}
        {exportError && (
          <div
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
            data-testid="export-error"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{exportError}</p>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'templates' | 'customize')}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" data-testid="export-tab-templates">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Choose Template
            </TabsTrigger>
            <TabsTrigger
              value="customize"
              disabled={!selectedTemplate}
              data-testid="export-tab-customize"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Customize Export
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={() => handleTemplateSelect(template.id)}
                  getIcon={getTemplateIcon}
                  getColor={getTemplateColor}
                />
              ))}
            </div>
          </TabsContent>

          {/* Customize Tab */}
          <TabsContent value="customize" className="flex-1 overflow-hidden mt-4">
            {exportConfig && (
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  {/* Format Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Export Format</Label>
                    <div className="flex gap-3">
                      {(['pdf', 'docx', 'xlsx'] as ExportFormat[]).map((format) => (
                        <Button
                          key={format}
                          type="button"
                          variant={exportConfig.format === format ? 'default' : 'outline'}
                          className={cn(
                            'flex-1 h-auto py-3 flex-col gap-1',
                            !isFormatSupported(format) && 'opacity-50 cursor-not-allowed'
                          )}
                          disabled={!isFormatSupported(format)}
                          onClick={() => setFormat(format)}
                          data-testid={`export-format-${format}`}
                        >
                          {getFormatIcon(format)}
                          <span className="text-xs">{FORMAT_CONFIG[format].name}</span>
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {FORMAT_CONFIG[exportConfig.format].description}
                    </p>
                  </div>

                  {/* Filename */}
                  <div className="space-y-2">
                    <Label htmlFor="filename">Filename</Label>
                    <div className="flex gap-2">
                      <Input
                        id="filename"
                        value={exportConfig.filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="Enter filename"
                        data-testid="export-filename-input"
                      />
                      <span className="flex items-center text-sm text-zinc-500">
                        .{FORMAT_CONFIG[exportConfig.format].extension}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Sections */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Included Sections</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateConfig({
                            sections: exportConfig.sections.map((s) => ({
                              ...s,
                              included: true,
                            })),
                          })
                        }
                        data-testid="export-select-all-sections"
                      >
                        Select All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {exportConfig.sections
                        .sort((a, b) => a.order - b.order)
                        .map((section) => (
                          <SectionToggle
                            key={section.section}
                            section={section}
                            onToggle={(included) =>
                              updateConfig({
                                sections: exportConfig.sections.map((s) =>
                                  s.section === section.section ? { ...s, included } : s
                                ),
                              })
                            }
                          />
                        ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Include Options */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Include</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="risk-scores" className="text-sm font-normal">
                            Risk Scores
                          </Label>
                          {!riskAnalysis && (
                            <Badge variant="secondary" className="text-xs">
                              Not available
                            </Badge>
                          )}
                        </div>
                        <Switch
                          id="risk-scores"
                          checked={exportConfig.includeRiskScores}
                          onCheckedChange={(checked) =>
                            updateConfig({ includeRiskScores: checked })
                          }
                          disabled={!riskAnalysis}
                          data-testid="export-toggle-risk-scores"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="market-benchmarks" className="text-sm font-normal">
                          Market Benchmarks
                        </Label>
                        <Switch
                          id="market-benchmarks"
                          checked={exportConfig.includeMarketBenchmarks}
                          onCheckedChange={(checked) =>
                            updateConfig({ includeMarketBenchmarks: checked })
                          }
                          disabled={!riskAnalysis}
                          data-testid="export-toggle-market-benchmarks"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced Options */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      data-testid="export-toggle-advanced"
                    >
                      <Settings2 className="w-4 h-4" />
                      Advanced Options
                      {showAdvanced ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showAdvanced && (
                      <div className="space-y-4 pl-6 border-l-2 border-zinc-100">
                        {/* Change Type Filters */}
                        <div className="space-y-2">
                          <Label className="text-sm text-zinc-600">Change Types</Label>
                          <div className="flex gap-4">
                            {(['includeAdded', 'includeRemoved', 'includeModified'] as const).map(
                              (key) => {
                                const labels = {
                                  includeAdded: 'Added',
                                  includeRemoved: 'Removed',
                                  includeModified: 'Modified',
                                };
                                return (
                                  <label
                                    key={key}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={exportConfig.filters[key]}
                                      onCheckedChange={(checked) =>
                                        updateConfig({
                                          filters: {
                                            ...exportConfig.filters,
                                            [key]: checked === true,
                                          },
                                        })
                                      }
                                      data-testid={`export-filter-${key}`}
                                    />
                                    <span className="text-sm">{labels[key]}</span>
                                  </label>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {/* Annotation Filters */}
                        <div className="space-y-2">
                          <Label className="text-sm text-zinc-600">Annotation Filters</Label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={exportConfig.filters.annotatedOnly}
                                onCheckedChange={(checked) =>
                                  updateConfig({
                                    filters: {
                                      ...exportConfig.filters,
                                      annotatedOnly: checked === true,
                                    },
                                  })
                                }
                                data-testid="export-filter-annotated-only"
                              />
                              <span className="text-sm">Annotated only</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={exportConfig.filters.withCommentsOnly}
                                onCheckedChange={(checked) =>
                                  updateConfig({
                                    filters: {
                                      ...exportConfig.filters,
                                      withCommentsOnly: checked === true,
                                    },
                                  })
                                }
                                data-testid="export-filter-with-comments"
                              />
                              <span className="text-sm">With comments only</span>
                            </label>
                          </div>
                        </div>

                        {/* Styling Options */}
                        <div className="space-y-2">
                          <Label className="text-sm text-zinc-600">Styling</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Include page numbers</span>
                              <Switch
                                checked={exportConfig.styling.includePageNumbers}
                                onCheckedChange={(checked) =>
                                  updateConfig({
                                    styling: {
                                      ...exportConfig.styling,
                                      includePageNumbers: checked,
                                    },
                                  })
                                }
                                data-testid="export-style-page-numbers"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Include table of contents</span>
                              <Switch
                                checked={exportConfig.styling.includeTableOfContents}
                                onCheckedChange={(checked) =>
                                  updateConfig({
                                    styling: {
                                      ...exportConfig.styling,
                                      includeTableOfContents: checked,
                                    },
                                  })
                                }
                                data-testid="export-style-toc"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Include watermark</span>
                              <Switch
                                checked={exportConfig.styling.includeWatermark}
                                onCheckedChange={(checked) =>
                                  updateConfig({
                                    styling: {
                                      ...exportConfig.styling,
                                      includeWatermark: checked,
                                    },
                                  })
                                }
                                data-testid="export-style-watermark"
                              />
                            </div>
                            {exportConfig.styling.includeWatermark && (
                              <Input
                                placeholder="Watermark text"
                                value={exportConfig.styling.watermarkText || ''}
                                onChange={(e) =>
                                  updateConfig({
                                    styling: {
                                      ...exportConfig.styling,
                                      watermarkText: e.target.value,
                                    },
                                  })
                                }
                                className="mt-2"
                                data-testid="export-watermark-text"
                              />
                            )}
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                          <Label htmlFor="export-notes" className="text-sm text-zinc-600">
                            Additional Notes
                          </Label>
                          <textarea
                            id="export-notes"
                            className="w-full min-h-[80px] p-3 text-sm border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add notes to include in the export..."
                            value={exportConfig.notes || ''}
                            onChange={(e) => updateConfig({ notes: e.target.value })}
                            data-testid="export-notes-input"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {selectedTemplate && (
                <>
                  <Info className="w-3 h-3" />
                  <span>Template: {selectedTemplate.name}</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} data-testid="export-cancel-btn">
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={!exportConfig || isExporting}
                className="min-w-[140px]"
                data-testid="export-download-btn"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Sub-components
// ============================================

interface TemplateCardProps {
  template: ExportTemplate;
  isSelected: boolean;
  onSelect: () => void;
  getIcon: (type: ExportTemplateType) => React.ReactNode;
  getColor: (type: ExportTemplateType) => string;
}

function TemplateCard({ template, isSelected, onSelect, getIcon, getColor }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500'
      )}
      onClick={onSelect}
      data-testid={`export-template-${template.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2 rounded-lg bg-gradient-to-br text-white',
              getColor(template.type)
            )}
          >
            {getIcon(template.type)}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
            <CardDescription className="text-xs mt-0.5 line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          {isSelected && <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-1 flex-wrap">
          {template.supportedFormats.map((format) => (
            <Badge key={format} variant="secondary" className="text-xs">
              {format.toUpperCase()}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SectionToggleProps {
  section: ExportSectionConfig;
  onToggle: (included: boolean) => void;
}

function SectionToggle({ section, onToggle }: SectionToggleProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
        section.included
          ? 'bg-blue-50 border-blue-200 text-blue-700'
          : 'bg-zinc-50 border-zinc-200 text-zinc-500'
      )}
    >
      <Checkbox
        checked={section.included}
        onCheckedChange={(checked) => onToggle(checked === true)}
        data-testid={`export-section-${section.section}`}
      />
      <span className="text-sm">{SECTION_DISPLAY_NAMES[section.section]}</span>
    </label>
  );
}

export default ExportModal;
