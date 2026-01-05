// Cross-Reference Graph Types for Obsidian-style visualization

/**
 * Node types in the cross-reference graph
 */
export type CrossRefNodeType =
  | 'definition'      // Defined terms like "EBITDA", "Material Adverse Effect"
  | 'clause'          // Document clauses/sections
  | 'covenant'        // Financial or operational covenants
  | 'pricing'         // Pricing grid entries
  | 'representation'  // Representations and warranties
  | 'condition'       // Conditions precedent
  | 'event';          // Events of default

/**
 * Categories for grouping nodes visually
 */
export type CrossRefCategory =
  | 'definitions'
  | 'financial_terms'
  | 'covenants'
  | 'conditions'
  | 'representations'
  | 'events_default'
  | 'miscellaneous';

/**
 * Link types between nodes
 */
export type CrossRefLinkType =
  | 'defines'         // A definition defines a term used elsewhere
  | 'references'      // One clause references another
  | 'depends_on'      // Value depends on another value (e.g., pricing depends on leverage)
  | 'triggers'        // One condition triggers another
  | 'constrains'      // One term constrains another
  | 'modifies';       // An amendment modifies a term

/**
 * Impact severity when a node changes
 */
export type ImpactSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Represents a node in the cross-reference graph
 */
export interface CrossRefNode {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Node type */
  type: CrossRefNodeType;
  /** Category for grouping */
  category: CrossRefCategory;
  /** Full text/value of the term */
  content: string;
  /** Location in the document */
  location: {
    section?: string;
    page?: number;
    clauseRef?: string;
  };
  /** Current value (for definitions/covenants) */
  currentValue?: string;
  /** Previous value (if changed) */
  previousValue?: string;
  /** Whether this node has been modified */
  isModified: boolean;
  /** Number of incoming references */
  incomingCount: number;
  /** Number of outgoing references */
  outgoingCount: number;
  /** Impact severity if this node changes */
  impactSeverity: ImpactSeverity;
  /** IDs of nodes that would be impacted by changes to this node */
  impactedNodeIds: string[];
  /** Color for visualization (computed based on type) */
  color?: string;
  /** Size multiplier based on importance */
  size?: number;
}

/**
 * Represents a link between two nodes
 */
export interface CrossRefLink {
  /** Unique identifier */
  id: string;
  /** Source node ID */
  sourceId: string;
  /** Target node ID */
  targetId: string;
  /** Type of relationship */
  type: CrossRefLinkType;
  /** Strength of the relationship (0-1) */
  strength: number;
  /** Description of the relationship */
  description: string;
  /** Whether this link represents a modification/change */
  isModified: boolean;
  /** Color for visualization */
  color?: string;
  /** Width for visualization */
  width?: number;
}

/**
 * Position in 2D space for visualization
 */
export interface Position2D {
  x: number;
  y: number;
}

/**
 * Extended node with position for visualization
 */
export interface CrossRefNodeWithPosition extends CrossRefNode {
  position: Position2D;
  velocity: Position2D;
  /** Fixed position (if pinned by user) */
  fx?: number;
  fy?: number;
  /** Whether node is currently selected */
  isSelected: boolean;
  /** Whether node is currently hovered */
  isHovered: boolean;
  /** Whether node is highlighted (part of impact chain) */
  isHighlighted: boolean;
  /** Animation state for ripple effect */
  rippleProgress?: number;
}

/**
 * Impact analysis result for a node change
 */
export interface ImpactAnalysis {
  /** The source node that was changed */
  sourceNodeId: string;
  /** All directly impacted nodes (first-degree connections) */
  directImpacts: {
    nodeId: string;
    nodeName: string;
    impactType: CrossRefLinkType;
    severity: ImpactSeverity;
    description: string;
  }[];
  /** Cascading impacts (second-degree and beyond) */
  cascadingImpacts: {
    nodeId: string;
    nodeName: string;
    pathFromSource: string[];
    depth: number;
    severity: ImpactSeverity;
    description: string;
  }[];
  /** Total impact score (0-100) */
  totalImpactScore: number;
  /** Summary of the impact analysis */
  summary: string;
  /** Recommended actions */
  recommendations: string[];
}

/**
 * Graph statistics
 */
export interface GraphStats {
  /** Total number of nodes */
  totalNodes: number;
  /** Nodes by type */
  nodesByType: Record<CrossRefNodeType, number>;
  /** Total number of links */
  totalLinks: number;
  /** Links by type */
  linksByType: Record<CrossRefLinkType, number>;
  /** Number of modified nodes */
  modifiedNodes: number;
  /** Number of high-impact nodes */
  highImpactNodes: number;
  /** Average connections per node */
  avgConnections: number;
  /** Most connected node */
  mostConnectedNode: {
    id: string;
    name: string;
    connections: number;
  } | null;
}

/**
 * Complete cross-reference graph data
 */
export interface CrossRefGraphData {
  /** Document ID this graph is for */
  documentId: string;
  /** Document name */
  documentName: string;
  /** Comparison document ID (if comparing) */
  comparisonDocumentId?: string;
  /** Comparison document name */
  comparisonDocumentName?: string;
  /** All nodes in the graph */
  nodes: CrossRefNode[];
  /** All links in the graph */
  links: CrossRefLink[];
  /** Graph statistics */
  stats: GraphStats;
  /** When the graph was generated */
  generatedAt: string;
}

/**
 * Filter options for the graph view
 */
export interface GraphFilterOptions {
  /** Show only nodes of these types */
  nodeTypes: CrossRefNodeType[];
  /** Show only these categories */
  categories: CrossRefCategory[];
  /** Show only links of these types */
  linkTypes: CrossRefLinkType[];
  /** Minimum node connections to show */
  minConnections: number;
  /** Show only modified nodes */
  showOnlyModified: boolean;
  /** Show only high-impact nodes */
  showOnlyHighImpact: boolean;
  /** Search query */
  searchQuery: string;
}

/**
 * Visualization settings for the graph
 */
export interface GraphVisualizationSettings {
  /** Show node labels */
  showLabels: boolean;
  /** Show link labels */
  showLinkLabels: boolean;
  /** Enable physics simulation */
  enablePhysics: boolean;
  /** Animation speed (0-1) */
  animationSpeed: number;
  /** Zoom level */
  zoomLevel: number;
  /** Node spacing */
  nodeSpacing: number;
  /** Color scheme */
  colorScheme: 'type' | 'category' | 'impact' | 'modifications';
  /** Show ripple effects on hover */
  showRippleEffects: boolean;
  /** Cluster by category */
  clusterByCategory: boolean;
}

/**
 * Default visualization settings
 */
export const DEFAULT_GRAPH_SETTINGS: GraphVisualizationSettings = {
  showLabels: true,
  showLinkLabels: false,
  enablePhysics: true,
  animationSpeed: 0.5,
  zoomLevel: 1,
  nodeSpacing: 100,
  colorScheme: 'type',
  showRippleEffects: true,
  clusterByCategory: false,
};

/**
 * Default filter options
 */
export const DEFAULT_FILTER_OPTIONS: GraphFilterOptions = {
  nodeTypes: ['definition', 'clause', 'covenant', 'pricing', 'representation', 'condition', 'event'],
  categories: ['definitions', 'financial_terms', 'covenants', 'conditions', 'representations', 'events_default', 'miscellaneous'],
  linkTypes: ['defines', 'references', 'depends_on', 'triggers', 'constrains', 'modifies'],
  minConnections: 0,
  showOnlyModified: false,
  showOnlyHighImpact: false,
  searchQuery: '',
};

/**
 * Color palette for node types
 */
export const NODE_TYPE_COLORS: Record<CrossRefNodeType, string> = {
  definition: '#8b5cf6',      // violet-500
  clause: '#3b82f6',          // blue-500
  covenant: '#f97316',        // orange-500
  pricing: '#22c55e',         // green-500
  representation: '#ec4899',  // pink-500
  condition: '#06b6d4',       // cyan-500
  event: '#ef4444',           // red-500
};

/**
 * Color palette for categories
 */
export const CATEGORY_COLORS: Record<CrossRefCategory, string> = {
  definitions: '#8b5cf6',     // violet-500
  financial_terms: '#22c55e', // green-500
  covenants: '#f97316',       // orange-500
  conditions: '#06b6d4',      // cyan-500
  representations: '#ec4899', // pink-500
  events_default: '#ef4444',  // red-500
  miscellaneous: '#6b7280',   // gray-500
};

/**
 * Color palette for impact severity
 */
export const IMPACT_COLORS: Record<ImpactSeverity, string> = {
  none: '#6b7280',      // gray-500
  low: '#22c55e',       // green-500
  medium: '#eab308',    // yellow-500
  high: '#f97316',      // orange-500
  critical: '#ef4444',  // red-500
};

/**
 * Color palette for link types
 */
export const LINK_TYPE_COLORS: Record<CrossRefLinkType, string> = {
  defines: '#8b5cf6',     // violet-500
  references: '#6b7280',  // gray-500
  depends_on: '#3b82f6',  // blue-500
  triggers: '#f97316',    // orange-500
  constrains: '#ef4444',  // red-500
  modifies: '#22c55e',    // green-500
};

/**
 * Labels for node types
 */
export const NODE_TYPE_LABELS: Record<CrossRefNodeType, string> = {
  definition: 'Definition',
  clause: 'Clause',
  covenant: 'Covenant',
  pricing: 'Pricing',
  representation: 'Representation',
  condition: 'Condition',
  event: 'Event',
};

/**
 * Labels for categories
 */
export const CATEGORY_LABELS: Record<CrossRefCategory, string> = {
  definitions: 'Definitions',
  financial_terms: 'Financial Terms',
  covenants: 'Covenants',
  conditions: 'Conditions Precedent',
  representations: 'Representations & Warranties',
  events_default: 'Events of Default',
  miscellaneous: 'Miscellaneous',
};

/**
 * Labels for link types
 */
export const LINK_TYPE_LABELS: Record<CrossRefLinkType, string> = {
  defines: 'Defines',
  references: 'References',
  depends_on: 'Depends On',
  triggers: 'Triggers',
  constrains: 'Constrains',
  modifies: 'Modifies',
};
