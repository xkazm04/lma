'use client';

import React, { memo, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Activity,
  Settings,
  RefreshCw,
  CheckCircle,
  Clock,
  ChevronRight,
  Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveCovenantCard } from './components/LiveCovenantCard';
import { IntegrationSetupDialog } from './components/IntegrationSetupDialog';
import { AlertThresholdSettings } from './components/AlertThresholdSettings';
import { LiveActivityFeed } from './components/LiveActivityFeed';
import type { LiveCovenant, HeadroomAlert, DataIntegration } from './lib/types';
import { mockLiveCovenants, mockRecentAlerts, mockIntegrations } from './lib/mock-data';

export const LiveTestingPage = memo(function LiveTestingPage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showIntegrationSetup, setShowIntegrationSetup] = useState(false);

  const filteredCovenants = useMemo(() => {
    if (selectedFilter === 'all') return mockLiveCovenants;

    return mockLiveCovenants.filter(covenant => {
      if (selectedFilter === 'critical') {
        return covenant.current_headroom_percentage < 5;
      }
      if (selectedFilter === 'warning') {
        return covenant.current_headroom_percentage >= 5 && covenant.current_headroom_percentage < 15;
      }
      if (selectedFilter === 'healthy') {
        return covenant.current_headroom_percentage >= 15;
      }
      return true;
    });
  }, [selectedFilter]);

  const stats = useMemo(() => {
    const total = mockLiveCovenants.length;
    const critical = mockLiveCovenants.filter(c => c.current_headroom_percentage < 5).length;
    const warning = mockLiveCovenants.filter(c => c.current_headroom_percentage >= 5 && c.current_headroom_percentage < 15).length;
    const healthy = mockLiveCovenants.filter(c => c.current_headroom_percentage >= 15).length;
    const activeIntegrations = mockIntegrations.filter(i => i.status === 'active').length;
    const lastUpdate = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return { total, critical, warning, healthy, activeIntegrations, lastUpdate };
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">Covenant Live Testing</h1>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100" data-testid="live-status-badge">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              Live
            </Badge>
          </div>
          <p className="text-zinc-500 mt-1">
            Real-time covenant monitoring with continuous breach detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hover:shadow-sm transition-all"
            onClick={() => setShowIntegrationSetup(true)}
            data-testid="manage-integrations-btn"
          >
            <Settings className="w-4 h-4 mr-2" />
            Integrations
          </Button>
          <Button
            variant="outline"
            className="hover:shadow-sm transition-all"
            onClick={() => setShowSettings(true)}
            data-testid="alert-settings-btn"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Alert Settings
          </Button>
          <Button
            className="hover:shadow-sm transition-all"
            data-testid="refresh-data-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="animate-in fade-in slide-in-from-left-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Total Covenants</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-zinc-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-left-3 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Critical (&lt;5%)</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-left-4 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Warning (5-15%)</p>
                <p className="text-2xl font-bold text-amber-600">{stats.warning}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-left-5 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Healthy (&gt;15%)</p>
                <p className="text-2xl font-bold text-green-600">{stats.healthy}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-left-6 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Active Integrations</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeIntegrations}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-left-7">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Last Update</p>
                <p className="text-lg font-semibold text-zinc-900">{stats.lastUpdate}</p>
              </div>
              <Clock className="w-8 h-8 text-zinc-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={selectedFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('all')}
          data-testid="filter-all-btn"
        >
          All ({stats.total})
        </Button>
        <Button
          variant={selectedFilter === 'critical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('critical')}
          className={selectedFilter === 'critical' ? 'bg-red-600 hover:bg-red-700' : ''}
          data-testid="filter-critical-btn"
        >
          Critical ({stats.critical})
        </Button>
        <Button
          variant={selectedFilter === 'warning' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('warning')}
          className={selectedFilter === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          data-testid="filter-warning-btn"
        >
          Warning ({stats.warning})
        </Button>
        <Button
          variant={selectedFilter === 'healthy' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('healthy')}
          className={selectedFilter === 'healthy' ? 'bg-green-600 hover:bg-green-700' : ''}
          data-testid="filter-healthy-btn"
        >
          Healthy ({stats.healthy})
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Covenant Cards */}
        <div className="lg:col-span-2 space-y-3">
          {filteredCovenants.length > 0 ? (
            filteredCovenants.map((covenant, idx) => (
              <LiveCovenantCard key={covenant.id} covenant={covenant} index={idx} />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-zinc-500">No covenants match the selected filter</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Feed Sidebar */}
        <div className="lg:col-span-1">
          <LiveActivityFeed alerts={mockRecentAlerts} />
        </div>
      </div>

      {/* Dialogs */}
      {showIntegrationSetup && (
        <IntegrationSetupDialog
          integrations={mockIntegrations}
          onClose={() => setShowIntegrationSetup(false)}
        />
      )}

      {showSettings && (
        <AlertThresholdSettings
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
});
