'use client';

import * as React from 'react';
import {
  Activity,
  Filter,
  Loader2,
  RefreshCw,
  Settings,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/layout';
import {
  EvolutionStatsCards,
  MarketTrendCard,
  SuggestionCard,
  FacilityHealthCard,
  EvolutionAlertsList,
  CommunicationModal,
} from './components';
import { mockFacilityEvolutionStatuses } from './lib/mock-data';
import type {
  EvolutionDashboardStats,
  AmendmentSuggestion,
  FacilityEvolutionStatus,
  EvolutionAlert,
} from './lib/types';

export function EvolutionDashboardPage() {
  const [stats, setStats] = React.useState<EvolutionDashboardStats | null>(null);
  const [suggestions, setSuggestions] = React.useState<AmendmentSuggestion[]>([]);
  const [facilities, setFacilities] = React.useState<FacilityEvolutionStatus[]>(
    mockFacilityEvolutionStatuses
  );
  const [alerts, setAlerts] = React.useState<EvolutionAlert[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [selectedSuggestion, setSelectedSuggestion] = React.useState<AmendmentSuggestion | null>(null);
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = React.useState(false);

  // Fetch dashboard data
  const fetchData = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Fetch evolution stats
      const statsResponse = await fetch('/api/documents/evolution');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
        setAlerts(statsData.data.engineStatus?.recentAlerts || []);
      }

      // Fetch suggestions
      const suggestionsResponse = await fetch('/api/documents/evolution/suggestions');
      const suggestionsData = await suggestionsResponse.json();
      if (suggestionsData.success) {
        setSuggestions(suggestionsData.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch evolution data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle suggestion status update
  const handleUpdateStatus = async (suggestionId: string, status: AmendmentSuggestion['status']) => {
    try {
      const response = await fetch(`/api/documents/evolution/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestionId ? { ...s, status } : s))
        );
      }
    } catch (error) {
      console.error('Failed to update suggestion status:', error);
    }
  };

  // Handle initiate communication
  const handleInitiateCommunication = (suggestion: AmendmentSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsCommunicationModalOpen(true);
  };

  // Handle send communication
  const handleSendCommunication = async (data: {
    suggestionId: string;
    communicationType: 'informal_discussion' | 'formal_proposal' | 'amendment_request';
    recipients: Array<{ name: string; email: string; role: string }>;
    customMessage?: string;
  }) => {
    const response = await fetch('/api/documents/evolution/communicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, sendNow: true }),
    });

    if (!response.ok) {
      throw new Error('Failed to send communication');
    }
  };

  // Handle alert actions
  const handleMarkRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isDismissed: true } : a))
    );
  };

  // Filter suggestions
  const filteredSuggestions = React.useMemo(() => {
    return suggestions.filter((s) => {
      if (priorityFilter !== 'all' && s.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [suggestions, priorityFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="evolution-loading">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-zinc-600">Loading Evolution Engine...</span>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6" data-testid="evolution-dashboard">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-zinc-900">Document Evolution Engine</h1>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="mr-1 h-3 w-3" />
              Active
            </Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Autonomous monitoring and proactive amendment suggestions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            data-testid="refresh-btn"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" data-testid="settings-btn">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <EvolutionStatsCards stats={stats} />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="suggestions" data-testid="tab-suggestions">
            Suggestions
            {suggestions.filter(s => s.status === 'new').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {suggestions.filter(s => s.status === 'new').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="facilities" data-testid="tab-facilities">Facilities</TabsTrigger>
          <TabsTrigger value="market" data-testid="tab-market">Market Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column - Recent Suggestions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">Recent Suggestions</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('suggestions')}
                  className="text-blue-600"
                  data-testid="view-all-suggestions-btn"
                >
                  View all
                </Button>
              </div>
              {suggestions.slice(0, 3).map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onUpdateStatus={handleUpdateStatus}
                  onInitiateCommunication={handleInitiateCommunication}
                />
              ))}
            </div>

            {/* Right column - Alerts & Market */}
            <div className="space-y-4">
              {stats && <MarketTrendCard stats={stats} />}
              <EvolutionAlertsList
                alerts={alerts}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismissAlert}
              />
            </div>
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-600">Filter by:</span>
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]" data-testid="priority-filter">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            {(priorityFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPriorityFilter('all');
                  setStatusFilter('all');
                }}
                data-testid="clear-filters-btn"
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Suggestions Grid */}
          <div className="space-y-4">
            {filteredSuggestions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-zinc-600">No suggestions match the selected filters.</p>
                </CardContent>
              </Card>
            ) : (
              filteredSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onUpdateStatus={handleUpdateStatus}
                  onInitiateCommunication={handleInitiateCommunication}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Facilities Tab */}
        <TabsContent value="facilities" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => (
              <FacilityHealthCard
                key={facility.facilityId}
                facility={facility}
              />
            ))}
          </div>
        </TabsContent>

        {/* Market Tab */}
        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Interest Rate Environment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-md bg-zinc-50">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">SOFR</p>
                      <p className="text-xs text-zinc-500">Secured Overnight Financing Rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-900">5.33%</p>
                      <p className="text-xs text-red-600">+2 bps</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-zinc-50">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Prime Rate</p>
                      <p className="text-xs text-zinc-500">US Prime Rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-900">8.50%</p>
                      <p className="text-xs text-zinc-500">Unchanged</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-zinc-100">
                    <p className="text-xs text-zinc-500 mb-2">30-Day Trend</p>
                    <div className="h-16 bg-zinc-100 rounded flex items-center justify-center">
                      <span className="text-xs text-zinc-400">Chart placeholder</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  Credit Spreads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-md bg-zinc-50">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Investment Grade (BBB)</p>
                      <p className="text-xs text-zinc-500">Average spread over benchmark</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-900">175 bps</p>
                      <p className="text-xs text-red-600">+7 bps (widening)</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-zinc-50">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">High Yield (BB)</p>
                      <p className="text-xs text-zinc-500">Average spread over benchmark</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-900">325 bps</p>
                      <p className="text-xs text-red-600">+15 bps (widening)</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-zinc-100">
                    <p className="text-xs text-zinc-500 mb-2">Historical Percentile</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-zinc-200">
                        <div className="h-2 rounded-full bg-amber-500" style={{ width: '65%' }} />
                      </div>
                      <span className="text-xs font-medium text-zinc-600">65th</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Current spreads are wider than 65% of historical observations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Regulatory Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 border border-amber-200">
                    <div className="rounded-full bg-amber-100 p-1.5 shrink-0">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            Updated Guidance on LIBOR Transition Documentation
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">Federal Reserve</p>
                        </div>
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                          High Impact
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-600 mt-2">
                        New guidance on hardwired fallback provisions for legacy LIBOR loans. Affects credit agreements and amendments.
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
                        <span>Published: 7 days ago</span>
                        <span>Effective: 90 days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Communication Modal */}
      <CommunicationModal
        suggestion={selectedSuggestion}
        isOpen={isCommunicationModalOpen}
        onClose={() => {
          setIsCommunicationModalOpen(false);
          setSelectedSuggestion(null);
        }}
        onSend={handleSendCommunication}
      />
      </div>
    </PageContainer>
  );
}
