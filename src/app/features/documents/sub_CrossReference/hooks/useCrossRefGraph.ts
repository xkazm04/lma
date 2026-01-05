// Hook for managing cross-reference graph state and interactions

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  CrossRefNode,
  CrossRefLink,
  CrossRefNodeWithPosition,
  CrossRefGraphData,
  GraphFilterOptions,
  GraphVisualizationSettings,
  ImpactAnalysis,
  Position2D,
} from '../lib/types';
import {
  DEFAULT_FILTER_OPTIONS,
  DEFAULT_GRAPH_SETTINGS,
  NODE_TYPE_COLORS,
  CATEGORY_COLORS,
  IMPACT_COLORS,
  LINK_TYPE_COLORS,
} from '../lib/types';
import { mockGraphData, generateMockImpactAnalysis, getLinksForNode } from '../lib/mock-data';

/**
 * Options for the useCrossRefGraph hook
 */
export interface UseCrossRefGraphOptions {
  /** Initial filter options */
  initialFilters?: Partial<GraphFilterOptions>;
  /** Initial visualization settings */
  initialSettings?: Partial<GraphVisualizationSettings>;
  /** Document ID to load graph for */
  documentId?: string;
  /** Comparison document ID */
  comparisonDocumentId?: string;
}

/**
 * Return type for the hook
 */
export interface UseCrossRefGraphReturn {
  /** Graph data */
  graphData: CrossRefGraphData | null;
  /** Nodes with positions for rendering */
  nodesWithPositions: CrossRefNodeWithPosition[];
  /** Filtered links */
  filteredLinks: CrossRefLink[];
  /** Filter options */
  filters: GraphFilterOptions;
  /** Update filters */
  setFilters: (filters: Partial<GraphFilterOptions>) => void;
  /** Reset filters to default */
  resetFilters: () => void;
  /** Visualization settings */
  settings: GraphVisualizationSettings;
  /** Update settings */
  setSettings: (settings: Partial<GraphVisualizationSettings>) => void;
  /** Currently selected node ID */
  selectedNodeId: string | null;
  /** Select a node */
  selectNode: (nodeId: string | null) => void;
  /** Currently hovered node ID */
  hoveredNodeId: string | null;
  /** Set hovered node */
  setHoveredNode: (nodeId: string | null) => void;
  /** Impact analysis for selected node */
  impactAnalysis: ImpactAnalysis | null;
  /** Highlighted node IDs (in impact chain) */
  highlightedNodeIds: Set<string>;
  /** Whether graph is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh graph data */
  refresh: () => void;
  /** Zoom level */
  zoomLevel: number;
  /** Set zoom level */
  setZoomLevel: (zoom: number) => void;
  /** Pan offset */
  panOffset: Position2D;
  /** Set pan offset */
  setPanOffset: (offset: Position2D) => void;
  /** Reset view to center */
  resetView: () => void;
  /** Get node color based on settings */
  getNodeColor: (node: CrossRefNode) => string;
  /** Get link color */
  getLinkColor: (link: CrossRefLink) => string;
  /** Trigger ripple animation from a node */
  triggerRipple: (nodeId: string) => void;
  /** Update node position (for dragging) */
  updateNodePosition: (nodeId: string, position: Position2D) => void;
  /** Pin/unpin a node */
  toggleNodePin: (nodeId: string) => void;
}

/**
 * Force simulation constants
 */
const SIMULATION_CONFIG = {
  repulsionStrength: 200,
  attractionStrength: 0.05,
  centerGravity: 0.01,
  damping: 0.9,
  velocityDecay: 0.4,
  minDistance: 50,
  maxIterations: 200,
};

/**
 * Initialize node positions in a circular layout
 */
function initializePositions(nodes: CrossRefNode[], width: number, height: number): CrossRefNodeWithPosition[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  // Group nodes by category for initial placement
  const categorizedNodes = new Map<string, CrossRefNode[]>();
  nodes.forEach(node => {
    const category = node.category;
    if (!categorizedNodes.has(category)) {
      categorizedNodes.set(category, []);
    }
    categorizedNodes.get(category)!.push(node);
  });

  const positionedNodes: CrossRefNodeWithPosition[] = [];
  let categoryIndex = 0;
  const numCategories = categorizedNodes.size;

  categorizedNodes.forEach((categoryNodes, category) => {
    const categoryAngle = (categoryIndex / numCategories) * 2 * Math.PI - Math.PI / 2;
    const categoryRadius = radius * 0.8;
    const categoryCenterX = centerX + Math.cos(categoryAngle) * categoryRadius * 0.5;
    const categoryCenterY = centerY + Math.sin(categoryAngle) * categoryRadius * 0.5;

    categoryNodes.forEach((node, nodeIndex) => {
      const nodeAngle = categoryAngle + ((nodeIndex - categoryNodes.length / 2) * 0.3);
      const nodeRadius = radius * (0.3 + Math.random() * 0.2);

      positionedNodes.push({
        ...node,
        position: {
          x: categoryCenterX + Math.cos(nodeAngle) * nodeRadius + (Math.random() - 0.5) * 30,
          y: categoryCenterY + Math.sin(nodeAngle) * nodeRadius + (Math.random() - 0.5) * 30,
        },
        velocity: { x: 0, y: 0 },
        isSelected: false,
        isHovered: false,
        isHighlighted: false,
      });
    });

    categoryIndex++;
  });

  return positionedNodes;
}

/**
 * Apply one step of force simulation
 */
function applyForces(
  nodes: CrossRefNodeWithPosition[],
  links: CrossRefLink[],
  width: number,
  height: number
): CrossRefNodeWithPosition[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return nodes.map(node => {
    if (node.fx !== undefined && node.fy !== undefined) {
      return { ...node, position: { x: node.fx, y: node.fy }, velocity: { x: 0, y: 0 } };
    }

    let fx = 0;
    let fy = 0;

    // Repulsion from other nodes
    nodes.forEach(other => {
      if (other.id === node.id) return;

      const dx = node.position.x - other.position.x;
      const dy = node.position.y - other.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const minDist = SIMULATION_CONFIG.minDistance;

      if (dist < minDist * 3) {
        const repulsion = SIMULATION_CONFIG.repulsionStrength / (dist * dist);
        fx += (dx / dist) * repulsion;
        fy += (dy / dist) * repulsion;
      }
    });

    // Attraction along links
    links.forEach(link => {
      if (link.sourceId !== node.id && link.targetId !== node.id) return;

      const otherId = link.sourceId === node.id ? link.targetId : link.sourceId;
      const other = nodeMap.get(otherId);
      if (!other) return;

      const dx = other.position.x - node.position.x;
      const dy = other.position.y - node.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      const attraction = dist * SIMULATION_CONFIG.attractionStrength * link.strength;
      fx += (dx / dist) * attraction;
      fy += (dy / dist) * attraction;
    });

    // Center gravity
    const centerX = width / 2;
    const centerY = height / 2;
    fx += (centerX - node.position.x) * SIMULATION_CONFIG.centerGravity;
    fy += (centerY - node.position.y) * SIMULATION_CONFIG.centerGravity;

    // Update velocity with damping
    const newVelocity = {
      x: (node.velocity.x + fx) * SIMULATION_CONFIG.damping * SIMULATION_CONFIG.velocityDecay,
      y: (node.velocity.y + fy) * SIMULATION_CONFIG.damping * SIMULATION_CONFIG.velocityDecay,
    };

    // Update position
    const newPosition = {
      x: Math.max(50, Math.min(width - 50, node.position.x + newVelocity.x)),
      y: Math.max(50, Math.min(height - 50, node.position.y + newVelocity.y)),
    };

    return {
      ...node,
      position: newPosition,
      velocity: newVelocity,
    };
  });
}

/**
 * Hook for managing cross-reference graph
 */
export function useCrossRefGraph(options: UseCrossRefGraphOptions = {}): UseCrossRefGraphReturn {
  const {
    initialFilters = {},
    initialSettings = {},
    documentId,
    comparisonDocumentId,
  } = options;

  // State
  const [graphData, setGraphData] = useState<CrossRefGraphData | null>(null);
  const [nodesWithPositions, setNodesWithPositions] = useState<CrossRefNodeWithPosition[]>([]);
  const [filters, setFiltersState] = useState<GraphFilterOptions>({
    ...DEFAULT_FILTER_OPTIONS,
    ...initialFilters,
  });
  const [settings, setSettingsState] = useState<GraphVisualizationSettings>({
    ...DEFAULT_GRAPH_SETTINGS,
    ...initialSettings,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState<Position2D>({ x: 0, y: 0 });

  // Animation ref
  const animationRef = useRef<number | null>(null);
  const simulationIterations = useRef(0);

  // Load graph data
  const loadGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use mock data
      setGraphData(mockGraphData);

      // Initialize positions
      const positioned = initializePositions(mockGraphData.nodes, 800, 600);
      setNodesWithPositions(positioned);
      simulationIterations.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, comparisonDocumentId]);

  // Load on mount
  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Run force simulation
  useEffect(() => {
    if (!settings.enablePhysics || nodesWithPositions.length === 0) return;

    const animate = () => {
      if (simulationIterations.current >= SIMULATION_CONFIG.maxIterations) {
        return;
      }

      setNodesWithPositions(nodes => {
        const filtered = nodes.filter(n => {
          if (filters.showOnlyModified && !n.isModified) return false;
          if (filters.showOnlyHighImpact && n.impactSeverity !== 'high' && n.impactSeverity !== 'critical') return false;
          if (!filters.nodeTypes.includes(n.type)) return false;
          if (!filters.categories.includes(n.category)) return false;
          if (n.incomingCount + n.outgoingCount < filters.minConnections) return false;
          if (filters.searchQuery && !n.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
          return true;
        });

        return applyForces(nodes, graphData?.links || [], 800, 600);
      });

      simulationIterations.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [settings.enablePhysics, graphData?.links, filters, nodesWithPositions.length]);

  // Filter nodes and links
  const { filteredNodes, filteredLinks } = useMemo(() => {
    if (!graphData) return { filteredNodes: [], filteredLinks: [] };

    const nodeIds = new Set<string>();

    const filtered = nodesWithPositions.filter(node => {
      if (filters.showOnlyModified && !node.isModified) return false;
      if (filters.showOnlyHighImpact && node.impactSeverity !== 'high' && node.impactSeverity !== 'critical') return false;
      if (!filters.nodeTypes.includes(node.type)) return false;
      if (!filters.categories.includes(node.category)) return false;
      if (node.incomingCount + node.outgoingCount < filters.minConnections) return false;
      if (filters.searchQuery && !node.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      nodeIds.add(node.id);
      return true;
    });

    const links = graphData.links.filter(link => {
      if (!filters.linkTypes.includes(link.type)) return false;
      if (!nodeIds.has(link.sourceId) || !nodeIds.has(link.targetId)) return false;
      return true;
    });

    return { filteredNodes: filtered, filteredLinks: links };
  }, [graphData, nodesWithPositions, filters]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<GraphFilterOptions>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    simulationIterations.current = 0;
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTER_OPTIONS);
    simulationIterations.current = 0;
  }, []);

  // Update settings
  const setSettings = useCallback((newSettings: Partial<GraphVisualizationSettings>) => {
    setSettingsState(prev => ({ ...prev, ...newSettings }));
    if (newSettings.enablePhysics) {
      simulationIterations.current = 0;
    }
  }, []);

  // Select node
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);

    if (nodeId) {
      const analysis = generateMockImpactAnalysis(nodeId);
      setImpactAnalysis(analysis);

      // Highlight impacted nodes
      const highlighted = new Set<string>([nodeId]);
      analysis.directImpacts.forEach(i => highlighted.add(i.nodeId));
      analysis.cascadingImpacts.forEach(i => highlighted.add(i.nodeId));
      setHighlightedNodeIds(highlighted);
    } else {
      setImpactAnalysis(null);
      setHighlightedNodeIds(new Set());
    }

    setNodesWithPositions(nodes =>
      nodes.map(n => ({
        ...n,
        isSelected: n.id === nodeId,
        isHighlighted: nodeId ? highlightedNodeIds.has(n.id) : false,
      }))
    );
  }, [highlightedNodeIds]);

  // Set hovered node
  const setHoveredNode = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);

    if (nodeId && settings.showRippleEffects) {
      // Get connected nodes for quick highlight
      const links = getLinksForNode(nodeId);
      const connectedIds = new Set<string>();
      links.incoming.forEach(l => connectedIds.add(l.sourceId));
      links.outgoing.forEach(l => connectedIds.add(l.targetId));

      setNodesWithPositions(nodes =>
        nodes.map(n => ({
          ...n,
          isHovered: n.id === nodeId,
          isHighlighted: selectedNodeId ? highlightedNodeIds.has(n.id) : connectedIds.has(n.id),
        }))
      );
    } else {
      setNodesWithPositions(nodes =>
        nodes.map(n => ({
          ...n,
          isHovered: false,
          isHighlighted: selectedNodeId ? highlightedNodeIds.has(n.id) : false,
        }))
      );
    }
  }, [settings.showRippleEffects, selectedNodeId, highlightedNodeIds]);

  // Reset view
  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Get node color based on settings
  const getNodeColor = useCallback((node: CrossRefNode): string => {
    switch (settings.colorScheme) {
      case 'type':
        return NODE_TYPE_COLORS[node.type];
      case 'category':
        return CATEGORY_COLORS[node.category];
      case 'impact':
        return IMPACT_COLORS[node.impactSeverity];
      case 'modifications':
        return node.isModified ? '#f97316' : '#6b7280';
      default:
        return NODE_TYPE_COLORS[node.type];
    }
  }, [settings.colorScheme]);

  // Get link color
  const getLinkColor = useCallback((link: CrossRefLink): string => {
    if (link.isModified) return '#f97316';
    return LINK_TYPE_COLORS[link.type];
  }, []);

  // Trigger ripple animation
  const triggerRipple = useCallback((nodeId: string) => {
    const analysis = generateMockImpactAnalysis(nodeId);

    // Animate ripple through impacted nodes
    const allImpacted = [
      ...analysis.directImpacts.map(i => ({ ...i, delay: 0 })),
      ...analysis.cascadingImpacts.map(i => ({ ...i, delay: i.depth * 200 })),
    ];

    allImpacted.forEach(impact => {
      setTimeout(() => {
        setNodesWithPositions(nodes =>
          nodes.map(n =>
            n.id === impact.nodeId
              ? { ...n, rippleProgress: 0 }
              : n
          )
        );

        // Animate ripple
        let progress = 0;
        const animate = () => {
          progress += 0.05;
          if (progress <= 1) {
            setNodesWithPositions(nodes =>
              nodes.map(n =>
                n.id === impact.nodeId
                  ? { ...n, rippleProgress: progress }
                  : n
              )
            );
            requestAnimationFrame(animate);
          } else {
            setNodesWithPositions(nodes =>
              nodes.map(n =>
                n.id === impact.nodeId
                  ? { ...n, rippleProgress: undefined }
                  : n
              )
            );
          }
        };
        requestAnimationFrame(animate);
      }, impact.delay);
    });
  }, []);

  // Update node position (for dragging)
  const updateNodePosition = useCallback((nodeId: string, position: Position2D) => {
    setNodesWithPositions(nodes =>
      nodes.map(n =>
        n.id === nodeId
          ? { ...n, position, fx: position.x, fy: position.y }
          : n
      )
    );
  }, []);

  // Toggle node pin
  const toggleNodePin = useCallback((nodeId: string) => {
    setNodesWithPositions(nodes =>
      nodes.map(n => {
        if (n.id !== nodeId) return n;
        if (n.fx !== undefined) {
          return { ...n, fx: undefined, fy: undefined };
        } else {
          return { ...n, fx: n.position.x, fy: n.position.y };
        }
      })
    );
  }, []);

  return {
    graphData,
    nodesWithPositions: filteredNodes,
    filteredLinks,
    filters,
    setFilters,
    resetFilters,
    settings,
    setSettings,
    selectedNodeId,
    selectNode,
    hoveredNodeId,
    setHoveredNode,
    impactAnalysis,
    highlightedNodeIds,
    isLoading,
    error,
    refresh: loadGraph,
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset,
    resetView,
    getNodeColor,
    getLinkColor,
    triggerRipple,
    updateNodePosition,
    toggleNodePin,
  };
}
