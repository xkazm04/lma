'use client';

import React, { memo, useRef, useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CorrelationNetwork, CorrelationNetworkNode, CorrelationNetworkEdge } from '../../lib/correlation-types';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

interface NetworkGraphProps {
  network: CorrelationNetwork;
  onNodeClick?: (node: CorrelationNetworkNode) => void;
  onEdgeClick?: (edge: CorrelationNetworkEdge) => void;
}

/**
 * Force-directed graph visualization of covenant correlation network.
 * Shows covenants as nodes and correlations as directed edges.
 */
export const NetworkGraph = memo(function NetworkGraph({
  network,
  onNodeClick,
  onEdgeClick,
}: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Simple force-directed layout positions
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const centerX = 400;
    const centerY = 300;
    const radius = 180;

    // Arrange nodes in a circle based on risk score
    const sortedNodes = [...network.nodes].sort((a, b) => b.risk_score - a.risk_score);

    sortedNodes.forEach((node, idx) => {
      const angle = (idx / sortedNodes.length) * 2 * Math.PI;
      const nodeRadius = radius * (1 - node.centrality * 0.3); // More central = closer to center
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * nodeRadius,
        y: centerY + Math.sin(angle) * nodeRadius,
      });
    });

    return positions;
  }, [network.nodes]);

  // Get node color based on status and risk
  const getNodeColor = (node: CorrelationNetworkNode): string => {
    if (node.status === 'breached') return 'rgb(220, 38, 38)'; // red-600
    if (node.status === 'waived') return 'rgb(245, 158, 11)'; // amber-500
    if (node.status === 'at_risk') return 'rgb(249, 115, 22)'; // orange-500
    return 'rgb(34, 197, 94)'; // green-500
  };

  // Get node size based on centrality and risk
  const getNodeSize = (node: CorrelationNetworkNode): number => {
    const baseSize = 20;
    const centralityBonus = node.centrality * 15;
    const riskBonus = (node.risk_score / 100) * 10;
    return baseSize + centralityBonus + riskBonus;
  };

  // Draw the network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw edges first (so they appear behind nodes)
    network.edges.forEach((edge) => {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);
      if (!sourcePos || !targetPos) return;

      ctx.strokeStyle = edge.style.color;
      ctx.lineWidth = edge.style.thickness;
      ctx.setLineDash(edge.style.dash ? [5, 3] : []);

      // Draw arrow
      const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
      const targetNode = network.nodes.find((n) => n.id === edge.target);
      const targetRadius = targetNode ? getNodeSize(targetNode) : 20;

      const arrowEndX = targetPos.x - Math.cos(angle) * (targetRadius + 5);
      const arrowEndY = targetPos.y - Math.sin(angle) * (targetRadius + 5);

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(arrowEndX, arrowEndY);
      ctx.stroke();

      // Draw arrowhead
      const headLen = 10;
      ctx.beginPath();
      ctx.moveTo(arrowEndX, arrowEndY);
      ctx.lineTo(
        arrowEndX - headLen * Math.cos(angle - Math.PI / 6),
        arrowEndY - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(arrowEndX, arrowEndY);
      ctx.lineTo(
        arrowEndX - headLen * Math.cos(angle + Math.PI / 6),
        arrowEndY - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw nodes
    network.nodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const size = getNodeSize(node);
      const color = getNodeColor(node);
      const isSelected = selectedNode === node.id;
      const isHovered = hoveredNode === node.id;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw node border
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? 'rgb(59, 130, 246)' : 'rgb(148, 163, 184)';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
      }

      // Draw node label
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Truncate long names
      const maxChars = 8;
      const label = node.name.length > maxChars ? node.name.slice(0, maxChars) + '...' : node.name;
      ctx.fillText(label, pos.x, pos.y);

      // Draw facility name below node
      ctx.fillStyle = 'rgb(82, 82, 91)';
      ctx.font = '9px sans-serif';
      const facilityLabel = node.facility_name?.split(' ')[0] || '';
      ctx.fillText(facilityLabel, pos.x, pos.y + size + 12);
    });

    ctx.restore();
  }, [network, nodePositions, scale, offset, selectedNode, hoveredNode]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    // Check if clicked on a node
    for (const node of network.nodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;

      const size = getNodeSize(node);
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

      if (distance <= size) {
        setSelectedNode(node.id);
        onNodeClick?.(node);
        return;
      }
    }

    // Clear selection if clicked on empty space
    setSelectedNode(null);
  };

  // Handle canvas mouse move for hover
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset({ x: offset.x + dx, y: offset.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    let hoveredNodeId: string | null = null;
    for (const node of network.nodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;

      const size = getNodeSize(node);
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

      if (distance <= size) {
        hoveredNodeId = node.id;
        break;
      }
    }

    setHoveredNode(hoveredNodeId);
    canvas.style.cursor = hoveredNodeId ? 'pointer' : 'grab';
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  };

  const handleZoomIn = () => setScale(Math.min(scale * 1.2, 3));
  const handleZoomOut = () => setScale(Math.max(scale / 1.2, 0.3));
  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  return (
    <Card data-testid="network-graph">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Covenant Correlation Network</CardTitle>
            <CardDescription>
              Directed graph showing breach propagation pathways
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              data-testid="zoom-in-btn"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              data-testid="zoom-out-btn"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              data-testid="reset-view-btn"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-4 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <p className="font-semibold text-zinc-700">Node Status:</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600" />
              <span className="text-zinc-600">Breached</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500" />
              <span className="text-zinc-600">Waived</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span className="text-zinc-600">At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-zinc-600">Passing</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-zinc-700">Edge Properties:</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-red-600" />
              <span className="text-zinc-600">Very Strong Correlation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-orange-500" />
              <span className="text-zinc-600">Strong Correlation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-yellow-500" />
              <span className="text-zinc-600">Moderate Correlation</span>
            </div>
            <p className="text-zinc-500 italic mt-2">Node size indicates centrality + risk</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="border border-zinc-200 rounded-md overflow-hidden bg-zinc-50">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-grab"
            data-testid="network-canvas"
          />
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            {(() => {
              const node = network.nodes.find((n) => n.id === selectedNode);
              if (!node) return null;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-blue-900">{node.name}</h4>
                    <Badge
                      className={cn(
                        node.status === 'breached' && 'bg-red-100 text-red-700',
                        node.status === 'waived' && 'bg-amber-100 text-amber-700',
                        node.status === 'at_risk' && 'bg-orange-100 text-orange-700',
                        node.status === 'active' && 'bg-green-100 text-green-700'
                      )}
                    >
                      {node.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-800">{node.facility_name}</p>
                  <div className="grid grid-cols-3 gap-4 text-xs mt-3">
                    <div>
                      <p className="text-blue-600">Headroom</p>
                      <p className="font-semibold text-blue-900">
                        {node.current_headroom?.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Centrality</p>
                      <p className="font-semibold text-blue-900">{node.centrality.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Risk Score</p>
                      <p className="font-semibold text-blue-900">{node.risk_score}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                    <div>
                      <p className="text-blue-600">Inbound Links</p>
                      <p className="font-semibold text-blue-900">{node.in_degree}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Outbound Links</p>
                      <p className="font-semibold text-blue-900">{node.out_degree}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Network Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-zinc-50 rounded border border-zinc-200">
            <p className="text-zinc-500">Network Density</p>
            <p className="text-lg font-semibold text-zinc-900">
              {(network.stats.network_density * 100).toFixed(0)}%
            </p>
          </div>
          <div className="p-3 bg-zinc-50 rounded border border-zinc-200">
            <p className="text-zinc-500">Avg Correlation</p>
            <p className="text-lg font-semibold text-zinc-900">
              {network.stats.avg_correlation_strength.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-zinc-50 rounded border border-zinc-200">
            <p className="text-zinc-500">Most Central</p>
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {network.stats.most_central_covenant?.covenant_name.split(' - ')[1] || 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-zinc-50 rounded border border-zinc-200">
            <p className="text-zinc-500">High Risk Cluster</p>
            <p className="text-lg font-semibold text-zinc-900">
              {network.stats.highest_risk_cluster?.covenant_ids.length || 0} nodes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
