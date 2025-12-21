'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, Info, AlertTriangle } from 'lucide-react';
import { Portfolio3DVisualization } from '@/app/features/portfolio-3d';
import { mockBorrowerProfiles, mockCorrelations } from '@/app/features/dashboard/lib/mocks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { NodeInteractionEvent, CameraState } from '@/app/features/portfolio-3d/lib/types';

export default function Portfolio3DPage() {
  const [selectedNode, setSelectedNode] = useState<NodeInteractionEvent | null>(null);
  const [cameraState, setCameraState] = useState<CameraState | null>(null);

  const handleNodeClick = useCallback((event: NodeInteractionEvent) => {
    setSelectedNode(event);
    console.log('Node clicked:', event.node.name);
  }, []);

  const handleNodeHover = useCallback((event: NodeInteractionEvent | null) => {
    // Could update UI or show preview
    if (event) {
      console.log('Hovering:', event.node.name);
    }
  }, []);

  const handleCameraChange = useCallback((state: CameraState) => {
    setCameraState(state);
  }, []);

  return (
    <div className="space-y-4" data-testid="portfolio-3d-page">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" data-testid="back-to-dashboard-link">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <div className="h-6 w-px bg-zinc-200" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <Box className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">
                3D Portfolio Landscape
              </h1>
              <p className="text-xs text-zinc-500">
                Immersive spatial visualization of portfolio correlations
              </p>
            </div>
          </div>
        </div>

        {/* Info tooltip */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Info className="w-4 h-4" />
          <span>
            Click nodes to select · Drag to rotate · Scroll to zoom
          </span>
        </div>
      </div>

      {/* Instructions card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white shadow-sm">
              <AlertTriangle className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 mb-1">
                Explore Your Portfolio in 3D
              </p>
              <ul className="text-xs text-zinc-600 space-y-0.5">
                <li>
                  <strong>Node size</strong> represents total exposure
                </li>
                <li>
                  <strong>Node color</strong> indicates risk level (red = critical, green = low)
                </li>
                <li>
                  <strong>Connection lines</strong> show correlation strength between borrowers
                </li>
                <li>
                  <strong>Terrain height</strong> represents portfolio health in that region
                </li>
                <li>
                  <strong>VR Mode</strong> available for Apple Vision Pro and Meta Quest headsets
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main 3D visualization */}
      <Portfolio3DVisualization
        borrowers={mockBorrowerProfiles}
        correlations={mockCorrelations}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onCameraChange={handleCameraChange}
        settings={{
          showLabels: true,
          showCorrelationLines: true,
          showHealthTerrain: true,
          colorScheme: 'risk',
          enablePhysics: true,
        }}
      />

      {/* Quick stats below the visualization */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStatCard
          title="Total Borrowers"
          value={mockBorrowerProfiles.length.toString()}
          description="Active portfolio positions"
        />
        <QuickStatCard
          title="Correlations"
          value={mockCorrelations.length.toString()}
          description="Inter-borrower relationships"
        />
        <QuickStatCard
          title="High Risk Links"
          value={mockCorrelations.filter((c) => c.correlationStrength >= 0.7).length.toString()}
          description="Correlations above 70%"
          highlight
        />
        <QuickStatCard
          title="Risk Events"
          value={mockBorrowerProfiles
            .flatMap((b) => b.riskFactors)
            .filter((f) => f.severity === 'critical' || f.severity === 'high')
            .length.toString()}
          description="Active critical/high alerts"
          highlight
        />
      </div>
    </div>
  );
}

// Quick stat card component
interface QuickStatCardProps {
  title: string;
  value: string;
  description: string;
  highlight?: boolean;
}

function QuickStatCard({ title, value, description, highlight }: QuickStatCardProps) {
  return (
    <Card
      className={highlight ? 'border-amber-200 bg-amber-50/50' : ''}
      data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="py-3 px-4">
        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
          {title}
        </p>
        <p
          className={`text-2xl font-bold ${
            highlight ? 'text-amber-600' : 'text-zinc-900'
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-zinc-500">{description}</p>
      </CardContent>
    </Card>
  );
}
