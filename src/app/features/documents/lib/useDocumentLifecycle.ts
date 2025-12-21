'use client';

import { useState, useCallback } from 'react';
import type {
  LifecycleAutomationResult,
  AutomationProgress,
} from '@/lib/llm/document-lifecycle';

export interface UseDocumentLifecycleOptions {
  onSuccess?: (result: LifecycleAutomationResult) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: AutomationProgress) => void;
}

export interface DocumentLifecycleState {
  isLoading: boolean;
  isPolling: boolean;
  progress: AutomationProgress | null;
  result: LifecycleAutomationResult | null;
  error: string | null;
}

export interface UseDocumentLifecycleReturn extends DocumentLifecycleState {
  triggerAutomation: (config?: LifecycleConfig) => Promise<void>;
  getStatus: () => Promise<void>;
  reset: () => void;
}

export interface LifecycleConfig {
  enableCompliance?: boolean;
  enableDeals?: boolean;
  enableTrading?: boolean;
  enableESG?: boolean;
  autoConfirmLowRiskItems?: boolean;
  confidenceThreshold?: number;
}

export function useDocumentLifecycle(
  documentId: string,
  options: UseDocumentLifecycleOptions = {}
): UseDocumentLifecycleReturn {
  const { onSuccess, onError, onProgress } = options;

  const [state, setState] = useState<DocumentLifecycleState>({
    isLoading: false,
    isPolling: false,
    progress: null,
    result: null,
    error: null,
  });

  const getStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/lifecycle`);
      const data = await response.json();

      if (data.success && data.data) {
        if (data.data.result) {
          setState((prev) => ({
            ...prev,
            result: data.data.result,
            error: null,
          }));
        }
        if (data.data.status === 'in_progress') {
          const progress: AutomationProgress = {
            documentId,
            phase: data.data.phase,
            percentComplete: data.data.percentComplete,
            currentStep: data.data.currentStep,
            stepsCompleted: 0,
            totalSteps: 6,
            modulesProcessed: [],
            startedAt: new Date().toISOString(),
            estimatedTimeRemainingMs: null,
          };
          setState((prev) => ({
            ...prev,
            progress,
            isPolling: true,
          }));
          onProgress?.(progress);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get status';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [documentId, onProgress]);

  const triggerAutomation = useCallback(
    async (config: LifecycleConfig = {}) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        result: null,
        progress: {
          documentId,
          phase: 'queued',
          percentComplete: 0,
          currentStep: 'Starting automation...',
          stepsCompleted: 0,
          totalSteps: 6,
          modulesProcessed: [],
          startedAt: new Date().toISOString(),
          estimatedTimeRemainingMs: null,
        },
      }));

      try {
        const response = await fetch(`/api/documents/${documentId}/lifecycle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enableCompliance: config.enableCompliance ?? true,
            enableDeals: config.enableDeals ?? true,
            enableTrading: config.enableTrading ?? true,
            enableESG: config.enableESG ?? true,
            autoConfirmLowRiskItems: config.autoConfirmLowRiskItems ?? false,
            confidenceThreshold: config.confidenceThreshold ?? 0.8,
          }),
        });

        const data = await response.json();

        if (data.success && data.data) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            result: data.data,
            progress: null,
          }));
          onSuccess?.(data.data);
        } else {
          const errorMessage = data.error?.message || 'Automation failed';
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
            progress: null,
          }));
          onError?.(errorMessage);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An error occurred';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
          progress: null,
        }));
        onError?.(message);
      }
    },
    [documentId, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isPolling: false,
      progress: null,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    triggerAutomation,
    getStatus,
    reset,
  };
}

export default useDocumentLifecycle;
