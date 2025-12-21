'use client';

import React, { memo, useState } from 'react';
import {
  Brain,
  AlertCircle,
  Activity,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Filter,
  Settings2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { IntelligenceCard } from '../cards/IntelligenceCard';
import { AlertCard } from '../cards/AlertCard';
import { SignalCard } from '../cards/SignalCard';
import { domainConfig } from '../config';
import type { IntelligenceItem, AlertItem, SignalItem, Domain, Severity } from '../types';

type TabType = 'insights' | 'alerts' | 'signals';

interface IntelligencePanelProps {
  /** Domain context */
  domain: Domain;
  /** Intelligence insights */
  insights?: IntelligenceItem[];
  /** Alerts */
  alerts?: AlertItem[];
  /** Signals */
  signals?: SignalItem[];
  /** Active tab */
  defaultTab?: TabType;
  /** Title override */
  title?: string;
  /** Description */
  description?: string;
  /** Show only specific tabs */
  tabs?: TabType[];
  /** Compact mode */
  compact?: boolean;
  /** Max items to show per tab */
  maxItems?: number;
  /** Loading state */
  loading?: boolean;
  /** On refresh callback */
  onRefresh?: () => void;
  /** On item click */
  onItemClick?: (type: TabType, id: string) => void;
  /** On item action */
  onItemAction?: (type: TabType, id: string, action: string) => void;
  /** On alert status change */
  onAlertStatusChange?: (id: string, status: string) => void;
  /** On view all click */
  onViewAll?: (tab: TabType) => void;
  /** Additional className */
  className?: string;
  /** Test ID */
  testId?: string;
}

export const IntelligencePanel = memo(function IntelligencePanel({
  domain,
  insights = [],
  alerts = [],
  signals = [],
  defaultTab = 'insights',
  title,
  description,
  tabs = ['insights', 'alerts', 'signals'],
  compact = false,
  maxItems = 5,
  loading = false,
  onRefresh,
  onItemClick,
  onItemAction,
  onAlertStatusChange,
  onViewAll,
  className,
  testId,
}: IntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const domConfig = domainConfig[domain];
  const DomainIcon = domConfig.icon;

  // Count by severity for alerts
  const alertCounts = alerts.reduce(
    (acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    },
    {} as Record<Severity, number>
  );

  const unreadAlerts = alerts.filter((a) => !a.isRead).length;

  // Tab configuration
  const tabConfig: Record<TabType, { icon: typeof Brain; label: string; count: number }> = {
    insights: {
      icon: Brain,
      label: 'Insights',
      count: insights.length,
    },
    alerts: {
      icon: AlertCircle,
      label: 'Alerts',
      count: unreadAlerts || alerts.length,
    },
    signals: {
      icon: Activity,
      label: 'Signals',
      count: signals.length,
    },
  };

  return (
    <Card className={cn('overflow-hidden', className)} data-testid={testId || 'intelligence-panel'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-lg', `bg-${domConfig.primaryColor}-100`)}>
              <DomainIcon className={cn('w-4 h-4', `text-${domConfig.primaryColor}-600`)} />
            </div>
            <div>
              <CardTitle className="text-base">
                {title || `${domConfig.name} Intelligence`}
              </CardTitle>
              {description && (
                <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Filter className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Settings2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-9 px-3">
            {tabs.map((tab) => {
              const config = tabConfig[tab];
              const TabIcon = config.icon;
              return (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={cn(
                    'text-xs data-[state=active]:border-b-2 rounded-none pb-2',
                    `data-[state=active]:border-${domConfig.primaryColor}-500`
                  )}
                >
                  <TabIcon className="w-3.5 h-3.5 mr-1" />
                  {config.label}
                  {config.count > 0 && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'ml-1.5 h-4 min-w-4 px-1 text-[10px]',
                        tab === 'alerts' && unreadAlerts > 0 && 'bg-red-100 text-red-700'
                      )}
                    >
                      {config.count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Insights Tab */}
          <TabsContent value="insights" className="m-0 p-3">
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No insights available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {insights.slice(0, maxItems).map((insight) => (
                  <IntelligenceCard
                    key={insight.id}
                    item={insight}
                    compact={compact}
                    showMetrics={!compact}
                    showFactors={false}
                    onClick={() => onItemClick?.('insights', insight.id)}
                    onAction={(action) => onItemAction?.('insights', insight.id, action)}
                  />
                ))}
                {insights.length > maxItems && onViewAll && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => onViewAll('insights')}
                  >
                    View all {insights.length} insights
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="m-0 p-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Quick severity summary */}
                {!compact && Object.keys(alertCounts).length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 mb-2">
                    {alertCounts.critical && (
                      <Badge variant="destructive" className="text-[10px]">
                        {alertCounts.critical} Critical
                      </Badge>
                    )}
                    {alertCounts.high && (
                      <Badge className="text-[10px] bg-orange-100 text-orange-700">
                        {alertCounts.high} High
                      </Badge>
                    )}
                    {alertCounts.medium && (
                      <Badge className="text-[10px] bg-amber-100 text-amber-700">
                        {alertCounts.medium} Medium
                      </Badge>
                    )}
                  </div>
                )}

                {alerts.slice(0, maxItems).map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    compact={compact}
                    onStatusChange={onAlertStatusChange}
                    onAction={(id, action) => onItemAction?.('alerts', id, action)}
                  />
                ))}
                {alerts.length > maxItems && onViewAll && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => onViewAll('alerts')}
                  >
                    View all {alerts.length} alerts
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals" className="m-0 p-3">
            {signals.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No signals</p>
              </div>
            ) : (
              <div className="space-y-2">
                {signals.slice(0, maxItems).map((signal) => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    compact={compact}
                    onClick={() => onItemClick?.('signals', signal.id)}
                  />
                ))}
                {signals.length > maxItems && onViewAll && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => onViewAll('signals')}
                  >
                    View all {signals.length} signals
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
