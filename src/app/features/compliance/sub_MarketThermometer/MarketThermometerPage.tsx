'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Building2, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MarketTemperatureGauge } from './components/MarketTemperatureGauge';
import { IndustryHealthGrid } from './components/IndustryHealthGrid';
import { HeadroomDistributionChart } from './components/HeadroomDistributionChart';
import { MarketConditionAlertsList } from './components/MarketConditionAlertsList';
import { EarlyWarningSignalsList } from './components/EarlyWarningSignalsList';
import { SystematicTrendsList } from './components/SystematicTrendsList';
import { MacroStatsBar } from './components/MacroStatsBar';
import {
  mockMarketThermometerReading,
  mockMacroDashboardStats,
  mockIndustryHealthMetrics,
  mockMarketConditionAlerts,
  mockEarlyWarningSignals,
  mockSystematicTrends,
  mockHeadroomDistributions,
} from '../lib/mock-data';

export default function MarketThermometerPage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'industries' | 'trends' | 'alerts'>('overview');

  const reading = mockMarketThermometerReading;
  const macroStats = mockMacroDashboardStats;
  const healthMetrics = mockIndustryHealthMetrics;

  return (
    <div className="min-h-screen bg-background" data-testid="market-thermometer-page">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground" data-testid="page-title">
                Market Thermometer
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time credit market intelligence from {reading.institutions_contributing} institutions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Updated: {new Date(reading.reading_date).toLocaleDateString()}
              </Badge>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-6 border-b">
            <button
              onClick={() => setSelectedTab('overview')}
              data-testid="tab-overview"
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                selectedTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('industries')}
              data-testid="tab-industries"
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                selectedTab === 'industries'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Industry Health
            </button>
            <button
              onClick={() => setSelectedTab('trends')}
              data-testid="tab-trends"
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                selectedTab === 'trends'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Systematic Trends
            </button>
            <button
              onClick={() => setSelectedTab('alerts')}
              data-testid="tab-alerts"
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors relative',
                selectedTab === 'alerts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Market Alerts
              {macroStats.critical_alerts > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {macroStats.critical_alerts}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Macro Stats */}
            <MacroStatsBar stats={macroStats} />

            {/* Market Temperature Gauge */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Market Temperature</h2>
              <MarketTemperatureGauge reading={reading} />
            </Card>

            {/* Key Trends & Risk Outlook */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Key Market Trends
                </h3>
                <ul className="space-y-3">
                  {reading.key_trends.map((trend, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{trend}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Risk Indicators
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">At-Risk Covenants</span>
                      <span className="font-medium">
                        {reading.indicators.at_risk_percentage.toFixed(1)}%
                        <span className="text-red-500 text-xs ml-1">
                          (+{reading.indicators.at_risk_change_3m.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${reading.indicators.at_risk_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Breach Rate</span>
                      <span className="font-medium">
                        {reading.indicators.breach_percentage.toFixed(1)}%
                        <span className="text-red-500 text-xs ml-1">
                          (+{reading.indicators.breach_change_3m.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${reading.indicators.breach_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Average Headroom</span>
                      <span className="font-medium">
                        {reading.indicators.average_headroom.toFixed(1)}%
                        <span className="text-red-500 text-xs ml-1">
                          ({reading.indicators.headroom_change_3m.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${reading.indicators.average_headroom}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Market Summary */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Market Summary
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{reading.market_summary}</p>
            </Card>

            {/* Critical Alerts Preview */}
            {macroStats.critical_alerts > 0 && (
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Critical Market Alerts
                    </h3>
                    <p className="text-sm text-red-700">
                      {macroStats.critical_alerts} critical alerts require immediate attention
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTab('alerts')}
                    data-testid="view-alerts-btn"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    View Alerts
                  </button>
                </div>
              </Card>
            )}
          </div>
        )}

        {selectedTab === 'industries' && (
          <div className="space-y-6">
            <IndustryHealthGrid healthMetrics={healthMetrics} />
            <HeadroomDistributionChart distributions={mockHeadroomDistributions} />
          </div>
        )}

        {selectedTab === 'trends' && (
          <div className="space-y-6">
            <SystematicTrendsList trends={mockSystematicTrends} />
          </div>
        )}

        {selectedTab === 'alerts' && (
          <div className="space-y-6">
            <MarketConditionAlertsList alerts={mockMarketConditionAlerts} />
            <EarlyWarningSignalsList signals={mockEarlyWarningSignals} />
          </div>
        )}
      </div>
    </div>
  );
}
