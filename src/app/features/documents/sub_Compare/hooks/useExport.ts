'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ComparisonResult } from '@/types';
import type { ComparisonRiskAnalysis } from '../../lib/types';
import type { AnnotationsMap } from '../lib/types';
import type {
  ExportConfig,
  ExportFormat,
  ExportTemplateType,
  ExportData,
  ExportTemplate,
  AuditTrailEntry,
} from '../lib/export-types';
import {
  EXPORT_TEMPLATES,
  getExportTemplate,
  createExportConfigFromTemplate,
  generateExportFilename,
  DEFAULT_EXPORT_STYLING,
  DEFAULT_EXPORT_FILTERS,
  ALL_EXPORT_SECTIONS,
  FORMAT_CONFIG,
} from '../lib/export-types';
import {
  prepareExportData,
  generatePDFContent,
  generateExcelContent,
  generateDocxContent,
} from '../lib/export-generators';

interface UseExportOptions {
  comparisonResult: ComparisonResult | null;
  annotations: AnnotationsMap;
  riskAnalysis?: ComparisonRiskAnalysis | null;
  doc1Name?: string;
  doc2Name?: string;
}

interface UseExportReturn {
  // State
  isExporting: boolean;
  exportError: string | null;
  exportConfig: ExportConfig | null;
  exportData: ExportData | null;

  // Templates
  templates: ExportTemplate[];
  selectedTemplate: ExportTemplate | null;

  // Actions
  selectTemplate: (templateId: string) => void;
  updateConfig: (updates: Partial<ExportConfig>) => void;
  setFormat: (format: ExportFormat) => void;
  setFilename: (filename: string) => void;
  resetConfig: () => void;
  prepareExport: () => ExportData | null;
  executeExport: () => Promise<void>;
  downloadExport: () => Promise<void>;

  // Helpers
  getDefaultFilename: (format: ExportFormat) => string;
  isFormatSupported: (format: ExportFormat) => boolean;
}

export function useExport({
  comparisonResult,
  annotations,
  riskAnalysis,
  doc1Name = 'Document 1',
  doc2Name = 'Document 2',
}: UseExportOptions): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportConfig, setExportConfig] = useState<ExportConfig | null>(null);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);

  // Get default filename
  const getDefaultFilename = useCallback(
    (format: ExportFormat) => {
      const templateType = selectedTemplate?.type || 'standard';
      return generateExportFilename(doc1Name, doc2Name, templateType, format);
    },
    [doc1Name, doc2Name, selectedTemplate]
  );

  // Select a template
  const selectTemplate = useCallback(
    (templateId: string) => {
      const template = getExportTemplate(templateId);
      if (!template) {
        setExportError(`Template "${templateId}" not found`);
        return;
      }

      setSelectedTemplate(template);
      const defaultFormat = template.supportedFormats[0];
      const defaultFilename = generateExportFilename(
        doc1Name,
        doc2Name,
        template.type,
        defaultFormat
      );

      const config = createExportConfigFromTemplate(template, defaultFormat, defaultFilename);
      setExportConfig(config);
      setExportError(null);
    },
    [doc1Name, doc2Name]
  );

  // Update config
  const updateConfig = useCallback((updates: Partial<ExportConfig>) => {
    setExportConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  // Set format
  const setFormat = useCallback(
    (format: ExportFormat) => {
      setExportConfig((prev) => {
        if (!prev) return prev;
        // Update filename extension if needed
        const newFilename = prev.filename.replace(/\.[^.]+$/, '') || prev.filename;
        return { ...prev, format, filename: newFilename };
      });
    },
    []
  );

  // Set filename
  const setFilename = useCallback((filename: string) => {
    setExportConfig((prev) => {
      if (!prev) return prev;
      // Remove extension if provided
      const cleanFilename = filename.replace(/\.[^.]+$/, '');
      return { ...prev, filename: cleanFilename };
    });
  }, []);

  // Reset config
  const resetConfig = useCallback(() => {
    setExportConfig(null);
    setSelectedTemplate(null);
    setExportData(null);
    setExportError(null);
  }, []);

  // Check if format is supported for current template
  const isFormatSupported = useCallback(
    (format: ExportFormat) => {
      if (!selectedTemplate) return true;
      return selectedTemplate.supportedFormats.includes(format);
    },
    [selectedTemplate]
  );

  // Prepare export data
  const prepareExport = useCallback(() => {
    if (!comparisonResult || !exportConfig) {
      setExportError('No comparison result or export configuration');
      return null;
    }

    try {
      // Generate mock audit trail for demo
      const auditTrail: AuditTrailEntry[] = [
        {
          timestamp: new Date().toISOString(),
          user: { name: 'System', email: 'system@example.com' },
          action: 'comparison_created',
          description: `Comparison created between ${doc1Name} and ${doc2Name}`,
        },
        {
          timestamp: new Date().toISOString(),
          user: { name: 'Current User', email: 'user@example.com' },
          action: 'export_generated',
          description: `Export generated in ${exportConfig.format.toUpperCase()} format`,
        },
      ];

      const data = prepareExportData(
        exportConfig,
        comparisonResult,
        annotations,
        riskAnalysis,
        auditTrail
      );

      setExportData(data);
      setExportError(null);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prepare export data';
      setExportError(message);
      return null;
    }
  }, [comparisonResult, exportConfig, annotations, riskAnalysis, doc1Name, doc2Name]);

  // Execute export (generate content)
  const executeExport = useCallback(async () => {
    if (!exportConfig) {
      setExportError('No export configuration');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const data = prepareExport();
      if (!data) {
        throw new Error('Failed to prepare export data');
      }

      // Simulate generation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate content based on format
      switch (exportConfig.format) {
        case 'pdf':
          generatePDFContent(data);
          break;
        case 'xlsx':
          generateExcelContent(data);
          break;
        case 'docx':
          generateDocxContent(data);
          break;
      }

      setExportData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  }, [exportConfig, prepareExport]);

  // Download export (trigger browser download)
  const downloadExport = useCallback(async () => {
    if (!exportConfig || !exportData) {
      setExportError('No export data available');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      // Simulate download preparation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In production, this would actually generate and download the file
      // For now, we'll create a JSON representation as a demo
      const formatInfo = FORMAT_CONFIG[exportConfig.format];
      const filename = `${exportConfig.filename}.${formatInfo.extension}`;

      // Create a blob with the export data (in production, this would be the actual file)
      const content = JSON.stringify(exportData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportConfig.filename}_preview.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // In a real implementation, you would call an API endpoint:
      // const response = await fetch('/api/documents/export', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ config: exportConfig, data: exportData }),
      // });
      // const blob = await response.blob();
      // ...

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  }, [exportConfig, exportData]);

  return {
    isExporting,
    exportError,
    exportConfig,
    exportData,
    templates: EXPORT_TEMPLATES,
    selectedTemplate,
    selectTemplate,
    updateConfig,
    setFormat,
    setFilename,
    resetConfig,
    prepareExport,
    executeExport,
    downloadExport,
    getDefaultFilename,
    isFormatSupported,
  };
}

export type { UseExportReturn };
