'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  ExtractionTemplate,
  DocumentTypeDetection,
  TemplateValidationResult,
  TemplatePreferences,
} from '../lib/template-types';
import type { ExtractionCategory } from '../../lib/types';
import {
  getAllTemplates,
  getTemplateById,
} from '../lib/templates';
import {
  detectDocumentType,
  detectDocumentTypeWithFileName,
  shouldAutoApplyTemplate,
  getDetectionDescription,
} from '../lib/template-detector';
import { validateAgainstTemplate } from '../lib/template-validator';

interface UseExtractionTemplateOptions {
  /** Document text for auto-detection */
  documentText?: string;
  /** Document file name for detection hints */
  fileName?: string;
  /** Pre-extracted data for validation */
  extractedData?: ExtractionCategory[];
  /** User preferences */
  preferences?: Partial<TemplatePreferences>;
  /** Auto-detect on mount */
  autoDetect?: boolean;
}

interface UseExtractionTemplateReturn {
  /** Available templates */
  templates: ExtractionTemplate[];
  /** Currently selected template */
  selectedTemplate: ExtractionTemplate | null;
  /** Selected template ID */
  selectedTemplateId: string | null;
  /** Auto-detection result */
  detection: DocumentTypeDetection | null;
  /** Validation results */
  validationResult: TemplateValidationResult | null;
  /** Whether detection is in progress */
  isDetecting: boolean;
  /** Detection description for display */
  detectionDescription: string | null;
  /** Select a template by ID */
  selectTemplate: (templateId: string | null) => void;
  /** Run auto-detection */
  runDetection: () => void;
  /** Apply the recommended template */
  applyRecommendation: () => void;
  /** Validate extracted data against current template */
  validateExtraction: () => void;
  /** Clear template selection */
  clearTemplate: () => void;
}

const defaultPreferences: TemplatePreferences = {
  autoApplyTemplates: true,
  autoApplyMinConfidence: 0.7,
  showAnomalyWarnings: true,
};

/**
 * Hook for managing extraction templates, auto-detection, and validation
 */
export function useExtractionTemplate(
  options: UseExtractionTemplateOptions = {}
): UseExtractionTemplateReturn {
  const {
    documentText,
    fileName,
    extractedData,
    preferences: userPreferences,
    autoDetect = true,
  } = options;

  const preferences = useMemo(
    () => ({ ...defaultPreferences, ...userPreferences }),
    [userPreferences]
  );

  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [detection, setDetection] = useState<DocumentTypeDetection | null>(null);
  const [validationResult, setValidationResult] = useState<TemplateValidationResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Memoized values
  const templates = useMemo(() => getAllTemplates(), []);

  const selectedTemplate = useMemo(
    () => (selectedTemplateId ? getTemplateById(selectedTemplateId) ?? null : null),
    [selectedTemplateId]
  );

  const detectionDescription = useMemo(
    () => (detection ? getDetectionDescription(detection) : null),
    [detection]
  );

  // Run auto-detection
  const runDetection = useCallback(() => {
    if (!documentText) return;

    setIsDetecting(true);

    // Simulate async detection (in real app, this might call an API)
    setTimeout(() => {
      try {
        const result = fileName
          ? detectDocumentTypeWithFileName(documentText, fileName)
          : detectDocumentType(documentText);

        setDetection(result);

        // Auto-apply if enabled and confidence is high enough
        if (
          preferences.autoApplyTemplates &&
          shouldAutoApplyTemplate(result) &&
          result.confidence >= preferences.autoApplyMinConfidence
        ) {
          setSelectedTemplateId(result.recommendedTemplateId);
        }
      } catch (error) {
        console.error('Template detection failed:', error);
      } finally {
        setIsDetecting(false);
      }
    }, 100); // Small delay for UX
  }, [documentText, fileName, preferences.autoApplyTemplates, preferences.autoApplyMinConfidence]);

  // Auto-detect on mount if enabled
  useEffect(() => {
    if (autoDetect && documentText && !detection) {
      runDetection();
    }
  }, [autoDetect, documentText, detection, runDetection]);

  // Select template
  const selectTemplate = useCallback((templateId: string | null) => {
    setSelectedTemplateId(templateId);
    setValidationResult(null); // Clear previous validation
  }, []);

  // Apply recommendation
  const applyRecommendation = useCallback(() => {
    if (detection?.recommendedTemplateId) {
      selectTemplate(detection.recommendedTemplateId);
    }
  }, [detection, selectTemplate]);

  // Validate extraction
  const validateExtraction = useCallback(() => {
    if (!selectedTemplate || !extractedData) return;

    const result = validateAgainstTemplate(extractedData, selectedTemplate);
    setValidationResult(result);
  }, [selectedTemplate, extractedData]);

  // Auto-validate when template or data changes
  useEffect(() => {
    if (selectedTemplate && extractedData && extractedData.length > 0) {
      validateExtraction();
    }
  }, [selectedTemplate, extractedData, validateExtraction]);

  // Clear template
  const clearTemplate = useCallback(() => {
    setSelectedTemplateId(null);
    setValidationResult(null);
  }, []);

  return {
    templates,
    selectedTemplate,
    selectedTemplateId,
    detection,
    validationResult,
    isDetecting,
    detectionDescription,
    selectTemplate,
    runDetection,
    applyRecommendation,
    validateExtraction,
    clearTemplate,
  };
}
