'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  FileText,
  Shield,
  Handshake,
  TrendingUp,
  Leaf,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type {
  LifecycleAutomationResult,
  AutomationProgress,
  AutomationPhase,
} from '@/lib/llm/document-lifecycle';

// ============================================
// Types
// ============================================

interface DocumentLifecycleAutomationProps {
  documentId: string;
  documentName: string;
  onAutomationComplete?: (result: LifecycleAutomationResult) => void;
  className?: string;
}

interface LifecycleModuleConfig {
  enableCompliance: boolean;
  enableDeals: boolean;
  enableTrading: boolean;
  enableESG: boolean;
  autoConfirmLowRiskItems: boolean;
  confidenceThreshold: number;
}

interface ModuleStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  itemsCreated: number;
  itemsPendingReview: number;
  linkUrl?: string;
}

// ============================================
// Subcomponents
// ============================================

function ModuleStatusCard({
  module,
  onClick,
}: {
  module: ModuleStatus;
  onClick?: () => void;
}) {
  const getStatusColor = () => {
    switch (module.status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      case 'skipped':
        return 'text-zinc-400';
      default:
        return 'text-zinc-500';
    }
  };

  const getStatusIcon = () => {
    switch (module.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'skipped':
        return null;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        module.enabled
          ? 'bg-white border-zinc-200 hover:border-zinc-300'
          : 'bg-zinc-50 border-zinc-100',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
      data-testid={`lifecycle-module-${module.id}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-md',
            module.enabled ? 'bg-zinc-100' : 'bg-zinc-50'
          )}
        >
          {module.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium text-sm',
                module.enabled ? 'text-zinc-900' : 'text-zinc-400'
              )}
            >
              {module.name}
            </span>
            {getStatusIcon()}
          </div>
          {module.status === 'completed' && module.itemsCreated > 0 && (
            <span className="text-xs text-zinc-500">
              {module.itemsCreated} items created
              {module.itemsPendingReview > 0 && (
                <span className="text-amber-600 ml-1">
                  ({module.itemsPendingReview} need review)
                </span>
              )}
            </span>
          )}
          {module.status === 'skipped' && (
            <span className="text-xs text-zinc-400">Disabled</span>
          )}
        </div>
      </div>
      {module.linkUrl && module.status === 'completed' && (
        <a
          href={module.linkUrl}
          className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
          onClick={(e) => e.stopPropagation()}
          data-testid={`lifecycle-module-${module.id}-link`}
        >
          <ExternalLink className="h-4 w-4 text-zinc-500" />
        </a>
      )}
    </div>
  );
}

function AutomationProgressDisplay({
  progress,
}: {
  progress: AutomationProgress;
}) {
  const getPhaseLabel = (phase: AutomationPhase): string => {
    const labels: Record<AutomationPhase, string> = {
      queued: 'Queued',
      extracting: 'Extracting Document Data',
      processing_compliance: 'Processing Compliance Module',
      processing_deals: 'Processing Deals Module',
      processing_trading: 'Processing Trading Module',
      processing_esg: 'Processing ESG Module',
      finalizing: 'Finalizing',
      completed: 'Completed',
      failed: 'Failed',
    };
    return labels[phase] || phase;
  };

  return (
    <div className="space-y-3" data-testid="lifecycle-progress-display">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">
          {getPhaseLabel(progress.phase)}
        </span>
        <span className="text-sm text-zinc-500">
          {Math.round(progress.percentComplete)}%
        </span>
      </div>
      <Progress
        value={progress.percentComplete}
        className="h-2"
        animate={true}
      />
      <p className="text-xs text-zinc-500">{progress.currentStep}</p>
      {progress.modulesProcessed.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {progress.modulesProcessed.map((mod) => (
            <span
              key={mod}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs"
            >
              <CheckCircle2 className="h-3 w-3" />
              {mod}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function DocumentLifecycleAutomation({
  documentId,
  documentName,
  onAutomationComplete,
  className,
}: DocumentLifecycleAutomationProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AutomationProgress | null>(null);
  const [result, setResult] = useState<LifecycleAutomationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<LifecycleModuleConfig>({
    enableCompliance: true,
    enableDeals: true,
    enableTrading: true,
    enableESG: true,
    autoConfirmLowRiskItems: false,
    confidenceThreshold: 0.8,
  });

  // Module statuses based on result
  const moduleStatuses: ModuleStatus[] = [
    {
      id: 'compliance',
      name: 'Compliance',
      icon: <Shield className="h-4 w-4 text-blue-600" />,
      enabled: config.enableCompliance,
      status: result?.compliance
        ? 'completed'
        : isRunning && progress?.phase === 'processing_compliance'
          ? 'processing'
          : config.enableCompliance
            ? 'pending'
            : 'skipped',
      itemsCreated:
        (result?.compliance?.covenantsCreated || 0) +
        (result?.compliance?.obligationsCreated || 0),
      itemsPendingReview: result?.compliance?.itemsPendingReview || 0,
      linkUrl: result?.compliance?.facilityId
        ? `/compliance?facility=${result.compliance.facilityId}`
        : undefined,
    },
    {
      id: 'deals',
      name: 'Deal Room',
      icon: <Handshake className="h-4 w-4 text-purple-600" />,
      enabled: config.enableDeals,
      status: result?.deals
        ? 'completed'
        : isRunning && progress?.phase === 'processing_deals'
          ? 'processing'
          : config.enableDeals
            ? 'pending'
            : 'skipped',
      itemsCreated: result?.deals?.termsPopulated || 0,
      itemsPendingReview: 0,
      linkUrl: '/deals',
    },
    {
      id: 'trading',
      name: 'Trading DD',
      icon: <TrendingUp className="h-4 w-4 text-orange-600" />,
      enabled: config.enableTrading,
      status: result?.trading
        ? 'completed'
        : isRunning && progress?.phase === 'processing_trading'
          ? 'processing'
          : config.enableTrading
            ? 'pending'
            : 'skipped',
      itemsCreated: result?.trading?.ddChecklistItemsGenerated || 0,
      itemsPendingReview: 0,
      linkUrl: result?.trading?.facilityId
        ? `/trading?facility=${result.trading.facilityId}`
        : undefined,
    },
    {
      id: 'esg',
      name: 'ESG',
      icon: <Leaf className="h-4 w-4 text-green-600" />,
      enabled: config.enableESG,
      status: result?.esg
        ? 'completed'
        : isRunning && progress?.phase === 'processing_esg'
          ? 'processing'
          : config.enableESG
            ? 'pending'
            : 'skipped',
      itemsCreated:
        (result?.esg?.kpisCreated || 0) + (result?.esg?.targetsCreated || 0),
      itemsPendingReview: 0,
      linkUrl: result?.esg?.facilityId
        ? `/esg?facility=${result.esg.facilityId}`
        : undefined,
    },
  ];

  // Fetch current status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/lifecycle`);
        const data = await response.json();

        if (data.success && data.data) {
          if (data.data.status === 'in_progress') {
            setIsRunning(true);
            setProgress({
              documentId,
              phase: data.data.phase as AutomationPhase,
              percentComplete: data.data.percentComplete,
              currentStep: data.data.currentStep,
              stepsCompleted: 0,
              totalSteps: 6,
              modulesProcessed: [],
              startedAt: new Date().toISOString(),
              estimatedTimeRemainingMs: null,
            });
          } else if (data.data.result) {
            setResult(data.data.result);
          }
        }
      } catch {
        // Ignore fetch errors on mount
      }
    };

    fetchStatus();
  }, [documentId]);

  // Poll for progress when running
  useEffect(() => {
    if (!isRunning) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/lifecycle`);
        const data = await response.json();

        if (data.success && data.data) {
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            setIsRunning(false);
            if (data.data.result) {
              setResult(data.data.result);
              onAutomationComplete?.(data.data.result);
            }
          } else if (data.data.status === 'in_progress') {
            setProgress({
              documentId,
              phase: data.data.phase as AutomationPhase,
              percentComplete: data.data.percentComplete,
              currentStep: data.data.currentStep,
              stepsCompleted: 0,
              totalSteps: 6,
              modulesProcessed: [],
              startedAt: new Date().toISOString(),
              estimatedTimeRemainingMs: null,
            });
          }
        }
      } catch {
        // Continue polling
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [isRunning, documentId, onAutomationComplete]);

  // Trigger automation
  const handleTriggerAutomation = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    setProgress({
      documentId,
      phase: 'queued',
      percentComplete: 0,
      currentStep: 'Starting automation...',
      stepsCompleted: 0,
      totalSteps: 6,
      modulesProcessed: [],
      startedAt: new Date().toISOString(),
      estimatedTimeRemainingMs: null,
    });

    try {
      const response = await fetch(`/api/documents/${documentId}/lifecycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data);
        onAutomationComplete?.(data.data);
      } else {
        setError(data.error?.message || 'Automation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
    }
  }, [documentId, config, onAutomationComplete]);

  // Toggle module
  const handleToggleModule = (moduleId: string) => {
    if (isRunning) return;

    setConfig((prev) => ({
      ...prev,
      [`enable${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)}`]:
        !prev[
          `enable${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)}` as keyof LifecycleModuleConfig
        ],
    }));
  };

  return (
    <div
      className={cn(
        'bg-white border border-zinc-200 rounded-lg overflow-hidden',
        className
      )}
      data-testid="document-lifecycle-automation"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-b border-zinc-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="lifecycle-automation-header"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-zinc-600" />
          <div>
            <h3 className="font-medium text-sm text-zinc-900">
              Document Lifecycle Automation
            </h3>
            <p className="text-xs text-zinc-500">
              {documentName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <span
              className={cn(
                'text-xs px-2 py-1 rounded-full',
                result.automationStatus === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : result.automationStatus === 'partial'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
              )}
            >
              {result.automationStatus === 'completed'
                ? 'Completed'
                : result.automationStatus === 'partial'
                  ? 'Partial'
                  : 'Failed'}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Progress Display (when running) */}
          {isRunning && progress && (
            <AutomationProgressDisplay progress={progress} />
          )}

          {/* Error Display */}
          {error && (
            <div
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
              data-testid="lifecycle-automation-error"
            >
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Module Grid */}
          <div className="grid grid-cols-2 gap-3">
            {moduleStatuses.map((module) => (
              <ModuleStatusCard
                key={module.id}
                module={module}
                onClick={
                  !isRunning && !result
                    ? () => handleToggleModule(module.id)
                    : undefined
                }
              />
            ))}
          </div>

          {/* Action Button */}
          {!result && (
            <button
              onClick={handleTriggerAutomation}
              disabled={isRunning}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                isRunning
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              )}
              data-testid="lifecycle-automation-trigger-btn"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Run Lifecycle Automation
                </>
              )}
            </button>
          )}

          {/* Result Summary */}
          {result && (
            <div
              className="p-3 bg-zinc-50 rounded-lg space-y-2"
              data-testid="lifecycle-automation-result"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">
                  Automation Complete
                </span>
                <span className="text-xs text-zinc-500">
                  {result.processingTimeMs}ms
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Confidence:</span>
                  <span className="font-medium">
                    {Math.round(
                      result.extractionResult.overallConfidence * 100
                    )}
                    %
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Errors:</span>
                  <span className="font-medium">{result.errors.length}</span>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  {result.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-amber-600 flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {err.module}: {err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentLifecycleAutomation;
