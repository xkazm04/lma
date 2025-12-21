'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout';
import {
  RiskStatsCards,
  RiskFiltersBar,
  RiskCategoryBreakdown,
  RiskAlertsList,
  RiskStatusBreakdown,
} from './components';
import {
  generateMockRiskAlerts,
  generateMockRiskStats,
} from '@/lib/llm/risk-detection';
import type {
  RiskAlert,
  RiskAlertSeverity,
  RiskCategory,
  RiskAlertStatus,
  RiskDashboardStats,
} from '../lib/types';

export function RiskDashboardPage() {
  const router = useRouter();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<RiskAlertSeverity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RiskAlertStatus | 'all'>('all');

  // State for data
  const [alerts, setAlerts] = useState<RiskAlert[]>(() => generateMockRiskAlerts());
  const [stats] = useState<RiskDashboardStats>(() => generateMockRiskStats());
  const [isScanning, setIsScanning] = useState(false);

  // Filter alerts based on current filters
  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts];

    if (severityFilter !== 'all') {
      filtered = filtered.filter((a) => a.severity === severityFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.documentName.toLowerCase().includes(query)
      );
    }

    // Sort by severity (critical first) then by date
    const severityOrder: Record<RiskAlertSeverity, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    };

    filtered.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [alerts, severityFilter, categoryFilter, statusFilter, searchQuery]);

  // Handle status change
  const handleStatusChange = useCallback((alertId: string, newStatus: RiskAlertStatus) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              ...(newStatus === 'resolved' && { resolvedBy: 'current.user@company.com' }),
            }
          : alert
      )
    );
  }, []);

  // Handle view document
  const handleViewDocument = useCallback(
    (documentId: string) => {
      router.push(`/documents/${documentId}`);
    },
    [router]
  );

  // Handle category click from breakdown
  const handleCategoryClick = useCallback((category: RiskCategory) => {
    setCategoryFilter(category);
  }, []);

  // Handle status click from breakdown
  const handleStatusClick = useCallback((status: RiskAlertStatus) => {
    setStatusFilter(status);
  }, []);

  // Handle scan
  const handleScan = useCallback(async () => {
    setIsScanning(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsScanning(false);
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    // In production, this would generate a CSV or PDF report
    const data = JSON.stringify(filteredAlerts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-alerts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredAlerts]);

  return (
    <PageContainer>
      <div className="space-y-6" data-testid="risk-dashboard-page">
        {/* Page Header */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/documents')}
            className="text-zinc-500 hover:text-zinc-700"
            data-testid="risk-dashboard-back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900">Risk Detection Dashboard</h1>
            </div>
            <p className="text-zinc-500 mt-1">
              Proactive monitoring for regulatory, compliance, and financial risks across all documents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Clock className="w-4 h-4" />
          <span>Last scan: {new Date(stats.lastScanTimestamp).toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <RiskStatsCards stats={stats} />

      {/* Filters Bar */}
      <RiskFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        severityFilter={severityFilter}
        onSeverityChange={setSeverityFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onScan={handleScan}
        onExport={handleExport}
        isScanning={isScanning}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Breakdowns */}
        <div className="lg:col-span-1 space-y-4 p-4 bg-white rounded-lg border border-zinc-200">
          <RiskCategoryBreakdown
            stats={stats}
            onCategoryClick={handleCategoryClick}
            selectedCategory={categoryFilter !== 'all' ? categoryFilter : null}
          />
          <div className="border-t border-zinc-100 pt-4">
            <RiskStatusBreakdown
              stats={stats}
              onStatusClick={handleStatusClick}
              selectedStatus={statusFilter !== 'all' ? statusFilter : null}
            />
          </div>
        </div>

        {/* Main Content - Alert List */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">
              Risk Alerts
              <span className="ml-2 text-sm font-normal text-zinc-500">
                ({filteredAlerts.length} of {alerts.length})
              </span>
            </h2>
            {(severityFilter !== 'all' ||
              categoryFilter !== 'all' ||
              statusFilter !== 'all' ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSeverityFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-zinc-500"
                data-testid="risk-clear-filters-btn"
              >
                Clear filters
              </Button>
            )}
          </div>

          <RiskAlertsList
            alerts={filteredAlerts}
            onStatusChange={handleStatusChange}
            onViewDocument={handleViewDocument}
          />
        </div>
      </div>
      </div>
    </PageContainer>
  );
}
