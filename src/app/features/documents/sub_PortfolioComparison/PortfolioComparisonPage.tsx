'use client';

import React, { useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Download,
  RefreshCw,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PortfolioSummaryCards,
  AnomalyCard,
  TermComparisonTable,
  PortfolioFilters,
  RiskBreakdownChart,
  AIInsightsPanel,
} from './components';
import { usePortfolioFilters } from './hooks';
import {
  mockPortfolioComparisonResult,
  mockPortfolioRiskScore,
} from './lib';

function PortfolioComparisonPageContent() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'terms' | 'anomalies'>('overview');

  // Use mock data for now - in production this would come from API
  const result = mockPortfolioComparisonResult;
  const riskScore = mockPortfolioRiskScore;

  const {
    filters,
    setFilters,
    filteredTerms,
    filteredAnomalies,
    totalTerms,
    totalAnomalies,
  } = usePortfolioFilters(result.terms, result.anomalies);

  const handleRefreshAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
  }, []);

  const handleViewDocument = useCallback(
    (documentId: string) => {
      router.push(`/documents/${documentId}`);
    },
    [router]
  );

  const handleExportReport = useCallback(() => {
    // In production, this would generate and download a PDF/Excel report
    console.log('Exporting portfolio comparison report...');
  }, []);

  // Group anomalies by severity for the overview
  const criticalAnomalies = filteredAnomalies.filter((a) => a.severity === 'critical');
  const warningAnomalies = filteredAnomalies.filter((a) => a.severity === 'warning');
  const infoAnomalies = filteredAnomalies.filter((a) => a.severity === 'info');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/documents" data-testid="back-to-documents-link">
            <Button
              variant="ghost"
              size="icon"
              className="transition-transform hover:scale-110"
              data-testid="back-to-documents-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Portfolio Term Intelligence
            </h1>
            <p className="text-zinc-500">
              Cross-document analysis of {result.documents.length} documents • {result.terms.length} terms tracked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshAnalysis}
            disabled={isAnalyzing}
            data-testid="refresh-analysis-btn"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
          <Button onClick={handleExportReport} data-testid="export-report-btn">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <PortfolioSummaryCards summary={result.summary} riskScore={riskScore} />

      {/* AI Insights */}
      {result.aiInsights && (
        <AIInsightsPanel insights={result.aiInsights} analyzedAt={result.analyzedAt} />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3" data-testid="portfolio-tabs">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="terms" data-testid="tab-terms">
            Terms ({filteredTerms.length})
          </TabsTrigger>
          <TabsTrigger value="anomalies" data-testid="tab-anomalies">
            Anomalies ({filteredAnomalies.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Risk Breakdown */}
            <div className="col-span-2">
              <RiskBreakdownChart riskScore={riskScore} />
            </div>

            {/* Documents Summary */}
            <Card data-testid="documents-summary-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents in Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{doc.name}</p>
                        <p className="text-xs text-zinc-500">{doc.borrowerName}</p>
                      </div>
                      <div className="ml-2 text-right">
                        <span className="text-xs text-zinc-500">
                          {(doc.extractionConfidence * 100).toFixed(0)}% conf
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Issues Section */}
          {criticalAnomalies.length > 0 && (
            <Card className="border-red-200 bg-red-50/30" data-testid="critical-issues-section">
              <CardHeader>
                <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Critical Issues Requiring Immediate Attention
                </CardTitle>
                <CardDescription className="text-red-600">
                  These issues may pose significant regulatory or financial risk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {criticalAnomalies.map((anomaly) => (
                    <AnomalyCard
                      key={anomaly.id}
                      anomaly={anomaly}
                      onViewDocument={handleViewDocument}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Terms Tab */}
        <TabsContent value="terms" className="space-y-4 mt-6">
          <PortfolioFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalTerms={totalTerms}
            filteredTerms={filteredTerms.length}
            totalAnomalies={totalAnomalies}
            filteredAnomalies={filteredAnomalies.length}
          />
          <TermComparisonTable terms={filteredTerms} onViewDocument={handleViewDocument} />
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4 mt-6">
          <PortfolioFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalTerms={totalTerms}
            filteredTerms={filteredTerms.length}
            totalAnomalies={totalAnomalies}
            filteredAnomalies={filteredAnomalies.length}
          />

          {filteredAnomalies.length === 0 ? (
            <Card className="py-12" data-testid="no-anomalies-state">
              <CardContent className="text-center">
                <AlertTriangle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">No anomalies match your filters</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      showOnlyAnomalies: false,
                      anomalySeverity: ['info', 'warning', 'critical'],
                    })
                  }
                  data-testid="reset-anomaly-filters-btn"
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Critical */}
              {criticalAnomalies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    Critical ({criticalAnomalies.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {criticalAnomalies.map((anomaly) => (
                      <AnomalyCard
                        key={anomaly.id}
                        anomaly={anomaly}
                        onViewDocument={handleViewDocument}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Warning */}
              {warningAnomalies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    Warnings ({warningAnomalies.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {warningAnomalies.map((anomaly) => (
                      <AnomalyCard
                        key={anomaly.id}
                        anomaly={anomaly}
                        onViewDocument={handleViewDocument}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              {infoAnomalies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    Information ({infoAnomalies.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {infoAnomalies.map((anomaly) => (
                      <AnomalyCard
                        key={anomaly.id}
                        anomaly={anomaly}
                        onViewDocument={handleViewDocument}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function PortfolioComparisonPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-zinc-100 rounded-lg" />}>
      <PortfolioComparisonPageContent />
    </Suspense>
  );
}
