'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  Network,
  AlertTriangle,
  Shield,
  ChevronRight,
  Activity,
  Layers,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCardUnified } from '@/components/ui/stat-card-unified';
import { cn } from '@/lib/utils';
import type {
  RiskCorrelationDashboard,
  RiskEvent,
  RippleEffect,
} from '../lib/mocks';
import {
  formatExposure,
  getSeverityVariant,
  getCorrelationColor,
} from '../lib/mocks';
import { CorrelationMatrix } from './CorrelationMatrix';
import { RippleEffectView } from './RippleEffectView';
import { CorrelatedBorrowersPanel } from './CorrelatedBorrowersPanel';
import { RiskAlertsList } from './RiskAlertsList';

interface RiskCorrelationEngineProps {
  data: RiskCorrelationDashboard;
  onEventClick?: (event: RiskEvent) => void;
  onBorrowerClick?: (borrowerId: string) => void;
  onViewAllCorrelations?: () => void;
}

// Active event card
const ActiveEventCard = memo(function ActiveEventCard({
  event,
  index,
  onClick,
}: {
  event: RiskEvent;
  index: number;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'p-2.5 rounded-lg border hover:border-zinc-300 transition-all cursor-pointer group animate-in fade-in slide-in-from-right-2',
        event.severity === 'critical'
          ? 'border-red-200 bg-red-50/50'
          : event.severity === 'high'
          ? 'border-amber-200 bg-amber-50/50'
          : 'border-zinc-100 bg-white'
      )}
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      data-testid={`risk-event-${event.id}`}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'mt-0.5 p-1 rounded-md',
            event.severity === 'critical'
              ? 'bg-red-100'
              : event.severity === 'high'
              ? 'bg-amber-100'
              : 'bg-zinc-100'
          )}
        >
          <AlertTriangle
            className={cn(
              'w-3 h-3',
              event.severity === 'critical'
                ? 'text-red-600'
                : event.severity === 'high'
                ? 'text-amber-600'
                : 'text-zinc-600'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-medium text-xs text-zinc-900 truncate">
              {event.title}
            </span>
            <Badge variant={getSeverityVariant(event.severity)} className="text-[9px] px-1 py-0">
              {event.severity}
            </Badge>
          </div>
          <p className="text-[11px] text-zinc-600 line-clamp-1">{event.description}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-zinc-500">{event.borrowerName}</span>
            <span className="text-zinc-300">|</span>
            <span className="text-[10px] text-zinc-400">{event.category}</span>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
});

export const RiskCorrelationEngine = memo(function RiskCorrelationEngine({
  data,
  onEventClick,
  onBorrowerClick,
  onViewAllCorrelations,
}: RiskCorrelationEngineProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRipple, setSelectedRipple] = useState<RippleEffect | null>(
    data.recentRippleEffects[0] || null
  );

  const handleEventClick = useCallback(
    (event: RiskEvent) => {
      // Find ripple effect for this event
      const ripple = data.recentRippleEffects.find(
        (r) => r.sourceEvent.id === event.id
      );
      if (ripple) {
        setSelectedRipple(ripple);
        setActiveTab('ripple');
      }
      onEventClick?.(event);
    },
    [data.recentRippleEffects, onEventClick]
  );

  const { portfolioMetrics, activeRiskEvents, highCorrelationPairs, alerts } = data;

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      data-testid="risk-correlation-engine"
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
              <Network className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Portfolio Risk Correlations</CardTitle>
              <p className="text-[10px] text-zinc-500">
                Updated {data.lastUpdated}
              </p>
            </div>
          </div>
          <button
            onClick={onViewAllCorrelations}
            className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-0.5 transition-colors"
            data-testid="view-all-correlations-btn"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <StatCardUnified
            variant="inline"
            icon={Activity}
            label="Systemic Risk"
            value={`${portfolioMetrics.systemicRiskScore}`}
            subValue="/ 100"
            iconBgClass={
              portfolioMetrics.systemicRiskScore > 60
                ? 'bg-red-500'
                : portfolioMetrics.systemicRiskScore > 40
                ? 'bg-amber-500'
                : 'bg-green-500'
            }
            index={0}
            testId="systemic-risk-stat"
          />
          <StatCardUnified
            variant="inline"
            icon={Layers}
            label="Diversification"
            value={`${portfolioMetrics.diversificationScore}`}
            subValue="/ 100"
            iconBgClass={
              portfolioMetrics.diversificationScore > 60
                ? 'bg-green-500'
                : portfolioMetrics.diversificationScore > 40
                ? 'bg-amber-500'
                : 'bg-red-500'
            }
            index={1}
            testId="diversification-stat"
          />
          <StatCardUnified
            variant="inline"
            icon={Target}
            label="Avg Correlation"
            value={`${Math.round(portfolioMetrics.averageCorrelation * 100)}%`}
            iconBgClass="bg-indigo-500"
            index={2}
            testId="avg-correlation-stat"
          />
          <StatCardUnified
            variant="inline"
            icon={Shield}
            label="Active Alerts"
            value={`${alerts.length}`}
            subValue={`${alerts.filter((a) => a.severity === 'critical').length} critical`}
            iconBgClass="bg-purple-500"
            index={3}
            testId="active-alerts-stat"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-3 h-8">
            <TabsTrigger value="overview" data-testid="tab-overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="matrix" data-testid="tab-matrix" className="text-xs">
              Matrix
            </TabsTrigger>
            <TabsTrigger value="ripple" data-testid="tab-ripple" className="text-xs">
              Ripple Effect
            </TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts" className="text-xs">
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Active Risk Events */}
              <div>
                <h4 className="text-xs font-medium text-zinc-700 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Active Risk Events
                </h4>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {activeRiskEvents.length > 0 ? (
                    activeRiskEvents.map((event, idx) => (
                      <ActiveEventCard
                        key={event.id}
                        event={event}
                        index={idx}
                        onClick={() => handleEventClick(event)}
                      />
                    ))
                  ) : (
                    <div className="p-3 text-center text-zinc-500 text-xs">
                      No active risk events
                    </div>
                  )}
                </div>
              </div>

              {/* High Correlations */}
              <div>
                <h4 className="text-xs font-medium text-zinc-700 mb-2 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-purple-500" />
                  Highest Correlations
                </h4>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {highCorrelationPairs.slice(0, 5).map((corr, idx) => (
                    <div
                      key={corr.id}
                      className="p-2.5 rounded-lg border border-zinc-100 bg-white hover:border-zinc-200 transition-all cursor-pointer animate-in fade-in slide-in-from-left-2"
                      style={{
                        animationDelay: `${idx * 75}ms`,
                        animationFillMode: 'both',
                      }}
                      onClick={() => onBorrowerClick?.(corr.borrower1Id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onBorrowerClick?.(corr.borrower1Id);
                        }
                      }}
                      data-testid={`correlation-pair-${corr.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-medium text-zinc-900 truncate">
                            {corr.borrower1Name}
                          </span>
                          <span className="text-zinc-300 text-xs">↔</span>
                          <span className="text-xs font-medium text-zinc-900 truncate">
                            {corr.borrower2Name}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            getCorrelationColor(corr.correlationStrength)
                          )}
                        >
                          {Math.round(corr.correlationStrength * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          {corr.correlationType.replace('_', ' ')}
                        </Badge>
                        {corr.sharedFactors.slice(0, 2).map((f, i) => (
                          <span key={i} className="text-[10px] text-zinc-500 truncate">
                            {f.factorName.split(':')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="mt-0">
            <CorrelationMatrix onBorrowerClick={onBorrowerClick} />
          </TabsContent>

          <TabsContent value="ripple" className="mt-0">
            {selectedRipple ? (
              <RippleEffectView
                ripple={selectedRipple}
                onBorrowerClick={onBorrowerClick}
              />
            ) : (
              <div className="p-8 text-center text-zinc-500">
                <Network className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                <p>Select a risk event to view ripple effects</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <RiskAlertsList alerts={alerts} onBorrowerClick={onBorrowerClick} />
          </TabsContent>
        </Tabs>

        {/* Correlated Borrowers Panel - collapsed by default */}
        <div className="mt-3 pt-3 border-t border-zinc-100">
          <CorrelatedBorrowersPanel
            correlations={highCorrelationPairs}
            onBorrowerClick={onBorrowerClick}
          />
        </div>
      </CardContent>
    </Card>
  );
});
