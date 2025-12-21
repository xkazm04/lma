'use client';

/**
 * Term Dependency Graph
 *
 * Models loan terms as a directed graph where edges represent dependencies.
 * This enables:
 * - Highlighting downstream impacts when a term changes
 * - Auto-suggesting related terms during negotiation
 * - Warning about cascading effects before accepting proposals
 */

import type { NegotiationTerm, CategoryWithTerms } from './types';

// Dependency types that can exist between terms
export type DependencyType =
  | 'derives_from'      // Value is calculated from dependent term
  | 'constrained_by'    // Value range is limited by dependent term
  | 'triggers'          // Changes trigger recalculation/review of dependent
  | 'requires'          // This term requires the dependent term to be set
  | 'affects_risk'      // Changes affect the risk profile related to dependent
  | 'covenant_linked';  // Covenant terms that are mathematically linked

// Strength of dependency relationship
export type DependencyStrength = 'strong' | 'moderate' | 'weak';

// A single dependency edge in the graph
export interface TermDependency {
  sourceTermId: string;       // Term that affects another
  targetTermId: string;       // Term that is affected
  dependencyType: DependencyType;
  strength: DependencyStrength;
  description: string;        // Human-readable explanation
  impactFormula?: string;     // Optional formula showing mathematical relationship
}

// Node in the dependency graph (term with its connections)
export interface TermNode {
  termId: string;
  termKey: string;
  termLabel: string;
  categoryId: string;
  // Outgoing edges (terms this term affects)
  dependents: TermDependency[];
  // Incoming edges (terms that affect this term)
  dependencies: TermDependency[];
}

// Impact analysis result when a term changes
export interface ImpactAnalysis {
  changedTermId: string;
  changedTermLabel: string;
  directImpacts: ImpactedTerm[];    // Terms directly dependent
  cascadingImpacts: ImpactedTerm[]; // Terms affected through chain
  totalImpactedTerms: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  suggestions: string[];
}

export interface ImpactedTerm {
  termId: string;
  termKey: string;
  termLabel: string;
  categoryId: string;
  categoryName?: string;
  dependencyType: DependencyType;
  strength: DependencyStrength;
  impactDescription: string;
  chainDepth: number;  // 1 = direct, 2+ = cascading
}

// The complete dependency graph
export interface TermDependencyGraph {
  nodes: Map<string, TermNode>;
  edges: TermDependency[];
}

/**
 * Standard loan term dependencies based on financial relationships
 * These represent common dependencies in loan documentation
 */
export const STANDARD_TERM_DEPENDENCIES: TermDependency[] = [
  // Credit Rating affects Margin (pricing grid)
  {
    sourceTermId: 'credit_rating',
    targetTermId: 'margin',
    dependencyType: 'derives_from',
    strength: 'strong',
    description: 'Interest margin is determined by the pricing grid based on credit rating',
    impactFormula: 'Margin = BaseMargin + RatingAdjustment(CreditRating)'
  },
  // Leverage Ratio affects Margin
  {
    sourceTermId: 'leverage_ratio',
    targetTermId: 'margin',
    dependencyType: 'derives_from',
    strength: 'strong',
    description: 'Interest margin steps up/down based on leverage ratio thresholds',
    impactFormula: 'Margin varies by 25-50bps per leverage tier'
  },
  // DSCR covenant affects Facility Amount
  {
    sourceTermId: 'interest_coverage',
    targetTermId: 'facility_amount',
    dependencyType: 'constrained_by',
    strength: 'strong',
    description: 'Facility amount may be constrained to maintain minimum debt service coverage',
    impactFormula: 'MaxFacility = EBITDA / MinDSCR × DebtService'
  },
  // Facility Amount affects Commitment Fee (total commitment basis)
  {
    sourceTermId: 'facility_amount',
    targetTermId: 'commitment_fee',
    dependencyType: 'affects_risk',
    strength: 'moderate',
    description: 'Larger facilities may warrant different commitment fee structures'
  },
  // Maturity Date affects Margin (term premium)
  {
    sourceTermId: 'maturity_date',
    targetTermId: 'margin',
    dependencyType: 'affects_risk',
    strength: 'moderate',
    description: 'Longer maturities typically command higher margins due to duration risk'
  },
  // Leverage Ratio and Interest Coverage are often mathematically linked
  {
    sourceTermId: 'leverage_ratio',
    targetTermId: 'interest_coverage',
    dependencyType: 'covenant_linked',
    strength: 'strong',
    description: 'Higher leverage typically means lower interest coverage capacity',
    impactFormula: 'InterestCoverage ≈ EBITDA / (Debt × InterestRate) inversely related to leverage'
  },
  // Amortization affects Facility Amount over time
  {
    sourceTermId: 'amortization',
    targetTermId: 'facility_amount',
    dependencyType: 'triggers',
    strength: 'moderate',
    description: 'Amortization schedule determines how facility amount reduces over time'
  },
  // Facility Amount affects Leverage Ratio covenant levels
  {
    sourceTermId: 'facility_amount',
    targetTermId: 'leverage_ratio',
    dependencyType: 'constrained_by',
    strength: 'strong',
    description: 'Higher facility amounts require proportionally higher EBITDA to maintain leverage'
  },
  // Margin affects total interest expense, which affects Interest Coverage
  {
    sourceTermId: 'margin',
    targetTermId: 'interest_coverage',
    dependencyType: 'affects_risk',
    strength: 'moderate',
    description: 'Higher margins increase interest expense, reducing coverage ratios'
  }
];

/**
 * Build a dependency graph from categories/terms and dependency definitions
 */
export function buildDependencyGraph(
  categories: CategoryWithTerms[],
  dependencies: TermDependency[] = STANDARD_TERM_DEPENDENCIES
): TermDependencyGraph {
  const nodes = new Map<string, TermNode>();
  const edges: TermDependency[] = [];

  // Create nodes for all terms
  categories.forEach(category => {
    category.terms.forEach(term => {
      nodes.set(term.id, {
        termId: term.id,
        termKey: term.term_key,
        termLabel: term.term_label,
        categoryId: term.category_id,
        dependents: [],
        dependencies: []
      });
    });
  });

  // Map term keys to term IDs for dependency matching
  const termKeyToId = new Map<string, string>();
  categories.forEach(category => {
    category.terms.forEach(term => {
      termKeyToId.set(term.term_key, term.id);
    });
  });

  // Add edges based on dependency definitions
  dependencies.forEach(dep => {
    // Match by term_key since standard dependencies use keys
    const sourceId = termKeyToId.get(dep.sourceTermId) || dep.sourceTermId;
    const targetId = termKeyToId.get(dep.targetTermId) || dep.targetTermId;

    const sourceNode = nodes.get(sourceId);
    const targetNode = nodes.get(targetId);

    if (sourceNode && targetNode) {
      const edge: TermDependency = {
        ...dep,
        sourceTermId: sourceId,
        targetTermId: targetId
      };

      edges.push(edge);
      sourceNode.dependents.push(edge);
      targetNode.dependencies.push(edge);
    }
  });

  return { nodes, edges };
}

/**
 * Get all terms that depend on a given term (downstream impacts)
 */
export function getDependentTerms(
  graph: TermDependencyGraph,
  termId: string
): TermNode[] {
  const node = graph.nodes.get(termId);
  if (!node) return [];

  return node.dependents
    .map(dep => graph.nodes.get(dep.targetTermId))
    .filter((n): n is TermNode => n !== undefined);
}

/**
 * Get all terms that a given term depends on (upstream dependencies)
 */
export function getTermDependencies(
  graph: TermDependencyGraph,
  termId: string
): TermNode[] {
  const node = graph.nodes.get(termId);
  if (!node) return [];

  return node.dependencies
    .map(dep => graph.nodes.get(dep.sourceTermId))
    .filter((n): n is TermNode => n !== undefined);
}

/**
 * Perform impact analysis when a term changes
 * Uses BFS to find all affected terms and their chain depth
 */
export function analyzeTermImpact(
  graph: TermDependencyGraph,
  categories: CategoryWithTerms[],
  termId: string
): ImpactAnalysis {
  const startNode = graph.nodes.get(termId);
  if (!startNode) {
    return {
      changedTermId: termId,
      changedTermLabel: 'Unknown Term',
      directImpacts: [],
      cascadingImpacts: [],
      totalImpactedTerms: 0,
      riskLevel: 'low',
      warnings: [],
      suggestions: []
    };
  }

  // Create category lookup
  const categoryMap = new Map<string, string>();
  categories.forEach(cat => {
    cat.terms.forEach(term => {
      categoryMap.set(term.id, cat.name);
    });
  });

  const directImpacts: ImpactedTerm[] = [];
  const cascadingImpacts: ImpactedTerm[] = [];
  const visited = new Set<string>();
  const queue: Array<{ termId: string; depth: number; parentDep: TermDependency | null }> = [];

  // Initialize BFS with direct dependents
  startNode.dependents.forEach(dep => {
    queue.push({ termId: dep.targetTermId, depth: 1, parentDep: dep });
  });
  visited.add(termId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.termId)) continue;
    visited.add(current.termId);

    const node = graph.nodes.get(current.termId);
    if (!node || !current.parentDep) continue;

    const impactedTerm: ImpactedTerm = {
      termId: node.termId,
      termKey: node.termKey,
      termLabel: node.termLabel,
      categoryId: node.categoryId,
      categoryName: categoryMap.get(node.termId),
      dependencyType: current.parentDep.dependencyType,
      strength: current.parentDep.strength,
      impactDescription: current.parentDep.description,
      chainDepth: current.depth
    };

    if (current.depth === 1) {
      directImpacts.push(impactedTerm);
    } else {
      cascadingImpacts.push(impactedTerm);
    }

    // Add dependents to queue for cascading analysis
    node.dependents.forEach(dep => {
      if (!visited.has(dep.targetTermId)) {
        queue.push({ termId: dep.targetTermId, depth: current.depth + 1, parentDep: dep });
      }
    });
  }

  // Calculate risk level based on impact count and strength
  const strongImpacts = [...directImpacts, ...cascadingImpacts].filter(
    i => i.strength === 'strong'
  ).length;
  const totalImpacts = directImpacts.length + cascadingImpacts.length;

  let riskLevel: ImpactAnalysis['riskLevel'] = 'low';
  if (totalImpacts >= 5 || strongImpacts >= 3) {
    riskLevel = 'critical';
  } else if (totalImpacts >= 3 || strongImpacts >= 2) {
    riskLevel = 'high';
  } else if (totalImpacts >= 2 || strongImpacts >= 1) {
    riskLevel = 'medium';
  }

  // Generate warnings and suggestions
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (strongImpacts > 0) {
    warnings.push(`${strongImpacts} term(s) have strong dependencies that will be significantly affected`);
  }

  if (cascadingImpacts.length > 0) {
    warnings.push(`Changes will cascade to ${cascadingImpacts.length} additional term(s) indirectly`);
  }

  const covenantImpacts = [...directImpacts, ...cascadingImpacts].filter(
    i => i.dependencyType === 'covenant_linked'
  );
  if (covenantImpacts.length > 0) {
    warnings.push(`${covenantImpacts.length} linked covenant(s) may need adjustment`);
    suggestions.push('Review all financial covenants together to ensure consistency');
  }

  const pricingImpacts = [...directImpacts, ...cascadingImpacts].filter(
    i => i.termKey === 'margin' || i.termKey === 'commitment_fee'
  );
  if (pricingImpacts.length > 0) {
    suggestions.push('Consider the impact on overall pricing and economics');
  }

  if (totalImpacts > 3) {
    suggestions.push('Consider discussing all impacted terms together with counterparties');
  }

  return {
    changedTermId: termId,
    changedTermLabel: startNode.termLabel,
    directImpacts,
    cascadingImpacts,
    totalImpactedTerms: totalImpacts,
    riskLevel,
    warnings,
    suggestions
  };
}

/**
 * Get suggested related terms to discuss during negotiation
 */
export function getSuggestedRelatedTerms(
  graph: TermDependencyGraph,
  termId: string,
  maxSuggestions: number = 5
): Array<{ term: TermNode; reason: string; priority: number }> {
  const node = graph.nodes.get(termId);
  if (!node) return [];

  const suggestions: Array<{ term: TermNode; reason: string; priority: number }> = [];

  // Add direct dependents (highest priority)
  node.dependents.forEach(dep => {
    const targetNode = graph.nodes.get(dep.targetTermId);
    if (targetNode) {
      const priority = dep.strength === 'strong' ? 3 : dep.strength === 'moderate' ? 2 : 1;
      suggestions.push({
        term: targetNode,
        reason: `Affected by changes to ${node.termLabel}: ${dep.description}`,
        priority
      });
    }
  });

  // Add dependencies (what this term depends on)
  node.dependencies.forEach(dep => {
    const sourceNode = graph.nodes.get(dep.sourceTermId);
    if (sourceNode) {
      const priority = dep.strength === 'strong' ? 2.5 : dep.strength === 'moderate' ? 1.5 : 0.5;
      suggestions.push({
        term: sourceNode,
        reason: `${node.termLabel} is derived from/constrained by this term`,
        priority
      });
    }
  });

  // Sort by priority and limit
  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxSuggestions);
}

/**
 * Check if changing a term would create potential issues
 */
export function validateTermChange(
  graph: TermDependencyGraph,
  categories: CategoryWithTerms[],
  termId: string,
  newValue: unknown
): { isValid: boolean; warnings: string[]; blockers: string[] } {
  const impact = analyzeTermImpact(graph, categories, termId);
  const warnings: string[] = [...impact.warnings];
  const blockers: string[] = [];

  // Find locked dependent terms
  const allTerms = categories.flatMap(c => c.terms);
  const termMap = new Map(allTerms.map(t => [t.id, t]));

  impact.directImpacts.forEach(impacted => {
    const term = termMap.get(impacted.termId);
    if (term?.is_locked) {
      blockers.push(`Cannot change: "${impacted.termLabel}" is locked and depends on this term`);
    }
    if (term?.negotiation_status === 'agreed') {
      warnings.push(`"${impacted.termLabel}" is already agreed and may need re-negotiation`);
    }
  });

  return {
    isValid: blockers.length === 0,
    warnings,
    blockers
  };
}

/**
 * Get dependency strength color for UI
 */
export function getDependencyStrengthColor(strength: DependencyStrength): string {
  switch (strength) {
    case 'strong':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'moderate':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'weak':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-zinc-600 bg-zinc-50 border-zinc-200';
  }
}

/**
 * Get dependency type icon name (for lucide-react)
 */
export function getDependencyTypeIcon(type: DependencyType): string {
  switch (type) {
    case 'derives_from':
      return 'Calculator';
    case 'constrained_by':
      return 'Lock';
    case 'triggers':
      return 'Zap';
    case 'requires':
      return 'Link';
    case 'affects_risk':
      return 'AlertTriangle';
    case 'covenant_linked':
      return 'GitBranch';
    default:
      return 'ArrowRight';
  }
}

/**
 * Get human-readable dependency type label
 */
export function getDependencyTypeLabel(type: DependencyType): string {
  switch (type) {
    case 'derives_from':
      return 'Derived From';
    case 'constrained_by':
      return 'Constrained By';
    case 'triggers':
      return 'Triggers';
    case 'requires':
      return 'Requires';
    case 'affects_risk':
      return 'Affects Risk';
    case 'covenant_linked':
      return 'Covenant Linked';
    default:
      return 'Related';
  }
}
