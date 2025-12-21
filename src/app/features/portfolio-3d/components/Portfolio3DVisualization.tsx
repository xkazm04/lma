'use client';

import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Maximize2,
  Minimize2,
  Settings2,
  Eye,
  EyeOff,
  RotateCcw,
  Layers,
  GitBranch,
  Grid3x3,
  Palette,
  Zap,
  ZapOff,
  Box,
  Square,
  Glasses,
  ChevronDown,
  X,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { BorrowerRiskProfile, RiskCorrelation } from '@/app/features/dashboard/lib/mocks';
import type {
  Portfolio3DData,
  VisualizationSettings,
  NodeInteractionEvent,
  LinkInteractionEvent,
  CameraState,
  ViewMode,
  BorrowerNode,
} from '../lib/types';
import { createPortfolio3DData, DEFAULT_SETTINGS, formatExposure } from '../lib/graph-utils';
import { Fallback2DView } from './Fallback2DView';

// Dynamically import 3D components to avoid SSR issues
const Scene3D = dynamic(
  () => import('./Scene3D').then((mod) => mod.Scene3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-zinc-900 rounded-lg">
        <div className="text-zinc-400 text-sm">Loading 3D scene...</div>
      </div>
    ),
  }
);

interface Portfolio3DVisualizationProps {
  borrowers: BorrowerRiskProfile[];
  correlations: RiskCorrelation[];
  settings?: Partial<VisualizationSettings>;
  onNodeClick?: (event: NodeInteractionEvent) => void;
  onNodeHover?: (event: NodeInteractionEvent | null) => void;
  onLinkClick?: (event: LinkInteractionEvent) => void;
  onCameraChange?: (state: CameraState) => void;
  className?: string;
}

export function Portfolio3DVisualization({
  borrowers,
  correlations,
  settings: initialSettings,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  onCameraChange,
  className,
}: Portfolio3DVisualizationProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<BorrowerNode | null>(null);

  // Settings state
  const [settings, setSettings] = useState<VisualizationSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  // Create 3D data from borrowers and correlations
  const data = useMemo<Portfolio3DData>(
    () => createPortfolio3DData(borrowers, correlations, settings),
    [borrowers, correlations, settings]
  );

  // Check WebGL support
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebglSupported(!!gl);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  // Handle node interactions
  const handleNodeClick = useCallback(
    (event: NodeInteractionEvent) => {
      setSelectedNodeId((prev) =>
        prev === event.nodeId ? null : event.nodeId
      );
      onNodeClick?.(event);
    },
    [onNodeClick]
  );

  const handleNodeHover = useCallback(
    (event: NodeInteractionEvent | null) => {
      setHoveredNode(event?.node || null);
      onNodeHover?.(event);
    },
    [onNodeHover]
  );

  // Update settings
  const updateSetting = useCallback(
    <K extends keyof VisualizationSettings>(
      key: K,
      value: VisualizationSettings[K]
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setSelectedNodeId(null);
    setSettings((prev) => ({ ...prev, cameraMode: 'orbit' }));
  }, []);

  // Get selected node details
  const selectedNode = useMemo(
    () => data.nodes.find((n) => n.id === selectedNodeId),
    [data.nodes, selectedNodeId]
  );

  return (
    <Card
      className={cn(
        'relative transition-all duration-300',
        isFullscreen && 'fixed inset-4 z-50 m-0',
        className
      )}
      data-testid="portfolio-3d-visualization"
    >
      <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
            <Box className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">3D Portfolio Landscape</CardTitle>
            <p className="text-[10px] text-zinc-500">
              {data.nodes.length} borrowers · {data.links.length} correlations
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg bg-zinc-100 p-0.5">
            <button
              onClick={() => setViewMode('3d')}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                viewMode === '3d'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              )}
              disabled={!webglSupported}
              data-testid="view-mode-3d-btn"
            >
              <Box className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                viewMode === '2d'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              )}
              data-testid="view-mode-2d-btn"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            {webglSupported && (
              <button
                onClick={() => setViewMode('xr')}
                className={cn(
                  'px-2 py-1 text-xs rounded-md transition-colors',
                  viewMode === 'xr'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
                data-testid="view-mode-xr-btn"
              >
                <Glasses className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              showSettings
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-zinc-500 hover:bg-zinc-100'
            )}
            data-testid="settings-toggle-btn"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Reset view */}
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
            data-testid="reset-view-btn"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
            data-testid="fullscreen-toggle-btn"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Main visualization area */}
        <div
          className={cn(
            'relative bg-zinc-900 rounded-b-lg overflow-hidden',
            isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-[500px]'
          )}
        >
          {/* 3D or 2D view */}
          {(viewMode === '3d' || viewMode === 'xr') && webglSupported ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-zinc-400 text-sm">Loading 3D scene...</div>
                </div>
              }
            >
              <Scene3D
                data={data}
                settings={settings}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
                onLinkClick={onLinkClick}
                onCameraChange={onCameraChange}
                enableXR={viewMode === 'xr'}
              />
            </Suspense>
          ) : (
            <Fallback2DView
              data={data}
              settings={settings}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
            />
          )}

          {/* XR mode overlay */}
          {viewMode === 'xr' && webglSupported && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center">
                <Glasses className="w-12 h-12 text-white mx-auto mb-3" />
                <p className="text-white text-lg font-medium">XR Mode</p>
                <p className="text-zinc-400 text-sm mb-4">
                  Put on your headset to explore the portfolio in VR
                </p>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('3d')}
                  className="text-white border-white hover:bg-white/20"
                >
                  Exit XR Mode
                </Button>
              </div>
            </div>
          )}

          {/* Settings panel */}
          {showSettings && (
            <SettingsPanel
              settings={settings}
              onUpdate={updateSetting}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* Summary stats overlay */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <StatBadge
              label="Systemic Risk"
              value={`${data.summary.systemicRisk}%`}
              color={
                data.summary.systemicRisk > 60
                  ? 'red'
                  : data.summary.systemicRisk > 40
                  ? 'amber'
                  : 'green'
              }
            />
            <StatBadge
              label="Diversification"
              value={`${data.summary.diversificationScore}%`}
              color={
                data.summary.diversificationScore > 60
                  ? 'green'
                  : data.summary.diversificationScore > 40
                  ? 'amber'
                  : 'red'
              }
            />
            <StatBadge
              label="Exposure"
              value={formatExposure(data.summary.totalExposure)}
              color="blue"
            />
          </div>

          {/* Selected node info panel */}
          {selectedNode && (
            <NodeInfoPanel
              node={selectedNode}
              onClose={() => setSelectedNodeId(null)}
              correlatedLinks={data.links.filter(
                (l) =>
                  l.source === selectedNode.id || l.target === selectedNode.id
              )}
              nodes={data.nodes}
            />
          )}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 rounded-b-lg">
          <Legend colorScheme={settings.colorScheme} />
        </div>
      </CardContent>
    </Card>
  );
}

// Settings panel component
interface SettingsPanelProps {
  settings: VisualizationSettings;
  onUpdate: <K extends keyof VisualizationSettings>(
    key: K,
    value: VisualizationSettings[K]
  ) => void;
  onClose: () => void;
}

function SettingsPanel({ settings, onUpdate, onClose }: SettingsPanelProps) {
  return (
    <div
      className="absolute top-2 right-2 w-64 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-zinc-200 animate-in fade-in slide-in-from-right-2 duration-200"
      data-testid="settings-panel"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <span className="text-sm font-medium text-zinc-900">Settings</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-100 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-zinc-500" />
        </button>
      </div>

      <div className="p-3 space-y-3 max-h-[350px] overflow-y-auto">
        {/* Display options */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
            Display
          </p>

          <ToggleOption
            icon={Eye}
            label="Show Labels"
            checked={settings.showLabels}
            onChange={(v) => onUpdate('showLabels', v)}
          />

          <ToggleOption
            icon={GitBranch}
            label="Correlation Lines"
            checked={settings.showCorrelationLines}
            onChange={(v) => onUpdate('showCorrelationLines', v)}
          />

          <ToggleOption
            icon={Layers}
            label="Health Terrain"
            checked={settings.showHealthTerrain}
            onChange={(v) => onUpdate('showHealthTerrain', v)}
          />

          <ToggleOption
            icon={Grid3x3}
            label="Region Boundaries"
            checked={settings.showRegionBoundaries}
            onChange={(v) => onUpdate('showRegionBoundaries', v)}
          />
        </div>

        {/* Color scheme */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
            Color By
          </p>
          <div className="grid grid-cols-2 gap-1">
            {(['risk', 'sector', 'geography', 'esg'] as const).map((scheme) => (
              <button
                key={scheme}
                onClick={() => onUpdate('colorScheme', scheme)}
                className={cn(
                  'px-2 py-1.5 text-xs rounded-md transition-colors capitalize',
                  settings.colorScheme === scheme
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                )}
                data-testid={`color-scheme-${scheme}-btn`}
              >
                {scheme}
              </button>
            ))}
          </div>
        </div>

        {/* Physics */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
            Animation
          </p>

          <ToggleOption
            icon={settings.enablePhysics ? Zap : ZapOff}
            label="Physics Simulation"
            checked={settings.enablePhysics}
            onChange={(v) => onUpdate('enablePhysics', v)}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">Animation Speed</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={settings.animationSpeed}
              onChange={(e) =>
                onUpdate('animationSpeed', parseFloat(e.target.value))
              }
              className="w-20 h-1 accent-indigo-600"
              data-testid="animation-speed-slider"
            />
          </div>
        </div>

        {/* Correlation threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">Min Correlation</span>
            <span className="text-xs text-zinc-900">
              {Math.round(settings.correlationThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.05"
            value={settings.correlationThreshold}
            onChange={(e) =>
              onUpdate('correlationThreshold', parseFloat(e.target.value))
            }
            className="w-full h-1 accent-indigo-600"
            data-testid="correlation-threshold-slider"
          />
        </div>
      </div>
    </div>
  );
}

// Toggle option component
interface ToggleOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleOption({ icon: Icon, label, checked, onChange }: ToggleOptionProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-colors text-left',
        checked
          ? 'bg-indigo-50 text-indigo-700'
          : 'hover:bg-zinc-100 text-zinc-600'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs flex-1">{label}</span>
      <div
        className={cn(
          'w-8 h-4 rounded-full transition-colors relative',
          checked ? 'bg-indigo-600' : 'bg-zinc-300'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </div>
    </button>
  );
}

// Stat badge component
interface StatBadgeProps {
  label: string;
  value: string;
  color: 'red' | 'amber' | 'green' | 'blue';
}

function StatBadge({ label, value, color }: StatBadgeProps) {
  const colorClasses = {
    red: 'bg-red-500/90',
    amber: 'bg-amber-500/90',
    green: 'bg-green-500/90',
    blue: 'bg-blue-500/90',
  };

  return (
    <div
      className={cn(
        'px-2 py-1 rounded-md text-white text-xs backdrop-blur-sm',
        colorClasses[color]
      )}
    >
      <span className="opacity-80">{label}:</span>{' '}
      <span className="font-semibold">{value}</span>
    </div>
  );
}

// Node info panel component
interface NodeInfoPanelProps {
  node: BorrowerNode;
  onClose: () => void;
  correlatedLinks: CorrelationLink[];
  nodes: BorrowerNode[];
}

function NodeInfoPanel({ node, onClose, correlatedLinks, nodes }: NodeInfoPanelProps) {
  const correlatedNodes = correlatedLinks.map((link) => {
    const otherId = link.source === node.id ? link.target : link.source;
    return {
      node: nodes.find((n) => n.id === otherId),
      strength: link.strength,
      type: link.type,
    };
  }).filter((item) => item.node);

  return (
    <div
      className="absolute top-2 left-2 w-72 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-zinc-200 animate-in fade-in slide-in-from-left-2 duration-200"
      data-testid="node-info-panel"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <span className="text-sm font-medium text-zinc-900">{node.name}</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-100 transition-colors"
          data-testid="close-node-info-btn"
        >
          <X className="w-3.5 h-3.5 text-zinc-500" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-zinc-50 rounded-md">
            <p className="text-[10px] text-zinc-500">Exposure</p>
            <p className="text-sm font-semibold text-zinc-900">
              {formatExposure(node.profile.totalExposure)}
            </p>
          </div>
          <div className="p-2 bg-zinc-50 rounded-md">
            <p className="text-[10px] text-zinc-500">Health Score</p>
            <p
              className={cn(
                'text-sm font-semibold',
                node.healthScore >= 70
                  ? 'text-green-600'
                  : node.healthScore >= 50
                  ? 'text-amber-600'
                  : 'text-red-600'
              )}
            >
              {Math.round(node.healthScore)}%
            </p>
          </div>
          <div className="p-2 bg-zinc-50 rounded-md">
            <p className="text-[10px] text-zinc-500">Industry</p>
            <p className="text-sm font-medium text-zinc-900">
              {node.profile.industry}
            </p>
          </div>
          <div className="p-2 bg-zinc-50 rounded-md">
            <p className="text-[10px] text-zinc-500">Rating</p>
            <p className="text-sm font-medium text-zinc-900">
              {node.profile.creditRating || 'N/A'}
            </p>
          </div>
        </div>

        {/* Risk factors */}
        {node.profile.riskFactors.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              Risk Factors
            </p>
            <div className="space-y-1">
              {node.profile.riskFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Badge
                    variant={
                      factor.severity === 'critical'
                        ? 'destructive'
                        : factor.severity === 'high'
                        ? 'warning'
                        : 'secondary'
                    }
                    className="text-[9px] px-1 py-0"
                  >
                    {factor.severity}
                  </Badge>
                  <span className="text-zinc-600 truncate">{factor.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correlated borrowers */}
        {correlatedNodes.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              Correlated Borrowers
            </p>
            <div className="space-y-1 max-h-[100px] overflow-y-auto">
              {correlatedNodes.slice(0, 5).map(({ node: other, strength, type }) => (
                <div
                  key={other?.id}
                  className="flex items-center justify-between text-xs p-1.5 bg-zinc-50 rounded"
                >
                  <span className="text-zinc-700 truncate">{other?.name}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {type.replace('_', ' ')}
                    </Badge>
                    <span
                      className={cn(
                        'font-medium',
                        strength >= 0.7
                          ? 'text-red-600'
                          : strength >= 0.5
                          ? 'text-amber-600'
                          : 'text-zinc-600'
                      )}
                    >
                      {Math.round(strength * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Legend component
interface LegendProps {
  colorScheme: VisualizationSettings['colorScheme'];
}

function Legend({ colorScheme }: LegendProps) {
  const legends = {
    risk: [
      { color: '#ef4444', label: 'Critical' },
      { color: '#f97316', label: 'High' },
      { color: '#eab308', label: 'Medium' },
      { color: '#22c55e', label: 'Low' },
    ],
    sector: [
      { color: '#8b5cf6', label: 'Technology' },
      { color: '#3b82f6', label: 'Manufacturing' },
      { color: '#f97316', label: 'Energy' },
      { color: '#ec4899', label: 'Retail' },
      { color: '#22c55e', label: 'Clean Energy' },
      { color: '#06b6d4', label: 'Financial Services' },
    ],
    geography: [
      { color: '#3b82f6', label: 'North America' },
      { color: '#8b5cf6', label: 'Europe' },
      { color: '#22c55e', label: 'Asia Pacific' },
    ],
    esg: [
      { color: '#22c55e', label: 'High (70+)' },
      { color: '#eab308', label: 'Medium (50-69)' },
      { color: '#ef4444', label: 'Low (<50)' },
    ],
  };

  const items = legends[colorScheme];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
        {colorScheme}
      </span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-zinc-600">{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-auto">
        <Info className="w-3 h-3 text-zinc-400" />
        <span className="text-[10px] text-zinc-400">
          Node size = exposure · Line thickness = correlation
        </span>
      </div>
    </div>
  );
}

// Type for correlation links used in this component
interface CorrelationLink {
  id: string;
  source: string;
  target: string;
  strength: number;
  type: string;
  color: string;
  width: number;
  opacity: number;
  isHighlighted: boolean;
}
