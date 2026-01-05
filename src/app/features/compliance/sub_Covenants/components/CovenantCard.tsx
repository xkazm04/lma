'use client';

import React, { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Clock, ArrowRight, Brain, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Covenant, BreachPrediction } from '../../lib';
import { CovenantSparkline } from './CovenantSparkline';
import { HeadroomProgressBar } from './HeadroomProgressBar';
import { BreachPredictionPanel } from './BreachPredictionPanel';
import { EntropyMetricsPanel } from './EntropyMetricsPanel';
import { WaiverBadge } from './WaiverBadge';
import { calculateCovenantEntropyMetrics } from '../../lib/entropy';
import { DEFAULT_AT_RISK_HEADROOM_THRESHOLD } from '../../lib';

interface CovenantCardProps {
  covenant: Covenant;
  prediction?: BreachPrediction;
  index?: number;
  showPrediction?: boolean;
  showEntropyMetrics?: boolean;
  onRequestWaiver?: (covenant: Covenant) => void;
}

function formatThreshold(value: number, type: string): string {
  if (type === 'minimum_liquidity' || type === 'capex' || type === 'net_worth') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return `${value.toFixed(2)}x`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getCovenantTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    leverage_ratio: 'Leverage',
    interest_coverage: 'Interest Coverage',
    fixed_charge_coverage: 'FCCR',
    debt_service_coverage: 'DSCR',
    minimum_liquidity: 'Liquidity',
    capex: 'CapEx',
    net_worth: 'Net Worth',
  };
  return labels[type] || type;
}

function getStatusBadge(status: string, testResult: string) {
  if (status === 'waived') {
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Waived</Badge>;
  }
  if (status === 'breached') {
    return <Badge variant="destructive">Breached</Badge>;
  }
  if (testResult === 'pass') {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        <CheckCircle className="w-3 h-3 mr-1" />
        Pass
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <AlertTriangle className="w-3 h-3 mr-1" />
      Fail
    </Badge>
  );
}

function getHeadroomColor(headroom: number): string {
  if (headroom < 0) return 'text-red-600';
  if (headroom < 10) return 'text-red-500';
  if (headroom < 20) return 'text-amber-600';
  return 'text-green-600';
}

export const CovenantCard = memo(function CovenantCard({
  covenant,
  prediction,
  index = 0,
  showPrediction = true,
  showEntropyMetrics = true,
  onRequestWaiver,
}: CovenantCardProps) {
  const [isPredictionExpanded, setIsPredictionExpanded] = useState(false);
  const isAtRisk = covenant.latest_test.headroom_percentage < DEFAULT_AT_RISK_HEADROOM_THRESHOLD && covenant.latest_test.headroom_percentage >= 0;
  const headroomColor = getHeadroomColor(covenant.latest_test.headroom_percentage);

  const hasPrediction = showPrediction && prediction && prediction.confidence_score > 0;

  const fullHistory = useMemo(() => {
    if (covenant.test_history && covenant.test_history.length > 0) {
      const historyDates = new Set(covenant.test_history.map((t) => t.test_date));
      if (historyDates.has(covenant.latest_test.test_date)) {
        return covenant.test_history;
      }
      return [...covenant.test_history, covenant.latest_test];
    }
    return [covenant.latest_test];
  }, [covenant.test_history, covenant.latest_test]);

  // Calculate entropy metrics
  const entropyMetrics = useMemo(() => {
    if (!showEntropyMetrics) return null;

    const testPoints = fullHistory.map(test => ({
      test_date: test.test_date,
      headroom_percentage: test.headroom_percentage,
    }));

    return calculateCovenantEntropyMetrics(testPoints);
  }, [fullHistory, showEntropyMetrics]);

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        covenant.status === 'breached' && 'border-red-300',
        covenant.status === 'waived' && 'border-amber-200',
        isAtRisk && 'border-amber-200',
        'animate-in fade-in slide-in-from-bottom-3'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-zinc-900">{covenant.name}</h3>
              {getStatusBadge(covenant.status, covenant.latest_test.test_result)}
              <Badge variant="outline">{getCovenantTypeLabel(covenant.covenant_type)}</Badge>
              {isAtRisk && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  <Clock className="w-3 h-3 mr-1" />
                  Low Headroom
                </Badge>
              )}
              {hasPrediction && prediction.overall_risk_level !== 'low' && (
                <Badge
                  className={cn(
                    prediction.overall_risk_level === 'critical' && 'bg-red-100 text-red-700',
                    prediction.overall_risk_level === 'high' && 'bg-orange-100 text-orange-700',
                    prediction.overall_risk_level === 'medium' && 'bg-amber-100 text-amber-700'
                  )}
                  data-testid="prediction-risk-badge"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  {Math.round(prediction.breach_probability_2q)}% Breach Risk
                </Badge>
              )}
            </div>
            <Link
              href={`/compliance/facilities/${covenant.facility_id}`}
              className="text-sm text-zinc-500 hover:text-blue-600 transition-colors truncate block"
            >
              {covenant.facility_name} - {covenant.borrower_name}
            </Link>

            <div className="grid grid-cols-4 gap-6 mt-4">
              <div>
                <p className="text-xs text-zinc-500">Threshold</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {covenant.threshold_type === 'maximum' ? 'Max' : 'Min'}:{' '}
                  {formatThreshold(covenant.current_threshold, covenant.covenant_type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Latest Value</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatThreshold(covenant.latest_test.calculated_ratio, covenant.covenant_type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Headroom</p>
                <div className="flex items-center gap-2">
                  {covenant.latest_test.headroom_percentage >= 0 ? (
                    <TrendingUp className={cn('w-4 h-4', headroomColor)} />
                  ) : (
                    <TrendingDown className={cn('w-4 h-4', headroomColor)} />
                  )}
                  <span className={cn('text-sm font-semibold', headroomColor)}>
                    {covenant.latest_test.headroom_percentage.toFixed(1)}%
                  </span>
                  {fullHistory.length >= 2 && (
                    <CovenantSparkline testHistory={fullHistory} />
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Next Test</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatDate(covenant.next_test_date)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                <span>Headroom to Threshold</span>
                <span>{Math.max(0, covenant.latest_test.headroom_percentage).toFixed(1)}%</span>
              </div>
              <HeadroomProgressBar
                headroom={covenant.latest_test.headroom_percentage}
                previousHeadroom={
                  fullHistory.length >= 2
                    ? fullHistory[fullHistory.length - 2].headroom_percentage
                    : undefined
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 shrink-0">
            {covenant.status === 'breached' && onRequestWaiver && (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 hover:shadow-sm transition-all"
                onClick={() => onRequestWaiver(covenant)}
                data-testid={`request-waiver-btn-${covenant.id}`}
              >
                <ShieldAlert className="w-4 h-4 mr-1" />
                Request Waiver
              </Button>
            )}
            <Link href={`/compliance/facilities/${covenant.facility_id}`}>
              <Button variant="outline" size="sm" className="hover:shadow-sm transition-all">
                View Facility
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {covenant.status === 'waived' && covenant.waiver && (
          <div className="mt-4 pt-4 border-t border-zinc-100" data-testid="covenant-waiver-section">
            <WaiverBadge expirationDate={covenant.waiver.expiration_date} />
          </div>
        )}

        {hasPrediction && (
          <BreachPredictionPanel
            prediction={prediction}
            isExpanded={isPredictionExpanded}
            onToggleExpand={() => setIsPredictionExpanded(!isPredictionExpanded)}
            showCompact={!isPredictionExpanded}
          />
        )}

        {/* Entropy Metrics Panel */}
        {entropyMetrics && entropyMetrics.attentionLevel >= 3 && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <EntropyMetricsPanel
              metrics={entropyMetrics}
              compact={false}
              showDetails={true}
            />
          </div>
        )}

        {/* Compact Entropy Display for low-risk covenants */}
        {entropyMetrics && entropyMetrics.attentionLevel < 3 && (
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <EntropyMetricsPanel
              metrics={entropyMetrics}
              compact={true}
              showDetails={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});
