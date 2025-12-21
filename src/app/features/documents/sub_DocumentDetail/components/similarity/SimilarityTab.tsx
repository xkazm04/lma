'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  Search,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileSearch,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrecedentFinder } from './PrecedentFinder';
import { DeviationHighlighter } from './DeviationHighlighter';
import { MarketBenchmarks } from './MarketBenchmarks';
import type { DocumentSimilarityAnalysis, SimilarDocument } from '@/app/features/documents/lib/types';

interface SimilarityTabProps {
  documentId: string;
}

const MatchQualityBadge = memo(function MatchQualityBadge({
  quality,
}: {
  quality: DocumentSimilarityAnalysis['overallMatchQuality'];
}) {
  const variants = {
    excellent: { variant: 'success' as const, label: 'Excellent Match' },
    good: { variant: 'info' as const, label: 'Good Match' },
    moderate: { variant: 'warning' as const, label: 'Moderate Match' },
    limited: { variant: 'secondary' as const, label: 'Limited Match' },
  };

  const config = variants[quality];
  return <Badge variant={config.variant}>{config.label}</Badge>;
});

export const SimilarityTab = memo(function SimilarityTab({ documentId }: SimilarityTabProps) {
  const [analysis, setAnalysis] = useState<DocumentSimilarityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState('precedents');

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/similarity?type=full`);
      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch analysis');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleDocumentSelect = useCallback((document: SimilarDocument) => {
    console.log('Selected precedent document:', document);
    // Could navigate to comparison view or open a modal
  }, []);

  // Calculate quick stats from analysis
  const criticalDeviations =
    analysis?.deviations.filter((d) => d.severity === 'critical').length || 0;
  const highDeviations = analysis?.deviations.filter((d) => d.severity === 'high').length || 0;
  const belowMarketTerms =
    analysis?.marketBenchmarks.filter((b) => b.assessment === 'below_market').length || 0;

  return (
    <div className="space-y-6" data-testid="similarity-tab">
      {/* Summary Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Similarity & Precedent Analysis</CardTitle>
                <CardDescription>
                  Find similar documents, compare to norms, and benchmark against market
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analysis && <MatchQualityBadge quality={analysis.overallMatchQuality} />}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalysis}
                disabled={isLoading}
                data-testid="refresh-analysis-btn"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Quick Summary */}
        {analysis && !isLoading && (
          <CardContent>
            <div className="space-y-4">
              {/* Summary Text */}
              <p className="text-sm text-zinc-600">{analysis.analysisSummary}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="text-xl font-bold text-blue-600">
                    {analysis.similarDocuments.length}
                  </div>
                  <div className="text-xs text-zinc-500">Similar Docs</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-xl font-bold text-amber-600">
                    {analysis.deviations.length}
                  </div>
                  <div className="text-xs text-zinc-500">Deviations</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="text-xl font-bold text-purple-600">
                    {analysis.marketBenchmarks.length}
                  </div>
                  <div className="text-xs text-zinc-500">Benchmarks</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="text-xl font-bold text-green-600">
                    {analysis.recommendations.length}
                  </div>
                  <div className="text-xs text-zinc-500">Recommendations</div>
                </div>
              </div>

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h4 className="font-medium text-zinc-800">Key Recommendations</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-zinc-600">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alert for Critical Issues */}
              {(criticalDeviations > 0 || highDeviations > 0 || belowMarketTerms > 0) && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h4 className="font-medium text-red-800">Attention Required</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-red-600">
                    {criticalDeviations > 0 && (
                      <li>• {criticalDeviations} critical deviation(s) from organizational norms</li>
                    )}
                    {highDeviations > 0 && (
                      <li>• {highDeviations} high-severity deviation(s) to review</li>
                    )}
                    {belowMarketTerms > 0 && (
                      <li>• {belowMarketTerms} term(s) below market rates</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        )}

        {/* Loading State */}
        {isLoading && (
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-zinc-500">Analyzing document similarity...</p>
              </div>
            </div>
          </CardContent>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <CardContent>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalysis}
                className="mt-2"
                data-testid="retry-analysis-btn"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Detailed Tabs */}
      {!isLoading && !error && (
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} data-testid="similarity-subtabs">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="precedents"
              className="flex items-center gap-2"
              data-testid="precedents-subtab"
            >
              <FileSearch className="w-4 h-4" />
              <span className="hidden sm:inline">Similar Documents</span>
              <span className="sm:hidden">Docs</span>
              {analysis && (
                <Badge variant="secondary" className="ml-1">
                  {analysis.similarDocuments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="deviations"
              className="flex items-center gap-2"
              data-testid="deviations-subtab"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Deviations</span>
              <span className="sm:hidden">Dev</span>
              {analysis && (
                <Badge
                  variant={criticalDeviations > 0 ? 'destructive' : 'secondary'}
                  className="ml-1"
                >
                  {analysis.deviations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="benchmarks"
              className="flex items-center gap-2"
              data-testid="benchmarks-subtab"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Benchmarks</span>
              <span className="sm:hidden">Bench</span>
              {analysis && (
                <Badge variant="secondary" className="ml-1">
                  {analysis.marketBenchmarks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="precedents" className="mt-6" data-testid="precedents-subtab-content">
            <PrecedentFinder documentId={documentId} onDocumentSelect={handleDocumentSelect} />
          </TabsContent>

          <TabsContent value="deviations" className="mt-6" data-testid="deviations-subtab-content">
            <DeviationHighlighter documentId={documentId} />
          </TabsContent>

          <TabsContent value="benchmarks" className="mt-6" data-testid="benchmarks-subtab-content">
            <MarketBenchmarks documentId={documentId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
});
