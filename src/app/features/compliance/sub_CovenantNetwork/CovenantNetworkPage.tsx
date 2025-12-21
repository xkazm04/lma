'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import {
  CorrelationMatrixHeatmap,
  NetworkGraph,
  ContagionRiskPanel,
} from './components';
import {
  mockCorrelationNetwork,
  mockCorrelationMatrix,
  mockContagionAssessment,
} from '../lib/correlation-mock-data';
import type { CorrelationNetworkNode } from '../lib/correlation-types';
import { Network, Grid3x3, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

/**
 * Covenant Network Analysis Page
 * Displays cross-facility covenant correlation analysis with network graph and matrix views.
 */
export const CovenantNetworkPage = memo(function CovenantNetworkPage() {
  const [activeTab, setActiveTab] = useState<'network' | 'matrix' | 'contagion'>('network');
  const [selectedCovenantId, setSelectedCovenantId] = useState<string | null>(null);

  const handleNodeClick = useCallback((node: CorrelationNetworkNode) => {
    console.log('Node clicked:', node);
    setSelectedCovenantId(node.id);
  }, []);

  const handleMatrixCellClick = useCallback((rowId: string, colId: string, correlation: number) => {
    console.log('Matrix cell clicked:', { rowId, colId, correlation });
    setSelectedCovenantId(rowId);
  }, []);

  const handleCovenantClick = useCallback((covenantId: string) => {
    console.log('Covenant clicked:', covenantId);
    setSelectedCovenantId(covenantId);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in" data-testid="covenant-network-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
            <Link href="/compliance" className="hover:text-zinc-900 transition-colors">
              Compliance
            </Link>
            <span>/</span>
            <span className="text-zinc-900">Covenant Network</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Cross-Facility Covenant Correlation</h1>
          <p className="text-zinc-500 mt-1">
            Network analysis of covenant dependencies and breach propagation pathways
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Activity className="w-3 h-3 mr-1" />
            {mockCorrelationNetwork.stats.significant_correlations} Correlations
          </Badge>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {mockCorrelationNetwork.stats.highest_risk_cluster?.covenant_ids.length || 0} High Risk
          </Badge>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-500">Network Density</p>
              <TrendingUp className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">
              {(mockCorrelationNetwork.stats.network_density * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {mockCorrelationNetwork.stats.significant_correlations} of{' '}
              {(mockCorrelationNetwork.stats.total_covenants * (mockCorrelationNetwork.stats.total_covenants - 1)) / 2}{' '}
              possible connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-500">Avg Correlation</p>
              <Activity className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">
              {mockCorrelationNetwork.stats.avg_correlation_strength.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Moderate-to-strong dependencies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-500">Most Central</p>
              <Network className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-base font-bold text-zinc-900 truncate">
              {mockCorrelationNetwork.stats.most_central_covenant?.covenant_name.split(' - ')[1] || 'N/A'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Centrality: {mockCorrelationNetwork.stats.most_central_covenant?.centrality.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-500">Risk Cluster</p>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {mockCorrelationNetwork.stats.highest_risk_cluster?.covenant_ids.length || 0} Nodes
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {mockCorrelationNetwork.stats.highest_risk_cluster?.propagation_potential}% propagation potential
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('network')}
            className={`pb-3 px-1 border-b-2 transition-colors text-sm font-medium ${
              activeTab === 'network'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
            data-testid="network-tab"
          >
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Network Graph
            </div>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 px-1 border-b-2 transition-colors text-sm font-medium ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
            data-testid="matrix-tab"
          >
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              Correlation Matrix
            </div>
          </button>
          <button
            onClick={() => setActiveTab('contagion')}
            className={`pb-3 px-1 border-b-2 transition-colors text-sm font-medium ${
              activeTab === 'contagion'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
            data-testid="contagion-tab"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Contagion Risk
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in">
        {activeTab === 'network' && (
          <NetworkGraph
            network={mockCorrelationNetwork}
            onNodeClick={handleNodeClick}
          />
        )}

        {activeTab === 'matrix' && (
          <CorrelationMatrixHeatmap
            matrix={mockCorrelationMatrix}
            onCellClick={handleMatrixCellClick}
          />
        )}

        {activeTab === 'contagion' && (
          <ContagionRiskPanel
            assessment={mockContagionAssessment}
            onCovenantClick={handleCovenantClick}
          />
        )}
      </div>

      {/* Methodology Note */}
      <Card className="bg-zinc-50">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-2">Methodology</h3>
          <div className="text-xs text-zinc-600 space-y-2">
            <p>
              <strong>Correlation Analysis:</strong> Pearson correlation coefficients calculated from historical
              covenant test results (16 quarters). Significance threshold: p ≤ 0.05.
            </p>
            <p>
              <strong>Lead-Lag Analysis:</strong> Cross-correlation at different time lags to identify predictive
              relationships between covenants. Positive lag indicates source covenant leads target.
            </p>
            <p>
              <strong>Breach Propagation:</strong> Probability estimates based on historical co-breach rates and
              correlation strength. Contagion timeline derived from average lag between correlated breaches.
            </p>
            <p>
              <strong>Network Centrality:</strong> Calculated using eigenvector centrality to identify covenants
              whose breach would have the highest systemic impact.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
