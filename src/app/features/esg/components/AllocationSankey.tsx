'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sankey, sankeyLinkHorizontal, SankeyGraph } from 'd3-sankey';
import { X, ZoomIn, ZoomOut, RotateCcw, Filter } from 'lucide-react';
import { formatCurrency, type FacilityAllocation, type AllocationCategory, type AllocationProject } from '../lib';

interface SankeyNodeData {
  name: string;
  id: string;
  type: 'commitment' | 'category' | 'project' | 'unallocated';
  value: number;
  originalData?: AllocationCategory | AllocationProject;
}

interface SankeyLinkData {
  source: number;
  target: number;
  value: number;
  sourceId: string;
  targetId: string;
}

interface AllocationSankeyProps {
  facility: FacilityAllocation;
  onFilterChange?: (filter: SankeyFilter | null) => void;
}

export interface SankeyFilter {
  type: 'category' | 'project';
  id: string;
  name: string;
}

type ProcessedNode = SankeyNodeData & { index: number; x0: number; x1: number; y0: number; y1: number };
type ProcessedLink = SankeyLinkData & {
  source: ProcessedNode;
  target: ProcessedNode;
  y0: number;
  y1: number;
  width: number;
};

// Color palette for categories
const CATEGORY_COLORS: Record<string, string> = {
  renewable_energy: '#22c55e',
  energy_efficiency: '#84cc16',
  clean_transportation: '#06b6d4',
  sustainable_water: '#0ea5e9',
  circular_economy: '#8b5cf6',
  green_buildings: '#10b981',
  affordable_housing: '#a855f7',
  healthcare_access: '#ec4899',
  education: '#f97316',
  employment_generation: '#eab308',
};

const getCategoryColor = (categoryKey: string): string => {
  return CATEGORY_COLORS[categoryKey] || '#6b7280';
};

export const AllocationSankey = memo(function AllocationSankey({
  facility,
  onFilterChange
}: AllocationSankeyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<SankeyFilter | null>(null);
  const [zoom, setZoom] = useState(1);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(width - 48, 400),
          height: Math.max(400, Math.min(600, width * 0.6)),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Build Sankey data
  const sankeyData = useMemo(() => {
    const nodes: SankeyNodeData[] = [];
    const links: SankeyLinkData[] = [];
    let nodeIndex = 0;

    // Commitment node (source)
    nodes.push({
      name: 'Total Commitment',
      id: 'commitment',
      type: 'commitment',
      value: facility.commitment_amount,
    });
    const commitmentIndex = nodeIndex++;

    // Category nodes and links from commitment to categories
    const categoryIndices: Record<string, number> = {};
    facility.categories.forEach((category) => {
      nodes.push({
        name: category.category_name,
        id: `category-${category.id}`,
        type: 'category',
        value: category.total_allocated,
        originalData: category,
      });
      categoryIndices[category.id] = nodeIndex;

      links.push({
        source: commitmentIndex,
        target: nodeIndex,
        value: category.total_allocated,
        sourceId: 'commitment',
        targetId: `category-${category.id}`,
      });
      nodeIndex++;
    });

    // Project nodes and links from categories to projects
    facility.categories.forEach((category) => {
      category.projects.forEach((project) => {
        nodes.push({
          name: project.project_name,
          id: `project-${project.id}`,
          type: 'project',
          value: project.amount,
          originalData: project,
        });

        links.push({
          source: categoryIndices[category.id],
          target: nodeIndex,
          value: project.amount,
          sourceId: `category-${category.id}`,
          targetId: `project-${project.id}`,
        });
        nodeIndex++;
      });
    });

    // Unallocated node
    if (facility.unallocated_amount > 0) {
      nodes.push({
        name: 'Unallocated',
        id: 'unallocated',
        type: 'unallocated',
        value: facility.unallocated_amount,
      });

      links.push({
        source: commitmentIndex,
        target: nodeIndex,
        value: facility.unallocated_amount,
        sourceId: 'commitment',
        targetId: 'unallocated',
      });
    }

    return { nodes, links };
  }, [facility]);

  // Create Sankey layout
  const { processedNodes, processedLinks } = useMemo(() => {
    const margin = { top: 20, right: 150, bottom: 20, left: 20 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const sankeyGenerator = sankey<SankeyNodeData, SankeyLinkData>()
      .nodeId((d) => d.id)
      .nodeWidth(24)
      .nodePadding(16)
      .extent([[margin.left, margin.top], [innerWidth + margin.left, innerHeight + margin.top]]);

    const graph: SankeyGraph<SankeyNodeData, SankeyLinkData> = {
      nodes: sankeyData.nodes.map((d) => ({ ...d })),
      links: sankeyData.links.map((d) => ({ ...d })),
    };

    const result = sankeyGenerator(graph);

    return {
      processedNodes: result.nodes as ProcessedNode[],
      processedLinks: result.links as ProcessedLink[],
    };
  }, [sankeyData, dimensions]);

  // Handle node click for filtering
  const handleNodeClick = useCallback((node: ProcessedNode) => {
    if (node.type === 'category') {
      const newFilter: SankeyFilter = {
        type: 'category',
        id: node.id.replace('category-', ''),
        name: node.name,
      };
      setSelectedFilter(newFilter);
      onFilterChange?.(newFilter);
    } else if (node.type === 'project') {
      const newFilter: SankeyFilter = {
        type: 'project',
        id: node.id.replace('project-', ''),
        name: node.name,
      };
      setSelectedFilter(newFilter);
      onFilterChange?.(newFilter);
    }
  }, [onFilterChange]);

  const clearFilter = useCallback(() => {
    setSelectedFilter(null);
    onFilterChange?.(null);
  }, [onFilterChange]);

  // Get node color
  const getNodeColor = (node: ProcessedNode): string => {
    if (node.type === 'commitment') return '#3b82f6';
    if (node.type === 'unallocated') return '#9ca3af';
    if (node.type === 'category') {
      const category = node.originalData as AllocationCategory;
      return getCategoryColor(category.eligible_category);
    }
    // For projects, find their parent category color
    const parentLink = processedLinks.find((l) => l.target.id === node.id);
    if (parentLink && parentLink.source.type === 'category') {
      const category = parentLink.source.originalData as AllocationCategory;
      return getCategoryColor(category.eligible_category);
    }
    return '#6b7280';
  };

  // Check if element is dimmed (not part of selected filter)
  const isDimmed = (id: string): boolean => {
    if (!selectedFilter) return false;

    if (selectedFilter.type === 'category') {
      const categoryId = `category-${selectedFilter.id}`;
      // Keep highlighted: the category, commitment, and projects under this category
      if (id === categoryId || id === 'commitment') return false;
      const matchingLink = processedLinks.find(
        (l) => l.source.id === categoryId && l.target.id === id
      );
      return !matchingLink;
    }

    if (selectedFilter.type === 'project') {
      const projectId = `project-${selectedFilter.id}`;
      if (id === projectId || id === 'commitment') return false;
      // Find the category for this project
      const projectLink = processedLinks.find((l) => l.target.id === projectId);
      if (projectLink && projectLink.source.id === id) return false;
      return true;
    }

    return false;
  };

  const isLinkDimmed = (link: ProcessedLink): boolean => {
    if (!selectedFilter) return false;

    if (selectedFilter.type === 'category') {
      const categoryId = `category-${selectedFilter.id}`;
      // Keep links from commitment to this category and from this category to its projects
      return link.source.id !== categoryId && link.target.id !== categoryId;
    }

    if (selectedFilter.type === 'project') {
      const projectId = `project-${selectedFilter.id}`;
      // Find the category for this project
      const projectLink = processedLinks.find((l) => l.target.id === projectId);
      if (!projectLink) return true;
      const categoryId = projectLink.source.id;

      // Keep links in the path: commitment -> category -> project
      if (link.target.id === projectId) return false;
      if (link.target.id === categoryId && link.source.id === 'commitment') return false;
      return true;
    }

    return false;
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fund Allocation Flow</CardTitle>
            <p className="text-sm text-zinc-500 mt-1">
              Click on categories or projects to filter the view
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedFilter && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 pr-1"
                data-testid="sankey-filter-badge"
              >
                <Filter className="w-3 h-3" />
                {selectedFilter.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-zinc-200 rounded-full ml-1"
                  onClick={clearFilter}
                  data-testid="sankey-clear-filter-btn"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            <div className="flex items-center gap-1 border border-zinc-200 rounded-md p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleZoomOut}
                data-testid="sankey-zoom-out-btn"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-zinc-500 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleZoomIn}
                data-testid="sankey-zoom-in-btn"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleResetZoom}
                data-testid="sankey-reset-zoom-btn"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="overflow-hidden"
          data-testid="sankey-container"
        >
          <svg
            width={dimensions.width}
            height={dimensions.height}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            data-testid="sankey-svg"
          >
            <defs>
              {processedLinks.map((link) => {
                const sourceColor = getNodeColor(link.source as ProcessedNode);
                const targetColor = getNodeColor(link.target as ProcessedNode);
                return (
                  <linearGradient
                    key={`gradient-${link.sourceId}-${link.targetId}`}
                    id={`gradient-${link.sourceId}-${link.targetId}`}
                    gradientUnits="userSpaceOnUse"
                    x1={link.source.x1}
                    x2={link.target.x0}
                  >
                    <stop offset="0%" stopColor={sourceColor} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={targetColor} stopOpacity={0.5} />
                  </linearGradient>
                );
              })}
            </defs>

            {/* Links */}
            <g className="links">
              {processedLinks.map((link) => {
                const linkId = `${link.sourceId}-${link.targetId}`;
                const isHovered = hoveredLink === linkId;
                const dimmed = isLinkDimmed(link);

                return (
                  <path
                    key={linkId}
                    d={sankeyLinkHorizontal()(link) || ''}
                    fill="none"
                    stroke={`url(#gradient-${link.sourceId}-${link.targetId})`}
                    strokeWidth={Math.max(1, link.width)}
                    strokeOpacity={dimmed ? 0.1 : isHovered ? 0.8 : 0.4}
                    className="transition-all duration-200"
                    onMouseEnter={() => setHoveredLink(linkId)}
                    onMouseLeave={() => setHoveredLink(null)}
                    data-testid={`sankey-link-${linkId}`}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {processedNodes.map((node) => {
                const nodeColor = getNodeColor(node);
                const isHovered = hoveredNode === node.id;
                const dimmed = isDimmed(node.id);
                const isClickable = node.type === 'category' || node.type === 'project';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x0}, ${node.y0})`}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => isClickable && handleNodeClick(node)}
                    className={isClickable ? 'cursor-pointer' : ''}
                    data-testid={`sankey-node-${node.id}`}
                  >
                    {/* Node rectangle */}
                    <rect
                      width={node.x1 - node.x0}
                      height={node.y1 - node.y0}
                      fill={nodeColor}
                      fillOpacity={dimmed ? 0.2 : isHovered ? 1 : 0.8}
                      rx={4}
                      className="transition-all duration-200"
                      stroke={isHovered ? '#000' : 'none'}
                      strokeWidth={isHovered ? 2 : 0}
                    />

                    {/* Node label */}
                    <text
                      x={node.x1 - node.x0 + 8}
                      y={(node.y1 - node.y0) / 2}
                      dy="0.35em"
                      textAnchor="start"
                      fill={dimmed ? '#9ca3af' : '#27272a'}
                      fontSize={12}
                      fontWeight={isHovered ? 600 : 400}
                      className="transition-all duration-200 pointer-events-none"
                    >
                      {node.name}
                    </text>

                    {/* Value label */}
                    <text
                      x={node.x1 - node.x0 + 8}
                      y={(node.y1 - node.y0) / 2 + 14}
                      dy="0.35em"
                      textAnchor="start"
                      fill={dimmed ? '#d4d4d8' : '#71717a'}
                      fontSize={10}
                      className="transition-all duration-200 pointer-events-none"
                    >
                      {formatCurrency(node.value)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Tooltip */}
            {(hoveredNode || hoveredLink) && (
              <g className="tooltip pointer-events-none">
                {hoveredNode && (() => {
                  const node = processedNodes.find((n) => n.id === hoveredNode);
                  if (!node) return null;

                  const tooltipX = node.x1 + 160;
                  const tooltipY = node.y0;

                  return (
                    <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                      <rect
                        x={-4}
                        y={-4}
                        width={120}
                        height={50}
                        fill="white"
                        stroke="#e4e4e7"
                        rx={4}
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                      />
                      <text x={4} y={12} fontSize={11} fontWeight={600} fill="#27272a">
                        {node.name}
                      </text>
                      <text x={4} y={28} fontSize={10} fill="#71717a">
                        Amount: {formatCurrency(node.value)}
                      </text>
                      {node.type !== 'commitment' && node.type !== 'unallocated' && (
                        <text x={4} y={42} fontSize={9} fill="#a1a1aa">
                          Click to filter
                        </text>
                      )}
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-zinc-200">
          <p className="text-xs text-zinc-500 mb-2">Legend</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-xs text-zinc-600">Commitment</span>
            </div>
            {facility.categories.map((category) => (
              <div key={category.id} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getCategoryColor(category.eligible_category) }}
                />
                <span className="text-xs text-zinc-600">{category.category_name}</span>
              </div>
            ))}
            {facility.unallocated_amount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-gray-400" />
                <span className="text-xs text-zinc-600">Unallocated</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
