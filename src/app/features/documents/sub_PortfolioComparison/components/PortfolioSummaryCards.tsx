'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertTriangle, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortfolioSummary, PortfolioRiskScore } from '../lib/types';

interface PortfolioSummaryCardsProps {
  summary: PortfolioSummary;
  riskScore: PortfolioRiskScore;
}

export const PortfolioSummaryCards = memo(function PortfolioSummaryCards({
  summary,
  riskScore,
}: PortfolioSummaryCardsProps) {
  const getRiskScoreColor = (score: number) => {
    if (score <= 30) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Low Risk' };
    if (score <= 60) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Moderate Risk' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'High Risk' };
  };

  const riskStyle = getRiskScoreColor(riskScore.overallScore);

  return (
    <div className="grid grid-cols-5 gap-4">
      {/* Documents Analyzed */}
      <Card
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        data-testid="portfolio-summary-documents"
      >
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500">Documents Analyzed</p>
              <p className="text-2xl font-bold text-zinc-900">{summary.totalDocuments}</p>
              <p className="text-xs text-zinc-400 mt-1">
                {summary.documentsByType.facility_agreement || 0} facilities, {summary.documentsByType.amendment || 0} amendments
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Score */}
      <Card
        className={cn(
          'animate-in fade-in slide-in-from-bottom-2 duration-300',
          riskStyle.bg,
          riskStyle.border
        )}
        style={{ animationDelay: '50ms', animationFillMode: 'both' }}
        data-testid="portfolio-summary-risk-score"
      >
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className={cn('text-sm', riskStyle.text)}>Portfolio Risk</p>
              <p className={cn('text-2xl font-bold', riskStyle.text)}>{riskScore.overallScore}/100</p>
              <p className={cn('text-xs mt-1', riskStyle.text)}>{riskStyle.label}</p>
            </div>
            <div className={cn('p-2 rounded-lg', riskStyle.bg)}>
              <TrendingUp className={cn('w-5 h-5', riskStyle.text)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues */}
      <Card
        className={cn(
          'animate-in fade-in slide-in-from-bottom-2 duration-300',
          summary.anomaliesBySeverity.critical > 0 ? 'bg-red-50 border-red-200' : ''
        )}
        style={{ animationDelay: '100ms', animationFillMode: 'both' }}
        data-testid="portfolio-summary-critical"
      >
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className={cn('text-sm', summary.anomaliesBySeverity.critical > 0 ? 'text-red-600' : 'text-zinc-500')}>
                Critical Issues
              </p>
              <p className={cn('text-2xl font-bold', summary.anomaliesBySeverity.critical > 0 ? 'text-red-700' : 'text-zinc-900')}>
                {summary.anomaliesBySeverity.critical}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Requires immediate action</p>
            </div>
            <div className={cn('p-2 rounded-lg', summary.anomaliesBySeverity.critical > 0 ? 'bg-red-100' : 'bg-zinc-50')}>
              <AlertCircle className={cn('w-5 h-5', summary.anomaliesBySeverity.critical > 0 ? 'text-red-600' : 'text-zinc-400')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      <Card
        className={cn(
          'animate-in fade-in slide-in-from-bottom-2 duration-300',
          summary.anomaliesBySeverity.warning > 0 ? 'bg-amber-50 border-amber-200' : ''
        )}
        style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        data-testid="portfolio-summary-warnings"
      >
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className={cn('text-sm', summary.anomaliesBySeverity.warning > 0 ? 'text-amber-600' : 'text-zinc-500')}>
                Warnings
              </p>
              <p className={cn('text-2xl font-bold', summary.anomaliesBySeverity.warning > 0 ? 'text-amber-700' : 'text-zinc-900')}>
                {summary.anomaliesBySeverity.warning}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Review recommended</p>
            </div>
            <div className={cn('p-2 rounded-lg', summary.anomaliesBySeverity.warning > 0 ? 'bg-amber-100' : 'bg-zinc-50')}>
              <AlertTriangle className={cn('w-5 h-5', summary.anomaliesBySeverity.warning > 0 ? 'text-amber-600' : 'text-zinc-400')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extraction Quality */}
      <Card
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ animationDelay: '200ms', animationFillMode: 'both' }}
        data-testid="portfolio-summary-confidence"
      >
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500">Extraction Quality</p>
              <p className="text-2xl font-bold text-zinc-900">{(summary.avgExtractionConfidence * 100).toFixed(0)}%</p>
              <p className="text-xs text-zinc-400 mt-1">
                {summary.termsWithAnomalies} of {summary.totalTermsAnalyzed} terms flagged
              </p>
            </div>
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
