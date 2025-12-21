'use client';

import React from 'react';
import { Building2, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { CONFIDENCE_THRESHOLDS } from '@/app/features/documents/lib/constants';

export interface DocumentPreviewData {
  facilityName?: string | null;
  totalCommitment?: number | null;
  currency?: string | null;
  maturityDate?: string | null;
  confidenceScore?: number | null;
}

interface DocumentCardPreviewProps {
  data: DocumentPreviewData;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getConfidenceColor(score: number): string {
  if (score >= CONFIDENCE_THRESHOLDS.TRUSTED) return 'text-emerald-600';
  if (score >= CONFIDENCE_THRESHOLDS.REVIEW_OPTIONAL) return 'text-amber-600';
  return 'text-red-600';
}

function getConfidenceLabel(score: number): string {
  if (score >= CONFIDENCE_THRESHOLDS.TRUSTED) return 'High';
  if (score >= CONFIDENCE_THRESHOLDS.REVIEW_OPTIONAL) return 'Medium';
  return 'Low';
}

export function DocumentCardPreview({ data }: DocumentCardPreviewProps) {
  const { facilityName, totalCommitment, currency, maturityDate, confidenceScore } = data;

  const hasData = facilityName || totalCommitment || maturityDate || confidenceScore;

  if (!hasData) {
    return (
      <div
        className="p-3 text-sm text-zinc-500"
        data-testid="document-preview-empty"
      >
        No extracted data available
      </div>
    );
  }

  return (
    <div
      className="p-3 space-y-2.5"
      data-testid="document-preview-content"
    >
      {facilityName && (
        <div className="flex items-start gap-2" data-testid="preview-facility-name">
          <Building2 className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">Facility</p>
            <p className="text-sm font-medium text-zinc-900 truncate">{facilityName}</p>
          </div>
        </div>
      )}

      {totalCommitment !== null && totalCommitment !== undefined && (
        <div className="flex items-start gap-2" data-testid="preview-total-commitment">
          <DollarSign className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-zinc-500">Total Commitment</p>
            <p className="text-sm font-medium text-zinc-900">
              {formatCurrency(totalCommitment, currency || 'USD')}
            </p>
          </div>
        </div>
      )}

      {maturityDate && (
        <div className="flex items-start gap-2" data-testid="preview-maturity-date">
          <Calendar className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-zinc-500">Maturity Date</p>
            <p className="text-sm font-medium text-zinc-900">{formatDate(maturityDate)}</p>
          </div>
        </div>
      )}

      {confidenceScore !== null && confidenceScore !== undefined && (
        <div className="flex items-start gap-2" data-testid="preview-confidence-score">
          <TrendingUp className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-zinc-500">Confidence</p>
            <p className={`text-sm font-medium ${getConfidenceColor(confidenceScore)}`}>
              {getConfidenceLabel(confidenceScore)} ({Math.round(confidenceScore * 100)}%)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
