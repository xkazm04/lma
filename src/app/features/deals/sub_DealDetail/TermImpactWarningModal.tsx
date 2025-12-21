'use client';

import React, { memo, useMemo } from 'react';
import {
  AlertTriangle,
  GitBranch,
  ArrowRight,
  Calculator,
  Lock,
  Zap,
  Link,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { CategoryWithTerms } from '../lib/types';
import {
  type ImpactAnalysis,
  type DependencyType,
  buildDependencyGraph,
  analyzeTermImpact,
  validateTermChange,
  getDependencyStrengthColor,
  STANDARD_TERM_DEPENDENCIES
} from '../lib/term-dependency-graph';

// Icon component mapping
const DependencyIcon: React.FC<{ type: DependencyType; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'derives_from':
      return <Calculator className={className} aria-hidden="true" />;
    case 'constrained_by':
      return <Lock className={className} aria-hidden="true" />;
    case 'triggers':
      return <Zap className={className} aria-hidden="true" />;
    case 'requires':
      return <Link className={className} aria-hidden="true" />;
    case 'affects_risk':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'covenant_linked':
      return <GitBranch className={className} aria-hidden="true" />;
    default:
      return <ArrowRight className={className} aria-hidden="true" />;
  }
};

// Risk level styling
const riskLevelStyles: Record<ImpactAnalysis['riskLevel'], { bg: string; border: string; text: string; icon: string }> = {
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' }
};

interface TermImpactWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  termId: string;
  termLabel: string;
  proposedValue: string;
  currentValue: string;
  categories: CategoryWithTerms[];
}

export const TermImpactWarningModal = memo(function TermImpactWarningModal({
  isOpen,
  onClose,
  onConfirm,
  termId,
  termLabel,
  proposedValue,
  currentValue,
  categories
}: TermImpactWarningModalProps) {
  // Build graph and analyze impact
  const graph = useMemo(() => {
    return buildDependencyGraph(categories, STANDARD_TERM_DEPENDENCIES);
  }, [categories]);

  const impactAnalysis = useMemo(() => {
    return analyzeTermImpact(graph, categories, termId);
  }, [graph, categories, termId]);

  const validation = useMemo(() => {
    return validateTermChange(graph, categories, termId, proposedValue);
  }, [graph, categories, termId, proposedValue]);

  const hasImpacts = impactAnalysis.totalImpactedTerms > 0;
  const hasBlockers = validation.blockers.length > 0;
  const riskStyle = riskLevelStyles[impactAnalysis.riskLevel];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg"
        data-testid="term-impact-warning-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasBlockers ? (
              <>
                <XCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                <span>Cannot Accept Proposal</span>
              </>
            ) : hasImpacts ? (
              <>
                <AlertTriangle className={`w-5 h-5 ${riskStyle.icon}`} aria-hidden="true" />
                <span>Review Cascading Effects</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                <span>Confirm Change</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasBlockers
              ? 'This change cannot be made due to blocking dependencies.'
              : hasImpacts
              ? 'This change will affect other terms in the negotiation.'
              : 'This change has no detected dependencies.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Change Summary */}
          <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
            <h4 className="text-sm font-medium text-zinc-900 mb-2">{termLabel}</h4>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500 line-through" data-testid="current-value-display">
                {currentValue}
              </span>
              <ArrowRight className="w-4 h-4 text-zinc-400" aria-hidden="true" />
              <span className="font-semibold text-zinc-900 bg-blue-50 px-1.5 py-0.5 rounded" data-testid="proposed-value-display">
                {proposedValue}
              </span>
            </div>
          </div>

          {/* Blockers */}
          {hasBlockers && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg p-3"
              data-testid="blockers-section"
            >
              <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
                <XCircle className="w-4 h-4" aria-hidden="true" />
                Blocking Issues
              </div>
              <ul className="text-sm text-red-600 space-y-1 ml-6 list-disc">
                {validation.blockers.map((blocker, i) => (
                  <li key={i}>{blocker}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Impact Summary */}
          {hasImpacts && (
            <div
              className={`${riskStyle.bg} ${riskStyle.border} border rounded-lg p-3`}
              data-testid="impact-summary-section"
            >
              <div className={`flex items-center justify-between mb-2`}>
                <div className={`flex items-center gap-2 ${riskStyle.text} font-medium text-sm`}>
                  <GitBranch className="w-4 h-4" aria-hidden="true" />
                  Impact Analysis
                </div>
                <Badge className={`${riskStyle.bg} ${riskStyle.text}`}>
                  {impactAnalysis.riskLevel.charAt(0).toUpperCase() + impactAnalysis.riskLevel.slice(1)} Risk
                </Badge>
              </div>
              <p className="text-sm text-zinc-600 mb-3">
                {impactAnalysis.totalImpactedTerms} term{impactAnalysis.totalImpactedTerms !== 1 ? 's' : ''} will be affected
                {impactAnalysis.cascadingImpacts.length > 0 && (
                  <span> ({impactAnalysis.cascadingImpacts.length} through cascading effects)</span>
                )}
              </p>

              {/* Affected Terms List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {impactAnalysis.directImpacts.map((impact) => (
                  <div
                    key={impact.termId}
                    className={`flex items-center gap-2 p-2 rounded border ${getDependencyStrengthColor(impact.strength)}`}
                    data-testid={`impact-term-${impact.termId}`}
                  >
                    <DependencyIcon type={impact.dependencyType} className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{impact.termLabel}</span>
                      {impact.categoryName && (
                        <span className="text-xs text-zinc-500 ml-2">({impact.categoryName})</span>
                      )}
                    </div>
                  </div>
                ))}
                {impactAnalysis.cascadingImpacts.slice(0, 3).map((impact) => (
                  <div
                    key={impact.termId}
                    className={`flex items-center gap-2 p-2 rounded border opacity-75 ${getDependencyStrengthColor(impact.strength)}`}
                    data-testid={`cascade-term-${impact.termId}`}
                  >
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {Array.from({ length: Math.min(impact.chainDepth, 3) }).map((_, i) => (
                        <ArrowRight key={i} className="w-2 h-2 text-zinc-400" aria-hidden="true" />
                      ))}
                    </div>
                    <DependencyIcon type={impact.dependencyType} className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{impact.termLabel}</span>
                  </div>
                ))}
                {impactAnalysis.cascadingImpacts.length > 3 && (
                  <p className="text-xs text-zinc-500 italic pl-2">
                    +{impactAnalysis.cascadingImpacts.length - 3} more cascading effects...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div
              className="bg-amber-50 border border-amber-200 rounded-lg p-3"
              data-testid="warnings-section"
            >
              <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-2">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Warnings
              </div>
              <ul className="text-sm text-amber-600 space-y-1 ml-6 list-disc">
                {validation.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {impactAnalysis.suggestions.length > 0 && !hasBlockers && (
            <div
              className="bg-blue-50 border border-blue-200 rounded-lg p-3"
              data-testid="suggestions-section"
            >
              <div className="flex items-center gap-2 text-blue-700 font-medium text-sm mb-2">
                <Info className="w-4 h-4" aria-hidden="true" />
                Recommendations
              </div>
              <ul className="text-sm text-blue-600 space-y-1 ml-6 list-disc">
                {impactAnalysis.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="cancel-change-btn"
          >
            Cancel
          </Button>
          {!hasBlockers && (
            <Button
              onClick={onConfirm}
              className={hasImpacts && impactAnalysis.riskLevel !== 'low' ? 'bg-amber-600 hover:bg-amber-700' : ''}
              data-testid="confirm-change-btn"
            >
              {hasImpacts
                ? `Accept with ${impactAnalysis.totalImpactedTerms} Impact${impactAnalysis.totalImpactedTerms !== 1 ? 's' : ''}`
                : 'Confirm Change'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
