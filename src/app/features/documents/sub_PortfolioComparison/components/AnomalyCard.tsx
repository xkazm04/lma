'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  FileQuestion,
  GitCompare,
  TrendingDown,
  AlertCircle,
  Zap,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortfolioAnomaly, AnomalyType } from '../lib/types';
import { ANOMALY_SEVERITY_CONFIG, ANOMALY_TYPE_CONFIG, TERM_CATEGORY_CONFIG } from '../lib/types';

interface AnomalyCardProps {
  anomaly: PortfolioAnomaly;
  onViewDocument?: (documentId: string) => void;
}

const getAnomalyIcon = (type: AnomalyType) => {
  switch (type) {
    case 'unusual_value':
      return <AlertTriangle className="w-4 h-4" />;
    case 'missing_term':
      return <FileQuestion className="w-4 h-4" />;
    case 'inconsistent_term':
      return <GitCompare className="w-4 h-4" />;
    case 'market_deviation':
      return <TrendingDown className="w-4 h-4" />;
    case 'low_confidence':
      return <AlertCircle className="w-4 h-4" />;
    case 'outlier':
      return <Zap className="w-4 h-4" />;
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
};

export const AnomalyCard = memo(function AnomalyCard({
  anomaly,
  onViewDocument,
}: AnomalyCardProps) {
  const severityConfig = ANOMALY_SEVERITY_CONFIG[anomaly.severity];
  const typeConfig = ANOMALY_TYPE_CONFIG[anomaly.type];
  const categoryConfig = TERM_CATEGORY_CONFIG[anomaly.termCategory as keyof typeof TERM_CATEGORY_CONFIG];

  const formatValue = (value: string | number | null) => {
    if (value === null) return 'Not found';
    if (typeof value === 'number') {
      if (anomaly.termCategory === 'financial_terms' || anomaly.termName.includes('Commitment')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      }
      if (anomaly.termName.includes('Margin') || anomaly.termName.includes('Fee')) {
        return `${value}%`;
      }
      if (anomaly.termName.includes('Ratio')) {
        return `${value}x`;
      }
      return value.toString();
    }
    return value;
  };

  return (
    <Card
      className={cn(
        'animate-in fade-in slide-in-from-bottom-2 duration-300',
        severityConfig.bgColor,
        severityConfig.borderColor
      )}
      data-testid={`anomaly-card-${anomaly.id}`}
    >
      <CardContent className="py-4">
        <div className="space-y-3">
          {/* Header with badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(severityConfig.bgColor, severityConfig.color, severityConfig.borderColor)}
              >
                <span className={cn('mr-1', severityConfig.color)}>
                  {getAnomalyIcon(anomaly.type)}
                </span>
                {severityConfig.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {typeConfig.label}
              </Badge>
              {categoryConfig && (
                <Badge variant="outline" className={cn(categoryConfig.bgColor, categoryConfig.color, 'text-xs')}>
                  {categoryConfig.label}
                </Badge>
              )}
            </div>
            {anomaly.deviation !== undefined && (
              <span className={cn('text-sm font-medium', severityConfig.color)}>
                {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Term and Value */}
          <div>
            <h4 className="font-semibold text-zinc-900">{anomaly.termName}</h4>
            <p className="text-sm text-zinc-600 mt-0.5">
              Value: <span className="font-medium">{formatValue(anomaly.value)}</span>
            </p>
            {anomaly.expectedRange && (
              <p className="text-xs text-zinc-500 mt-1">
                Expected: {formatValue(anomaly.expectedRange.min)} – {formatValue(anomaly.expectedRange.max)}
                {anomaly.expectedRange.marketAvg && (
                  <> (Market avg: {formatValue(anomaly.expectedRange.marketAvg)})</>
                )}
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-700">{anomaly.description}</p>

          {/* Recommendation */}
          {anomaly.recommendation && (
            <div className="bg-white/50 rounded-md p-2 mt-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Recommendation</p>
              <p className="text-sm text-zinc-700 mt-1">{anomaly.recommendation}</p>
            </div>
          )}

          {/* Document link */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{anomaly.documentName}</span>
            </div>
            {onViewDocument && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDocument(anomaly.documentId)}
                className="text-xs h-7"
                data-testid={`view-document-${anomaly.documentId}`}
              >
                View Document
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
